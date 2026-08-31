#include <cstdlib>
#include <iostream>
#include <mysql.h>
#include <sstream>
#include <string>
#include <vector>

#include "httplib.h"

using namespace httplib;

// 学生数据结构
struct Student {
    std::string studentId;
    std::string name;
    std::string college;
    std::string phone;
    std::string Sex;
    int age;
    std::string address;
    std::string zipCode;
};

// 课程数据结构
struct Course {
    std::string courseId;
    std::string name;
    std::string college;
    std::string teacher;
    std::string date;
    double credits;
    std::string classroom;
};

// 选课数据结构
struct Enrollment {
    std::string Sno;
    std::string Sname;
    std::string Cno;
    double Grade;
};

// 某个学生的课程信息
struct CourseGrade {
    std::string course_name;
    double grade;
};

std::string get_last_segment(const std::string& path) {
    const size_t last_slash_pos = path.rfind('/');
    if (last_slash_pos != std::string::npos && last_slash_pos + 1 < path.length()) {
        return path.substr(last_slash_pos + 1);
    }
    return "";
}

const char* get_env_or_default(const char* name, const char* default_value) {
    const char* value = std::getenv(name);
    return value != nullptr ? value : default_value;
}

// 初始化数据库连接。
// 默认连接 ShardingSphere-Proxy，而不是直接连接任意一个物理数据库。
MYSQL* database_init() {
    MYSQL* conn = mysql_init(nullptr);
    if (conn == nullptr) {
        std::cerr << "mysql_init() failed\n";
        return nullptr;
    }

    unsigned int timeout = 5;
    mysql_options(conn, MYSQL_OPT_CONNECT_TIMEOUT, &timeout);

    const char* host = get_env_or_default("DB_HOST", "127.0.0.1");
    const char* user = get_env_or_default("DB_USER", "root");
    const char* password = get_env_or_default("DB_PASSWORD", "123456");
    const char* database = get_env_or_default("DB_NAME", "wenjw_db");

    char* port_end = nullptr;
    const unsigned long parsed_port = std::strtoul(
        get_env_or_default("DB_PORT", "3307"),
        &port_end,
        10
    );
    const unsigned int port =
        (port_end != nullptr && *port_end == '\0' && parsed_port <= 65535)
            ? static_cast<unsigned int>(parsed_port)
            : 3307;

    if (mysql_real_connect(
            conn,
            host,
            user,
            password,
            database,
            port,
            nullptr,
            0
        ) == nullptr) {
        std::cerr << "database connection failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return nullptr;
    }

    if (mysql_set_character_set(conn, "utf8mb4") != 0) {
        std::cerr << "failed to set utf8mb4: " << mysql_error(conn) << '\n';
    }

    return conn;
}

// 从数据库中获取学生列表
std::vector<Student> get_students_list() {
    MYSQL* conn = database_init();
    if (conn == nullptr) {
        return {};
    }

    if (mysql_query(
            conn,
            "SELECT sno, sname, sdept, stel, sex, sage, saddr, spost FROM wenjw_stu"
        )) {
        std::cerr << "Query failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    MYSQL_RES* result = mysql_store_result(conn);
    if (result == nullptr) {
        std::cerr << "mysql_store_result() failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    std::vector<Student> students;
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(result)) != nullptr) {
        Student student = {
            row[0] ? row[0] : "",
            row[1] ? row[1] : "",
            row[2] ? row[2] : "",
            row[3] ? row[3] : "",
            row[4] ? row[4] : "",
            row[5] ? std::atoi(row[5]) : 0,
            row[6] ? row[6] : "",
            row[7] ? row[7] : ""
        };
        students.push_back(std::move(student));
    }

    mysql_free_result(result);
    mysql_close(conn);
    return students;
}

// 从数据库中获取课程列表
std::vector<Course> get_courses_list() {
    MYSQL* conn = database_init();
    if (conn == nullptr) {
        return {};
    }

    if (mysql_query(
            conn,
            "SELECT cno, cname, cdept, ctea, cdate, cscore, caddr FROM wenjw_cou"
        )) {
        std::cerr << "Query failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    MYSQL_RES* result = mysql_store_result(conn);
    if (result == nullptr) {
        std::cerr << "mysql_store_result() failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    std::vector<Course> courses;
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(result)) != nullptr) {
        Course course = {
            row[0] ? row[0] : "",
            row[1] ? row[1] : "",
            row[2] ? row[2] : "",
            row[3] ? row[3] : "",
            row[4] ? row[4] : "",
            row[5] ? std::atof(row[5]) : 0.0,
            row[6] ? row[6] : ""
        };
        courses.push_back(std::move(course));
    }

    mysql_free_result(result);
    mysql_close(conn);
    return courses;
}

// 从数据库中获取指定课程号的学生信息。
// SQL 已经一次性查出学生姓名，避免原先每个学生再单独查一次姓名的 N+1 查询。
std::vector<Enrollment> get_enrollments_by_cno(const std::string& cno) {
    MYSQL* conn = database_init();
    if (conn == nullptr) {
        return {};
    }

    std::stringstream query;
    query << "SELECT s.sno, s.sname, sc.grade "
          << "FROM wenjw_stu s "
          << "JOIN wenjw_sc sc ON s.sno = sc.sno "
          << "WHERE sc.cno = '" << cno << "'";

    if (mysql_query(conn, query.str().c_str())) {
        std::cerr << "Query failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    MYSQL_RES* result = mysql_store_result(conn);
    if (result == nullptr) {
        std::cerr << "mysql_store_result() failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    std::vector<Enrollment> enrollments;
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(result)) != nullptr) {
        Enrollment enrollment = {
            row[0] ? row[0] : "",
            row[1] ? row[1] : "",
            cno,
            row[2] ? std::atof(row[2]) : 0.0
        };
        enrollments.push_back(std::move(enrollment));
    }

    mysql_free_result(result);
    mysql_close(conn);
    return enrollments;
}

