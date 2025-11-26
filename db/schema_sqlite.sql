CREATE TABLE production_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE parameter_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  unit TEXT,
  short_code TEXT,
  lower_limit REAL,
  upper_limit REAL,
  FOREIGN KEY (group_id) REFERENCES parameter_groups(id)
);

CREATE TABLE measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_area_id INTEGER NOT NULL,
  parameter_id INTEGER NOT NULL,
  measured_at TEXT NOT NULL,
  value REAL NOT NULL,
  source TEXT,
  remark TEXT,
  FOREIGN KEY (production_area_id) REFERENCES production_areas(id),
  FOREIGN KEY (parameter_id) REFERENCES parameters(id),
  UNIQUE (production_area_id, parameter_id, measured_at)
);
