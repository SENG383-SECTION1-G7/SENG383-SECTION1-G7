const Database = require('better-sqlite3');
const { getConfig } = require('./config');

let dbInstance = null;

function initSchema(db) {
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
      specialist_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      grade TEXT,
      parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      child_user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS specialist_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      specialist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      specialist_type TEXT NOT NULL,
      linked_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(child_id, specialist_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      assigned_by INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      development_area TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS specialist_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id),
      entry_date TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      development_area TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_edited INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
      requested_by INTEGER NOT NULL REFERENCES users(id),
      reader_role TEXT NOT NULL CHECK (reader_role IN ('parent', 'specialist')),
      week_start TEXT NOT NULL,
      summary_text TEXT NOT NULL,
      source_record_ids TEXT NOT NULL,
      feedback TEXT CHECK (feedback IN ('helpful', 'incorrect')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function getDb() {
  if (!dbInstance) {
    const { dbPath } = getConfig();
    dbInstance = new Database(dbPath);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = { getDb, initSchema, closeDb };
