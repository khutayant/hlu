import { InfoCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
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
  getProjectByIdRequest,
  type Project,
} from '../../../handlers/project.handler';
import { useI18n } from '../../../providers/i18n.provider';
import { RibbonTitle, useSetRibbon } from '../../../providers/ribbon.provider';
import { useToast } from '../../../providers/toast.provider';
import { ImmunizationSessionPanel } from './immunization-session-panel';
import { ProjectDetailPanel } from './project-detail-panel';

/** Matches `HomeLayout` Content padding so this shell can bleed edge-to-edge. */
const CONTENT_PAD_X = 20;
const CONTENT_PAD_TOP = 20;
const CONTENT_PAD_BOTTOM = 32;

const { useBreakpoint } = Grid;

const PROJECT_DETAIL_SECTIONS = ['details', 'immunization-sessions'] as const;

type ProjectDetailSection = (typeof PROJECT_DETAIL_SECTIONS)[number];

function isProjectDetailSection(
  value: string | undefined,
): value is ProjectDetailSection {
  return PROJECT_DETAIL_SECTIONS.includes(value as ProjectDetailSection);
}

function ProjectDetailPage() {
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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const section = useMemo<ProjectDetailSection | null>(() => {
    if (!isProjectDetailSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = project?.name || t('nav.projectDetail');
  const description = project?.projectNo;

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => navigate('/masters/project')}
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
      setProject(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await getProjectByIdRequest(id);
        if (!cancelled) {
          setProject(result);
        }
      } catch (error) {
        if (!cancelled) {
          setProject(null);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('projectDetailPage.loadFailed'),
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
    return <Navigate to='/masters/project' replace />;
  }

  if (id === 'projects' || id === 'immunization-sessions') {
    return <Navigate to='/masters/project' replace />;
  }

  if (!section) {
    return <Navigate to={`/masters/project/${id}/details`} replace />;
  }

  let mainContent: ReactNode;
  if (loading) {
    mainContent = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  } else if (!project) {
    mainContent = <Empty description={t('projectDetailPage.loadFailed')} />;
  } else if (section === 'details') {
    mainContent = (
      <ProjectDetailPanel project={project} onChanged={reload} />
    );
  } else if (section === 'immunization-sessions') {
    mainContent = <ImmunizationSessionPanel lockedProject={project} />;
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
        aria-label={project?.name || title}
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
            navigate(`/masters/project/${id}/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
          }}
          items={[
            {
              key: 'details',
              icon: <InfoCircleOutlined />,
              label: t('projectDetailPage.menu.details'),
            },
            {
              key: 'immunization-sessions',
              icon: <MedicineBoxOutlined />,
              label: t('projectDetailPage.menu.immunizationSessions'),
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

export default ProjectDetailPage;
