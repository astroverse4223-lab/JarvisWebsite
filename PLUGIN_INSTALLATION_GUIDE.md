# Plugin Installation Guide for JARVIS Omega

## How to Install Plugins

### Step 1: Download Plugin from Marketplace
1. Visit the [Plugin Marketplace](https://jarvisassistant.online/plugins) (Pro membership required)
2. Browse or search for the plugin you want
3. Click the "Download Plugin" button
4. The plugin `.zip` file will be downloaded to your Downloads folder

### Step 2: Open JARVIS Plugin Manager
1. Launch JARVIS Omega
2. Say **"JARVIS, open settings"** or click the Settings icon
3. Navigate to **Plugins** tab
4. Click **"Install Plugin"** button

### Step 3: Select Downloaded Plugin
1. A file browser will open
2. Navigate to your Downloads folder
3. Select the plugin `.zip` file you downloaded
4. Click **"Open"**

### Step 4: Install and Enable
1. JARVIS will verify the plugin signature
2. Review the plugin permissions (what access it needs)
3. Click **"Install"** to confirm
4. The plugin will be extracted and installed
5. Toggle the **Enable** switch to activate the plugin

### Step 5: Test the Plugin
1. Try the voice commands listed in the plugin description
2. Check plugin settings if customization is needed
3. Restart JARVIS if prompted for full activation

## Plugin Management

### View Installed Plugins
- Settings > Plugins > **Installed** tab
- Shows all installed plugins with enable/disable toggles

### Update Plugins
- JARVIS checks for updates automatically
- Click **"Update Available"** badge to install updates
- Or check marketplace for newer versions

### Uninstall Plugins
- Settings > Plugins > Find the plugin
- Click the trash icon or **"Uninstall"** button
- Confirm removal

### Plugin Settings
- Each plugin may have its own settings page
- Click the gear icon next to plugin name
- Configure API keys, preferences, behavior

## Troubleshooting

### Plugin Won't Install
- **Check file integrity**: Re-download the plugin
- **Verify Pro status**: Only Pro members can install plugins
- **Check JARVIS version**: Plugin may require newer JARVIS version
- **Antivirus blocking**: Temporarily disable and try again

### Plugin Not Working
- **Restart JARVIS**: Some plugins require restart
- **Check permissions**: Review plugin permissions in settings
- **Check logs**: Settings > Advanced > View Logs
- **Update plugin**: Ensure you have the latest version

### Voice Commands Not Recognized
- **Check plugin status**: Make sure it's enabled (green toggle)
- **Review commands**: Check plugin description for exact wording
- **Retrain voice**: Settings > Voice > Retrain Recognition
- **Check microphone**: Test in JARVIS settings

## Plugin Security

### Official vs Community Plugins
- **Official** (✓ badge): Created and verified by JARVIS Team
- **Community**: Created by third-party developers

### Permission System
Plugins may request:
- **Microphone Access**: For voice commands
- **File System**: To read/write files
- **Network Access**: To connect to external services
- **System Control**: To control Windows features
- **Clipboard**: To read/write clipboard data

### Best Practices
- ✅ Only install plugins you trust
- ✅ Review permissions before installing
- ✅ Keep plugins updated
- ✅ Disable unused plugins
- ⚠️ Be cautious with community plugins
- ⚠️ Don't share API keys in plugin settings

## Plugin Directory Structure
```
C:\Users\[YourName]\AppData\Roaming\JARVIS Omega\Plugins\
├── spotify-control\
│   ├── plugin.json
│   ├── main.py
│   ├── icon.png
│   └── requirements.txt
├── email-assistant\
│   ├── plugin.json
│   ├── main.py
│   └── ...
```

## Creating Custom Plugins

Want to create your own plugin? Check out our [Plugin Developer Guide](https://jarvisassistant.online/docs/plugin-development).

### Quick Start
1. Download the Plugin Template
2. Edit `plugin.json` with your plugin metadata
3. Write your voice command handlers in `main.py`
4. Test locally with JARVIS Developer Mode
5. Submit to marketplace for review

## Need Help?

- 📧 Email: support@jarvisassistant.online
- 💬 Discord: [JARVIS Community Server](https://discord.gg/jarvis-omega)
- 📚 Docs: [jarvisassistant.online/docs](https://jarvisassistant.online/docs)
- 🐛 Report Bugs: [GitHub Issues](https://github.com/jarvis-omega/plugins/issues)

---

## Popular Plugins

### Must-Have Plugins
1. **Email Assistant** - Manage emails hands-free
2. **Calendar Integration** - Never miss a meeting
3. **Spotify Controller** - Voice-controlled music
4. **Smart Home Hub** - Control your smart devices
5. **File Organizer** - Auto-organize your files

### Productivity Boosters
- Task Manager Pro
- Meeting Assistant  
- Voice Notes Pro
- Focus Mode
- Clipboard Manager

### Entertainment
- YouTube Controller
- News Reader
- Workout Coach
- Recipe Finder
- Meditation Guide

Browse all 30+ plugins at the [Plugin Marketplace](https://jarvisassistant.online/plugins)!
