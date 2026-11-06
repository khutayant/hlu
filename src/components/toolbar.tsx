import {
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Dropdown,
  Flex,
  Grid,
  Layout,
  Space,
  Typography,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/auth.provider';
import { useI18n } from '../providers/i18n.provider';
import { LOCALE_OPTIONS, type LocaleCode } from '../resources/data/locales';

const { Header } = Layout;
const { useBreakpoint } = Grid;

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
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const selectedLocale =
    LOCALE_OPTIONS.find((option) => option.code === locale) ??
    LOCALE_OPTIONS[0];

  const onSignOut = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

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

        {!isMobile ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  disabled: true,
                  label: (
                    <div style={{ minWidth: 160 }}>
                      <Typography.Text strong style={{ display: 'block' }}>
                        {displayName}
                      </Typography.Text>
                      {user?.email ? (
                        <Typography.Text
                          type='secondary'
                          style={{ fontSize: 12 }}
                        >
                          {user.email}
                        </Typography.Text>
                      ) : null}
                    </div>
                  ),
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: t('auth.signOut'),
                  onClick: () => {
                    void onSignOut();
                  },
                },
              ],
            }}
            trigger={['click']}
          >
            <Button
              type='text'
              aria-label={t('auth.account')}
              style={{ height: 40, paddingInline: 8 }}
            >
              <Space size={8}>
                <Avatar
                  size={28}
                  icon={<UserOutlined />}
                  style={{ background: '#1565c0' }}
                />
                <span
                  style={{ fontWeight: 600, maxWidth: 120 }}
                  className='truncate'
                >
                  {displayName}
                </span>
              </Space>
            </Button>
          </Dropdown>
        ) : null}
      </Flex>
    </Header>
  );
}

export default AppToolbar;
