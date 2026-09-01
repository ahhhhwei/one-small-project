export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  studentId: number;
  teacherName: string;
}

export interface Student {
  studentId: string;
  name: string;
  college: string;
  phone: string;
  sex: '男' | '女';
  age: number;
  address: string;
  zipCode: string;
}

export interface Course {
  courseId: string;
  name: string;
  college: string;
  teacher: string;
  date: string;
  credits: number;
  classroom: string;
  studentCount: number;
}

export interface StudentCourse extends Course {
  courseName: string;
  grade: number;
}

export interface CourseStudent {
  studentId: string;
  studentName: string;
  courseId: string;
  grade: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface ListResponse<T> {
  success: true;
  data: T[];
}

export interface PaginatedResponse<T> extends ListResponse<T> {
  pagination: Pagination;
}

interface ApiErrorResponse {
  success?: false;
  error?: string;
  message?: string;
}

const TOKEN_KEY = 'course-selection-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  let payload: T & ApiErrorResponse;
  try {
    payload = (await response.json()) as T & ApiErrorResponse;
  } catch {
    throw new Error(`服务器返回了无法解析的响应（HTTP ${response.status}）`);
  }

  if (!response.ok) {
    if (response.status === 401 && window.location.pathname !== '/user/login') {
      clearToken();
      window.location.assign('/user/login');
    }
    throw new Error(payload.error || payload.message || `请求失败（HTTP ${response.status}）`);
  }
  return payload;
}

function jsonRequest<T>(path: string, method: 'POST' | 'PUT', data: object = {}): Promise<T> {
  return apiRequest<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(data),
  });
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const result = await jsonRequest<{
    success: true;
    data: { token: string; user: AuthUser };
  }>('/api/auth/login', 'POST', { username, password });
  localStorage.setItem(TOKEN_KEY, result.data.token);
  return result.data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const result = await apiRequest<{ success: true; data: AuthUser }>('/api/auth/me');
  return result.data;
}

export async function logout(): Promise<void> {
  try {
    await jsonRequest('/api/auth/logout', 'POST');
  } finally {
    clearToken();
  }
}

export function getStudents(params: {
  page: number;
  pageSize: number;
  keyword?: string;
}): Promise<PaginatedResponse<Student>> {
  const search = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.keyword) search.set('keyword', params.keyword);
  return apiRequest(`/api/students?${search.toString()}`);
}

export function createStudent(student: Student): Promise<{ message: string; data: Student }> {
  return jsonRequest('/api/students', 'POST', student);
}

export function updateStudent(student: Student): Promise<{ message: string; data: Student }> {
  return jsonRequest(`/api/students/${encodeURIComponent(student.studentId)}`, 'PUT', student);
}

export function deleteStudent(studentId: string): Promise<{ message: string }> {
  return apiRequest(`/api/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
}

export function getCourses(): Promise<ListResponse<Course>> {
  return apiRequest('/api/courses');
}

export function createCourse(course: Course): Promise<{ message: string; data: Course }> {
  return jsonRequest('/api/courses', 'POST', course);
}

export function updateCourse(course: Course): Promise<{ message: string; data: Course }> {
  return jsonRequest(`/api/courses/${encodeURIComponent(course.courseId)}`, 'PUT', course);
}

export function deleteCourse(courseId: string): Promise<{ message: string }> {
  return apiRequest(`/api/courses/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
}

export function getStudentCourses(studentId: string): Promise<ListResponse<StudentCourse>> {
  return apiRequest(`/api/student_courses/${encodeURIComponent(studentId)}`);
}

export function getCourseStudents(
  courseId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<CourseStudent>> {
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return apiRequest(`/api/course_students/${encodeURIComponent(courseId)}?${search.toString()}`);
}

export function createEnrollment(data: {
  studentId: string;
  courseId: string;
  grade: number;
}): Promise<{ message: string }> {
  return jsonRequest('/api/enrollments', 'POST', data);
}

export function updateEnrollment(
  studentId: string,
  courseId: string,
  grade: number,
): Promise<{ message: string }> {
  return jsonRequest(
    `/api/enrollments/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}`,
    'PUT',
    { grade },
  );
}

export function deleteEnrollment(studentId: string, courseId: string): Promise<{ message: string }> {
  return apiRequest(
    `/api/enrollments/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}`,
    { method: 'DELETE' },
  );
}

export function getTeacherCourses(): Promise<ListResponse<Course>> {
  return apiRequest('/api/teacher/courses');
}

export function getTeacherCourseStudents(
  courseId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedResponse<CourseStudent>> {
  const search = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return apiRequest(
    `/api/teacher/courses/${encodeURIComponent(courseId)}/students?${search.toString()}`,
  );
}

export function updateTeacherGrade(
  studentId: string,
  courseId: string,
  grade: number,
): Promise<{ message: string }> {
  return jsonRequest(
    `/api/teacher/enrollments/${encodeURIComponent(studentId)}/${encodeURIComponent(courseId)}`,
    'PUT',
    { grade },
  );
}

export async function getStudentProfile(): Promise<Student> {
  const result = await apiRequest<{ success: true; data: Student }>('/api/student/profile');
  return result.data;
}

export function getMyCourses(): Promise<ListResponse<StudentCourse>> {
  return apiRequest('/api/student/courses');
}

export function getAvailableCourses(): Promise<ListResponse<Course>> {
  return apiRequest('/api/student/available-courses');
}

export function selectCourse(courseId: string): Promise<{ message: string }> {
  return jsonRequest(`/api/student/enrollments/${encodeURIComponent(courseId)}`, 'POST');
}

export function dropCourse(courseId: string): Promise<{ message: string }> {
  return apiRequest(`/api/student/enrollments/${encodeURIComponent(courseId)}`, {
    method: 'DELETE',
  });
}
