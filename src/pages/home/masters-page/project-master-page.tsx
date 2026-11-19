import { Button, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../providers/i18n.provider';
import { RibbonTitle, useSetRibbon } from '../../../providers/ribbon.provider';
import { ProjectPanel } from './project-panel';

/** Projects list page (no side menu). */
function ProjectMasterPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
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

  return (
    <div
      style={{
        width: '100%',
        padding: token.paddingLG,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
      }}
    >
      <ProjectPanel />
    </div>
  );
}

export default ProjectMasterPage;
