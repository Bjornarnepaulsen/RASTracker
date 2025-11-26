INSERT INTO parameter_groups (name) VALUES
('Before MBBR'),
('Sensors'),
('System');

INSERT INTO production_areas (code, name, description)
VALUES ('PA7', 'Production Area 7', 'Demo area');

-- We rely on parameter_groups being created in this order:
-- id=1: Before MBBR, id=2: Sensors, id=3: System

INSERT INTO parameters (group_id, name, display_name, unit, short_code) VALUES
(1, 'NH4-N', 'NH4-N (mg/L)', 'mg/L', 'NH4_N'),
(1, 'NO2-N', 'NO2-N (mg/L)', 'mg/L', 'NO2_N'),
(1, 'NO3-N', 'NO3-N (mg/L)', 'mg/L', 'NO3_N'),
(1, 'Alkalinity', 'Alkalinity (mg/L)', 'mg/L', 'ALK'),

(2, 'Temperature', 'Temperature (°C)', '°C', 'TEMP'),
(2, 'pH', 'pH', 'pH', 'PH'),
(2, 'Salinity', 'Salinity (ppt)', 'ppt', 'SAL'),
(2, 'Turbidity', 'Turbidity (FNU)', 'FNU', 'TURB'),

(3, 'Feeding rate', 'Feeding rate (kg/d)', 'kg/d', 'FEED_RATE'),
(3, 'Dilution water', 'Dilution water (m3/h)', 'm3/h', 'DILUTION_WATER'),
(3, 'System volume', 'System volume (m3)', 'm3', 'SYSTEM_VOLUME');
