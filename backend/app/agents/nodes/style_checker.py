"""Style Checker Agent node.

Analyses code for naming convention violations, overly long functions, deep
nesting, magic numbers, missing docstrings, DRY violations, dead code, and
inconsistent formatting.
"""

import json
import logging

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

from app.agents.state import ReviewState
from app.prompts.style_prompt import STYLE_PROMPT_TEMPLATE
from app.config import settings, ollama_lock
from app.models.review_response import Category

logger = logging.getLogger(__name__)


async def style_checker_node(state: ReviewState) -> dict:
    """Detect code style and readability issues in the submitted code.

    Args:
        state: Current LangGraph state containing ``original_code``,
               ``language``, and ``context``.

    Returns:
        A partial state dict with ``style_findings`` (list of raw finding dicts).
        Returns an empty list on failure so the pipeline can continue.
    """
    code: str = state.get("original_code", "")
    language: str = state.get("language", "python")
    context: str = state.get("context", "")

    llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL,
        temperature=0.1,
        format="json",
    )

    prompt = PromptTemplate.from_template(STYLE_PROMPT_TEMPLATE)
    chain = prompt | llm

    try:
        async with ollama_lock:
            response = await chain.ainvoke({
                "language": language,
                "context": context or "No additional context provided.",
                "code": code,
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

        for finding in findings:
            finding["category"] = Category.style.value

        logger.info("Style checker found %d issues.", len(findings))
        return {"style_findings": findings}

    except Exception:
        logger.exception("Style checker failed — returning empty findings.")
        return {"style_findings": []}
