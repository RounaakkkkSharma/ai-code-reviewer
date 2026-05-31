"""Bug Detector Agent node.

Analyses code for logic errors, null dereferences, off-by-one errors, missing
error handling, resource leaks, and race conditions using a local Ollama LLM.
"""

import json
import logging

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

from app.agents.state import ReviewState
from app.prompts.bug_prompt import BUG_PROMPT_TEMPLATE
from app.config import settings, ollama_lock
from app.models.review_response import Category

logger = logging.getLogger(__name__)


async def bug_detector_node(state: ReviewState) -> dict:
    """Detect bugs in the submitted code using a local Ollama model.

    Args:
        state: Current LangGraph state containing ``original_code``,
               ``language``, and ``context``.

    Returns:
        A partial state dict with ``bug_findings`` (list of raw finding dicts).
        Returns an empty list on failure so the pipeline can continue.
    """
    code: str = state.get("original_code") or ""
    language: str = state.get("language") or "python"
    context: str = state.get("context") or ""

    llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL,
        temperature=0.1,
        format="json",           # ask Ollama to return raw JSON
    )

    prompt = PromptTemplate.from_template(BUG_PROMPT_TEMPLATE)
    chain = prompt | llm

    try:
        async with ollama_lock:
            response = await chain.ainvoke({
                "language": language,
                "context": context or "No additional context provided.",
                "code": code,
            })

        text: str = response.content.strip()
        # Strip accidental markdown fences
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        result: dict = json.loads(text.strip())
        findings: list[dict] = result.get("findings", [])

        # Tag each finding with the correct category
        for finding in findings:
            finding["category"] = Category.bug.value

        logger.info("Bug detector found %d issues.", len(findings))
        return {"bug_findings": findings}

    except Exception:
        logger.exception("Bug detector failed — returning empty findings.")
        return {"bug_findings": []}
