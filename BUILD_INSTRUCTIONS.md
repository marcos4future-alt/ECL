# Build Instructions for Document Analyzer Windows Executable

## Current Status

The Electron application structure has been successfully created with all necessary files:

- ✅ Main Electron process (`main.js`)
- ✅ Preload script (`preload.js`)
- ✅ React application (`src/App.jsx`)
- ✅ HTML entry point (`public/index.html`)
- ✅ Package configuration (`package.json`)
- ✅ Build configuration

## Building on Windows (Recommended)

Since the current Linux environment has network restrictions preventing Electron binary downloads, **it's recommended to build this application on a Windows machine** with internet access:

### Steps:

1. **Transfer the project files** to a Windows machine
   - Copy the entire `ECL` folder to your Windows computer

2. **Install Node.js on Windows**
   - Download from: https://nodejs.org/
   - Install version 16.x or higher
   - Verify installation: `node --version`

3. **Open Command Prompt or PowerShell** in the project directory
   ```cmd
   cd path\to\ECL
   ```

4. **Install dependencies**
   ```cmd
   npm install
   ```

5. **Build the Windows executable**

   For a portable executable (recommended):
   ```cmd
   npm run build:portable
   ```

   For a standard installer:
   ```cmd
   npm run build
   ```

6. **Find your executable**
   - Location: `dist` folder
   - Portable: `Document Analyzer X.X.X.exe`
   - Installer: `Document Analyzer Setup X.X.X.exe`

## Building on Linux (Alternative)

If you have a Linux machine with proper internet access:

1. Install Node.js 16+
2. Clone/copy the project
3. Run: `npm install`
4. Run: `npm run build`
5. The Windows executables will be in the `dist` folder

## Using the Application

### First Launch

When you run the application for the first time:

1. You'll be prompted to enter your **Anthropic API Key**
2. Get your API key from: https://console.anthropic.com/settings/keys
3. The key is stored locally on your computer (not sent anywhere except to Anthropic's API)

### Features

- **Upload Documents**: PDF, Word, Excel files
- **Extract Images**: From PDFs (excluding headers/footers)
- **Compliance Analysis**: Add reference documents for compliance checking
- **AI Analysis**: Powered by Claude AI
- **Export Results**: Download as Excel, HTML, or complete ZIP packages

## Troubleshooting Build Issues

### Issue: Network Errors During npm install

**Symptom**: `getaddrinfo EAI_AGAIN github.com` or similar network errors

**Solutions**:
1. Check internet connection
2. Try building on a different network
3. Configure npm to use a different registry:
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```
4. Use a VPN if behind a restrictive firewall
5. Contact your IT department about proxy settings

### Issue: electron-builder Fails

**Solution**: Ensure you have:
- Windows SDK installed (on Windows)
- Wine installed (on Linux for Windows builds)
- Sufficient disk space (2GB+)
- Write permissions in the project directory

### Issue: Missing Icon

**Solution**: The app will work without a custom icon (using Electron's default). To add a custom icon:
1. Create a 256x256 PNG image
2. Save as `build/icon.png` or `build/icon.ico`
3. Rebuild the application

## Project Files Overview

```
ECL/
├── src/
│   └── App.jsx                  # React application with all UI and logic
├── public/
│   └── index.html               # HTML entry point loading React
├── build/
│   ├── icon-placeholder.txt     # Instructions for adding icon
│   └── icon.ico                 # (Add your icon here)
├── dist/                        # Generated after build - contains EXE files
├── node_modules/                # Generated after npm install
├── main.js                      # Electron main process
├── preload.js                   # Electron preload script
├── package.json                 # Dependencies and scripts
├── package-lock.json            # Locked versions (generated)
├── README.md                    # General documentation
└── BUILD_INSTRUCTIONS.md        # This file
```

## What Was Built

This project packages your React-based Document Analyzer into a standalone Windows desktop application using Electron. The application:

1. **Runs Offline**: Except for AI API calls, all document processing happens locally
2. **Self-Contained**: No need for users to install dependencies
3. **Portable**: Can run from any location without installation
4. **Secure**: API keys stored locally, never transmitted except to Anthropic

## Distribution

Once built, you can distribute either:

1. **Portable EXE** (`Document Analyzer X.X.X.exe`)
   - Single file
   - No installation required
   - Can run from USB/network drives
   - Recommended for most users

2. **Installer** (`Document Analyzer Setup X.X.X.exe`)
   - Installs to Program Files
   - Creates Start Menu shortcuts
   - Creates desktop shortcut
   - Can be uninstalled cleanly

## Next Steps After Building

1. **Test the executable** on a clean Windows machine
2. **Verify all features work** (file upload, image extraction, AI analysis)
3. **Test with different file types** (PDF, Excel, Word)
4. **Check API key management** works correctly
5. **Test download functionality** (ZIP, Excel export)

## Support

For issues during build:
1. Check this document first
2. Review the logs in `npm-debug.log`
3. Ensure all prerequisites are installed
4. Try building on a different machine/network

For runtime issues with the built app:
1. Check the Developer Console (Ctrl+Shift+I in the app)
2. Verify API key is set correctly
3. Check internet connection for API calls
4. Verify document formats are supported

## Alternative: Running in Development Mode

If you can't build but want to test the application:

1. Install dependencies: `npm install`
2. Run in dev mode: `npm start`
3. This launches the app without building an EXE

The dev mode is useful for:
- Testing changes
- Debugging issues
- Verifying functionality before building

## File Size Notes

The built executable will be approximately:
- **Portable EXE**: ~150-200 MB (includes Electron runtime + Chromium)
- **Installer**: ~160-210 MB

This size is normal for Electron applications and includes everything needed to run the app.
