import React, { useState, useEffect } from 'react';
import { useRequest } from 'ahooks';
import { Table, Card, Button, Modal, Form, Input, Space, Select, Tag, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Course {
  key: string;
  courseId: string;
  name: string;
  college: string;
  teacher: string;
  students: string[];
  date: string;
  credits: number;
  classroom: string;
}

interface Student {
  Sno: string;
  Sname: string;
  Grade: number;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  // 使用 useRequest 获取课程数据
  const { data, loading, error } = useRequest(async () => {
    const response = await fetch('http://localhost:8080/api/courses');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    console.log('@', jsonData)
    console.log('Raw data from server:', jsonData); 
    return jsonData.data.map((course: Course) => ({
      ...course,
      key: course.courseId,
    }));
  }, {
    onSuccess: (transformedData) => {
      setCourses(transformedData);
    },
    onError: (err) => {
      console.error('Error fetching courses:', err);
    },
  });

  // 每次页面打开时获取所有课程的学生信息
  useEffect(() => {
    const fetchAllStudentCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(courses.map(async (course) => {
        try {
          const response = await fetch(`http://localhost:8080/api/course_students/${course.courseId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          const studentCount = jsonData.data.length;
          counts[course.courseId] = studentCount;
        } catch (error) {
          console.error(`Error fetching students for course ${course.courseId}:`, error);
          counts[course.courseId] = 0; // 如果获取失败，默认为0
        }
      }));
      setStudentCounts(counts);
    };

    if (courses.length > 0) {
      fetchAllStudentCounts();
    }
  }, [courses]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const showModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      form.setFieldsValue(course);
    } else {
      setEditingCourse(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCourse) {
        // 编辑现有课程
        setCourses(courses.map(course =>
          course.key === editingCourse.key
            ? { ...values, key: course.key }
            : course
        ));
      } else {
        // 添加新课程
        const newCourse = {
          ...values,
          key: Date.now().toString(),
        };
        setCourses([...courses, newCourse]);
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这门课程吗？',
      onOk: () => {
        setCourses(courses.filter(course => course.key !== key));
      },
    });
  };

  const showStudents = async (course: Course) => {
    try {
      const response = await fetch(`http://localhost:8080/api/course_students/${course.courseId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      const fetchedStudents = jsonData.data;

      setStudents(fetchedStudents);
      setSelectedCourse(course);
      setStudentModalVisible(true);
    } catch (error) {
      message.error('获取学生信息失败，请稍后再试');
      console.error('Error fetching students:', error);
    }
  };

  const studentColumns: ColumnsType<Student> = [
    {
      title: '学号',
      dataIndex: 'Sno',
      key: 'Sno',
      sorter: (a, b) => a.Sno.localeCompare(b.Sno),
    },
    {
      title: '姓名',
      dataIndex: 'Sname',
      key: 'Sname',
      sorter: (a, b) => a.Sname.localeCompare(b.Sname),
    },
    {
      title: '成绩',
      dataIndex: 'Grade',
      key: 'Grade',
      sorter: (a, b) => a.Grade - b.Grade,
    },
  ];

  const columns: ColumnsType<Course> = [
    {
      title: '课程号',
      dataIndex: 'courseId',
      key: 'courseId',
      sorter: (a, b) => a.courseId.localeCompare(b.courseId),
    },
    {
      title: '课程名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '开课学院',
      dataIndex: 'college',
      key: 'college',
      filters: Array.from(new Set(courses.map(c => c.college))).map(college => ({
        text: college,
        value: college,
      })),
      onFilter: (value, record) => record.college === value,
    },
    {
      title: '任课教师',
      dataIndex: 'teacher',
      key: 'teacher',
    },
    {
      title: '选课人数',
      key: 'studentCount',
      render: (_, record) => (
        <Tag color="blue">
          {studentCounts[record.courseId]} 人
        </Tag>
      ),
      sorter: (a, b) => studentCounts[a.courseId] - studentCounts[b.courseId],
    },
    {
      title: '学分',
      dataIndex: 'credits',
      key: 'credits',
      sorter: (a, b) => a.credits - b.credits,
    },
    {
      title: '上课教室',
      dataIndex: 'classroom',
      key: 'classroom',
    },
    {
      title: '开课学期',
      dataIndex: 'date',
      key: 'date',
      filters: Array.from(new Set(courses.map(c => c.date))).map(date => ({
        text: date,
        value: date,
      })),
      onFilter: (value, record) => record.date === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<TeamOutlined />}
            onClick={() => showStudents(record)}
          >
            查看学生
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加课程
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={courses}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingCourse ? "编辑课程信息" : "添加课程"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingCourse || {}}
        >
          <Form.Item
            name="courseId"
            label="课程号"
            rules={[
              { required: true, message: '请输入课程号' },
              { pattern: /^[A-Za-z0-9]+$/, message: '课程号只能包含字母和数字' }
            ]}
          >
            <Input
              placeholder="请输入课程号"
              disabled={!!editingCourse} // 禁用输入框，如果是在编辑现有课程
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="课程名"
            rules={[{ required: true, message: '请输入课程名' }]}
          >
            <Input placeholder="请输入课程名" />
          </Form.Item>

          <Form.Item
            name="college"
            label="开课学院"
            rules={[{ required: true, message: '请输入开课学院' }]}
          >
            <Input placeholder="请输入开课学院" />
          </Form.Item>

          <Form.Item
            name="teacher"
            label="任课教师"
            rules={[{ required: true, message: '请输入任课教师' }]}
          >
            <Input placeholder="请输入任课教师" />
          </Form.Item>

          <Form.Item
            name="credits"
            label="学分"
            rules={[
              { required: true, message: '请输入学分' },
              { type: 'number', min: 0.5, max: 10, message: '学分必须在0.5到10之间' }
            ]}
          >
            <InputNumber
              min={0.5}
              max={10}
              step={0.5}
              placeholder="请输入学分"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="classroom"
            label="上课教室"
            rules={[{ required: true, message: '请输入上课教室' }]}
          >
            <Input placeholder="请输入上课教室" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedCourse?.name} - 学生名单`}
        open={studentModalVisible}
        onOk={() => setStudentModalVisible(false)}
        onCancel={() => setStudentModalVisible(false)}
        width={720}
      >
        <Table
          columns={studentColumns}
          dataSource={students}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default CourseManagement;