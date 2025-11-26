const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const port = 3000;

// Open SQLite database file (in project root)
const db = new Database("water.db");

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Simple health check
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET /api/measurements?area=PA7&parameter=Temperature,pH,NH4-N
app.get("/api/measurements", (req, res) => {
  const area = req.query.area || "PA7";
  const paramQuery = req.query.parameter; // note: "parameter", not "parameters"

  // Turn "Temperature,pH,NH4-N" into ["Temperature", "pH", "NH4-N"]
  let parameters = [];
  if (paramQuery) {
    parameters = paramQuery
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  // Fallback: if nothing was provided, just use Temperature
  if (parameters.length === 0) {
    parameters = ["Temperature"];
  }

  console.log("Multi-parameter request:", { area, parameters });

  try {
    // Build IN (?,?,?) dynamically
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
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`SaltenSmolt server running at http://localhost:${port}`);
});
