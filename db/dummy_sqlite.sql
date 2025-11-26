-- Recursive CTE to generate last 30 days
WITH RECURSIVE dates(d) AS (
  SELECT date('now', '-29 day')
  UNION ALL
  SELECT date(d, '+1 day') FROM dates WHERE d < date('now')
)
INSERT INTO measurements (production_area_id, parameter_id, measured_at, value, source)
SELECT
  a.id AS production_area_id,
  p.id AS parameter_id,
  d.d AS measured_at,
  CASE p.name
    WHEN 'NH4-N' THEN 0.3 + (ABS(RANDOM()) % 40) / 100.0      -- 0.30–0.70
    WHEN 'NO2-N' THEN 0.02 + (ABS(RANDOM()) % 5) / 100.0      -- 0.02–0.07
    WHEN 'NO3-N' THEN 1.0 + (ABS(RANDOM()) % 150) / 100.0     -- 1.00–2.50
    WHEN 'Alkalinity' THEN 70 + (ABS(RANDOM()) % 200) / 10.0  -- 70–90

    WHEN 'Temperature' THEN 12 + (ABS(RANDOM()) % 40) / 10.0  -- 12.0–16.0
    WHEN 'pH' THEN 7.0 + (ABS(RANDOM()) % 10) / 10.0         -- 7.0–7.9
    WHEN 'Salinity' THEN 18 + (ABS(RANDOM()) % 40) / 10.0    -- 18.0–22.0
    WHEN 'Turbidity' THEN 1 + (ABS(RANDOM()) % 30) / 10.0    -- 1.0–4.0

    WHEN 'Feeding rate' THEN 300 + (ABS(RANDOM()) % 80)      -- 300–379
    WHEN 'Dilution water' THEN 15 + (ABS(RANDOM()) % 80) / 10.0   -- 15–23
    WHEN 'System volume' THEN 280 + (ABS(RANDOM()) % 40)     -- 280–319
    ELSE (ABS(RANDOM()) % 100) / 10.0
  END AS value,
  'demo' AS source
FROM dates d
CROSS JOIN production_areas a
CROSS JOIN parameters p
WHERE a.code = 'PA7';
