import { Alert, Button, Flex, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../providers/auth.provider';
import { useI18n } from '../../../providers/i18n.provider';

function CallbackPage() {
  const { t } = useI18n();
  const { completeSignIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');
    const oauthDescription = searchParams.get('error_description');

    if (oauthError) {
      setError(oauthDescription || oauthError);
      return;
    }

    if (!code || !state) {
      setError(t('auth.callbackMissingParams'));
      return;
    }

    void (async () => {
      try {
        const returnTo = await completeSignIn(code, state);
        navigate(returnTo || '/', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('auth.loginFailed'));
      }
    })();
  }, [completeSignIn, navigate, searchParams, t]);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          padding: 24,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid rgba(5, 5, 5, 0.06)',
        }}
      >
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {t('auth.loginFailed')}
        </Typography.Title>
        <Alert type='error' showIcon message={error} style={{ marginBottom: 16 }} />
        <Button
          type='primary'
          block
          onClick={() => navigate('/auth/login', { replace: true })}
        >
          {t('auth.backToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <Flex vertical align='center' gap={16} style={{ padding: 24 }}>
      <Spin size='large' />
      <Typography.Text type='secondary'>
        {t('auth.completingSignIn')}
      </Typography.Text>
    </Flex>
  );
}

export default CallbackPage;