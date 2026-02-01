# GitHub Backup Setup Script for Windows PowerShell
# This script initializes Git, commits your project, and pushes to GitHub

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GitHub Backup Setup for Jarvis Website" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    $gitVersion = git --version
    Write-Host "Git is installed: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""

# Check if already a git repository
if (Test-Path ".git") {
    Write-Host "Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "Failed to initialize Git repository" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""

# Configure Git user if not set
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host "Git user name not configured." -ForegroundColor Yellow
    $userName = Read-Host "Enter your Git username"
    git config user.name "$userName"
}

if (-not $userEmail) {
    Write-Host "Git user email not configured." -ForegroundColor Yellow
    $userEmail = Read-Host "Enter your Git email"
    git config user.email "$userEmail"
}

Write-Host "Git user configured: $userName <$userEmail>" -ForegroundColor Green
Write-Host ""

Write-Host ""
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Creating commit..." -ForegroundColor Yellow
$commitMessage = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit - Jarvis Website backup $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit may have failed or nothing to commit" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GitHub Repository Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please create a new repository on GitHub:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Create a new repository (for example: jarvis-website)" -ForegroundColor White
Write-Host "3. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
Write-Host "4. Copy the repository URL" -ForegroundColor White
Write-Host ""

$repoUrl = Read-Host "Enter your GitHub repository URL"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "No repository URL provided" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Setting up remote origin..." -ForegroundColor Yellow

# Check if remote already exists
$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "Remote origin already exists: $existingRemote" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update it? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git remote set-url origin "$repoUrl"
        Write-Host "Remote origin updated" -ForegroundColor Green
    }
} else {
    git remote add origin "$repoUrl"
    Write-Host "Remote origin added" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Determine the default branch name
$currentBranch = git branch --show-current

if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Write-Host "Setting up main branch..." -ForegroundColor Yellow
    git branch -M main
    $currentBranch = "main"
}

# Push to GitHub
git push -u origin "$currentBranch"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Repository backed up to GitHub" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your repository is now available at:" -ForegroundColor White
    Write-Host $repoUrl -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Future backups:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m Your message" -ForegroundColor White
    Write-Host "  git push" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  Push failed" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Check your GitHub credentials" -ForegroundColor White
    Write-Host "2. Ensure the repository exists and URL is correct" -ForegroundColor White
    Write-Host "3. You may need to authenticate with GitHub" -ForegroundColor White
    Write-Host ""
    Write-Host "For authentication, consider using:" -ForegroundColor Yellow
    Write-Host "- Personal Access Token (recommended)" -ForegroundColor White
    Write-Host "- GitHub CLI: https://cli.github.com/" -ForegroundColor White
    Write-Host "- SSH keys: https://docs.github.com/en/authentication" -ForegroundColor White
}

Write-Host ""
pause
