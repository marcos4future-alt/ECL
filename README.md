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

The application requires an Anthropic API Key to function. You can:

1. Enter it when prompted on first launch
2. Update it later by opening DevTools (Ctrl+Shift+I) and running:
   ```javascript
   localStorage.setItem('anthropic_api_key', 'your-key-here')
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
