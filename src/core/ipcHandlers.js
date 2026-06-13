const { initializeDatabase, query, run, get } = require('./database');
const fs = require('fs').promises;
const path = require('path');

function registerIpcHandlers(ipcMain, mainWindow) {
  initializeDatabase();

  // Base de datos
  ipcMain.handle('database:query', async (_, sql, params) => {
    return query(sql, params);
  });

  ipcMain.handle('database:run', async (_, sql, params) => {
    return run(sql, params);
  });

  ipcMain.handle('database:get', async (_, sql, params) => {
    return get(sql, params);
  });

  // Sistema de archivos
  ipcMain.handle('fs:readFile', async (_, filePath) => {
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('fs:writeFile', async (_, filePath, data) => {
    await fs.writeFile(filePath, data);
    return { success: true };
  });

  ipcMain.handle('fs:readDir', async (_, dirPath) => {
    return fs.readdir(dirPath);
  });

  // Configuración
  ipcMain.handle('config:get', async (_, key) => {
    const result = get('SELECT valor FROM configuraciones WHERE clave = ?', [key]);
    return result ? result.valor : null;
  });

  ipcMain.handle('config:set', async (_, key, value) => {
    return run(
      'INSERT OR REPLACE INTO configuraciones (clave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [key, value]
    );
  });

  // Ventana
  ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
