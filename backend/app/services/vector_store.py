import os
import chromadb
from chromadb.utils import embedding_functions
from app.config import settings

_client = None
_collection = None

def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return _client

def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        gemini_ef = embedding_functions.GoogleGenerativeAiEmbeddingFunction(
            api_key=settings.GEMINI_API_KEY,
            task_type="RETRIEVAL_DOCUMENT"
        )
        _collection = client.get_or_create_collection(
            name="code_review_knowledge",
            embedding_function=gemini_ef
        )
    return _collection

def initialise_knowledge_base() -> None:
    """Load all .txt files from data/knowledge_base/ into ChromaDB on startup."""
    collection = get_collection()
    
    # Check if already populated to avoid redundant work
    if collection.count() > 0:
        return
        
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "knowledge_base")
    if not os.path.exists(base_dir):
        return
        
    documents = []
    ids = []
    
    for filename in os.listdir(base_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(base_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                # Split by numbered items roughly
                items = content.split("\n")
                for i, item in enumerate(items):
                    item = item.strip()
                    if item:
                        documents.append(item)
                        ids.append(f"{filename}_{i}")
                        
    if documents:
        # Batch add to avoid limits if necessary, but here it's small
        collection.add(documents=documents, ids=ids)

def query_patterns(code_snippet: str, n_results: int = 5) -> list[str]:
    """Semantic search over the knowledge base for relevant patterns."""
    collection = get_collection()
    if collection.count() == 0:
        return []
        
    results = collection.query(
        query_texts=[code_snippet],
        n_results=min(n_results, collection.count())
    )
    
    if results and "documents" in results and results["documents"]:
        return results["documents"][0]
    return []
