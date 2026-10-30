const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    show: false,
    title: 'AtbinYar - آزمایشگاه ریاضی',
    icon: path.join(__dirname, 'icon_512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function configureAutoUpdates() {
  if (!app.isPackaged || process.platform === 'darwin') return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = console;

  autoUpdater.on('error', (error) => {
    console.error('[AtbinYar updater]', error);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AtbinYar updater] Update downloaded:', info.version);
  });

  // Checks the public MathLab-App GitHub Releases feed.
  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error('[AtbinYar updater] Update check failed:', error);
  });
}

app.whenReady().then(() => {
  createWindow();
  configureAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
