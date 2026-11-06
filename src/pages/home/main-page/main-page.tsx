import { Space, Typography } from 'antd';
import { useI18n } from '../../../providers/i18n.provider';

function MainPage() {
  const { t } = useI18n();

  return (
    <Space direction='vertical' size={16} style={{ width: '100%', maxWidth: 576 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {t('mainPage.title')}
      </Typography.Title>
      <Typography.Paragraph type='secondary' style={{ margin: 0 }}>
        {t('mainPage.description')}
      </Typography.Paragraph>
    </Space>
  );
}

export default MainPage;
