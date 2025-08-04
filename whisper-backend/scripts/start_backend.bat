@echo off
echo Starting Speech AI Backend on Device B
echo =======================================

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
)
set LOCAL_IP=%LOCAL_IP: =%

echo 🏠 Local IP: %LOCAL_IP%

REM Check virtual environment
if not exist venv (
    echo ❌ Virtual environment not found!
    echo Please run: python -m venv venv
    echo Then: venv\Scripts\activate
    echo Then: pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Check dependencies
python -c "import fastapi" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Dependencies not installed!
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Check Ollama
echo Checking Ollama status...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ollama not found!
    echo Install from: https://ollama.ai
    pause
    exit /b 1
) else (
    echo ✅ Ollama installed
)

REM Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if %errorlevel% neq 0 (
    echo Starting Ollama server...
    start /B ollama serve
    timeout /t 5 >nul
) else (
    echo ✅ Ollama is running
)

REM Check model
ollama list | find "llama3.2:3b" >nul
if %errorlevel% neq 0 (
    echo Downloading LLM model (this may take a while)...
    ollama pull llama3.2:3b
) else (
    echo ✅ LLM model ready
)

echo.
echo 🚀 Starting Backend Server...
echo 📍 Server will be available at:
echo    Local: http://localhost:8888
echo    Network: http://%LOCAL_IP%:8888
echo 📚 API Docs: http://%LOCAL_IP%:8888/docs
echo =======================================

REM Start the backend
python main.py
pause