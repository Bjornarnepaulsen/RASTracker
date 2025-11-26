CREATE TABLE production_areas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description NVARCHAR(MAX)
);

CREATE TABLE parameter_groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(MAX)
);

CREATE TABLE parameters (
    id INT IDENTITY(1,1) PRIMARY KEY,
    group_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    unit VARCHAR(20),
    short_code VARCHAR(30),
    lower_limit DECIMAL(12,4),
    upper_limit DECIMAL(12,4),
    CONSTRAINT fk_parameters_group 
        FOREIGN KEY (group_id) REFERENCES parameter_groups(id)
);

CREATE TABLE measurements (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    production_area_id INT NOT NULL,
    parameter_id INT NOT NULL,
    measured_at DATE NOT NULL,
    value DECIMAL(16,6) NOT NULL,
    source VARCHAR(50),
    remark NVARCHAR(MAX),
    CONSTRAINT fk_measurements_area 
        FOREIGN KEY (production_area_id) REFERENCES production_areas(id),
    CONSTRAINT fk_measurements_parameter 
        FOREIGN KEY (parameter_id) REFERENCES parameters(id)
);

CREATE UNIQUE INDEX ux_measurements_unique
ON measurements (production_area_id, parameter_id, measured_at);
