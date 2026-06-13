const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al frontend
contextBridge.exposeInMainWorld('electron', {
  // Base de datos
  database: {
    query: (sql, params) => ipcRenderer.invoke('database:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('database:run', sql, params),
    get: (sql, params) => ipcRenderer.invoke('database:get', sql, params)
  },
  // Sistema de archivos
  fs: {
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path, data) => ipcRenderer.invoke('fs:writeFile', path, data),
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path)
  },
  // Configuración
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value)
  },
  // Ventana
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  }
});
