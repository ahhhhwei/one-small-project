CREATE DATABASE IF NOT EXISTS wenjw_db0
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_general_ci;

USE wenjw_db0;

CREATE TABLE IF NOT EXISTS wenjw_stu0 (
    sno INT NOT NULL,
    sname VARCHAR(100) NOT NULL,
    sdept VARCHAR(100) NOT NULL,
    stel VARCHAR(20) NOT NULL DEFAULT '',
    sex VARCHAR(10) NOT NULL DEFAULT '',
    sage INT NOT NULL DEFAULT 0,
    saddr VARCHAR(200) NOT NULL DEFAULT '',
    spost VARCHAR(10) NOT NULL DEFAULT '',
    PRIMARY KEY (sno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS wenjw_sc0 (
    sno INT NOT NULL,
    cno INT NOT NULL,
    grade DECIMAL(4, 1) NOT NULL DEFAULT 0,
    PRIMARY KEY (sno, cno),
    CONSTRAINT wenjw_sc0_grade_check CHECK (grade BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS wenjw_cou (
    cno INT NOT NULL,
    cname VARCHAR(100) NOT NULL,
    cdept VARCHAR(100) NOT NULL DEFAULT '',
    ctea VARCHAR(100) NOT NULL DEFAULT '',
    cdate VARCHAR(20) NOT NULL DEFAULT '',
    cscore DECIMAL(4, 2) NOT NULL DEFAULT 0,
    caddr VARCHAR(200) NOT NULL DEFAULT '',
    PRIMARY KEY (cno)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS wenjw_user (
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    password_salt VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    student_id INT NOT NULL DEFAULT 0,
    teacher_name VARCHAR(100) NOT NULL DEFAULT '-',
    PRIMARY KEY (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
