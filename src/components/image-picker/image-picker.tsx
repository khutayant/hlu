import { CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Typography } from 'antd';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

export type ImagePickerValue = {
  file: File | null;
  previewUrl: string | null;
};

export type ImagePickerProps = {
  value?: string | null;
  onChange?: (next: ImagePickerValue) => void;
  /**
   * When set, picking a file opens this callback instead of applying via `onChange`
   * (e.g. open a crop dialog). Caller owns the object URL.
   */
  onPickFile?: (file: File, objectUrl: string) => void;
  /** `circle` for avatar, `rect` for cover. */
  shape?: 'circle' | 'rect';
  width?: number | string;
  height?: number | string;
  accept?: string;
  disabled?: boolean;
  emptyIcon?: ReactNode;
  emptyLabel?: string;
  ariaLabel?: string;
  /** Preview object-fit (signatures often need `contain`). */
  objectFit?: 'cover' | 'contain';
  /** Checkerboard behind preview (transparent PNGs). */
  transparencyGrid?: boolean;
  className?: string;
  style?: CSSProperties;
};

const TRANSPARENCY_GRID =
  'linear-gradient(45deg, #d0d0d0 25%, transparent 25%), linear-gradient(-45deg, #d0d0d0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d0d0d0 75%), linear-gradient(-45deg, transparent 75%, #d0d0d0 75%)';

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function ImagePicker({
  value = null,
  onChange,
  onPickFile,
  shape = 'rect',
  width = '100%',
  height = 160,
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  disabled = false,
  emptyIcon,
  emptyLabel,
  ariaLabel,
  objectFit = 'cover',
  transparencyGrid = false,
  className,
  style,
}: ImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value);
  const [previewOpen, setPreviewOpen] = useState(false);
  const localBlobRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  useEffect(() => {
    return () => {
      revokeIfBlob(localBlobRef.current);
    };
  }, []);

  const openPicker = () => {
    if (disabled) {
      return;
    }
    inputRef.current?.click();
  };

  const openPreview = () => {
    if (!previewUrl) {
      return;
    }
    setPreviewOpen(true);
  };

  const onSurfaceActivate = () => {
    if (disabled) {
      return;
    }
    if (previewUrl) {
      openPreview();
      return;
    }
    openPicker();
  };

  const clearImage = () => {
    revokeIfBlob(localBlobRef.current);
    localBlobRef.current = null;
    setPreviewUrl(null);
    setPreviewOpen(false);
    onChange?.({ file: null, previewUrl: null });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    if (onPickFile) {
      onPickFile(file, nextUrl);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    revokeIfBlob(localBlobRef.current);
    localBlobRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    onChange?.({ file, previewUrl: nextUrl });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSurfaceActivate();
    }
  };

  const isCircle = shape === 'circle';
  const radius = isCircle ? '50%' : 16;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width,
        height: isCircle ? width : height,
        aspectRatio: isCircle ? '1 / 1' : undefined,
        borderRadius: radius,
        flexShrink: 0,
        ...style,
        // Keep outer shell circular even if callers pass other radii.
        ...(isCircle ? { borderRadius: '50%' } : null),
      }}
    >
      <input
        id={inputId}
        ref={inputRef}
        type='file'
        accept={accept}
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={onFileChange}
        style={{
          // Ant Form input rules can override the HTML `hidden` attribute.
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        role='button'
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        onClick={onSurfaceActivate}
        onKeyDown={onKeyDown}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          overflow: 'hidden',
          cursor: disabled ? 'default' : 'pointer',
          boxSizing: 'border-box',
          background: previewUrl
            ? transparencyGrid
              ? '#fff'
              : '#f0f2f5'
            : (style?.background as string | undefined) ||
              'linear-gradient(145deg, #e8eef5 0%, #d7dee8 100%)',
          backgroundImage:
            previewUrl && transparencyGrid ? TRANSPARENCY_GRID : undefined,
          backgroundSize:
            previewUrl && transparencyGrid ? '16px 16px' : undefined,
          backgroundPosition:
            previewUrl && transparencyGrid
              ? '0 0, 0 8px, 8px -8px, -8px 0'
              : undefined,
          border: style?.border ?? '1px solid rgba(5, 5, 5, 0.08)',
          boxShadow: style?.boxShadow,
          color: style?.color,
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=''
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              display: 'block',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <Flex
            vertical
            align='center'
            justify='center'
            gap={6}
            style={{
              width: '100%',
              height: '100%',
              color: 'inherit',
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          >
            {emptyIcon}
            {emptyLabel ? (
              <Typography.Text
                style={{
                  fontSize: 12,
                  color: 'inherit',
                  textAlign: 'center',
                  paddingInline: 8,
                }}
              >
                {emptyLabel}
              </Typography.Text>
            ) : null}
          </Flex>
        )}
      </div>

      {previewUrl ? (
        <Image
          src={previewUrl}
          alt=''
          style={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            src: previewUrl,
            onVisibleChange: (visible) => setPreviewOpen(visible),
          }}
        />
      ) : null}

      <Flex
        gap={6}
        style={{
          position: 'absolute',
          insetInlineEnd: isCircle ? '50%' : 10,
          insetBlockEnd: isCircle ? -4 : 10,
          transform: isCircle ? 'translateX(50%)' : undefined,
          zIndex: 2,
        }}
      >
        <Button
          type='primary'
          size='small'
          shape={isCircle ? 'circle' : 'round'}
          icon={<CameraOutlined />}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            openPicker();
          }}
        />
        {previewUrl ? (
          <Button
            size='small'
            shape={isCircle ? 'circle' : 'round'}
            danger
            icon={<DeleteOutlined />}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              clearImage();
            }}
            aria-label='remove image'
          />
        ) : null}
      </Flex>
    </div>
  );
}

export default ImagePicker;
