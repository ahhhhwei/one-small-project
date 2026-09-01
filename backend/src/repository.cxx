#include "app/repository.hxx"

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <unordered_set>

#include <odb/transaction.hxx>

#include "models-odb.hxx"

namespace app
{
Repository::Repository(odb::mysql::database &database) : database_(database)
{
}

StudentPage Repository::students(const std::string &keyword,
                                 std::size_t page,
                                 std::size_t page_size)
{
    std::vector<Student> matches;
    odb::transaction transaction(database_.begin());
    using Query = odb::query<Student>;
    for (const Student &student : database_.query<Student>(Query{}))
    {
        if (keyword.empty() ||
            std::to_string(student.student_id).find(keyword) != std::string::npos ||
            student.name.find(keyword) != std::string::npos ||
            student.college.find(keyword) != std::string::npos ||
            student.phone.find(keyword) != std::string::npos)
        {
            matches.push_back(student);
        }
    }
    transaction.commit();

    std::sort(matches.begin(), matches.end(), [](const Student &left, const Student &right) {
        return left.student_id < right.student_id;
    });

    StudentPage result;
    result.total = matches.size();
    const std::size_t begin = std::min((page - 1) * page_size, matches.size());
    const std::size_t end = std::min(begin + page_size, matches.size());
    result.items.assign(matches.begin() + static_cast<std::ptrdiff_t>(begin),
                        matches.begin() + static_cast<std::ptrdiff_t>(end));
    return result;
}

std::optional<Student> Repository::student(int student_id)
{
    odb::transaction transaction(database_.begin());
    Student value;
    const bool found = database_.find<Student>(student_id, value);
    transaction.commit();
    return found ? std::optional<Student>(value) : std::nullopt;
}

void Repository::create_student(const Student &student)
{
    odb::transaction transaction(database_.begin());
    database_.persist(student);
    transaction.commit();
}

bool Repository::update_student(const Student &student)
{
    odb::transaction transaction(database_.begin());
    Student existing;
    if (!database_.find<Student>(student.student_id, existing))
    {
        return false;
    }
    database_.update(student);
    transaction.commit();
    return true;
}

bool Repository::delete_student(int student_id)
{
    odb::transaction transaction(database_.begin());
    Student existing;
    if (!database_.find<Student>(student_id, existing))
    {
        return false;
    }

    using Query = odb::query<Enrollment>;
    std::vector<EnrollmentId> enrollment_ids;
    for (const Enrollment &enrollment :
         database_.query<Enrollment>(Query::id.student_id == student_id))
    {
        enrollment_ids.push_back(enrollment.id);
    }
    for (const EnrollmentId &id : enrollment_ids)
    {
        database_.erase<Enrollment>(id);
    }
    database_.erase<Student>(student_id);
    transaction.commit();
    return true;
}

std::vector<CourseSummary> Repository::courses(const std::optional<std::string> &teacher)
{
    std::vector<CourseSummary> items;
    odb::transaction transaction(database_.begin());
    for (const CourseSummary &course : database_.query<CourseSummary>())
    {
        if (!teacher || course.teacher == *teacher)
        {
            items.push_back(course);
        }
    }
    transaction.commit();
    return items;
}

std::optional<Course> Repository::course(int course_id)
{
    odb::transaction transaction(database_.begin());
    Course value;
    const bool found = database_.find<Course>(course_id, value);
    transaction.commit();
    return found ? std::optional<Course>(value) : std::nullopt;
}

void Repository::create_course(const Course &course)
{
    odb::transaction transaction(database_.begin());
    database_.persist(course);
    transaction.commit();
}

bool Repository::update_course(const Course &course)
{
    odb::transaction transaction(database_.begin());
    Course existing;
    if (!database_.find<Course>(course.course_id, existing))
    {
        return false;
    }
    database_.update(course);
    transaction.commit();
    return true;
}

bool Repository::delete_course(int course_id)
{
    odb::transaction transaction(database_.begin());
    Course existing;
    if (!database_.find<Course>(course_id, existing))
    {
        return false;
    }

    using Query = odb::query<Enrollment>;
    std::vector<EnrollmentId> enrollment_ids;
    for (const Enrollment &enrollment :
         database_.query<Enrollment>(Query::id.course_id == course_id))
    {
        enrollment_ids.push_back(enrollment.id);
    }
    for (const EnrollmentId &id : enrollment_ids)
    {
        database_.erase<Enrollment>(id);
    }
    database_.erase<Course>(course_id);
    transaction.commit();
    return true;
}

EnrollmentPage Repository::course_students(int course_id,
                                           std::size_t page,
                                           std::size_t page_size)
{
    EnrollmentPage result;
    std::vector<Enrollment> enrollments;
    odb::transaction transaction(database_.begin());
    using Query = odb::query<Enrollment>;
    for (const Enrollment &enrollment :
         database_.query<Enrollment>(Query::id.course_id == course_id))
    {
        enrollments.push_back(enrollment);
    }
    std::sort(enrollments.begin(), enrollments.end(), [](const Enrollment &left, const Enrollment &right) {
        return left.id.student_id < right.id.student_id;
    });
    result.total = enrollments.size();
    const std::size_t begin = std::min((page - 1) * page_size, enrollments.size());
    const std::size_t end = std::min(begin + page_size, enrollments.size());
    for (std::size_t index = begin; index < end; ++index)
    {
        Student student;
        if (database_.find<Student>(enrollments[index].id.student_id, student))
        {
            result.items.push_back(EnrollmentRow{
                student.student_id,
                student.name,
                enrollments[index].id.course_id,
                enrollments[index].grade});
        }
    }
    transaction.commit();
    return result;
}

std::vector<StudentCourseRow> Repository::student_courses(int student_id)
{
    std::vector<StudentCourseRow> result;
    odb::transaction transaction(database_.begin());
    using Query = odb::query<Enrollment>;
    for (const Enrollment &enrollment :
         database_.query<Enrollment>(Query::id.student_id == student_id))
    {
        Course course;
        if (database_.find<Course>(enrollment.id.course_id, course))
        {
            result.push_back(StudentCourseRow{course, enrollment.grade});
        }
    }
    transaction.commit();
    std::sort(result.begin(), result.end(), [](const StudentCourseRow &left, const StudentCourseRow &right) {
        return left.course.course_id < right.course.course_id;
    });
    return result;
}

std::vector<CourseSummary> Repository::available_courses(int student_id)
{
    std::unordered_set<int> selected;
    {
        odb::transaction transaction(database_.begin());
        using Query = odb::query<Enrollment>;
        for (const Enrollment &enrollment :
             database_.query<Enrollment>(Query::id.student_id == student_id))
        {
            selected.insert(enrollment.id.course_id);
        }
        transaction.commit();
    }

    std::vector<CourseSummary> result;
    for (const CourseSummary &course : courses())
    {
        if (selected.find(course.course_id) == selected.end())
        {
            result.push_back(course);
        }
    }
    return result;
}

bool Repository::create_enrollment(int student_id, int course_id, double grade)
{
    odb::transaction transaction(database_.begin());
    Student student;
    Course course;
    Enrollment existing;
    const EnrollmentId id{student_id, course_id};
    if (!database_.find<Student>(student_id, student) ||
        !database_.find<Course>(course_id, course) ||
        database_.find<Enrollment>(id, existing))
    {
        return false;
    }
    Enrollment enrollment(student_id, course_id, grade);
    database_.persist(enrollment);
    transaction.commit();
    return true;
}

bool Repository::update_enrollment(int student_id, int course_id, double grade)
{
    odb::transaction transaction(database_.begin());
    Enrollment enrollment;
    const EnrollmentId id{student_id, course_id};
    if (!database_.find<Enrollment>(id, enrollment))
    {
        return false;
    }
    enrollment.grade = grade;
    database_.update(enrollment);
    transaction.commit();
    return true;
}

bool Repository::delete_enrollment(int student_id, int course_id)
{
    odb::transaction transaction(database_.begin());
    Enrollment enrollment;
    const EnrollmentId id{student_id, course_id};
    if (!database_.find<Enrollment>(id, enrollment))
    {
        return false;
    }
    database_.erase<Enrollment>(id);
    transaction.commit();
    return true;
}

bool Repository::teacher_owns_course(const std::string &teacher_name, int course_id)
{
    const auto value = course(course_id);
    return value && value->teacher == teacher_name;
}
} // namespace app
