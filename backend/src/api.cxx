#include "app/api.hxx"

#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <functional>
#include <limits>
#include <stdexcept>

#include <odb/exception.hxx>

#include "app/json.hxx"

namespace app
{
namespace
{
Json::Value user_json(const Principal &user)
{
    Json::Value value;
    value["username"] = user.username;
    value["name"] = user.display_name;
    value["role"] = user.role;
    value["studentId"] = user.student_id;
    value["teacherName"] = user.teacher_name;
    return value;
}

Json::Value student_json(const Student &student)
{
    Json::Value value;
    value["studentId"] = std::to_string(student.student_id);
    value["name"] = student.name;
    value["college"] = student.college;
    value["phone"] = student.phone;
    value["sex"] = student.sex;
    value["age"] = student.age;
    value["address"] = student.address;
    value["zipCode"] = student.zip_code;
    return value;
}

Json::Value course_json(const CourseSummary &course)
{
    Json::Value value;
    value["courseId"] = std::to_string(course.course_id);
    value["name"] = course.name;
    value["college"] = course.college;
    value["teacher"] = course.teacher;
    value["date"] = course.date;
    value["credits"] = course.credits;
    value["classroom"] = course.classroom;
    value["studentCount"] = Json::UInt64(course.student_count);
    return value;
}

Json::Value course_json(const Course &course, unsigned long long student_count = 0)
{
    return course_json(CourseSummary{course.course_id,
                                     course.name,
                                     course.college,
                                     course.teacher,
                                     course.date,
                                     course.credits,
                                     course.classroom,
                                     student_count});
}

Json::Value course_student_json(const EnrollmentRow &row)
{
    Json::Value value;
    value["studentId"] = std::to_string(row.student_id);
    value["studentName"] = row.student_name;
    value["courseId"] = std::to_string(row.course_id);
    value["grade"] = row.grade;
    return value;
}

Json::Value selected_course_json(const StudentCourseRow &row)
{
    Json::Value value = course_json(row.course);
    value["courseName"] = row.course.name;
    value["grade"] = row.grade;
    return value;
}

Json::Value success_data(const Json::Value &data)
{
    Json::Value value;
    value["success"] = true;
    value["data"] = data;
    return value;
}

std::size_t query_size(const httplib::Request &request,
                       const char *name,
                       std::size_t fallback,
                       std::size_t maximum)
{
    if (!request.has_param(name))
    {
        return fallback;
    }
    const std::string text = request.get_param_value(name);
    char *end = nullptr;
    const unsigned long long parsed = std::strtoull(text.c_str(), &end, 10);
    if (end == nullptr || *end != '\0' || parsed == 0)
    {
        return fallback;
    }
    return std::min<std::size_t>(static_cast<std::size_t>(parsed), maximum);
}

bool integer_value(const Json::Value &json,
                   const char *name,
                   int minimum,
                   int maximum,
                   int &result)
{
    if (!json.isMember(name))
    {
        return false;
    }
    if (json[name].isInt())
    {
        result = json[name].asInt();
    }
    else if (json[name].isString())
    {
        const std::string text = json[name].asString();
        char *end = nullptr;
        const long parsed = std::strtol(text.c_str(), &end, 10);
        if (end == nullptr || *end != '\0' || parsed < std::numeric_limits<int>::min() ||
            parsed > std::numeric_limits<int>::max())
        {
            return false;
        }
        result = static_cast<int>(parsed);
    }
    else
    {
        return false;
    }
    return result >= minimum && result <= maximum;
}

bool number_value(const Json::Value &json,
                  const char *name,
                  double minimum,
                  double maximum,
                  double &result)
{
    if (!json.isMember(name) || !json[name].isNumeric())
    {
        return false;
    }
    result = json[name].asDouble();
    return std::isfinite(result) && result >= minimum && result <= maximum;
}

bool string_value(const Json::Value &json,
                  const char *name,
                  std::size_t maximum,
                  std::string &result)
{
    if (!json.isMember(name) || !json[name].isString())
    {
        return false;
    }
    result = json[name].asString();
    const auto first = result.find_first_not_of(" \t\r\n");
    const auto last = result.find_last_not_of(" \t\r\n");
    result = first == std::string::npos ? "" : result.substr(first, last - first + 1);
    return !result.empty() && result.size() <= maximum;
}

bool parse_student(const httplib::Request &request,
                   bool needs_id,
                   int forced_id,
                   Student &student,
                   std::string &error)
{
    Json::Value json;
    if (!read_json(request, json, error) || !json.isObject())
    {
        error = "请求体必须是合法 JSON 对象";
        return false;
    }

    int id = forced_id;
    if (needs_id && !integer_value(json, "studentId", 1, std::numeric_limits<int>::max(), id))
    {
        error = "学号必须是有效的正整数";
        return false;
    }
    int age = 0;
    std::string name, college, phone, sex, address, zip_code;
    if (!string_value(json, "name", 100, name) ||
        !string_value(json, "college", 100, college) ||
        !string_value(json, "phone", 20, phone) ||
        !string_value(json, "sex", 10, sex) ||
        !integer_value(json, "age", 15, 100, age) ||
        !string_value(json, "address", 200, address) ||
        !string_value(json, "zipCode", 10, zip_code))
    {
        error = "学生字段不完整或格式不正确";
        return false;
    }
    if (sex != "男" && sex != "女")
    {
        error = "性别只能是男或女";
        return false;
    }
    if (phone.size() != 11 || !std::all_of(phone.begin(), phone.end(), ::isdigit) ||
        zip_code.size() != 6 || !std::all_of(zip_code.begin(), zip_code.end(), ::isdigit))
    {
        error = "手机号必须为 11 位、邮编必须为 6 位数字";
        return false;
    }
    student = Student(id, name, college, phone, sex, age, address, zip_code);
    return true;
}

bool parse_course(const httplib::Request &request,
                  bool needs_id,
                  int forced_id,
                  Course &course,
                  std::string &error)
{
    Json::Value json;
    if (!read_json(request, json, error) || !json.isObject())
    {
        error = "请求体必须是合法 JSON 对象";
        return false;
    }
    int id = forced_id;
    if (needs_id && !integer_value(json, "courseId", 1, std::numeric_limits<int>::max(), id))
    {
        error = "课程号必须是有效的正整数";
        return false;
    }
    int credits = 0;
    std::string name, college, teacher, date, classroom;
    if (!string_value(json, "name", 100, name) ||
        !string_value(json, "college", 100, college) ||
        !string_value(json, "teacher", 100, teacher) ||
        !string_value(json, "date", 20, date) ||
        !integer_value(json, "credits", 0, 10, credits) ||
        !string_value(json, "classroom", 200, classroom))
    {
        error = "课程字段不完整或格式不正确";
        return false;
    }
    course = Course(id, name, college, teacher, date, credits, classroom);
    return true;
}

int path_id(const httplib::Request &request, std::size_t index)
{
    return std::stoi(request.matches[index].str());
}

Json::Value array_of_students(const std::vector<Student> &students)
{
    Json::Value array(Json::arrayValue);
    for (const Student &student : students)
    {
        array.append(student_json(student));
    }
    return array;
}

Json::Value array_of_courses(const std::vector<CourseSummary> &courses)
{
    Json::Value array(Json::arrayValue);
    for (const CourseSummary &course : courses)
    {
        array.append(course_json(course));
    }
    return array;
}
} // namespace

Api::Api(Repository &repository, AuthService &auth, Logger &logger)
    : repository_(repository), auth_(auth), logger_(logger)
{
}

std::optional<Principal> Api::require_role(const httplib::Request &request,
                                           httplib::Response &response,
                                           std::initializer_list<const char *> roles)
{
    const auto principal = auth_.authenticate(request);
    if (!principal)
    {
        send_error(response, 401, "请先登录或重新登录");
        return std::nullopt;
    }
    const bool allowed = std::any_of(roles.begin(), roles.end(), [&](const char *role) {
        return principal->role == role;
    });
    if (!allowed)
    {
        Json::Value fields(Json::objectValue);
        fields["username"] = principal->username;
        fields["role"] = principal->role;
        fields["method"] = request.method;
        fields["path"] = request.path;
        fields["remoteAddress"] = request.remote_addr;
        logger_.warning("auth.permission_denied", "用户尝试访问无权限资源", fields);
        send_error(response, 403, "当前账号无权执行此操作");
        return std::nullopt;
    }
    return principal;
}

void Api::login(const httplib::Request &request, httplib::Response &response)
{
    Json::Value json;
    std::string error;
    if (!read_json(request, json, error))
    {
        send_error(response, 400, "请求体必须是合法 JSON");
        return;
    }
    std::string username, password;
    if (!string_value(json, "username", 50, username) ||
        !string_value(json, "password", 200, password))
    {
        send_error(response, 400, "请输入用户名和密码");
        return;
    }
    const auto result = auth_.login(username, password);
    if (!result)
    {
        send_error(response, 401, "用户名或密码错误");
        return;
    }
    Json::Value data;
    data["token"] = result->token;
    data["user"] = user_json(result->user);
    send_json(response, 200, success_data(data));
}

void Api::me(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"admin", "teacher", "student"});
    if (principal)
    {
        send_json(response, 200, success_data(user_json(*principal)));
    }
}

