@echo off
echo Killing any existing processes on ports 3000, 5000, 8000, 8545...
echo.

FOR %%p IN (3000 5000 8000 8545) DO (
    FOR /F "tokens=5" %%i IN ('netstat -aon ^| findstr ":%%p"') DO (
        IF %%i NEQ 0 (
            echo Killing process with PID %%i on port %%p
            taskkill /PID %%i /F
        )
    )
)

echo.
echo All clear! Starting development servers...
echo.

cd /d "%~dp0"

start "Blockchain" cmd /k "cd /d ""%~dp0blockchain"" && npm i && npm run dev"

start "Client" cmd /k "cd /d ""%~dp0client"" && npm i && npm run dev"

start "Node Server" cmd /k "cd /d ""%~dp0server"" && npm i && npm run dev"

@REM start "Flask Server" cmd /k "cd /d ""%~dp0server - flask"" && conda activate flask_env && python run.py"

echo All development servers are being launched in new windows.
