"""FastAPI routes for the ReviewAI code review API.

Provides three endpoints:
- POST /api/v1/review/snippet   — review a pasted code snippet via SSE stream
- POST /api/v1/review/github-pr — review a GitHub Pull Request via SSE stream
- GET  /api/v1/review/{id}      — fetch a completed review result by ID
"""

import json
import logging
import time
import uuid
from collections import defaultdict

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.agents.graph import build_graph
from app.models.review_request import PRReviewRequest, SnippetReviewRequest
from app.models.review_response import Category, CategorySummary, Finding, ReviewResult, SuggestedFix
from app.services.github_service import fetch_pr_diff
from app.services.review_store import get_review, save_review

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _parse_finding(raw: dict) -> Finding | None:
    """Convert a raw agent-output dict to a validated Finding model.

    Args:
        raw: Raw dict from an agent node output.

    Returns:
        A ``Finding`` instance, or ``None`` if the dict is invalid.
    """
    try:
        suggested_fix = None
        if raw.get("suggested_fix"):
            sf = raw["suggested_fix"]
            suggested_fix = SuggestedFix(
                original_code=str(sf.get("original_code", "")),
                fixed_code=str(sf.get("fixed_code", "")),
                explanation=str(sf.get("explanation", "")),
            )
        return Finding(
            id=str(raw.get("id", "UNKNOWN-001")),
            category=raw.get("category", "bug"),
            severity=raw.get("severity", "info"),
            title=str(raw.get("title", "Unnamed Finding")),
            description=str(raw.get("description", "")),
            line_reference=str(raw.get("line_reference", "General")),
            suggested_fix=suggested_fix,
            confidence=int(raw.get("confidence", 50)),
        )
    except Exception:
        logger.warning("Could not parse finding: %s", raw)
        return None


def _build_review_result(
    *,
    review_id: str,
    detected_language: str,
    supervisor_output: dict,
    start_time: float,
) -> ReviewResult:
    """Assemble a ``ReviewResult`` from the supervisor node's output dict.

    Args:
        review_id: The UUID for this review session.
        detected_language: Language detected during preprocessing.
        supervisor_output: The dict returned by the supervisor node.
        start_time: Unix timestamp when the review was started.

    Returns:
        A fully populated ``ReviewResult`` Pydantic model.
    """
    final_findings_raw: list[dict] = supervisor_output.get("final_findings", [])
    category_scores: dict[str, int] = supervisor_output.get(
        "category_scores", {"bug": 100, "security": 100, "performance": 100, "style": 100}
    )

    # Build validated Finding objects
    findings: list[Finding] = []
    for raw in final_findings_raw:
        finding = _parse_finding(raw)
        if finding:
            findings.append(finding)

    # Count per-category findings and critical counts
    cat_finding_count: dict[str, int] = defaultdict(int)
    cat_critical_count: dict[str, int] = defaultdict(int)
    for f in findings:
        cat_finding_count[f.category.value] += 1
        if f.severity.value == "critical":
            cat_critical_count[f.category.value] += 1

    category_summaries: list[CategorySummary] = [
        CategorySummary(
            category=cat,                                   # type: ignore[arg-type]
            score=category_scores.get(cat, 100),
            finding_count=cat_finding_count.get(cat, 0),
            critical_count=cat_critical_count.get(cat, 0),
        )
        for cat in ("bug", "security", "performance", "style")
    ]

    return ReviewResult(
        review_id=review_id,
        language=detected_language,
        overall_score=supervisor_output.get("overall_score", 0),
        overall_verdict=supervisor_output.get("overall_verdict", "Review complete."),
        category_summaries=category_summaries,
        findings=findings,
        positive_aspects=supervisor_output.get("positive_aspects", []),
        top_recommendations=supervisor_output.get("top_recommendations", []),
        review_duration_ms=int((time.time() - start_time) * 1000),
    )


# ---------------------------------------------------------------------------
# Core SSE generator
# ---------------------------------------------------------------------------


