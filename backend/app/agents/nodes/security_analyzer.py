import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.agents.state import ReviewState
from app.prompts.security_prompt import SECURITY_PROMPT_TEMPLATE
from app.config import settings
from app.models.review_response import Category

async def security_analyzer_node(state: ReviewState):
    code = state.get("original_code", "")
    language = state.get("language", "python")
    context = state.get("context", "")
    rag_context = state.get("rag_context", [])
    
    rag_context_str = "\n".join(rag_context) if rag_context else "None"
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.1
    )
    
    prompt = PromptTemplate.from_template(SECURITY_PROMPT_TEMPLATE)
    chain = prompt | llm
    
    try:
        response = await chain.ainvoke({
            "language": language,
            "context": context,
            "rag_context": rag_context_str,
            "code": code
        })
        
        text = response.content.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
            
        result = json.loads(text)
        findings = result.get("findings", [])
        
        for f in findings:
            f["category"] = Category.security.value
            
        return {
            "security_findings": findings,
            "positive_aspects": result.get("positive_aspects", [])
        }
    except Exception as e:
        print(f"Security analyzer failed: {e}")
        return {
            "security_findings": [],
            "positive_aspects": []
        }
