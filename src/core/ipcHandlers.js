const { initializeDatabase, query, run, get, getDb } = require('./database');
const fs = require('fs').promises;
const path = require('path');

// Función para generar folio único
const generarFolio = () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const numero = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `COT-${año}${mes}-${numero}`;
};

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
      producto.precio_venta || 0, producto.notas
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

  // ==================== COTIZACIONES HANDLERS ====================

  ipcMain.handle('cotizaciones:getAll', async () => {
    return query(`
      SELECT c.*, cl.nombre as cliente_nombre 
      FROM cotizaciones c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha DESC
    `);
  });

  ipcMain.handle('cotizaciones:getById', async (_, id) => {
    const cotizacion = get(`
      SELECT c.*, cl.nombre as cliente_nombre, cl.telefono, cl.email 
      FROM cotizaciones c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = ?
    `, [id]);
    
    if (cotizacion) {
      cotizacion.detalles = query('SELECT * FROM cotizaciones_detalle WHERE cotizacion_id = ?', [id]);
    }
    return cotizacion;
  });

  ipcMain.handle('cotizaciones:create', async (_, cotizacion) => {
    const db = getDb();
    const folio = generarFolio();
    
    let cotizacionId;
    const transaction = db.transaction(() => {
      const result = run(`INSERT INTO cotizaciones 
        (folio, cliente_id, validez_dias, subtotal, iva, total, notas) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        folio, cotizacion.cliente_id, cotizacion.validez_dias || 15,
        cotizacion.subtotal || 0, cotizacion.iva || 0, cotizacion.total || 0,
        cotizacion.notas
      ]);
      cotizacionId = result.lastInsertRowid;

      if (cotizacion.detalles && cotizacion.detalles.length > 0) {
        const sqlDetalle = `INSERT INTO cotizaciones_detalle 
          (cotizacion_id, tipo, referencia_id, descripcion, cantidad, precio_unitario, descuento, total) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        for (const detalle of cotizacion.detalles) {
          run(sqlDetalle, [
            cotizacionId, detalle.tipo, detalle.referencia_id,
            detalle.descripcion, detalle.cantidad, detalle.precio_unitario,
            detalle.descuento || 0, detalle.total
          ]);
        }
      }
    });
    transaction();
    return { id: cotizacionId, folio };
  });

  ipcMain.handle('cotizaciones:update', async (_, id, cotizacion) => {
    const db = getDb();
    const transaction = db.transaction(() => {
      run(`UPDATE cotizaciones SET 
        cliente_id = ?, validez_dias = ?, subtotal = ?, iva = ?, total = ?, 
        notas = ?, estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [
        cotizacion.cliente_id, cotizacion.validez_dias, cotizacion.subtotal,
        cotizacion.iva, cotizacion.total, cotizacion.notas, cotizacion.estado, id
      ]);
      
      run('DELETE FROM cotizaciones_detalle WHERE cotizacion_id = ?', [id]);
      
      if (cotizacion.detalles && cotizacion.detalles.length > 0) {
        const sqlDetalle = `INSERT INTO cotizaciones_detalle 
          (cotizacion_id, tipo, referencia_id, descripcion, cantidad, precio_unitario, descuento, total) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        for (const detalle of cotizacion.detalles) {
          run(sqlDetalle, [
            id, detalle.tipo, detalle.referencia_id,
            detalle.descripcion, detalle.cantidad, detalle.precio_unitario,
            detalle.descuento || 0, detalle.total
          ]);
        }
      }
    });
    transaction();
    return { success: true };
  });

  ipcMain.handle('cotizaciones:changeStatus', async (_, id, estado) => {
    run('UPDATE cotizaciones SET estado = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [estado, id]);
    return { success: true };
  });

  ipcMain.handle('cotizaciones:delete', async (_, id) => {
    const result = run('DELETE FROM cotizaciones WHERE id = ?', [id]);
    return { success: result.changes > 0 };
  });

  ipcMain.handle('cotizaciones:getProductosDisponibles', async () => {
    return query(`SELECT id, nombre, codigo, precio_venta, unidad FROM inventario 
      WHERE tipo IN ('producto_terminado', 'materia_prima') AND cantidad > 0
      ORDER BY nombre`);
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
