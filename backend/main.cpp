#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <mysql.h>
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
    int credits;
    std::string classroom;
};

// 选课数据结构
struct Enrollment {
    std::string Sno;
    std::string Cno;
    double Grade;
};

// 某个学生的课程信息
struct CourseGrade {
    std::string course_name;
    double grade;
};

std::string get_last_segment(const std::string& path) {
    // 找到最后一个斜杠的位置
    size_t last_slash_pos = path.rfind('/');
    
    // 如果找到了斜杠，并且斜杠不是路径的最后一个字符
    if (last_slash_pos != std::string::npos && last_slash_pos + 1 < path.length()) {
        // 返回最后一个斜杠之后的内容
        return path.substr(last_slash_pos + 1);
    } else {
        // 如果没有找到斜杠，或者斜杠是路径的最后一个字符，则返回空字符串
        return "";
    }
}

// 初始化数据库连接
MYSQL* database_init() {
    MYSQL *conn = mysql_init(NULL);
    if (conn == NULL) {
        fprintf(stderr, "mysql_init() failed\n");
        return NULL;
    }

    if (mysql_real_connect(conn, "localhost", "root", "123456ahwei", "wenjw_db", 0, NULL, 0) == NULL) {
        fprintf(stderr, "mysql_real_connect() failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return NULL;
    }

    return conn;
}

// 从数据库中获取学生列表
std::vector<Student> get_students_list() {
    MYSQL *conn = database_init();
    if (conn == NULL) {
        return {};
    }

    MYSQL_RES *result;
    MYSQL_ROW row;

    // 执行查询
    if (mysql_query(conn, "SELECT * FROM wenjw_stu")) {
        fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    // 获取结果集
    result = mysql_store_result(conn);
    if (result == NULL) {
        fprintf(stderr, "mysql_store_result() failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    std::vector<Student> students;
    while ((row = mysql_fetch_row(result))) {
        Student student = {
            row[0],  // studentId
            row[1],  // name
            row[2],  // college
            row[3],  // phone
            row[4],  // Sex
            atoi(row[5]),  // age
            row[6],  // address
            row[7]   // zipCode
        };
        students.push_back(student);
    }

    // 释放结果集并关闭连接
    mysql_free_result(result);
    mysql_close(conn);

    return students;
}

// 从数据库中获取课程列表
std::vector<Course> get_courses_list() {
    MYSQL *conn = database_init();
    if (conn == NULL) {
        return {};
    }

    MYSQL_RES *result;
    MYSQL_ROW row;

    // 执行查询
    if (mysql_query(conn, "SELECT * FROM wenjw_cou")) {
        fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    // 获取结果集
    result = mysql_store_result(conn);
    if (result == NULL) {
        fprintf(stderr, "mysql_store_result() failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    std::vector<Course> courses;
    while ((row = mysql_fetch_row(result))) {
        Course course = {
            row[0],  // courseId
            row[1],  // name
            row[2],  // college
            row[3],  // teacher
            row[4],  // date
            atoi(row[5]),  // credits
            row[6]   // classroom
        };
        courses.push_back(course);
    }

    // 释放结果集并关闭连接
    mysql_free_result(result);
    mysql_close(conn);

    return courses;
}

// 从数据库中获取指定课程号的学生信息
std::vector<Enrollment> get_enrollments_by_cno(const std::string& cno) {
    MYSQL *conn = database_init();
    if (conn == NULL) {
        return {};
    }

    MYSQL_RES *result;
    MYSQL_ROW row;

    // 构建查询语句
    std::stringstream query;
    query << "SELECT s.Sno, s.Sname, sc.Grade "
          << "FROM wenjw_stu s "
          << "JOIN wenjw_sc sc ON s.Sno = sc.Sno "
          << "WHERE sc.Cno = '" << cno << "'";

    // 执行查询
    if (mysql_query(conn, query.str().c_str())) {
        fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    // 获取结果集
    result = mysql_store_result(conn);
    if (result == NULL) {
        fprintf(stderr, "mysql_store_result() failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    std::vector<Enrollment> enrollments;
    while ((row = mysql_fetch_row(result))) {
        Enrollment enrollment = {
            row[0],  // Sno
            cno,     // Cno
            atof(row[2])  // Grade
        };
        enrollments.push_back(enrollment);
    }

    // 释放结果集并关闭连接
    mysql_free_result(result);
    mysql_close(conn);

    return enrollments;
}

// 从数据库中获取指定学号的所有课程信息
std::vector<CourseGrade> get_student_courses(const std::string& student_id) {
    MYSQL *conn = database_init();
    if (conn == NULL) {
        return {};
    }

    MYSQL_RES *result;
    MYSQL_ROW row;

    // 构建查询语句
    std::stringstream query;
    query << "SELECT c.Cname, sc.Grade "
          << "FROM wenjw_sc sc "
          << "JOIN wenjw_cou c ON sc.Cno = c.Cno "
          << "WHERE sc.Sno = '" << student_id << "'";

    // 执行查询
    if (mysql_query(conn, query.str().c_str())) {
        fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    // 获取结果集
    result = mysql_store_result(conn);
    if (result == NULL) {
        fprintf(stderr, "mysql_store_result() failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return {};
    }

    std::vector<CourseGrade> courses;
    while ((row = mysql_fetch_row(result))) {
        CourseGrade cg = {
            row[0],  // course_name
            atof(row[1])  // grade
        };
        courses.push_back(cg);
    }

    // 释放结果集并关闭连接
    mysql_free_result(result);
    mysql_close(conn);

    return courses;
}

// 获取学生的姓名
std::string get_student_name(const std::string& sno) {
    MYSQL *conn = database_init();
    if (conn == NULL) {
        return "";
    }

    MYSQL_RES *result;
    MYSQL_ROW row;

    // 构建查询语句
    std::stringstream query;
    query << "SELECT Sname FROM wenjw_stu WHERE Sno = '" << sno << "'";

    // 执行查询
    if (mysql_query(conn, query.str().c_str())) {
        fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return "";
    }

    // 获取结果集
    result = mysql_store_result(conn);
    if (result == NULL) {
        fprintf(stderr, "mysql_store_result() failed: %s\n", mysql_error(conn));
        mysql_close(conn);
        return "";
    }

    if ((row = mysql_fetch_row(result))) {
        std::string name = row[0];
        mysql_free_result(result);
        mysql_close(conn);
        return name;
    }

    // 释放结果集并关闭连接
    mysql_free_result(result);
    mysql_close(conn);

    return "";
}

// 处理GET请求 - 学生信息
void handle_students_get(const Request& req, Response& res) {
    // 获取学生列表
    std::vector<Student> students = get_students_list();

    // 创建JSON响应
    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < students.size(); ++i) {
        if (i > 0) {
            response_json << ",";
        }
        response_json << "{"
                      << "\"studentId\":\"" << students[i].studentId << "\","
                      << "\"name\":\"" << students[i].name << "\","
                      << "\"college\":\"" << students[i].college << "\","
                      << "\"phone\":\"" << students[i].phone << "\","
                      << "\"Sex\":\"" << students[i].Sex << "\","
                      << "\"age\":" << students[i].age << ","
                      << "\"address\":\"" << students[i].address << "\","
                      << "\"zipCode\":\"" << students[i].zipCode << "\""
                      << "}";
    }

    response_json << "]}";

    // 设置响应内容类型为JSON
    res.set_content(response_json.str(), "application/json");
    // 添加跨域相关的响应头，允许任意源访问（实际应用中需谨慎配置）
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// 处理GET请求 - 课程信息
void handle_courses_get(const Request& req, Response& res) {
    // 获取课程列表
    std::vector<Course> courses = get_courses_list();

    // 创建JSON响应
    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < courses.size(); ++i) {
        if (i > 0) {
            response_json << ",";
        }
        response_json << "{"
                      << "\"courseId\":\"" << courses[i].courseId << "\","
                      << "\"name\":\"" << courses[i].name << "\","
                      << "\"college\":\"" << courses[i].college << "\","
                      << "\"teacher\":\"" << courses[i].teacher << "\","
                      << "\"date\":\"" << courses[i].date << "\","
                      << "\"credits\":" << courses[i].credits << ","
                      << "\"classroom\":\"" << courses[i].classroom << "\""
                      << "}";
    }

    response_json << "]}";

    // 设置响应内容类型为JSON
    res.set_content(response_json.str(), "application/json");
    // 添加跨域相关的响应头，允许任意源访问（实际应用中需谨慎配置）
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// 处理GET请求 - 某个课程的学生信息
void handle_course_students_get(const Request& req, Response& res) {
    // 从路径中获取课程号
    const auto& path_params = req.matches[0];

    std::string cno = get_last_segment(path_params);

    // 获取课程的学生列表
    std::vector<Enrollment> enrollments = get_enrollments_by_cno(cno);

    // 创建JSON响应
    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < enrollments.size(); ++i) {
        if (i > 0) {
            response_json << ",";
        }
        response_json << "{"
                      << "\"Sno\":\"" << enrollments[i].Sno << "\","
                      << "\"Sname\":\"" << get_student_name(enrollments[i].Sno) << "\","
                      << "\"Grade\":" << enrollments[i].Grade
                      << "}";
    }

    response_json << "]}";

    // 设置响应内容类型为JSON
    res.set_content(response_json.str(), "application/json");
    // 添加跨域相关的响应头，允许任意源访问（实际应用中需谨慎配置）
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// 处理GET请求 - 学生的所有课程信息
void handle_student_courses_get(const Request& req, Response& res) {
    // 从路径中获取学号
    const auto& path_params = req.matches[0];

    std::string sno = get_last_segment(path_params);

    // 获取学生的所有课程信息
    std::vector<CourseGrade> courses = get_student_courses(sno);

    // 创建JSON响应
    std::stringstream response_json;
    response_json << "{\"data\":[";

    for (size_t i = 0; i < courses.size(); ++i) {
        if (i > 0) {
            response_json << ",";
        }
        response_json << "{"
                      << "\"Cname\":\"" << courses[i].course_name << "\","
                      << "\"Grade\":" << courses[i].grade
                      << "}";
    }

    response_json << "]}";

    // 设置响应内容类型为JSON
    res.set_content(response_json.str(), "application/json");
    // 添加跨域相关的响应头，允许任意源访问（实际应用中需谨慎配置）
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

int main() {
    try {
        // 创建HTTP服务器
        Server svr;

        // 设置处理函数
        svr.Get("/api/students", handle_students_get);
        svr.Get("/api/courses", handle_courses_get);
        svr.Get(R"(/api/course_students/(\d+))", handle_course_students_get);
        svr.Get(R"(/api/student_courses/(\d+))", handle_student_courses_get);

        // 开始监听
        std::cout << "Starting to listen on port 8080..." << std::endl;  
        svr.listen("0.0.0.0", 8080);  

        std::cout << "Server is running on http://localhost:8080" << std::endl;
        std::cout << "Press Enter to stop the server." << std::endl;
        std::cin.get();

    } catch (const std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "Unknown exception occurred." << std::endl;
    }

    return 0;
}
