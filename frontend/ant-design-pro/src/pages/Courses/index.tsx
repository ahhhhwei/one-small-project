import { DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Modal, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest } from 'ahooks';
import React, { useMemo, useState } from 'react';
import {
  createCourse,
  createEnrollment,
  deleteCourse,
  deleteEnrollment,
  getCourses,
  getCourseStudents,
  updateCourse,
  updateEnrollment,
} from '@/services/academic';
import type { Course, CourseStudent } from '@/services/academic';

interface RosterFormValues {
  studentId: string;
  grade: number;
}

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试';

const CourseManagement: React.FC = () => {
  const [courseForm] = Form.useForm<Course>();
  const [rosterForm] = Form.useForm<RosterFormValues>();

  const [keyword, setKeyword] = useState('');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course>();
  const [savingCourse, setSavingCourse] = useState(false);

  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(20);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentLoading, setStudentLoading] = useState(false);

  const [rosterEditModalOpen, setRosterEditModalOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<CourseStudent>();
  const [savingRoster, setSavingRoster] = useState(false);

  const {
    data: courseResult,
    loading,
    refresh,
  } = useRequest(getCourses, {
    onError: (error) => message.error(errorText(error)),
  });

  const courses = courseResult?.data ?? [];
  const displayedCourses = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return courses;

    return courses.filter((course) =>
      [course.courseId, course.name, course.college, course.teacher, course.classroom].some(
        (value) => value.toLowerCase().includes(normalizedKeyword),
      ),
    );
  }, [courses, keyword]);

  const openCourseModal = (course?: Course) => {
    setEditingCourse(course);
    if (course) {
      courseForm.setFieldsValue(course);
    } else {
      courseForm.resetFields();
    }
    setCourseModalOpen(true);
  };

  const saveCourse = async () => {
    try {
      const values = await courseForm.validateFields();
      setSavingCourse(true);

      if (editingCourse) {
        await updateCourse({
          ...values,
          courseId: editingCourse.courseId,
          studentCount: editingCourse.studentCount,
        });
        message.success('课程信息已更新');
      } else {
        await createCourse({ ...values, studentCount: 0 });
        message.success('课程已新增');
      }

      setCourseModalOpen(false);
      courseForm.resetFields();
      refresh();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSavingCourse(false);
    }
  };

  const confirmDeleteCourse = (course: Course) => {
    Modal.confirm({
      title: '确认删除课程',
      content: `删除“${course.name}（${course.courseId}）”后，${course.studentCount} 条相关选课记录也会被删除。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCourse(course.courseId);
          message.success('课程已删除');
          refresh();
        } catch (error) {
          message.error(errorText(error));
          throw error;
        }
      },
    });
  };

  const loadCourseStudents = async (course: Course, page: number, pageSize: number) => {
    setStudentLoading(true);

    try {
      const result = await getCourseStudents(course.courseId, page, pageSize);
      setStudents(result.data);
      setStudentPage(result.pagination.page);
      setStudentPageSize(result.pagination.pageSize);
      setStudentTotal(result.pagination.total);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setStudentLoading(false);
    }
  };

  const openRosterModal = (course: Course) => {
    setSelectedCourse(course);
    setStudents([]);
    setStudentPage(1);
    setRosterModalOpen(true);
    void loadCourseStudents(course, 1, studentPageSize);
  };

  const openRosterEditModal = (student?: CourseStudent) => {
    setEditingRoster(student);
    if (student) {
      rosterForm.setFieldsValue({
        studentId: student.studentId,
        grade: student.grade,
      });
    } else {
      rosterForm.resetFields();
    }
    setRosterEditModalOpen(true);
  };

  const saveRoster = async () => {
    if (!selectedCourse) return;

    try {
      const values = await rosterForm.validateFields();
      setSavingRoster(true);

      if (editingRoster) {
        await updateEnrollment(editingRoster.studentId, selectedCourse.courseId, values.grade);
        message.success('成绩已更新');
      } else {
        await createEnrollment({
          studentId: values.studentId,
          courseId: selectedCourse.courseId,
          grade: values.grade,
        });
        message.success('学生已加入课程');
      }

      setRosterEditModalOpen(false);
      rosterForm.resetFields();
      await loadCourseStudents(selectedCourse, studentPage, studentPageSize);
      refresh();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setSavingRoster(false);
    }
  };

  const confirmDeleteRoster = (student: CourseStudent) => {
    if (!selectedCourse) return;

    Modal.confirm({
      title: '确认移出课程',
      content: `确定将“${student.studentName}（${student.studentId}）”移出本课程吗？`,
      okText: '确认移出',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteEnrollment(student.studentId, selectedCourse.courseId);
          message.success('选课记录已删除');

          const targetPage =
            students.length === 1 && studentPage > 1 ? studentPage - 1 : studentPage;
          await loadCourseStudents(selectedCourse, targetPage, studentPageSize);
          refresh();
        } catch (error) {
          message.error(errorText(error));
          throw error;
        }
      },
    });
  };

  const courseColumns: ColumnsType<Course> = [
    { title: '课程号', dataIndex: 'courseId', width: 100 },
    { title: '课程名', dataIndex: 'name', width: 220 },
    { title: '开课学院', dataIndex: 'college', width: 190 },
    { title: '任课教师', dataIndex: 'teacher', width: 110 },
    {
      title: '选课人数',
      dataIndex: 'studentCount',
      width: 100,
      render: (count: number) => <Tag color="blue">{count} 人</Tag>,
      sorter: (left, right) => left.studentCount - right.studentCount,
    },
    { title: '学分', dataIndex: 'credits', width: 75 },
    { title: '上课教室', dataIndex: 'classroom', width: 140 },
    { title: '开课学期', dataIndex: 'date', width: 100 },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 280,
      render: (_, course) => (
        <Space size={4}>
          <Button type="link" icon={<TeamOutlined />} onClick={() => openRosterModal(course)}>
            学生名单
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openCourseModal(course)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => confirmDeleteCourse(course)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const studentColumns: ColumnsType<CourseStudent> = [
    { title: '学号', dataIndex: 'studentId', width: 130 },
    { title: '姓名', dataIndex: 'studentName' },
    {
      title: '成绩',
      dataIndex: 'grade',
      width: 100,
      render: (grade: number) => <Tag color={grade < 60 ? 'red' : 'green'}>{grade}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, student) => (
        <Space size={4}>
          <Button type="link" onClick={() => openRosterEditModal(student)}>
            改分
          </Button>
          <Button type="link" danger onClick={() => confirmDeleteRoster(student)}>
            移出
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="课程信息管理"
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="搜索课程号、课程名、学院或教师"
              style={{ width: 320 }}
              onSearch={(value) => setKeyword(value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCourseModal()}>
              添加课程
            </Button>
          </Space>
        }
      >
        <Table<Course>
          rowKey="courseId"
          columns={courseColumns}
          dataSource={displayedCourses}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (count) => `共 ${count} 门课程`,
          }}
        />
      </Card>

      <Modal
        title={editingCourse ? '编辑课程信息' : '添加课程'}
        open={courseModalOpen}
        onOk={() => void saveCourse()}
        confirmLoading={savingCourse}
        okText="保存"
        cancelText="取消"
        onCancel={() => setCourseModalOpen(false)}
        width={720}
      >
        <Form form={courseForm} layout="vertical">
          <Form.Item
            name="courseId"
            label="课程号"
            rules={[
              { required: true, message: '请输入课程号' },
              { pattern: /^\d+$/, message: '课程号只能包含数字' },
            ]}
          >
            <Input disabled={Boolean(editingCourse)} placeholder="请输入课程号" maxLength={10} />
          </Form.Item>
          <Form.Item
            name="name"
            label="课程名"
            rules={[{ required: true, message: '请输入课程名' }]}
          >
            <Input placeholder="请输入课程名" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="college"
            label="开课学院"
            rules={[{ required: true, message: '请输入开课学院' }]}
          >
            <Input placeholder="请输入开课学院" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="teacher"
            label="任课教师"
            rules={[{ required: true, message: '请输入任课教师' }]}
          >
            <Input placeholder="请输入任课教师" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="date"
            label="开课学期"
            rules={[{ required: true, message: '请输入开课学期' }]}
          >
            <Input placeholder="例如：大二下" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="credits"
            label="学分"
            rules={[{ required: true, message: '请输入学分' }]}
          >
            <InputNumber min={0} max={10} step={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="classroom"
            label="上课教室"
            rules={[{ required: true, message: '请输入上课教室' }]}
          >
            <Input placeholder="请输入上课教室" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedCourse?.name ?? ''} - 学生名单`}
        open={rosterModalOpen}
        onCancel={() => setRosterModalOpen(false)}
        width={800}
        footer={
          <Space>
            <Button onClick={() => setRosterModalOpen(false)}>关闭</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openRosterEditModal()}>
              添加学生
            </Button>
          </Space>
        }
      >
        <Table<CourseStudent>
          rowKey="studentId"
          columns={studentColumns}
          dataSource={students}
          loading={studentLoading}
          pagination={{
            current: studentPage,
            pageSize: studentPageSize,
            total: studentTotal,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `共 ${count} 名学生`,
            onChange: (page, nextPageSize) => {
              if (!selectedCourse) return;
              const targetPage = nextPageSize === studentPageSize ? page : 1;
              void loadCourseStudents(selectedCourse, targetPage, nextPageSize);
            },
          }}
        />
      </Modal>

      <Modal
        title={editingRoster ? '修改成绩' : '添加学生到课程'}
        open={rosterEditModalOpen}
        onOk={() => void saveRoster()}
        confirmLoading={savingRoster}
        okText="保存"
        cancelText="取消"
        onCancel={() => setRosterEditModalOpen(false)}
      >
        <Form form={rosterForm} layout="vertical">
          <Form.Item
            name="studentId"
            label="学号"
            rules={[
              { required: true, message: '请输入学号' },
              { pattern: /^\d+$/, message: '学号只能包含数字' },
            ]}
          >
            <Input disabled={Boolean(editingRoster)} placeholder="请输入已有学生的学号" />
          </Form.Item>
          <Form.Item name="grade" label="成绩" rules={[{ required: true, message: '请输入成绩' }]}>
            <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseManagement;
