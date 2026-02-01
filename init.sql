-- init.sql
CREATE DATABASE IF NOT EXISTS rideshare_db;
USE rideshare_db;

CREATE TABLE IF NOT EXISTS ride (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    fare DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert dummy data to verify it works
INSERT INTO ride (status, fare) VALUES ('COMPLETED', 25.50);
INSERT INTO ride (status, fare) VALUES ('REQUESTED', 0.00);