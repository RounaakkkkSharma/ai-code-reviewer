from pydantic import BaseModel
from enum import Enum
from typing import List, Optional

class Severity(str, Enum):
    critical = "critical"   # must fix before merge
    high     = "high"       # strongly recommended fix
    medium   = "medium"     # should fix
    low      = "low"        # nice to fix
    info     = "info"       # informational only

class Category(str, Enum):
    bug         = "bug"
    security    = "security"
    performance = "performance"
    style       = "style"

class SuggestedFix(BaseModel):
    original_code: str       # the problematic snippet
    fixed_code: str          # suggested replacement
    explanation: str         # why this fix is correct

class Finding(BaseModel):
    id: str                  # unique ID e.g. "BUG-001"
    category: Category
    severity: Severity
    title: str               # short one-line description
    description: str         # full explanation
    line_reference: str      # e.g. "Line 42" or "Lines 15-23" or "General"
    suggested_fix: Optional[SuggestedFix] = None
    confidence: int          # 0-100, how confident the agent is

class CategorySummary(BaseModel):
    category: Category
    score: int               # 0-100 (higher = better code quality)
    finding_count: int
    critical_count: int

class ReviewResult(BaseModel):
    review_id: str
    language: str
    overall_score: int       # 0-100
    overall_verdict: str     # one-sentence summary
    category_summaries: List[CategorySummary]
    findings: List[Finding]  # sorted by severity (critical first)
    positive_aspects: List[str]   # what the code does well
    top_recommendations: List[str] # top 3 actions to take
    review_duration_ms: int
