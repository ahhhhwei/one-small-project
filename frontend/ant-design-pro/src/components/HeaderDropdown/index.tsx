import { Dropdown } from 'antd';
import { createStyles } from 'antd-style';
import type { DropDownProps } from 'antd/es/dropdown';
import React from 'react';

const useStyles = createStyles(({ token }) => {
  return {
    dropdown: {
      [`@media screen and (max-width: ${token.screenXS}px)`]: {
        width: '100%',
      },
    },
  };
});

export type HeaderDropdownProps = {
  overlayClassName?: string;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter';
} & Omit<DropDownProps, 'overlay'>;

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({ overlayClassName: cls, ...restProps }) => {
  const { styles } = useStyles();
  const overlayClassName = [styles.dropdown, cls].filter(Boolean).join(' ');
  return <Dropdown overlayClassName={overlayClassName} {...restProps} />;
};

export default HeaderDropdown;
