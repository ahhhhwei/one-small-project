import { logout } from '@/services/academic';
import { LogoutOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Spin } from 'antd';
import type { MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { flushSync } from 'react-dom';
import HeaderDropdown from '../HeaderDropdown';

export type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

export const AvatarName = () => {
  const { initialState } = useModel('@@initialState');
  return <span className="anticon">{initialState?.currentUser?.name}</span>;
};

const useStyles = createStyles(({ token }) => ({
  action: {
    display: 'flex',
    height: '48px',
    marginLeft: 'auto',
    alignItems: 'center',
    padding: '0 8px',
    cursor: 'pointer',
    borderRadius: token.borderRadius,
    '&:hover': { backgroundColor: token.colorBgTextHover },
  },
}));

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ children }) => {
  const { styles } = useStyles();
  const { initialState, setInitialState } = useModel('@@initialState');

  const onMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key !== 'logout') return;
    await logout();
    flushSync(() => setInitialState((state) => ({ ...state, currentUser: undefined })));
    history.replace('/user/login');
  };

  if (!initialState?.currentUser) {
    return (
      <span className={styles.action}>
        <Spin size="small" />
      </span>
    );
  }

  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
      }}
    >
      {children}
    </HeaderDropdown>
  );
};
