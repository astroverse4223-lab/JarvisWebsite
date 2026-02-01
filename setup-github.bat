@echo off
REM GitHub Backup Setup Script for Windows Command Prompt
REM This script initializes Git, commits your project, and pushes to GitHub

echo ================================================
echo   GitHub Backup Setup for Jarvis Website
echo ================================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Check if already a git repository
if exist ".git" (
    echo [OK] Git repository already initialized
) else (
    echo Initializing Git repository...
    git init
    if %errorlevel% equ 0 (
        echo [OK] Git repository initialized
    ) else (
        echo [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
)

echo.

REM Configure Git user if needed
for /f "delims=" %%i in ('git config user.name') do set GIT_USER=%%i
for /f "delims=" %%i in ('git config user.email') do set GIT_EMAIL=%%i

if not defined GIT_USER (
    set /p GIT_USER="Enter your Git username: "
    git config user.name "%GIT_USER%"
)

if not defined GIT_EMAIL (
    set /p GIT_EMAIL="Enter your Git email: "
    git config user.email "%GIT_EMAIL%"
)

echo [OK] Git user configured
echo.

REM Add files
echo Adding files to Git...
git add .

REM Create commit
echo.
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Initial commit - Jarvis Website backup %date% %time%
)

git commit -m "%COMMIT_MSG%"
echo.

echo ================================================
echo   GitHub Repository Setup
echo ================================================
echo.
echo Please create a new repository on GitHub:
echo 1. Go to https://github.com/new
echo 2. Create a new repository (e.g., 'jarvis-website')
echo 3. DO NOT initialize with README, .gitignore, or license
echo 4. Copy the repository URL
echo.

set /p REPO_URL="Enter your GitHub repository URL: "

if "%REPO_URL%"=="" (
    echo [ERROR] No repository URL provided
    pause
    exit /b 1
)

echo.
echo Setting up remote origin...

REM Check if remote exists
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Remote origin already exists
    set /p UPDATE_REMOTE="Do you want to update it? (y/n): "
    if /i "%UPDATE_REMOTE%"=="y" (
        git remote set-url origin %REPO_URL%
        echo [OK] Remote origin updated
    )
) else (
    git remote add origin %REPO_URL%
    echo [OK] Remote origin added
)

echo.
echo Pushing to GitHub...
echo.

REM Get current branch
for /f "delims=" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

if "%CURRENT_BRANCH%"=="" (
    echo Setting up main branch...
    git branch -M main
    set CURRENT_BRANCH=main
)

REM Push to GitHub
git push -u origin %CURRENT_BRANCH%

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   SUCCESS! Repository backed up to GitHub
    echo ================================================
    echo.
    echo Your repository is now available at:
    echo %REPO_URL%
    echo.
    echo Future backups:
    echo   git add .
    echo   git commit -m "Your message"
    echo   git push
) else (
    echo.
    echo ================================================
    echo   Push failed
    echo ================================================
    echo.
    echo Common issues:
    echo 1. Check your GitHub credentials
    echo 2. Ensure the repository exists and URL is correct
    echo 3. You may need to authenticate with GitHub
    echo.
    echo For authentication, consider using:
    echo - Personal Access Token (recommended)
    echo - GitHub CLI: https://cli.github.com/
    echo - SSH keys: https://docs.github.com/en/authentication
)

echo.
pause
