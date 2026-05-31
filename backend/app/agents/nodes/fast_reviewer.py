"""Fast Reviewer Agent node.

Performs a unified code analysis for bugs, security, performance, and style
in a single LLM request to minimize latency on local Ollama servers.
"""

import json
import logging

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

from app.agents.state import ReviewState
from app.prompts.fast_prompt import FAST_PROMPT_TEMPLATE
from app.config import settings, ollama_lock
from app.models.review_response import Category

logger = logging.getLogger(__name__)

CATEGORY_DESCRIPTIONS = {
    "bug": "- Logic errors, null pointers, off-by-one errors, missing error handling, resource leaks, and race conditions.",
    "security": "- SQL injection, XSS, hardcoded secrets, weak cryptographical protocols, and sanitisation issues.",
    "performance": "- N+1 database queries, O(n^2) algorithms, blocking async loops, memory leaks, and inefficient structures.",
    "style": "- Naming conventions, style guide violations, code duplication, excessive complexity, and lack of comments."
}

async def fast_reviewer_node(state: ReviewState) -> dict:
    """Analyze code for multiple selected categories in a single LLM call.

    Args:
        state: Current ReviewState containing code, language, context, and selected categories.

    Returns:
        A state dict populated with finalized findings and scores.
    """
    code: str = state.get("original_code") or ""
    language: str = state.get("language") or "python"
    context: str = state.get("context") or ""
    categories: list[str] = state.get("categories") or ["bug", "security", "performance", "style"]

    # Build category list description for the prompt
    cat_descs = []
    for cat in ["bug", "security", "performance", "style"]:
        if cat in categories:
            cat_descs.append(f"{cat.upper()}: {CATEGORY_DESCRIPTIONS[cat]}")
    
    categories_list_desc = "\n".join(cat_descs)

    llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL,
        temperature=0.1,
        format="json",
    )

    prompt = PromptTemplate.from_template(FAST_PROMPT_TEMPLATE)
    chain = prompt | llm

    try:
        logger.info("Fast Reviewer calling LLM for categories: %s", categories)
        async with ollama_lock:
            response = await chain.ainvoke({
                "language": language,
                "context": context or "No additional context provided.",
                "code": code,
                "categories_list_desc": categories_list_desc,
            })

        text: str = response.content.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        result: dict = json.loads(text.strip())
        findings: list[dict] = result.get("findings", [])

        # Filter out findings not in selected categories (defensive check)
        filtered_findings = []
        for f in findings:
            cat = str(f.get("category", "bug")).lower()
            if cat in categories:
                f["category"] = cat
                filtered_findings.append(f)
        
        # --- Sort by severity (critical first) ---
        severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}
        filtered_findings.sort(
            key=lambda x: severity_order.get(x.get("severity", "info"), 0),
            reverse=True,
        )

        # --- Assign structured IDs (BUG-001, SEC-001, …) ---
        counters: dict[str, int] = {"bug": 1, "security": 1, "performance": 1, "style": 1}
        prefix_map = {"bug": "BUG", "security": "SEC", "performance": "PERF", "style": "STYLE"}
        for finding in filtered_findings:
            cat = finding.get("category", "bug").lower()
            if cat not in counters:
                cat = "bug"
            finding["id"] = f"{prefix_map[cat]}-{counters[cat]:03d}"
            counters[cat] += 1

        # --- Calculate per-category scores ---
        deduction_map = {"critical": 25, "high": 15, "medium": 8, "low": 3, "info": 1}
        cat_scores: dict[str, int] = {"bug": 100, "security": 100, "performance": 100, "style": 100}

        for finding in filtered_findings:
            cat = finding.get("category", "bug").lower()
            sev = finding.get("severity", "info").lower()
            if cat in cat_scores:
                cat_scores[cat] = max(0, cat_scores[cat] - deduction_map.get(sev, 0))

        # --- Overall score: weighted average ---
        overall_score = int(
            cat_scores["bug"] * 0.35
            + cat_scores["security"] * 0.35
            + cat_scores["performance"] * 0.20
            + cat_scores["style"] * 0.10
        )

        logger.info(
            "Fast reviewer complete — %d findings, overall score: %d",
            len(filtered_findings),
            overall_score
        )

        return {
            "final_findings": filtered_findings,
            "overall_verdict": result.get("overall_verdict", "Code review complete."),
            "top_recommendations": result.get("top_recommendations", [])[:3],
            "positive_aspects": result.get("positive_aspects", [])[:5],
            "overall_score": overall_score,
            "category_scores": cat_scores,
            "is_complete": True,
        }

    except Exception:
        logger.exception("Fast Reviewer failed — returning empty findings.")
        return {
            "error": "Fast reviewer failed to synthesize findings.",
            "final_findings": [],
            "overall_verdict": "Review could not be completed due to an internal error.",
            "top_recommendations": [],
            "positive_aspects": [],
            "overall_score": 0,
            "category_scores": {"bug": 0, "security": 0, "performance": 0, "style": 0},
            "is_complete": True,
        }
