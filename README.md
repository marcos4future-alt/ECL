# Document Analyzer - Windows Desktop Application

**Avantis ECL powered by iDC**

A desktop application for extracting images from PDFs, analyzing Excel multi-tab files, and processing documents with AI.

## Features

- Extract images from PDF documents
- Analyze Excel files with multiple sheets/tabs
- Support for compliance reference documents (PDF, XML, CSV, TSX, Text)
- AI-powered document analysis using Claude API
- Download results as Excel, HTML, or ZIP packages
- Offline-capable desktop application

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Anthropic API Key (get one at https://console.anthropic.com/settings/keys)

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Add an application icon:
   - Place a 256x256 PNG icon at `build/icon.png`
   - The build process will convert it to .ico format
   - If no icon is provided, Windows will use the default Electron icon

## Running the Application

To run the app in development mode:
```bash
npm start
```

On first launch, you'll be prompted to enter your Anthropic API Key. This key is stored locally on your computer.

## Building Windows Executable

### Build Standard Installer
```bash
npm run build
```

This creates a Windows installer (.exe) in the `dist` folder.

### Build Portable Version
```bash
npm run build:portable
```

This creates a portable .exe that doesn't require installation.

## Distribution

After building, you'll find the following in the `dist` folder:

- **Document Analyzer Setup X.X.X.exe** - Standard installer (NSIS)
- **Document Analyzer X.X.X.exe** - Portable executable (no installation required)

The portable version is recommended for distribution as it:
- Doesn't require installation
- Can run from any location (USB drive, network share, etc.)
- Doesn't require admin rights

## API Key Management

The application requires an Anthropic API Key for AI-powered document analysis.

### Adding Your API Key

When you first launch the app, you'll see a prominent **API Key Management** section at the top:

1. Click the **"Add API Key"** button
2. Enter your Anthropic API key (get one at: https://console.anthropic.com/settings/keys)
3. Click **"Save API Key"** (or press Enter)
4. Your key is now configured and ready to use!

### API Key Features

- **Secure Storage**: Stored locally in your browser (never sent anywhere except Anthropic's API)
- **Password Masked**: Input is hidden for security
- **Easy Updates**: Click "Update" to change your key anytime
- **Status Display**: Shows last 4 characters when configured (e.g., •••••••a1b2)
- **Direct Links**: One-click access to Anthropic's key generation page
- **Validation**: Automatic check before analysis to ensure key is configured

### Alternative Methods

If you prefer, you can also set the API key via DevTools (Ctrl+Shift+I):
```javascript
localStorage.setItem('anthropic_api_key', 'your-key-here')
// Then refresh the page
```

## Troubleshooting

### Libraries Not Loading
If you see "Libraries still loading..." for a long time:
- Check your internet connection (required for CDN resources)
- Try restarting the application

### API Errors
If you get API errors:
- Verify your API key is correct
- Check your internet connection
- Ensure you have API credits available

### Build Errors
If the build fails:
- Ensure Node.js v16+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Make sure you have write permissions in the project directory

## Project Structure

```
ECL/
├── src/
│   └── App.jsx              # Main React application
├── public/
│   └── index.html           # HTML entry point
├── build/
│   └── icon.ico             # Application icon
├── dist/                    # Built executables (generated)
├── main.js                  # Electron main process
├── preload.js               # Electron preload script
├── package.json             # Dependencies and build config
└── README.md               # This file
```

## License

ISC

## Author

Avantis Group
