#pragma once

#include <string>

#include <odb/core.hxx>

namespace app
{
#pragma db object table("wenjw_stu")
class Student
{
public:
    Student() = default;

    Student(int id,
            std::string student_name,
            std::string department,
            std::string telephone,
            std::string gender,
            int student_age,
            std::string student_address,
            std::string postcode)
        : student_id(id),
          name(std::move(student_name)),
          college(std::move(department)),
          phone(std::move(telephone)),
          sex(std::move(gender)),
          age(student_age),
          address(std::move(student_address)),
          zip_code(std::move(postcode))
    {
    }

#pragma db id column("sno")
    int student_id = 0;
#pragma db column("sname")
    std::string name;
#pragma db column("sdept")
    std::string college;
#pragma db column("stel")
    std::string phone;
#pragma db column("sex")
    std::string sex;
#pragma db column("sage")
    int age = 0;
#pragma db column("saddr")
    std::string address;
#pragma db column("spost")
    std::string zip_code;
};

#pragma db object table("wenjw_cou")
class Course
{
public:
    Course() = default;

    Course(int id,
           std::string course_name,
           std::string department,
           std::string teacher_name,
           std::string semester,
           int course_credits,
           std::string course_classroom)
        : course_id(id),
          name(std::move(course_name)),
          college(std::move(department)),
          teacher(std::move(teacher_name)),
          date(std::move(semester)),
          credits(course_credits),
          classroom(std::move(course_classroom))
    {
    }

#pragma db id column("cno")
    int course_id = 0;
#pragma db column("cname")
    std::string name;
#pragma db column("cdept")
    std::string college;
#pragma db column("ctea")
    std::string teacher;
#pragma db column("cdate")
    std::string date;
#pragma db column("cscore")
    int credits = 0;
#pragma db column("caddr")
    std::string classroom;
};

#pragma db value
struct EnrollmentId
{
#pragma db column("sno")
    int student_id = 0;
#pragma db column("cno")
    int course_id = 0;
};

inline bool operator==(const EnrollmentId &left, const EnrollmentId &right)
{
    return left.student_id == right.student_id &&
           left.course_id == right.course_id;
}

inline bool operator!=(const EnrollmentId &left, const EnrollmentId &right)
{
    return !(left == right);
}

#pragma db object table("wenjw_sc")
class Enrollment
{
public:
    Enrollment() = default;
    Enrollment(int student_id, int course_id, double course_grade)
        : id{student_id, course_id}, grade(course_grade)
    {
    }

#pragma db id column("")
    EnrollmentId id;
#pragma db column("grade")
    double grade = 0.0;
};

#pragma db object table("wenjw_user")
class User
{
public:
    User() = default;

    User(std::string login_name,
         std::string hash,
         std::string salt,
         std::string user_role,
         std::string shown_name,
         int linked_student_id,
         std::string linked_teacher_name)
        : username(std::move(login_name)),
          password_hash(std::move(hash)),
          password_salt(std::move(salt)),
          role(std::move(user_role)),
          display_name(std::move(shown_name)),
          student_id(linked_student_id),
          teacher_name(std::move(linked_teacher_name))
    {
    }

#pragma db id column("username")
    std::string username;
#pragma db column("password_hash")
    std::string password_hash;
#pragma db column("password_salt")
    std::string password_salt;
#pragma db column("role")
    std::string role;
#pragma db column("display_name")
    std::string display_name;
#pragma db column("student_id")
    int student_id = 0;
#pragma db column("teacher_name")
    std::string teacher_name;
};

#pragma db view query("SELECT c.cno AS course_id, c.cname AS name, c.cdept AS college, c.ctea AS teacher, c.cdate AS course_date, c.cscore AS credits, c.caddr AS classroom, COUNT(sc.sno) AS student_count FROM wenjw_cou c LEFT JOIN wenjw_sc sc ON c.cno = sc.cno GROUP BY c.cno, c.cname, c.cdept, c.ctea, c.cdate, c.cscore, c.caddr ORDER BY c.cno")
class CourseSummary
{
public:
    int course_id = 0;
    std::string name;
    std::string college;
    std::string teacher;
    std::string date;
    int credits = 0;
    std::string classroom;
    unsigned long long student_count = 0;
};
} // namespace app
