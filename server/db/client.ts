import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"

/**
 * SQLite via Node's built-in driver: no native module to compile, one file on
 * disk, and the same code runs locally and on the deployment.
 */
const databasePath = process.env.DATABASE_PATH ?? resolve(process.cwd(), "data/seagle.db")
mkdirSync(dirname(databasePath), { recursive: true })

export const db = new DatabaseSync(databasePath)
db.exec("PRAGMA journal_mode = WAL;")
db.exec("PRAGMA foreign_keys = ON;")

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  timezone TEXT NOT NULL,
  plan TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  farms TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  last_active TEXT
);

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  primary_crop TEXT NOT NULL,
  total_area_ha REAL NOT NULL,
  field_count INTEGER NOT NULL,
  centroid TEXT NOT NULL,
  boundary TEXT NOT NULL,
  status TEXT NOT NULL,
  rainfall TEXT NOT NULL,
  elevation TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS crop_cycles (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT NOT NULL,
  season TEXT NOT NULL,
  planting_date TEXT NOT NULL,
  expected_harvest TEXT NOT NULL,
  growth_stage TEXT NOT NULL,
  population INTEGER,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  area_ha REAL NOT NULL,
  boundary TEXT NOT NULL,
  centroid TEXT NOT NULL,
  status TEXT NOT NULL,
  irrigation TEXT NOT NULL,
  soil TEXT NOT NULL,
  crop_cycle_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  farm_id TEXT NOT NULL REFERENCES farms(id),
  name TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  pilot TEXT NOT NULL,
  platform TEXT NOT NULL,
  sensor TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL,
  has_geo INTEGER NOT NULL,
  altitude_m INTEGER NOT NULL,
  coverage_ha REAL NOT NULL,
  image_count INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  findings_count INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  failure_reason TEXT,
  notes TEXT,
  assets TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  farm_id TEXT NOT NULL REFERENCES farms(id),
  survey_id TEXT NOT NULL REFERENCES surveys(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  resolved_at TEXT,
  zone TEXT,
  area_ha REAL,
  evidence_asset_id TEXT NOT NULL,
  observation TEXT NOT NULL,
  interpretation TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  previous_observation_id TEXT,
  reviewed_by TEXT,
  review_note TEXT,
  model TEXT NOT NULL,
  model_run_at TEXT
);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  field_id TEXT NOT NULL REFERENCES fields(id),
  farm_id TEXT NOT NULL REFERENCES farms(id),
  observation_id TEXT NOT NULL,
  assignee_id TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  verified_at TEXT,
  evidence TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  farm_id TEXT,
  field_id TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL,
  reviewed INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  field_id TEXT,
  at TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  actor_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_surveys_field ON surveys(field_id);
CREATE INDEX IF NOT EXISTS idx_observations_field ON observations(field_id);
CREATE INDEX IF NOT EXISTS idx_actions_field ON actions(field_id);
CREATE INDEX IF NOT EXISTS idx_events_field ON events(field_id);
`

export function ensureSchema() {
  db.exec(SCHEMA)
}
