#pragma once

#include <initializer_list>
#include <optional>
#include <string>

#include "app/auth.hxx"
#include "app/logger.hxx"
#include "app/repository.hxx"
#include "httplib.h"

namespace app
{
class Api
{
public:
    Api(Repository &repository, AuthService &auth, Logger &logger);
    void register_routes(httplib::Server &server);

private:
    std::optional<Principal> require_role(const httplib::Request &request,
                                          httplib::Response &response,
                                          std::initializer_list<const char *> roles);

    void login(const httplib::Request &request, httplib::Response &response);
    void me(const httplib::Request &request, httplib::Response &response);
    void logout(const httplib::Request &request, httplib::Response &response);

    void list_students(const httplib::Request &request, httplib::Response &response);
    void get_student(const httplib::Request &request, httplib::Response &response);
    void create_student(const httplib::Request &request, httplib::Response &response);
    void update_student(const httplib::Request &request, httplib::Response &response);
    void delete_student(const httplib::Request &request, httplib::Response &response);

    void list_courses(const httplib::Request &request, httplib::Response &response);
    void create_course(const httplib::Request &request, httplib::Response &response);
    void update_course(const httplib::Request &request, httplib::Response &response);
    void delete_course(const httplib::Request &request, httplib::Response &response);
    void list_course_students(const httplib::Request &request, httplib::Response &response);
    void list_student_courses(const httplib::Request &request, httplib::Response &response);
    void create_enrollment(const httplib::Request &request, httplib::Response &response);
    void update_enrollment(const httplib::Request &request, httplib::Response &response);
    void delete_enrollment(const httplib::Request &request, httplib::Response &response);

    void teacher_courses(const httplib::Request &request, httplib::Response &response);
    void teacher_course_students(const httplib::Request &request, httplib::Response &response);
    void teacher_update_grade(const httplib::Request &request, httplib::Response &response);

    void student_profile(const httplib::Request &request, httplib::Response &response);
    void student_selected_courses(const httplib::Request &request, httplib::Response &response);
    void student_available_courses(const httplib::Request &request, httplib::Response &response);
    void student_select_course(const httplib::Request &request, httplib::Response &response);
    void student_drop_course(const httplib::Request &request, httplib::Response &response);

    Repository &repository_;
    AuthService &auth_;
    Logger &logger_;
};
} // namespace app
