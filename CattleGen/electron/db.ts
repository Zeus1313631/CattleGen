import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { SCHEMA_STATEMENTS } from '../src/db/schema'

let _db: Database.Database | null = null

export function initializeDatabase(): Database.Database {
  const userDataDir = app.getPath('userData')
  mkdirSync(userDataDir, { recursive: true })
  const dbPath = join(userDataDir, 'cattlegen.sqlite')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  for (const stmt of SCHEMA_STATEMENTS) {
    db.exec(stmt)
  }

  _db = db
  return db
}

export function getDb(): Database.Database {
  if (!_db) throw new Error('Database not initialized')
  return _db
}
