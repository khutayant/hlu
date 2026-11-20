import {
  CameraOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Slider,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import ImageCropModal from '../profile-picker/image-crop-modal';
import {
  getEmployeeByIdRequest,
  type Employee,
} from '../../handlers/employee.handler';
import {
  createEmployeeSignatureRequest,
  listEmployeeSignaturesRequest,
  updateEmployeeSignatureRequest,
  uploadEmployeeSignatureImageRequest,
  type EmployeeSignature,
  type EmployeeSignatureStyles,
} from '../../handlers/employee-signature.handler';
import { fetchAuthorizedFileUrl } from '../../handlers/file.handler';
import { useDialog } from '../../providers/dialog.provider';
import { useI18n } from '../../providers/i18n.provider';
import { useToast } from '../../providers/toast.provider';

const DEFAULT_SIGNATURE_STYLES: EmployeeSignatureStyles = {
  nameFontSize: 16,
  positionFontSize: 14,
  imageScale: 1,
  textAndImageGap: 12,
};

const BASE_IMAGE_MAX_HEIGHT = 120;

function normalizeSignatureStyles(
  styles: EmployeeSignatureStyles | null | undefined,
): EmployeeSignatureStyles {
  return {
    nameFontSize: styles?.nameFontSize ?? DEFAULT_SIGNATURE_STYLES.nameFontSize,
    positionFontSize:
      styles?.positionFontSize ?? DEFAULT_SIGNATURE_STYLES.positionFontSize,
    imageScale: styles?.imageScale ?? DEFAULT_SIGNATURE_STYLES.imageScale,
    textAndImageGap:
      styles?.textAndImageGap ?? DEFAULT_SIGNATURE_STYLES.textAndImageGap,
  };
}

type SignatureFormValues = {
  name: string;
  signatureName: string;
  signaturePosition: string;
  description?: string;
  primary: boolean;
};

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function SignaturePaperBlock({
  imageUrl,
  signatureName,
  signaturePosition,
  styles,
  emptyLabel,
  style,
}: {
  imageUrl: string | null;
  signatureName: string;
  signaturePosition: string;
  styles?: EmployeeSignatureStyles | null;
  emptyLabel?: string;
  style?: CSSProperties;
}) {
  const resolved = normalizeSignatureStyles(styles);
  const imageMaxHeight = Math.round(BASE_IMAGE_MAX_HEIGHT * resolved.imageScale);

  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px solid rgba(5, 5, 5, 0.08)',
        borderRadius: 8,
        padding: '28px 24px 24px',
        minHeight: 200,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 320,
          width: '100%',
        }}
      >
        <div
          style={{
            minHeight: Math.max(48, Math.round(imageMaxHeight * 0.75)),
            marginBottom: resolved.textAndImageGap,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={signatureName || ''}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: imageMaxHeight,
                objectFit: 'contain',
              }}
            />
          ) : emptyLabel ? (
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {emptyLabel}
            </Typography.Text>
          ) : null}
        </div>
        <Typography.Text
          style={{
            display: 'block',
            fontSize: resolved.nameFontSize,
            fontWeight: 700,
            lineHeight: 1.4,
            minHeight: Math.round(resolved.nameFontSize * 1.4),
            color: 'rgba(0, 0, 0, 0.88)',
          }}
        >
          {signatureName || '\u00a0'}
        </Typography.Text>
        <Typography.Text
          style={{
            display: 'block',
            fontSize: resolved.positionFontSize,
            fontWeight: 700,
            lineHeight: 1.4,
            marginTop: 2,
            minHeight: Math.round(resolved.positionFontSize * 1.4),
            color: 'rgba(0, 0, 0, 0.88)',
          }}
        >
          {signaturePosition || '\u00a0'}
        </Typography.Text>
      </div>
    </div>
  );
}

