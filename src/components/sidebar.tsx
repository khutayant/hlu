import {
  HomeOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { publicUrl, VERSION } from '../config';
import { useAuth } from '../providers/auth.provider';
import { useI18n } from '../providers/i18n.provider';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS: {
  labelKey: string;
  path: string;
  icon: ReactNode;
}[] = [
  {
    labelKey: 'nav.mainPage',
    path: '/',
    icon: <HomeOutlined />,
  },
];

const BRAND_LOGO = publicUrl(
  'assets/icons/hlu-logo/android-chrome-192x192.png',
);

const drawerWidth = 350;
const collapsedWidth = 72;

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
};

function BrandSection({
  collapsed,
  compact = false,
}: {
  collapsed: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const logoSize = collapsed ? 32 : compact ? 28 : 40;
  const padding = collapsed
    ? '12px 8px'
    : compact
      ? '10px 12px'
      : '16px';

  return (
    <Link
      to='/'
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : compact ? 8 : 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding,
        minHeight: collapsed || compact ? 48 : 64,
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
      }}
    >
      <img
        src={BRAND_LOGO}
        alt=''
        style={{
          width: logoSize,
          height: logoSize,
          borderRadius: compact ? 6 : 4,
          flexShrink: 0,
        }}
      />
      {!collapsed ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minWidth: 0,
            lineHeight: 1.2,
          }}
        >
          <Typography.Text
            strong
            style={{ color: '#1565c0', fontSize: compact ? 14 : 16 }}
          >
            {t('app.name')}
          </Typography.Text>
          <Typography.Text
            type='secondary'
            style={{ fontSize: 'xx-small', lineHeight: 1.2 }}
          >
            {t('app.versionShort', { version: VERSION })}
          </Typography.Text>
        </div>
      ) : null}
    </Link>
  );
}

function AccountFooter({
  collapsed,
  compact,
  onClose,
}: {
  collapsed: boolean;
  compact: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const onSignOut = async () => {
    onClose();
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  const accountBody = collapsed ? (
    <Avatar
      size={28}
      icon={<UserOutlined />}
      style={{ background: '#1565c0' }}
    />
  ) : (
    <>
      <Avatar
        size={compact ? 32 : 36}
        icon={<UserOutlined />}
        style={{ background: '#1565c0', flexShrink: 0 }}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography.Text
          strong
          style={{
            fontSize: compact ? 13 : 14,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </Typography.Text>
        <Typography.Text
          type='secondary'
          style={{
            display: 'block',
            width: '100%',
            fontSize: 12,
            lineHeight: 1.3,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.username}
        </Typography.Text>
      </div>
    </>
  );

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('auth.signOut'),
            onClick: () => {
              void onSignOut();
            },
          },
        ],
      }}
      trigger={['click']}
      placement='topLeft'
    >
      <button
        type='button'
        aria-label={t('auth.account')}
        style={{
          display: 'flex',
          alignItems: collapsed ? 'center' : 'flex-start',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10,
          width: '100%',
          padding: collapsed
            ? '12px 8px'
            : compact
              ? '12px'
              : '14px 16px',
          border: 'none',
          borderTop: '1px solid rgba(5, 5, 5, 0.06)',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {accountBody}
      </button>
    </Dropdown>
  );
}

function NavigationContent({
  onClose,
  collapsed = false,
  compact = false,
  showAccount = false,
}: {
  onClose: () => void;
  collapsed?: boolean;
  compact?: boolean;
  showAccount?: boolean;
}) {
  const location = useLocation();
  const { t } = useI18n();

  const selected =
    NAV_ITEMS.find((item) => item.path === location.pathname)?.path ?? '/';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BrandSection collapsed={collapsed} compact={compact} />
      <Menu
        mode='inline'
        selectedKeys={[selected]}
        inlineCollapsed={collapsed}
        style={{ flex: 1, borderInlineEnd: 'none' }}
        items={NAV_ITEMS.map(({ labelKey, path, icon }) => ({
          key: path,
          icon,
          label: (
            <Link to={path} onClick={onClose}>
              {t(labelKey)}
            </Link>
          ),
        }))}
      />
      {showAccount ? (
        <AccountFooter
          collapsed={collapsed}
          compact={compact}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}

function AppSidebar({ open, onClose }: AppSidebarProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (isMobile) {
    return (
      <Drawer
        placement='left'
        open={open}
        onClose={onClose}
        closable={false}
        width='80vw'
        styles={{ body: { padding: 0 } }}
      >
        <NavigationContent onClose={onClose} compact showAccount />
      </Drawer>
    );
  }

  return (
    <Sider
      theme='light'
      width={drawerWidth}
      collapsedWidth={collapsedWidth}
      collapsed={!open}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        insetBlockStart: 0,
        borderInlineEnd: '1px solid rgba(5, 5, 5, 0.06)',
      }}
    >
      <NavigationContent onClose={onClose} collapsed={!open} />
    </Sider>
  );
}

export default AppSidebar;
