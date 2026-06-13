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

      CREATE TABLE IF NOT EXISTS inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE,
        nombre TEXT NOT NULL,
        categoria TEXT DEFAULT 'material',
        tipo TEXT DEFAULT 'materia_prima',
        cantidad REAL DEFAULT 0,
        unidad TEXT DEFAULT 'unidad',
        stock_minimo REAL DEFAULT 0,
        ubicacion TEXT,
        proveedor TEXT,
        precio_compra REAL DEFAULT 0,
        precio_venta REAL DEFAULT 0,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL,
        cantidad REAL NOT NULL,
        motivo TEXT,
        referencia_id INTEGER,
        referencia_tipo TEXT,
        usuario TEXT,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_id) REFERENCES inventario(id)
      );

      CREATE TABLE IF NOT EXISTS cotizaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folio TEXT UNIQUE,
        cliente_id INTEGER NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        validez_dias INTEGER DEFAULT 15,
        subtotal REAL DEFAULT 0,
        iva REAL DEFAULT 0,
        total REAL DEFAULT 0,
        estado TEXT DEFAULT 'pendiente',
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );
      
      CREATE TABLE IF NOT EXISTS cotizaciones_detalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cotizacion_id INTEGER NOT NULL,
        tipo TEXT DEFAULT 'producto',
        referencia_id INTEGER,
        descripcion TEXT NOT NULL,
        cantidad REAL DEFAULT 1,
        precio_unitario REAL DEFAULT 0,
        descuento REAL DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_inventario_nombre ON inventario(nombre);
      CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);
      CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(producto_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(created_at);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones(fecha);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_detalle_cotizacion ON cotizaciones_detalle(cotizacion_id);
    `);

    // Insertar valores por defecto de configuración
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

    // Insertar productos de ejemplo
    const count = db.prepare('SELECT COUNT(*) as total FROM inventario').get();
    if (count.total === 0) {
      const sampleProducts = [
        ['MDF-3MM', 'MDF 3mm', 'material', 'materia_prima', 100, 'plancha', 20, 'Estante A1', 'Maderas Lopez', 45, 80, 'MDF estándar 3mm'],
        ['MDF-6MM', 'MDF 6mm', 'material', 'materia_prima', 50, 'plancha', 10, 'Estante A2', 'Maderas Lopez', 75, 120, 'MDF estándar 6mm'],
        ['ACR-3MM', 'Acrílico Transparente 3mm', 'material', 'materia_prima', 30, 'plancha', 5, 'Estante B1', 'Acrilicos SA', 120, 200, 'Acrílico cristal'],
        ['LAM-HEXA', 'Lámpara Hexágono', 'producto', 'producto_terminado', 15, 'unidad', 5, 'Estante C1', null, 0, 350, 'Lámpara decorativa'],
        ['LLAV-CUBO', 'Llavero Cubo', 'producto', 'producto_terminado', 50, 'unidad', 10, 'Estante C2', null, 0, 80, 'Llavero acrílico'],
      ];
      
      const insertStmt = db.prepare(`INSERT INTO inventario 
        (codigo, nombre, categoria, tipo, cantidad, unidad, stock_minimo, ubicacion, proveedor, precio_compra, precio_venta, notas) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      for (const product of sampleProducts) {
        insertStmt.run(product);
      }
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

function getDb() {
  return db;
}

module.exports = {
  initializeDatabase,
  query,
  run,
  get,
  getDb,
};
