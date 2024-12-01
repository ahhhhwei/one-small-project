import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Table, Card, Button, Modal, Form, Input, Space, Select, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Student {
  key: string;
  studentId: string;
  name: string;
  college: string;
  phone: string;
  Sex: string;
  age: number;
  address: string;
  zipCode: string;
}

interface CourseGrade {
  Cname: string;
  Grade: number; 
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<CourseGrade[]>([]);

  // 使用 useRequest 获取学生数据
  const { data, loading, error } = useRequest(async () => {
    const response = await fetch('http://localhost:8080/api/students');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData.data.map((student: Student) => ({
      ...student,
      key: student.studentId,
    }));
  }, {
    onSuccess: (transformedData) => {
      setStudents(transformedData);
    },
    onError: (err) => {
      console.error('Error fetching students:', err);
      message.error('获取学生信息失败，请稍后再试！');
    },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const showModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      form.setFieldsValue(student);
    } else {
      setEditingStudent(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const showGrade = async (student: Student) => {
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/student_courses/${student.studentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setGrades(jsonData.data);
      setSelectedStudent(student);
      setGradeModalVisible(true);
    } catch (error) {
      message.error('获取学生成绩失败，请稍后再试');
      console.error('Error fetching grades:', error);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingStudent) {
        // 编辑现有学生
        setStudents(students.map(student =>
          student.key === editingStudent.key
            ? { ...values, key: student.key }
            : student
        ));
      } else {
        // 添加新学生
        const newStudent = {
          ...values,
          key: Date.now().toString(),
        };
        setStudents([...students, newStudent]);
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
      content: '确定要删除这条学生信息吗？',
      onOk: () => {
        setStudents(students.filter(student => student.key !== key));
      },
    });
  };

  const columns: ColumnsType<Student> = [
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
      sorter: (a, b) => a.studentId.localeCompare(b.studentId),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '学院',
      dataIndex: 'college',
      key: 'college',
      filters: Array.from(new Set(students.map(s => s.college))).map(college => ({
        text: college,
        value: college,
      })),
      onFilter: (value, record) => record.college === value,
    },
    {
      title: '性别',
      dataIndex: 'Sex',
      key: 'Sex',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '邮编',
      dataIndex: 'zipCode',
      key: 'zipCode',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showGrade(record)}
          >
            学生成绩
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

  const gradeColumns: ColumnsType<CourseGrade> = [
    {
      title: '课程名',
      dataIndex: 'Cname',
      key: 'Cname',
      sorter: (a, b) => a.Cname.localeCompare(b.Cname),
    },
    {
      title: '成绩',
      dataIndex: 'Grade',
      key: 'Grade',
      render: (text, record) => {
          return <span style={{ color: record.Grade < 60 ? 'red' : 'inherit' }}>{record.Grade}</span>;
      },
      sorter: (a, b) => a.Grade - b.Grade,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="学生信息管理" extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          添加学生
        </Button>
      }>
        <Table 
          columns={columns} 
          dataSource={students} 
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingStudent ? "编辑学生信息" : "添加学生"}
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
          initialValues={editingStudent || {}}
        >
          <Form.Item
            name="studentId"
            label="学号"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input
              placeholder="请输入学号"
              disabled={!!editingStudent} 
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input
              placeholder="请输入姓名"
              disabled={!!editingStudent}
             />
          </Form.Item>

          <Form.Item
            name="college"
            label="学院"
            rules={[{ required: true, message: '请输入学院' }]}
          >
            <Input placeholder="请输入学院" />
          </Form.Item>

          <Form.Item
            name="Sex"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select>
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="age"
            label="年龄"
            rules={[
              { required: false, message: '请输入年龄' },
              { type: 'number', min: 0, max: 120, message: '请输入有效年龄' }
            ]}
          >
            <Input type="number" placeholder="请输入年龄" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
            rules={[
              { required: true, message: '请输入电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>

          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input.TextArea placeholder="请输入地址" />
          </Form.Item>

          <Form.Item
            name="zipCode"
            label="邮编"
            rules={[
              { required: true, message: '请输入邮编' },
              { pattern: /^\d{6}$/, message: '请输入有效的邮编' }
            ]}
          >
            <Input placeholder="请输入邮编" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedStudent?.name} 的成绩`}
        open={gradeModalVisible}
        onOk={() => setGradeModalVisible(false)}
        onCancel={() => setGradeModalVisible(false)}
        width={720}
      >
        <Table
          columns={gradeColumns}
          dataSource={grades}
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default StudentManagement;