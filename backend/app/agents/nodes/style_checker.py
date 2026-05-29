import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from app.agents.state import ReviewState
from app.prompts.style_prompt import STYLE_PROMPT_TEMPLATE
from app.config import settings
from app.models.review_response import Category

async def style_checker_node(state: ReviewState):
    code = state.get("original_code", "")
    language = state.get("language", "python")
    context = state.get("context", "")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.1
    )
    
    prompt = PromptTemplate.from_template(STYLE_PROMPT_TEMPLATE)
    chain = prompt | llm
    
    try:
        response = await chain.ainvoke({
            "language": language,
            "context": context,
            "code": code
        })
        
        text = response.content.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
            
        result = json.loads(text)
        findings = result.get("findings", [])
        
        for f in findings:
            f["category"] = Category.style.value
            
        return {
            "style_findings": findings,
            "positive_aspects": result.get("positive_aspects", [])
        }
    except Exception as e:
        print(f"Style checker failed: {e}")
        return {
            "style_findings": [],
            "positive_aspects": []
        }
