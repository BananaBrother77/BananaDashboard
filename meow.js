const { app, BrowserWindow } = require('electron');
const path = require('path');

// 1. Function to create the desktop window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
  });

  mainWindow.loadFile('index.html');
}

// Start the app when Electron is ready
app.whenReady().then(() => {
  createWindow();
});
