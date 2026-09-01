import {
  getTeacherCourses,
  getTeacherCourseStudents,
  updateTeacherGrade,
} from '@/services/academic';
import type { Course, CourseStudent } from '@/services/academic';
import { EditOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Form, InputNumber, message, Modal, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest } from 'ahooks';
import React, { useState } from 'react';

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试';

const TeacherCourses: React.FC = () => {
  const [gradeForm] = Form.useForm<{ grade: number }>();
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [selectedStudent, setSelectedStudent] = useState<CourseStudent>();
  const [rosterOpen, setRosterOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, loading, refresh: refreshCourses } = useRequest(getTeacherCourses, {
    onError: (error) => message.error(errorText(error)),
  });

  const loadRoster = async (course: Course, targetPage: number, targetPageSize: number) => {
    setRosterLoading(true);
    try {
      const result = await getTeacherCourseStudents(course.courseId, targetPage, targetPageSize);
      setStudents(result.data);
      setPage(result.pagination.page);
      setPageSize(result.pagination.pageSize);
      setTotal(result.pagination.total);
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setRosterLoading(false);
    }
  };

  const openRoster = (course: Course) => {
    setSelectedCourse(course);
    setRosterOpen(true);
    setStudents([]);
    void loadRoster(course, 1, pageSize);
  };

  const openGrade = (student: CourseStudent) => {
    setSelectedStudent(student);
    gradeForm.setFieldsValue({ grade: student.grade });
    setGradeOpen(true);
  };

  const saveGrade = async () => {
    if (!selectedCourse || !selectedStudent) return;
    try {
      const values = await gradeForm.validateFields();
      setSaving(true);
      await updateTeacherGrade(selectedStudent.studentId, selectedCourse.courseId, values.grade);
      message.success('成绩已更新');
      setGradeOpen(false);
      await loadRoster(selectedCourse, page, pageSize);
      refreshCourses();
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const courseColumns: ColumnsType<Course> = [
    { title: '课程号', dataIndex: 'courseId', width: 110 },
    { title: '课程名称', dataIndex: 'name' },
    { title: '开课学院', dataIndex: 'college', width: 220 },
    { title: '学期', dataIndex: 'date', width: 100 },
    { title: '学分', dataIndex: 'credits', width: 80 },
    { title: '教室', dataIndex: 'classroom', width: 150 },
    {
      title: '选课人数',
      dataIndex: 'studentCount',
      width: 110,
      render: (count: number) => <Tag color="blue">{count} 人</Tag>,
    },
    {
      title: '操作',
      width: 140,
      render: (_, course) => (
        <Button type="link" icon={<TeamOutlined />} onClick={() => openRoster(course)}>
          名单与成绩
        </Button>
      ),
    },
  ];

  const studentColumns: ColumnsType<CourseStudent> = [
    { title: '学号', dataIndex: 'studentId', width: 150 },
    { title: '姓名', dataIndex: 'studentName' },
    {
      title: '成绩',
      dataIndex: 'grade',
      width: 100,
      render: (grade: number) => (
        <Tag color={grade === 0 ? 'default' : grade < 60 ? 'red' : 'green'}>
          {grade === 0 ? '待评分' : grade}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_, student) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openGrade(student)}>
          录入成绩
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="我的授课课程" extra={<Tag color="blue">教师工作台</Tag>}>
        <Table<Course>
          rowKey="courseId"
          columns={courseColumns}
          dataSource={data?.data ?? []}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showTotal: (count) => `共 ${count} 门课程` }}
        />
      </Card>

      <Modal
        title={`${selectedCourse?.name ?? ''} - 学生名单与成绩`}
        open={rosterOpen}
        onCancel={() => setRosterOpen(false)}
        footer={<Button onClick={() => setRosterOpen(false)}>关闭</Button>}
        width={760}
      >
        <Table<CourseStudent>
          rowKey="studentId"
          columns={studentColumns}
          dataSource={students}
          loading={rosterLoading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (count) => `共 ${count} 名学生`,
            onChange: (nextPage, nextPageSize) => {
              if (selectedCourse) void loadRoster(selectedCourse, nextPage, nextPageSize);
            },
          }}
        />
      </Modal>

      <Modal
        title={`录入成绩：${selectedStudent?.studentName ?? ''}`}
        open={gradeOpen}
        onCancel={() => setGradeOpen(false)}
        onOk={() => void saveGrade()}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={gradeForm} layout="vertical">
          <Form.Item
            name="grade"
            label="成绩"
            rules={[{ required: true, message: '请输入成绩' }]}
          >
            <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherCourses;