void Api::logout(const httplib::Request &request, httplib::Response &response)
{
    auth_.logout(request);
    send_success(response, 200, "已退出登录");
}

void Api::list_students(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    const std::size_t page = query_size(request, "page", 1, 1000000);
    const std::size_t page_size = query_size(request, "page_size", 20, 100);
    const std::string keyword = request.has_param("keyword") ? request.get_param_value("keyword") : "";
    const StudentPage result = repository_.students(keyword, page, page_size);
    Json::Value value = success_data(array_of_students(result.items));
    value["pagination"]["page"] = Json::UInt64(page);
    value["pagination"]["pageSize"] = Json::UInt64(page_size);
    value["pagination"]["total"] = Json::UInt64(result.total);
    send_json(response, 200, value);
}

void Api::get_student(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    const auto student = repository_.student(path_id(request, 1));
    if (!student) send_error(response, 404, "学生不存在");
    else send_json(response, 200, success_data(student_json(*student)));
}

void Api::create_student(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Student student;
    std::string error;
    if (!parse_student(request, true, 0, student, error))
    {
        send_error(response, 400, error);
        return;
    }
    if (repository_.student(student.student_id))
    {
        send_error(response, 409, "学号已存在");
        return;
    }
    repository_.create_student(student);
    Json::Value value = success_data(student_json(student));
    value["message"] = "学生已创建";
    send_json(response, 201, value);
}

