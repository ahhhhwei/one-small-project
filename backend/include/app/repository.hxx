#pragma once

#include <cstddef>
#include <optional>
#include <string>
#include <vector>

#include <odb/mysql/database.hxx>

#include "app/models.hxx"

namespace app
{
struct StudentPage
{
    std::vector<Student> items;
    std::size_t total = 0;
};

struct EnrollmentRow
{
    int student_id = 0;
    std::string student_name;
    int course_id = 0;
    double grade = 0.0;
};

struct EnrollmentPage
{
    std::vector<EnrollmentRow> items;
    std::size_t total = 0;
};

struct StudentCourseRow
{
    Course course;
    double grade = 0.0;
};

class Repository
{
public:
    explicit Repository(odb::mysql::database &database);

    StudentPage students(const std::string &keyword, std::size_t page, std::size_t page_size);
    std::optional<Student> student(int student_id);
    void create_student(const Student &student);
    bool update_student(const Student &student);
    bool delete_student(int student_id);

    std::vector<CourseSummary> courses(const std::optional<std::string> &teacher = std::nullopt);
    std::optional<Course> course(int course_id);
    void create_course(const Course &course);
    bool update_course(const Course &course);
    bool delete_course(int course_id);

    EnrollmentPage course_students(int course_id, std::size_t page, std::size_t page_size);
    std::vector<StudentCourseRow> student_courses(int student_id);
    std::vector<CourseSummary> available_courses(int student_id);
    bool create_enrollment(int student_id, int course_id, double grade);
    bool update_enrollment(int student_id, int course_id, double grade);
    bool delete_enrollment(int student_id, int course_id);
    bool teacher_owns_course(const std::string &teacher_name, int course_id);

private:
    odb::mysql::database &database_;
};
} // namespace app
