import asyncio
from typing import Dict, Optional
from app.models.review_response import ReviewResult

_store: Dict[str, ReviewResult] = {}
_lock = asyncio.Lock()

async def save_review(review_id: str, result: ReviewResult) -> None:
    async with _lock:
        _store[review_id] = result

async def get_review(review_id: str) -> Optional[ReviewResult]:
    async with _lock:
        return _store.get(review_id)

async def delete_review(review_id: str) -> None:
    async with _lock:
        if review_id in _store:
            del _store[review_id]
