import { BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest } from 'ahooks';
import React, { useState } from 'react';
import {
  createEnrollment,
  createStudent,
  deleteEnrollment,
  deleteStudent,
  getCourses,
  getStudentCourses,
  getStudents,
  updateEnrollment,
  updateStudent,
} from '@/services/academic';
import type { Course, Student, StudentCourse } from '@/services/academic';

interface EnrollmentFormValues {
  courseId: string;
  grade: number;
}

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试';

const StudentManagement: React.FC = () => {
  const [studentForm] = Form.useForm<Student>();
  const [enrollmentForm] = Form.useForm<EnrollmentFormValues>();

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student>();
  const [savingStudent, setSavingStudent] = useState(false);

  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student>();
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [gradeLoading, setGradeLoading] = useState(false);

  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<StudentCourse>();
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const {
    data: studentResult,
    loading,
    refresh,
  } = useRequest(() => getStudents({ page: currentPage, pageSize, keyword }), {
    refreshDeps: [currentPage, pageSize, keyword],
    onError: (error) => message.error(errorText(error)),
  });

  const students = studentResult?.data ?? [];
  const total = studentResult?.pagination.total ?? 0;

  const openStudentModal = (student?: Student) => {
    setEditingStudent(student);
    if (student) {
      studentForm.setFieldsValue(student);
    } else {
      studentForm.resetFields();
    }
    setStudentModalOpen(true);
  };

  const saveStudent = async () => {
    try {
      const values = await studentForm.validateFields();
      setSavingStudent(true);

      if (editingStudent) {
        await updateStudent({ ...values, studentId: editingStudent.studentId });
        message.success('学生信息已更新');
      } else {
        await createStudent(values);
        message.success('学生已新增');
      }

      setStudentModalOpen(false);
      studentForm.resetFields();

      if (!editingStudent && currentPage !== 1) {
        setCurrentPage(1);
      } else {
        refresh();
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSavingStudent(false);
    }
  };

  const confirmDeleteStudent = (student: Student) => {
    Modal.confirm({
      title: '确认删除学生',
      content: `删除“${student.name}（${student.studentId}）”后，其全部选课和成绩也会被删除。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteStudent(student.studentId);
          message.success('学生已删除');

          if (students.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            refresh();
          }
        } catch (error) {
          message.error(errorText(error));
          throw error;
        }
      },
    });
  };

  const loadStudentCourses = async (studentId: string) => {
    setGradeLoading(true);
    try {
      const result = await getStudentCourses(studentId);
      setStudentCourses(result.data);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setGradeLoading(false);
    }
  };

  const openGradeModal = async (student: Student) => {
    setSelectedStudent(student);
    setStudentCourses([]);
    setGradeModalOpen(true);
    setGradeLoading(true);

    try {
      const [courseResult, gradeResult] = await Promise.all([
        getCourses(),
        getStudentCourses(student.studentId),
      ]);
      setAllCourses(courseResult.data);
      setStudentCourses(gradeResult.data);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setGradeLoading(false);
    }
  };

  const openEnrollmentModal = (enrollment?: StudentCourse) => {
    setEditingEnrollment(enrollment);
    if (enrollment) {
      enrollmentForm.setFieldsValue({
        courseId: enrollment.courseId,
        grade: enrollment.grade,
      });
    } else {
      enrollmentForm.resetFields();
    }
    setEnrollmentModalOpen(true);
  };

  const saveEnrollment = async () => {
    if (!selectedStudent) return;

    try {
      const values = await enrollmentForm.validateFields();
      setSavingEnrollment(true);

      if (editingEnrollment) {
        await updateEnrollment(selectedStudent.studentId, editingEnrollment.courseId, values.grade);
        message.success('成绩已更新');
      } else {
        await createEnrollment({
          studentId: selectedStudent.studentId,
          courseId: values.courseId,
          grade: values.grade,
        });
        message.success('选课记录已新增');
      }

      setEnrollmentModalOpen(false);
      enrollmentForm.resetFields();
      await loadStudentCourses(selectedStudent.studentId);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSavingEnrollment(false);
    }
  };

  const confirmDeleteEnrollment = (course: StudentCourse) => {
    if (!selectedStudent) return;

    Modal.confirm({
      title: '确认退课',
      content: `确定删除“${course.courseName}”及对应成绩吗？`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteEnrollment(selectedStudent.studentId, course.courseId);
          message.success('选课记录已删除');
          await loadStudentCourses(selectedStudent.studentId);
        } catch (error) {
          message.error(errorText(error));
          throw error;
        }
      },
    });
  };

  const studentColumns: ColumnsType<Student> = [
    { title: '学号', dataIndex: 'studentId', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '学院', dataIndex: 'college', width: 190 },
    { title: '性别', dataIndex: 'sex', width: 70 },
    { title: '年龄', dataIndex: 'age', width: 70 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', width: 180 },
    { title: '邮编', dataIndex: 'zipCode', width: 90 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 255,
      render: (_, student) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => openStudentModal(student)}>
            编辑
          </Button>
          <Button type="link" icon={<BookOutlined />} onClick={() => void openGradeModal(student)}>
            成绩
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => confirmDeleteStudent(student)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const gradeColumns: ColumnsType<StudentCourse> = [
    { title: '课程号', dataIndex: 'courseId', width: 100 },
    { title: '课程名', dataIndex: 'courseName' },
    {
      title: '成绩',
      dataIndex: 'grade',
      width: 90,
      render: (grade: number) => <Tag color={grade < 60 ? 'red' : 'green'}>{grade}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, course) => (
        <Space size={4}>
          <Button type="link" onClick={() => openEnrollmentModal(course)}>
            改分
          </Button>
          <Button type="link" danger onClick={() => confirmDeleteEnrollment(course)}>
            退课
          </Button>
        </Space>
      ),
    },
  ];

  const selectedCourseIds = new Set(studentCourses.map((course) => course.courseId));
  const availableCourses = allCourses.filter((course) => !selectedCourseIds.has(course.courseId));

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="学生信息管理"
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="按学号、姓名、学院、电话或地址搜索"
              style={{ width: 330 }}
              onSearch={(value) => {
                setCurrentPage(1);
                setKeyword(value.trim());
              }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openStudentModal()}>
              添加学生
            </Button>
          </Space>
        }
      >
        <Table<Student>
          rowKey="studentId"
          columns={studentColumns}
          dataSource={students}
          loading={loading}
          scroll={{ x: 1250 }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `共 ${count} 名学生`,
            onChange: (page, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
                setCurrentPage(1);
              } else {
                setCurrentPage(page);
              }
            },
          }}
        />
      </Card>

      <Modal
        title={editingStudent ? '编辑学生信息' : '添加学生'}
        open={studentModalOpen}
        onOk={() => void saveStudent()}
        confirmLoading={savingStudent}
        okText="保存"
        cancelText="取消"
        onCancel={() => setStudentModalOpen(false)}
        width={720}
      >
        <Form form={studentForm} layout="vertical">
          <Form.Item
            name="studentId"
            label="学号"
            rules={[
              { required: true, message: '请输入学号' },
              { pattern: /^\d+$/, message: '学号只能包含数字' },
            ]}
          >
            <Input disabled={Boolean(editingStudent)} placeholder="请输入学号" maxLength={10} />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="college"
            label="学院"
            rules={[{ required: true, message: '请输入学院' }]}
          >
            <Input placeholder="请输入学院" maxLength={100} />
          </Form.Item>
          <Form.Item name="sex" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
            <Select
              placeholder="请选择性别"
              options={[
                { label: '男', value: '男' },
                { label: '女', value: '女' },
              ]}
            />
          </Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}>
            <InputNumber min={15} max={100} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="电话"
            rules={[
              { required: true, message: '请输入电话' },
              { pattern: /^1\d{10}$/, message: '请输入有效的 11 位手机号' },
            ]}
          >
            <Input placeholder="请输入电话" maxLength={11} />
          </Form.Item>
          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input.TextArea placeholder="请输入地址" maxLength={200} showCount />
          </Form.Item>
          <Form.Item
            name="zipCode"
            label="邮编"
            rules={[
              { required: true, message: '请输入邮编' },
              { pattern: /^\d{6}$/, message: '邮编必须是 6 位数字' },
            ]}
          >
            <Input placeholder="请输入邮编" maxLength={6} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedStudent?.name ?? ''}（${selectedStudent?.studentId ?? ''}）的选课与成绩`}
        open={gradeModalOpen}
        onCancel={() => setGradeModalOpen(false)}
        width={800}
        footer={
          <Space>
            <Button onClick={() => setGradeModalOpen(false)}>关闭</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={availableCourses.length === 0}
              onClick={() => openEnrollmentModal()}
            >
              添加选课
            </Button>
          </Space>
        }
      >
        <Table<StudentCourse>
          rowKey="courseId"
          columns={gradeColumns}
          dataSource={studentCourses}
          loading={gradeLoading}
          pagination={false}
          locale={{ emptyText: '暂无选课记录' }}
        />
      </Modal>

      <Modal
        title={editingEnrollment ? '修改成绩' : '添加选课'}
        open={enrollmentModalOpen}
        onOk={() => void saveEnrollment()}
        confirmLoading={savingEnrollment}
        okText="保存"
        cancelText="取消"
        onCancel={() => setEnrollmentModalOpen(false)}
      >
        <Form form={enrollmentForm} layout="vertical">
          <Form.Item
            name="courseId"
            label="课程"
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select
              showSearch
              disabled={Boolean(editingEnrollment)}
              optionFilterProp="label"
              placeholder="请选择课程"
              options={(editingEnrollment ? allCourses : availableCourses).map((course) => ({
                label: `${course.courseId} - ${course.name}`,
                value: course.courseId,
              }))}
            />
          </Form.Item>
          <Form.Item name="grade" label="成绩" rules={[{ required: true, message: '请输入成绩' }]}>
            <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentManagement;
