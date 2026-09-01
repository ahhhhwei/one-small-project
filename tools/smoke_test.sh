#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
TEST_TEMP_DIR="$(mktemp -d)"
SELECTED_COURSE_ID=""
TEACHER_STUDENT_ID=""
TEACHER_COURSE_ID=""
ORIGINAL_GRADE=""
TEST_STUDENT_ID="$((2100000000 + $$ % 40000000))"
TEST_COURSE_ID="$((1900000000 + $$ % 100000000))"
TEST_STUDENT_CREATED=0
TEST_COURSE_CREATED=0

cleanup() {
  if [[ -n "${SELECTED_COURSE_ID}" && -s "${TEST_TEMP_DIR}/student.token" ]]; then
    curl -sS -X DELETE \
      -H "Authorization: Bearer $(<"${TEST_TEMP_DIR}/student.token")" \
      "${API_BASE}/api/student/enrollments/${SELECTED_COURSE_ID}" >/dev/null || true
  fi
  if [[ -n "${TEACHER_STUDENT_ID}" && -n "${TEACHER_COURSE_ID}" && -n "${ORIGINAL_GRADE}" ]]; then
    curl -sS -X PUT \
      -H "Authorization: Bearer $(<"${TEST_TEMP_DIR}/teacher.token")" \
      -H 'Content-Type: application/json' \
      -d "{\"grade\":${ORIGINAL_GRADE}}" \
      "${API_BASE}/api/teacher/enrollments/${TEACHER_STUDENT_ID}/${TEACHER_COURSE_ID}" >/dev/null || true
  fi
  if [[ -s "${TEST_TEMP_DIR}/admin.token" ]]; then
    local admin_token
    admin_token="$(<"${TEST_TEMP_DIR}/admin.token")"
    if [[ "${TEST_COURSE_CREATED}" == "1" ]]; then
      curl -sS -X DELETE -H "Authorization: Bearer ${admin_token}" \
        "${API_BASE}/api/courses/${TEST_COURSE_ID}" >/dev/null || true
    fi
    if [[ "${TEST_STUDENT_CREATED}" == "1" ]]; then
      curl -sS -X DELETE -H "Authorization: Bearer ${admin_token}" \
        "${API_BASE}/api/students/${TEST_STUDENT_ID}" >/dev/null || true
    fi
  fi
  rm -r "${TEST_TEMP_DIR}"
}
trap cleanup EXIT

json_field() {
  node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); let value=data; for (const key of process.argv[2].split('.')) value=value[key]; process.stdout.write(String(value));" "$1" "$2"
}

login() {
  local role="$1"
  local username="$2"
  local password="$3"
  curl -fsS \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"${username}\",\"password\":\"${password}\"}" \
    "${API_BASE}/api/auth/login" >"${TEST_TEMP_DIR}/${role}.json"
  json_field "${TEST_TEMP_DIR}/${role}.json" data.token >"${TEST_TEMP_DIR}/${role}.token"
}

curl -fsS "${API_BASE}/api/health" >"${TEST_TEMP_DIR}/health.json"
login admin admin 'Admin@123'
login teacher teacher01 'Teacher@123'
login student student01 'Student@123'

ADMIN_TOKEN="$(<"${TEST_TEMP_DIR}/admin.token")"
TEACHER_TOKEN="$(<"${TEST_TEMP_DIR}/teacher.token")"
STUDENT_TOKEN="$(<"${TEST_TEMP_DIR}/student.token")"

curl -fsS -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_BASE}/api/students?page=1&page_size=5&keyword=2000000" >"${TEST_TEMP_DIR}/students.json"

curl -fsS -X POST \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"${TEST_STUDENT_ID}\",\"name\":\"冒烟测试学生\",\"college\":\"计算机科学与技术学院\",\"phone\":\"13900000001\",\"sex\":\"男\",\"age\":20,\"address\":\"测试地址\",\"zipCode\":\"310000\"}" \
  "${API_BASE}/api/students" >"${TEST_TEMP_DIR}/student-create.json"
TEST_STUDENT_CREATED=1
curl -fsS -X PUT \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"冒烟测试学生-已更新\",\"college\":\"计算机科学与技术学院\",\"phone\":\"13900000002\",\"sex\":\"男\",\"age\":21,\"address\":\"更新后的地址\",\"zipCode\":\"310001\"}" \
  "${API_BASE}/api/students/${TEST_STUDENT_ID}" >"${TEST_TEMP_DIR}/student-update.json"

