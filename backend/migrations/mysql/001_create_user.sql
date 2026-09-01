CREATE TABLE IF NOT EXISTS wenjw_user (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(64) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    student_id INT NOT NULL DEFAULT 0,
    teacher_name VARCHAR(100) NOT NULL DEFAULT '-'
) CHARACTER SET utf8mb4;
