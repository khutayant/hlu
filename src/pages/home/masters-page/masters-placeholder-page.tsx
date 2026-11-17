import { DatabaseOutlined } from '@ant-design/icons';
import { Button, Empty, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';

export type MastersPlaceholderPageProps = {
  titleKey: string;
  descriptionKey: string;
};

/**
 * UI shell for a master list until CRUD is wired.
 */
function MastersPlaceholderPage({
  titleKey,
  descriptionKey,
}: MastersPlaceholderPageProps) {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const title = t(titleKey);
  const description = t(descriptionKey);

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
      <Empty
        image={<DatabaseOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
        styles={{ image: { height: 64 } }}
        description={t('mastersPage.comingSoon')}
      />
    </div>
  );
}

export default MastersPlaceholderPage;
