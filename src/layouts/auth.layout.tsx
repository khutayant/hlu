import { Button, Dropdown, Flex, Layout, Space, Typography } from 'antd';
import { Outlet } from 'react-router-dom';
import { publicUrl, VERSION } from '../config';
import { useI18n } from '../providers/i18n.provider';
import { LOCALE_OPTIONS, type LocaleCode } from '../resources/data/locales';

const { Content } = Layout;

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

function AuthLayout() {
  const { t, locale, setLocale } = useI18n();
  const selectedLocale =
    LOCALE_OPTIONS.find((option) => option.code === locale) ??
    LOCALE_OPTIONS[0];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Flex
        justify='flex-end'
        style={{ paddingBlock: 16, paddingInline: 20 }}
      >
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

      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingInline: 24,
          paddingBottom: 64,
        }}
      >
        <Flex
          vertical
          align='center'
          gap={24}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <Flex vertical align='center' gap={12}>
            <img
              src={publicUrl('assets/icons/hlu-logo/android-chrome-192x192.png')}
              alt=''
              width={64}
              height={64}
              style={{ display: 'block', borderRadius: 16 }}
            />
            <Typography.Title
              level={3}
              style={{
                margin: 0,
                color: '#1565c0',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              {t('app.name')}
            </Typography.Title>
          </Flex>

          <div style={{ width: '100%' }}>
            <Outlet />
          </div>

          <Typography.Text type='secondary'>
            {t('app.versionShort', { version: VERSION })}
          </Typography.Text>
        </Flex>
      </Content>
    </Layout>
  );
}

export default AuthLayout;
