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
  title?: ReactNode;
  content: ReactNode;
  size?: DialogSize;
  width?: number | string;
  /** Fixed body height (scrolls when content overflows). */
  height?: number | string;
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

type StackEntry = {
  id: number;
  dialog: ActiveDialog;
  actionsOverride?: ReactNode;
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

let nextDialogId = 1;

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [stack, setStack] = useState<StackEntry[]>([]);
  const [promptValue, setPromptValue] = useState('');
  const closingRef = useRef(false);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const clearAll = useCallback(() => {
    setStack([]);
    setPromptValue('');
    closingRef.current = false;
  }, []);

  const closeById = useCallback(
    (id: number) => {
      const current = stackRef.current;
      const index = current.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return;
      }
      // Only the top dialog can be closed.
      if (index !== current.length - 1) {
        return;
      }
      const top = current[index];
      if (current.length === 1) {
        closingRef.current = true;
        if (top.dialog.kind === 'confirm') {
          top.dialog.resolve(false);
        } else if (top.dialog.kind === 'prompt') {
          top.dialog.resolve(null);
        }
        clearAll();
        return;
      }
      setStack((prev) => prev.slice(0, -1));
    },
    [clearAll],
  );

  const setActionsById = useCallback((id: number, actions: ReactNode) => {
    setStack((prev) => {
      const index = prev.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return prev;
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        actionsOverride: actions,
      };
      return next;
    });
  }, []);

  const closeTop = useCallback(() => {
    const current = stackRef.current;
    if (current.length === 0) {
      clearAll();
      return;
    }
    closeById(current[current.length - 1].id);
  }, [clearAll, closeById]);

  const setTopActions = useCallback(
    (actions: ReactNode) => {
      const current = stackRef.current;
      if (current.length === 0) {
        return;
      }
      setActionsById(current[current.length - 1].id, actions);
    },
    [setActionsById],
  );

  const confirmDialog = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      closingRef.current = false;
      setStack([
        {
          id: nextDialogId++,
          dialog: { kind: 'confirm', options, resolve },
        },
      ]);
    });
  }, []);

  const promptDialog = useCallback((options: PromptDialogOptions) => {
    return new Promise<string | null>((resolve) => {
      closingRef.current = false;
      setPromptValue(options.defaultValue ?? '');
      setStack([
        {
          id: nextDialogId++,
          dialog: { kind: 'prompt', options, resolve },
        },
      ]);
    });
  }, []);

  const customDialog = useCallback((options: CustomDialogOptions) => {
    closingRef.current = false;
    setStack((prev) => [
      ...prev,
      {
        id: nextDialogId++,
        dialog: { kind: 'custom', options },
      },
    ]);
  }, []);

  const onConfirmOk = useCallback(() => {
    const top = stackRef.current[stackRef.current.length - 1];
    if (!top || top.dialog.kind !== 'confirm') {
      return;
    }
    closingRef.current = true;
    top.dialog.resolve(true);
    clearAll();
  }, [clearAll]);

  const onPromptOk = useCallback(() => {
    const top = stackRef.current[stackRef.current.length - 1];
    if (!top || top.dialog.kind !== 'prompt') {
      return;
    }
    closingRef.current = true;
    top.dialog.resolve(promptValue);
    clearAll();
  }, [clearAll, promptValue]);

  const rootValue = useMemo(
    () => ({
      confirmDialog,
      promptDialog,
      customDialog,
      closeDialog: closeTop,
      setDialogActions: setTopActions,
    }),
    [
      confirmDialog,
      promptDialog,
      customDialog,
      closeTop,
      setTopActions,
    ],
  );

  return (
    <DialogContext.Provider value={rootValue}>
      {children}
      {stack.map((entry, index) => (
        <StackedDialogModal
          key={entry.id}
          entry={entry}
          isTop={index === stack.length - 1}
          zIndex={1000 + index * 20}
          promptValue={promptValue}
          setPromptValue={setPromptValue}
          onConfirmOk={onConfirmOk}
          onPromptOk={onPromptOk}
          rootValue={rootValue}
          closeById={closeById}
          setActionsById={setActionsById}
          t={t}
        />
      ))}
    </DialogContext.Provider>
  );
}

