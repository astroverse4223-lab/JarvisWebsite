@echo off
echo.
echo ========================================
echo   JARVIS Omega Website - Quick Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/5] Checking Node.js...
node --version
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [2/5] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo [2/5] Dependencies already installed
)
echo.

REM Check if .env exists
if not exist ".env" (
    echo [3/5] Creating .env file...
    copy .env.example .env
    echo [WARNING] Please edit .env and add your Stripe keys!
    echo.
    echo Open .env file and configure:
    echo   - STRIPE_SECRET_KEY
    echo   - STRIPE_PUBLISHABLE_KEY
    echo   - Price IDs (PRICE_PRO_MONTHLY, etc.)
    echo.
    pause
) else (
    echo [3/5] .env file exists
)
echo.

echo [4/5] Testing Stripe configuration...
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Stripe configuration is incomplete!
    echo Please follow the instructions above and run this script again.
    echo.
    pause
    exit /b 1
)
echo.

echo [5/5] Starting development server...
echo.
echo ========================================
echo Server will start at http://localhost:3000
echo ========================================
echo.
call npm start
