# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# from typing import Any, List
# from gtts import gTTS
# from io import BytesIO
# import base64

# # ===== Existing chatbot imports and setup =====
# from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_community.vectorstores import Chroma
# from dotenv import load_dotenv
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_core.messages import HumanMessage, AIMessage
# from langchain_core.output_parsers import StrOutputParser
# from langchain_community.document_loaders import TextLoader

# load_dotenv()

# llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

# # Load docs
# loader = TextLoader("nabardDetails.txt", encoding="utf-8")
# docs = loader.load()
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
# splits = text_splitter.split_documents(docs)

# # Embeddings
# embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
# vectorstore = Chroma.from_documents(splits, embeddings)
# retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# # Prompt
# prompt = ChatPromptTemplate.from_messages(
#     [
#         (
#             "system",
#             "You are an assistant helping with NABARD and MRV-related queries. "
#             "Answer clearly and naturally based on your knowledge. "
#             "Do not mention that you are referencing documents or any specific sources. "
#             "Provide direct, helpful answers without stating where the information comes from."
#         ),
#         MessagesPlaceholder(variable_name="history"),
#         ("human", "Context:\n{context}\n\nQuestion: {question}")
#     ]
# )

# def format_docs(docs):
#     return "\n\n".join(d.page_content for d in docs)

# chain = prompt | llm | StrOutputParser()
# history: List = []

# # ===== FastAPI Setup =====
# app = FastAPI()

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # allow frontend
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class ChatRequest(BaseModel):
#     message: str
#     history: Any = []

# class SpeakRequest(BaseModel):
#     message: str

# @app.post("/chat")
# def chat(request: ChatRequest):
#     query = request.message
#     docs = retriever.invoke(query)
#     context = format_docs(docs)
#     reply = chain.invoke({"history": history, "context": context, "question": query})
    
#     # Update history
#     history.append(HumanMessage(content=query))
#     history.append(AIMessage(content=reply))
    
#     return {"data": {"reply": reply}}

# @app.post("/speak")
# def speak(request: SpeakRequest):
#     """Generate TTS audio and return as binary stream"""
#     try:
#         # Generate TTS
#         tts = gTTS(text=request.message, lang="en")
        
#         # Create BytesIO buffer
#         audio_buffer = BytesIO()
#         tts.write_to_fp(audio_buffer)
#         audio_buffer.seek(0)
        
#         # Return as streaming response with proper headers
#         return StreamingResponse(
#             BytesIO(audio_buffer.read()), 
#             media_type="audio/mpeg",
#             headers={
#                 "Content-Disposition": "attachment; filename=speech.mp3",
#                 "Cache-Control": "no-cache"
#             }
#         )
#     except Exception as e:
#         print(f"TTS Error: {e}")
#         # Return empty audio on error
#         return StreamingResponse(
#             BytesIO(b""), 
#             media_type="audio/mpeg"
#         )

# # Alternative endpoint that returns base64 (if you prefer this approach)
# @app.post("/speak-base64")
# def speak_base64(request: SpeakRequest):
#     """Generate TTS audio and return as base64"""
#     try:
#         tts = gTTS(text=request.message, lang="en")
#         audio_buffer = BytesIO()
#         tts.write_to_fp(audio_buffer)
#         audio_buffer.seek(0)
        
#         # Encode to base64
#         audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")
        
#         return {"audio_base64": audio_base64}
#     except Exception as e:
#         print(f"TTS Error: {e}")
#         return {"audio_base64": ""}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from gtts import gTTS
from io import BytesIO
import requests
from bs4 import BeautifulSoup
import re
import time
from typing import Optional
import json

# # Graceful handling of langdetect import
# try:
#     from langdetect import detect
#     LANGDETECT_AVAILABLE = True
# except ImportError:
#     LANGDETECT_AVAILABLE = False
#     print("Warning: langdetect not installed. Language detection disabled. Install with: pip install langdetect")

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.vectorstores import Chroma
from langchain_core.tools import Tool
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.tools import DuckDuckGoSearchRun

SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
    'bn': 'Bengali', 
    'te': 'Telugu',
    'ta': 'Tamil',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'or': 'Odia',
    'as': 'Assamese',
    'ur': 'Urdu',
    'ne': 'Nepali'
}

