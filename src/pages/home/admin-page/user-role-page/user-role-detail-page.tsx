import {
  AppstoreOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Empty, Grid, Menu, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getUserRoleRequest,
  type UserRoleDetail,
} from '../../../../handlers/user-role.handler';
import { TOOLBAR_HEIGHT_PX } from '../../../../components/toolbar';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RIBBON_MIN_HEIGHT_PX,
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import { UserRoleModulesPanel } from './user-role-modules-panel';
import { UserRolePermissionsPanel } from './user-role-permissions-panel';
import { UserRoleUsersPanel } from './user-role-users-panel';

/** Matches `HomeLayout` Content padding so this shell can bleed edge-to-edge. */
const CONTENT_PAD_X = 20;
const CONTENT_PAD_TOP = 20;
const CONTENT_PAD_BOTTOM = 32;

const { useBreakpoint } = Grid;

const ROLE_SECTIONS = ['users', 'permissions', 'modules'] as const;

type RoleSection = (typeof ROLE_SECTIONS)[number];

function isRoleSection(value: string | undefined): value is RoleSection {
  return ROLE_SECTIONS.includes(value as RoleSection);
}

function UserRoleDetailPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { id, section: sectionParam } = useParams<{
    id: string;
    section?: string;
  }>();
  const [role, setRole] = useState<UserRoleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const section = useMemo<RoleSection | null>(() => {
    if (!isRoleSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = role?.name || t('nav.userRoleDetail');
  const description = role?.code;

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        type='text'
        onClick={() => navigate('/admin/user-role')}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t],
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setRole(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await getUserRoleRequest(id);
        if (!cancelled) {
          setRole(result);
        }
      } catch (error) {
        if (!cancelled) {
          setRole(null);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('userRolePage.detailLoadFailed'),
            severity: 'error',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, showToast, t]);

  if (!id) {
    return <Navigate to='/admin/user-role' replace />;
  }

  if (!section) {
    return <Navigate to={`/admin/user-role/${id}/users`} replace />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (!role) {
    return <Empty description={t('userRolePage.detailLoadFailed')} />;
  }

  const mainContent =
    section === 'users' ? (
      <UserRoleUsersPanel roleId={id} />
    ) : section === 'permissions' ? (
      <UserRolePermissionsPanel roleId={id} />
    ) : (
      <UserRoleModulesPanel roleId={id} />
    );

  const shellHeight = `calc(100vh - ${TOOLBAR_HEIGHT_PX + RIBBON_MIN_HEIGHT_PX}px)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'stretch',
        flex: 1,
        width: `calc(100% + ${CONTENT_PAD_X * 2}px)`,
        marginInline: -CONTENT_PAD_X,
        marginTop: -CONTENT_PAD_TOP,
        marginBottom: -CONTENT_PAD_BOTTOM,
        height: shellHeight,
        maxHeight: shellHeight,
        minHeight: 0,
        overflow: 'hidden',
        background: '#f5f7fa',
      }}
    >
      <nav
        aria-label={role.name}
        style={{
          width: isMobile ? '100%' : 220,
          flexShrink: 0,
          minHeight: 0,
          overflow: 'auto',
          background: '#fff',
          borderInlineEnd: isMobile
            ? 'none'
            : '1px solid rgba(5, 5, 5, 0.06)',
          borderBottom: isMobile ? '1px solid rgba(5, 5, 5, 0.06)' : 'none',
          paddingBlock: 12,
          paddingInline: 8,
          boxSizing: 'border-box',
        }}
      >
        <Menu
          mode={isMobile ? 'horizontal' : 'vertical'}
          selectedKeys={[section]}
          onClick={({ key }) => {
            navigate(`/admin/user-role/${id}/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
          }}
          items={[
            {
              key: 'users',
              icon: <TeamOutlined />,
              label: t('userRolePage.menu.users'),
            },
            {
              key: 'permissions',
              icon: <SafetyOutlined />,
              label: t('userRolePage.menu.permissions'),
            },
            {
              key: 'modules',
              icon: <AppstoreOutlined />,
              label: t('userRolePage.menu.modules'),
            },
          ]}
        />
      </nav>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          padding: isMobile ? 16 : 28,
          overflow: 'auto',
        }}
      >
        {mainContent}
      </main>
    </div>
  );
}

export default UserRoleDetailPage;
