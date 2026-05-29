import re
import httpx
from fastapi import HTTPException
from app.config import settings

async def fetch_pr_diff(pr_url: str) -> tuple[str, str]:
    """
    Fetches the unified diff and metadata for a GitHub PR.
    
    Args:
        pr_url: Full GitHub PR URL e.g. https://github.com/owner/repo/pull/42
    Returns:
        Tuple of (diff_text, detected_language)
    Raises:
        HTTPException(404) if PR not found
        HTTPException(403) if rate limited
        HTTPException(422) if PR is too large (>500 changed lines)
    """
    pattern = r"^https://github\.com/([\w\-]+)/([\w\-]+)/pull/(\d+)$"
    match = re.match(pattern, pr_url)
    if not match:
        raise HTTPException(status_code=422, detail="Invalid GitHub PR URL")
    
    owner, repo, pull_number = match.groups()
    api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"
    
    headers = {"Accept": "application/vnd.github.v3.diff"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
        
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url, headers=headers)
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub PR not found")
        elif response.status_code == 403:
            raise HTTPException(status_code=403, detail="GitHub API rate limit exceeded")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching PR diff")
            
        raw_diff = response.text
        
    # Process diff
    added_lines = []
    extensions = set()
    current_file_ext = ""
    
    for line in raw_diff.splitlines():
        if line.startswith("+++ b/"):
            # extract extension
            filename = line[6:]
            if "." in filename:
                ext = filename.split(".")[-1].lower()
                extensions.add(ext)
                current_file_ext = ext
            else:
                current_file_ext = ""
        elif line.startswith("+") and not line.startswith("+++"):
            added_lines.append(line[1:])
            
    if len(added_lines) > 500:
        raise HTTPException(status_code=422, detail="PR is too large. Only PRs with up to 500 changed lines are supported.")
        
    # Heuristic for language detection from extensions
    detected_language = "auto"
    if "py" in extensions:
        detected_language = "python"
    elif "js" in extensions or "jsx" in extensions:
        detected_language = "javascript"
    elif "ts" in extensions or "tsx" in extensions:
        detected_language = "typescript"
    elif "java" in extensions:
        detected_language = "java"
    elif "go" in extensions:
        detected_language = "go"
    elif "rs" in extensions:
        detected_language = "rust"
    elif "cpp" in extensions or "cc" in extensions or "c" in extensions:
        detected_language = "cpp"
        
    return "\n".join(added_lines), detected_language