LANGUAGE_PROMPTS = {
    'hi': "कृपया हिंदी में उत्तर दें।",
    'bn': "দয়া করে বাংলায় উত্তর দিন।",
    'te': "దయచేసి తెలుగులో జవాబు ఇవ్వండి।",
    'ta': "தயவுசெய்து தமிழில் பதிலளிக்கவும்।",
    'mr': "कृपया मराठीत उत्तर द्या।",
    'gu': "કૃપા કરીને ગુજરાતીમાં જવાબ આપો।",
    'kn': "ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ।",
    'ml': "ദയവായി മലയാളത്തിൽ ഉത്തരം നൽകുക।",
    'pa': "ਕਿਰਪਾ ਕਰਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।",
    'or': "ଦୟାକରି ଓଡିଆରେ ଉତ୍ତର ଦିଅନ୍ତୁ।",
    'as': "অনুগ্ৰহ কৰি অসমীয়াত উত্তৰ দিয়ক।",
    'ur': "برائے کرم اردو میں جواب دیں۔",
    'ne': "कृपया नेपालीमा जवाफ दिनुहोस्।"
}

def detect_language(text: str) -> str:
    """Detect language of input text"""
    if not LANGDETECT_AVAILABLE:

        hindi_chars = set('अआइईउऊएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ')
        bengali_chars = set('অআইঈউঊএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ')
        tamil_chars = set('அஆஇஈউஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறனஹ')
        telugu_chars = set('అఆఇఈఉఊఎఏఐఒఓఔకఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరలవశషసహ')
        
        text_chars = set(text)
        if hindi_chars & text_chars:
            return 'hi'
        elif bengali_chars & text_chars:
            return 'bn'
        elif tamil_chars & text_chars:
            return 'ta'
        elif telugu_chars & text_chars:
            return 'te'
        else:
            return 'en'
    
    try:
        detected = detect(text)
        return detected if detected in SUPPORTED_LANGUAGES else 'en'
    except:
        return 'en'

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

loader = TextLoader("nabardDetails.txt", encoding="utf-8")
docs = loader.load()
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,  # Increased for better context
    chunk_overlap=300,  # More overlap for continuity
    separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
)
splits = text_splitter.split_documents(docs)
nabard_vectorstore = Chroma.from_documents(splits, embeddings)
nabard_retriever = nabard_vectorstore.as_retriever(search_kwargs={"k": 6})  # More results

def enhanced_nabard_rag_search_tool(query: str, language: str = 'en') -> str:
    """Enhanced NABARD search with better context understanding"""
    try:
        # Analyze query for better search strategy
        analysis = analyze_and_enhance_query(query, language)
        search_query = analysis['enhanced_query']
        
        # Create context-aware search query
        context_keywords = "carbon farming agroforestry rice cultivation NABARD financing schemes"
        enhanced_query = f"{search_query} {context_keywords}"
        
        docs = nabard_retriever.invoke(enhanced_query)
        if not docs:
            # Try with original query if enhanced search fails
            docs = nabard_retriever.invoke(query)
            
        if not docs:
            return "No relevant NABARD information found. Please try web search for current information."
        
        # Rank documents by relevance and content quality
        context_parts = []
        for doc in docs:
            content = doc.page_content.strip()
            if content and len(content) > 50:  # Filter out very short content
                context_parts.append(content)
        
        if not context_parts:
            return "No relevant NABARD information found. Please try web search for current information."
            
        context = "\n\n".join(context_parts[:4])  # Top 4 most relevant
        
        # Add language instruction if not English
        lang_instruction = LANGUAGE_PROMPTS.get(language, "")
        
        return f"NABARD Knowledge Base Information:\n{context}\n\nLanguage: {lang_instruction}"
    except Exception as e:
        return f"Error in NABARD search: {str(e)}"

