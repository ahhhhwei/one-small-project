import { AvatarDropdown, AvatarName, Footer } from '@/components';
import { clearToken, getCurrentUser, getToken } from '@/services/academic';
import type { AuthUser } from '@/services/academic';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import defaultSettings from '../config/defaultSettings';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: AuthUser;
  fetchUserInfo?: () => Promise<AuthUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    if (!getToken()) return undefined;
    try {
      return await getCurrentUser();
    } catch {
      clearToken();
      return undefined;
    }
  };

  const isLoginPage = history.location.pathname === '/user/login';
  const currentUser = await fetchUserInfo();
  if (!isLoginPage && !currentUser) {
    history.replace('/user/login');
  }

  return {
    fetchUserInfo,
    currentUser,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState }) => ({
  actionsRender: () => [],
  avatarProps: {
    title: <AvatarName />,
    render: (_, avatarChildren) => <AvatarDropdown>{avatarChildren}</AvatarDropdown>,
  },
  waterMarkProps: {
    content: initialState?.currentUser?.name,
  },
  footerRender: () => <Footer />,
  menuHeaderRender: undefined,
  onPageChange: () => {
    if (!initialState?.currentUser && history.location.pathname !== '/user/login') {
      history.replace('/user/login');
    }
  },
  ...initialState?.settings,
});