// 从数据库中获取指定学号的所有课程信息
std::vector<CourseGrade> get_student_courses(const std::string& student_id) {
    MYSQL* conn = database_init();
    if (conn == nullptr) {
        return {};
    }

    std::stringstream query;
    query << "SELECT c.cname, sc.grade "
          << "FROM wenjw_sc sc "
          << "JOIN wenjw_cou c ON sc.cno = c.cno "
          << "WHERE sc.sno = '" << student_id << "'";

    if (mysql_query(conn, query.str().c_str())) {
        std::cerr << "Query failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    MYSQL_RES* result = mysql_store_result(conn);
    if (result == nullptr) {
        std::cerr << "mysql_store_result() failed: " << mysql_error(conn) << '\n';
        mysql_close(conn);
        return {};
    }

    std::vector<CourseGrade> courses;
    MYSQL_ROW row;
    while ((row = mysql_fetch_row(result)) != nullptr) {
        CourseGrade course_grade = {
            row[0] ? row[0] : "",
            row[1] ? std::atof(row[1]) : 0.0
        };
        courses.push_back(std::move(course_grade));
    }

    mysql_free_result(result);
    mysql_close(conn);
    return courses;
}

void set_cors_headers(Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// 处理GET请求 - 学生信息
void handle_students_get(const Request&, Response& res) {
    const std::vector<Student> students = get_students_list();

    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < students.size(); ++i) {
        if (i > 0) {
            response_json << ',';
        }
        response_json << "{"
                      << "\"studentId\":\"" << students[i].studentId << "\","
                      << "\"name\":\"" << students[i].name << "\","
                      << "\"college\":\"" << students[i].college << "\","
                      << "\"phone\":\"" << students[i].phone << "\","
                      << "\"Sex\":\"" << students[i].Sex << "\","
                      << "\"age\":" << students[i].age << ','
                      << "\"address\":\"" << students[i].address << "\","
                      << "\"zipCode\":\"" << students[i].zipCode << "\""
                      << "}";
    }

    response_json << "]}";
    res.set_content(response_json.str(), "application/json");
    set_cors_headers(res);
}

// 处理GET请求 - 课程信息
void handle_courses_get(const Request&, Response& res) {
    const std::vector<Course> courses = get_courses_list();

    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < courses.size(); ++i) {
        if (i > 0) {
            response_json << ',';
        }
        response_json << "{"
                      << "\"courseId\":\"" << courses[i].courseId << "\","
                      << "\"name\":\"" << courses[i].name << "\","
                      << "\"college\":\"" << courses[i].college << "\","
                      << "\"teacher\":\"" << courses[i].teacher << "\","
                      << "\"date\":\"" << courses[i].date << "\","
                      << "\"credits\":" << courses[i].credits << ','
                      << "\"classroom\":\"" << courses[i].classroom << "\""
                      << "}";
    }

    response_json << "]}";
    res.set_content(response_json.str(), "application/json");
    set_cors_headers(res);
}

// 处理GET请求 - 某个课程的学生信息
void handle_course_students_get(const Request& req, Response& res) {
    const std::string cno = get_last_segment(req.matches[0]);
    const std::vector<Enrollment> enrollments = get_enrollments_by_cno(cno);

    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < enrollments.size(); ++i) {
        if (i > 0) {
            response_json << ',';
        }
        response_json << "{"
                      << "\"Sno\":\"" << enrollments[i].Sno << "\","
                      << "\"Sname\":\"" << enrollments[i].Sname << "\","
                      << "\"Grade\":" << enrollments[i].Grade
                      << "}";
    }

    response_json << "]}";
    res.set_content(response_json.str(), "application/json");
    set_cors_headers(res);
}

// 处理GET请求 - 学生的所有课程信息
void handle_student_courses_get(const Request& req, Response& res) {
    const std::string sno = get_last_segment(req.matches[0]);
    const std::vector<CourseGrade> courses = get_student_courses(sno);

    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < courses.size(); ++i) {
        if (i > 0) {
            response_json << ',';
        }
        response_json << "{"
                      << "\"Cname\":\"" << courses[i].course_name << "\","
                      << "\"Grade\":" << courses[i].grade
                      << "}";
    }

    response_json << "]}";
    res.set_content(response_json.str(), "application/json");
    set_cors_headers(res);
}

int main() {
    try {
        Server svr;

        svr.Get("/api/students", handle_students_get);
        svr.Get("/api/courses", handle_courses_get);
        svr.Get(R"(/api/course_students/(\d+))", handle_course_students_get);
        svr.Get(R"(/api/student_courses/(\d+))", handle_student_courses_get);

        std::cout << "Starting to listen on port 8080..." << std::endl;
        svr.listen("0.0.0.0", 8080);
    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "Unknown exception occurred." << std::endl;
    }

    return 0;
}
