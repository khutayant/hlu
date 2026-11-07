import { DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, message } from 'antd';
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif';
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export type ProfileImageDialogProps = {
  open: boolean;
  imageUrl?: string | null;
  title: string;
  pickLabel: string;
  removeLabel: string;
  invalidTypeMessage: string;
  disabled?: boolean;
  onClose: () => void;
  onPickFile: (file: File, objectUrl: string) => void;
  onRemove: () => void | Promise<void>;
};

function ProfileImageDialog({
  open,
  imageUrl = null,
  title,
  pickLabel,
  removeLabel,
  invalidTypeMessage,
  disabled = false,
  onClose,
  onPickFile,
  onRemove,
}: ProfileImageDialogProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!open && inputRef.current) {
      inputRef.current.value = '';
    }
    if (!open) {
      setRemoving(false);
    }
  }, [open]);

  const openFilePicker = () => {
    if (disabled || removing) {
      return;
    }
    inputRef.current?.click();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!ALLOWED.has(file.type)) {
      message.error(invalidTypeMessage);
      event.target.value = '';
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    onPickFile(file, objectUrl);
    event.target.value = '';
  };

  const handleRemove = async () => {
    if (disabled || removing || !imageUrl) {
      return;
    }
    setRemoving(true);
    try {
      await onRemove();
    } catch {
      // Keep dialog open; caller shows the error.
    } finally {
      setRemoving(false);
    }
  };

  const locked = disabled || removing;

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      destroyOnHidden
      centered
      maskClosable={false}
      keyboard={!removing}
      closable={!removing}
      width={360}
      footer={null}
    >
      <input
        id={inputId}
        ref={inputRef}
        type='file'
        accept={ACCEPT}
        hidden
        disabled={locked}
        onChange={onFileChange}
      />

      <Flex vertical gap={16} style={{ width: '100%', paddingBlock: 8 }}>
        <div
          style={{
            width: 168,
            height: 168,
            marginInline: 'auto',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #1976d2 0%, #0d47a1 100%)',
            border: '3px solid rgba(5, 5, 5, 0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=''
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <UserOutlined style={{ fontSize: 64 }} />
          )}
        </div>

        <Button
          type='primary'
          size='large'
          block
          disabled={locked}
          onClick={openFilePicker}
        >
          {pickLabel}
        </Button>

        <Button
          danger
          size='large'
          block
          icon={<DeleteOutlined />}
          loading={removing}
          disabled={disabled || !imageUrl}
          onClick={() => void handleRemove()}
        >
          {removeLabel}
        </Button>
      </Flex>
    </Modal>
  );
}

export default ProfileImageDialog;