void Api::update_student(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Student student;
    std::string error;
    if (!parse_student(request, false, path_id(request, 1), student, error))
    {
        send_error(response, 400, error);
        return;
    }
    if (!repository_.update_student(student)) send_error(response, 404, "学生不存在");
    else
    {
        Json::Value value = success_data(student_json(student));
        value["message"] = "学生信息已更新";
        send_json(response, 200, value);
    }
}

void Api::delete_student(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    if (!repository_.delete_student(path_id(request, 1))) send_error(response, 404, "学生不存在");
    else send_success(response, 200, "学生及其选课记录已删除");
}

void Api::list_courses(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    send_json(response, 200, success_data(array_of_courses(repository_.courses())));
}

void Api::create_course(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Course course;
    std::string error;
    if (!parse_course(request, true, 0, course, error))
    {
        send_error(response, 400, error);
        return;
    }
    if (repository_.course(course.course_id))
    {
        send_error(response, 409, "课程号已存在");
        return;
    }
    repository_.create_course(course);
    Json::Value value = success_data(course_json(course));
    value["message"] = "课程已创建";
    send_json(response, 201, value);
}

void Api::update_course(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Course course;
    std::string error;
    if (!parse_course(request, false, path_id(request, 1), course, error))
    {
        send_error(response, 400, error);
        return;
    }
    if (!repository_.update_course(course)) send_error(response, 404, "课程不存在");
    else
    {
        Json::Value value = success_data(course_json(course));
        value["message"] = "课程已更新";
        send_json(response, 200, value);
    }
}

void Api::delete_course(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    if (!repository_.delete_course(path_id(request, 1))) send_error(response, 404, "课程不存在");
    else send_success(response, 200, "课程及其选课记录已删除");
}

void Api::list_course_students(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    const std::size_t page = query_size(request, "page", 1, 1000000);
    const std::size_t page_size = query_size(request, "page_size", 20, 100);
    const EnrollmentPage result = repository_.course_students(path_id(request, 1), page, page_size);
    Json::Value array(Json::arrayValue);
    for (const auto &row : result.items) array.append(course_student_json(row));
    Json::Value value = success_data(array);
    value["pagination"]["page"] = Json::UInt64(page);
    value["pagination"]["pageSize"] = Json::UInt64(page_size);
    value["pagination"]["total"] = Json::UInt64(result.total);
    send_json(response, 200, value);
}

void Api::list_student_courses(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Json::Value array(Json::arrayValue);
    for (const auto &row : repository_.student_courses(path_id(request, 1)))
        array.append(selected_course_json(row));
    send_json(response, 200, success_data(array));
}

void Api::create_enrollment(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Json::Value json;
    std::string error;
    int student_id = 0, course_id = 0;
    double grade = 0;
    if (!read_json(request, json, error) ||
        !integer_value(json, "studentId", 1, std::numeric_limits<int>::max(), student_id) ||
        !integer_value(json, "courseId", 1, std::numeric_limits<int>::max(), course_id) ||
        !number_value(json, "grade", 0, 100, grade))
    {
        send_error(response, 400, "选课字段不完整或格式不正确");
        return;
    }
    if (!repository_.create_enrollment(student_id, course_id, grade))
        send_error(response, 409, "学生、课程不存在或选课记录已存在");
    else send_success(response, 201, "选课记录已创建");
}

