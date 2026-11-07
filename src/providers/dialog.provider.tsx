import { Button, Input, Modal, Space, Typography } from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useI18n } from './i18n.provider';

export type DialogSize = 'fit-content' | 'fullscreen';

export type ConfirmDialogOptions = {
  title?: string;
  message: ReactNode;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
};

export type PromptDialogOptions = {
  title?: string;
  message?: ReactNode;
  defaultValue?: string;
  placeholder?: string;
  okText?: string;
  cancelText?: string;
};

export type CustomDialogOptions = {
  title?: string;
  content: ReactNode;
  size?: DialogSize;
  width?: number | string;
  /** Modal footer. Pass `null` to hide; use `setDialogActions` from content for stateful footers. */
  actions?: ReactNode;
};

type ActiveDialog =
  | {
      kind: 'confirm';
      options: ConfirmDialogOptions;
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'prompt';
      options: PromptDialogOptions;
      resolve: (value: string | null) => void;
    }
  | {
      kind: 'custom';
      options: CustomDialogOptions;
    };

type DialogContextValue = {
  confirmDialog: (options: ConfirmDialogOptions) => Promise<boolean>;
  promptDialog: (options: PromptDialogOptions) => Promise<string | null>;
  customDialog: (options: CustomDialogOptions) => void;
  closeDialog: () => void;
  /** Update the custom dialog footer (keeps it fixed outside the scrollable body). */
  setDialogActions: (actions: ReactNode) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [active, setActive] = useState<ActiveDialog | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [actionsOverride, setActionsOverride] = useState<
    ReactNode | undefined
  >(undefined);
  const closingRef = useRef(false);

  const finishClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeDialog = useCallback(() => {
    if (!active || closingRef.current) {
      finishClose();
      return;
    }
    closingRef.current = true;
    if (active.kind === 'confirm') {
      active.resolve(false);
    } else if (active.kind === 'prompt') {
      active.resolve(null);
    }
    finishClose();
  }, [active, finishClose]);

  const confirmDialog = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      closingRef.current = false;
      setActionsOverride(undefined);
      setActive({ kind: 'confirm', options, resolve });
      setIsOpen(true);
    });
  }, []);

  const promptDialog = useCallback((options: PromptDialogOptions) => {
    return new Promise<string | null>((resolve) => {
      closingRef.current = false;
      setActionsOverride(undefined);
      setPromptValue(options.defaultValue ?? '');
      setActive({ kind: 'prompt', options, resolve });
      setIsOpen(true);
    });
  }, []);

  const customDialog = useCallback((options: CustomDialogOptions) => {
    closingRef.current = false;
    setActionsOverride(undefined);
    setActive({ kind: 'custom', options });
    setIsOpen(true);
  }, []);

  const setDialogActions = useCallback((actions: ReactNode) => {
    setActionsOverride(actions);
  }, []);

  const value = useMemo(
    () => ({
      confirmDialog,
      promptDialog,
      customDialog,
      closeDialog,
      setDialogActions,
    }),
    [
      confirmDialog,
      promptDialog,
      customDialog,
      closeDialog,
      setDialogActions,
    ],
  );

  const isFullscreen =
    active?.kind === 'custom' && active.options.size === 'fullscreen';

  const modalStyles: CSSProperties = isFullscreen
    ? {
        top: 0,
        margin: 0,
        paddingBottom: 0,
        maxWidth: '100vw',
        width: '100vw',
        height: '100%',
      }
    : {};

  const title =
    active?.kind === 'confirm'
      ? (active.options.title ?? t('common.confirm'))
      : active?.kind === 'prompt'
        ? (active.options.title ?? t('common.prompt'))
        : active?.options.title;

  const width =
    active?.kind === 'custom'
      ? isFullscreen
        ? '100vw'
        : (active.options.width ?? 'fit-content')
      : 420;

  const onConfirmOk = () => {
    if (active?.kind !== 'confirm') {
      return;
    }
    closingRef.current = true;
    active.resolve(true);
    finishClose();
  };

  const onPromptOk = () => {
    if (active?.kind !== 'prompt') {
      return;
    }
    closingRef.current = true;
    active.resolve(promptValue);
    finishClose();
  };

  const footer =
    active?.kind === 'confirm' ? (
      <Space>
        <Button onClick={closeDialog}>
          {active.options.cancelText ?? t('common.cancel')}
        </Button>
        <Button
          type='primary'
          danger={active.options.danger}
          onClick={onConfirmOk}
        >
          {active.options.okText ?? t('common.ok')}
        </Button>
      </Space>
    ) : active?.kind === 'prompt' ? (
      <Space>
        <Button onClick={closeDialog}>
          {active.options.cancelText ?? t('common.cancel')}
        </Button>
        <Button type='primary' onClick={onPromptOk}>
          {active.options.okText ?? t('common.ok')}
        </Button>
      </Space>
    ) : active?.kind === 'custom' ? (
      actionsOverride !== undefined ? (
        actionsOverride
      ) : active.options.actions !== undefined ? (
        active.options.actions
      ) : (
        <Button onClick={closeDialog}>{t('common.close')}</Button>
      )
    ) : null;

  const body =
    active?.kind === 'confirm' ? (
      <Typography.Paragraph style={{ margin: 0 }}>
        {active.options.message}
      </Typography.Paragraph>
    ) : active?.kind === 'prompt' ? (
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        {active.options.message ? (
          <Typography.Paragraph style={{ margin: 0 }}>
            {active.options.message}
          </Typography.Paragraph>
        ) : null}
        <Input
          autoFocus
          value={promptValue}
          placeholder={active.options.placeholder}
          onChange={(event) => setPromptValue(event.target.value)}
          onPressEnter={onPromptOk}
        />
      </Space>
    ) : active?.kind === 'custom' ? (
      active.options.content
    ) : null;

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        open={isOpen}
        title={title}
        onCancel={closeDialog}
        afterClose={() => {
          setActive(null);
          setPromptValue('');
          setActionsOverride(undefined);
          closingRef.current = false;
        }}
        closable={false}
        maskClosable={false}
        keyboard={false}
        destroyOnHidden
        centered={!isFullscreen}
        width={width}
        style={modalStyles}
        styles={{
          wrapper: isFullscreen
            ? {
                overflow: 'hidden',
                inset: 0,
              }
            : undefined,
          body: {
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            maxHeight: isFullscreen ? 'none' : 'calc(100vh - 200px)',
          },
          header: { flexShrink: 0 },
          footer: {
            flexShrink: 0,
            marginTop: 0,
            ...(isFullscreen
              ? {
                  paddingBlock: 12,
                  paddingInline: 16,
                  paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }
              : {}),
          },
          content: isFullscreen
            ? {
                height: '100dvh',
                maxHeight: '100dvh',
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
              }
            : {
                minWidth: 300,
                maxWidth: 'calc(100vw - 48px)',
                maxHeight: 'calc(100vh - 48px)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
              },
        }}
        footer={footer}
      >
        {body}
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used inside DialogProvider');
  }
  return context;
}
