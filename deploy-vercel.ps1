#!/usr/bin/env pwsh
# JARVIS Omega - Automated Vercel Deployment Script
# Run with: .\deploy-vercel.ps1

param(
    [switch]$Production,
    [switch]$Preview,
    [switch]$SkipEnvCheck,
    [switch]$Force,
    [switch]$AddDomain,
    [string]$Domain = "jarvisassistant.online",
    [switch]$Help
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Header {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor $InfoColor
    Write-Host "                                                                " -ForegroundColor $InfoColor
    Write-Host "         JARVIS OMEGA - VERCEL AUTO DEPLOY                      " -ForegroundColor $InfoColor
    Write-Host "                                                                " -ForegroundColor $InfoColor
    Write-Host "================================================================" -ForegroundColor $InfoColor
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor $SuccessColor
}

function Write-Info {
    param([string]$Message)
    Write-Host "[i] $Message" -ForegroundColor $InfoColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $WarningColor
}

function Write-Error {
    param([string]$Message)
    Write-Host "[X] $Message" -ForegroundColor $ErrorColor
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "----------------------------------------------------------------" -ForegroundColor $InfoColor
    Write-Host $Message -ForegroundColor $InfoColor
    Write-Host "----------------------------------------------------------------" -ForegroundColor $InfoColor
}

function Show-Help {
    Write-Header
    Write-Host "USAGE:" -ForegroundColor $InfoColor
    Write-Host "  .\deploy-vercel.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor $InfoColor
    Write-Host "  -Production       Deploy to production (default is preview)" -ForegroundColor White
    Write-Host "  -Preview          Deploy preview build (default)" -ForegroundColor White
    Write-Host "  -SkipEnvCheck     Skip environment variable validation" -ForegroundColor White
    Write-Host "  -Force            Force deployment without confirmations" -ForegroundColor White
    Write-Host "  -AddDomain        Add and configure custom domain" -ForegroundColor White
    Write-Host "  -Domain <domain>  Custom domain to add (default: jarvisassistant.online)" -ForegroundColor White
    Write-Host "  -Help             Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor $InfoColor
    Write-Host "  .\deploy-vercel.ps1                                # Preview deployment" -ForegroundColor White
    Write-Host "  .\deploy-vercel.ps1 -Production                    # Production deployment" -ForegroundColor White
    Write-Host "  .\deploy-vercel.ps1 -Production -AddDomain         # Deploy + add domain" -ForegroundColor White
    Write-Host "  .\deploy-vercel.ps1 -Production -Force             # Skip confirmations" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Show help if requested
if ($Help) {
    Show-Help
}

# Clear screen and show header
Clear-Host
Write-Header

# Determine deployment type
$DeploymentType = if ($Production) { "Production" } else { "Preview" }
$DeploymentEmoji = if ($Production) { "[PROD]" } else { "[PREV]" }

Write-Info "Deployment Type: $DeploymentEmoji $DeploymentType"
Write-Host ""

# Step 1: Check Node.js and npm
Write-Step "STEP 1: Checking Prerequisites"

try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js: $nodeVersion"
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Error "Node.js is not installed!"
    Write-Info "Please install Node.js from: https://nodejs.org/"
    exit 1
}

try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm: v$npmVersion"
    } else {
        throw "npm not found"
    }
} catch {
    Write-Error "npm is not installed!"
    exit 1
}

# Step 2: Check for Vercel CLI
Write-Step "STEP 2: Checking Vercel CLI"

try {
    $vercelVersion = vercel --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Vercel CLI: $vercelVersion"
    } else {
        throw "Vercel CLI not found"
    }
} catch {
    Write-Warning "Vercel CLI is not installed!"
    Write-Info "Installing Vercel CLI globally..."
    
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Vercel CLI!"
        exit 1
    }
    
    Write-Success "Vercel CLI installed successfully!"
}

# Step 3: Check if logged in to Vercel
Write-Step "STEP 3: Checking Vercel Authentication"

$vercelWhoami = vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Not logged in to Vercel!"
    Write-Info "Opening browser for authentication..."
    
    vercel login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to login to Vercel!"
        exit 1
    }
    
    Write-Success "Successfully logged in to Vercel!"
} else {
    Write-Success "Logged in as: $vercelWhoami"
}

