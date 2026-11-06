import { MenuOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Layout, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useI18n } from '../providers/i18n.provider';
import { LOCALE_OPTIONS, type LocaleCode } from '../resources/data/locales';

const { Header } = Layout;

type AppToolbarProps = {
  onMenuClick: () => void;
};

function LocaleFlag({
  src,
  label,
  size = 20,
}: {
  src: string;
  label: string;
  size?: number;
}) {
  return (
    <img
      src={src}
      alt=''
      aria-hidden
      title={label}
      style={{
        width: size,
        height: (size * 2) / 3,
        objectFit: 'cover',
        borderRadius: 2,
        display: 'block',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
      }}
    />
  );
}

function AppToolbar({ onMenuClick }: AppToolbarProps) {
  const { t, locale, setLocale } = useI18n();
  const selectedLocale =
    LOCALE_OPTIONS.find((option) => option.code === locale) ??
    LOCALE_OPTIONS[0];

  return (
    <Header
      style={{
        position: 'sticky',
        insetBlockStart: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        paddingInline: 16,
        background: '#fff',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        height: 64,
        lineHeight: '64px',
      }}
    >
      <Flex align='center' style={{ width: '100%' }} gap={8}>
        <Button
          type='text'
          icon={<MenuOutlined />}
          onClick={onMenuClick}
          aria-label='toggle sidebar'
        />
        <Link to='/' style={{ flex: 1, textDecoration: 'none' }}>
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              color: '#1565c0',
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {t('app.name')}
          </Typography.Title>
        </Link>
        <Dropdown
          menu={{
            selectedKeys: [locale],
            items: LOCALE_OPTIONS.map((option) => ({
              key: option.code,
              label: (
                <Space>
                  <LocaleFlag
                    src={option.flag}
                    label={option.label}
                    size={22}
                  />
                  {option.label}
                </Space>
              ),
              onClick: () => setLocale(option.code as LocaleCode),
            })),
          }}
          trigger={['click']}
        >
          <Button type='text' aria-label={t('common.language')}>
            <Space>
              <LocaleFlag
                src={selectedLocale.flag}
                label={selectedLocale.label}
              />
              <span style={{ fontWeight: 600 }}>{selectedLocale.label}</span>
            </Space>
          </Button>
        </Dropdown>
      </Flex>
    </Header>
  );
}

export default AppToolbar;
