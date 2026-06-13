const path = require('path');
const fs = require('fs');
let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.warn('⚠️ better-sqlite3 no disponible');
  Database = null;
}

const { dataPath } = require('./config');

let db;

function initializeDatabase() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  const dbPath = path.join(dataPath, 'cubo_manager.db');
  
  if (Database) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Crear tablas principales
    db.exec(`
      CREATE TABLE IF NOT EXISTS configuraciones (
        clave TEXT PRIMARY KEY,
        valor TEXT,
        modulo TEXT DEFAULT 'global',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS preferencias_usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER DEFAULT 1,
        clave TEXT,
        valor TEXT,
        UNIQUE(usuario_id, clave)
      );
      
      CREATE TABLE IF NOT EXISTS fondos_por_modulo (
        modulo TEXT PRIMARY KEY,
        tipo TEXT DEFAULT 'color',
        valor TEXT DEFAULT '#1a1a2e',
        imagen_url TEXT
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        direccion TEXT,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertar valores por defecto
    const defaultConfigs = [
      ['theme', 'system'],
      ['language', 'es'],
      ['moneda', 'MXN'],
      ['backup_automatico', 'true'],
      ['notificaciones_sonido', 'true'],
      ['notificaciones_popup', 'true']
    ];

    const insertConfig = db.prepare(`INSERT OR IGNORE INTO configuraciones (clave, valor) VALUES (?, ?)`);
    for (const [key, value] of defaultConfigs) {
      insertConfig.run(key, value);
    }

    // Fondos por defecto por módulo
    const defaultBgModules = [
      'dashboard', 'customers', 'quotations', 'production',
      'warehouse', 'sales', 'finance', 'calendar', 'library', 'settings'
    ];

    const insertBg = db.prepare(`INSERT OR IGNORE INTO fondos_por_modulo (modulo, tipo, valor) VALUES (?, 'color', '#1a1a2e')`);
    for (const modulo of defaultBgModules) {
      insertBg.run(modulo);
    }
  }
}

function query(sql, params = []) {
  if (!db) return [];
  return db.prepare(sql).all(params);
}

function run(sql, params = []) {
  if (!db) return { changes: 0 };
  return db.prepare(sql).run(params);
}

function get(sql, params = []) {
  if (!db) return null;
  return db.prepare(sql).get(params);
}

module.exports = {
  initializeDatabase,
  query,
  run,
  get,
};
