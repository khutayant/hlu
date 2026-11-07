import { DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, message } from 'antd';
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { COVER_DISPLAY_HEIGHT } from '../profile-picker/crop-image.tool';

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif';
const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export type CoverImageDialogProps = {
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

/**
 * Cover view dialog — same flow as profile: preview, pick, remove.
 * Preview uses the on-screen cover band aspect (full width × {@link COVER_DISPLAY_HEIGHT}).
 */
function CoverImageDialog({
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
}: CoverImageDialogProps) {
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
      width={720}
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
            width: '100%',
            height: COVER_DISPLAY_HEIGHT,
            marginInline: 'auto',
            borderRadius: 16,
            overflow: 'hidden',
            background: imageUrl
              ? '#f0f2f5'
              : 'linear-gradient(145deg, #e8eef5 0%, #d7dee8 100%)',
            border: '1px solid rgba(5, 5, 5, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0,0,0,0.45)',
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
            <PictureOutlined style={{ fontSize: 40 }} />
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

export default CoverImageDialog;