void Api::update_enrollment(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    Json::Value json;
    std::string error;
    double grade = 0;
    if (!read_json(request, json, error) || !number_value(json, "grade", 0, 100, grade))
    {
        send_error(response, 400, "成绩必须在 0 到 100 之间");
        return;
    }
    if (!repository_.update_enrollment(path_id(request, 1), path_id(request, 2), grade))
        send_error(response, 404, "选课记录不存在");
    else send_success(response, 200, "成绩已更新");
}

void Api::delete_enrollment(const httplib::Request &request, httplib::Response &response)
{
    if (!require_role(request, response, {"admin"})) return;
    if (!repository_.delete_enrollment(path_id(request, 1), path_id(request, 2)))
        send_error(response, 404, "选课记录不存在");
    else send_success(response, 200, "选课记录已删除");
}

void Api::teacher_courses(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"teacher"});
    if (!principal) return;
    send_json(response, 200,
              success_data(array_of_courses(repository_.courses(principal->teacher_name))));
}

void Api::teacher_course_students(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"teacher"});
    if (!principal) return;
    const int course_id = path_id(request, 1);
    if (!repository_.teacher_owns_course(principal->teacher_name, course_id))
    {
        send_error(response, 403, "只能查看自己所授课程");
        return;
    }
    const std::size_t page = query_size(request, "page", 1, 1000000);
    const std::size_t page_size = query_size(request, "page_size", 20, 100);
    const EnrollmentPage result = repository_.course_students(course_id, page, page_size);
    Json::Value array(Json::arrayValue);
    for (const auto &row : result.items) array.append(course_student_json(row));
    Json::Value value = success_data(array);
    value["pagination"]["page"] = Json::UInt64(page);
    value["pagination"]["pageSize"] = Json::UInt64(page_size);
    value["pagination"]["total"] = Json::UInt64(result.total);
    send_json(response, 200, value);
}

void Api::teacher_update_grade(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"teacher"});
    if (!principal) return;
    const int student_id = path_id(request, 1);
    const int course_id = path_id(request, 2);
    if (!repository_.teacher_owns_course(principal->teacher_name, course_id))
    {
        send_error(response, 403, "只能录入自己所授课程的成绩");
        return;
    }
    Json::Value json;
    std::string error;
    double grade = 0;
    if (!read_json(request, json, error) || !number_value(json, "grade", 0, 100, grade))
    {
        send_error(response, 400, "成绩必须在 0 到 100 之间");
        return;
    }
    if (!repository_.update_enrollment(student_id, course_id, grade))
        send_error(response, 404, "选课记录不存在");
    else send_success(response, 200, "成绩已更新");
}

void Api::student_profile(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"student"});
    if (!principal) return;
    const auto student = repository_.student(principal->student_id);
    if (!student) send_error(response, 404, "账号未绑定有效学生");
    else send_json(response, 200, success_data(student_json(*student)));
}

void Api::student_selected_courses(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"student"});
    if (!principal) return;
    Json::Value array(Json::arrayValue);
    for (const auto &row : repository_.student_courses(principal->student_id))
        array.append(selected_course_json(row));
    send_json(response, 200, success_data(array));
}

void Api::student_available_courses(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"student"});
    if (!principal) return;
    send_json(response, 200,
              success_data(array_of_courses(repository_.available_courses(principal->student_id))));
}

void Api::student_select_course(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"student"});
    if (!principal) return;
    if (!repository_.create_enrollment(principal->student_id, path_id(request, 1), 0))
        send_error(response, 409, "课程不存在或已经选过该课程");
    else send_success(response, 201, "选课成功");
}

void Api::student_drop_course(const httplib::Request &request, httplib::Response &response)
{
    const auto principal = require_role(request, response, {"student"});
    if (!principal) return;
    if (!repository_.delete_enrollment(principal->student_id, path_id(request, 1)))
        send_error(response, 404, "未找到该选课记录");
    else send_success(response, 200, "退课成功");
}

