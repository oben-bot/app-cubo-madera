const path = require('path');
const {
  initializeStorage,
  listFolder,
  copyFile,
  moveFile,
  deletePath,
  optimizeImage,
} = require('./fileSystem');
const {
  initializeDatabase,
  getModuleItems,
  saveModuleItem,
  deleteModuleItem,
  getLibraryItems,
  saveLibraryItems,
  getSettings,
  saveSettings,
} = require('./database');

function registerIpcHandlers(ipcMain, mainWindow) {
  initializeStorage();
  initializeDatabase();

  ipcMain.handle('desktop/initialize', async () => ({ status: 'ok' }));

  ipcMain.handle('desktop/list-folder', async (_, folderKey) => {
    const folders = {
      inventory: 'inventoryFolder',
      catalog: 'catalogFolder',
      sync: 'syncFolder',
    };
    const { [folders[folderKey]]: folderPath } = require('./config');
    return listFolder(folderPath);
  });

  ipcMain.handle('desktop/copy-file', async (_, source, destination) => {
    copyFile(source, destination);
    return { status: 'copied' };
  });

  ipcMain.handle('desktop/move-file', async (_, source, destination) => {
    moveFile(source, destination);
    return { status: 'moved' };
  });

  ipcMain.handle('desktop/delete-path', async (_, targetPath) => {
    deletePath(targetPath);
    return { status: 'deleted' };
  });

  ipcMain.handle('desktop/optimize-image', async (_, source, destination, options) => {
    return optimizeImage(source, destination, options);
  });

  ipcMain.handle('desktop/get-db-items', async (_, moduleName) => {
    return getModuleItems(moduleName);
  });

  ipcMain.handle('desktop/save-db-item', async (_, moduleName, item) => {
    return saveModuleItem(moduleName, item);
  });

  ipcMain.handle('desktop/delete-db-item', async (_, moduleName, id) => {
    return deleteModuleItem(moduleName, id);
  });

  ipcMain.handle('desktop/get-library', async () => {
    return getLibraryItems();
  });

  ipcMain.handle('desktop/save-library', async (_, items) => {
    saveLibraryItems(items);
    return { status: 'saved' };
  });

  ipcMain.handle('desktop/get-settings', async () => getSettings());

  ipcMain.handle('desktop/update-settings', async (_, settings) => {
    saveSettings(settings);
    return { status: 'saved' };
  });

  // === AUTHENTICATION HANDLERS ===
  ipcMain.handle('save-auth', async (_, { email, theme }) => {
    const settings = getSettings();
    settings.email = email;
    settings.theme = theme || 'dark';
    settings.lastLogin = new Date().toISOString();
    saveSettings(settings);
    return { status: 'saved' };
  });

  ipcMain.handle('send-recovery-email', async (_, { email }) => {
    // Implementación de envío de email (necesita configuración de SMTP)
    console.log(`Recovery email requested for: ${email}`);
    // TODO: Integrar nodemailer para envío real
    return { status: 'pending', message: 'Email enviado (modo demo)' };
  });

  ipcMain.handle('verify-credentials', async (_, { email, password }) => {
    // Validación básica (en producción, usar hash de contraseña en DB)
    const DEFAULT_EMAIL = 'obenrojas@gmail.com';
    const DEFAULT_PASSWORD = 'CuboManager2026';
    
    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
      return { valid: true };
    }
    return { valid: false };
  });

  // === BIBLIOTECA LASER MINI-APP ===
  ipcMain.handle('launch-mini-app', async (_, appPath) => {
    const { spawn } = require('child_process');
    const path = require('path');
    
    try {
      // Validar que el archivo existe
      const fs = require('fs');
      if (!fs.existsSync(appPath)) {
        return { success: false, error: 'Archivo no encontrado: ' + appPath };
      }

      // Ejecutar el archivo .pyw con Python
      const pythonProcess = spawn('python', [appPath], {
        detached: true,
        stdio: 'ignore'
      });

      pythonProcess.unref(); // Permitir que el proceso se ejecute independientemente
      return { success: true, message: 'Mini-App iniciada' };
    } catch (err) {
      console.error('Error launching mini-app:', err);
      return { success: false, error: err.message };
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
