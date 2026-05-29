# ReviewAI

Your senior engineer, available 24/7. 

ReviewAI is a powerful web application where developers can paste a code snippet or a GitHub Pull Request URL to receive a unified, prioritized code review report. Powered by a multi-agent LangGraph system running four parallel specialist agents (Bugs, Security, Performance, Style) and a Supervisor Agent, this tool provides actionable feedback with line-level comments and suggested fixes.

## Architecture

```
START
  → preprocessor (detects language, chunks code, queries ChromaDB for patterns)
  → [PARALLEL FORK]
      → bug_detector
      → security_analyzer
      → performance_analyzer
      → style_checker
  → [JOIN — all four complete]
  → supervisor (merges all findings, deduplicates, scores, ranks)
  → END
```

*LangGraph's Send API is used to execute the parallel fork efficiently.*

## Tech Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Python | 3.11+ | Backend runtime |
| Framework | FastAPI | 0.111.0 | API framework |
| Server | uvicorn[standard] | 0.30.0 | ASGI server |
| Orchestration | langchain | 0.2.6 | LLM orchestration |
| AI | langchain-google-genai | 1.0.6 | Gemini LLM + embeddings |
| Agents | langgraph | 0.1.19 | Parallel multi-agent state machine |
| Vector DB | chromadb | 0.5.3 | Code pattern RAG |
| Frontend | Next.js | 14.2.4 | React framework |
| Language | TypeScript | 5.4.5 | Full type safety |
| Styling | Tailwind CSS | 3.4.4 | Utility-first styling |

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Google AI Studio API Key](https://aistudio.google.com) (Free tier available)
- (Optional) GitHub Personal Access Token for higher rate limits on PR fetching.

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY

# Start Server
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Configure Environment Variables
cp .env.local.example .env.local

# Start Dev Server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## API Documentation

The backend provides the following endpoints:

### GET /api/v1/health
Checks the status of the API and vector store.
```bash
curl http://localhost:8000/api/v1/health
```

### POST /api/v1/review/snippet
Submits a code snippet for review. Streams progress using Server-Sent Events (SSE).
```bash
curl -X POST http://localhost:8000/api/v1/review/snippet \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"code": "def foo(x=[]):\n  x.append(1)\n  return x", "language": "python"}'
```

### POST /api/v1/review/github-pr
Submits a GitHub PR for review. Streams progress using SSE.
```bash
curl -X POST http://localhost:8000/api/v1/review/github-pr \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"github_pr_url": "https://github.com/owner/repo/pull/42"}'
```

### GET /api/v1/review/{review_id}
Fetches the complete review result.

## Known Limitations

- Code snippets and PR diffs are limited to 20,000 characters or 500 changed lines.
- No permanent persistence (currently uses an in-memory store).
- Languages supported are best-effort using Gemini and pygments detection.

## Future Improvements

- PostgreSQL integration for persisting reviews.
- IDE plugins for VS Code and JetBrains.
- Webhook integration for GitHub Actions to review automatically on PR creation.
