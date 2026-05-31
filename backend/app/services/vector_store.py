import os
import logging
from typing import Optional
import chromadb
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction
from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[chromadb.Client] = None
_collection: Optional[chromadb.Collection] = None


def get_chroma_client() -> chromadb.PersistentClient:
    """Return (or lazily create) the persistent ChromaDB client.

    Returns:
        A ChromaDB PersistentClient instance.
    """
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return _client


def get_collection() -> chromadb.Collection:
    """Return (or lazily create) the code-review knowledge collection.

    Uses a local ONNX MiniLM-L6-v2 embedding model for semantic search
    to prevent Ollama from model switching and causing massive latency.

    Returns:
        A ChromaDB Collection loaded with the local ONNX embedding function.
    """
    global _collection
    if _collection is None:
        client = get_chroma_client()
        from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
        onnx_ef = ONNXMiniLM_L6_V2()
        _collection = client.get_or_create_collection(
            name="code_review_knowledge_local",
            embedding_function=onnx_ef,
        )
    return _collection


def initialise_knowledge_base() -> None:
    """Load all .txt files from data/knowledge_base/ into ChromaDB on startup.

    Each non-empty line is treated as an independent document/pattern so that
    semantic search can pinpoint the most relevant individual pattern.  The
    function is idempotent — if the collection already contains documents it
    returns immediately.
    """
    try:
        collection = get_collection()

        if collection.count() > 0:
            logger.info("Knowledge base already loaded (%d documents). Skipping.", collection.count())
            return

        base_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data",
            "knowledge_base",
        )
        if not os.path.exists(base_dir):
            logger.warning("Knowledge base directory not found: %s", base_dir)
            return

        documents: list[str] = []
        ids: list[str] = []

        for filename in sorted(os.listdir(base_dir)):
            if not filename.endswith(".txt"):
                continue
            filepath = os.path.join(base_dir, filename)
            with open(filepath, "r", encoding="utf-8") as fh:
                for i, line in enumerate(fh):
                    line = line.strip()
                    if line and not line.startswith("#"):
                        documents.append(line)
                        ids.append(f"{filename}_{i}")

        if documents:
            # ChromaDB add() can handle up to ~5 000 docs in one call for local clients.
            collection.add(documents=documents, ids=ids)
            logger.info("Knowledge base loaded: %d patterns from %s.", len(documents), base_dir)
        else:
            logger.warning("No patterns found in knowledge base directory.")
    except Exception:
        logger.exception("Failed to initialise knowledge base — RAG context will be unavailable.")


def query_patterns(code_snippet: str, n_results: int = 5) -> list[str]:
    """Semantic search over the knowledge base for relevant patterns.

    Args:
        code_snippet: The code text to use as the query.
        n_results: Maximum number of matching patterns to return.

    Returns:
        A list of pattern strings most relevant to the snippet.
    """
    try:
        collection = get_collection()
        if collection.count() == 0:
            return []

        results = collection.query(
            query_texts=[code_snippet],
            n_results=min(n_results, collection.count()),
        )

        if results and "documents" in results and results["documents"]:
            return results["documents"][0]
    except Exception:
        logger.exception("RAG pattern query failed — returning empty context.")
    return []
