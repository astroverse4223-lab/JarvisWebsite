# 🚀 Vercel Deployment Guide - JARVIS Omega Website

## Quick Deploy

### Option 1: Automatic Deployment (PowerShell - Windows)

```powershell
.\deploy-vercel.ps1
```

### Option 2: Manual Deployment

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

---

## First Time Setup

### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub (recommended) or email
- Free tier includes unlimited static deployments!

### 2. Install Vercel CLI
```bash
npm install -g vercel
```

### 3. Login
```bash
vercel login
```
Follow the prompts to authenticate.

---

## Deploy Your Website

### Using the Deploy Script (Recommended)

**Windows (PowerShell):**
```powershell
.\deploy-vercel.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

The script will:
- ✓ Check for Vercel CLI
- ✓ Copy website files
- ✓ Copy Jarvis.exe to downloads folder (if built)
- ✓ Deploy to Vercel
- ✓ Give you the live URL

### Manual Deployment

If you prefer to deploy manually:

```bash
# From project root
vercel --prod
```

When prompted:
- Project name: `jarvis-omega`
- Directory: `./website`
- Framework: `Other`
- Build command: (leave empty)
- Output directory: (leave empty)

---

## Uploading Jarvis Executable

### Step 1: Build Jarvis
First, build your executable:
```bash
python build.py
```
This creates `dist/Jarvis.exe`

### Step 2: Deploy with Executable
Run the deployment script which automatically includes the executable:
```powershell
.\deploy-vercel.ps1
```

### Step 3: Alternative - Upload to GitHub Releases
If you prefer GitHub hosting for downloads:

1. Push your code to GitHub
2. Go to your repository → Releases → Create new release
3. Upload `Jarvis.exe` as a release asset
4. Update `download.html` with the GitHub release URL

---

## Custom Domain Setup

### 1. Add Domain to Vercel
```bash
vercel domains add yourdomain.com
```

### 2. Configure DNS
In your domain registrar, add these records:

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Verify
Wait a few minutes for DNS propagation, then visit your domain!

---

## Environment Variables (Optional)

If you need to store API keys or secrets:

```bash
vercel env add API_KEY
```

Then access in your code via `process.env.API_KEY`

---

## Continuous Deployment

### GitHub Integration (Automatic Deploys)

1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure build settings:
     - Root Directory: `website`
     - Framework Preset: Other

2. **Automatic Deploys**
   - Every push to `main` branch = automatic deploy
   - Pull requests get preview deployments
   - No manual deployment needed!

---

## File Structure for Deployment

```
jarvis/
├── website/
│   ├── index.html          # Main page
│   ├── download.html       # Download page (NEW)
│   ├── styles.css          # Styles
│   ├── script.js          # JavaScript
│   └── downloads/         # For executable
│       └── Jarvis-Omega.exe
├── vercel.json            # Vercel config
├── deploy-vercel.ps1      # Windows deploy script
└── deploy-vercel.sh       # Linux/Mac deploy script
```

---

## Download Hosting Options

### Option 1: Host on Vercel (Up to 100MB)
- Place `Jarvis.exe` in `website/downloads/`
- Deploy with script
- Download URL: `https://yoursite.com/downloads/Jarvis-Omega.exe`

### Option 2: GitHub Releases (Recommended for large files)
- Upload to GitHub Releases
- Update download.html with GitHub URL
- Benefits: Unlimited size, version tracking, download stats

### Option 3: Cloud Storage (Best for frequent updates)
- Use Google Drive, Dropbox, or AWS S3
- Get shareable link
- Update download.html with storage URL

---

## Troubleshooting

### ❌ "Command not found: vercel"
```bash
npm install -g vercel
```

### ❌ "404 Not Found" after deployment
- Check `vercel.json` routing configuration
- Ensure website files are in correct directory
- Run: `vercel --prod` again

### ❌ Download button not working
- Check if `Jarvis.exe` is in `website/downloads/`
- Verify file size < 100MB for Vercel hosting
- Test download URL: `https://yoursite.com/downloads/Jarvis-Omega.exe`

### ❌ "File too large"
Vercel free tier limits:
- Individual files: 100MB
- Total deployment: 100GB
- For larger files, use GitHub Releases or cloud storage

---

## Deployment Checklist

Before deploying:
- [ ] Test website locally (open `website/index.html`)
- [ ] Build Jarvis executable (`python build.py`)
- [ ] Update GitHub repository URL in download.html
- [ ] Test all navigation links
- [ ] Verify download button functionality
- [ ] Check mobile responsiveness
- [ ] Run deployment script
- [ ] Test live website
- [ ] Configure custom domain (optional)

---

## Update Your Website

To update after changes:

```powershell
# Make your changes to HTML/CSS/JS
# Then deploy:
.\deploy-vercel.ps1
```

Changes are live in ~30 seconds!

---

## Cost

**Vercel Free Tier includes:**
- ✓ Unlimited static deployments
- ✓ Automatic HTTPS
- ✓ Global CDN
- ✓ Preview deployments
- ✓ Custom domains
- ✓ 100GB bandwidth/month

**Perfect for hosting Jarvis Omega website!**

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Discord:** https://vercel.com/discord
- **Issues?** Check the troubleshooting section above

---

## Pro Tips

1. **Enable Analytics**
   - Go to Vercel dashboard → Analytics
   - Get free visitor insights

2. **Speed Insights**
   - Enable in Vercel dashboard
   - Monitor website performance

3. **Preview Deployments**
   - Every git branch gets a preview URL
   - Test changes before going live

4. **Vercel CLI Shortcuts**
   ```bash
   vercel          # Preview deployment
   vercel --prod   # Production deployment
   vercel ls       # List deployments
   vercel rm       # Remove deployment
   ```

---

## Example: Complete First Deployment

```powershell
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Build your executable (optional)
python build.py

# 4. Deploy
.\deploy-vercel.ps1

# 5. Visit your live site!
# URL will be shown in terminal
```

**That's it! Your Jarvis Omega website is live! 🚀**
