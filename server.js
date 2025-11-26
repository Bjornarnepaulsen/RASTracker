const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const multer = require("multer");
const XLSX = require("xlsx");

const app = express();
const port = 3000;

// ---------- Database ----------

// Open SQLite database file in project root
const db = new Database("water.db");

// ---------- File upload (for Excel import) ----------

const upload = multer({ storage: multer.memoryStorage() });

// ---------- Static files ----------

app.use(express.static(path.join(__dirname, "public")));

// ---------- Health check ----------

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- Get list of production areas ----------
// Returns: [{ code: "PA1", name: "Production Area 1" }, ...]

app.get("/api/areas", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT code, name
      FROM production_areas
      ORDER BY code
    `
      )
      .all();

    res.json(rows);
  } catch (err) {
    console.error("Error loading areas:", err);
    res.status(500).json({ error: "Failed to load production areas" });
  }
});

// ---------- Get measurements ----------
// GET /api/measurements?area=PA7&parameter=Temperature,pH,NH4-N
// Returns: [{ parameter, measured_at, value }, ...]

app.get("/api/measurements", (req, res) => {
  const area = req.query.area || "PA7";
  const paramQuery = req.query.parameter;

  let parameters = [];
  if (paramQuery) {
    parameters = paramQuery
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  if (parameters.length === 0) {
    // fallback: just Temperature
    parameters = ["Temperature"];
  }

  console.log("Multi-parameter request:", { area, parameters });

  try {
    const placeholders = parameters.map(() => "?").join(",");

    const sql = `
      SELECT 
        p.name AS parameter,
        m.measured_at,
        m.value
      FROM measurements m
      JOIN production_areas a ON m.production_area_id = a.id
      JOIN parameters p ON m.parameter_id = p.id
      WHERE a.code = ?
        AND p.name IN (${placeholders})
      ORDER BY m.measured_at, p.name
    `;

    const stmt = db.prepare(sql);
    const rows = stmt.all(area, ...parameters);

    console.log("Rows returned:", rows.length);
    res.json(rows);
  } catch (err) {
    console.error("DB error in /api/measurements:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------- Import Excel into DB ----------
// Frontend sends FormData with "file" field
// Expected columns in sheet:
//   production_area | parameter | measured_at | value
// measured_at: YYYY-MM-DD (string) works great

app.post("/api/import", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet); // array of objects

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO measurements (
        production_area_id,
        parameter_id,
        measured_at,
        value,
        source
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const getAreaId = db.prepare(
      "SELECT id FROM production_areas WHERE code = ?"
    );
    const getParamId = db.prepare(
      "SELECT id FROM parameters WHERE name = ?"
    );

    let inserted = 0;
    let skipped = 0;

    const insertMany = db.transaction(rows => {
      rows.forEach(row => {
        const areaCode = row.production_area;
        const paramName = row.parameter;
        const measuredAt = row.measured_at;
        const value = Number(row.value);

        if (!areaCode || !paramName || !measuredAt || Number.isNaN(value)) {
          skipped++;
          return;
        }

        const area = getAreaId.get(areaCode);
        const param = getParamId.get(paramName);

        if (!area || !param) {
          skipped++;
          return;
        }

        insertStmt.run(
          area.id,
          param.id,
          measuredAt, // e.g. "2025-01-01"
          value,
          "import"
        );
        inserted++;
      });
    });

    insertMany(rows);

    console.log(
      `Import completed. Inserted ${inserted} rows, skipped ${skipped} rows.`
    );
    res.json({ ok: true, inserted, skipped });
  } catch (err) {
    console.error("Import error:", err);
    res.status(500).json({ error: "Failed to import Excel file" });
  }
});

// ---------- Start server ----------

app.listen(port, () => {
  console.log(`SaltenSmolt server running at http://localhost:${port}`);
});
