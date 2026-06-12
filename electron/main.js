const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('../src/core/ipcHandlers');

const appId = 'com.cubomanager.desktop';
app.setAppUserModelId(appId);

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1280,
    minHeight: 820,
    maxWidth: 1280,
    maxHeight: 820,
    resizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  // Cargar el build de React
  const indexPath = path.join(__dirname, '../build/index.html');
  console.log('Cargando archivo:', indexPath);
  mainWindow.loadFile(indexPath);

  // Abrir DevTools para ver errores (comentar en producción)
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.once('ready-to-show', () => {
    console.log('Ventana lista para mostrar');
    mainWindow.show();
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('❌ Renderer process crashed');
  });

  return mainWindow;
}

function buildMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'toggledevtools', label: 'Alternar DevTools' },
      ],
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'close', label: 'Cerrar' },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Inicializar aplicación
app.whenReady().then(() => {
  console.log('✅ Electron app ready');
  buildMenu();
  createMainWindow();
  registerIpcHandlers(ipcMain, mainWindow);
});

// Activar cuando se hace clic en el dock (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Cerrar la aplicación cuando se cierren todas las ventanas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
