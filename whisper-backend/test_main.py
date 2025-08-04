# test_main.py - Simple test backend to debug the form issue

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI(title="Test Speech Diarization API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """Serve the main page"""
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Test server running"
    }

@app.post("/api/upload-audio")
async def upload_audio(
    file: UploadFile = File(...),
    language: str = Form(""),
    apply_preprocessing: str = Form("true"),
    num_speakers: str = Form("")
):
    """Test upload endpoint with detailed logging"""
    
    print("=" * 50)
    print("UPLOAD REQUEST RECEIVED")
    print("=" * 50)
    print(f"File: {file.filename}")
    print(f"File size: {file.size} bytes")
    print(f"Content type: {file.content_type}")
    print(f"Language: '{language}'")
    print(f"Preprocessing: '{apply_preprocessing}'")
    print(f"Num speakers: '{num_speakers}'")
    print("=" * 50)
    
    # Read some file content for verification
    content = await file.read()
    print(f"File content read: {len(content)} bytes")
    
    # Reset file pointer
    await file.seek(0)
    
    # Return success response
    return {
        "status": "success",
        "message": "File uploaded successfully (test mode)",
        "file_info": {
            "filename": file.filename,
            "size": file.size,
            "content_type": file.content_type
        },
        "settings": {
            "language": language if language else "auto-detect",
            "preprocessing": apply_preprocessing == "true",
            "num_speakers": int(num_speakers) if num_speakers else "auto-detect"
        }
    }

if __name__ == "__main__":
    uvicorn.run("test_main:app", host="0.0.0.0", port=8001, reload=True)