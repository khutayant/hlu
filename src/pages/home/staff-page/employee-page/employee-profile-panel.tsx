import { EditOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ImagePickerValue } from '../../../../components/image-picker/image-picker';
import ProfilePicker from '../../../../components/profile-picker/profile-picker';
import {
  updateEmployeeRequest,
  uploadEmployeeProfileImageRequest,
  type Employee,
} from '../../../../handlers/employee.handler';
import { fetchAuthorizedFileUrl } from '../../../../handlers/file.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import { formatDisplayDateTime } from '../../../../tools/format-date.tool';
import { EmployeeFormDialogBody } from './employee-form-dialog';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(110px, 160px) 1fr',
        columnGap: 24,
        rowGap: 4,
        paddingBlock: 14,
        borderBottom: '1px solid rgba(5, 5, 5, 0.08)',
      }}
    >
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 15 }}>{value}</Typography.Text>
    </div>
  );
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD-MMM-YYYY') : value;
}

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function EmployeeProfilePanel({
  employee,
  onChanged,
}: {
  employee: Employee;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { customDialog } = useDialog();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const avatarBlobRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const uuidName = employee.profileImage?.uuidName;

    revokeIfBlob(avatarBlobRef.current);
    avatarBlobRef.current = null;
    setAvatarUrl(null);

    if (!uuidName) {
      return;
    }

    void (async () => {
      try {
        const url = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          revokeIfBlob(url);
          return;
        }
        avatarBlobRef.current = url;
        setAvatarUrl(url);
      } catch {
        if (!cancelled) {
          setAvatarUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      revokeIfBlob(avatarBlobRef.current);
      avatarBlobRef.current = null;
    };
  }, [employee.id, employee.profileImage?.uuidName]);

  const onAvatarChange = async (next: ImagePickerValue) => {
    setSavingAvatar(true);
    try {
      if (!next.file) {
        await updateEmployeeRequest(employee.id, {
          profileImageId: null,
        });
        setPickerKey((key) => key + 1);
        message.success(t('employeePage.profile.avatarCleared'));
        onChanged();
        return;
      }
      const uploaded = await uploadEmployeeProfileImageRequest(next.file);
      await updateEmployeeRequest(employee.id, {
        profileImageId: uploaded.id,
      });
      setPickerKey((key) => key + 1);
      message.success(t('employeePage.profile.avatarSaved'));
      onChanged();
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t('employeePage.profileImageUploadFailed'),
      );
      throw error;
    } finally {
      setSavingAvatar(false);
    }
  };

  const openEdit = useCallback(() => {
    customDialog({
      title: t('employeePage.editTitle'),
      width: 560,
      content: (
        <EmployeeFormDialogBody
          mode='edit'
          initial={employee}
          onSaved={onChanged}
        />
      ),
    });
  }, [customDialog, employee, onChanged, t]);

  const metaLine = [employee.employeeNo, employee.focalNo]
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <Flex
        justify='space-between'
        align='flex-start'
        gap={12}
        style={{ marginBottom: 24 }}
        wrap
      >
        <div>
          <Typography.Title
            level={4}
            style={{ margin: 0, fontWeight: 600 }}
          >
            {t('employeePage.profile.title')}
          </Typography.Title>
          <Typography.Paragraph
            type='secondary'
            style={{ margin: '8px 0 0', fontSize: 14, maxWidth: 520 }}
          >
            {t('employeePage.profile.adminHint')}
          </Typography.Paragraph>
        </div>
        <Button type='primary' icon={<EditOutlined />} onClick={openEdit}>
          {t('employeePage.actions.edit')}
        </Button>
      </Flex>

      <ProfilePicker
        key={pickerKey}
        showCover={false}
        avatarUrl={avatarUrl}
        displayName={
          [employee.title?.name, employee.displayName].filter(Boolean).join(' ')
        }
        username={metaLine}
        avatarLabel={t('employeePage.fields.profileImage')}
        pickProfileLabel={t('employeePage.fields.profileImagePick')}
        removeProfileLabel={t('employeePage.fields.profileImageRemove')}
        cropProfileLabel={t('employeePage.fields.profileImageCrop')}
        usePhotoLabel={t('employeePage.fields.profileImageUse')}
        cancelLabel={t('common.cancel')}
        invalidTypeMessage={t('employeePage.validation.profileImageType')}
        disabled={savingAvatar}
        onAvatarChange={onAvatarChange}
      />

      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Tag color={employee.active ? 'success' : 'default'}>
          {employee.active
            ? t('employeePage.statusActive')
            : t('employeePage.statusInactive')}
        </Tag>
      </div>

      <section>
        <DetailRow
          label={t('employeePage.fields.employeeNo')}
          value={employee.employeeNo}
        />
        <DetailRow
          label={t('employeePage.fields.focalNo')}
          value={employee.focalNo}
        />
        <DetailRow
          label={t('employeePage.fields.title')}
          value={employee.title?.name || '—'}
        />
        <DetailRow
          label={t('employeePage.fields.gender')}
          value={t(`employeePage.gender.${employee.gender}`)}
        />
        <DetailRow
          label={t('employeePage.fields.townshipName')}
          value={employee.township?.name || employee.townshipName || '—'}
        />
        <DetailRow
          label={t('employeePage.fields.position')}
          value={employee.position?.name || employee.positionName || '—'}
        />
        <DetailRow
          label={t('employeePage.fields.experience')}
          value={employee.experience || '—'}
        />
        <DetailRow
          label={t('employeePage.fields.email')}
          value={employee.email || '—'}
        />
        <DetailRow
          label={t('employeePage.fields.phone')}
          value={employee.phone || '—'}
        />
        <DetailRow
          label={t('employeePage.fields.hireDate')}
          value={formatDateOnly(employee.hireDate)}
        />
        <DetailRow
          label={t('employeePage.fields.endDate')}
          value={formatDateOnly(employee.endDate)}
        />
        <DetailRow
          label={t('employeePage.fields.user')}
          value={
            employee.user
              ? `${employee.user.displayName} (${employee.user.username})`
              : '—'
          }
        />
        <DetailRow
          label={t('employeePage.fields.remark')}
          value={employee.remark || '—'}
        />
        <DetailRow
          label={t('employeePage.columns.createdBy')}
          value={
            <>
              {employee.createdBy?.name || '—'}
              <Typography.Text
                type='secondary'
                style={{ display: 'block', fontSize: 12 }}
              >
                {formatDisplayDateTime(employee.createdDate)}
              </Typography.Text>
            </>
          }
        />
        <DetailRow
          label={t('employeePage.columns.updatedBy')}
          value={
            <>
              {employee.updatedBy?.name || '—'}
              <Typography.Text
                type='secondary'
                style={{ display: 'block', fontSize: 12 }}
              >
                {formatDisplayDateTime(employee.updatedDate)}
              </Typography.Text>
            </>
          }
        />
      </section>
    </div>
  );
}
