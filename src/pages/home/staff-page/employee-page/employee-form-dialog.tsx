import {
  CameraOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  Select,
  Tooltip,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { PROFILE_IMAGE_SIZE } from '../../../../components/profile-picker/crop-image.tool';
import ImageCropModal from '../../../../components/profile-picker/image-crop-modal';
import ProfileImageDialog from '../../../../components/profile-picker/profile-image-dialog';
import {
  createEmployeeRequest,
  updateEmployeeRequest,
  uploadEmployeeProfileImageRequest,
  type Employee,
  type EmployeeGender,
} from '../../../../handlers/employee.handler';
import { fetchAuthorizedFileUrl } from '../../../../handlers/file.handler';
import {
  listUsersRequest,
  type AppUser,
} from '../../../../handlers/user.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import { useToast } from '../../../../providers/toast.provider';

const FORM_AVATAR_SIZE = 72;
/** Letters A–Z then digits 0–9 only; max 9 (e.g. A91, M003). */
const FOCAL_NO_PATTERN = /^[A-Z]+[0-9]+$/;
const FOCAL_NO_MAX_LENGTH = 9;

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

const EMPLOYEE_GENDER_OPTIONS: EmployeeGender[] = ['MALE', 'FEMALE', 'OTHER'];

type EmployeeFormValues = {
  displayName: string;
  focalNo: string;
  gender: EmployeeGender;
  townshipName: string;
  position: string;
  experience: string;
  email?: string;
  phone?: string;
  hireDate?: Dayjs | null;
  endDate?: Dayjs | null;
  remark?: string;
  userId?: string | null;
};

function normalizeFocalNo(value: string) {
  return value.trim().toUpperCase();
}

function toDatePayload(value?: Dayjs | null) {
  if (!value) {
    return null;
  }
  return value.format('YYYY-MM-DD');
}

export function EmployeeFormDialogBody({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Employee;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<EmployeeFormValues>();
  const [saving, setSaving] = useState(false);
  const [userOptions, setUserOptions] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [profileImageId, setProfileImageId] = useState<string | null>(
    initial?.profileImage?.id ?? null,
  );
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropSrcRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      revokeIfBlob(cropSrcRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initial) {
      form.setFieldsValue({
        displayName: initial.displayName,
        focalNo: initial.focalNo,
        gender: initial.gender,
        townshipName: initial.townshipName,
        position: initial.position,
        experience: initial.experience,
        email: initial.email ?? undefined,
        phone: initial.phone ?? undefined,
        hireDate: initial.hireDate ? dayjs(initial.hireDate) : null,
        endDate: initial.endDate ? dayjs(initial.endDate) : null,
        remark: initial.remark ?? undefined,
        userId: initial.user?.id ?? null,
      });
      setProfileImageId(initial.profileImage?.id ?? null);
      setImageRemoved(false);
    }
  }, [form, initial, mode]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const uuidName = initial?.profileImage?.uuidName;

    if (!uuidName || imageRemoved) {
      return;
    }

    void (async () => {
      try {
        const url = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setProfilePreview((current) =>
          current?.startsWith('blob:') ? current : url,
        );
      } catch {
        if (!cancelled) {
          setProfilePreview((current) =>
            current?.startsWith('blob:') ? current : null,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageRemoved, initial?.profileImage?.uuidName]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setUsersLoading(true);
      try {
        const result = await listUsersRequest({
          page: 1,
          limit: 100,
          active: true,
        });
        if (!cancelled) {
          setUserOptions(result.items);
        }
      } catch {
        if (!cancelled) {
          setUserOptions([]);
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearCropSrc = () => {
    revokeIfBlob(cropSrcRef.current);
    cropSrcRef.current = null;
    setCropSrc(null);
  };

  const beginCrop = (_file: File, objectUrl: string) => {
    revokeIfBlob(cropSrcRef.current);
    cropSrcRef.current = objectUrl;
    setCropSrc(objectUrl);
    setAvatarDialogOpen(false);
    setCropOpen(true);
  };

  const onCropCancel = () => {
    setCropOpen(false);
    clearCropSrc();
    setAvatarDialogOpen(true);
  };

  const onCropConfirm = async (file: File) => {
    setUploadingImage(true);
    try {
      const uploaded = await uploadEmployeeProfileImageRequest(file);
      const objectUrl = URL.createObjectURL(file);
      revokeIfBlob(profilePreview);
      setProfileImageId(uploaded.id);
      setProfilePreview(objectUrl);
      setImageRemoved(false);
      setCropOpen(false);
      clearCropSrc();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeePage.profileImageUploadFailed'),
        severity: 'error',
      });
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const onRemoveImage = async () => {
    revokeIfBlob(profilePreview);
    setProfileImageId(null);
    setProfilePreview(null);
    setImageRemoved(true);
    setAvatarDialogOpen(false);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const shared = {
        displayName: values.displayName.trim(),
        focalNo: normalizeFocalNo(values.focalNo),
        gender: values.gender,
        townshipName: values.townshipName.trim(),
        position: values.position.trim(),
        experience: values.experience.trim(),
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        hireDate: toDatePayload(values.hireDate),
        endDate: toDatePayload(values.endDate),
        remark: values.remark?.trim() || null,
        userId: values.userId || null,
        profileImageId: imageRemoved ? null : profileImageId,
      };

      if (mode === 'edit' && initial) {
        await updateEmployeeRequest(initial.id, shared);
        closeDialog();
        showToast({
          message: t('employeePage.editSuccess'),
          severity: 'success',
        });
      } else {
        await createEmployeeRequest(shared);
        closeDialog();
        showToast({
          message: t('employeePage.createSuccess'),
          severity: 'success',
        });
      }

      onSaved();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t(
                mode === 'edit'
                  ? 'employeePage.editFailed'
                  : 'employeePage.createFailed',
              ),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    setDialogActions(
      <Flex justify='flex-end' gap={8}>
        <Button disabled={saving || uploadingImage} onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button
          type='primary'
          loading={saving}
          disabled={uploadingImage}
          onClick={() => void onSubmitRef.current()}
        >
          {t(
            mode === 'edit'
              ? 'employeePage.editSubmit'
              : 'employeePage.createSubmit',
          )}
        </Button>
      </Flex>,
    );
  }, [closeDialog, mode, saving, setDialogActions, t, uploadingImage]);

  return (
    <Form
      form={form}
      layout='vertical'
      requiredMark
      style={{ marginTop: 4, width: '100%' }}
    >
      <Form.Item label={t('employeePage.fields.profileImage')}>
        <div style={{ position: 'relative', width: FORM_AVATAR_SIZE }}>
          <div
            style={{
              width: FORM_AVATAR_SIZE,
              height: FORM_AVATAR_SIZE,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'linear-gradient(145deg, #1976d2 0%, #0d47a1 100%)',
              border: '2px solid rgba(5, 5, 5, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            {profilePreview ? (
              <img
                src={profilePreview}
                alt=''
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <UserOutlined style={{ fontSize: 28 }} />
            )}
          </div>
          <Button
            type='primary'
            size='small'
            shape='circle'
            icon={<CameraOutlined />}
            loading={uploadingImage}
            disabled={saving}
            aria-label={t('employeePage.fields.profileImage')}
            onClick={() => setAvatarDialogOpen(true)}
            style={{
              position: 'absolute',
              insetInlineEnd: -4,
              insetBlockEnd: -4,
            }}
          />
        </div>
        <ProfileImageDialog
          open={avatarDialogOpen}
          imageUrl={profilePreview}
          title={t('employeePage.fields.profileImage')}
          pickLabel={t('employeePage.fields.profileImagePick')}
          removeLabel={t('employeePage.fields.profileImageRemove')}
          invalidTypeMessage={t('employeePage.validation.profileImageType')}
          disabled={uploadingImage || saving}
          onClose={() => setAvatarDialogOpen(false)}
          onPickFile={beginCrop}
          onRemove={onRemoveImage}
        />
        <ImageCropModal
          open={cropOpen}
          imageSrc={cropSrc}
          title={t('employeePage.fields.profileImageCrop')}
          confirmText={t('employeePage.fields.profileImageUse')}
          cancelText={t('common.cancel')}
          cropShape='round'
          aspect={1}
          mimeType='image/jpeg'
          fileName='employee-profile.jpg'
          outputSize={PROFILE_IMAGE_SIZE}
          width={560}
          onCancel={onCropCancel}
          onConfirm={onCropConfirm}
        />
      </Form.Item>
      <Flex gap={12} wrap>
        <Form.Item
          name='displayName'
          label={t('employeePage.fields.displayName')}
          rules={[
            {
              required: true,
              message: t('employeePage.validation.displayNameRequired'),
            },
          ]}
          style={{ flex: 1, minWidth: 140 }}
        >
          <Input maxLength={255} autoFocus />
        </Form.Item>
        <Form.Item
          name='gender'
          label={t('employeePage.fields.gender')}
          rules={[
            {
              required: true,
              message: t('employeePage.validation.genderRequired'),
            },
          ]}
          style={{ flex: '0 0 140px', minWidth: 120 }}
        >
          <Select
            options={EMPLOYEE_GENDER_OPTIONS.map((value) => ({
              value,
              label: t(`employeePage.gender.${value}`),
            }))}
          />
        </Form.Item>
        <Form.Item
          name='focalNo'
          label={
            <Flex align='center' gap={6}>
              <span>{t('employeePage.fields.focalNo')}</span>
              <Tooltip title={t('employeePage.fields.focalNoHint')}>
                <InfoCircleOutlined
                  style={{ color: 'rgba(0, 0, 0, 0.45)', cursor: 'help' }}
                />
              </Tooltip>
            </Flex>
          }
          normalize={(value: string) =>
            typeof value === 'string' ? value.toUpperCase() : value
          }
          rules={[
            {
              required: true,
              message: t('employeePage.validation.focalNoRequired'),
            },
            {
              validator: async (_, value: string | undefined) => {
                const focalNo = normalizeFocalNo(value ?? '');
                if (!focalNo) {
                  return;
                }
                if (focalNo.length > FOCAL_NO_MAX_LENGTH) {
                  throw new Error(
                    t('employeePage.validation.focalNoMaxLength'),
                  );
                }
                if (!FOCAL_NO_PATTERN.test(focalNo)) {
                  throw new Error(t('employeePage.validation.focalNoPattern'));
                }
              },
            },
          ]}
          style={{ flex: '0 0 140px', minWidth: 120 }}
        >
          <Input maxLength={FOCAL_NO_MAX_LENGTH} placeholder='M003' />
        </Form.Item>
      </Flex>
      <Form.Item
        name='townshipName'
        label={t('employeePage.fields.townshipName')}
        rules={[
          {
            required: true,
            message: t('employeePage.validation.townshipNameRequired'),
          },
        ]}
      >
        <Input maxLength={255} />
      </Form.Item>
      <Flex gap={12} wrap>
        <Form.Item
          name='position'
          label={t('employeePage.fields.position')}
          rules={[
            {
              required: true,
              message: t('employeePage.validation.positionRequired'),
            },
          ]}
          style={{ flex: 1, minWidth: 160 }}
        >
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item
          name='experience'
          label={t('employeePage.fields.experience')}
          rules={[
            {
              required: true,
              message: t('employeePage.validation.experienceRequired'),
            },
          ]}
          style={{ flex: 1, minWidth: 160 }}
        >
          <Input maxLength={255} />
        </Form.Item>
      </Flex>
      <Flex gap={12} wrap>
        <Form.Item
          name='email'
          label={t('employeePage.fields.email')}
          style={{ flex: 1, minWidth: 160 }}
        >
          <Input maxLength={255} />
        </Form.Item>
        <Form.Item
          name='phone'
          label={t('employeePage.fields.phone')}
          style={{ flex: 1, minWidth: 160 }}
        >
          <Input maxLength={32} />
        </Form.Item>
      </Flex>
      <Flex gap={12} wrap>
        <Form.Item
          name='hireDate'
          label={t('employeePage.fields.hireDate')}
          style={{ flex: 1, minWidth: 160 }}
        >
          <DatePicker style={{ width: '100%' }} format='DD-MMM-YYYY' />
        </Form.Item>
        <Form.Item
          name='endDate'
          label={t('employeePage.fields.endDate')}
          style={{ flex: 1, minWidth: 160 }}
        >
          <DatePicker style={{ width: '100%' }} format='DD-MMM-YYYY' />
        </Form.Item>
      </Flex>
      <Form.Item name='userId' label={t('employeePage.fields.user')}>
        <Select
          allowClear
          showSearch
          loading={usersLoading}
          placeholder={t('employeePage.fields.userPlaceholder')}
          optionFilterProp='label'
          options={userOptions.map((user) => ({
            value: user.id,
            label: `${user.displayName} (${user.username})`,
          }))}
        />
      </Form.Item>
      <Form.Item name='remark' label={t('employeePage.fields.remark')}>
        <Input.TextArea rows={2} maxLength={512} />
      </Form.Item>
    </Form>
  );
}

