import { SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Grid, Menu, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { ImagePickerValue } from '../../../components/image-picker/image-picker';
import ProfilePicker from '../../../components/profile-picker/profile-picker';
import { fetchAuthorizedFileUrl } from '../../../handlers/file.handler';
import {
  clearCoverImageRequest,
  clearProfileImageRequest,
  uploadCoverImageRequest,
  uploadProfileImageRequest,
} from '../../../handlers/user-profile.handler';
import { useAuth } from '../../../providers/auth.provider';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';

const { useBreakpoint } = Grid;

const DATE_FORMAT = 'DD-MMM-YYYY hh:mm:ss A';
const PROFILE_SECTIONS = ['profile', 'security'] as const;

type ProfileSection = (typeof PROFILE_SECTIONS)[number];

function isProfileSection(value: string | undefined): value is ProfileSection {
  return PROFILE_SECTIONS.includes(value as ProfileSection);
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : value;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(110px, 140px) 1fr',
        columnGap: 24,
        rowGap: 4,
        paddingBlock: 14,
        borderBottom: '1px solid rgba(5, 5, 5, 0.08)',
      }}
    >
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 15 }}>{value}</Typography.Text>
    </div>
  );
}

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function ProfilePage() {
  const { t } = useI18n();
  const { user, displayName, setUser, changePassword } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const { section: sectionParam } = useParams<{ section: string }>();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const avatarBlobRef = useRef<string | null>(null);
  const coverBlobRef = useRef<string | null>(null);

  const section = useMemo<ProfileSection | null>(() => {
    if (!isProfileSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = t('profilePage.title');
  const description = t('profilePage.description');
  useSetRibbon(
    <RibbonTitle title={title} description={description} />,
    [title, description],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      revokeIfBlob(avatarBlobRef.current);
      revokeIfBlob(coverBlobRef.current);
      avatarBlobRef.current = null;
      coverBlobRef.current = null;
      setAvatarUrl(null);
      setCoverUrl(null);

      if (!user) {
        return;
      }

      if (user.profileImage?.uuidName) {
        try {
          const url = await fetchAuthorizedFileUrl(user.profileImage.uuidName);
          if (cancelled) {
            revokeIfBlob(url);
            return;
          }
          avatarBlobRef.current = url;
          setAvatarUrl(url);
        } catch {
          if (!cancelled) {
            setAvatarUrl(null);
          }
        }
      }

      if (user.coverImage?.uuidName) {
        try {
          const url = await fetchAuthorizedFileUrl(user.coverImage.uuidName);
          if (cancelled) {
            revokeIfBlob(url);
            return;
          }
          coverBlobRef.current = url;
          setCoverUrl(url);
        } catch {
          if (!cancelled) {
            setCoverUrl(null);
          }
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      revokeIfBlob(avatarBlobRef.current);
      revokeIfBlob(coverBlobRef.current);
      avatarBlobRef.current = null;
      coverBlobRef.current = null;
    };
  }, [user?.id, user?.profileImage?.uuidName, user?.coverImage?.uuidName]);

  if (!section) {
    return <Navigate to='/profile/profile' replace />;
  }

  if (!user) {
    return null;
  }

  const onAvatarChange = async (next: ImagePickerValue) => {
    setSavingAvatar(true);
    try {
      if (!next.file) {
        const updated = await clearProfileImageRequest();
        setUser(updated);
        message.success(t('profilePage.avatarCleared'));
        return;
      }
      const updated = await uploadProfileImageRequest(next.file);
      setUser(updated);
      message.success(t('profilePage.avatarSaved'));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profilePage.saveFailed'),
      );
      throw error;
    } finally {
      setSavingAvatar(false);
    }
  };

  const onCoverChange = async (next: ImagePickerValue) => {
    setSavingCover(true);
    try {
      if (!next.file) {
        const updated = await clearCoverImageRequest();
        setUser(updated);
        message.success(t('profilePage.coverCleared'));
        return;
      }
      const updated = await uploadCoverImageRequest(next.file);
      setUser(updated);
      message.success(t('profilePage.coverSaved'));
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('profilePage.saveFailed'),
      );
      throw error;
    } finally {
      setSavingCover(false);
    }
  };

  const profileContent = (
    <article>
      <header style={{ marginBottom: 28 }}>
        <Typography.Title
          level={2}
          style={{
            margin: 0,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          {t('profilePage.menu.profile')}
        </Typography.Title>
        <Typography.Paragraph
          type='secondary'
          style={{ margin: '8px 0 0', fontSize: 15, maxWidth: 520 }}
        >
          {t('profilePage.profileHint')}
        </Typography.Paragraph>
      </header>

      <ProfilePicker
        key={pickerKey}
        coverUrl={coverUrl}
        avatarUrl={avatarUrl}
        displayName={displayName}
        username={user.username}
        coverLabel={t('profilePage.pickCover')}
        avatarLabel={t('profilePage.pickAvatar')}
        pickProfileLabel={t('profilePage.pickProfile')}
        removeProfileLabel={t('profilePage.removeProfile')}
        cropProfileLabel={t('profilePage.cropProfile')}
        pickCoverLabel={t('profilePage.pickCoverAction')}
        removeCoverLabel={t('profilePage.removeCover')}
        cropCoverLabel={t('profilePage.cropCover')}
        usePhotoLabel={t('profilePage.usePhoto')}
        cancelLabel={t('common.cancel')}
        invalidTypeMessage={t('profilePage.jpgPngOnly')}
        disabled={savingAvatar || savingCover}
        onCoverChange={onCoverChange}
        onAvatarChange={onAvatarChange}
      />

      <section style={{ marginTop: 24 }}>
        <DetailRow
          label={t('profilePage.fields.displayName')}
          value={displayName || '—'}
        />
        <DetailRow
          label={t('profilePage.fields.username')}
          value={user.username}
        />
        <DetailRow
          label={t('profilePage.fields.email')}
          value={user.email || '—'}
        />
        <DetailRow label={t('profilePage.fields.role')} value={user.role} />
        <DetailRow
          label={t('profilePage.fields.lastLoginAt')}
          value={formatDate(user.lastLoginAt)}
        />
      </section>
    </article>
  );

  const securityContent = (
    <article>
      <header style={{ marginBottom: 28 }}>
        <Typography.Title
          level={2}
          style={{
            margin: 0,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          {t('profilePage.menu.security')}
        </Typography.Title>
        <Typography.Paragraph
          type='secondary'
          style={{ margin: '8px 0 0', fontSize: 15, maxWidth: 520 }}
        >
          {t('profilePage.securityHint')}
        </Typography.Paragraph>
      </header>

      <section>
        <DetailRow
          label={t('profilePage.fields.email')}
          value={user.email || '—'}
        />
        <DetailRow
          label={t('profilePage.fields.emailVerified')}
          value={
            user.emailVerified
              ? t('profilePage.verified')
              : t('profilePage.unverified')
          }
        />
      </section>

      <div style={{ marginTop: 24 }}>
        <Button
          type='primary'
          loading={changingPassword}
          onClick={() => {
            setChangingPassword(true);
            void changePassword().catch((error: unknown) => {
              setChangingPassword(false);
              message.error(
                error instanceof Error
                  ? error.message
                  : t('profilePage.changePasswordFailed'),
              );
            });
          }}
        >
          {t('profilePage.changePassword')}
        </Button>
      </div>
    </article>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'flex-start',
        gap: isMobile ? 16 : 24,
        width: '100%',
        maxWidth: 960,
      }}
    >
      <nav
        aria-label={t('profilePage.title')}
        style={{
          width: isMobile ? '100%' : 220,
          flexShrink: 0,
          position: isMobile ? 'static' : 'sticky',
          top: 120,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid rgba(5, 5, 5, 0.06)',
          paddingBlock: 12,
          paddingInline: 8,
        }}
      >
        <Menu
          mode={isMobile ? 'horizontal' : 'vertical'}
          selectedKeys={[section]}
          onClick={({ key }) => {
            navigate(`/profile/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
            borderRadius: 16,
          }}
          items={[
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: t('profilePage.menu.profile'),
            },
            {
              key: 'security',
              icon: <SafetyOutlined />,
              label: t('profilePage.menu.security'),
            },
          ]}
        />
      </nav>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid rgba(5, 5, 5, 0.06)',
          padding: isMobile ? 16 : 28,
        }}
      >
        {section === 'profile' ? profileContent : securityContent}
      </main>
    </div>
  );
}

export default ProfilePage;