function EmployeeSignatureEditorForm({
  employee,
  mode,
  initial,
  onSaved,
}: {
  employee: Employee;
  mode: 'create' | 'edit';
  initial?: EmployeeSignature;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<SignatureFormValues>();
  const signatureNameWatch = Form.useWatch('signatureName', form) ?? '';
  const signaturePositionWatch = Form.useWatch('signaturePosition', form) ?? '';
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingImageId, setExistingImageId] = useState<string | null>(
    initial?.signatureImage?.id ?? null,
  );
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [signatureStyles, setSignatureStyles] = useState<EmployeeSignatureStyles>(
    () => normalizeSignatureStyles(initial?.signatureStyles),
  );
  const cropSrcRef = useRef<string | null>(null);
  const previewBlobRef = useRef<string | null>(null);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const defaultName = [employee.title?.name, employee.displayName]
      .filter(Boolean)
      .join(' ');
    const defaultPosition =
      employee.position?.name || employee.positionName || '';

    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        signatureName: initial.signatureName,
        signaturePosition: initial.signaturePosition,
        description: initial.description ?? undefined,
        primary: initial.primary,
      });
      setExistingImageId(initial.signatureImage?.id ?? null);
      setSignatureStyles(normalizeSignatureStyles(initial.signatureStyles));
    } else {
      form.setFieldsValue({
        name: defaultName || 'Signature',
        signatureName: defaultName,
        signaturePosition: defaultPosition,
        description: undefined,
        primary: false,
      });
      setExistingImageId(null);
      setSignatureStyles(DEFAULT_SIGNATURE_STYLES);
    }
  }, [employee, form, initial]);

  useEffect(() => {
    let cancelled = false;
    const uuidName = initial?.signatureImage?.uuidName;
    revokeIfBlob(previewBlobRef.current);
    previewBlobRef.current = null;
    setImagePreviewUrl(null);
    setImageFile(null);
    if (!uuidName || !initial) {
      return;
    }
    void (async () => {
      try {
        const url = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          revokeIfBlob(url);
          return;
        }
        setImagePreviewUrl(url);
      } catch {
        if (!cancelled) {
          setImagePreviewUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
      revokeIfBlob(previewBlobRef.current);
      previewBlobRef.current = null;
    };
  }, [initial?.id, initial?.signatureImage?.uuidName]);

  useEffect(() => {
    return () => {
      revokeIfBlob(cropSrcRef.current);
      cropSrcRef.current = null;
    };
  }, []);

  useEffect(() => {
    setDialogActions(
      <Space>
        <Button onClick={closeDialog}>{t('common.cancel')}</Button>
        <Button
          type='primary'
          loading={saving}
          onClick={() => {
            void form.submit();
          }}
        >
          {mode === 'create'
            ? t('employeeSignaturePanel.createSubmit')
            : t('employeeSignaturePanel.editSubmit')}
        </Button>
      </Space>,
    );
    return () => setDialogActions(undefined);
  }, [closeDialog, form, mode, saving, setDialogActions, t]);

  const clearCropSrc = () => {
    revokeIfBlob(cropSrcRef.current);
    cropSrcRef.current = null;
    setCropSrc(null);
  };

  const beginCrop = (_file: File, objectUrl: string) => {
    revokeIfBlob(cropSrcRef.current);
    cropSrcRef.current = objectUrl;
    setCropSrc(objectUrl);
    setCropOpen(true);
  };

  const onCropCancel = () => {
    setCropOpen(false);
    clearCropSrc();
  };

  const onCropConfirm = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    revokeIfBlob(previewBlobRef.current);
    previewBlobRef.current = objectUrl;
    setImageFile(file);
    setImagePreviewUrl(objectUrl);
    setExistingImageId(null);
    setCropOpen(false);
    clearCropSrc();
  };

  const clearImage = () => {
    revokeIfBlob(previewBlobRef.current);
    previewBlobRef.current = null;
    setImageFile(null);
    setImagePreviewUrl(null);
    setExistingImageId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    beginCrop(file, objectUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFinish = async (values: SignatureFormValues) => {
    setSaving(true);
    try {
      let signatureImageId = existingImageId;
      if (imageFile) {
        const uploaded = await uploadEmployeeSignatureImageRequest(imageFile);
        signatureImageId = uploaded.id;
      }
      if (!signatureImageId) {
        showToast({
          message: t('employeeSignaturePanel.validation.imageRequired'),
          severity: 'error',
        });
        return;
      }

      if (mode === 'create') {
        await createEmployeeSignatureRequest({
          employeeId: employee.id,
          name: values.name.trim(),
          signatureImageId,
          signatureName: values.signatureName.trim(),
          signaturePosition: values.signaturePosition.trim(),
          primary: values.primary,
          description: values.description?.trim() || null,
          signatureStyles,
        });
        showToast({
          message: t('employeeSignaturePanel.createSuccess'),
          severity: 'success',
        });
      } else if (initial) {
        await updateEmployeeSignatureRequest(initial.id, {
          name: values.name.trim(),
          signatureImageId,
          signatureName: values.signatureName.trim(),
          signaturePosition: values.signaturePosition.trim(),
          primary: values.primary,
          description: values.description?.trim() || null,
          signatureStyles,
        });
        showToast({
          message: t('employeeSignaturePanel.editSuccess'),
          severity: 'success',
        });
      }
      onSaved();
      closeDialog();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : mode === 'create'
              ? t('employeeSignaturePanel.createFailed')
              : t('employeeSignaturePanel.editFailed'),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Form
        form={form}
        layout='vertical'
        onFinish={(values) => {
          void onFinish(values);
        }}
        style={{ width: '100%' }}
      >
        <Flex
          gap={20}
          wrap='wrap'
          style={{ width: '100%', alignItems: 'stretch' }}
        >
          <div
            style={{
              flex: '1 1 280px',
              minWidth: 240,
              maxWidth: 420,
            }}
          >
            <Typography.Text
              strong
              style={{ display: 'block', marginBottom: 12, fontSize: 14 }}
            >
              {t('employeeSignaturePanel.sectionInfo')}
            </Typography.Text>
            <Form.Item
              name='name'
              label={t('employeeSignaturePanel.fields.name')}
              rules={[
                {
                  required: true,
                  message: t('employeeSignaturePanel.validation.nameRequired'),
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name='signatureName'
              label={t('employeeSignaturePanel.fields.signatureName')}
              rules={[
                {
                  required: true,
                  message: t(
                    'employeeSignaturePanel.validation.signatureNameRequired',
                  ),
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name='signaturePosition'
              label={t('employeeSignaturePanel.fields.signaturePosition')}
              rules={[
                {
                  required: true,
                  message: t(
                    'employeeSignaturePanel.validation.signaturePositionRequired',
                  ),
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name='primary'
              label={t('employeeSignaturePanel.fields.primary')}
              valuePropName='checked'
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name='description'
              label={t('employeeSignaturePanel.fields.description')}
            >
              <Input.TextArea rows={3} style={{ resize: 'none' }} />
            </Form.Item>
          </div>

          <div
            style={{
              flex: '1 1 320px',
              minWidth: 280,
              borderInlineStart: '1px solid rgba(5, 5, 5, 0.06)',
              paddingInlineStart: 20,
              boxSizing: 'border-box',
            }}
          >
            <Typography.Text
              strong
              style={{ display: 'block', marginBottom: 12, fontSize: 14 }}
            >
              {t('employeeSignaturePanel.sectionSignature')}
            </Typography.Text>
            <Form.Item required style={{ marginBottom: 0 }}>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type='file'
                accept='image/png,image/jpeg,image/webp,image/gif'
                tabIndex={-1}
                aria-hidden
                onChange={onFileInputChange}
                style={{
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
              <div style={{ position: 'relative' }}>
                <SignaturePaperBlock
                  imageUrl={imagePreviewUrl}
                  signatureName={signatureNameWatch}
                  signaturePosition={signaturePositionWatch}
                  styles={signatureStyles}
                  emptyLabel={t(
                    'employeeSignaturePanel.fields.signatureImagePick',
                  )}
                  style={{ minHeight: 240 }}
                />
                <Flex
                  gap={6}
                  style={{
                    position: 'absolute',
                    insetInlineEnd: 10,
                    insetBlockEnd: 10,
                    zIndex: 2,
                  }}
                >
                  <Button
                    type='primary'
                    size='small'
                    shape='round'
                    icon={<CameraOutlined />}
                    aria-label={t(
                      'employeeSignaturePanel.fields.signatureImage',
                    )}
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                  />
                  {imagePreviewUrl ? (
                    <Button
                      size='small'
                      shape='round'
                      danger
                      icon={<DeleteOutlined />}
                      disabled={saving}
                      onClick={clearImage}
                      aria-label='remove image'
                    />
                  ) : null}
                </Flex>
              </div>
              <div style={{ marginTop: 16 }}>
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  {t('employeeSignaturePanel.styles.imageScale')}
                </Typography.Text>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={signatureStyles.imageScale}
                  disabled={saving}
                  onChange={(value) => {
                    setSignatureStyles((prev) => ({
                      ...prev,
                      imageScale: value,
                    }));
                  }}
                />
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  {t('employeeSignaturePanel.styles.textAndImageGap')}
                </Typography.Text>
                <Slider
                  min={0}
                  max={48}
                  step={1}
                  value={signatureStyles.textAndImageGap}
                  disabled={saving}
                  onChange={(value) => {
                    setSignatureStyles((prev) => ({
                      ...prev,
                      textAndImageGap: value,
                    }));
                  }}
                />
              </div>
            </Form.Item>
          </div>
        </Flex>
      </Form>
      <ImageCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        title={t('employeeSignaturePanel.fields.signatureImageCrop')}
        confirmText={t('employeeSignaturePanel.fields.signatureImageUse')}
        cancelText={t('common.cancel')}
        cropShape='rect'
        freeResize
        mimeType='image/png'
        fileName='employee-signature.png'
        transparencyGrid
        width={720}
        zoomLabel={t('employeeSignaturePanel.crop.zoom')}
        onCancel={onCropCancel}
        onConfirm={onCropConfirm}
      />
    </>
  );
}

function SignaturePaperPreviewBody({
  signature,
}: {
  signature: EmployeeSignature;
}) {
  const { t } = useI18n();
  const { closeDialog, setDialogActions } = useDialog();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setDialogActions(
      <Button type='primary' onClick={closeDialog}>
        {t('common.close')}
      </Button>,
    );
    return () => setDialogActions(undefined);
  }, [closeDialog, setDialogActions, t]);

  useEffect(() => {
    let cancelled = false;
    const uuidName = signature.signatureImage?.uuidName;
    setUrl(null);
    if (!uuidName) {
      return;
    }
    void (async () => {
      try {
        const next = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          revokeIfBlob(next);
          return;
        }
        setUrl(next);
      } catch {
        if (!cancelled) {
          setUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signature.id, signature.signatureImage?.uuidName]);

  return (
    <SignaturePaperBlock
      imageUrl={url}
      signatureName={signature.signatureName}
      signaturePosition={signature.signaturePosition}
      styles={signature.signatureStyles}
    />
  );
}

function SignatureViewCard({
  row,
  selected,
  selectable,
  onSelect,
}: {
  row: EmployeeSignature;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const uuidName = row.signatureImage?.uuidName;
    setUrl(null);
    if (!uuidName) {
      return;
    }
    void (async () => {
      try {
        const next = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          revokeIfBlob(next);
          return;
        }
        setUrl(next);
      } catch {
        if (!cancelled) {
          setUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.id, row.signatureImage?.uuidName]);

  return (
    <div
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? onSelect : undefined}
      onKeyDown={
        selectable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      style={{
        border: selected
          ? '2px solid #1677ff'
          : '1px solid rgba(5, 5, 5, 0.08)',
        borderRadius: 6,
        padding: 8,
        boxSizing: 'border-box',
        cursor: selectable ? 'pointer' : 'default',
        background: selected ? 'rgba(22, 119, 255, 0.04)' : '#fff',
        height: '100%',
      }}
    >
      <Flex
        justify='space-between'
        align='center'
        gap={4}
        style={{ marginBottom: 6 }}
      >
        <Typography.Text
          strong
          style={{
            fontSize: 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.name || undefined}
        >
          {row.name || '—'}
        </Typography.Text>
        {row.primary ? (
          <Tag color='blue' style={{ marginInlineEnd: 0, fontSize: 11 }}>
            {t('employeeSignaturePanel.primaryBadge')}
          </Tag>
        ) : null}
      </Flex>
      <SignaturePaperBlock
        imageUrl={url}
        signatureName={row.signatureName}
        signaturePosition={row.signaturePosition}
        styles={{
          nameFontSize: 11,
          positionFontSize: 10,
          imageScale: 0.4,
          textAndImageGap: 4,
        }}
        style={{
          minHeight: 96,
          padding: '10px 8px 8px',
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function EmployeeSignaturesViewBody({
  employeeId,
  currentSignatureId,
  onUse,
  registerReload,
}: {
  employeeId: string;
  currentSignatureId?: string | null;
  onUse?: (signature: EmployeeSignature) => void;
  registerReload?: (reload: () => void) => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [items, setItems] = useState<EmployeeSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    currentSignatureId ?? null,
  );
  const canPick = Boolean(onUse);

  useEffect(() => {
    registerReload?.(() => setReloadKey((key) => key + 1));
  }, [registerReload]);

  useEffect(() => {
    setSelectedId(currentSignatureId ?? null);
  }, [currentSignatureId]);

  useEffect(() => {
    const selected = items.find((item) => item.id === selectedId) ?? null;
    setDialogActions(
      <Space>
        <Button onClick={closeDialog}>{t('common.cancel')}</Button>
        {canPick ? (
          <Button
            type='primary'
            disabled={!selected}
            onClick={() => {
              if (!selected) {
                return;
              }
              onUse?.(selected);
              closeDialog();
            }}
          >
            {t('employeeSignaturePanel.useSubmit')}
          </Button>
        ) : (
          <Button type='primary' onClick={closeDialog}>
            {t('common.close')}
          </Button>
        )}
      </Space>,
    );
    return () => setDialogActions(undefined);
  }, [
    canPick,
    closeDialog,
    items,
    onUse,
    selectedId,
    setDialogActions,
    t,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await listEmployeeSignaturesRequest({
          employeeId,
          page: 1,
          limit: 100,
          active: true,
        });
        if (!cancelled) {
          setItems(result.items);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('employeeSignaturePanel.loadFailed'),
            severity: 'error',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId, reloadKey, showToast, t]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('employeeSignaturePanel.empty')}
      />
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 10,
        width: '100%',
      }}
    >
      {items.map((row) => (
        <SignatureViewCard
          key={row.id}
          row={row}
          selectable={canPick}
          selected={selectedId === row.id}
          onSelect={() => setSelectedId(row.id)}
        />
      ))}
    </div>
  );
}

/**
 * Open the shared signature create/edit/view dialog from anywhere.
 * Pass `employeeId` (fetches employee when needed) or a loaded `employee`.
 */
export function useEmployeeSignatureEditor() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();

  const openCreate = async (options: {
    employeeId: string;
    employee?: Employee;
    onSaved?: () => void;
  }) => {
    try {
      const employee =
        options.employee ??
        (await getEmployeeByIdRequest(options.employeeId));
      customDialog({
        title: t('employeeSignaturePanel.createTitle'),
        width: 920,
        content: (
          <EmployeeSignatureEditorForm
            employee={employee}
            mode='create'
            onSaved={() => options.onSaved?.()}
          />
        ),
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeeSignaturePanel.createFailed'),
        severity: 'error',
      });
    }
  };

  const openEdit = async (options: {
    employeeId: string;
    employee?: Employee;
    initial: EmployeeSignature;
    onSaved?: () => void;
  }) => {
    try {
      const employee =
        options.employee ??
        (await getEmployeeByIdRequest(options.employeeId));
      customDialog({
        title: t('employeeSignaturePanel.editTitle'),
        width: 920,
        content: (
          <EmployeeSignatureEditorForm
            employee={employee}
            mode='edit'
            initial={options.initial}
            onSaved={() => options.onSaved?.()}
          />
        ),
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeeSignaturePanel.editFailed'),
        severity: 'error',
      });
    }
  };

  const openView = async (options: {
    employeeId: string;
    employee?: Employee;
    currentSignatureId?: string | null;
    onUse?: (signature: EmployeeSignature) => void;
    onSaved?: () => void;
  }) => {
    try {
      const employee =
        options.employee ??
        (await getEmployeeByIdRequest(options.employeeId));
      const name = [employee.title?.name, employee.displayName]
        .filter(Boolean)
        .join(' ');
      const titleText = t('employeeSignaturePanel.viewTitle', {
        name: name || employee.displayName || '—',
      });
      const reloadListRef = { current: () => {} };

      customDialog({
        title: (
          <Flex
            align='center'
            justify='space-between'
            gap={12}
            style={{ width: '100%', paddingInlineEnd: 4 }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {titleText}
            </span>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => {
                // Push create on top — list viewer stays open underneath.
                customDialog({
                  title: t('employeeSignaturePanel.createTitle'),
                  width: 920,
                  content: (
                    <EmployeeSignatureEditorForm
                      employee={employee}
                      mode='create'
                      onSaved={() => {
                        options.onSaved?.();
                        reloadListRef.current();
                      }}
                    />
                  ),
                });
              }}
            >
              {t('employeeSignaturePanel.addNew')}
            </Button>
          </Flex>
        ),
        width: 920,
        height: '80vh',
        content: (
          <EmployeeSignaturesViewBody
            employeeId={employee.id}
            currentSignatureId={options.currentSignatureId}
            onUse={options.onUse}
            registerReload={(reload) => {
              reloadListRef.current = reload;
            }}
          />
        ),
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeeSignaturePanel.loadFailed'),
        severity: 'error',
      });
    }
  };

  const openPreview = (signature: EmployeeSignature) => {
    customDialog({
      title: t('employeeSignaturePanel.paperPreviewTitle'),
      width: 420,
      content: <SignaturePaperPreviewBody signature={signature} />,
    });
  };

  return { openCreate, openEdit, openView, openPreview };
}
