import { login } from '@/services/academic';
import type { AuthUser, UserRole } from '@/services/academic';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, useModel } from '@umijs/max';
import { Alert, message, Space, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const homeByRole: Record<UserRole, string> = {
  admin: '/admin/students',
  teacher: '/teacher/courses',
  student: '/student/courses',
};

const useStyles = createStyles(({ token }) => ({
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, #f7f9fc 55%, #eef4ff 100%)`,
  },
  panel: {
    width: 460,
    maxWidth: '100%',
    padding: '16px 28px 24px',
    background: token.colorBgContainer,
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(25, 55, 100, 0.12)',
  },
  accounts: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    background: token.colorFillAlter,
    lineHeight: 1.9,
  },
}));

const LoginPage: React.FC = () => {
  const { styles } = useStyles();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [error, setError] = useState('');

  useEffect(() => {
    const user = initialState?.currentUser as AuthUser | undefined;
    if (user?.role) history.replace(homeByRole[user.role]);
  }, [initialState?.currentUser]);

  const submit = async (values: { username: string; password: string }) => {
    setError('');
    try {
      const user = await login(values.username, values.password);
      flushSync(() => setInitialState((state) => ({ ...state, currentUser: user })));
      message.success(`欢迎回来，${user.name}`);
      history.replace(homeByRole[user.role]);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '登录失败，请稍后重试');
      return false;
    }
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>登录 - 学生选课管理系统</title>
      </Helmet>
      <div className={styles.panel}>
        <LoginForm
          title="学生选课管理系统"
          subTitle="根据账号身份进入对应工作台"
          initialValues={{ username: 'admin', password: 'Admin@123' }}
          onFinish={submit}
          submitter={{ searchConfig: { submitText: '登录' }, submitButtonProps: { size: 'large' } }}
        >
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} />}
          <ProFormText
            name="username"
            fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
            placeholder="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            placeholder="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
        </LoginForm>

        <div className={styles.accounts}>
          <Typography.Text strong>演示账号</Typography.Text>
          <br />
          <Space><Tag color="red">管理员</Tag><span>admin / Admin@123</span></Space>
          <br />
          <Space><Tag color="blue">教师</Tag><span>teacher01 / Teacher@123</span></Space>
          <br />
          <Space><Tag color="green">学生</Tag><span>student01 / Student@123</span></Space>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
