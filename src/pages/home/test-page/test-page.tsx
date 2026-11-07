import { Button, Flex, Space, Typography } from 'antd';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';
import { useToast } from '../../../providers/toast.provider';

/**
 * Sandbox page for trying UI components in isolation.
 */
function TestPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { confirmDialog, promptDialog, customDialog } = useDialog();
  const title = t('testPage.title');
  const description = t('testPage.description');
  useSetRibbon(
    <RibbonTitle title={title} description={description} />,
    [title, description],
  );

  const onConfirm = async () => {
    const ok = await confirmDialog({
      title: t('testPage.confirmTitle'),
      message: t('testPage.confirmMessage'),
    });
    showToast({
      message: ok ? t('testPage.confirmYes') : t('testPage.confirmNo'),
      severity: ok ? 'success' : 'info',
    });
  };

  const onPrompt = async () => {
    const value = await promptDialog({
      title: t('testPage.promptTitle'),
      message: t('testPage.promptMessage'),
      placeholder: t('testPage.promptPlaceholder'),
    });
    if (value === null) {
      showToast({ message: t('testPage.promptCancelled'), severity: 'info' });
      return;
    }
    showToast({
      message: t('testPage.promptResult', { value }),
      severity: 'success',
    });
  };

  return (
    <Space direction='vertical' size={24} style={{ width: '100%' }}>
      <div style={{ width: '100%' }}>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {t('testPage.toastSection')}
        </Typography.Title>
        <Flex wrap gap={8}>
          <Button
            type='primary'
            onClick={() =>
              showToast({
                message: t('testPage.toastSuccess'),
                severity: 'success',
              })
            }
          >
            {t('testPage.toastSuccessBtn')}
          </Button>
          <Button
            onClick={() =>
              showToast({
                message: t('testPage.toastInfo'),
                severity: 'info',
              })
            }
          >
            {t('testPage.toastInfoBtn')}
          </Button>
          <Button
            onClick={() =>
              showToast({
                message: t('testPage.toastWarning'),
                severity: 'warning',
              })
            }
          >
            {t('testPage.toastWarningBtn')}
          </Button>
          <Button
            danger
            onClick={() =>
              showToast({
                message: t('testPage.toastError'),
                severity: 'error',
              })
            }
          >
            {t('testPage.toastErrorBtn')}
          </Button>
        </Flex>
      </div>

      <div style={{ width: '100%' }}>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {t('testPage.dialogSection')}
        </Typography.Title>
        <Flex wrap gap={8}>
          <Button type='primary' onClick={() => void onConfirm()}>
            {t('testPage.confirmBtn')}
          </Button>
          <Button onClick={() => void onPrompt()}>
            {t('testPage.promptBtn')}
          </Button>
          <Button
            onClick={() =>
              customDialog({
                title: t('testPage.dialogFitTitle'),
                size: 'fit-content',
                content: (
                  <Typography.Paragraph style={{ margin: 0 }}>
                    {t('testPage.dialogFitBody')}
                  </Typography.Paragraph>
                ),
              })
            }
          >
            {t('testPage.dialogFitBtn')}
          </Button>
          <Button
            onClick={() =>
              customDialog({
                title: t('testPage.dialogFullTitle'),
                size: 'fullscreen',
                content: (
                  <Typography.Paragraph style={{ margin: 0 }}>
                    {t('testPage.dialogFullBody')}
                  </Typography.Paragraph>
                ),
              })
            }
          >
            {t('testPage.dialogFullBtn')}
          </Button>
        </Flex>
      </div>
    </Space>
  );
}

export default TestPage;