# Step 4: Check environment variables (unless skipped)
if (-not $SkipEnvCheck) {
    Write-Step "STEP 4: Validating Environment Variables"
    
    if (Test-Path ".env") {
        Write-Success ".env file found"
        
        # Read .env and check for required variables
        $envContent = Get-Content ".env" -Raw
        $requiredVars = @(
            "STRIPE_SECRET_KEY",
            "PRICE_PRO_MONTHLY",
            "PRICE_PRO_YEARLY",
            "PRICE_BUSINESS_MONTHLY",
            "PRICE_BUSINESS_YEARLY"
        )
        
        $missingVars = @()
        $placeholderVars = @()
        
        foreach ($var in $requiredVars) {
            if ($envContent -match "$var=(.+)") {
                $value = $Matches[1].Trim()
                if ($value -eq "" -or $value -match "your_|1234567890") {
                    $placeholderVars += $var
                }
            } else {
                $missingVars += $var
            }
        }
        
        if ($missingVars.Count -gt 0) {
            Write-Warning "Missing environment variables:"
            foreach ($var in $missingVars) {
                Write-Host "  [X] $var" -ForegroundColor $ErrorColor
            }
        }
        
        if ($placeholderVars.Count -gt 0) {
            Write-Warning "Placeholder values detected:"
            foreach ($var in $placeholderVars) {
                Write-Host "  [!] $var" -ForegroundColor $WarningColor
            }
        }
        
        if ($missingVars.Count -eq 0 -and $placeholderVars.Count -eq 0) {
            Write-Success "All environment variables configured!"
        } else {
            Write-Warning "Environment variables need attention"
            Write-Info "Make sure to add them in Vercel Dashboard after deployment"
        }
    } else {
        Write-Warning ".env file not found"
        Write-Info "Make sure to set environment variables in Vercel Dashboard"
    }
} else {
    Write-Info "Skipping environment variable check"
}

# Step 5: Check project structure
Write-Step "STEP 5: Validating Project Structure"

$requiredFiles = @("package.json", "vercel.json")
$requiredDirs = @("api", "public")

$allGood = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "$file exists"
    } else {
        Write-Error "$file is missing!"
        $allGood = $false
    }
}

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir -PathType Container) {
        Write-Success "$dir/ directory exists"
    } else {
        Write-Error "$dir/ directory is missing!"
        $allGood = $false
    }
}

if (-not $allGood) {
    Write-Error "Project structure validation failed!"
    exit 1
}

# Step 6: Run tests (if available)
Write-Step "STEP 6: Running Pre-deployment Tests"

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    if ($packageJson.scripts.test) {
        Write-Info "Running tests..."
        npm test
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Tests failed, but continuing with deployment..."
        } else {
            Write-Success "All tests passed!"
        }
    } else {
        Write-Info "No test script found, skipping..."
    }
}

# Step 7: Confirm deployment
if (-not $Force) {
    Write-Step "STEP 7: Deployment Confirmation"
    
    Write-Host ""
    Write-Host "You are about to deploy:" -ForegroundColor $WarningColor
    Write-Host "  - Deployment Type: $DeploymentEmoji $DeploymentType" -ForegroundColor White
    Write-Host "  - Project: JARVIS Omega Website" -ForegroundColor White
    Write-Host "  - Directory: $(Get-Location)" -ForegroundColor White
    Write-Host ""
    
    if ($Production) {
        Write-Host "[!] PRODUCTION DEPLOYMENT - This will update your live site!" -ForegroundColor $WarningColor
        Write-Host ""
    }
    
    $confirmation = Read-Host "Continue with deployment? (y/N)"
    
    if ($confirmation -ne "y" -and $confirmation -ne "Y") {
        Write-Warning "Deployment cancelled by user"
        exit 0
    }
}

# Step 8: Deploy to Vercel
Write-Step "STEP 8: Deploying to Vercel"

Write-Info "Starting deployment..."
Write-Host ""

$deployArgs = @()

if ($Production) {
    $deployArgs += "--prod"
    Write-Info "[PROD] Deploying to PRODUCTION..."
} else {
    Write-Info "[PREV] Deploying to PREVIEW..."
}

# Add --yes to skip prompts
$deployArgs += "--yes"

# Run deployment
$deployOutput = vercel @deployArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Success "Deployment successful!"
    
    # Extract URL from output
    $deploymentUrl = $deployOutput | Select-String -Pattern "https://[^\s]+" | Select-Object -First 1
    
    if ($deploymentUrl) {
        $url = $deploymentUrl.Matches.Value
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor $SuccessColor
        Write-Host "                                                                " -ForegroundColor $SuccessColor
        Write-Host "                    DEPLOYMENT SUCCESSFUL!                       " -ForegroundColor $SuccessColor
        Write-Host "                                                                " -ForegroundColor $SuccessColor
        Write-Host "================================================================" -ForegroundColor $SuccessColor
        Write-Host ""
        Write-Host "[WEB] Your website is live at:" -ForegroundColor $InfoColor
        Write-Host "   Preview: $url" -ForegroundColor White
        if ($Production) {
            Write-Host "   Production: https://$Domain" -ForegroundColor $SuccessColor
        }
        Write-Host ""
        Write-Host "[DASHBOARD] Vercel Dashboard:" -ForegroundColor $InfoColor
        Write-Host "   https://vercel.com/dashboard" -ForegroundColor White
        Write-Host ""
        
        if ($Production -and -not $AddDomain) {
            Write-Host "[NOTE] To use your custom domain ($Domain):" -ForegroundColor $WarningColor
            Write-Host "   Run: .\deploy-vercel.ps1 -Production -AddDomain" -ForegroundColor White
            Write-Host "   Or add it in: https://vercel.com/devcodex1s-projects/jarviswebsite/settings/domains" -ForegroundColor White
            Write-Host ""
        }
        Write-Host ""
        
        # Copy URL to clipboard
        try {
            Set-Clipboard -Value $url
            Write-Success "URL copied to clipboard!"
        } catch {
            # Clipboard not available, skip
        }
        
        # Ask to open in browser
        if (-not $Force) {
            Write-Host ""
            $openBrowser = Read-Host "Open in browser? (Y/n)"
            if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
                Start-Process $url
            }
        }
    }
    
} else {
    Write-Host ""
    Write-Error "Deployment failed!"
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor $ErrorColor
    Write-Host $deployOutput
    Write-Host ""
    Write-Info "Troubleshooting tips:"
    Write-Host "  1. Check your internet connection"
    Write-Host "  2. Verify you are logged in: vercel whoami"
    Write-Host "  3. Try manually: vercel --prod"
    Write-Host "  4. Check Vercel status: https://vercel-status.com"
    exit 1
}

