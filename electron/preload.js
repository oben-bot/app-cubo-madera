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
  // Inventario
  inventario: {
    getAll: () => ipcRenderer.invoke('inventario:getAll'),
    getById: (id) => ipcRenderer.invoke('inventario:getById', id),
    create: (producto) => ipcRenderer.invoke('inventario:create', producto),
    update: (id, producto) => ipcRenderer.invoke('inventario:update', id, producto),
    delete: (id) => ipcRenderer.invoke('inventario:delete', id),
    registrarMovimiento: (movimiento) => ipcRenderer.invoke('inventario:registrarMovimiento', movimiento),
    getMovimientos: (productoId) => ipcRenderer.invoke('inventario:getMovimientos', productoId),
    getAlertasStock: () => ipcRenderer.invoke('inventario:getAlertasStock')
  },
  // Cotizaciones
  cotizaciones: {
    getAll: () => ipcRenderer.invoke('cotizaciones:getAll'),
    getById: (id) => ipcRenderer.invoke('cotizaciones:getById', id),
    create: (cotizacion) => ipcRenderer.invoke('cotizaciones:create', cotizacion),
    update: (id, cotizacion) => ipcRenderer.invoke('cotizaciones:update', id, cotizacion),
    changeStatus: (id, estado) => ipcRenderer.invoke('cotizaciones:changeStatus', id, estado),
    delete: (id) => ipcRenderer.invoke('cotizaciones:delete', id),
    getProductosDisponibles: () => ipcRenderer.invoke('cotizaciones:getProductosDisponibles')
  },
  // Ventana
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  }
});
