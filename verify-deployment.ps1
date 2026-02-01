# Verify Deployment and Environment Variables

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check if files were modified
Write-Host "1. Checking modified files..." -ForegroundColor Yellow
$modifiedFiles = git diff --name-only HEAD~1 HEAD 2>$null
if ($modifiedFiles) {
    Write-Host "   ✅ Recent changes:" -ForegroundColor Green
    $modifiedFiles | ForEach-Object { Write-Host "      - $_" -ForegroundColor White }
} else {
    Write-Host "   ⚠️  No recent commits found" -ForegroundColor Yellow
}

# 2. Verify local .env file
Write-Host "`n2. Checking local .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "PRICE_"
    if ($envContent) {
        Write-Host "   ✅ Found PRICE variables in .env:" -ForegroundColor Green
        $envContent | ForEach-Object { 
            $line = $_ -replace '=.*', '=***'
            Write-Host "      $line" -ForegroundColor White 
        }
    } else {
        Write-Host "   ❌ No PRICE variables found in .env!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
}

# 3. Check Vercel deployment status
Write-Host "`n3. Checking Vercel deployment..." -ForegroundColor Yellow
$vercelStatus = vercel ls --confirm 2>$null
if ($vercelStatus) {
    Write-Host "   ✅ Vercel CLI connected" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Vercel CLI not responding (might not be installed)" -ForegroundColor Yellow
}

# 4. Instructions for setting environment variables
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CRITICAL: SET ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "The 400 'Price ID not configured' error means environment" -ForegroundColor Yellow
Write-Host "variables are NOT set in Vercel. Here's how to fix it:`n" -ForegroundColor Yellow

Write-Host "Option 1: Using Vercel Dashboard (RECOMMENDED)" -ForegroundColor Green
Write-Host "   1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Select your project" -ForegroundColor White
Write-Host "   3. Go to: Settings → Environment Variables" -ForegroundColor White
Write-Host "   4. Add EACH of these variables:`n" -ForegroundColor White

# Read and display variables from .env
if (Test-Path ".env") {
    $envVars = Get-Content ".env" | Where-Object { $_ -match "^[A-Z_]+=.+" -and $_ -notmatch "^#" }
    foreach ($var in $envVars) {
        if ($var -match "^([^=]+)=(.+)$") {
            $name = $matches[1]
            $value = $matches[2]
            Write-Host "      Name:  $name" -ForegroundColor Cyan
            Write-Host "      Value: $value" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

Write-Host "   5. Set for: Production, Preview, AND Development" -ForegroundColor White
Write-Host "   6. Click 'Save'" -ForegroundColor White
Write-Host "   7. Go to Deployments tab and click 'Redeploy'`n" -ForegroundColor White

Write-Host "Option 2: Using Vercel CLI" -ForegroundColor Green
Write-Host "   Run these commands (one at a time):`n" -ForegroundColor White

if (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -match "^[A-Z_]+=.+" -and $_ -notmatch "^#" } | ForEach-Object {
        if ($_ -match "^([^=]+)=(.+)$") {
            $name = $matches[1]
            $value = $matches[2]
            Write-Host "   vercel env add $name production" -ForegroundColor Gray
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "BROWSER CACHE FIX" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "After setting environment variables, clear your browser cache:" -ForegroundColor Yellow
Write-Host "   1. Press: Ctrl + Shift + Delete" -ForegroundColor White
Write-Host "   2. Select: Cached images and files" -ForegroundColor White
Write-Host "   3. Click: Clear data" -ForegroundColor White
Write-Host "   4. Or just do a hard refresh: Ctrl + Shift + R`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING CHECKLIST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "After deploying and clearing cache:" -ForegroundColor Yellow
Write-Host "   ☐ Test 'Start Pro Trial' button" -ForegroundColor White
Write-Host "   ☐ Test 'Buy Lifetime License' button" -ForegroundColor White
Write-Host "   ☐ Check browser console for errors" -ForegroundColor White
Write-Host "   ☐ Verify redirect to Stripe (not Gumroad)`n" -ForegroundColor White

Write-Host "Press any key to open Vercel Dashboard..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "https://vercel.com/dashboard"