void Api::register_routes(httplib::Server &server)
{
    server.Get("/api/health", [](const httplib::Request &, httplib::Response &response) {
        Json::Value data;
        data["status"] = "ok";
        data["persistence"] = "ODB MySQL";
        send_json(response, 200, success_data(data));
    });

    server.Post("/api/auth/login", [this](const auto &req, auto &res) { login(req, res); });
    server.Get("/api/auth/me", [this](const auto &req, auto &res) { me(req, res); });
    server.Post("/api/auth/logout", [this](const auto &req, auto &res) { logout(req, res); });

    server.Get("/api/students", [this](const auto &req, auto &res) { list_students(req, res); });
    server.Post("/api/students", [this](const auto &req, auto &res) { create_student(req, res); });
    server.Get(R"(/api/students/(\d+))", [this](const auto &req, auto &res) { get_student(req, res); });
    server.Put(R"(/api/students/(\d+))", [this](const auto &req, auto &res) { update_student(req, res); });
    server.Delete(R"(/api/students/(\d+))", [this](const auto &req, auto &res) { delete_student(req, res); });

    server.Get("/api/courses", [this](const auto &req, auto &res) { list_courses(req, res); });
    server.Post("/api/courses", [this](const auto &req, auto &res) { create_course(req, res); });
    server.Put(R"(/api/courses/(\d+))", [this](const auto &req, auto &res) { update_course(req, res); });
    server.Delete(R"(/api/courses/(\d+))", [this](const auto &req, auto &res) { delete_course(req, res); });
    server.Get(R"(/api/course_students/(\d+))", [this](const auto &req, auto &res) { list_course_students(req, res); });
    server.Get(R"(/api/student_courses/(\d+))", [this](const auto &req, auto &res) { list_student_courses(req, res); });
    server.Post("/api/enrollments", [this](const auto &req, auto &res) { create_enrollment(req, res); });
    server.Put(R"(/api/enrollments/(\d+)/(\d+))", [this](const auto &req, auto &res) { update_enrollment(req, res); });
    server.Delete(R"(/api/enrollments/(\d+)/(\d+))", [this](const auto &req, auto &res) { delete_enrollment(req, res); });

    server.Get("/api/teacher/courses", [this](const auto &req, auto &res) { teacher_courses(req, res); });
    server.Get(R"(/api/teacher/courses/(\d+)/students)", [this](const auto &req, auto &res) { teacher_course_students(req, res); });
    server.Put(R"(/api/teacher/enrollments/(\d+)/(\d+))", [this](const auto &req, auto &res) { teacher_update_grade(req, res); });

    server.Get("/api/student/profile", [this](const auto &req, auto &res) { student_profile(req, res); });
    server.Get("/api/student/courses", [this](const auto &req, auto &res) { student_selected_courses(req, res); });
    server.Get("/api/student/available-courses", [this](const auto &req, auto &res) { student_available_courses(req, res); });
    server.Post(R"(/api/student/enrollments/(\d+))", [this](const auto &req, auto &res) { student_select_course(req, res); });
    server.Delete(R"(/api/student/enrollments/(\d+))", [this](const auto &req, auto &res) { student_drop_course(req, res); });

    server.Options(R"(/api/.*)", [](const httplib::Request &, httplib::Response &response) {
        set_cors_headers(response);
        response.status = 204;
    });

    server.set_exception_handler([this](const httplib::Request &request,
                                        httplib::Response &response,
                                        std::exception_ptr error) {
        Json::Value fields(Json::objectValue);
        fields["method"] = request.method;
        fields["path"] = request.path;
        fields["remoteAddress"] = request.remote_addr;
        try
        {
            if (error) std::rethrow_exception(error);
        }
        catch (const odb::exception &exception)
        {
            fields["exception"] = exception.what();
            logger_.error("server.database_exception", "数据库操作异常", fields);
            send_error(response, 500, "数据库操作失败，请稍后重试");
        }
        catch (const std::exception &exception)
        {
            fields["exception"] = exception.what();
            logger_.error("server.unhandled_exception", "服务器未处理异常", fields);
            send_error(response, 500, "服务器内部错误，请稍后重试");
        }
        catch (...)
        {
            fields["exception"] = "unknown";
            logger_.error("server.unhandled_exception", "服务器未知异常", fields);
            send_error(response, 500, "服务器内部错误，请稍后重试");
        }
    });

    server.set_logger([this](const httplib::Request &request, const httplib::Response &response) {
        Json::Value fields(Json::objectValue);
        fields["method"] = request.method;
        fields["path"] = request.path;
        fields["status"] = response.status;
        fields["remoteAddress"] = request.remote_addr;
        fields["responseBytes"] = Json::UInt64(response.body.size());
        if (response.status >= 500)
            logger_.error("http.access", "HTTP 请求完成", fields);
        else if (response.status >= 400)
            logger_.warning("http.access", "HTTP 请求完成", fields);
        else
            logger_.info("http.access", "HTTP 请求完成", fields);
    });
}
} // namespace app
