from fastapi import APIRouter
from app.services.vector_store import get_collection

router = APIRouter()

@router.get("/health")
async def health_check():
    chroma_ready = False
    kb_loaded = False
    try:
        collection = get_collection()
        chroma_ready = True
        kb_loaded = collection.count() > 0
    except Exception:
        pass
        
    return {
        "status": "ok",
        "knowledge_base_loaded": kb_loaded,
        "chroma_ready": chroma_ready
    }
