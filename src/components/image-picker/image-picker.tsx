import { CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
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
  /** `circle` for avatar, `rect` for cover. */
  shape?: 'circle' | 'rect';
  width?: number | string;
  height?: number | string;
  accept?: string;
  disabled?: boolean;
  emptyIcon?: ReactNode;
  emptyLabel?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function ImagePicker({
  value = null,
  onChange,
  shape = 'rect',
  width = '100%',
  height = 160,
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  disabled = false,
  emptyIcon,
  emptyLabel,
  ariaLabel,
  className,
  style,
}: ImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value);
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

  const clearImage = () => {
    revokeIfBlob(localBlobRef.current);
    localBlobRef.current = null;
    setPreviewUrl(null);
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

    revokeIfBlob(localBlobRef.current);
    const nextUrl = URL.createObjectURL(file);
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
      openPicker();
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
        hidden
        disabled={disabled}
        onChange={onFileChange}
      />

      <div
        role='button'
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: radius,
          overflow: 'hidden',
          cursor: disabled ? 'default' : 'pointer',
          boxSizing: 'border-box',
          background: previewUrl
            ? '#f0f2f5'
            : (style?.background as string | undefined) ||
              'linear-gradient(145deg, #e8eef5 0%, #d7dee8 100%)',
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
              objectFit: 'cover',
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
