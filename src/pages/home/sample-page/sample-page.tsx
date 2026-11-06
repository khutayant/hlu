import { Space, Tag, Typography } from 'antd';
import { useI18n } from '../../../providers/i18n.provider';

const PAGE_CODE = 'H001';

function SamplePage() {
  const { t } = useI18n();

  return (
    <Space direction='vertical' size={16} style={{ width: '100%', maxWidth: 576 }}>
      <Tag style={{ alignSelf: 'flex-start', fontWeight: 700 }}>{PAGE_CODE}</Tag>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {t('samplePage.title')}
      </Typography.Title>
      <Typography.Paragraph type='secondary' style={{ margin: 0 }}>
        {t('samplePage.description')}
      </Typography.Paragraph>
    </Space>
  );
}

export default SamplePage;
