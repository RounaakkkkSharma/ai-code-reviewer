import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.agents.state import ReviewState
from app.prompts.supervisor_prompt import SUPERVISOR_PROMPT_TEMPLATE
from app.config import settings
import uuid

async def supervisor_node(state: ReviewState):
    bug_findings = state.get("bug_findings", [])
    security_findings = state.get("security_findings", [])
    performance_findings = state.get("performance_findings", [])
    style_findings = state.get("style_findings", [])
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.1
    )
    
    prompt = PromptTemplate.from_template(SUPERVISOR_PROMPT_TEMPLATE)
    chain = prompt | llm
    
    try:
        response = await chain.ainvoke({
            "bug_findings": json.dumps(bug_findings),
            "security_findings": json.dumps(security_findings),
            "performance_findings": json.dumps(performance_findings),
            "style_findings": json.dumps(style_findings),
        })
        
        text = response.content.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
            
        result = json.loads(text)
        
        final_findings = result.get("final_findings", [])
        
        # Deduplicate + Assign IDs + Sort
        # sorting map
        severity_val = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}
        
        final_findings.sort(key=lambda x: severity_val.get(x.get("severity", "info"), 0), reverse=True)
        
        # Assign IDs
        counters = {"bug": 1, "security": 1, "performance": 1, "style": 1}
        for f in final_findings:
            cat = f.get("category", "bug").lower()
            if cat not in counters: cat = "bug"
            f["id"] = f"{cat.upper()}-{counters[cat]:03d}"
            counters[cat] += 1
            
        # Calculate scores
        pts_map = {"critical": 25, "high": 15, "medium": 8, "low": 3, "info": 1}
        
        cat_scores = {"bug": 100, "security": 100, "performance": 100, "style": 100}
        
        for f in final_findings:
            cat = f.get("category", "bug").lower()
            sev = f.get("severity", "info").lower()
            if cat in cat_scores:
                cat_scores[cat] -= pts_map.get(sev, 0)
                if cat_scores[cat] < 0: cat_scores[cat] = 0
                
        overall_score = int(
            cat_scores["bug"] * 0.35 + 
            cat_scores["security"] * 0.35 + 
            cat_scores["performance"] * 0.20 + 
            cat_scores["style"] * 0.10
        )
            
        return {
            "final_findings": final_findings,
            "overall_verdict": result.get("overall_verdict", "Code review complete."),
            "top_recommendations": result.get("top_recommendations", []),
            "overall_score": overall_score,
            "is_complete": True
        }
    except Exception as e:
        print(f"Supervisor failed: {e}")
        return {
            "error": str(e),
            "is_complete": True
        }
