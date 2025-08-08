# main.py - Enhanced FastAPI Backend with Ollama LLM Integration and Database Support

import os
import json
import tempfile
import shutil
import asyncio
import logging
import uuid
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
import subprocess

# Import your existing modules
try:
    from whisper_engine import WhisperEngine
    from speechbrain_engine import SpeechBrainEngine
    from basic_audio_preprocessor import BasicAudioPreprocessor
except ImportError as e:
    print(f"Warning: Could not import engines: {e}")
    WhisperEngine = None
    SpeechBrainEngine = None
    BasicAudioPreprocessor = None

# Import database components
try:
    from database.models import db_manager, AnalysisPrompt
    from api.prompt_routes import router as prompt_router
    DATABASE_AVAILABLE = True
    print("✅ Database components loaded successfully")
except ImportError as e:
    print(f"⚠️ Warning: Could not import database components: {e}")
    print("   Database functionality will be disabled")
    DATABASE_AVAILABLE = False
    db_manager = None
    AnalysisPrompt = None
    prompt_router = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Speech Diarization API with LLM", version="2.1.0")

# Pydantic models for request/response
class LLMProcessRequest(BaseModel):
    transcript_data: Dict
    prompt_type: str
    custom_prompt: str = ""
    max_tokens: int = 2000

class ChatMessage(BaseModel):
    message: str
    session_id: str
    context_type: str = "general"  # "transcript", "general"

class LLMResponse(BaseModel):
    response: str
    model: str
    prompt_type: str
    transcript_length: int
    processing_time: float

# Ollama Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3:latest") 
MAX_CHUNK_SIZE = 8000  # Characters per chunk for long transcripts

# Thread pool for concurrent processing
executor = ThreadPoolExecutor(max_workers=4)

# In-memory storage for sessions (use Redis in production)
active_sessions = {}
processing_status = {}

# Predefined LLM prompts (fallback when database is not available)
LLM_PROMPTS = {
    "summary": {
        "name": "📋 Conversation Summary",
        "description": "Generate a comprehensive summary of the conversation",
        "prompt": """Analyze this transcript and provide a comprehensive summary:

{transcript}

Please provide:
1. **Main Topics Discussed**: Key themes and subjects
2. **Key Points**: Important information shared
3. **Action Items**: Any tasks, decisions, or next steps mentioned
4. **Participants' Contributions**: Brief overview of what each speaker contributed

Format your response clearly with headers and bullet points."""
    },
    
    "action_items": {
        "name": "✅ Action Items & Tasks",
        "description": "Extract action items, tasks, and decisions",
        "prompt": """Extract all action items, tasks, and decisions from this transcript:

{transcript}

Provide:
1. **Action Items**: Specific tasks mentioned
2. **Decisions Made**: Clear decisions or conclusions
3. **Deadlines**: Any time-sensitive items
4. **Responsible Parties**: Who is assigned to what (if mentioned)
5. **Follow-up Required**: Items needing further discussion

Be specific and actionable."""
    },
    
    "key_insights": {
        "name": "🔍 Key Insights",
        "description": "Identify important insights and takeaways",
        "prompt": """Analyze this transcript for key insights and important information:

{transcript}

Identify:
1. **Key Insights**: Most important discoveries or realizations
2. **Interesting Points**: Notable or surprising information
3. **Patterns**: Recurring themes or topics
4. **Concerns Raised**: Problems or issues mentioned
5. **Opportunities**: Potential opportunities discussed

Focus on the most valuable and actionable insights."""
    },
    
    "meeting_notes": {
        "name": "📝 Meeting Notes",
        "description": "Create structured meeting notes",
        "prompt": """Convert this transcript into professional meeting notes:

{transcript}

Structure as:
1. **Meeting Overview**: Brief description
2. **Attendees**: Speakers identified
3. **Agenda Items**: Topics covered
4. **Discussion Points**: Key discussions per topic
5. **Decisions**: Conclusions reached
6. **Action Items**: Next steps with owners
7. **Next Meeting**: If mentioned

Use professional formatting suitable for distribution."""
    },
    
    "questions_answers": {
        "name": "❓ Q&A Extraction",
        "description": "Extract questions asked and answers given",
        "prompt": """Extract all questions and answers from this transcript:

{transcript}

Format as:
**Q: [Question asked]**
A: [Answer provided]

Include:
- All direct questions asked by any speaker
- The corresponding answers or responses
- Note if questions were left unanswered
- Identify who asked what (if clear from context)

Focus on substantive questions and answers, not small talk."""
    },
    
    "sentiment_analysis": {
        "name": "😊 Sentiment & Tone",
        "description": "Analyze the sentiment and tone of the conversation",
        "prompt": """Analyze the sentiment and tone of this conversation:

{transcript}

Provide:
1. **Overall Sentiment**: Positive, negative, or neutral with explanation
2. **Tone Analysis**: Professional, casual, tense, collaborative, etc.
3. **Speaker Sentiments**: Individual sentiment for each speaker
4. **Emotional Moments**: Any notable emotional peaks or concerns
5. **Collaboration Level**: How well participants worked together

Be objective and specific in your analysis."""
    }
}