# ======================
# ENHANCED WEB SCRAPER
# ======================
def enhanced_web_scraper_tool(url: str, language: str = 'en') -> str:
    """Enhanced web scraper with better content extraction"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove noise elements
        for element in soup(["script", "style", "nav", "footer", "header", "aside", "advertisement", "ads"]):
            element.decompose()

        content = ""
        
        # Try multiple strategies to find main content
        main_selectors = [
            'main', 'article', '[role="main"]',
            '.content', '.main-content', '.article-content',
            '#content', '#main', '#article'
        ]
        
        main_content = None
        for selector in main_selectors:
            main_content = soup.select_one(selector)
            if main_content:
                break
        
        if main_content:
            # Extract structured content
            for element in main_content.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'div']):
                text = element.get_text(strip=True)
                if len(text) > 30 and not text.startswith(('Copyright', '©', 'Privacy', 'Terms')):
                    content += text + "\n\n"
        else:
            # Fallback to paragraph extraction
            for p in soup.find_all(['p', 'div']):
                text = p.get_text(strip=True)
                if len(text) > 30:
                    content += text + "\n\n"

        # Clean up content
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r'\s+', ' ', content)
        
        # Add language instruction
        lang_instruction = LANGUAGE_PROMPTS.get(language, "")
        
        return f"Web Content from {url}:\n{content[:6000]}\n\nLanguage: {lang_instruction}"
    except Exception as e:
        return f"Error scraping {url}: {str(e)}"


def enhanced_web_search_tool(query: str, language: str = 'en') -> str:
    """Enhanced web search with context-aware queries"""
    try:

        analysis = analyze_and_enhance_query(query, language)

        if analysis['is_pricing_query'] and analysis['is_carbon_credit_query']:
            enhanced_query = f"carbon credit prices India 2024 current market rates agroforestry rice farming"
        elif analysis['is_platform_query']:
            enhanced_query = f"carbon credit marketplace platform farmers India agroforestry"
        elif analysis['is_agroforestry_query']:
            enhanced_query = f"{query} agroforestry carbon sequestration India farmers income"
        elif analysis['is_rice_query']:
            enhanced_query = f"{query} rice cultivation methane reduction carbon credits AWD SRI"
        else:
            enhanced_query = f"{query} carbon markets agriculture India sustainable farming"
        
        search_tool = DuckDuckGoSearchRun()
        results = search_tool.run(enhanced_query)

        lang_instruction = LANGUAGE_PROMPTS.get(language, "")
        
        return f"Current Web Search Results:\n{results}\n\nLanguage: {lang_instruction}"
    except Exception as e:
        return f"Error in web search: {str(e)}"


def create_context_aware_tools(language: str = 'en'):
    """Create tools with language context"""
    return [
        Tool(
            name="nabard_rag_search",
            description="Search NABARD knowledge base for carbon farming, agroforestry, and agricultural finance information.",
            func=lambda query: enhanced_nabard_rag_search_tool(query, language)
        ),
        Tool(
            name="web_scraper",
            description="Scrape content from websites. Use for specific URLs only.",
            func=lambda url: enhanced_web_scraper_tool(url, language)
        ),
        Tool(
            name="web_search",
            description="Search the web for current information about carbon markets, agriculture, and sustainability.",
            func=lambda query: enhanced_web_search_tool(query, language)
        )
    ]

def analyze_and_enhance_query(query: str, language: str = 'en') -> dict:
    """Analyze user query and determine best response strategy"""
    
    query_lower = query.lower()
    
    # Define keyword categories for better detection
    platform_keywords = [
        'platform', 'website', 'site', 'service', 'portal', 'application', 'app',
        'what is this', 'about this', 'purpose of', 'what does this do',
        'how does this work', 'explain this', 'tell me about'
    ]
    
    pricing_keywords = [
        'price', 'cost', 'rate', 'pricing', 'expensive', 'cheap', 'fee',
        'charges', 'payment', 'money', 'earn', 'income', 'profit', 'value',
        'worth', 'market rate', 'current price', 'how much'
    ]
    
    carbon_credit_keywords = [
        'carbon credit', 'carbon market', 'carbon trading', 'carbon offset',
        'carbon certificate', 'emission reduction', 'co2 credit'
    ]
    
    agroforestry_keywords = [
        'agroforestry', 'tree plantation', 'forest farming', 'tree planting',
        'silviculture', 'farm forestry', 'trees on farm'
    ]
    
    rice_keywords = [
        'rice', 'paddy', 'rice cultivation', 'rice farming', 'methane reduction',
        'alternate wetting drying', 'awd', 'system of rice intensification', 'sri'
    ]
    
    nabard_keywords = [
        'nabard', 'national bank', 'agricultural development', 'rural development',
        'farm loan', 'agricultural finance', 'subsidy', 'scheme'
    ]

    analysis = {
        'is_platform_query': any(keyword in query_lower for keyword in platform_keywords),
        'is_pricing_query': any(keyword in query_lower for keyword in pricing_keywords),
        'is_carbon_credit_query': any(keyword in query_lower for keyword in carbon_credit_keywords),
        'is_agroforestry_query': any(keyword in query_lower for keyword in agroforestry_keywords),
        'is_rice_query': any(keyword in query_lower for keyword in rice_keywords),
        'is_nabard_query': any(keyword in query_lower for keyword in nabard_keywords),
        'language': language,
        'enhanced_query': query
    }
    
    # Enhance query based on analysis
    if analysis['is_platform_query']:
        analysis['enhanced_query'] = f"{query} carbon market platform agroforestry farmers"
        analysis['search_priority'] = ['platform_info', 'web_search']
    elif analysis['is_pricing_query'] and analysis['is_carbon_credit_query']:
        analysis['enhanced_query'] = f"{query} carbon credit prices India current market rates 2024"
        analysis['search_priority'] = ['web_search', 'nabard_rag_search']
    elif analysis['is_nabard_query']:
        analysis['enhanced_query'] = f"{query} NABARD schemes financing"
        analysis['search_priority'] = ['nabard_rag_search', 'web_search']
    else:
        analysis['search_priority'] = ['nabard_rag_search', 'web_search']
    
    return analysis

def get_enhanced_agent_prompt(language: str = 'en') -> ChatPromptTemplate:
    """Get language-aware agent prompt"""
    
    language_name = SUPPORTED_LANGUAGES.get(language, 'English')
    language_instruction = LANGUAGE_PROMPTS.get(language, "Please respond in English.")
    
    ENHANCED_CONTEXT = f"""
