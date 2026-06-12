const path = require('path');
let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.warn('⚠️  better-sqlite3 no disponible, usando fallback JSON/localStorage');
  Database = null;
}

const { writeJson, readJson, ensureFolder } = require('./fileSystem');
const { dataPath, sqliteFiles, inventoryFile, settingsFile } = require('./config');

const connections = {};
const localCache = {}; // Cache para modo fallback
const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'es',
  lastOpenedModule: 'Warehouse',
  syncEnabled: false,
};

function initializeDatabase() {
  ensureFolder(dataPath);

  if (Database) {
    // Modo SQLite normal
    try {
      Object.entries(sqliteFiles).forEach(([moduleName, fileName]) => {
        const filePath = path.join(dataPath, fileName);
        const db = new Database(filePath);
        db.pragma('journal_mode = WAL');
        db.prepare(
          `CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            module TEXT NOT NULL,
            payload TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )`
        ).run();
        connections[moduleName] = db;
      });
    } catch (err) {
      console.error('Error inicializando SQLite:', err);
      console.log('Usando fallback a JSON/localStorage');
      Database = null; // Activar fallback
    }
  }

  // Inicializar archivos JSON
  if (!readJson(inventoryFile)) {
    writeJson(inventoryFile, []);
  }

  if (!readJson(settingsFile)) {
    writeJson(settingsFile, DEFAULT_SETTINGS);
  }
}

function getDatabaseConnection(moduleName) {
  if (!Database || !connections[moduleName]) {
    return null;
  }
  return connections[moduleName];
}

function getModuleItems(moduleName) {
  const db = getDatabaseConnection(moduleName);
  
  if (db) {
    // Modo SQLite
    try {
      const rows = db.prepare('SELECT id, payload, updatedAt FROM items WHERE module = ? ORDER BY updatedAt DESC').all(moduleName);
      return rows.map(row => ({ id: row.id, ...JSON.parse(row.payload), updatedAt: row.updatedAt }));
    } catch (err) {
      console.error('Error leyendo SQLite, usando fallback:', err);
    }
  }
  
  // Fallback: usar caché local o retornar array vacío
  return localCache[moduleName] || [];
}

function saveModuleItem(moduleName, item) {
  const id = item.id || `${moduleName}-${Date.now()}`;
  const updatedAt = new Date().toISOString();
  const payload = JSON.stringify({ ...item, id });
  
  const db = getDatabaseConnection(moduleName);
  
  if (db) {
    // Modo SQLite
    try {
      db.prepare(
        `INSERT OR REPLACE INTO items (id, module, payload, updatedAt) VALUES (?, ?, ?, ?)`
      ).run(id, moduleName, payload, updatedAt);
    } catch (err) {
      console.error('Error guardando en SQLite, usando fallback:', err);
      // Guardar en caché local
      if (!localCache[moduleName]) localCache[moduleName] = [];
      localCache[moduleName].push({ id, ...item, updatedAt });
    }
  } else {
    // Fallback: caché local
    if (!localCache[moduleName]) localCache[moduleName] = [];
    const existing = localCache[moduleName].findIndex(x => x.id === id);
    if (existing >= 0) {
      localCache[moduleName][existing] = { id, ...item, updatedAt };
    } else {
      localCache[moduleName].push({ id, ...item, updatedAt });
    }
  }
  
  return { id, updatedAt };
}

function deleteModuleItem(moduleName, id) {
  const db = getDatabaseConnection(moduleName);
  
  if (db) {
    try {
      db.prepare('DELETE FROM items WHERE module = ? AND id = ?').run(moduleName, id);
    } catch (err) {
      console.error('Error eliminando de SQLite:', err);
      // Eliminar del caché local
      if (localCache[moduleName]) {
        localCache[moduleName] = localCache[moduleName].filter(x => x.id !== id);
      }
    }
  } else if (localCache[moduleName]) {
    localCache[moduleName] = localCache[moduleName].filter(x => x.id !== id);
  }
  
  return { id };
}

function getLibraryItems() {
  return readJson(inventoryFile) || [];
}

function saveLibraryItems(items) {
  writeJson(inventoryFile, items || []);
}

function getSettings() {
  return readJson(settingsFile) || DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  writeJson(settingsFile, { ...DEFAULT_SETTINGS, ...settings });
}

module.exports = {
  initializeDatabase,
  getModuleItems,
  saveModuleItem,
  deleteModuleItem,
  getLibraryItems,
  saveLibraryItems,
  getSettings,
  saveSettings,
};
