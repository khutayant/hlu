import { Alert, Button, Typography } from 'antd';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../providers/auth.provider';
import { useI18n } from '../../../providers/i18n.provider';

function LoginPage() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/';

  const onSignIn = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await signIn(returnTo || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        padding: 24,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid rgba(5, 5, 5, 0.06)',
        boxShadow: '0 8px 24px rgba(21, 101, 192, 0.08)',
      }}
    >
      <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
        {t('auth.loginTitle')}
      </Typography.Title>
      <Typography.Paragraph type='secondary' style={{ marginBottom: 24 }}>
        {t('auth.loginSubtitle')}
      </Typography.Paragraph>

      {error ? (
        <Alert
          type='error'
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Button
        type='primary'
        size='large'
        block
        loading={submitting}
        onClick={() => void onSignIn()}
      >
        {t('auth.signInKeycloak')}
      </Button>
    </div>
  );
}

export default LoginPage;
