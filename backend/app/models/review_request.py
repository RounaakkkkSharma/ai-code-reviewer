from pydantic import BaseModel, field_validator
from enum import Enum

class SupportedLanguage(str, Enum):
    python     = "python"
    javascript = "javascript"
    typescript = "typescript"
    java       = "java"
    go         = "go"
    rust       = "rust"
    cpp        = "cpp"
    auto       = "auto"   # system detects language automatically

class SnippetReviewRequest(BaseModel):
    code: str
    language: SupportedLanguage = SupportedLanguage.auto
    context: str = ""          # optional: what this code is supposed to do

    @field_validator("code")
    @classmethod
    def code_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Code cannot be empty")
        if len(v) > 20000:
            raise ValueError("Code exceeds 20,000 character limit")
        return v

class PRReviewRequest(BaseModel):
    github_pr_url: str         # e.g. https://github.com/owner/repo/pull/42
    context: str = ""

    @field_validator("github_pr_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        import re
        pattern = r"^https://github\.com/[\w\-]+/[\w\-]+/pull/\d+$"
        if not re.match(pattern, v):
            raise ValueError("Must be a valid GitHub PR URL")
        return v
