# Quick Git Auto-Commit and Push Script
# Usage: .\git-auto.ps1
# Usage with custom message: .\git-auto.ps1 "Your commit message"

param(
    [string]$Message = ""
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Git Auto Commit & Push" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host "Git is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://git-scm.com/download/win" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if this is a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Not a git repository!" -ForegroundColor Red
    Write-Host "Run setup-github.ps1 first to initialize" -ForegroundColor Yellow
    pause
    exit 1
}

# Check for uncommitted changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain

if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit" -ForegroundColor Green
    Write-Host ""
    pause
    exit 0
}

Write-Host "Found changes to commit:" -ForegroundColor Green
git status --short
Write-Host ""

# Get commit message
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "Enter commit message (or press Enter for auto-generated)"
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
}

Write-Host ""
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add files" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Committing with message: $Message" -ForegroundColor Yellow
git commit -m "$Message"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Changes pushed to GitHub" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  Push failed" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. No remote configured (run setup-github.ps1)" -ForegroundColor White
    Write-Host "2. Authentication required" -ForegroundColor White
    Write-Host "3. No internet connection" -ForegroundColor White
    Write-Host ""
    Write-Host "Your changes are committed locally." -ForegroundColor Cyan
    Write-Host "You can push later with: git push" -ForegroundColor Cyan
}

Write-Host ""
pause