function StackedDialogModal({
  entry,
  isTop,
  zIndex,
  promptValue,
  setPromptValue,
  onConfirmOk,
  onPromptOk,
  rootValue,
  closeById,
  setActionsById,
  t,
}: {
  entry: StackEntry;
  isTop: boolean;
  zIndex: number;
  promptValue: string;
  setPromptValue: (value: string) => void;
  onConfirmOk: () => void;
  onPromptOk: () => void;
  rootValue: DialogContextValue;
  closeById: (id: number) => void;
  setActionsById: (id: number, actions: ReactNode) => void;
  t: (key: string) => string;
}) {
  const { dialog, actionsOverride } = entry;
  const scopedValue = useMemo(
    () => ({
      ...rootValue,
      closeDialog: () => closeById(entry.id),
      setDialogActions: (actions: ReactNode) =>
        setActionsById(entry.id, actions),
    }),
    [closeById, entry.id, rootValue, setActionsById],
  );

  const isFullscreen =
    dialog.kind === 'custom' && dialog.options.size === 'fullscreen';
  const customBodyHeight =
    dialog.kind === 'custom' && !isFullscreen
      ? dialog.options.height
      : undefined;

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
    dialog.kind === 'confirm'
      ? (dialog.options.title ?? t('common.confirm'))
      : dialog.kind === 'prompt'
        ? (dialog.options.title ?? t('common.prompt'))
        : dialog.options.title;

  const width =
    dialog.kind === 'custom'
      ? isFullscreen
        ? '100vw'
        : (dialog.options.width ?? 'fit-content')
      : 420;

  const footer =
    dialog.kind === 'confirm' ? (
      <Space>
        <Button onClick={() => closeById(entry.id)}>
          {dialog.options.cancelText ?? t('common.cancel')}
        </Button>
        <Button
          type='primary'
          danger={dialog.options.danger}
          onClick={onConfirmOk}
        >
          {dialog.options.okText ?? t('common.ok')}
        </Button>
      </Space>
    ) : dialog.kind === 'prompt' ? (
      <Space>
        <Button onClick={() => closeById(entry.id)}>
          {dialog.options.cancelText ?? t('common.cancel')}
        </Button>
        <Button type='primary' onClick={onPromptOk}>
          {dialog.options.okText ?? t('common.ok')}
        </Button>
      </Space>
    ) : dialog.kind === 'custom' ? (
      actionsOverride !== undefined ? (
        actionsOverride
      ) : dialog.options.actions !== undefined ? (
        dialog.options.actions
      ) : (
        <Button onClick={() => closeById(entry.id)}>{t('common.close')}</Button>
      )
    ) : null;

  const body =
    dialog.kind === 'confirm' ? (
      typeof dialog.options.message === 'string' ||
      typeof dialog.options.message === 'number' ? (
        <Typography.Paragraph style={{ margin: 0 }}>
          {dialog.options.message}
        </Typography.Paragraph>
      ) : (
        <div>{dialog.options.message}</div>
      )
    ) : dialog.kind === 'prompt' ? (
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        {dialog.options.message ? (
          <Typography.Paragraph style={{ margin: 0 }}>
            {dialog.options.message}
          </Typography.Paragraph>
        ) : null}
        <Input
          autoFocus={isTop}
          value={promptValue}
          placeholder={dialog.options.placeholder}
          onChange={(event) => setPromptValue(event.target.value)}
          onPressEnter={onPromptOk}
        />
      </Space>
    ) : dialog.kind === 'custom' ? (
      dialog.options.content
    ) : null;

  return (
    <DialogContext.Provider value={scopedValue}>
      <Modal
        open
        title={title}
        onCancel={() => closeById(entry.id)}
        closable={false}
        maskClosable={false}
        keyboard={false}
        destroyOnHidden
        centered={!isFullscreen}
        width={width}
        style={modalStyles}
        zIndex={zIndex}
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
            display: isFullscreen ? 'flex' : undefined,
            flexDirection: isFullscreen ? 'column' : undefined,
            overflow: isFullscreen ? 'hidden' : 'auto',
            maxHeight: isFullscreen
              ? 'none'
              : customBodyHeight
                ? 'none'
                : 'calc(100vh - 200px)',
            ...(isFullscreen ? {} : { paddingBottom: 8 }),
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
              : {
                  paddingTop: 16,
                }),
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
                height: customBodyHeight,
                maxHeight: customBodyHeight ?? 'calc(100vh - 48px)',
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
