# Set Vercel Environment Variables
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETTING VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Read .env file
$envVars = @{}
if (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -match "^[A-Z_]+=.+" -and $_ -notmatch "^#" } | ForEach-Object {
        if ($_ -match "^([^=]+)=(.+)$") {
            $envVars[$matches[1]] = $matches[2]
        }
    }
}

# Add DOMAIN if not in .env
if (-not $envVars.ContainsKey("DOMAIN")) {
    $envVars["DOMAIN"] = "https://www.jarvisassistant.online"
}

Write-Host "Found $($envVars.Count) environment variables to set`n" -ForegroundColor Yellow

# Set each variable
$count = 0
foreach ($key in $envVars.Keys) {
    $count++
    Write-Host "[$count/$($envVars.Count)] Setting $key..." -ForegroundColor White
    
    # Use echo to pipe the value to vercel env add
    $value = $envVars[$key]
    $command = "echo '$value' | vercel env add $key production"
    
    try {
        # Execute the command
        $result = Invoke-Expression $command 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Success" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  May already exist or failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Error: $_" -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "REDEPLOY TO APPLY CHANGES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Environment variables set! Now redeploy:" -ForegroundColor Yellow
Write-Host "   vercel --prod`n" -ForegroundColor White

$redeploy = Read-Host "Redeploy now? (y/n)"
if ($redeploy -eq 'y') {
    Write-Host "`nRedeploying..." -ForegroundColor Green
    vercel --prod
}