You are CarbonBot, an expert AI assistant specializing in carbon markets, agroforestry, and sustainable agriculture in India.

DETAILED PLATFORM INFORMATION:
- Platform Name: CarbonConnect India - Carbon Credit Marketplace
- Purpose: Connecting rural Indian farmers directly with global carbon credit buyers
- Core Services:
  * Agroforestry carbon projects (tree planting, farm forestry)
  * Rice cultivation carbon credits (methane reduction, AWD, SRI methods)
  * Carbon credit certification and verification
  * Direct market access for farmers to sell credits
  * Technical support and training for sustainable practices
  * NABARD scheme integration and financing support
- Target Users: Small and marginal farmers, agricultural cooperatives, FPOs, sustainability professionals
- Geographic Coverage: All states of India, with special focus on rural agricultural communities
- Technology: Blockchain-based carbon credit tracking, satellite monitoring, IoT sensors
- Partnerships: NABARD, State Agricultural Departments, International carbon markets

EXPERTISE AREAS & DETAILED KNOWLEDGE:
1. Carbon Credits & Pricing:
   - Current market rates vary: $5-50 per tonne CO2 depending on project type
   - Agroforestry credits: Usually $8-25 per tonne
   - Rice cultivation credits: $6-20 per tonne  
   - Prices fluctuate based on: project type, certification standard, market demand, geography
   - Major standards: Verra VCS, Gold Standard, Plan Vivo, CAR
   - Indian context: Focus on co-benefits like biodiversity, livelihood improvement

2. Agroforestry & Tree Planting:
   - Species selection based on climate zone and soil type
   - Planting density, spacing, maintenance requirements
   - Carbon sequestration rates: 5-20 tonnes CO2/hectare/year
   - Integration with existing farming systems
   - Revenue streams: timber, fruits, fodder + carbon credits

3. Rice Cultivation Techniques:
   - Alternate Wetting & Drying (AWD): 30-50% methane reduction
   - System of Rice Intensification (SRI): Better yields + lower emissions  
   - Direct seeded rice (DSR) vs transplanting
   - Organic practices and their carbon benefits

