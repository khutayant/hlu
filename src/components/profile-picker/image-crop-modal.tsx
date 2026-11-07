import { Button, Modal, Slider, Space, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { cropImageToFile } from './crop-image.tool';

export type ImageCropModalProps = {
  open: boolean;
  imageSrc: string | null;
  title: string;
  confirmText: string;
  cancelText: string;
  /** `round` for avatar, `rect` for cover. */
  cropShape?: 'round' | 'rect';
  aspect?: number;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileName: string;
  /** Exact square output size in pixels (profile uses 512 → 512×512). */
  outputSize?: number;
  /** Rectangular output (cover: 1024 × derived height). */
  outputWidth?: number;
  outputHeight?: number;
  /** Modal width (cover crops use a wider dialog). */
  width?: number | string;
  onCancel: () => void;
  /** Resolve on success (dialog may close). Reject/throw to keep the dialog open. */
  onConfirm: (file: File) => void | Promise<void>;
};

function ImageCropModal({
  open,
  imageSrc,
  title,
  confirmText,
  cancelText,
  cropShape = 'round',
  aspect = 1,
  mimeType,
  fileName,
  outputSize,
  outputWidth,
  outputHeight,
  width = 720,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setBusy(false);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || busy) {
      return;
    }
    setBusy(true);
    try {
      const file = await cropImageToFile(imageSrc, croppedAreaPixels, {
        fileName,
        mimeType,
        outputSize,
        outputWidth,
        outputHeight,
        quality: 0.85,
      });
      await onConfirm(file);
    } catch {
      // Keep dialog open; caller shows the error.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      destroyOnHidden
      centered
      maskClosable={false}
      keyboard={!busy}
      closable={!busy}
      width={width}
      footer={
        <Space>
          <Button onClick={onCancel} disabled={busy}>
            {cancelText}
          </Button>
          <Button type='primary' loading={busy} onClick={() => void handleConfirm()}>
            {confirmText}
          </Button>
        </Space>
      }
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: aspect < 1.2 ? 520 : 420,
          background: '#111',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {imageSrc ? (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === 'rect'}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        ) : null}
      </div>
      <div style={{ marginTop: 16 }}>
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          Zoom
        </Typography.Text>
        <Slider
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={setZoom}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

export default ImageCropModal;
