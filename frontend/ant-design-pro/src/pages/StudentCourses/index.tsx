import {
  dropCourse,
  getAvailableCourses,
  getMyCourses,
  getStudentProfile,
  selectCourse,
} from '@/services/academic';
import type { Course, StudentCourse } from '@/services/academic';
import { BookOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, message, Modal, Space, Table, Tabs, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest } from 'ahooks';
import React from 'react';

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试';

const StudentCourses: React.FC = () => {
  const profileRequest = useRequest(getStudentProfile, {
    onError: (error) => message.error(errorText(error)),
  });
  const selectedRequest = useRequest(getMyCourses, {
    onError: (error) => message.error(errorText(error)),
  });
  const availableRequest = useRequest(getAvailableCourses, {
    onError: (error) => message.error(errorText(error)),
  });

  const refreshCourses = () => {
    selectedRequest.refresh();
    availableRequest.refresh();
  };

  const chooseCourse = (course: Course) => {
    Modal.confirm({
      title: '确认选课',
      content: `确定选择“${course.name}（${course.courseId}）”吗？`,
      okText: '确认选课',
      cancelText: '取消',
      onOk: async () => {
        await selectCourse(course.courseId);
        message.success('选课成功');
        refreshCourses();
      },
    });
  };

  const removeCourse = (course: StudentCourse) => {
    Modal.confirm({
      title: '确认退课',
      content: `确定退出“${course.name}（${course.courseId}）”吗？`,
      okText: '确认退课',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await dropCourse(course.courseId);
        message.success('退课成功');
        refreshCourses();
      },
    });
  };

  const commonColumns = <T extends Course>(): ColumnsType<T> =>
    [
      { title: '课程号', dataIndex: 'courseId', width: 105 },
      { title: '课程名称', dataIndex: 'name', width: 230 },
      { title: '开课学院', dataIndex: 'college', width: 210 },
      { title: '教师', dataIndex: 'teacher', width: 110 },
      { title: '学期', dataIndex: 'date', width: 100 },
      { title: '学分', dataIndex: 'credits', width: 75 },
      { title: '教室', dataIndex: 'classroom', width: 140 },
    ] as ColumnsType<T>;

  const selectedColumns: ColumnsType<StudentCourse> = [
    ...commonColumns<StudentCourse>(),
    {
      title: '成绩',
      dataIndex: 'grade',
      width: 95,
      render: (grade: number) => (
        <Tag color={grade === 0 ? 'default' : grade < 60 ? 'red' : 'green'}>
          {grade === 0 ? '待评分' : grade}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 100,
      render: (_, course) => (
        <Button danger type="link" icon={<DeleteOutlined />} onClick={() => removeCourse(course)}>
          退课
        </Button>
      ),
    },
  ];

  const availableColumns: ColumnsType<Course> = [
    ...commonColumns<Course>(),
    {
      title: '已选人数',
      dataIndex: 'studentCount',
      width: 100,
      render: (count: number) => <Tag color="blue">{count} 人</Tag>,
    },
    {
      title: '操作',
      width: 100,
      render: (_, course) => (
        <Button type="link" icon={<PlusOutlined />} onClick={() => chooseCourse(course)}>
          选课
        </Button>
      ),
    },
  ];

  const profile = profileRequest.data;
  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Space><UserOutlined />我的学生信息</Space>}
        loading={profileRequest.loading}
        style={{ marginBottom: 20 }}
      >
        {profile && (
          <Descriptions column={{ xs: 1, sm: 2, lg: 4 }}>
            <Descriptions.Item label="学号">{profile.studentId}</Descriptions.Item>
            <Descriptions.Item label="姓名">{profile.name}</Descriptions.Item>
            <Descriptions.Item label="学院">{profile.college}</Descriptions.Item>
            <Descriptions.Item label="性别">{profile.sex}</Descriptions.Item>
            <Descriptions.Item label="电话">{profile.phone}</Descriptions.Item>
            <Descriptions.Item label="年龄">{profile.age}</Descriptions.Item>
            <Descriptions.Item label="地址">{profile.address}</Descriptions.Item>
            <Descriptions.Item label="邮编">{profile.zipCode}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title={<Space><BookOutlined />我的选课</Space>}>
        <Tabs
          items={[
            {
              key: 'selected',
              label: `已选课程（${selectedRequest.data?.data.length ?? 0}）`,
              children: (
                <Table<StudentCourse>
                  rowKey="courseId"
                  columns={selectedColumns}
                  dataSource={selectedRequest.data?.data ?? []}
                  loading={selectedRequest.loading}
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'available',
              label: `可选课程（${availableRequest.data?.data.length ?? 0}）`,
              children: (
                <Table<Course>
                  rowKey="courseId"
                  columns={availableColumns}
                  dataSource={availableRequest.data?.data ?? []}
                  loading={availableRequest.loading}
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default StudentCourses;
