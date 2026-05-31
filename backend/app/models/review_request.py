from pydantic import BaseModel, field_validator, Field
from enum import Enum
from typing import List

class SupportedLanguage(str, Enum):
    python     = "python"
    javascript = "javascript"
    typescript = "typescript"
    java       = "java"
    go         = "go"
    rust       = "rust"
    cpp        = "cpp"
    auto       = "auto"   # system detects language automatically

class ReviewMode(str, Enum):
    fast = "fast"
    deep = "deep"

class SnippetReviewRequest(BaseModel):
    code: str
    language: SupportedLanguage = SupportedLanguage.auto
    context: str = ""          # optional: what this code is supposed to do
    review_mode: ReviewMode = ReviewMode.deep
    categories: List[str] = Field(default_factory=lambda: ["bug", "security", "performance", "style"])

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Code cannot be empty")
        if len(v) > 20000:
            raise ValueError("Code exceeds 20,000 character limit")
        return v

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, v: List[str]) -> List[str]:
        valid_cats = {"bug", "security", "performance", "style"}
        filtered = [c.lower() for c in v if c.lower() in valid_cats]
        if not filtered:
            raise ValueError("At least one valid category must be selected: bug, security, performance, style")
        return filtered

class PRReviewRequest(BaseModel):
    github_pr_url: str         # e.g. https://github.com/owner/repo/pull/42
    context: str = ""
    review_mode: ReviewMode = ReviewMode.deep
    categories: List[str] = Field(default_factory=lambda: ["bug", "security", "performance", "style"])

    @field_validator("github_pr_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        import re
        pattern = r"^https://github\.com/[\w\-]+/[\w\-]+/pull/\d+$"
        if not re.match(pattern, v):
            raise ValueError("Must be a valid GitHub PR URL")
        return v

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, v: List[str]) -> List[str]:
        valid_cats = {"bug", "security", "performance", "style"}
        filtered = [c.lower() for c in v if c.lower() in valid_cats]
        if not filtered:
            raise ValueError("At least one valid category must be selected: bug, security, performance, style")
        return filtered