4. NABARD Schemes & Financing:
   - Specific schemes supporting agroforestry and sustainable agriculture
   - Interest rates, subsidies, repayment terms
   - Eligibility criteria and application processes
   - Success stories and case studies

LANGUAGE CONTEXT:
- Primary language: {language_name}
- {language_instruction}
- Use simple, farmer-friendly language
- Include local examples and case studies

DETAILED RESPONSE GUIDELINES:
1. For Platform Queries:
   - Explain the platform's purpose, features, and benefits clearly
   - Mention specific services like carbon credit marketplace, technical support
   - Include information about partnerships with NABARD and government
   - Explain how farmers can benefit and earn additional income

2. For Pricing Queries:
   - Always acknowledge that prices are variable and dynamic
   - Provide current range estimates with disclaimers
   - Explain factors affecting prices (project type, certification, market demand)
   - Suggest checking recent market data via web search
   - Include local context and examples

3. For Technical Queries:
   - Provide step-by-step guidance
   - Include practical tips and best practices
   - Mention resource requirements and potential challenges
   - Connect to relevant NABARD schemes or government support

4. Search Strategy:
   - ALWAYS search NABARD knowledge base first for agricultural/financing queries
   - Use web_search for current market prices, regulations, recent developments
   - Combine multiple sources for comprehensive answers
   - Verify information from reputable sources

RESPONSE TONE:
- Friendly and approachable (use "bhai/sister" occasionally for Indian context)
- Practical and actionable advice
- Encouraging about opportunities in carbon markets
- Honest about challenges and realistic expectations
- Culturally sensitive and India-focused
"""

    return ChatPromptTemplate.from_messages([
        ("system", ENHANCED_CONTEXT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad")
    ])

app = FastAPI(title="Multilingual Carbon Market Assistant", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = None

class SpeakRequest(BaseModel):
    message: str
    language: Optional[str] = None

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        detected_language = request.language or detect_language(request.message)

        tools = create_context_aware_tools(detected_language)
        agent_prompt = get_enhanced_agent_prompt(detected_language)
        
        agent = create_openai_functions_agent(llm, tools, agent_prompt)
        agent_executor = AgentExecutor(
            agent=agent, 
            tools=tools, 
            memory=memory, 
            verbose=True, 
            max_iterations=3,
            early_stopping_method="generate"
        )
        

        response = agent_executor.invoke({"input": request.message})
        reply = response.get("output", "I couldn't generate a response.")
        
        return {
            "data": {
                "reply": reply,
                "language": detected_language,
                "language_name": SUPPORTED_LANGUAGES.get(detected_language, "English")
            }
        }
    except Exception as e:
        error_message = "I'm experiencing technical issues. Please try again."
        if detected_language in LANGUAGE_PROMPTS:

            error_messages = {
                'hi': "मुझे तकनीकी समस्या हो रही है। कृपया फिर से कोशिश करें।",
                'bn': "আমার কারিগরি সমস্যা হচ্ছে। দয়া করে আবার চেষ্টা করুন।",
                'te': "నాకు సాంకేతిక సమస్యలు ఎదురవుతున్నాయి. దయచేసి మళ్ళీ ప్రయత్నించండి।",
                'ta': "எனக்கு தொழில்நுட்ப சிக்கல்கள் உள்ளன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்।"
            }
            error_message = error_messages.get(detected_language, error_message)
        
        return {
            "data": {
                "reply": error_message,
                "language": detected_language,
                "error": True
            }
        }

@app.post("/speak")
def speak(request: SpeakRequest):
    try:
        language = request.language or detect_language(request.message)

        tts_lang_map = {
            'hi': 'hi', 'bn': 'bn', 'te': 'te', 'ta': 'ta', 
            'mr': 'mr', 'gu': 'gu', 'kn': 'kn', 'ml': 'ml',
            'pa': 'pa', 'ur': 'ur', 'ne': 'ne'
        }
        tts_lang = tts_lang_map.get(language, 'en')
        
        tts = gTTS(text=request.message, lang=tts_lang, slow=False)
        audio_buffer = BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return StreamingResponse(
            BytesIO(audio_buffer.read()),
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"attachment; filename=speech_{language}.mp3"}
        )
    except Exception as e:
        return StreamingResponse(BytesIO(b""), media_type="audio/mpeg")
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)