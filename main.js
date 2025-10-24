const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;
let apiKey = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build', 'icon.ico'),
    title: 'Document Analyzer - Avantis ECL powered by iDC'
  });

  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Prompt for API key on startup
  mainWindow.webContents.on('did-finish-load', () => {
    promptForApiKey();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function promptForApiKey() {
  // Show a dialog to enter API key
  const { dialog } = require('electron');

  mainWindow.webContents.executeJavaScript(`
    (function() {
      const key = localStorage.getItem('anthropic_api_key');
      if (!key) {
        const userKey = prompt('Please enter your Anthropic API Key:\\n\\nYou can get an API key from:\\nhttps://console.anthropic.com/settings/keys\\n\\nNote: This will be stored locally on your computer.');
        if (userKey) {
          localStorage.setItem('anthropic_api_key', userKey);
          window.ANTHROPIC_API_KEY = userKey;
        } else {
          alert('Warning: No API key provided. The application requires an API key to function properly.\\n\\nYou can set it later by opening the browser console and running:\\nlocalStorage.setItem("anthropic_api_key", "your-key-here")');
        }
      } else {
        window.ANTHROPIC_API_KEY = key;
      }
    })();
  `);
}

// Handle API key requests from renderer
ipcMain.handle('get-api-key', async () => {
  return apiKey;
});

ipcMain.handle('set-api-key', async (event, key) => {
  apiKey = key;
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
