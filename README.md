# ReviewAI

Your senior engineer, available 24/7. 

ReviewAI is a powerful web application where developers can paste a code snippet or a GitHub Pull Request URL to receive a unified, prioritized code review report. Powered by a local multi-agent LangGraph system, this tool provides actionable feedback with line-level comments and suggested fixes.

---

## ⚡ Review Modes & Architecture

ReviewAI supports two modes depending on your speed and precision preferences:

### 1. Fast Review Mode (Single-Pass)
Runs all selected category checks (Bugs, Security, Performance, Style) in a single LLM request.
- **Latency:** ~10-15 seconds.
- **Orchestration:** Preprocessor → Fast Reviewer Node → END.

### 2. Deep Review Mode (Multi-Agent)
Runs parallel specialized agents for each category and compiles the findings.
- **Latency:** ~1-2 minutes.
- **Orchestration:**
```
START
  → preprocessor (detects language, chunks code, queries ChromaDB)
  → [PARALLEL FORK (Only selected categories)]
      → bug_detector
      → security_analyzer
      → performance_analyzer
      → style_checker
  → [JOIN — all selected complete]
  → supervisor (merges all findings, deduplicates, scores, ranks)
  → END
```

---

## 🛠️ Tech Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Python | 3.11+ | Backend runtime |
| Framework | FastAPI | 0.111.0 | API framework |
| Server | uvicorn[standard] | 0.30.0 | ASGI server |
| Orchestration | langchain / langgraph | 0.2.6 / 0.1.19 | Multi-agent state machine |
| Local LLM | Ollama (`qwen2.5-coder:7b`) | Latest | Local text generation |
| Embeddings | ONNX (`ONNXMiniLM_L6_V2`) | In-Process | Local, offline vector embeddings (zero model-switching lag) |
| Vector DB | chromadb | 0.5.3 | Code pattern RAG |
| Frontend | Next.js | 14.2.4 | React framework |
| Language | TypeScript | 5.4.5 | Full type safety |
| Styling | Tailwind CSS | 3.4.4 | Utility-first styling |

---

## 📋 Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **[Ollama](https://ollama.com/)** installed and running locally.
  - Pull the default coder model:
    ```bash
    ollama pull qwen2.5-coder:7b
    ```
- *(Optional)* GitHub Personal Access Token for higher rate limits on PR fetching.

---

## 🚀 Setup Instructions

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
# Open .env and adjust configurations if needed (defaults to local Ollama setup)

# Start Server (restricted to reload only the app folder to prevent ChromaDB file-write loops)
uvicorn app.main:app --reload --reload-dir app
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

---

## 🔌 API Documentation

### GET `/api/v1/health`
Checks the status of the API and vector store.
```bash
curl http://localhost:8000/api/v1/health
```

### POST `/api/v1/review/snippet`
Submits a code snippet for review. Streams progress using Server-Sent Events (SSE).
```bash
curl -X POST http://localhost:8000/api/v1/review/snippet \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "code": "def divide(a, b):\n    return a / b",
    "language": "python",
    "review_mode": "fast",
    "categories": ["bug", "security"]
  }'
```

### POST `/api/v1/review/github-pr`
Submits a GitHub PR for review. Streams progress using SSE.
```bash
curl -X POST http://localhost:8000/api/v1/review/github-pr \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "github_pr_url": "https://github.com/owner/repo/pull/42",
    "review_mode": "deep",
    "categories": ["bug", "security", "performance", "style"]
  }'
```

---

## 🔒 Known Limitations

- Code snippets and PR diffs are limited to 20,000 characters.
- Review results are persisted locally in-memory (currently uses a mock/local store).
- Processing time depends heavily on your local hardware specifications (Fast Mode is highly recommended for standard consumer CPUs/GPUs).
