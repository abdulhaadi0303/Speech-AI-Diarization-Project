# main.py - Enhanced Speech Diarization API with Database Integration (FIXED + RESTORED ENDPOINTS)

import os
import shutil
import uuid
import asyncio
import logging
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

import uvicorn
import httpx
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pydantic import BaseModel

# Database imports - FIXED
try:
    from database.models import DatabaseManager, AnalysisPrompt, AnalysisResult
    DATABASE_AVAILABLE = True
    db_manager = DatabaseManager()
    print("Database modules loaded successfully")
except ImportError as e:
    print(f"Database not available: {e}")
    DATABASE_AVAILABLE = False
    db_manager = None

# Prompt router import - FIXED
try:
    from api.prompt_routes import router as prompt_router
    PROMPT_ROUTER_AVAILABLE = True
    print("Prompt router imported successfully")
except ImportError as e:
    print(f"Prompt router not available: {e}")
    PROMPT_ROUTER_AVAILABLE = False
    prompt_router = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants - RESTORED FROM OLD CODE
DEFAULT_MODEL = "llama3:latest"
OLLAMA_BASE_URL = "http://localhost:11434"
MAX_CHUNK_SIZE = 7000  # Restored original value
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
STATIC_DIR = Path("static")

# Ensure directories exist
for directory in [UPLOAD_DIR, OUTPUT_DIR, STATIC_DIR]:
    directory.mkdir(exist_ok=True)

# Initialize components
pipeline = None

# Session storage
processing_sessions: Dict[str, Dict] = {}

# Pydantic model for LLM processing request
class LLMProcessRequest(BaseModel):
    transcript: str
    prompt_key: str
    custom_prompt: Optional[str] = None

