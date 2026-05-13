/**
 * SQLite schema for CattleGen.
 *
 * All JSON fields are stored as TEXT (json-stringified). The renderer pushes
 * SQL through an IPC bridge (`window.cattlegen.db.*`) — better-sqlite3 runs in
 * the Electron main process only.
 */

export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS ranches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_name TEXT,
    location TEXT,
    is_my_ranch INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS herds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ranch_id INTEGER,
    name TEXT NOT NULL,
    breed_id TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ranch_id) REFERENCES ranches(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT,
    name TEXT NOT NULL,
    tattoo TEXT,
    breed_id TEXT NOT NULL,
    wagyu_subtype TEXT,
    sex TEXT NOT NULL,
    birth_date TEXT,
    birth_year INTEGER,
    sire_id INTEGER,
    dam_id INTEGER,
    herd_id INTEGER,
    is_public_record INTEGER DEFAULT 0,
    source_association TEXT,
    epds TEXT,
    accuracy TEXT,
    prefectural_composition TEXT,
    genetic_conditions TEXT,
    genomic_profile TEXT,
    notes TEXT,
    photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (herd_id) REFERENCES herds(id) ON DELETE SET NULL,
    FOREIGN KEY (sire_id) REFERENCES animals(id) ON DELETE SET NULL,
    FOREIGN KEY (dam_id) REFERENCES animals(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS matings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sire_id INTEGER,
    dam_id INTEGER,
    breed_id TEXT NOT NULL,
    predicted_progeny TEXT,
    percentile_rankings TEXT,
    index_values TEXT,
    weighted_score REAL,
    custom_weights TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sire_id) REFERENCES animals(id) ON DELETE SET NULL,
    FOREIGN KEY (dam_id) REFERENCES animals(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS public_sire_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT NOT NULL,
    name TEXT NOT NULL,
    breed_id TEXT NOT NULL,
    wagyu_subtype TEXT,
    association TEXT NOT NULL,
    source TEXT NOT NULL,
    epds TEXT,
    accuracy TEXT,
    prefectural_composition TEXT,
    birth_year INTEGER,
    last_updated TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS genomic_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER,
    test_date TEXT,
    testing_lab TEXT,
    snp_panel_size INTEGER,
    report_file_path TEXT,
    raw_data TEXT,
    imported_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_animals_breed ON animals(breed_id)`,
  `CREATE INDEX IF NOT EXISTS idx_animals_herd ON animals(herd_id)`,
  `CREATE INDEX IF NOT EXISTS idx_animals_public ON animals(is_public_record)`,
  `CREATE INDEX IF NOT EXISTS idx_public_breed ON public_sire_cache(breed_id)`,
  `CREATE INDEX IF NOT EXISTS idx_matings_created ON matings(created_at)`
]
