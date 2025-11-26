const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const port = 3000;

const db = new Database("water.db");

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/measurements", (req, res) => {
  const area = req.query.area || "PA7";
  const parameters = req.query.parameter
    ? req.query.parameter.split(",")
    : ["Temperature"];

  console.log("Multi-metric request:", { area, parameters });

  try {
    const placeholders = parameters.map(() => "?").join(",");

    const stmt = db.prepare(`
      SELECT 
        p.name AS parameter,
        m.measured_at,
        m.value
      FROM measurements m
      JOIN production_areas a ON m.production_area_id = a.id
      JOIN parameters p ON m.parameter_id = p.id
      WHERE a.code = ?
        AND p.name IN (${placeholders})
      ORDER BY m.measured_at
    `);

    const rows = stmt.all(area, ...parameters);
    console.log("Rows returned:", rows.length);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => {
  console.log(`SaltenSmolt running at http://localhost:${port}`);
});
