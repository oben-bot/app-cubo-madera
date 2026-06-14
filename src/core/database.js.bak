const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function initializeDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'cubo_manager.db');
  
  // Asegurar que el directorio data existe
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  db = new Database(dbPath);

  // Habilitar claves foráneas
  db.pragma('foreign_keys = ON');

  // Crear tablas
  db.exec(`
    -- Tabla de clientes
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      direccion TEXT,
      empresa TEXT,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de inventario
    CREATE TABLE IF NOT EXISTS inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      nombre TEXT NOT NULL,
      categoria TEXT,
      tipo TEXT, -- 'materia_prima', 'producto_terminado', 'insumo'
      cantidad REAL DEFAULT 0,
      unidad TEXT, -- 'unidad', 'm2', 'kg', 'litro'
      stock_minimo REAL DEFAULT 0,
      ubicacion TEXT,
      proveedor TEXT,
      precio_compra REAL DEFAULT 0,
      precio_venta REAL DEFAULT 0,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de movimientos de inventario
    CREATE TABLE IF NOT EXISTS movimientos_inventario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      tipo TEXT, -- 'entrada', 'salida', 'ajuste'
      cantidad REAL NOT NULL,
      motivo TEXT,
      referencia_id INTEGER,
      referencia_tipo TEXT,
      usuario TEXT,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES inventario(id) ON DELETE CASCADE
    );

    -- Tabla de cotizaciones
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT UNIQUE,
      cliente_id INTEGER,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      validez_dias INTEGER DEFAULT 15,
      subtotal REAL DEFAULT 0,
      iva REAL DEFAULT 0,
      total REAL DEFAULT 0,
      estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'aprobada', 'rechazada', 'vencida', 'convertida'
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
    );

    -- Detalle de cotizaciones
    CREATE TABLE IF NOT EXISTS cotizaciones_detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cotizacion_id INTEGER,
      tipo TEXT, -- 'producto', 'servicio', 'personalizado'
      referencia_id INTEGER, -- id del producto si aplica
      descripcion TEXT,
      cantidad REAL DEFAULT 1,
      precio_unitario REAL DEFAULT 0,
      descuento REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
    );

    -- Tabla de trabajos de producción
    CREATE TABLE IF NOT EXISTS trabajos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_trabajo TEXT UNIQUE,
      cotizacion_id INTEGER,
      cliente_id INTEGER,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      estado TEXT DEFAULT 'en_cola', -- 'en_cola', 'en_proceso', 'terminado', 'entregado', 'cancelado'
      prioridad INTEGER DEFAULT 1, -- 1: Baja, 2: Media, 3: Alta
      fecha_inicio DATETIME,
      fecha_entrega_estimada DATETIME,
      fecha_entrega_real DATETIME,
      costo_materiales REAL DEFAULT 0,
      costo_mano_obra REAL DEFAULT 0,
      precio_total REAL DEFAULT 0,
      ganancia REAL DEFAULT 0,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
    );

    -- Tabla de evidencias de trabajos (fotos/archivos)
    CREATE TABLE IF NOT EXISTS evidencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trabajo_id INTEGER,
      archivo_ruta TEXT NOT NULL,
      descripcion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE
    );

    -- Tabla de actividades/bitácora de trabajo
    CREATE TABLE IF NOT EXISTS trabajo_actividades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trabajo_id INTEGER,
      actividad TEXT NOT NULL,
      duracion_minutos INTEGER DEFAULT 0,
      usuario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE
    );

    -- Tabla de ventas
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT UNIQUE,
      trabajo_id INTEGER,
      cliente_id INTEGER,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      subtotal REAL DEFAULT 0,
      iva REAL DEFAULT 0,
      total REAL DEFAULT 0,
      metodo_pago TEXT, -- 'efectivo', 'transferencia', 'tarjeta'
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE SET NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
    );

    -- Detalle de ventas
    CREATE TABLE IF NOT EXISTS ventas_detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto_id INTEGER,
      descripcion TEXT,
      cantidad REAL DEFAULT 1,
      precio_unitario REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES inventario(id) ON DELETE SET NULL
    );

    -- Tabla de finanzas (ingresos y egresos)
    CREATE TABLE IF NOT EXISTS finanzas_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL, -- 'ingreso', 'egreso'
      categoria TEXT, -- 'venta', 'compra_material', 'gasto_operativo', 'nomina', 'otro'
      monto REAL NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      referencia_id INTEGER, -- id de venta o compra si aplica
      referencia_tipo TEXT,
      descripcion TEXT,
      usuario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de calendario
    CREATE TABLE IF NOT EXISTS calendario_eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      tipo TEXT, -- 'trabajo', 'cotizacion', 'personal', 'recordatorio'
      referencia_id INTEGER,
      fecha_inicio DATETIME NOT NULL,
      fecha_fin DATETIME,
      color TEXT DEFAULT '#3b82f6',
      recordatorio_minutos INTEGER DEFAULT 0,
      completado BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de configuraciones de marketing
    CREATE TABLE IF NOT EXISTS marketing_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plataforma TEXT UNIQUE NOT NULL,
      configuracion TEXT,
      activo BOOLEAN DEFAULT 0,
      ultima_sincronizacion DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tabla de exportaciones realizadas
    CREATE TABLE IF NOT EXISTS exportaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL, -- 'wordpress', 'whatsapp', 'gumroad', 'catalogo'
      referencia_id INTEGER,
      destino TEXT,
      estado TEXT DEFAULT 'pendiente',
      resultado TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de configuraciones generales
    CREATE TABLE IF NOT EXISTS configuraciones (
      clave TEXT PRIMARY KEY,
      valor TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insertar configuraciones por defecto
  db.exec(`
    INSERT OR IGNORE INTO marketing_config (plataforma, configuracion, activo) VALUES 
      ('wordpress', '{"url":"","api_key":"","exportar_automatico":false}', 0),
      ('whatsapp', '{"numero":"","token":"","recordatorios":true}', 0),
      ('gumroad', '{"access_token":"","productos_sync":false}', 0),
      ('instagram', '{"cuenta":"","api_key":"","publicar_auto":false}', 0);
  `);

  // Datos de ejemplo para inventario si está vacío
  const count = db.prepare('SELECT COUNT(*) as count FROM inventario').get().count;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO inventario (codigo, nombre, categoria, tipo, cantidad, unidad, stock_minimo, precio_compra, precio_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insert.run('MAT-001', 'MDF 3mm', 'Madera', 'materia_prima', 10, 'unidad', 5, 120, 250);
    insert.run('MAT-002', 'Acrílico Transparente 3mm', 'Plástico', 'materia_prima', 5, 'unidad', 2, 450, 850);
    insert.run('PROD-001', 'Caja de Madera Personalizada', 'Cajas', 'producto_terminado', 2, 'unidad', 0, 80, 350);
  }

  return db;
}

function query(sql, params = []) {
  return db.prepare(sql).all(params);
}

function run(sql, params = []) {
  return db.prepare(sql).run(params);
}

function get(sql, params = []) {
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
  getDb
};
