import type { UserRole } from '@/services/academic';
import { history, useModel } from '@umijs/max';
import { Spin } from 'antd';
import React, { useEffect } from 'react';

const homeByRole: Record<UserRole, string> = {
  admin: '/admin/students',
  teacher: '/teacher/courses',
  student: '/student/courses',
};

const RoleRedirect: React.FC = () => {
  const { initialState } = useModel('@@initialState');

  useEffect(() => {
    const role = initialState?.currentUser?.role;
    history.replace(role ? homeByRole[role] : '/user/login');
  }, [initialState?.currentUser?.role]);

  return <Spin fullscreen tip="正在进入工作台" />;
};

export default RoleRedirect;
