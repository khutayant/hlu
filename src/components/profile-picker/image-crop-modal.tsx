import { Button, Modal, Slider, Space, Typography } from 'antd';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Cropper, { type Area, type MediaSize, type Size } from 'react-easy-crop';
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
  /**
   * Free crop-box resize via corner/edge handles (no fixed size).
   * Output keeps the selected pixel size.
   */
  freeResize?: boolean;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileName: string;
  /** Exact square output size in pixels (profile uses 512 → 512×512). */
  outputSize?: number;
  /** Rectangular output (cover: 1024 × derived height). */
  outputWidth?: number;
  outputHeight?: number;
  /** Modal width (cover crops use a wider dialog). */
  width?: number | string;
  /** Checkerboard crop stage (see transparent PNG signatures). */
  transparencyGrid?: boolean;
  zoomLabel?: string;
  onCancel: () => void;
  /** Resolve on success (dialog may close). Reject/throw to keep the dialog open. */
  onConfirm: (file: File) => void | Promise<void>;
};

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const TRANSPARENCY_GRID =
  'linear-gradient(45deg, #c8c8c8 25%, transparent 25%), linear-gradient(-45deg, #c8c8c8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #c8c8c8 75%), linear-gradient(-45deg, transparent 75%, #c8c8c8 75%)';

const STAGE_HEIGHT = 420;
const MIN_CROP = 48;
const HANDLE_SIZE = 12;

const HANDLE_CURSOR: Record<ResizeHandle, CSSProperties['cursor']> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

const HANDLE_STYLE: Record<ResizeHandle, CSSProperties> = {
  n: { top: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2 },
  s: { bottom: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2 },
  e: { right: -HANDLE_SIZE / 2, top: '50%', marginTop: -HANDLE_SIZE / 2 },
  w: { left: -HANDLE_SIZE / 2, top: '50%', marginTop: -HANDLE_SIZE / 2 },
  ne: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  nw: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  se: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  sw: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function ImageCropModal({
  open,
  imageSrc,
  title,
  confirmText,
  cancelText,
  cropShape = 'round',
  aspect = 1,
  freeResize = false,
  mimeType,
  fileName,
  outputSize,
  outputWidth,
  outputHeight,
  width = 720,
  transparencyGrid = false,
  zoomLabel = 'Zoom',
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [cropSize, setCropSize] = useState<Size | null>(null);
  const [stageSize, setStageSize] = useState({ width: 640, height: STAGE_HEIGHT });

  useEffect(() => {
    if (!open) {
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setBusy(false);
    // Seed a box immediately; refined to image aspect in onMediaLoaded.
    setCropSize(
      freeResize
        ? {
            width: 360,
            height: 120,
          }
        : null,
    );
  }, [open, imageSrc, freeResize]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const node = stageRef.current;
    if (!node) {
      return;
    }
    const sync = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, freeResize]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onMediaLoaded = useCallback(
    (mediaSize: MediaSize) => {
      if (!freeResize) {
        return;
      }
      const maxW = Math.max(MIN_CROP, stageSize.width - 32);
      const maxH = Math.max(MIN_CROP, stageSize.height - 32);
      const imageAspect =
        mediaSize.naturalWidth > 0 && mediaSize.naturalHeight > 0
          ? mediaSize.naturalWidth / mediaSize.naturalHeight
          : aspect > 0
            ? aspect
            : 3;
      let nextW = maxW * 0.75;
      let nextH = nextW / imageAspect;
      if (nextH > maxH * 0.75) {
        nextH = maxH * 0.75;
        nextW = nextH * imageAspect;
      }
      setCropSize({
        width: Math.round(clamp(nextW, MIN_CROP, maxW)),
        height: Math.round(clamp(nextH, MIN_CROP, maxH)),
      });
    },
    [aspect, freeResize, stageSize.height, stageSize.width],
  );

  const onResizePointerDown = (
    event: ReactPointerEvent<HTMLSpanElement>,
    handle: ResizeHandle,
  ) => {
    if (!cropSize || busy) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = cropSize.width;
    const startH = cropSize.height;
    const maxW = Math.max(MIN_CROP, stageSize.width - 16);
    const maxH = Math.max(MIN_CROP, stageSize.height - 16);
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let nextW = startW;
      let nextH = startH;
      // Crop box stays centered — expand/shrink from the dragged edge/corner.
      if (handle.includes('e')) {
        nextW = startW + dx;
      }
      if (handle.includes('w')) {
        nextW = startW - dx;
      }
      if (handle.includes('s')) {
        nextH = startH + dy;
      }
      if (handle.includes('n')) {
        nextH = startH - dy;
      }
      setCropSize({
        width: Math.round(clamp(nextW, MIN_CROP, maxW)),
        height: Math.round(clamp(nextH, MIN_CROP, maxH)),
      });
    };

    const onUp = (ev: PointerEvent) => {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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

  const stageHeight = freeResize
    ? STAGE_HEIGHT
    : aspect < 1.2
      ? 520
      : 420;

  const cropFrameStyle: CSSProperties | undefined =
    freeResize && cropSize
      ? {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: cropSize.width,
          height: cropSize.height,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 3,
          boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
        }
      : undefined;

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
          <Button
            type='primary'
            loading={busy}
            onClick={() => void handleConfirm()}
          >
            {confirmText}
          </Button>
        </Space>
      }
    >
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width: '100%',
          height: stageHeight,
          background: transparencyGrid ? '#fff' : '#111',
          backgroundImage: transparencyGrid ? TRANSPARENCY_GRID : undefined,
          backgroundSize: transparencyGrid ? '20px 20px' : undefined,
          backgroundPosition: transparencyGrid
            ? '0 0, 0 10px, 10px -10px, -10px 0'
            : undefined,
          borderRadius: 12,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        {imageSrc ? (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={0.5}
            maxZoom={4}
            aspect={aspect}
            cropSize={freeResize && cropSize ? cropSize : undefined}
            cropShape={cropShape}
            showGrid={cropShape === 'rect' && !freeResize}
            objectFit='contain'
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            style={
              freeResize
                ? {
                    containerStyle: { cursor: 'grab' },
                    cropAreaStyle: {
                      border: 'none',
                      color: 'rgba(0,0,0,0.001)',
                    },
                  }
                : undefined
            }
          />
        ) : null}

        {freeResize && cropSize ? (
          <div style={cropFrameStyle} aria-hidden>
            {(Object.keys(HANDLE_STYLE) as ResizeHandle[]).map((handle) => (
              <span
                key={handle}
                onPointerDown={(event) => onResizePointerDown(event, handle)}
                style={{
                  position: 'absolute',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  borderRadius: 2,
                  background: '#fff',
                  border: '1px solid #1677ff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                  pointerEvents: 'auto',
                  cursor: HANDLE_CURSOR[handle],
                  touchAction: 'none',
                  ...HANDLE_STYLE[handle],
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 16 }}>
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          {zoomLabel}
        </Typography.Text>
        <Slider
          min={0.5}
          max={4}
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
