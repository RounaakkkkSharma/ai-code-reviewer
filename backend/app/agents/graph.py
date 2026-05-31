from functools import lru_cache
from langgraph.graph import StateGraph, END
from langgraph.constants import Send
from app.agents.state import ReviewState
from app.agents.nodes.preprocessor import preprocessor_node
from app.agents.nodes.bug_detector import bug_detector_node
from app.agents.nodes.security_analyzer import security_analyzer_node
from app.agents.nodes.performance_analyzer import performance_analyzer_node
from app.agents.nodes.style_checker import style_checker_node
from app.agents.nodes.supervisor import supervisor_node
from app.agents.nodes.fast_reviewer import fast_reviewer_node

def route_after_preprocess(state: ReviewState):
    """Routes execution to either fast_reviewer or selected specialist agents."""
    mode = state.get("review_mode") or "deep"
    if mode == "fast":
        return "fast_reviewer"
        
    # Deep mode: fan out to selected categories in parallel
    selected_categories = state.get("categories") or ["bug", "security", "performance", "style"]
    sends = []
    if "bug" in selected_categories:
        sends.append(Send("bug_detector", state))
    if "security" in selected_categories:
        sends.append(Send("security_analyzer", state))
    if "performance" in selected_categories:
        sends.append(Send("performance_analyzer", state))
    if "style" in selected_categories:
        sends.append(Send("style_checker", state))
        
    # If no valid categories selected, fallback to bug_detector
    if not sends:
        sends.append(Send("bug_detector", state))
        
    return sends

@lru_cache()
def build_graph():
    graph = StateGraph(ReviewState)
    
    # Add nodes
    graph.add_node("preprocessor", preprocessor_node)
    graph.add_node("bug_detector", bug_detector_node)
    graph.add_node("security_analyzer", security_analyzer_node)
    graph.add_node("performance_analyzer", performance_analyzer_node)
    graph.add_node("style_checker", style_checker_node)
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("fast_reviewer", fast_reviewer_node)
    
    # Set entry point
    graph.set_entry_point("preprocessor")
    
    # Route after preprocessor
    graph.add_conditional_edges(
        "preprocessor",
        route_after_preprocess,
        ["bug_detector", "security_analyzer", "performance_analyzer", "style_checker", "fast_reviewer"]
    )
    
    # Join nodes for deep mode
    graph.add_edge("bug_detector", "supervisor")
    graph.add_edge("security_analyzer", "supervisor")
    graph.add_edge("performance_analyzer", "supervisor")
    graph.add_edge("style_checker", "supervisor")
    graph.add_edge("supervisor", END)
    
    # Direct route for fast mode
    graph.add_edge("fast_reviewer", END)
    
    return graph.compile()
