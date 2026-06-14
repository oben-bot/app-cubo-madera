const { getDatabase, runQuery, getQuery, allQuery } = require('./database');

function registerIpcHandlers(ipcMain) {
  // ==================== CONFIGURACIÓN HANDLERS ====================
  ipcMain.handle('config:get', async (event, key) => {
    const result = await getQuery('SELECT valor FROM configuraciones WHERE clave = ?', [key]);
    return result ? result.valor : null;
  });

  ipcMain.handle('config:set', async (event, key, value) => {
    await runQuery('INSERT OR REPLACE INTO configuraciones (clave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [key, value]);
    return { success: true };
  });

  // ==================== CLIENTES HANDLERS ====================
  ipcMain.handle('clientes:getAll', async () => {
    return await allQuery('SELECT * FROM clientes ORDER BY nombre');
  });

  ipcMain.handle('clientes:create', async (event, cliente) => {
    const result = await runQuery(
      'INSERT INTO clientes (nombre, telefono, email, direccion, notas) VALUES (?, ?, ?, ?, ?)',
      [cliente.nombre, cliente.telefono, cliente.email, cliente.direccion, cliente.notas]
    );
    return { id: result.lastID };
  });

  // ==================== DATABASE GENERAL ====================
  ipcMain.handle('database:query', async (event, sql, params) => {
    return await allQuery(sql, params);
  });

  ipcMain.handle('database:run', async (event, sql, params) => {
    return await runQuery(sql, params);
  });

  ipcMain.handle('database:get', async (event, sql, params) => {
    return await getQuery(sql, params);
  });
}

module.exports = { registerIpcHandlers };