# Tailscale Integration
class TailscaleManager:
    def get_tailscale_ip(self):
        """Get this machine's Tailscale IP"""
        try:
            result = subprocess.run(["tailscale", "ip", "-4"], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return result.stdout.strip()
        except Exception as e:
            logger.error(f"Failed to get Tailscale IP: {e}")
        return None
    
    def is_connected(self):
        """Check if Tailscale is connected"""
        try:
            result = subprocess.run(["tailscale", "status"], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0 and "logged out" not in result.stdout.lower()
        except Exception:
            return False

tailscale_manager = TailscaleManager()

# Enable CORS for distributed deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include database router if available
if DATABASE_AVAILABLE and prompt_router:
    app.include_router(prompt_router)
    print("✅ Database routes included")

# Initialize components
try:
    pipeline = None
    print("Initializing Enhanced Speech Diarization Pipeline...")
    from run import GDPRCompliantPipeline
    pipeline = GDPRCompliantPipeline(
        whisper_model="base",  # Changed to smaller model for compatibility
        device="auto",
        enable_preprocessing=True
    )
    print("Pipeline initialized successfully")
except Exception as e:
    print(f"Warning: Pipeline initialization failed: {e}")
    print("Some features may not be available")

# Ensure directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
os.makedirs("static", exist_ok=True)

# Ollama Integration Functions
async def check_ollama_status():
    """Check if Ollama is running and model is available"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [model["name"] for model in models]
            return {
                "status": "connected",
                "available_models": model_names,
                "current_model": DEFAULT_MODEL,
                "model_available": DEFAULT_MODEL in model_names
            }
    except Exception as e:
        logger.error(f"Ollama status check failed: {e}")
    
    return {
        "status": "disconnected",
        "available_models": [],
        "current_model": DEFAULT_MODEL,
        "model_available": False
    }

def chunk_transcript(transcript: str) -> List[str]:
    """Split long transcript into manageable chunks"""
    if len(transcript) <= MAX_CHUNK_SIZE:
        return [transcript]
    
    chunks = []
    words = transcript.split()
    current_chunk = []
    current_length = 0
    
    for word in words:
        word_length = len(word) + 1  # +1 for space
        
        if current_length + word_length > MAX_CHUNK_SIZE and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_length = word_length
        else:
            current_chunk.append(word)
            current_length += word_length
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

async def process_with_ollama(prompt: str, model: str = DEFAULT_MODEL) -> Dict:
    """Process prompt with Ollama LLM"""
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 40
            }
        }
        
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=300  # 5 minutes timeout
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Ollama API error: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Ollama processing failed: {e}")
        raise

async def process_chunked_transcript(chunks: List[str], prompt_template: str, model: str = DEFAULT_MODEL) -> str:
    """Process transcript chunks and combine results"""
    if len(chunks) == 1:
        # Single chunk - process directly
        full_prompt = prompt_template.format(transcript=chunks[0])
        result = await process_with_ollama(full_prompt, model)
        return result.get("response", "")
    
    # Multiple chunks - process each and combine
    chunk_results = []
    
    for i, chunk in enumerate(chunks):
        chunk_prompt = f"""This is part {i+1} of {len(chunks)} of a longer transcript. 
Analyze this section: {chunk}

{prompt_template.format(transcript=chunk)}

Note: This is a partial analysis. Focus on this section only."""
        
        try:
            result = await process_with_ollama(chunk_prompt, model)
            chunk_results.append(f"**Part {i+1}:**\n{result.get('response', '')}")
        except Exception as e:
            chunk_results.append(f"**Part {i+1}:** Error processing - {str(e)}")
    
    # Combine all results
    combined_results = "\n\n".join(chunk_results)
    
    # Create final summary
    summary_prompt = f"""Based on these partial analyses of a longer conversation:

{combined_results}

Please provide a consolidated analysis that combines insights from all parts. Remove redundancy and create a cohesive summary."""
    
    try:
        final_result = await process_with_ollama(summary_prompt, model)
        return final_result.get("response", combined_results)
    except Exception:
        return combined_results

def get_prompts_from_database():
    """Get prompts from database or fallback to hardcoded ones"""
    if not DATABASE_AVAILABLE or not db_manager:
        return LLM_PROMPTS
    
    try:
        session = db_manager.get_session()
        try:
            prompts = session.query(AnalysisPrompt).filter(AnalysisPrompt.is_active == True).all()
            
            db_prompts = {}
            for prompt in prompts:
                db_prompts[prompt.key] = {
                    "name": prompt.name,
                    "description": prompt.description,
                    "prompt": prompt.prompt_template,
                    "max_tokens": prompt.max_tokens,
                    "usage_count": prompt.usage_count
                }
            
            # If database has prompts, use them; otherwise fallback to hardcoded
            return db_prompts if db_prompts else LLM_PROMPTS
            
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Database error when fetching prompts: {e}")
        return LLM_PROMPTS

# API Endpoints
@app.on_event("startup")
async def startup_event():
    """Display connection information on startup and initialize database"""
    print("🚀 Starting Enhanced Speech Diarization API...")
    
    # Initialize database if available
    if DATABASE_AVAILABLE and db_manager:
        try:
            db_manager.create_tables()
            db_manager.init_default_prompts()
            print("✅ Database initialized successfully")
        except Exception as e:
            print(f"⚠️ Database initialization failed: {e}")
    
    tailscale_ip = tailscale_manager.get_tailscale_ip()
    is_connected = tailscale_manager.is_connected()
    ollama_status = await check_ollama_status()
    
    print("=" * 80)
    print("ENHANCED SPEECH DIARIZATION + LLM BACKEND SERVER")
    print("=" * 80)
    print(f"Local URL: http://localhost:8888")
    print(f"Local Network: http://192.168.x.x:8888")
    
    if is_connected and tailscale_ip:
        print(f"Tailscale URL: http://{tailscale_ip}:8888")
        print(f"Tailscale IP: {tailscale_ip}")
        print("✅ Tailscale connected - accessible from remote devices")
    else:
        print("❌ Tailscale not connected - only local access available")
    
    print(f"📚 API Documentation: http://localhost:8888/docs")
    print(f"🎯 Health Check: http://localhost:8888/health")
    
    # Database status
    if DATABASE_AVAILABLE:
        print("🗄️ Database: Connected (SQLite)")
        print("📝 Prompt Management: Available")
    else:
        print("⚠️ Database: Not available (using fallback prompts)")
    
    # Ollama status
    if ollama_status["status"] == "connected":
        print(f"🤖 Ollama LLM: Connected ({ollama_status['current_model']})")
        if not ollama_status["model_available"]:
            print(f"⚠️  Model {DEFAULT_MODEL} not found. Available: {ollama_status['available_models']}")
    else:
        print("❌ Ollama LLM: Disconnected")
        print("   Start Ollama: ollama serve")
        print(f"   Pull model: ollama pull {DEFAULT_MODEL}")
    
    print("=" * 80)

@app.get("/health")
async def health_check():
    """Enhanced health check with all system status"""
    tailscale_ip = tailscale_manager.get_tailscale_ip()
    is_connected = tailscale_manager.is_connected()
    ollama_status = await check_ollama_status()
    
    return {
        "status": "healthy",
        "message": "Enhanced backend server running",
        "timestamp": datetime.now().isoformat(),
        "database": {
            "available": DATABASE_AVAILABLE,
            "status": "connected" if DATABASE_AVAILABLE else "fallback_mode"
        },
        "tailscale": {
            "connected": is_connected,
            "ip": tailscale_ip,
            "url": f"http://{tailscale_ip}:8888" if tailscale_ip else None
        },
        "features": {
            "pipeline_available": pipeline is not None,
            "whisper_model": getattr(pipeline, 'whisper_model', 'not loaded'),
            "preprocessing": getattr(pipeline, 'enable_preprocessing', False)
        },
        "llm": ollama_status
    }

@app.get("/api/llm-prompts")
async def get_llm_prompts():
    """Get available LLM prompts (from database or fallback)"""
    prompts = get_prompts_from_database()
    
    return {
        "predefined_prompts": prompts,
        "model_info": {
            "current_model": DEFAULT_MODEL,
            "max_chunk_size": MAX_CHUNK_SIZE
        },
        "source": "database" if DATABASE_AVAILABLE and prompts != LLM_PROMPTS else "fallback"
    }

@app.post("/api/upload-audio")
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    language: str = Form(""),
    apply_preprocessing: str = Form("true"),
    num_speakers: str = Form("")
):
    """Enhanced upload and process audio file with session management"""
    
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not available")
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Convert parameters
    language = language if language else None
    apply_preprocessing = apply_preprocessing.lower() == "true"
    num_speakers = int(num_speakers) if num_speakers else None
    
    print(f"Processing: {file.filename} (Session: {session_id})")
    print(f"Language: {language}, Preprocessing: {apply_preprocessing}, Speakers: {num_speakers}")
    
    # Save uploaded file
    temp_file_path = Path("uploads") / f"temp_{session_id}_{file.filename}"
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Initialize processing status
        processing_status[session_id] = {
            "status": "processing",
            "progress": 0,
            "message": "Starting audio processing...",
            "start_time": datetime.now().isoformat()
        }
        
        # Process in background
        background_tasks.add_task(
            process_audio_background,
            session_id,
            temp_file_path,
            file.filename,
            language,
            apply_preprocessing,
            num_speakers
        )
        
        return {
            "status": "accepted",
            "message": "Audio processing started",
            "session_id": session_id,
            "file_info": {
                "filename": file.filename,
                "size": file.size
            }
        }
        
    except Exception as e:
        logger.error(f"Upload processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_audio_background(
    session_id: str,
    temp_file_path: Path,
    filename: str,
    language: Optional[str],
    apply_preprocessing: bool,
    num_speakers: Optional[int]
):
    """Background task for audio processing"""
    try:
        # Update status
        processing_status[session_id].update({
            "progress": 10,
            "message": "Processing audio with AI models..."
        })
        
        # Process without GDPR consent (simplified for deployment)
        results = pipeline.process_audio(
            audio_path=temp_file_path,
            language=language,
            apply_preprocessing=apply_preprocessing,
            num_speakers=num_speakers
        )
        
        # Update status
        processing_status[session_id].update({
            "progress": 80,
            "message": "Saving results..."
        })
        
        # Save results
        output_dir = Path("outputs")
        base_name = Path(filename).stem
        
        # Save JSON results
        json_path = output_dir / f"{base_name}_{session_id}_results.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        
        # Save transcript as TXT
        txt_path = output_dir / f"{base_name}_{session_id}_transcript.txt"
        with open(txt_path, 'w', encoding='utf-8') as f:
            for segment in results['segments']:
                start_min, start_sec = divmod(segment['start'], 60)
                end_min, end_sec = divmod(segment['end'], 60)
                f.write(f"[{int(start_min):02d}:{int(start_sec):02d} - {int(end_min):02d}:{int(end_sec):02d}] ")
                f.write(f"{segment['speaker']}: {segment['text']}\n")
        
        # Store session results
        active_sessions[session_id] = {
            "results": results,
            "files": {
                "json": str(json_path),
                "txt": str(txt_path)
            },
            "processed_at": datetime.now().isoformat()
        }
        
        # Final status update
        processing_status[session_id].update({
            "status": "completed",
            "progress": 100,
            "message": "Processing completed successfully",
            "completed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Background processing error: {e}")
        processing_status[session_id].update({
            "status": "failed",
            "progress": 0,
            "message": f"Processing failed: {str(e)}",
            "error": str(e)
        })
    
    finally:
        # Clean up uploaded file
        if temp_file_path.exists():
            temp_file_path.unlink()

@app.get("/api/processing-status/{session_id}")
async def get_processing_status(session_id: str):
    """Get processing status for a session"""
    if session_id not in processing_status:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return processing_status[session_id]

@app.get("/api/results/{session_id}")
async def get_results(session_id: str):
    """Get processing results for a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Results not found")
    
    return active_sessions[session_id]

@app.post("/api/llm-process")
async def process_with_llm_db(request: LLMProcessRequest):
    """Process transcript with LLM using database prompts"""
    ollama_status = await check_ollama_status()
    
    if ollama_status["status"] != "connected":
        raise HTTPException(
            status_code=503, 
            detail="LLM service unavailable. Please start Ollama server."
        )
    
    if not ollama_status["model_available"]:
        raise HTTPException(
            status_code=503,
            detail=f"Model {DEFAULT_MODEL} not available. Please pull the model."
        )
    
    session = None
    if DATABASE_AVAILABLE and db_manager:
        session = db_manager.get_session()
    
    try:
        # Extract transcript text
        transcript_text = ""
        for segment in request.transcript_data.get("segments", []):
            speaker = segment.get("speaker", "Unknown")
            text = segment.get("text", "")
            transcript_text += f"{speaker}: {text}\n"
        
        if not transcript_text.strip():
            raise HTTPException(status_code=400, detail="No transcript data found")
        
        # Determine prompt and max_tokens
        max_tokens = request.max_tokens
        
        if request.prompt_type == "custom":
            if not request.custom_prompt:
                raise HTTPException(status_code=400, detail="Custom prompt is required")
            prompt_template = request.custom_prompt
            if "{transcript}" not in prompt_template:
                prompt_template += "\n\nTranscript:\n{transcript}"
        else:
            # Try to get prompt from database first
            prompt_template = None
            
            if DATABASE_AVAILABLE and session and AnalysisPrompt:
                try:
                    prompt = session.query(AnalysisPrompt).filter(
                        AnalysisPrompt.key == request.prompt_type,
                        AnalysisPrompt.is_active == True
                    ).first()
                    
                    if prompt:
                        prompt_template = prompt.prompt_template
                        max_tokens = prompt.max_tokens
                        
                        # Increment usage count
                        prompt.usage_count += 1
                        session.commit()
                        logger.info(f"Using database prompt: {request.prompt_type}")
                    
                except Exception as e:
                    logger.error(f"Database prompt lookup failed: {e}")
            
            # Fallback to hardcoded prompts
            if not prompt_template:
                if request.prompt_type not in LLM_PROMPTS:
                    raise HTTPException(status_code=400, detail="Invalid prompt type")
                prompt_template = LLM_PROMPTS[request.prompt_type]["prompt"]
                logger.info(f"Using fallback prompt: {request.prompt_type}")
        
        # Process with chunking if needed
        chunks = chunk_transcript(transcript_text)
        logger.info(f"Processing transcript in {len(chunks)} chunk(s)")
        
        start_time = datetime.now()
        response_text = await process_chunked_transcript(chunks, prompt_template, DEFAULT_MODEL)
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return LLMResponse(
            response=response_text,
            model=DEFAULT_MODEL,
            prompt_type=request.prompt_type,
            transcript_length=len(transcript_text),
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM processing error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM processing failed: {str(e)}")
    finally:
        if session:
            session.close()

@app.post("/api/chat")
async def chat_with_llm(message: ChatMessage):
    """Chat with LLM (general purpose or context-aware)"""
    ollama_status = await check_ollama_status()
    
    if ollama_status["status"] != "connected":
        raise HTTPException(
            status_code=503, 
            detail="LLM service unavailable"
        )
    
    try:
        # Build context-aware prompt
        if message.context_type == "transcript" and message.session_id in active_sessions:
            session_data = active_sessions[message.session_id]
            transcript_text = ""
            for segment in session_data["results"].get("segments", []):
                speaker = segment.get("speaker", "Unknown")
                text = segment.get("text", "")
                transcript_text += f"{speaker}: {text}\n"
            
            chat_prompt = f"""You are an AI assistant analyzing a conversation transcript. 

Transcript:
{transcript_text[:MAX_CHUNK_SIZE]}

User Question: {message.message}

Please answer based on the transcript content above."""
        else:
            chat_prompt = f"""You are a helpful AI assistant for a speech diarization and transcription platform.

User: {message.message}

Please provide a helpful response."""
        
        result = await process_with_ollama(chat_prompt, DEFAULT_MODEL)
        
        return {
            "response": result.get("response", ""),
            "model": DEFAULT_MODEL,
            "session_id": message.session_id,
            "context_type": message.context_type
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/api/download/{session_id}/{filename}")
async def download_file(session_id: str, filename: str):
    """Download processed files"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = active_sessions[session_id]
    
    if filename.endswith('.json'):
        file_path = session_data["files"]["json"]
    elif filename.endswith('.txt'):
        file_path = session_data["files"]["txt"]
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

# Cleanup endpoint for sessions
@app.delete("/api/session/{session_id}")
async def cleanup_session(session_id: str):
    """Clean up session data and files"""
    try:
        if session_id in active_sessions:
            session_data = active_sessions[session_id]
            # Delete files
            for file_path in session_data["files"].values():
                try:
                    Path(file_path).unlink()
                except FileNotFoundError:
                    pass
            del active_sessions[session_id]
        
        if session_id in processing_status:
            del processing_status[session_id]
        
        return {"message": "Session cleaned up successfully"}
        
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail="Cleanup failed")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8888, reload=False)