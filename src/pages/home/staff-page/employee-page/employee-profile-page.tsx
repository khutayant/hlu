import { FormOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Empty, Grid, Menu, Spin, theme } from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getEmployeeByIdRequest,
  type Employee,
} from '../../../../handlers/employee.handler';
import { useI18n } from '../../../../providers/i18n.provider';
import { RibbonTitle, useSetRibbon } from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import { EmployeeProfilePanel } from './employee-profile-panel';
import { EmployeeSignaturePanel } from './employee-signature-panel';

/** Matches `HomeLayout` Content padding so this shell can bleed edge-to-edge. */
const CONTENT_PAD_X = 20;
const CONTENT_PAD_TOP = 20;
const CONTENT_PAD_BOTTOM = 32;

const { useBreakpoint } = Grid;

const EMPLOYEE_SECTIONS = ['profile', 'signature'] as const;

type EmployeeSection = (typeof EMPLOYEE_SECTIONS)[number];

function isEmployeeSection(
  value: string | undefined,
): value is EmployeeSection {
  return EMPLOYEE_SECTIONS.includes(value as EmployeeSection);
}

function EmployeeProfilePage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { id, section: sectionParam } = useParams<{
    id: string;
    section?: string;
  }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const section = useMemo<EmployeeSection | null>(() => {
    if (!isEmployeeSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = employee
    ? [employee.title?.name, employee.displayName].filter(Boolean).join(' ')
    : t('nav.employeeProfilePage');
  const description = employee
    ? [employee.employeeNo, employee.focalNo].filter(Boolean).join(' · ')
    : t('employeePage.profile.description');

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => navigate('/staff/employee')}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t],
  );

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setEmployee(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await getEmployeeByIdRequest(id);
        if (!cancelled) {
          setEmployee(result);
        }
      } catch (error) {
        if (!cancelled) {
          setEmployee(null);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('employeePage.profile.loadFailed'),
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
  }, [id, reloadKey, showToast, t]);

  if (!id) {
    return <Navigate to='/staff/employee' replace />;
  }

  if (!section) {
    return <Navigate to={`/staff/employee/${id}/profile`} replace />;
  }

  let mainContent: ReactNode;
  if (loading) {
    mainContent = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  } else if (!employee) {
    mainContent = (
      <Empty description={t('employeePage.profile.notFound')}>
        <Button type='primary' onClick={() => navigate('/staff/employee')}>
          {t('employeePage.profile.backToList')}
        </Button>
      </Empty>
    );
  } else if (section === 'profile') {
    mainContent = (
      <EmployeeProfilePanel employee={employee} onChanged={reload} />
    );
  } else if (section === 'signature') {
    mainContent = <EmployeeSignaturePanel employee={employee} />;
  } else {
    mainContent = null;
  }

  const shellHeight = `calc(100% + ${CONTENT_PAD_TOP + CONTENT_PAD_BOTTOM}px)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'stretch',
        flex: 1,
        alignSelf: 'stretch',
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
        aria-label={title}
        style={{
          width: isMobile ? '100%' : 280,
          flexShrink: 0,
          alignSelf: 'stretch',
          minHeight: 0,
          maxHeight: isMobile ? '40%' : undefined,
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
            navigate(`/staff/employee/${id}/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
          }}
          items={[
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: t('employeeDetailPage.menu.profile'),
            },
            {
              key: 'signature',
              icon: <FormOutlined />,
              label: t('employeeDetailPage.menu.signature'),
            },
          ]}
        />
      </nav>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          alignSelf: 'stretch',
          padding: isMobile ? 16 : 20,
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            minHeight: '100%',
            padding: token.paddingLG,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
            boxSizing: 'border-box',
          }}
        >
          {mainContent}
        </div>
      </main>
    </div>
  );
}

export default EmployeeProfilePage;
