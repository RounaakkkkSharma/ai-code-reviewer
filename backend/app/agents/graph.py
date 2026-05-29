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

def distribute_to_agents(state: ReviewState):
    """Fans out execution to the 4 specialist agents in parallel."""
    return [
        Send("bug_detector", state),
        Send("security_analyzer", state),
        Send("performance_analyzer", state),
        Send("style_checker", state),
    ]

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
    
    # Set entry point
    graph.set_entry_point("preprocessor")
    
    # Fan out using Send API
    graph.add_conditional_edges(
        "preprocessor",
        distribute_to_agents,
        ["bug_detector", "security_analyzer", "performance_analyzer", "style_checker"]
    )
    
    # Join node
    graph.add_edge("bug_detector", "supervisor")
    graph.add_edge("security_analyzer", "supervisor")
    graph.add_edge("performance_analyzer", "supervisor")
    graph.add_edge("style_checker", "supervisor")
    
    graph.add_edge("supervisor", END)
    
    return graph.compile()
