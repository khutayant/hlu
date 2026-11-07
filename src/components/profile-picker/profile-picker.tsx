import {
  CameraOutlined,
  PictureOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Image, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import CoverImageDialog from '../image-picker/cover-image-dialog';
import type { ImagePickerValue } from '../image-picker/image-picker';
import {
  COVER_DISPLAY_HEIGHT,
  COVER_OUTPUT_WIDTH,
  PROFILE_IMAGE_SIZE,
  coverOutputSize,
} from './crop-image.tool';
import ImageCropModal from './image-crop-modal';
import ProfileImageDialog from './profile-image-dialog';

export type ProfilePickerProps = {
  coverUrl?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  coverLabel?: string;
  avatarLabel?: string;
  pickProfileLabel?: string;
  removeProfileLabel?: string;
  cropProfileLabel?: string;
  pickCoverLabel?: string;
  removeCoverLabel?: string;
  cropCoverLabel?: string;
  usePhotoLabel?: string;
  cancelLabel?: string;
  invalidTypeMessage?: string;
  onCoverChange?: (next: ImagePickerValue) => void | Promise<void>;
  onAvatarChange?: (next: ImagePickerValue) => void | Promise<void>;
  disabled?: boolean;
};

type CropTarget = 'avatar' | 'cover';

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function ProfilePicker({
  coverUrl = null,
  avatarUrl = null,
  displayName,
  username,
  coverLabel = 'Cover photo',
  avatarLabel = 'Profile photo',
  pickProfileLabel = 'Pick profile',
  removeProfileLabel = 'Remove profile',
  cropProfileLabel = 'Crop profile photo',
  pickCoverLabel = 'Pick cover',
  removeCoverLabel = 'Remove cover',
  cropCoverLabel = 'Crop cover photo',
  usePhotoLabel = 'Use photo',
  cancelLabel = 'Cancel',
  invalidTypeMessage = 'Only JPG, PNG, WebP, and AVIF images are allowed',
  onCoverChange,
  onAvatarChange,
  disabled = false,
}: ProfilePickerProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const [avatarViewOpen, setAvatarViewOpen] = useState(false);
  const [coverViewOpen, setCoverViewOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<CropTarget>('avatar');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [coverAspect, setCoverAspect] = useState(
    COVER_OUTPUT_WIDTH / COVER_DISPLAY_HEIGHT,
  );
  const cropSrcRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      revokeIfBlob(cropSrcRef.current);
    };
  }, []);

  const measureCoverAspect = () => {
    const el = coverRef.current;
    if (!el) {
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setCoverAspect(width / height);
    }
  };

  const clearCropSrc = () => {
    revokeIfBlob(cropSrcRef.current);
    cropSrcRef.current = null;
    setCropSrc(null);
  };

  const openAvatarView = () => {
    if (disabled) {
      return;
    }
    setAvatarViewOpen(true);
  };

  const openCoverView = () => {
    if (disabled) {
      return;
    }
    measureCoverAspect();
    setCoverViewOpen(true);
  };

  const beginCrop = (target: CropTarget, objectUrl: string) => {
    revokeIfBlob(cropSrcRef.current);
    cropSrcRef.current = objectUrl;
    setCropSrc(objectUrl);
    setCropTarget(target);
    setAvatarViewOpen(false);
    setCoverViewOpen(false);
    setCropOpen(true);
  };

  const onCropCancel = () => {
    setCropOpen(false);
    clearCropSrc();
    if (cropTarget === 'avatar') {
      setAvatarViewOpen(true);
    } else {
      setCoverViewOpen(true);
    }
  };

  const onCropConfirm = async (file: File) => {
    if (cropTarget === 'avatar') {
      await onAvatarChange?.({ file, previewUrl: null });
    } else {
      await onCoverChange?.({ file, previewUrl: null });
    }
    setCropOpen(false);
    clearCropSrc();
  };

  const coverSize = coverOutputSize(coverAspect);

  return (
    <div style={{ width: '100%', marginBottom: 8 }}>
      <div
        style={{
          position: 'relative',
          marginBottom: 52,
        }}
      >
        <div
          ref={coverRef}
          style={{
            width: '100%',
            height: COVER_DISPLAY_HEIGHT,
            borderRadius: 16,
            overflow: 'hidden',
            background: coverUrl
              ? '#f0f2f5'
              : 'linear-gradient(145deg, #e8eef5 0%, #d7dee8 100%)',
            border: '1px solid rgba(5, 5, 5, 0.08)',
            position: 'relative',
          }}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={coverLabel}
              width='100%'
              height={COVER_DISPLAY_HEIGHT}
              style={{
                objectFit: 'cover',
                display: 'block',
              }}
              styles={{
                root: { width: '100%', height: '100%', display: 'block' },
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: 'rgba(0,0,0,0.45)',
              }}
            >
              <PictureOutlined style={{ fontSize: 28 }} />
              <Typography.Text style={{ fontSize: 12, color: 'inherit' }}>
                {coverLabel}
              </Typography.Text>
            </div>
          )}
          <Button
            type='primary'
            size='small'
            shape='round'
            icon={<CameraOutlined />}
            disabled={disabled}
            aria-label={coverLabel}
            style={{
              position: 'absolute',
              insetInlineEnd: 10,
              insetBlockEnd: 10,
              zIndex: 2,
            }}
            onClick={openCoverView}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            insetInlineStart: 20,
            insetBlockEnd: -40,
            zIndex: 3,
            width: 96,
            height: 96,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              background: 'linear-gradient(145deg, #1976d2 0%, #0d47a1 100%)',
              color: '#fff',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={avatarLabel}
                width={90}
                height={90}
                style={{
                  objectFit: 'cover',
                  borderRadius: '50%',
                  display: 'block',
                }}
                styles={{
                  root: {
                    width: '100%',
                    height: '100%',
                    display: 'block',
                  },
                }}
              />
            ) : (
              <span
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserOutlined style={{ fontSize: 32 }} />
              </span>
            )}
          </div>
          <Button
            type='primary'
            size='small'
            shape='circle'
            icon={<CameraOutlined />}
            disabled={disabled}
            aria-label={avatarLabel}
            onClick={openAvatarView}
            style={{
              position: 'absolute',
              insetInlineEnd: 0,
              insetBlockEnd: 0,
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {(displayName || username) && (
        <div style={{ paddingInlineStart: 128, minHeight: 44 }}>
          {displayName ? (
            <Typography.Title
              level={3}
              style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              {displayName}
            </Typography.Title>
          ) : null}
          {username ? (
            <Typography.Text type='secondary' style={{ fontSize: 15 }}>
              @{username}
            </Typography.Text>
          ) : null}
        </div>
      )}

      <ProfileImageDialog
        open={avatarViewOpen}
        imageUrl={avatarUrl}
        title={avatarLabel}
        pickLabel={pickProfileLabel}
        removeLabel={removeProfileLabel}
        invalidTypeMessage={invalidTypeMessage}
        disabled={disabled}
        onClose={() => setAvatarViewOpen(false)}
        onPickFile={(_file, objectUrl) => beginCrop('avatar', objectUrl)}
        onRemove={async () => {
          await onAvatarChange?.({ file: null, previewUrl: null });
          setAvatarViewOpen(false);
        }}
      />

      <CoverImageDialog
        open={coverViewOpen}
        imageUrl={coverUrl}
        title={coverLabel}
        pickLabel={pickCoverLabel}
        removeLabel={removeCoverLabel}
        invalidTypeMessage={invalidTypeMessage}
        disabled={disabled}
        onClose={() => setCoverViewOpen(false)}
        onPickFile={(_file, objectUrl) => beginCrop('cover', objectUrl)}
        onRemove={async () => {
          await onCoverChange?.({ file: null, previewUrl: null });
          setCoverViewOpen(false);
        }}
      />

      <ImageCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        title={cropTarget === 'avatar' ? cropProfileLabel : cropCoverLabel}
        confirmText={usePhotoLabel}
        cancelText={cancelLabel}
        cropShape='rect'
        aspect={cropTarget === 'avatar' ? 1 : coverAspect}
        mimeType='image/jpeg'
        fileName={cropTarget === 'avatar' ? 'profile.jpg' : 'cover.jpg'}
        outputSize={cropTarget === 'avatar' ? PROFILE_IMAGE_SIZE : undefined}
        outputWidth={cropTarget === 'cover' ? coverSize.width : undefined}
        outputHeight={cropTarget === 'cover' ? coverSize.height : undefined}
        width={cropTarget === 'cover' ? 840 : 560}
        onCancel={onCropCancel}
        onConfirm={onCropConfirm}
      />
    </div>
  );
}

export default ProfilePicker;
