from typing import TypedDict, Optional

class ReviewState(TypedDict):
    review_id: str
    original_code: str
    language: str
    context: str
    code_chunks: list[str]           # code split for large files
    rag_context: list[str]           # retrieved patterns from ChromaDB
    bug_findings: list[dict]         # raw output from bug_detector
    security_findings: list[dict]    # raw output from security_analyzer
    performance_findings: list[dict] # raw output from performance_analyzer
    style_findings: list[dict]       # raw output from style_checker
    final_findings: list[dict]       # merged, deduplicated, ranked
    positive_aspects: list[str]
    overall_score: int
    overall_verdict: str
    top_recommendations: list[str]
    is_complete: bool
    error: Optional[str]
