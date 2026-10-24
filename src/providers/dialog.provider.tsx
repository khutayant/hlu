import { Box, Button, Fade, Modal, Typography } from '@mui/material';
import { createContext, useContext, useState, type ReactNode } from 'react';

export type DialogSize = 'fit-content' | 'fullscreen';

export type DialogOptions = {
  title?: string;
  content: ReactNode;
  size?: DialogSize;
  width?: number;
  actions?: ReactNode;
};

type DialogContextValue = {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = (options: DialogOptions) => {
    setDialog(options);
    setIsOpen(true);
  };

  const closeDialog = () => setIsOpen(false);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Modal
        open={isOpen}
        onClose={closeDialog}
        closeAfterTransition
        onTransitionExited={() => setDialog(null)}
        aria-labelledby='global-dialog-title'
        aria-describedby='global-dialog-content'
        slotProps={{
          backdrop: {
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.48)' },
          },
        }}
      >
        {dialog ? (
          <Fade in={isOpen} timeout={{ enter: 220, exit: 160 }}>
            <Box
              role='dialog'
              tabIndex={-1}
              sx={{
                position: 'absolute',
                ...(dialog.size === 'fullscreen'
                  ? {
                      inset: 0,
                      width: '100vw',
                      height: '100dvh',
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }
                  : {
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: dialog.width ?? 'fit-content',
                      minWidth: 300,
                      maxWidth: 'calc(100vw - 48px)',
                      maxHeight: 'calc(100vh - 48px)',
                      borderRadius: 2,
                    }),
                overflow: 'auto',
                bgcolor: 'background.paper',
                boxShadow: 24,
                outline: 0,
              }}
            >
              {dialog.title && (
                <Typography
                  id='global-dialog-title'
                  variant='h6'
                  sx={{ px: 3, pt: 3, fontWeight: 700 }}
                >
                  {dialog.title}
                </Typography>
              )}
              <Box
                id='global-dialog-content'
                sx={{
                  p: 3,
                  ...(dialog.size === 'fullscreen'
                    ? { flex: 1, overflow: 'auto' }
                    : {}),
                }}
              >
                {dialog.content}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1,
                  px: 3,
                  pb: 3,
                }}
              >
                {dialog.actions !== undefined ? (
                  dialog.actions
                ) : (
                  <Button onClick={closeDialog}>Close</Button>
                )}
              </Box>
            </Box>
          </Fade>
        ) : (
          <Box />
        )}
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
