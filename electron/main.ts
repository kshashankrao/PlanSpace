import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import contextMenu from 'electron-context-menu';

contextMenu({
  showSearchWithGoogle: false,
  showInspectElement: true,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden', // Native looking header on Mac/Windows
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#000000',
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
  
  // Prevent any new windows from opening within Electron to avoid cache lock bugs and vulnerabilities
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();

  // Setup auto updater
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });
  autoUpdater.on('update-available', (info) => {
    console.log('Update available.', info);
  });
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.', info);
  });
  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater.', err);
  });
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
  });
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded', info);
    // The update will automatically be installed when the app quits
  });

  autoUpdater.checkForUpdatesAndNotify();
});
