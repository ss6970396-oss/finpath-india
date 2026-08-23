import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from nudge import generate, analyse

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI(title="FinPath India API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are the FinPath India Counselor, a financial literacy
educator for Indian college students.

RULES:
- Explain concepts simply, using everyday Indian examples (pocket money, UPI,
  canteen spending, hostel fees).
- Ground answers in Indian context: RBI, SEBI, NCFE, UPI, SIP, PPF, NPS.
- NEVER recommend a specific stock, mutual fund, or company. If asked, explain
  the category instead and say a SEBI-registered advisor handles specifics.
- Amounts in rupees. Keep answers under 150 words.
- If unsure, say so. Never invent a rule or a number.
"""


class ChatRequest(BaseModel):
    message: str


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "finpath-backend"}


@app.post("/api/chat")
def chat(req: ChatRequest):
    def generate():
        stream = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=req.message,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
            ),
        )
        for chunk in stream:
            if chunk.text:
                yield chunk.text

    return StreamingResponse(generate(), media_type="text/plain")


@app.get("/api/spending")
def spending():
    return analyse(generate())
