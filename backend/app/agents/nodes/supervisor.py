import json
import logging
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from app.agents.state import ReviewState
from app.prompts.supervisor_prompt import SUPERVISOR_PROMPT_TEMPLATE
from app.config import settings, ollama_lock

logger = logging.getLogger(__name__)


async def supervisor_node(state: ReviewState) -> dict:
    """Merge all specialist agent findings into a unified, ranked review report.

    Collects findings from bug_detector, security_analyzer, performance_analyzer,
    and style_checker, deduplicates overlapping findings, assigns structured IDs,
    sorts by severity, calculates per-category and overall scores, and writes the
    top-level verdict and recommendations.

    Args:
        state: The current LangGraph ReviewState containing all agent findings.

    Returns:
        A partial state dict with ``final_findings``, ``overall_verdict``,
        ``top_recommendations``, ``positive_aspects``, ``overall_score``,
        ``category_scores``, and ``is_complete``.
    """
    bug_findings: list[dict] = state.get("bug_findings", [])
    security_findings: list[dict] = state.get("security_findings", [])
    performance_findings: list[dict] = state.get("performance_findings", [])
    style_findings: list[dict] = state.get("style_findings", [])

    llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL,
        temperature=0.1,
        format="json",
    )

    prompt = PromptTemplate.from_template(SUPERVISOR_PROMPT_TEMPLATE)
    chain = prompt | llm

    try:
        async with ollama_lock:
            response = await chain.ainvoke({
                "bug_findings": json.dumps(bug_findings),
                "security_findings": json.dumps(security_findings),
                "performance_findings": json.dumps(performance_findings),
                "style_findings": json.dumps(style_findings),
            })

        text = response.content.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        result = json.loads(text.strip())

        final_findings: list[dict] = result.get("final_findings", [])

        # --- Sort by severity (critical first) ---
        severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}
        final_findings.sort(
            key=lambda x: severity_order.get(x.get("severity", "info"), 0),
            reverse=True,
        )

        # --- Assign structured IDs (BUG-001, SEC-001, …) ---
        counters: dict[str, int] = {"bug": 1, "security": 1, "performance": 1, "style": 1}
        prefix_map = {"bug": "BUG", "security": "SEC", "performance": "PERF", "style": "STYLE"}
        for finding in final_findings:
            cat = finding.get("category", "bug").lower()
            if cat not in counters:
                cat = "bug"
            finding["id"] = f"{prefix_map[cat]}-{counters[cat]:03d}"
            counters[cat] += 1

        # --- Calculate per-category scores (start 100, deduct per finding) ---
        deduction_map = {"critical": 25, "high": 15, "medium": 8, "low": 3, "info": 1}
        cat_scores: dict[str, int] = {"bug": 100, "security": 100, "performance": 100, "style": 100}

        for finding in final_findings:
            cat = finding.get("category", "bug").lower()
            sev = finding.get("severity", "info").lower()
            if cat in cat_scores:
                cat_scores[cat] = max(0, cat_scores[cat] - deduction_map.get(sev, 0))

        # --- Overall score: weighted average (bugs 35%, security 35%, perf 20%, style 10%) ---
        overall_score = int(
            cat_scores["bug"] * 0.35
            + cat_scores["security"] * 0.35
            + cat_scores["performance"] * 0.20
            + cat_scores["style"] * 0.10
        )

        logger.info(
            "Supervisor complete — %d findings, overall score: %d",
            len(final_findings),
            overall_score,
        )

        return {
            "final_findings": final_findings,
            "overall_verdict": result.get("overall_verdict", "Code review complete."),
            "top_recommendations": result.get("top_recommendations", [])[:3],
            "positive_aspects": result.get("positive_aspects", [])[:5],
            "overall_score": overall_score,
            "category_scores": cat_scores,   # ← NEW: exposed for route to build CategorySummary
            "is_complete": True,
        }

    except Exception:
        logger.exception("Supervisor node failed")
        return {
            "error": "Supervisor failed to synthesise findings.",
            "final_findings": [],
            "overall_verdict": "Review could not be completed due to an internal error.",
            "top_recommendations": [],
            "positive_aspects": [],
            "overall_score": 0,
            "category_scores": {"bug": 0, "security": 0, "performance": 0, "style": 0},
            "is_complete": True,
        }