# Fallback prompts (if database not available)
LLM_PROMPTS = {
    "summary": {
        "name": "Conversation Summary",
        "description": "Generate a comprehensive summary of the entire conversation",
        "prompt": """Analyze this conversation transcript and provide a comprehensive summary:

{transcript}

Provide:
1. **Main Topics**: Key subjects discussed
2. **Key Points**: Important details and insights
3. **Participants**: Speakers and their contributions
4. **Tone**: Overall conversation atmosphere
5. **Conclusions**: Any decisions or agreements reached

Keep the summary concise but comprehensive.""",
        "max_tokens": 2000,
        "usage_count": 0
    },
    "action_items": {
        "name": "Action Items & Tasks",
        "description": "Extract actionable tasks and commitments from the conversation",
        "prompt": """Extract all action items, tasks, and commitments from this transcript:

{transcript}

Format each action item as:
**Action**: [What needs to be done]
**Owner**: [Who is responsible]
**Deadline**: [When it's due, if mentioned]
**Status**: [New/In Progress/Completed]

Focus on concrete, actionable items that were explicitly mentioned or agreed upon.""",
        "max_tokens": 1500,
        "usage_count": 0
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting Enhanced Speech Diarization API...")
    
    # Initialize database if available
    if DATABASE_AVAILABLE and db_manager:
        try:
            db_manager.create_tables()
            db_manager.init_default_prompts()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Database initialization failed: {e}")
    
    # Initialize AI pipeline
    global pipeline
    try:
        print("Initializing Enhanced Speech Diarization Pipeline...")
        from run import GDPRCompliantPipeline
        pipeline = GDPRCompliantPipeline(
            whisper_model="base",
            device="auto",
            enable_preprocessing=True
        )
        print("AI Pipeline initialized successfully")
    except Exception as e:
        print(f"AI Pipeline initialization failed: {e}")
        print("   Some features may not be available")
    
    # Display connection info
    await display_startup_info()
    
    yield
    
    # Shutdown
    print("Shutting down...")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Enhanced Speech Diarization API",
    description="GDPR-compliant speech diarization with LLM analysis and database-driven prompt management",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include prompt management routes - FIXED
if DATABASE_AVAILABLE and PROMPT_ROUTER_AVAILABLE and prompt_router:
    app.include_router(prompt_router, tags=["prompts"])
    print("✅ Prompt management routes included")
    print("🔗 Public endpoint: /api/prompts/public")
    print("🔗 Admin endpoint: /api/prompts/")
else:
    print("❌ Prompt router not available")
    if not DATABASE_AVAILABLE:
        print("   - Database not available")
    if not PROMPT_ROUTER_AVAILABLE:
        print("   - Prompt router not imported")
    if not prompt_router:
        print("   - Prompt router is None")

# Serve static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

async def display_startup_info():
    """Display connection information on startup"""
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
        print("Tailscale connected - accessible from remote devices")
    else:
        print("Tailscale not connected - only local access available")
    
    print(f"API Documentation: http://localhost:8888/docs")
    print(f"Health Check: http://localhost:8888/health")
    
    # Database status
    if DATABASE_AVAILABLE:
        print("Database: Connected (SQLite)")
        print("Prompt Management: Available")
    else:
        print("Database: Not available (using fallback prompts)")
    
    # Ollama status
    if ollama_status["status"] == "connected":
        print(f"Ollama LLM: Connected ({ollama_status['current_model']})")
        if not ollama_status["model_available"]:
            print(f"Model {DEFAULT_MODEL} not found. Available: {ollama_status['available_models']}")
    else:
        print("Ollama LLM: Disconnected")
        print("   Start Ollama: ollama serve")
        print(f"   Pull model: ollama pull {DEFAULT_MODEL}")
    
    print("=" * 80)

# RESTORED: Legacy prompts function with proper format
def get_prompts_from_database():
    """Get prompts from database or fallback to hardcoded ones - RESTORED FORMAT"""
    if not DATABASE_AVAILABLE or not db_manager:
        return LLM_PROMPTS
    
    try:
        session = db_manager.get_session()
        try:
            prompts = session.query(AnalysisPrompt).filter(AnalysisPrompt.is_active == True).all()
            
            db_prompts = {}
            for prompt in prompts:
                db_prompts[prompt.key] = {
                    "name": prompt.title,  # Note: using 'title' from DB as 'name' for compatibility
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

# RESTORED: Ollama status check function
async def check_ollama_status():
    """Check if Ollama is running and available - RESTORED FROM OLD CODE"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                models_data = response.json()
                models = [model['name'] for model in models_data.get('models', [])]
                return {
                    "available": True,
                    "models": models,
                    "default": DEFAULT_MODEL,
                    "url": OLLAMA_BASE_URL,
                    "status": "connected",
                    "current_model": DEFAULT_MODEL,
                    "available_models": models,
                    "model_available": DEFAULT_MODEL in models
                }
    except Exception as e:
        logger.error(f"Ollama connection error: {e}")
    
    return {
        "available": False,
        "models": [],
        "default": DEFAULT_MODEL,
        "url": OLLAMA_BASE_URL,
        "error": "Ollama service not running",
        "status": "disconnected",
        "current_model": None,
        "available_models": [],
        "model_available": False
    }

async def process_with_ollama(prompt: str, model: str = DEFAULT_MODEL) -> Dict[str, Any]:
    """Process text with Ollama LLM"""
    try:
        import httpx
        
        async with httpx.AsyncClient() as client:
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
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=300.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="LLM processing failed")
                
    except ImportError:
        try:
            import requests
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
                timeout=300.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="LLM processing failed")
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"LLM service unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {str(e)}")

# API Routes

@app.get("/")
async def root():
    """Serve main page or redirect to docs"""
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Enhanced Speech Diarization API", "docs": "/docs"}

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
    """Upload and process audio file"""
    if not pipeline:
        raise HTTPException(status_code=503, detail="Pipeline not available")
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Save uploaded file
    upload_path = UPLOAD_DIR / f"{session_id}_{file.filename}"
    
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Initialize session
    processing_sessions[session_id] = {
        "id": session_id,
        "filename": file.filename,
        "status": "processing",
        "progress": 0,
        "message": "Starting audio processing...",
        "created_at": datetime.now(),
        "file_path": str(upload_path),
        "settings": {
            "language": language if language else None,
            "preprocessing": apply_preprocessing.lower() == "true",
            "num_speakers": int(num_speakers) if num_speakers.isdigit() else None
        }
    }
    
    # Start background processing
    background_tasks.add_task(process_audio_background, session_id, upload_path)
    
    return {
        "session_id": session_id,
        "status": "processing",
        "message": "Audio processing started"
    }

async def process_audio_background(session_id: str, file_path: Path):
    """Background task for audio processing"""
    try:
        session = processing_sessions[session_id]
        settings = session["settings"]
        
        session["status"] = "processing"
        session["progress"] = 10
        session["message"] = "Loading audio file..."
        
        print(f"Starting audio processing for session {session_id}")
        print(f"   File: {file_path}")
        print(f"   Settings: {settings}")
        
        session["progress"] = 20
        session["message"] = "Processing with GDPR pipeline..."
        
        results = pipeline.process_audio(
            audio_path=file_path,
            language=settings["language"],
            num_speakers=settings["num_speakers"],
            min_speakers=1,
            max_speakers=10,
            apply_preprocessing=settings["preprocessing"]
        )
        
        output_dir = OUTPUT_DIR / session_id
        output_dir.mkdir(exist_ok=True)
        
        session["progress"] = 90
        session["message"] = "Saving results..."
        
        await save_results_to_files(results, output_dir, session_id)
        
        session["status"] = "completed"
        session["progress"] = 100
        session["message"] = "Processing completed successfully"
        session["results"] = results
        session["output_dir"] = str(output_dir)
        
        print(f"Audio processing completed for session {session_id}")
        
        if file_path.exists():
            file_path.unlink()
            
    except Exception as e:
        logger.error(f"Processing error for session {session_id}: {e}")
        print(f"Processing failed for session {session_id}: {e}")
        processing_sessions[session_id].update({
            "status": "failed",
            "progress": 0,
            "message": f"Processing failed: {str(e)}",
            "error": str(e)
        })
        
        # Clean up file on error
        try:
            if file_path.exists():
                file_path.unlink()
        except:
            pass

async def save_results_to_files(results: Dict, output_dir: Path, session_id: str):
    """Save processing results to files"""
    try:
        import json
        
        json_file = output_dir / f"{session_id}_results.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)
        
        if "segments" in results:
            txt_file = output_dir / f"{session_id}_transcript.txt"
            with open(txt_file, 'w', encoding='utf-8') as f:
                for segment in results["segments"]:
                    start_time = segment.get("start", 0)
                    end_time = segment.get("end", 0)
                    speaker = segment.get("speaker", "Unknown")
                    text = segment.get("text", "")
                    
                    start_min, start_sec = divmod(start_time, 60)
                    end_min, end_sec = divmod(end_time, 60)
                    
                    f.write(f"[{int(start_min):02d}:{int(start_sec):02d} - {int(end_min):02d}:{int(end_sec):02d}] ")
                    f.write(f"{speaker}: {text}\n")
        
        logger.info(f"Results saved for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error saving results for session {session_id}: {e}")
        raise

@app.get("/api/processing-status/{session_id}")
async def get_processing_status(session_id: str):
    """Get processing status for a session"""
    if session_id not in processing_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = processing_sessions[session_id]
    return {
        "session_id": session_id,
        "status": session["status"],
        "progress": session["progress"],
        "message": session["message"],
        "created_at": session["created_at"].isoformat()
    }

@app.get("/api/results/{session_id}")
async def get_results(session_id: str):
    """Get processing results for a session"""
    if session_id not in processing_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = processing_sessions[session_id]
    
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Processing not completed")
    
    return {
        "session_id": session_id,
        "results": session.get("results", {}),
        "status": session["status"],
        "filename": session["filename"]
    }

@app.get("/api/download/{session_id}/{filename}")
async def download_file(session_id: str, filename: str):
    """Download a file from session output"""
    if session_id not in processing_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = processing_sessions[session_id]
    output_dir = session.get("output_dir")
    
    if not output_dir:
        raise HTTPException(status_code=404, detail="No output directory found")
    
    file_path = Path(output_dir) / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type='application/octet-stream'
    )

# FIXED: LLM processing endpoint - now accepts JSON instead of Form data
@app.post("/api/llm-process")
async def process_with_llm(request: LLMProcessRequest):
    """Process transcript with LLM using specified prompt"""
    try:
        transcript = request.transcript
        prompt_key = request.prompt_key
        custom_prompt = request.custom_prompt
        
        if not transcript or not transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript is required")
        
        if not prompt_key or not prompt_key.strip():
            raise HTTPException(status_code=400, detail="Prompt key is required")
        
        # Handle custom analysis
        if prompt_key == "custom_analysis":
            if not custom_prompt or not custom_prompt.strip():
                raise HTTPException(status_code=400, detail="Custom prompt is required for custom analysis")
            
            # Validate custom prompt contains transcript placeholder
            if "{transcript}" not in custom_prompt:
                # Auto-add transcript if not present
                final_prompt = f"{custom_prompt}\n\nTranscript:\n{transcript}"
            else:
                # Replace placeholder with actual transcript
                final_prompt = custom_prompt.replace("{transcript}", transcript)
            
            prompt_title = "Custom Analysis"
            
        else:
            # Get predefined prompt from database or fallback
            if DATABASE_AVAILABLE and db_manager:
                try:
                    db = db_manager.get_session()
                    try:
                        prompt = db.query(AnalysisPrompt).filter(
                            AnalysisPrompt.key == prompt_key,
                            AnalysisPrompt.is_active == True
                        ).first()
                        
                        if not prompt:
                            raise HTTPException(status_code=404, detail=f"Prompt '{prompt_key}' not found or inactive")
                        
                        final_prompt = prompt.prompt_template.replace("{transcript}", transcript)
                        prompt_title = prompt.title
                        
                    finally:
                        db.close()
                        
                except Exception as e:
                    logger.error(f"Database error: {e}")
                    # Fallback to hardcoded prompts
                    prompts = get_prompts_from_database()
                    if prompt_key not in prompts:
                        raise HTTPException(status_code=404, detail=f"Prompt '{prompt_key}' not found")
                    
                    final_prompt = prompts[prompt_key]["prompt"].replace("{transcript}", transcript)
                    prompt_title = prompts[prompt_key]["name"]
            else:
                # Use fallback prompts
                prompts = get_prompts_from_database()
                if prompt_key not in prompts:
                    raise HTTPException(status_code=404, detail=f"Prompt '{prompt_key}' not found")
                
                final_prompt = prompts[prompt_key]["prompt"].replace("{transcript}", transcript)
                prompt_title = prompts[prompt_key]["name"]
        
        # Check Ollama status
        ollama_status = await check_ollama_status()
        if not ollama_status["available"]:
            raise HTTPException(status_code=503, detail="LLM service not available")
        
        if not ollama_status["model_available"]:
            raise HTTPException(status_code=503, detail=f"Model {DEFAULT_MODEL} not available")
        
        # Process with LLM
        logger.info(f"Processing with LLM: {prompt_key} (length: {len(transcript)} chars)")
        
        async with httpx.AsyncClient() as client:
            ollama_payload = {
                "model": DEFAULT_MODEL,
                "prompt": final_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 4000
                }
            }
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=ollama_payload,
                timeout=300.0
            )
            
            if response.status_code != 200:
                logger.error(f"Ollama error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=503, detail="LLM processing failed")
            
            result = response.json()
            
            if "response" not in result:
                logger.error(f"Invalid Ollama response: {result}")
                raise HTTPException(status_code=503, detail="Invalid LLM response")
            
            llm_response = result["response"].strip()
            
            if not llm_response:
                raise HTTPException(status_code=503, detail="LLM returned empty response")
        
        # Store result in database if available
        if DATABASE_AVAILABLE and db_manager and prompt_key != "custom_analysis":
            try:
                db = db_manager.get_session()
                try:
                    analysis_result = AnalysisResult(
                        session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                        prompt_key=prompt_key,
                        prompt_title=prompt_title,
                        response_text=llm_response,
                        model_used=DEFAULT_MODEL,
                        processing_time=result.get("total_duration", 0) / 1e9 if "total_duration" in result else 0,
                        transcript_length=len(transcript),
                        tokens_used=result.get("eval_count", 0)
                    )
                    
                    db.add(analysis_result)
                    db.commit()
                    
                except Exception as e:
                    logger.error(f"Failed to store analysis result: {e}")
                    db.rollback()
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"Database error storing result: {e}")
        
        logger.info(f"LLM processing completed for {prompt_key}")
        
        return {
            "result": llm_response,
            "model": DEFAULT_MODEL,
            "prompt_key": prompt_key,
            "prompt_title": prompt_title,
            "processing_time": result.get("total_duration", 0) / 1e9 if "total_duration" in result else 0,
            "tokens_used": result.get("eval_count", 0),
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.delete("/api/session/{session_id}")
async def cleanup_session(session_id: str):
    """Clean up session data"""
    if session_id in processing_sessions:
        session = processing_sessions[session_id]
        
        output_dir = session.get("output_dir")
        if output_dir and Path(output_dir).exists():
            shutil.rmtree(output_dir)
        
        del processing_sessions[session_id]
        
        return {"message": "Session cleaned up successfully"}
    
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/api/chat")
async def chat_with_llm(data: dict):
    """Chat with LLM - RESTORED FROM OLD CODE"""
    try:
        message = data.get("message", "")
        model = data.get("model", DEFAULT_MODEL)
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": message,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "top_k": 40
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "response": result.get("response", ""),
                    "model": model,
                    "success": True
                }
            else:
                raise HTTPException(status_code=500, detail="Chat failed")
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# RESTORED: LLM model management endpoints
@app.get("/api/llm/models")
async def get_llm_models():
    """Get available LLM models - RESTORED"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
            if response.status_code == 200:
                models_data = response.json()
                models = []
                for model in models_data.get("models", []):
                    models.append({
                        "name": model.get("name"),
                        "size": model.get("size", 0),
                        "modified_at": model.get("modified_at"),
                        "details": model.get("details", {})
                    })
                
                return {
                    "models": models,
                    "default_model": DEFAULT_MODEL,
                    "ollama_url": OLLAMA_BASE_URL,
                    "status": "connected"
                }
            else:
                raise HTTPException(status_code=503, detail="Ollama service unavailable")
    
    except Exception as e:
        logger.error(f"Failed to get models: {e}")
        raise HTTPException(status_code=503, detail=f"LLM service unavailable: {str(e)}")

@app.get("/api/llm/status")
async def get_llm_status():
    """Get LLM service status - RESTORED"""
    status = await check_ollama_status()
    return status

@app.post("/api/admin/init-prompts")
async def init_default_prompts():
    """Initialize default prompts - RESTORED"""
    if not DATABASE_AVAILABLE or not db_manager:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        db_manager.init_default_prompts()
        return {"message": "Default prompts initialized successfully"}
    except Exception as e:
        logger.error(f"Failed to initialize prompts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize prompts: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8888,
        reload=False,
        log_level="info"
    )