import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Key,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createEmployeeRequest,
  findExistingEmployeeFocalNosRequest,
} from '../../../../handlers/employee.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import {
  EMPLOYEE_GENDERS,
  EMPLOYEE_IMPORT_TEMPLATE_CSV,
  FOCAL_NO_MAX_LENGTH,
  isEmployeeImportRowValid,
  normalizeFocalNo,
  parseEmployeeImportCsv,
  toCreateEmployeeInput,
  validateEmployeeImportRows,
  type EmployeeImportColumn,
  type EmployeeImportMessages,
  type EmployeeImportRow,
  type EmployeeImportValidity,
} from './employee-import.tool';

type ValidityFilter = 'valid' | 'invalid';

const CELL_CONTROL_STYLE: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  overflowX: 'auto',
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
  lineHeight: '22px',
  height: 24,
};

function errorCellProps(hasError: boolean) {
  return hasError ? { className: 'employee-import-cell-invalid' } : {};
}

const IMPORT_ERROR_FIELD_ORDER: EmployeeImportColumn[] = [
  'displayName',
  'focalNo',
  'gender',
  'townshipName',
  'position',
  'experience',
  'email',
  'phone',
  'hireDate',
  'endDate',
  'remark',
];

function buildStatusErrorTooltip(
  row: EmployeeImportRow,
  fieldLabel: (field: EmployeeImportColumn) => string,
): ReactNode {
  const lines: string[] = [];
  for (const field of IMPORT_ERROR_FIELD_ORDER) {
    const message = row.errors[field];
    if (message) {
      lines.push(`${fieldLabel(field)}: ${message}`);
    }
  }
  if (row.importError) {
    lines.push(row.importError);
  }
  if (lines.length === 0) {
    return null;
  }
  return (
    <div style={{ maxWidth: 320 }}>
      {lines.map((line) => (
        <div key={line} style={{ marginBottom: 4 }}>
          {line}
        </div>
      ))}
    </div>
  );
}

function ErrorCell({
  value,
  error,
  disabled,
  maxLength,
  onChange,
}: {
  value: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  onChange: (next: string) => void;
}) {
  const input = (
    <Input
      size='small'
      value={value}
      status={error ? 'error' : undefined}
      disabled={disabled}
      maxLength={maxLength}
      onChange={(event) =>
        onChange(event.target.value.replace(/[\r\n]+/g, ' '))
      }
      style={CELL_CONTROL_STYLE}
    />
  );

  if (!error) {
    return input;
  }

  return (
    <Tooltip title={error} color='red'>
      <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        {input}
      </div>
    </Tooltip>
  );
}

function EmployeeImportPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const { confirmDialog } = useDialog();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<EmployeeImportRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [validityFilter, setValidityFilter] =
    useState<ValidityFilter>('invalid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<EmployeeImportRow | null>(null);
  const [editRow, setEditRow] = useState<EmployeeImportRow | null>(null);
  const [editForm] = Form.useForm<Record<EmployeeImportColumn, string>>();

  const messages = useMemo<EmployeeImportMessages>(
    () => ({
      displayNameRequired: t('employeePage.validation.displayNameRequired'),
      focalNoRequired: t('employeePage.validation.focalNoRequired'),
      focalNoPattern: t('employeePage.validation.focalNoPattern'),
      focalNoMaxLength: t('employeePage.validation.focalNoMaxLength'),
      focalNoDuplicateFile: t('employeePage.import.focalNoDuplicateFile'),
      focalNoDuplicateDb: t('employeePage.import.focalNoDuplicateDb'),
      genderRequired: t('employeePage.validation.genderRequired'),
      genderInvalid: t('employeePage.validation.genderInvalid'),
      townshipNameRequired: t('employeePage.validation.townshipNameRequired'),
      positionRequired: t('employeePage.validation.positionRequired'),
      experienceRequired: t('employeePage.validation.experienceRequired'),
      emailInvalid: t('employeePage.import.emailInvalid'),
      dateInvalid: t('employeePage.import.dateInvalid'),
    }),
    [t],
  );

  const title = t('employeePage.import.title');
  const description = t('employeePage.import.description');

  const revalidate = (nextRows: EmployeeImportRow[]) =>
    validateEmployeeImportRows(nextRows, messages);

  useEffect(() => {
    setRows((current) =>
      current.length ? validateEmployeeImportRows(current, messages) : current,
    );
  }, [messages]);

  const validCount = useMemo(
    () => rows.filter((row) => isEmployeeImportRowValid(row)).length,
    [rows],
  );
  const invalidCount = rows.length - validCount;

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const valid = isEmployeeImportRowValid(row);
      return validityFilter === 'valid' ? valid : !valid;
    });
  }, [rows, validityFilter]);

  const updateField = (
    key: string,
    field: EmployeeImportColumn,
    value: string,
  ) => {
    setRows((current) =>
      revalidate(
        current.map((row) =>
          row.key === key
            ? { ...row, [field]: value, importError: null }
            : row,
        ),
      ),
    );
  };

  const openDetail = (row: EmployeeImportRow) => {
    setDetailRow(row);
  };

  const openEdit = (row: EmployeeImportRow) => {
    setEditRow(row);
    editForm.setFieldsValue({
      displayName: row.displayName,
      focalNo: row.focalNo,
      gender: row.gender,
      townshipName: row.townshipName,
      position: row.position,
      experience: row.experience,
      email: row.email,
      phone: row.phone,
      hireDate: row.hireDate,
      endDate: row.endDate,
      remark: row.remark,
    });
  };

  const closeEdit = () => {
    setEditRow(null);
    editForm.resetFields();
  };

  const saveEdit = async () => {
    if (!editRow) {
      return;
    }
    const values = await editForm.validateFields();
    setRows((current) =>
      revalidate(
        current.map((row) =>
          row.key === editRow.key
            ? {
                ...row,
                displayName: values.displayName ?? '',
                focalNo: (values.focalNo ?? '').toUpperCase(),
                gender: values.gender ?? '',
                townshipName: values.townshipName ?? '',
                position: values.position ?? '',
                experience: values.experience ?? '',
                email: values.email ?? '',
                phone: values.phone ?? '',
                hireDate: values.hireDate ?? '',
                endDate: values.endDate ?? '',
                remark: values.remark ?? '',
                importError: null,
              }
            : row,
        ),
      ),
    );
    closeEdit();
  };

  const removeRow = (key: string) => {
    setRows((current) => revalidate(current.filter((row) => row.key !== key)));
    setSelectedRowKeys((current) => current.filter((item) => item !== key));
  };

  const removeSelectedRows = () => {
    if (selectedRowKeys.length === 0) {
      return;
    }
    const removeKeys = new Set(selectedRowKeys.map(String));
    setRows((current) =>
      revalidate(current.filter((row) => !removeKeys.has(row.key))),
    );
    setSelectedRowKeys([]);
    setPage(1);
  };

  const rowSelection: TableRowSelection<EmployeeImportRow> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: () => ({ disabled: importing }),
  };

  const actionsTitle = t('employeePage.import.actionsColumn');

  const onPickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseEmployeeImportCsv(text);
      if (parsed.length === 0) {
        showToast({
          message: t('employeePage.import.emptyFile'),
          severity: 'warning',
        });
        return;
      }
      // Local validation only — DB focal check runs at Import time.
      setFileName(file.name);
      setRows(validateEmployeeImportRows(parsed, messages));
      setSelectedRowKeys([]);
      setValidityFilter('invalid');
      setPage(1);
    } catch (error) {
      showToast({
        message:
          error instanceof Error && error.message === 'NO_KNOWN_COLUMNS'
            ? t('employeePage.import.unknownColumns')
            : error instanceof Error
              ? error.message
              : t('employeePage.import.parseFailed'),
        severity: 'error',
      });
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([EMPLOYEE_IMPORT_TEMPLATE_CSV], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'employee-import-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async () => {
    let checkedRows = validateEmployeeImportRows(rows, messages);
    setRows(checkedRows);

    let validRows = checkedRows.filter((row) =>
      isEmployeeImportRowValid(row),
    );
    if (validRows.length === 0) {
      showToast({
        message: t('employeePage.import.noValidRows'),
        severity: 'warning',
      });
      return;
    }

    const confirmedImport = await confirmDialog({
      title: t('employeePage.import.confirmTitle'),
      message: t('employeePage.import.confirmMessage', {
        count: validRows.length,
      }),
      okText: t('employeePage.import.confirmOk'),
      cancelText: t('common.cancel'),
    });
    if (!confirmedImport) {
      return;
    }

    setImporting(true);
    try {
      // Skip server focal duplicates — mark those rows invalid, import the rest.
      const focalNos = [
        ...new Set(
          validRows
            .map((row) => normalizeFocalNo(row.focalNo))
            .filter(Boolean),
        ),
      ];
      const duplicates =
        focalNos.length > 0
          ? await findExistingEmployeeFocalNosRequest(focalNos)
          : [];
      const duplicateSet = new Set(duplicates);

      if (duplicateSet.size > 0) {
        checkedRows = validateEmployeeImportRows(
          checkedRows,
          messages,
          duplicateSet,
        );
        setRows(checkedRows);
        validRows = checkedRows.filter((row) =>
          isEmployeeImportRowValid(row),
        );
      }

      const skippedDbDupCount = checkedRows.filter((row) => {
        const focalNo = normalizeFocalNo(row.focalNo);
        return (
          Boolean(focalNo) &&
          duplicateSet.has(focalNo) &&
          row.errors.focalNo === messages.focalNoDuplicateDb
        );
      }).length;

      if (validRows.length === 0) {
        setSelectedRowKeys([]);
        setValidityFilter('invalid');
        setPage(1);
        showToast({
          message:
            skippedDbDupCount > 0
              ? t('employeePage.import.noValidRowsAfterDbCheck', {
                  count: skippedDbDupCount,
                })
              : t('employeePage.import.noValidRows'),
          severity: 'warning',
        });
        return;
      }

      const otherInvalidCount =
        checkedRows.length - validRows.length - skippedDbDupCount;
      if (otherInvalidCount > 0) {
        const confirmed = await confirmDialog({
          title: t('employeePage.import.confirmIgnoreInvalidTitle'),
          message: t('employeePage.import.confirmIgnoreInvalidMessage', {
            invalid: otherInvalidCount,
            valid: validRows.length,
          }),
          okText: t('employeePage.import.confirmIgnoreInvalidOk'),
          cancelText: t('common.cancel'),
          danger: true,
        });
        if (!confirmed) {
          setValidityFilter('invalid');
          setPage(1);
          return;
        }
      }

      const successKeys = new Set<string>();
      const failureMap = new Map<string, string>();

      for (const row of validRows) {
        try {
          await createEmployeeRequest(toCreateEmployeeInput(row));
          successKeys.add(row.key);
        } catch (error) {
          failureMap.set(
            row.key,
            error instanceof Error
              ? error.message
              : t('employeePage.import.rowFailed'),
          );
        }
      }

      const remainingBase = checkedRows
        .filter((row) => !successKeys.has(row.key))
        .map((row) =>
          failureMap.has(row.key)
            ? { ...row, importError: failureMap.get(row.key) ?? null }
            : row,
        );

      if (remainingBase.length > 0) {
        setRows(validateEmployeeImportRows(remainingBase, messages, duplicateSet));
        setSelectedRowKeys([]);
        setValidityFilter('invalid');
        setPage(1);
        if (successKeys.size > 0) {
          showToast({
            message: t('employeePage.import.importSuccess', {
              count: successKeys.size,
            }),
            severity: 'success',
          });
        }
        if (skippedDbDupCount > 0) {
          showToast({
            message: t('employeePage.import.skippedDbDuplicates', {
              count: skippedDbDupCount,
            }),
            severity: 'warning',
          });
        }
        if (failureMap.size > 0) {
          showToast({
            message: t('employeePage.import.importPartialFailed', {
              count: failureMap.size,
            }),
            severity: 'error',
          });
        }
        return;
      }

      setRows([]);
      setSelectedRowKeys([]);
      setFileName(null);
      setPage(1);
      showToast({
        message: t('employeePage.import.importSuccess', {
          count: successKeys.size,
        }),
        severity: 'success',
      });
      navigate('/staff/employee');
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeePage.import.checkDuplicatesFailed'),
        severity: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Space style={{ marginInlineStart: 'auto', flexShrink: 0 }}>
        <Button
          type='primary'
          icon={<ImportOutlined />}
          loading={importing}
          disabled={importing || validCount === 0}
          onClick={() => void onImport()}
        >
          {t('employeePage.import.importAction', { count: validCount })}
        </Button>
        <Button onClick={() => navigate('/staff/employee')}>
          {t('common.close')}
        </Button>
      </Space>
    </>,
    [title, description, navigate, t, importing, validCount],
  );

  const columns: ColumnsType<EmployeeImportRow> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_value, _row, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: t('employeePage.fields.displayName'),
      dataIndex: 'displayName',
      width: 180,
      onCell: (row) => errorCellProps(Boolean(row.errors.displayName)),
      render: (_value, row) => (
        <ErrorCell
          value={row.displayName}
          error={row.errors.displayName}
          disabled={importing}
          maxLength={255}
          onChange={(next) => updateField(row.key, 'displayName', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.focalNo'),
      dataIndex: 'focalNo',
      width: 120,
      onCell: (row) => errorCellProps(Boolean(row.errors.focalNo)),
      render: (_value, row) => (
        <ErrorCell
          value={row.focalNo}
          error={row.errors.focalNo}
          disabled={importing}
          maxLength={FOCAL_NO_MAX_LENGTH}
          onChange={(next) =>
            updateField(row.key, 'focalNo', next.toUpperCase())
          }
        />
      ),
    },
    {
      title: t('employeePage.fields.gender'),
      dataIndex: 'gender',
      width: 130,
      onCell: (row) => errorCellProps(Boolean(row.errors.gender)),
      render: (_value, row) => {
        const select = (
          <Select
            size='small'
            value={row.gender || undefined}
            status={row.errors.gender ? 'error' : undefined}
            disabled={importing}
            style={CELL_CONTROL_STYLE}
            placeholder={t('employeePage.fields.gender')}
            options={EMPLOYEE_GENDERS.map((value) => ({
              value,
              label: t(`employeePage.gender.${value}`),
            }))}
            onChange={(next) => updateField(row.key, 'gender', next)}
          />
        );
        if (!row.errors.gender) {
          return select;
        }
        return (
          <Tooltip title={row.errors.gender} color='red'>
            <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
              {select}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t('employeePage.fields.townshipName'),
      dataIndex: 'townshipName',
      width: 160,
      onCell: (row) => errorCellProps(Boolean(row.errors.townshipName)),
      render: (_value, row) => (
        <ErrorCell
          value={row.townshipName}
          error={row.errors.townshipName}
          disabled={importing}
          maxLength={255}
          onChange={(next) => updateField(row.key, 'townshipName', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.position'),
      dataIndex: 'position',
      width: 150,
      onCell: (row) => errorCellProps(Boolean(row.errors.position)),
      render: (_value, row) => (
        <ErrorCell
          value={row.position}
          error={row.errors.position}
          disabled={importing}
          maxLength={255}
          onChange={(next) => updateField(row.key, 'position', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.experience'),
      dataIndex: 'experience',
      width: 130,
      onCell: (row) => errorCellProps(Boolean(row.errors.experience)),
      render: (_value, row) => (
        <ErrorCell
          value={row.experience}
          error={row.errors.experience}
          disabled={importing}
          maxLength={255}
          onChange={(next) => updateField(row.key, 'experience', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.email'),
      dataIndex: 'email',
      width: 200,
      onCell: (row) => errorCellProps(Boolean(row.errors.email)),
      render: (_value, row) => (
        <ErrorCell
          value={row.email}
          error={row.errors.email}
          disabled={importing}
          maxLength={255}
          onChange={(next) => updateField(row.key, 'email', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.phone'),
      dataIndex: 'phone',
      width: 140,
      render: (_value, row) => (
        <ErrorCell
          value={row.phone}
          disabled={importing}
          maxLength={32}
          onChange={(next) => updateField(row.key, 'phone', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.hireDate'),
      dataIndex: 'hireDate',
      width: 130,
      onCell: (row) => errorCellProps(Boolean(row.errors.hireDate)),
      render: (_value, row) => (
        <ErrorCell
          value={row.hireDate}
          error={row.errors.hireDate}
          disabled={importing}
          maxLength={10}
          onChange={(next) => updateField(row.key, 'hireDate', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.endDate'),
      dataIndex: 'endDate',
      width: 130,
      onCell: (row) => errorCellProps(Boolean(row.errors.endDate)),
      render: (_value, row) => (
        <ErrorCell
          value={row.endDate}
          error={row.errors.endDate}
          disabled={importing}
          maxLength={10}
          onChange={(next) => updateField(row.key, 'endDate', next)}
        />
      ),
    },
    {
      title: t('employeePage.fields.remark'),
      dataIndex: 'remark',
      width: 160,
      render: (_value, row) => (
        <ErrorCell
          value={row.remark}
          disabled={importing}
          maxLength={512}
          onChange={(next) => updateField(row.key, 'remark', next)}
        />
      ),
    },
    {
      title: t('employeePage.import.status'),
      key: 'status',
      width: 100,
      fixed: 'right',
      align: 'center',
      onCell: (row) => errorCellProps(!isEmployeeImportRowValid(row)),
      render: (_value, row) => {
        const valid = isEmployeeImportRowValid(row);
        if (valid) {
          return (
            <Tag icon={<CheckCircleOutlined />} color='success'>
              {t('employeePage.import.filterValid')}
            </Tag>
          );
        }
        const tip = buildStatusErrorTooltip(row, (field) =>
          t(`employeePage.fields.${field}`),
        );
        return (
          <Tooltip
            title={tip}
            color='red'
            placement='left'
            styles={{ root: { maxWidth: 360 } }}
          >
            <span
              style={{
                display: 'inline-flex',
                cursor: 'help',
                maxWidth: '100%',
              }}
            >
              <Tag icon={<WarningOutlined />} color='error'>
                {t('employeePage.import.filterInvalid')}
              </Tag>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: actionsTitle,
      key: 'actions',
      width: 88,
      fixed: 'right',
      align: 'center',
      onHeaderCell: () => ({
        style: {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingInline: 4,
        },
      }),
      render: (_value, row) => (
        <Space size={0}>
          <Button
            type='text'
            size='small'
            danger
            disabled={importing}
            icon={<DeleteOutlined />}
            aria-label={t('employeePage.import.actions.remove')}
            onClick={() => removeRow(row.key)}
          />
          <Dropdown
            trigger={['click']}
            disabled={importing}
            menu={{
              items: [
                {
                  key: 'detail',
                  icon: <EyeOutlined />,
                  label: t('employeePage.import.actions.detail'),
                  onClick: () => openDetail(row),
                },
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: t('employeePage.import.actions.edit'),
                  onClick: () => openEdit(row),
                },
              ],
            }}
          >
            <Button
              type='text'
              size='small'
              icon={<MoreOutlined />}
              disabled={importing}
              aria-label={t('employeePage.import.actions.menu')}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        padding: token.paddingLG,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
      }}
    >
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        <Flex wrap gap={8} justify='space-between' align='center'>
          <Segmented
            value={validityFilter}
            options={[
              {
                label: `${t('employeePage.import.filterValid')} (${validCount})`,
                value: 'valid' satisfies EmployeeImportValidity,
              },
              {
                label: `${t('employeePage.import.filterInvalid')} (${invalidCount})`,
                value: 'invalid' satisfies EmployeeImportValidity,
              },
            ]}
            onChange={(value) => {
              setValidityFilter(value as ValidityFilter);
              setSelectedRowKeys([]);
              setPage(1);
            }}
          />
          <Flex wrap gap={8} align='center'>
            {fileName ? (
              <Typography.Text type='secondary' style={{ fontSize: 13 }}>
                {fileName} · {t('employeePage.import.rowCount', {
                  count: rows.length,
                })}
              </Typography.Text>
            ) : null}
            <Tooltip title={t('employeePage.import.infoButton')}>
              <Button
                icon={<InfoCircleOutlined />}
                aria-label={t('employeePage.import.infoButton')}
                disabled={importing}
                onClick={() => setInfoOpen(true)}
              />
            </Tooltip>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
              disabled={importing}
            >
              {t('employeePage.import.downloadTemplate')}
            </Button>
            <Button
              type='primary'
              icon={<UploadOutlined />}
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('employeePage.import.pickFile')}
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv,text/csv'
              style={{ display: 'none' }}
              onChange={(event) => void onPickFile(event)}
            />
          </Flex>
        </Flex>

        <Modal
          open={infoOpen}
          title={t('employeePage.import.infoTitle')}
          onCancel={() => setInfoOpen(false)}
          footer={
            <Button type='primary' onClick={() => setInfoOpen(false)}>
              {t('common.ok')}
            </Button>
          }
          width={640}
          destroyOnHidden
          centered
        >
          <Space direction='vertical' size={16} style={{ width: '100%' }}>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {t('employeePage.import.infoIntro')}
            </Typography.Paragraph>

            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {t('employeePage.import.infoMandatoryTitle')}
              </Typography.Title>
              <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                <li>
                  <Typography.Text code>displayName</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.displayName')}
                </li>
                <li>
                  <Typography.Text code>focalNo</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.focalNo')}
                  {'. '}
                  {t('employeePage.fields.focalNoHint')}
                </li>
                <li>
                  <Typography.Text code>gender</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.gender')}
                  {': '}
                  <Typography.Text code>MALE</Typography.Text>
                  {' | '}
                  <Typography.Text code>FEMALE</Typography.Text>
                  {' | '}
                  <Typography.Text code>OTHER</Typography.Text>
                </li>
                <li>
                  <Typography.Text code>townshipName</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.townshipName')}
                </li>
                <li>
                  <Typography.Text code>position</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.position')}
                </li>
                <li>
                  <Typography.Text code>experience</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.experience')}
                </li>
              </ul>
            </div>

            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {t('employeePage.import.infoOptionalTitle')}
              </Typography.Title>
              <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                <li>
                  <Typography.Text code>email</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.email')}
                </li>
                <li>
                  <Typography.Text code>phone</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.phone')}
                </li>
                <li>
                  <Typography.Text code>hireDate</Typography.Text>
                  {' / '}
                  <Typography.Text code>endDate</Typography.Text>
                  {' — '}
                  {t('employeePage.import.infoDateRule')}
                </li>
                <li>
                  <Typography.Text code>remark</Typography.Text>
                  {' — '}
                  {t('employeePage.fields.remark')}
                </li>
              </ul>
            </div>

            <div>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                {t('employeePage.import.infoStepsTitle')}
              </Typography.Title>
              <ol style={{ margin: 0, paddingInlineStart: 20 }}>
                <li>{t('employeePage.import.infoStep1')}</li>
                <li>{t('employeePage.import.infoStep2')}</li>
                <li>{t('employeePage.import.infoStep3')}</li>
              </ol>
            </div>
          </Space>
        </Modal>

        <Modal
          open={detailRow !== null}
          title={t('employeePage.import.detailTitle')}
          onCancel={() => setDetailRow(null)}
          footer={
            <Button type='primary' onClick={() => setDetailRow(null)}>
              {t('common.ok')}
            </Button>
          }
          width={560}
          destroyOnHidden
          centered
        >
          {detailRow ? (
            <Descriptions
              size='small'
              column={1}
              bordered
              items={[
                {
                  key: 'displayName',
                  label: t('employeePage.fields.displayName'),
                  children: detailRow.displayName || '—',
                },
                {
                  key: 'focalNo',
                  label: t('employeePage.fields.focalNo'),
                  children: detailRow.focalNo || '—',
                },
                {
                  key: 'gender',
                  label: t('employeePage.fields.gender'),
                  children: (
                    EMPLOYEE_GENDERS as readonly string[]
                  ).includes(detailRow.gender)
                    ? t(`employeePage.gender.${detailRow.gender}`)
                    : detailRow.gender || '—',
                },
                {
                  key: 'townshipName',
                  label: t('employeePage.fields.townshipName'),
                  children: detailRow.townshipName || '—',
                },
                {
                  key: 'position',
                  label: t('employeePage.fields.position'),
                  children: detailRow.position || '—',
                },
                {
                  key: 'experience',
                  label: t('employeePage.fields.experience'),
                  children: detailRow.experience || '—',
                },
                {
                  key: 'email',
                  label: t('employeePage.fields.email'),
                  children: detailRow.email || '—',
                },
                {
                  key: 'phone',
                  label: t('employeePage.fields.phone'),
                  children: detailRow.phone || '—',
                },
                {
                  key: 'hireDate',
                  label: t('employeePage.fields.hireDate'),
                  children: detailRow.hireDate || '—',
                },
                {
                  key: 'endDate',
                  label: t('employeePage.fields.endDate'),
                  children: detailRow.endDate || '—',
                },
                {
                  key: 'remark',
                  label: t('employeePage.fields.remark'),
                  children: detailRow.remark || '—',
                },
                {
                  key: 'status',
                  label: t('employeePage.import.status'),
                  children: isEmployeeImportRowValid(detailRow)
                    ? t('employeePage.import.filterValid')
                    : t('employeePage.import.filterInvalid'),
                },
              ]}
            />
          ) : null}
        </Modal>

        <Modal
          open={editRow !== null}
          title={t('employeePage.import.editTitle')}
          onCancel={closeEdit}
          onOk={() => void saveEdit()}
          okText={t('common.ok')}
          cancelText={t('common.cancel')}
          width={560}
          destroyOnHidden
          centered
          maskClosable={false}
        >
          <Form
            form={editForm}
            layout='vertical'
            requiredMark
            style={{ marginTop: 8 }}
          >
            <Form.Item
              name='displayName'
              label={t('employeePage.fields.displayName')}
              rules={[
                {
                  required: true,
                  message: t('employeePage.validation.displayNameRequired'),
                },
              ]}
            >
              <Input maxLength={255} />
            </Form.Item>
            <Flex gap={12} wrap>
              <Form.Item
                name='focalNo'
                label={t('employeePage.fields.focalNo')}
                normalize={(value: string) =>
                  typeof value === 'string' ? value.toUpperCase() : value
                }
                rules={[
                  {
                    required: true,
                    message: t('employeePage.validation.focalNoRequired'),
                  },
                ]}
                style={{ flex: 1, minWidth: 140 }}
              >
                <Input maxLength={FOCAL_NO_MAX_LENGTH} />
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
                style={{ flex: 1, minWidth: 140 }}
              >
                <Select
                  options={EMPLOYEE_GENDERS.map((value) => ({
                    value,
                    label: t(`employeePage.gender.${value}`),
                  }))}
                />
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
                style={{ flex: 1, minWidth: 140 }}
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
                style={{ flex: 1, minWidth: 140 }}
              >
                <Input maxLength={255} />
              </Form.Item>
            </Flex>
            <Flex gap={12} wrap>
              <Form.Item
                name='email'
                label={t('employeePage.fields.email')}
                style={{ flex: 1, minWidth: 140 }}
              >
                <Input maxLength={255} />
              </Form.Item>
              <Form.Item
                name='phone'
                label={t('employeePage.fields.phone')}
                style={{ flex: 1, minWidth: 140 }}
              >
                <Input maxLength={32} />
              </Form.Item>
            </Flex>
            <Flex gap={12} wrap>
              <Form.Item
                name='hireDate'
                label={t('employeePage.fields.hireDate')}
                style={{ flex: 1, minWidth: 140 }}
              >
                <Input maxLength={10} placeholder='YYYY-MM-DD' />
              </Form.Item>
              <Form.Item
                name='endDate'
                label={t('employeePage.fields.endDate')}
                style={{ flex: 1, minWidth: 140 }}
              >
                <Input maxLength={10} placeholder='YYYY-MM-DD' />
              </Form.Item>
            </Flex>
            <Form.Item name='remark' label={t('employeePage.fields.remark')}>
              <Input.TextArea rows={2} maxLength={512} />
            </Form.Item>
          </Form>
        </Modal>

        {selectedRowKeys.length > 0 ? (
          <Flex
            wrap
            gap={8}
            align='center'
            justify='space-between'
            style={{
              padding: `${token.paddingXS}px ${token.paddingSM}px`,
              borderRadius: token.borderRadius,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Typography.Text>
              {t('employeePage.import.selectedCount', {
                count: selectedRowKeys.length,
              })}
            </Typography.Text>
            <Space wrap>
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={importing}
                onClick={removeSelectedRows}
              >
                {t('employeePage.import.removeSelected', {
                  count: selectedRowKeys.length,
                })}
              </Button>
              <Button
                disabled={importing}
                onClick={() => setSelectedRowKeys([])}
              >
                {t('employeePage.import.clearSelection')}
              </Button>
            </Space>
          </Flex>
        ) : null}

        <Table<EmployeeImportRow>
          rowKey='key'
          size='small'
          className='employee-import-table'
          loading={importing}
          columns={columns}
          dataSource={filteredRows}
          rowSelection={rowSelection}
          pagination={{
            current: page,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['100', '300', '500'],
            showTotal: (count) =>
              t('employeePage.import.filteredTotal', { count }),
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  rows.length === 0
                    ? t('employeePage.import.empty')
                    : t('employeePage.import.emptyFilter')
                }
              />
            ),
          }}
          scroll={{ x: 1400 }}
        />
      </Space>
      <style>{`
        .employee-import-table .ant-table-cell {
          overflow: hidden !important;
          overflow-y: hidden !important;
          white-space: nowrap !important;
          vertical-align: middle !important;
          padding-block: 4px !important;
        }
        .employee-import-table .ant-table-cell .ant-input,
        .employee-import-table .ant-table-cell .ant-input-affix-wrapper,
        .employee-import-table .ant-table-cell .ant-select,
        .employee-import-table .ant-table-cell .ant-select-selector {
          overflow-y: hidden !important;
          white-space: nowrap !important;
          height: 24px !important;
          line-height: 22px !important;
        }
        .employee-import-table .ant-table-cell .ant-input {
          overflow-x: auto !important;
        }
        .employee-import-table td.employee-import-cell-invalid {
          background: ${token.colorErrorBg} !important;
        }
      `}</style>
    </div>
  );
}

export default EmployeeImportPage;
