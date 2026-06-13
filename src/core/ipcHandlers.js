const { initializeDatabase, query, run, get, getDb } = require('./database');
const fs = require('fs').promises;
const path = require('path');

function registerIpcHandlers(ipcMain, mainWindow) {
  initializeDatabase();

  // Base de datos general
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

  // ==================== INVENTARIO HANDLERS ====================
  
  ipcMain.handle('inventario:getAll', async () => {
    return query('SELECT * FROM inventario ORDER BY nombre');
  });

  ipcMain.handle('inventario:getById', async (_, id) => {
    return get('SELECT * FROM inventario WHERE id = ?', [id]);
  });

  ipcMain.handle('inventario:create', async (_, producto) => {
    const sql = `INSERT INTO inventario 
      (codigo, nombre, categoria, tipo, cantidad, unidad, stock_minimo, ubicacion, proveedor, precio_compra, precio_venta, notas) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const result = run(sql, [
      producto.codigo, producto.nombre, producto.categoria, producto.tipo,
      producto.cantidad || 0, producto.unidad || 'unidad', producto.stock_minimo || 0,
      producto.ubicacion, producto.proveedor, producto.precio_compra || 0,
      producto.precio_venta || 0, producto.notes
    ]);
    return { id: result.lastInsertRowid, ...producto };
  });

  ipcMain.handle('inventario:update', async (_, id, producto) => {
    const sql = `UPDATE inventario SET 
      codigo = ?, nombre = ?, categoria = ?, tipo = ?, cantidad = ?, unidad = ?,
      stock_minimo = ?, ubicacion = ?, proveedor = ?, precio_compra = ?, precio_venta = ?, 
      notas = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    run(sql, [
      producto.codigo, producto.nombre, producto.categoria, producto.tipo,
      producto.cantidad, producto.unidad, producto.stock_minimo,
      producto.ubicacion, producto.proveedor, producto.precio_compra,
      producto.precio_venta, producto.notas, id
    ]);
    return { id, ...producto };
  });

  ipcMain.handle('inventario:delete', async (_, id) => {
    const result = run('DELETE FROM inventario WHERE id = ?', [id]);
    return { success: result.changes > 0 };
  });

  ipcMain.handle('inventario:registrarMovimiento', async (_, movimiento) => {
    const db = getDb();
    const transaction = db.transaction(() => {
      run(`UPDATE inventario SET cantidad = cantidad + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
        [movimiento.cantidad, movimiento.producto_id]);
      
      const sqlMov = `INSERT INTO movimientos_inventario 
        (producto_id, tipo, cantidad, motivo, referencia_id, referencia_tipo, usuario, notas) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      run(sqlMov, [
        movimiento.producto_id, movimiento.tipo, movimiento.cantidad,
        movimiento.motivo, movimiento.referencia_id, movimiento.referencia_tipo,
        movimiento.usuario, movimiento.notas
      ]);
    });
    transaction();
    return { success: true };
  });

  ipcMain.handle('inventario:getMovimientos', async (_, productoId) => {
    return query(`SELECT * FROM movimientos_inventario 
      WHERE producto_id = ? ORDER BY created_at DESC LIMIT 50`, [productoId]);
  });

  ipcMain.handle('inventario:getAlertasStock', async () => {
    return query(`SELECT * FROM inventario 
      WHERE cantidad <= stock_minimo AND stock_minimo > 0 
      ORDER BY (cantidad / stock_minimo) ASC`);
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
