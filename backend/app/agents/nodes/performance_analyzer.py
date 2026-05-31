"""Performance Analyzer Agent node.

Analyses code for N+1 query patterns, unnecessary recomputations, inefficient
data structures, blocking calls in async functions, O(n²) algorithms, and
memory leaks.
"""

import json
import logging

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

from app.agents.state import ReviewState
from app.prompts.performance_prompt import PERFORMANCE_PROMPT_TEMPLATE
from app.config import settings, ollama_lock
from app.models.review_response import Category

logger = logging.getLogger(__name__)


async def performance_analyzer_node(state: ReviewState) -> dict:
    """Detect performance issues in the submitted code.

    Args:
        state: Current LangGraph state containing ``original_code``,
               ``language``, and ``context``.

    Returns:
        A partial state dict with ``performance_findings`` (list of raw finding dicts).
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

    prompt = PromptTemplate.from_template(PERFORMANCE_PROMPT_TEMPLATE)
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
            finding["category"] = Category.performance.value

        logger.info("Performance analyzer found %d issues.", len(findings))
        return {"performance_findings": findings}

    except Exception:
        logger.exception("Performance analyzer failed — returning empty findings.")
        return {"performance_findings": []}
