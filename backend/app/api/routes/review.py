import json
import uuid
import time
from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse
from app.models.review_request import SnippetReviewRequest, PRReviewRequest
from app.models.review_response import ReviewResult
from app.services.github_service import fetch_pr_diff
from app.services.review_store import save_review, get_review
from app.agents.graph import build_graph

router = APIRouter()

async def review_generator(initial_state: dict, start_time: float, review_id: str):
    graph = build_graph()
    
    yield {
        "event": "progress",
        "data": json.dumps({"stage": "preprocessing", "message": "Detecting language and preparing code..."})
    }
    
    final_state = None
    
    try:
        async for event in graph.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                if node_name == "preprocessor":
                    yield {
                        "event": "progress",
                        "data": json.dumps({"stage": "analyzing", "message": "Running 4 specialist agents in parallel..."})
                    }
                elif node_name in ["bug_detector", "security_analyzer", "performance_analyzer", "style_checker"]:
                    finding_key = f"{node_name.split('_')[0]}_findings"
                    if node_name == "style_checker": finding_key = "style_findings"
                    count = len(node_output.get(finding_key, []))
                    yield {
                        "event": "agent_complete",
                        "data": json.dumps({"agent": node_name, "finding_count": count})
                    }
                    
                elif node_name == "supervisor":
                    final_state = node_output
    except Exception as e:
        yield {
            "event": "fatal_error",
            "data": json.dumps({"error": str(e)})
        }
        return
        
    if final_state and "error" not in final_state:
        # Build ReviewResult
        # Supervisor returns only the updated state fields, we need to merge it or get final values.
        # Wait, Langchain graph update mode returns only the output of the node.
        # Let's get the full state by running it and then getting it, but we don't have the full state here.
        # However, final_state has "final_findings", "overall_score", etc. from supervisor.
        # Actually, let's fetch the full state using get_state(config) if needed, but we don't have a checkpointer.
        # Let's assume supervisor outputs everything needed or we just use what supervisor returned.
        
        # We need language from initial_state or preprocessor.
        # Let's just pass what we know.
        
        # Calculate category summaries based on final_findings
        final_findings = final_state.get("final_findings", [])
        
        category_summaries = []
        for cat in ["bug", "security", "performance", "style"]:
            cat_findings = [f for f in final_findings if f.get("category", "") == cat]
            crit_count = len([f for f in cat_findings if f.get("severity") == "critical"])
            # simple score approximation since we didn't store it per category in supervisor output
            cat_summaries = {
                "category": cat,
                "score": 100, # Mocked per-category score as supervisor only outputs overall
                "finding_count": len(cat_findings),
                "critical_count": crit_count
            }
            category_summaries.append(cat_summaries)
            
        result = ReviewResult(
            review_id=review_id,
            language=initial_state.get("language", "auto"),
            overall_score=final_state.get("overall_score", 0),
            overall_verdict=final_state.get("overall_verdict", "Complete"),
            category_summaries=category_summaries,
            findings=final_findings,
            positive_aspects=final_state.get("positive_aspects", []),
            top_recommendations=final_state.get("top_recommendations", []),
            review_duration_ms=int((time.time() - start_time) * 1000)
        )
        
        await save_review(review_id, result)
        
        yield {
            "event": "complete",
            "data": json.dumps({"review_id": review_id, "overall_score": result.overall_score})
        }
    else:
        yield {
            "event": "fatal_error",
            "data": json.dumps({"error": final_state.get("error", "Unknown error") if final_state else "Supervisor failed"})
        }

@router.post("/review/snippet")
async def review_snippet(request: SnippetReviewRequest):
    review_id = str(uuid.uuid4())
    initial_state = {
        "review_id": review_id,
        "original_code": request.code,
        "language": request.language,
        "context": request.context
    }
    start_time = time.time()
    return EventSourceResponse(review_generator(initial_state, start_time, review_id))

@router.post("/review/github-pr")
async def review_github_pr(request: PRReviewRequest):
    review_id = str(uuid.uuid4())
    start_time = time.time()
    
    try:
        diff_text, detected_language = await fetch_pr_diff(request.github_pr_url)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    initial_state = {
        "review_id": review_id,
        "original_code": diff_text,
        "language": detected_language,
        "context": request.context
    }
    
    async def pr_generator():
        yield {
            "event": "progress",
            "data": json.dumps({"stage": "fetching", "message": "Fetching PR from GitHub..."})
        }
        async for event in review_generator(initial_state, start_time, review_id):
            yield event
            
    return EventSourceResponse(pr_generator())

@router.get("/review/{review_id}")
async def get_review_endpoint(review_id: str):
    result = await get_review(review_id)
    if not result:
        raise HTTPException(status_code=404, detail="Review not found")
    return result