async def review_generator(initial_state: dict, start_time: float, review_id: str):
    """Async generator that runs the LangGraph pipeline and yields SSE events.

    Args:
        initial_state: The starting state dict (review_id, code, language, context).
        start_time: Unix timestamp for duration calculation.
        review_id: UUID for this review session.

    Yields:
        SSE event dicts with ``event`` and ``data`` keys.
    """
    graph = build_graph()

    yield {
        "event": "progress",
        "data": json.dumps({
            "stage": "preprocessing",
            "message": "Detecting language and preparing code...",
        }),
    }

    supervisor_output: dict | None = None
    detected_language: str = initial_state.get("language", "auto")

    try:
        async for event in graph.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                if node_name == "preprocessor":
                    # Capture the detected language from the preprocessor
                    if node_output.get("language"):
                        detected_language = node_output["language"]
                    
                    is_fast = initial_state.get("review_mode") == "fast"
                    selected_cats = initial_state.get("categories") or ["bug", "security", "performance", "style"]
                    stage_msg = (
                        f"Running fast review model on {detected_language} code..."
                        if is_fast
                        else f"Running {len(selected_cats)} specialist agents in parallel on {detected_language} code..."
                    )
                    yield {
                        "event": "progress",
                        "data": json.dumps({
                            "stage": "analyzing",
                            "message": stage_msg,
                        }),
                    }

                    # In deep mode, immediately complete skipped agents so the frontend doesn't spin
                    if not is_fast:
                        all_cats = {"bug", "security", "performance", "style"}
                        skipped_cats = all_cats - set(selected_cats)
                        agent_name_map = {
                            "bug": "bug_detector",
                            "security": "security_analyzer",
                            "performance": "performance_analyzer",
                            "style": "style_checker"
                        }
                        for cat in skipped_cats:
                            agent_name = agent_name_map[cat]
                            yield {
                                "event": "agent_complete",
                                "data": json.dumps({"agent": agent_name, "finding_count": 0}),
                            }

                elif node_name in ("bug_detector", "security_analyzer", "performance_analyzer", "style_checker"):
                    # Map node name → findings key
                    key_map = {
                        "bug_detector": "bug_findings",
                        "security_analyzer": "security_findings",
                        "performance_analyzer": "performance_findings",
                        "style_checker": "style_findings",
                    }
                    finding_key = key_map.get(node_name, "bug_findings")
                    count = len(node_output.get(finding_key, []))
                    yield {
                        "event": "agent_complete",
                        "data": json.dumps({"agent": node_name, "finding_count": count}),
                    }

                elif node_name == "fast_reviewer":
                    supervisor_output = node_output
                    # Simulate supervisor progress
                    yield {
                        "event": "progress",
                        "data": json.dumps({
                            "stage": "synthesizing",
                            "message": "Finalizing fast review...",
                        }),
                    }
                    
                    # Count findings per category to simulate agent_complete events
                    findings_by_cat = defaultdict(int)
                    for finding in node_output.get("final_findings", []):
                        cat = finding.get("category", "bug").lower()
                        findings_by_cat[cat] += 1
                        
                    # Emit simulated completion events for all selected categories
                    selected_cats = initial_state.get("categories") or ["bug", "security", "performance", "style"]
                    agent_name_map = {
                        "bug": "bug_detector",
                        "security": "security_analyzer",
                        "performance": "performance_analyzer",
                        "style": "style_checker"
                    }
                    for cat in selected_cats:
                        agent_name = agent_name_map.get(cat, "bug_detector")
                        yield {
                            "event": "agent_complete",
                            "data": json.dumps({"agent": agent_name, "finding_count": findings_by_cat[cat]}),
                        }

                elif node_name == "supervisor":
                    supervisor_output = node_output
                    yield {
                        "event": "progress",
                        "data": json.dumps({
                            "stage": "synthesizing",
                            "message": "Supervisor agent merging all findings...",
                        }),
                    }

    except Exception as exc:
        logger.exception("LangGraph pipeline failed for review %s", review_id)
        yield {
            "event": "fatal_error",
            "data": json.dumps({"error": str(exc)}),
        }
        return

    if supervisor_output and not supervisor_output.get("error"):
        try:
            result = _build_review_result(
                review_id=review_id,
                detected_language=detected_language,
                supervisor_output=supervisor_output,
                start_time=start_time,
            )
            await save_review(review_id, result)

            yield {
                "event": "complete",
                "data": json.dumps({
                    "review_id": review_id,
                    "overall_score": result.overall_score,
                }),
            }
            logger.info("Review %s complete — score: %d", review_id, result.overall_score)
        except Exception as exc:
            logger.exception("Failed to build ReviewResult for %s", review_id)
            yield {
                "event": "fatal_error",
                "data": json.dumps({"error": f"Failed to assemble review result: {exc}"}),
            }
    else:
        error_msg = supervisor_output.get("error", "Supervisor failed") if supervisor_output else "No supervisor output"
        yield {
            "event": "fatal_error",
            "data": json.dumps({"error": error_msg}),
        }
# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/review/snippet")
async def review_snippet(request: SnippetReviewRequest) -> EventSourceResponse:
    """Stream a code-snippet review via Server-Sent Events.

    Args:
        request: A ``SnippetReviewRequest`` with code, optional language, and context.

    Returns:
        An SSE stream emitting ``progress``, ``agent_complete``, and ``complete`` events.
    """
    review_id = str(uuid.uuid4())
    initial_state: dict = {
        "review_id": review_id,
        "original_code": request.code,
        "language": request.language.value,
        "context": request.context,
        "review_mode": request.review_mode.value,
        "categories": request.categories,
    }
    start_time = time.time()
    logger.info("Snippet review started — id: %s, language: %s", review_id, request.language)
    return EventSourceResponse(review_generator(initial_state, start_time, review_id))


@router.post("/review/github-pr")
async def review_github_pr(request: PRReviewRequest) -> EventSourceResponse:
    """Fetch a GitHub PR diff then stream its review via Server-Sent Events.

    Args:
        request: A ``PRReviewRequest`` with a GitHub PR URL and optional context.

    Returns:
        An SSE stream beginning with a ``fetching`` progress event, then the
        same events as ``/review/snippet``.

    Raises:
        HTTPException: Propagated from ``fetch_pr_diff`` (404, 403, 422, 429).
    """
    review_id = str(uuid.uuid4())
    start_time = time.time()

    async def pr_generator():
        yield {
            "event": "progress",
            "data": json.dumps({
                "stage": "fetching",
                "message": "Fetching PR diff from GitHub...",
            }),
        }

        try:
            diff_text, detected_language = await fetch_pr_diff(request.github_pr_url)
        except HTTPException as exc:
            yield {
                "event": "fatal_error",
                "data": json.dumps({"error": exc.detail}),
            }
            return
        except Exception as exc:
            yield {
                "event": "fatal_error",
                "data": json.dumps({"error": str(exc)}),
            }
            return

        initial_state: dict = {
            "review_id": review_id,
            "original_code": diff_text,
            "language": detected_language,
            "context": request.context,
            "review_mode": request.review_mode.value,
            "categories": request.categories,
        }

        logger.info("PR review started — id: %s, url: %s", review_id, request.github_pr_url)

        async for event in review_generator(initial_state, start_time, review_id):
            yield event

    return EventSourceResponse(pr_generator())


@router.get("/review/{review_id}")
async def get_review_endpoint(review_id: str) -> ReviewResult:
    """Return a completed review result by its UUID.

    Args:
        review_id: The UUID of the review returned in the ``complete`` SSE event.

    Returns:
        The full ``ReviewResult`` JSON.

    Raises:
        HTTPException(404): If no review with that ID exists.
    """
    result = await get_review(review_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Review '{review_id}' not found.")
    return result
