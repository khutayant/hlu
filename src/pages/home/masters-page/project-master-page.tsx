import { MedicineBoxOutlined, ProjectOutlined } from '@ant-design/icons';
import { Button, Grid, Menu, theme } from 'antd';
import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TOOLBAR_HEIGHT_PX } from '../../../components/toolbar';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RIBBON_MIN_HEIGHT_PX,
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';
import { ImmunizationSessionPanel } from './immunization-session-panel';
import { ProjectPanel } from './project-panel';

/** Matches `HomeLayout` Content padding so this shell can bleed edge-to-edge. */
const CONTENT_PAD_X = 20;
const CONTENT_PAD_TOP = 20;
const CONTENT_PAD_BOTTOM = 32;

const { useBreakpoint } = Grid;

const PROJECT_SECTIONS = ['projects', 'immunization-sessions'] as const;

type ProjectSection = (typeof PROJECT_SECTIONS)[number];

function isProjectSection(value: string | undefined): value is ProjectSection {
  return PROJECT_SECTIONS.includes(value as ProjectSection);
}

function ProjectMasterPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { section: sectionParam } = useParams<{ section?: string }>();

  const section = useMemo<ProjectSection | null>(() => {
    if (!isProjectSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = t('projectMasterPage.title');
  const description = t('projectMasterPage.description');

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => navigate('/')}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t],
  );

  if (!section) {
    return <Navigate to='/masters/project/projects' replace />;
  }

  const mainContent =
    section === 'projects' ? (
      <ProjectPanel />
    ) : (
      <ImmunizationSessionPanel />
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
        aria-label={title}
        style={{
          width: isMobile ? '100%' : 280,
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
            navigate(`/masters/project/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
          }}
          items={[
            {
              key: 'projects',
              icon: <ProjectOutlined />,
              label: t('projectMasterPage.menu.projects'),
            },
            {
              key: 'immunization-sessions',
              icon: <MedicineBoxOutlined />,
              label: t('projectMasterPage.menu.immunizationSessions'),
            },
          ]}
        />
      </nav>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
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

export default ProjectMasterPage;
