import { HomeOutlined } from '@ant-design/icons';
import { Drawer, Grid, Layout, Menu, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicUrl, VERSION } from '../config';
import { useI18n } from '../providers/i18n.provider';

const { Sider } = Layout;
const { useBreakpoint } = Grid;

const NAV_ITEMS: {
  code?: string;
  labelKey: string;
  path: string;
  icon: ReactNode;
}[] = [
  {
    code: 'H001',
    labelKey: 'nav.samplePage',
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

function BrandSection({ collapsed }: { collapsed: boolean }) {
  const { t } = useI18n();

  return (
    <Link
      to='/'
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 12,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '16px 8px' : '16px',
        minHeight: 64,
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
      }}
    >
      <img
        src={BRAND_LOGO}
        alt=''
        style={{
          width: collapsed ? 36 : 40,
          height: collapsed ? 36 : 40,
          borderRadius: 4,
          flexShrink: 0,
        }}
      />
      {!collapsed ? (
        <Typography.Text strong style={{ color: '#1565c0', fontSize: 16 }}>
          {t('app.name')}
        </Typography.Text>
      ) : null}
    </Link>
  );
}

function NavigationContent({
  onClose,
  collapsed = false,
}: {
  onClose: () => void;
  collapsed?: boolean;
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
      <BrandSection collapsed={collapsed} />
      <Menu
        mode='inline'
        selectedKeys={[selected]}
        inlineCollapsed={collapsed}
        style={{ flex: 1, borderInlineEnd: 'none' }}
        items={NAV_ITEMS.map(({ code, labelKey, path, icon }) => {
          const label = t(labelKey);
          return {
            key: path,
            icon,
            label: (
              <Link to={path} onClick={onClose}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {code ? (
                    <Tag
                      color={code.startsWith('C') ? 'success' : 'default'}
                      style={{ marginInlineEnd: 0, fontWeight: 700 }}
                    >
                      {code}
                    </Tag>
                  ) : null}
                  <span>{label}</span>
                </span>
              </Link>
            ),
          };
        })}
      />
      <div
        style={{
          padding: collapsed ? '16px 4px' : '16px',
          textAlign: 'center',
          borderTop: '1px solid rgba(5, 5, 5, 0.06)',
        }}
      >
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          {collapsed
            ? t('app.versionShort', { version: VERSION })
            : t('app.version', { version: VERSION })}
        </Typography.Text>
      </div>
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
        width='80vw'
        styles={{ body: { padding: 0 } }}
      >
        <NavigationContent onClose={onClose} />
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
