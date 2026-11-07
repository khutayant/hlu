import {
  IdcardOutlined,
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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuthorizedFileUrl } from '../handlers/file.handler';
import { useAuth } from '../providers/auth.provider';
import { useI18n } from '../providers/i18n.provider';
import { LOCALE_OPTIONS, type LocaleCode } from '../resources/data/locales';
import AppLocator from './locator';

const { Header } = Layout;
const { useBreakpoint } = Grid;

/** Shared with ribbon sticky offset. */
export const TOOLBAR_HEIGHT_PX = 44;

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

function ProfileAvatar({ uuidName }: { uuidName?: string | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setSrc(null);

    if (!uuidName) {
      return;
    }

    void (async () => {
      try {
        const url = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      } catch {
        if (!cancelled) {
          setSrc(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uuidName]);

  return (
    <Avatar
      size={22}
      src={src || undefined}
      icon={<UserOutlined />}
      style={{ background: src ? undefined : '#1565c0' }}
      onError={() => {
        setSrc(null);
        return true;
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
        paddingInline: 12,
        paddingBlock: 0,
        background: '#fff',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        height: TOOLBAR_HEIGHT_PX,
        lineHeight: `${TOOLBAR_HEIGHT_PX}px`,
      }}
    >
      <Flex align='center' style={{ width: '100%', minHeight: 0 }} gap={4}>
        <Button
          type='text'
          size='small'
          icon={<MenuOutlined />}
          onClick={onMenuClick}
          aria-label='toggle sidebar'
        />
        <AppLocator />
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
                    size={18}
                  />
                  {option.label}
                </Space>
              ),
              onClick: () => setLocale(option.code as LocaleCode),
            })),
          }}
          trigger={['click']}
        >
          <Button type='text' size='small' aria-label={t('common.language')}>
            <Space size={4}>
              <LocaleFlag
                src={selectedLocale.flag}
                label={selectedLocale.label}
                size={16}
              />
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {selectedLocale.label}
              </span>
            </Space>
          </Button>
        </Dropdown>

        {!isMobile ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'account-info',
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
                  key: 'my-profile',
                  icon: <IdcardOutlined />,
                  label: t('nav.profilePage'),
                  onClick: () => {
                    navigate('/profile/profile');
                  },
                },
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
              size='small'
              aria-label={t('auth.account')}
              style={{ height: 32, paddingInline: 6 }}
            >
              <Space size={6}>
                <ProfileAvatar uuidName={user?.profileImage?.uuidName} />
                <span
                  style={{ fontWeight: 600, maxWidth: 120, fontSize: 13 }}
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
