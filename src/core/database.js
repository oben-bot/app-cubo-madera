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

      CREATE TABLE IF NOT EXISTS trabajos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_trabajo TEXT UNIQUE,
        cotizacion_id INTEGER,
        cliente_id INTEGER NOT NULL,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        estado TEXT DEFAULT 'en_cola',
        prioridad INTEGER DEFAULT 1,
        fecha_inicio DATETIME,
        fecha_entrega_estimada DATETIME,
        fecha_entrega_real DATETIME,
        materiales_usados TEXT,
        costo_materiales REAL DEFAULT 0,
        costo_mano_obra REAL DEFAULT 0,
        precio_total REAL DEFAULT 0,
        ganancia REAL DEFAULT 0,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );
      
      CREATE TABLE IF NOT EXISTS evidencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trabajo_id INTEGER NOT NULL,
        tipo TEXT DEFAULT 'imagen',
        archivo_ruta TEXT NOT NULL,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS trabajo_actividades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trabajo_id INTEGER NOT NULL,
        actividad TEXT NOT NULL,
        usuario TEXT,
        duracion_minutos INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folio TEXT UNIQUE,
        trabajo_id INTEGER,
        cliente_id INTEGER NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        subtotal REAL DEFAULT 0,
        iva REAL DEFAULT 0,
        total REAL DEFAULT 0,
        metodo_pago TEXT DEFAULT 'efectivo',
        referencia_pago TEXT,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajo_id) REFERENCES trabajos(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );
      
      CREATE TABLE IF NOT EXISTS ventas_detalle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venta_id INTEGER NOT NULL,
        producto_id INTEGER,
        descripcion TEXT NOT NULL,
        cantidad REAL DEFAULT 1,
        precio_unitario REAL DEFAULT 0,
        total REAL DEFAULT 0,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES inventario(id)
      );
      
      CREATE TABLE IF NOT EXISTS finanzas_movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL, -- 'ingreso', 'egreso'
        categoria TEXT, -- 'venta', 'compra_material', 'gasto_operativo', 'salario'
        monto REAL NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        referencia_id INTEGER, -- ID de venta, compra, etc.
        referencia_tipo TEXT,
        descripcion TEXT,
        usuario TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calendario_eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        tipo TEXT NOT NULL, -- 'trabajo', 'cotizacion', 'recordatorio', 'personal'
        referencia_id INTEGER, -- ID del trabajo, cotización, etc.
        fecha_inicio DATETIME NOT NULL,
        fecha_fin DATETIME,
        color TEXT,
        recordatorio_minutos INTEGER DEFAULT 0,
        completado BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_inventario_nombre ON inventario(nombre);
      CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);
      CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario(producto_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(created_at);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON cotizaciones(fecha);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_detalle_cotizacion ON cotizaciones_detalle(cotizacion_id);
      CREATE INDEX IF NOT EXISTS idx_trabajos_cliente ON trabajos(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos(estado);
      CREATE INDEX IF NOT EXISTS idx_trabajos_fecha_inicio ON trabajos(fecha_inicio);
      CREATE INDEX IF NOT EXISTS idx_trabajos_numero ON trabajos(numero_trabajo);
      CREATE INDEX IF NOT EXISTS idx_evidencias_trabajo ON evidencias(trabajo_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
      CREATE INDEX IF NOT EXISTS idx_finanzas_fecha ON finanzas_movimientos(fecha);
      CREATE INDEX IF NOT EXISTS idx_finanzas_tipo ON finanzas_movimientos(tipo);
      CREATE INDEX IF NOT EXISTS idx_calendario_fecha ON calendario_eventos(fecha_inicio);
      CREATE INDEX IF NOT EXISTS idx_calendario_tipo ON calendario_eventos(tipo);
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
