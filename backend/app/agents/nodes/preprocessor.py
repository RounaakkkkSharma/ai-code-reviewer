from pygments.lexers import guess_lexer, get_lexer_by_name
from pygments.util import ClassNotFound
from app.agents.state import ReviewState
from app.services.vector_store import query_patterns

def chunk_code(code: str, max_chunk_size: int = 3000) -> list[str]:
    """Splits code into chunks around max_chunk_size by lines."""
    if len(code) <= max_chunk_size:
        return [code]
        
    chunks = []
    current_chunk = []
    current_length = 0
    
    for line in code.splitlines(keepends=True):
        if current_length + len(line) > max_chunk_size and current_chunk:
            chunks.append("".join(current_chunk))
            current_chunk = []
            current_length = 0
        current_chunk.append(line)
        current_length += len(line)
        
    if current_chunk:
        chunks.append("".join(current_chunk))
        
    return chunks

async def preprocessor_node(state: ReviewState):
    """
    1. Detects language if auto
    2. Splits into chunks if needed
    3. Queries ChromaDB for known anti-patterns
    """
    code = state.get("original_code", "")
    lang = state.get("language", "auto")
    
    # 1. Detect language
    if lang == "auto" or not lang:
        try:
            lexer = guess_lexer(code)
            lang = lexer.aliases[0] if lexer.aliases else "text"
        except Exception:
            lang = "python" # fallback
            
    # 2. Chunking
    chunks = chunk_code(code)
    
    # 3. RAG context
    rag_patterns = query_patterns(code, n_results=5)
    rag_context = rag_patterns if isinstance(rag_patterns, list) else [rag_patterns] if rag_patterns else []
    
    return {
        "language": lang,
        "code_chunks": chunks,
        "rag_context": rag_context
    }
