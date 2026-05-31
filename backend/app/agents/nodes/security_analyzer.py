"""Security Analyzer Agent node.

Analyses code for injection flaws, hardcoded secrets, insecure deserialization,
weak cryptography, missing input validation, and access-control bypasses.
Uses RAG context from ChromaDB to cross-reference known CVE patterns.
"""

import json
import logging

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

from app.agents.state import ReviewState
from app.prompts.security_prompt import SECURITY_PROMPT_TEMPLATE
from app.config import settings, ollama_lock
from app.models.review_response import Category

logger = logging.getLogger(__name__)


async def security_analyzer_node(state: ReviewState) -> dict:
    """Detect security vulnerabilities in the submitted code.

    Args:
        state: Current LangGraph state containing ``original_code``,
               ``language``, ``context``, and ``rag_context`` (ChromaDB patterns).

    Returns:
        A partial state dict with ``security_findings`` (list of raw finding dicts).
        Returns an empty list on failure so the pipeline can continue.
    """
    code: str = state.get("original_code", "")
    language: str = state.get("language", "python")
    context: str = state.get("context", "")
    rag_context: list[str] = state.get("rag_context", [])

    rag_context_str = "\n".join(rag_context) if rag_context else "No relevant patterns retrieved."

    llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=settings.OLLAMA_MODEL,
        temperature=0.1,
        format="json",
    )

    prompt = PromptTemplate.from_template(SECURITY_PROMPT_TEMPLATE)
    chain = prompt | llm

    try:
        async with ollama_lock:
            response = await chain.ainvoke({
                "language": language,
                "context": context or "No additional context provided.",
                "rag_context": rag_context_str,
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
            finding["category"] = Category.security.value

        logger.info("Security analyzer found %d issues.", len(findings))
        return {"security_findings": findings}

    except Exception:
        logger.exception("Security analyzer failed — returning empty findings.")
        return {"security_findings": []}
