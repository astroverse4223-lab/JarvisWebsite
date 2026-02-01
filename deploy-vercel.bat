@echo off
setlocal enabledelayedexpansion

REM JARVIS Omega - Simple Vercel Deployment Script
REM Run with: deploy-vercel.bat [production]

title JARVIS Omega - Vercel Deployment

echo.
echo ========================================================================
echo.
echo              JARVIS OMEGA - VERCEL AUTO DEPLOY
echo.
echo ========================================================================
echo.

REM Check for production flag
set "DEPLOY_TYPE=preview"
set "DEPLOY_FLAG="

if /i "%1"=="production" (
    set "DEPLOY_TYPE=production"
    set "DEPLOY_FLAG=--prod"
    echo [PRODUCTION DEPLOYMENT]
) else if /i "%1"=="prod" (
    set "DEPLOY_TYPE=production"
    set "DEPLOY_FLAG=--prod"
    echo [PRODUCTION DEPLOYMENT]
) else (
    echo [PREVIEW DEPLOYMENT]
)

echo.
echo ------------------------------------------------------------------------
echo STEP 1: Checking Prerequisites
echo ------------------------------------------------------------------------

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js: %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm: v%NPM_VERSION%

echo.
echo ------------------------------------------------------------------------
echo STEP 2: Checking Vercel CLI
echo ------------------------------------------------------------------------

where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Vercel CLI is not installed!
    echo.
    echo Installing Vercel CLI globally...
    call npm install -g vercel
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Vercel CLI!
        pause
        exit /b 1
    )
    
    echo [OK] Vercel CLI installed successfully!
) else (
    for /f "tokens=*" %%i in ('vercel --version') do set VERCEL_VERSION=%%i
    echo [OK] Vercel CLI: !VERCEL_VERSION!
)

echo.
echo ------------------------------------------------------------------------
echo STEP 3: Checking Vercel Authentication
echo ------------------------------------------------------------------------

vercel whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Not logged in to Vercel!
    echo.
    echo Opening browser for authentication...
    call vercel login
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to login to Vercel!
        pause
        exit /b 1
    )
    
    echo [OK] Successfully logged in to Vercel!
) else (
    for /f "tokens=*" %%i in ('vercel whoami 2^>nul') do set VERCEL_USER=%%i
    echo [OK] Logged in as: !VERCEL_USER!
)

echo.
echo ------------------------------------------------------------------------
echo STEP 4: Validating Project Structure
echo ------------------------------------------------------------------------

set "ALL_GOOD=true"

if exist "package.json" (
    echo [OK] package.json exists
) else (
    echo [ERROR] package.json is missing!
    set "ALL_GOOD=false"
)

if exist "vercel.json" (
    echo [OK] vercel.json exists
) else (
    echo [ERROR] vercel.json is missing!
    set "ALL_GOOD=false"
)

if exist "api\" (
    echo [OK] api/ directory exists
) else (
    echo [ERROR] api/ directory is missing!
    set "ALL_GOOD=false"
)

if exist "public\" (
    echo [OK] public/ directory exists
) else (
    echo [ERROR] public/ directory is missing!
    set "ALL_GOOD=false"
)

if "%ALL_GOOD%"=="false" (
    echo.
    echo [ERROR] Project structure validation failed!
    pause
    exit /b 1
)

echo.
echo ------------------------------------------------------------------------
echo STEP 5: Environment Variables Check
echo ------------------------------------------------------------------------

if exist ".env" (
    echo [OK] .env file found
    echo [INFO] Make sure to add environment variables to Vercel Dashboard
) else (
    echo [WARNING] .env file not found
    echo [INFO] Remember to set environment variables in Vercel after deployment
)

echo.
echo ------------------------------------------------------------------------
echo STEP 6: Deployment Confirmation
echo ------------------------------------------------------------------------
echo.

if "%DEPLOY_TYPE%"=="production" (
    echo [WARNING] PRODUCTION DEPLOYMENT - This will update your live site!
    echo.
)

echo You are about to deploy:
echo   - Deployment Type: %DEPLOY_TYPE%
echo   - Project: JARVIS Omega Website
echo   - Directory: %CD%
echo.

set /p CONFIRM="Continue with deployment? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo.
    echo [INFO] Deployment cancelled by user
    pause
    exit /b 0
)

echo.
echo ------------------------------------------------------------------------
echo STEP 7: Deploying to Vercel
echo ------------------------------------------------------------------------
echo.

if "%DEPLOY_TYPE%"=="production" (
    echo [INFO] Deploying to PRODUCTION...
) else (
    echo [INFO] Deploying to PREVIEW...
)

echo.

REM Deploy to Vercel
vercel %DEPLOY_FLAG% --yes

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================================================
    echo.
    echo [ERROR] Deployment failed!
    echo.
    echo Troubleshooting tips:
    echo   1. Check your internet connection
    echo   2. Verify you're logged in: vercel whoami
    echo   3. Try manually: vercel --prod
    echo   4. Check Vercel status: https://vercel-status.com
    echo.
    echo ========================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo.
echo                  DEPLOYMENT SUCCESSFUL!
echo.
echo ========================================================================
echo.

echo Next steps:
echo   1. Check Vercel Dashboard: https://vercel.com/dashboard
echo   2. Test your website
echo   3. Verify Stripe integration works
echo   4. Set environment variables in Vercel if not done yet
echo.

if "%DEPLOY_TYPE%"=="production" (
    echo [IMPORTANT] Production Checklist:
    echo   - Switch to Stripe LIVE mode when ready
    echo   - Update pricing.html with LIVE publishable key
    echo   - Test with real payment before announcing
    echo.
)

echo Documentation:
echo   - Vercel Dashboard: https://vercel.com/dashboard
echo   - View Logs: vercel logs
echo   - Stripe Dashboard: https://dashboard.stripe.com
echo.
echo ========================================================================
echo.

pause
