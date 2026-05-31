# ReviewAI — Senior Engineering Feature Proposals

This document outlines architectural and feature enhancements to transform ReviewAI into a premium, production-grade agentic developer platform. These proposals focus on developer experience (DX), advanced AI agent routing, database persistence, and visual UI upgrades.

---

## 📋 Table of Contents
1. [Developer Experience (DX) & CLI/Git Hooks](#1-developer-experience-dx--cligit-hooks)
2. [Visual Code Diffing & 1-Click Auto-Fix](#2-visual-code-diffing--1-click-auto-fix)
3. [Live Agent "Thought Stream" Console](#3-live-agent-thought-stream-console)
4. [Persistence Layer & Historical Analytics Dashboard](#4-persistence-layer--historical-analytics-dashboard)
5. [Context-Aware Workspace AST Indexing (RAG+)](#5-context-aware-workspace-ast-indexing-rag)

---

## 1. Developer Experience (DX) & CLI/Git Hooks

### 💡 The Goal
Integrate ReviewAI directly into daily development workflows (command line and source control) so engineers don't need to open a browser window for a review.

### 🛠️ Architecture & Implementation
* **Git `pre-commit` Hook:**
  - Create a lightweight Python script (`bin/pre-commit-review`) that runs during the Git pre-commit lifecycle.
  - The script uses `git diff --cached` to extract only changed lines of code.
  - It sends the diff to the FastAPI backend `/api/v1/review/snippet` endpoint in **Fast Mode**.
  - If the backend returns findings with `"severity": "critical"` or `"severity": "high"`, the hook exits with error code `1`, blocking the commit and outputting details.
* **ReviewAI CLI (`reviewai`):**
  - Package a simple command-line script inside the backend virtual environment.
  - Uses the `rich` Python library to print review findings directly to the terminal with beautiful tables, syntax highlighting, and colorized severities.
  - Example command: `reviewai review --file backend/app/main.py --mode fast`

---

## 2. Visual Code Diffing & 1-Click Auto-Fix

### 💡 The Goal
Provide a premium code-review interface matching high-end products like GitHub or GitLab, enabling developers to merge suggested corrections instantly.

### 🛠️ Architecture & Implementation
* **Split-Pane Code Diff Viewer:**
  - Replace the text-based suggestion blocks with a dedicated Next.js diff component (e.g., `react-diff-viewer`).
  - Highlights deleted code in red on the left, and corrected code in green on the right, mapped to line-specific references.
* **1-Click Apply:**
  - Introduce an "Apply Fix" button on the finding card.
  - When clicked, it automatically replaces the code snippet in the main React editor with the `suggested_fix.fixed_code` payload, updating editor state instantly.

---

## 3. Live Agent "Thought Stream" Console

### 💡 The Goal
Make the parallel multi-agent LangGraph system transparent and visible, demonstrating the complex reasoning logs of the specialist nodes.

### 🛠️ Architecture & Implementation
* **Streaming Node Events:**
  - Update the FastAPI review SSE generator (`review_generator`) to yield fine-grained logs from agent execution.
  - Capture standard out/logs from `bug_detector_node`, `security_analyzer_node`, and `supervisor_node`.
* **Frontend Collapsible Terminal Console:**
  - Add a dark-mode collapsible terminal drawer at the bottom of the review page.
  - Stream logs in real-time with micro-animations:
    ```
    [System] Initializing LangGraph state machine...
    [Preprocessor] Language detected: Python (confidence 98%).
    [Preprocessor] Querying ChromaDB for known anti-patterns...
    [Bug Detector] Running LLM analysis on CPU...
    [Security Node] Checking line 14 for hardcoded secrets...
    [Supervisor] Deduplicating 3 style suggestions and merging report.
    ```

---

## 4. Persistence Layer & Historical Analytics Dashboard

### 💡 The Goal
Transition the app from an ephemeral, in-memory mock store to a production-grade relational database with analytics.

### 🛠️ Architecture & Implementation
* **Database Schema (SQLite or PostgreSQL):**
  - Implement a persistent relational database using an ORM like **SQLAlchemy** or **SQLModel**.
  - Define tables: `reviews` (metadata, score, verdict), `findings` (title, description, severity, code snippet), and `metrics` (durations, token usage).
* **Analytics Dashboard Page (`/dashboard`):**
  - Create a frontend dashboard using a chart library like `recharts`.
  - Display metrics over time:
    - **Quality Trend:** Code score progress across commits/reviews.
    - **Dimensions Radar:** Radar chart showing scores across Bugs, Security, Performance, and Style.
    - **Issue Distribution:** Pie chart breaking down finding types.

---

## 5. Context-Aware Workspace AST Indexing (RAG+)

### 💡 The Goal
Standard review bots review files in isolation, leading to false positives. A senior tool understands context (e.g., how functions imported from other files are defined).

### 🛠️ Architecture & Implementation
* **AST Parsing Node:**
  - Integrate a Python script on backend pre-processing that parses imported modules in the code snippet using Python's standard `ast` package (or `esprima` for Javascript).
  - Resolve local imports (e.g., `from app.config import settings`) by looking up the actual source definition in the project workspace.
* **Expanded Context Prompting:**
  - Append the source definitions of imported local modules to the LLM prompt's context window.
  - This allows the model to verify if external function arguments, imports, and variables match the target implementation, providing highly accurate, project-specific reviews.
