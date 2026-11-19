import {
  AppstoreOutlined,
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  ProjectOutlined,
  SolutionOutlined,
  TagOutlined,
  TeamOutlined,
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
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { publicUrl, VERSION } from '../config';
import { useModule } from '../providers/module.provider';
import { useAuth } from '../providers/auth.provider';
import { useI18n } from '../providers/i18n.provider';
import {
  flattenSidebarMenuLeaves,
  resolveSidebarMenu,
} from '../resources/data/sidebar-menu/resolve-sidebar-menu.tool';
import type {
  SidebarMenuIcon,
  SidebarMenuItem,
} from '../resources/data/sidebar-menu/sidebar-menu.interface';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const MENU_ICONS: Record<SidebarMenuIcon, ReactNode> = {
  home: <HomeOutlined />,
  test: <ExperimentOutlined />,
  userRole: <SolutionOutlined />,
  users: <TeamOutlined />,
  employee: <IdcardOutlined />,
  country: <GlobalOutlined />,
  township: <EnvironmentOutlined />,
  location: <EnvironmentOutlined />,
  category: <AppstoreOutlined />,
  project: <ProjectOutlined />,
  title: <TagOutlined />,
  position: <AuditOutlined />,
  overview: <DashboardOutlined />,
  meeting: <CalendarOutlined />,
};

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
            key: 'my-profile',
            icon: <IdcardOutlined />,
            label: t('nav.profilePage'),
            onClick: () => {
              onClose();
              navigate('/profile/profile');
            },
          },
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

function DeveloperMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(5, 5, 5, 0.06)',
        padding: collapsed ? '10px 4px' : '12px 16px',
        textAlign: collapsed ? 'center' : 'left',
      }}
    >
      <Typography.Text
        type='secondary'
        style={{ fontSize: 12, letterSpacing: '0.06em' }}
      >
        LW
      </Typography.Text>
    </div>
  );
}

function filterMenuByModule(
  items: SidebarMenuItem[],
  ready: boolean,
  hasModule: (code: string) => boolean,
): SidebarMenuItem[] {
  return items
    .map((item) => {
      if (item.moduleCode && !(ready && hasModule(item.moduleCode))) {
        return null;
      }
      if (!item.children) {
        return item;
      }
      const children = item.children.filter(
        (child) =>
          !child.moduleCode || (ready && hasModule(child.moduleCode)),
      );
      if (children.length === 0) {
        return null;
      }
      return { ...item, children };
    })
    .filter((item): item is SidebarMenuItem => item !== null);
}

function NavigationContent({
  onClose,
  onNavigate,
  collapsed = false,
  compact = false,
  showAccount = false,
}: {
  onClose: () => void;
  /** Called after a menu link click (e.g. close mobile drawer). Omit on desktop. */
  onNavigate?: () => void;
  collapsed?: boolean;
  compact?: boolean;
  showAccount?: boolean;
}) {
  const location = useLocation();
  const { t } = useI18n();
  const { ready, hasModule } = useModule();
  const navItems = filterMenuByModule(
    resolveSidebarMenu(location.pathname),
    ready,
    hasModule,
  );
  const leaves = flattenSidebarMenuLeaves(navItems);

  const pathname =
    location.pathname.length > 1 && location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname;
  const selected =
    [...leaves]
      .filter(
        (item) =>
          pathname === item.path || pathname.startsWith(`${item.path}/`),
      )
      .sort((a, b) => b.path.length - a.path.length)[0]?.path ??
    leaves[0]?.path ??
    '/';

  const activeGroupKeys = navItems
    .filter(
      (item) =>
        item.children?.some(
          (child) =>
            pathname === child.path ||
            pathname.startsWith(`${child.path}/`),
        ),
    )
    .map((item) => item.id);
  const activeGroupKey = activeGroupKeys.join('|');
  const [userOpenKeys, setUserOpenKeys] = useState<string[]>(activeGroupKeys);
  useEffect(() => {
    if (!activeGroupKey) {
      return;
    }
    const nextKeys = activeGroupKey.split('|');
    setUserOpenKeys((prev) => [...new Set([...prev, ...nextKeys])]);
  }, [activeGroupKey]);
  const openKeys = [...new Set([...userOpenKeys, ...activeGroupKeys])];

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <BrandSection collapsed={collapsed} compact={compact} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
        }}
      >
        <Menu
          mode='inline'
          selectedKeys={[selected]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={setUserOpenKeys}
          inlineCollapsed={collapsed}
          style={{
            borderInlineEnd: 'none',
            height: 'auto',
            flex: 'none',
          }}
          items={navItems.map((item) => {
            if (item.children) {
              return {
                key: item.id,
                icon: MENU_ICONS[item.icon],
                label: t(item.labelKey),
                children: item.children.map((child) => ({
                  key: child.path,
                  icon: MENU_ICONS[child.icon],
                  label: (
                    <Link to={child.path} onClick={onNavigate}>
                      {t(child.labelKey)}
                    </Link>
                  ),
                })),
              };
            }
            return {
              key: item.path,
              icon: MENU_ICONS[item.icon],
              label: (
                <Link to={item.path} onClick={onNavigate}>
                  {t(item.labelKey)}
                </Link>
              ),
            };
          })}
        />
      </div>
      {showAccount ? (
        <AccountFooter
          collapsed={collapsed}
          compact={compact}
          onClose={onClose}
        />
      ) : null}
      <DeveloperMark collapsed={collapsed} />
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
        styles={{
          body: {
            padding: 0,
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <NavigationContent
          onClose={onClose}
          onNavigate={onClose}
          compact
          showAccount
        />
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
        overflow: 'hidden',
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