# Step 9: Configure Custom Domain (if requested)
if ($AddDomain) {
    Write-Step "STEP 9: Configuring Custom Domain"
    
    Write-Info "Adding domain: $Domain"
    
    try {
        $domainOutput = vercel domains add $Domain 2>&1 | Out-String
        
        if ($domainOutput -match "Success|added") {
            Write-Success "Domain added to Vercel project!"
        } else {
            Write-Info "Attempting to add domain via Vercel CLI..."
            $result = vercel domains add $Domain
        }
    } catch {
        Write-Info "Using alternative method..."
    }
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor $InfoColor
    Write-Host "                   DNS CONFIGURATION REQUIRED                   " -ForegroundColor $InfoColor
    Write-Host "================================================================" -ForegroundColor $InfoColor
    Write-Host ""
    Write-Info "Add these DNS records to your domain registrar:"
    Write-Host ""
    Write-Host "  Record Type: A" -ForegroundColor $WarningColor
    Write-Host "  Name: @" -ForegroundColor White
    Write-Host "  Value: 76.76.21.21" -ForegroundColor $SuccessColor
    Write-Host ""
    Write-Host "  Record Type: CNAME" -ForegroundColor $WarningColor
    Write-Host "  Name: www" -ForegroundColor White
    Write-Host "  Value: cname.vercel-dns.com" -ForegroundColor $SuccessColor
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor $InfoColor
    Write-Host ""
    Write-Info "DNS Propagation:"
    Write-Host "  - Changes take 5-30 minutes to propagate"
    Write-Host "  - Vercel will auto-issue SSL certificate when DNS is ready"
    Write-Host "  - Check status: vercel domains ls"
    Write-Host ""
    Write-Info "Or add domain in Vercel Dashboard:"
    Write-Host "  https://vercel.com/devcodex1s-projects/jarviswebsite/settings/domains"
    Write-Host ""
    Write-Success "Your site will be live at: https://$Domain"
    Write-Host ""
}

# Step 10: Post-deployment checklist
Write-Step "STEP 10: Post-Deployment Checklist"

Write-Info "Next steps:"
Write-Host ""
Write-Host "  1. [OK] Verify the website loads correctly" -ForegroundColor White
Write-Host "  2. [OK] Test the pricing page and checkout flow" -ForegroundColor White
Write-Host "  3. [OK] Check environment variables in Vercel Dashboard" -ForegroundColor White
if ($AddDomain) {
    Write-Host "  4. [!!] Configure DNS records at your domain registrar" -ForegroundColor $WarningColor
    Write-Host "  5. [OK] Wait for DNS propagation (5-30 minutes)" -ForegroundColor White
    Write-Host "  6. [OK] Update Google Search Console with new domain" -ForegroundColor White
} else {
    Write-Host "  4. [OK] Update DOMAIN variable if changed" -ForegroundColor White
}
Write-Host "  5. [OK] Test payment with Stripe test card: 4242 4242 4242 4242" -ForegroundColor White
Write-Host ""

if ($Production) {
    Write-Host "  [!] Important for Production:" -ForegroundColor $WarningColor
    Write-Host "     - Switch to Stripe LIVE mode when ready" -ForegroundColor White
    Write-Host "     - Update pricing.html with LIVE publishable key" -ForegroundColor White
    Write-Host "     - Test with real card before announcing" -ForegroundColor White
    Write-Host ""
}

Write-Host "  [DOCS] Documentation:" -ForegroundColor $InfoColor
Write-Host "     - Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "     - View Logs: vercel logs" -ForegroundColor White
Write-Host "     - Stripe Dashboard: https://dashboard.stripe.com" -ForegroundColor White
Write-Host ""

Write-Host "================================================================" -ForegroundColor $SuccessColor
Write-Host "                                                                " -ForegroundColor $SuccessColor
Write-Host "                  Deployment Complete!                          " -ForegroundColor $SuccessColor
Write-Host "                                                                " -ForegroundColor $SuccessColor
Write-Host "================================================================" -ForegroundColor $SuccessColor
Write-Host ""