curl -fsS -X POST \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"courseId\":\"${TEST_COURSE_ID}\",\"name\":\"冒烟测试课程\",\"college\":\"计算机科学与技术学院\",\"teacher\":\"测试教师\",\"date\":\"大三下\",\"credits\":2,\"classroom\":\"测试教室\"}" \
  "${API_BASE}/api/courses" >"${TEST_TEMP_DIR}/course-create.json"
TEST_COURSE_CREATED=1
curl -fsS -X PUT \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"冒烟测试课程-已更新\",\"college\":\"计算机科学与技术学院\",\"teacher\":\"测试教师\",\"date\":\"大三下\",\"credits\":3,\"classroom\":\"更新教室\"}" \
  "${API_BASE}/api/courses/${TEST_COURSE_ID}" >"${TEST_TEMP_DIR}/course-update.json"

curl -fsS -X POST \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"studentId\":\"${TEST_STUDENT_ID}\",\"courseId\":\"${TEST_COURSE_ID}\",\"grade\":88}" \
  "${API_BASE}/api/enrollments" >"${TEST_TEMP_DIR}/enrollment-create.json"
curl -fsS -X PUT \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"grade":92.5}' \
  "${API_BASE}/api/enrollments/${TEST_STUDENT_ID}/${TEST_COURSE_ID}" \
  >"${TEST_TEMP_DIR}/enrollment-update.json"
curl -fsS -X DELETE -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_BASE}/api/enrollments/${TEST_STUDENT_ID}/${TEST_COURSE_ID}" \
  >"${TEST_TEMP_DIR}/enrollment-delete.json"
curl -fsS -X DELETE -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_BASE}/api/courses/${TEST_COURSE_ID}" >"${TEST_TEMP_DIR}/course-delete.json"
TEST_COURSE_CREATED=0
curl -fsS -X DELETE -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_BASE}/api/students/${TEST_STUDENT_ID}" >"${TEST_TEMP_DIR}/student-delete.json"
TEST_STUDENT_CREATED=0

FORBIDDEN_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" "${API_BASE}/api/students")"
[[ "${FORBIDDEN_STATUS}" == "403" ]]

curl -fsS -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  "${API_BASE}/api/teacher/courses" >"${TEST_TEMP_DIR}/teacher-courses.json"
TEACHER_COURSE_ID="$(json_field "${TEST_TEMP_DIR}/teacher-courses.json" data.0.courseId)"
curl -fsS -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  "${API_BASE}/api/teacher/courses/${TEACHER_COURSE_ID}/students?page=1&page_size=1" \
  >"${TEST_TEMP_DIR}/teacher-students.json"
TEACHER_STUDENT_ID="$(json_field "${TEST_TEMP_DIR}/teacher-students.json" data.0.studentId)"
ORIGINAL_GRADE="$(json_field "${TEST_TEMP_DIR}/teacher-students.json" data.0.grade)"
TEST_GRADE="$(node -e "const grade=Number(process.argv[1]); process.stdout.write(String(grade >= 99 ? 98.5 : grade + 0.5));" "${ORIGINAL_GRADE}")"
curl -fsS -X PUT \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"grade\":${TEST_GRADE}}" \
  "${API_BASE}/api/teacher/enrollments/${TEACHER_STUDENT_ID}/${TEACHER_COURSE_ID}" \
  >"${TEST_TEMP_DIR}/grade-update.json"

curl -fsS -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${API_BASE}/api/student/profile" >"${TEST_TEMP_DIR}/profile.json"
curl -fsS -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${API_BASE}/api/student/available-courses" >"${TEST_TEMP_DIR}/available.json"
SELECTED_COURSE_ID="$(json_field "${TEST_TEMP_DIR}/available.json" data.0.courseId)"
curl -fsS -X POST \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{}' \
  "${API_BASE}/api/student/enrollments/${SELECTED_COURSE_ID}" \
  >"${TEST_TEMP_DIR}/selection.json"
curl -fsS -X DELETE \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${API_BASE}/api/student/enrollments/${SELECTED_COURSE_ID}" \
  >"${TEST_TEMP_DIR}/drop.json"
SELECTED_COURSE_ID=""

curl -fsS -X PUT \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"grade\":${ORIGINAL_GRADE}}" \
  "${API_BASE}/api/teacher/enrollments/${TEACHER_STUDENT_ID}/${TEACHER_COURSE_ID}" \
  >"${TEST_TEMP_DIR}/grade-restore.json"
TEACHER_STUDENT_ID=""

echo "smoke test passed: admin CRUD, 3-role authorization, teacher grading, student select/drop"
