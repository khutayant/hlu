import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Segmented,
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
import {
  importMeetingAttendanceRequest,
  resolveMeetingAttendanceImportRequest,
} from '../../../handlers/meeting-attendance.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import {
  downloadAttendanceImportTemplate,
  FOCAL_NO_MAX_LENGTH,
  isAttendanceImportRowValid,
  normalizeFocalNo,
  parseAttendanceImportFile,
  validateAttendanceImportRows,
  type AttendanceImportColumn,
  type AttendanceImportMessages,
  type AttendanceImportRow,
} from './meeting-attendance-import.tool';

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

function buildStatusErrorTooltip(row: AttendanceImportRow): ReactNode {
  const lines: string[] = [];
  for (const field of ['name', 'focalNo', 'remark'] as const) {
    const message = row.errors[field];
    if (message) {
      lines.push(message);
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

/** Mass-import attendance rows (Name / Focal No / Remark) for a meeting. */
export function MeetingAttendanceImportPanel({
  meetingId,
  onClose,
}: {
  meetingId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const { confirmDialog } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<AttendanceImportRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [validityFilter, setValidityFilter] =
    useState<ValidityFilter>('invalid');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editRow, setEditRow] = useState<AttendanceImportRow | null>(null);
  const [editForm] = Form.useForm<Record<AttendanceImportColumn, string>>();

  const messages = useMemo<AttendanceImportMessages>(
    () => ({
      nameRequired: t('meetingAttendancePanel.import.nameRequired'),
      focalNoRequired: t('meetingAttendancePanel.validation.focalNoRequired'),
      focalNoPattern: t('meetingAttendancePanel.validation.focalNoPattern'),
      focalNoMaxLength: t('meetingAttendancePanel.validation.focalNoMaxLength'),
      focalNoDuplicateFile: t(
        'meetingAttendancePanel.import.focalNoDuplicateFile',
      ),
      focalNoMissingEmployee: t(
        'meetingAttendancePanel.import.focalNoMissingEmployee',
      ),
      focalNoAlreadyAttending: t(
        'meetingAttendancePanel.import.focalNoAlreadyAttending',
      ),
    }),
    [t],
  );

  const revalidate = (nextRows: AttendanceImportRow[]) =>
    validateAttendanceImportRows(nextRows, messages);

  useEffect(() => {
    setRows((current) =>
      current.length ? validateAttendanceImportRows(current, messages) : current,
    );
  }, [messages]);

  const validCount = useMemo(
    () => rows.filter((row) => isAttendanceImportRowValid(row)).length,
    [rows],
  );
  const invalidCount = rows.length - validCount;

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const valid = isAttendanceImportRowValid(row);
      return validityFilter === 'valid' ? valid : !valid;
    });
  }, [rows, validityFilter]);

  const updateField = (
    key: string,
    field: AttendanceImportColumn,
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

  const openEdit = (row: AttendanceImportRow) => {
    setEditRow(row);
    editForm.setFieldsValue({
      name: row.name,
      focalNo: row.focalNo,
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
                name: values.name ?? '',
                focalNo: normalizeFocalNo(values.focalNo ?? ''),
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

  const rowSelection: TableRowSelection<AttendanceImportRow> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: () => ({ disabled: importing }),
  };

  const onPickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const parsed = await parseAttendanceImportFile(file);
      if (parsed.length === 0) {
        showToast({
          message: t('meetingAttendancePanel.import.emptyFile'),
          severity: 'warning',
        });
        return;
      }
      setFileName(file.name);
      setRows(validateAttendanceImportRows(parsed, messages));
      setSelectedRowKeys([]);
      setValidityFilter('invalid');
      setPage(1);
    } catch (error) {
      showToast({
        message:
          error instanceof Error && error.message === 'NO_KNOWN_COLUMNS'
            ? t('meetingAttendancePanel.import.unknownColumns')
            : error instanceof Error
              ? error.message
              : t('meetingAttendancePanel.import.parseFailed'),
        severity: 'error',
      });
    }
  };

  const onDownloadTemplate = () => {
    void downloadAttendanceImportTemplate({
      name: 'name',
      focalNo: 'focalNo',
      remark: 'remark',
      sheetName: 'Attendance',
      filename: 'meeting-attendance-import-template.xlsx',
    }).catch((error: unknown) => {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingAttendancePanel.import.templateFailed'),
        severity: 'error',
      });
    });
  };

  const onImport = async () => {
    let checkedRows = validateAttendanceImportRows(rows, messages);
    setRows(checkedRows);

    let validRows = checkedRows.filter((row) =>
      isAttendanceImportRowValid(row),
    );
    if (validRows.length === 0) {
      showToast({
        message: t('meetingAttendancePanel.import.noValidRows'),
        severity: 'warning',
      });
      return;
    }

    const confirmedImport = await confirmDialog({
      title: t('meetingAttendancePanel.import.confirmTitle'),
      message: t('meetingAttendancePanel.import.confirmMessage', {
        count: validRows.length,
      }),
      okText: t('meetingAttendancePanel.import.confirmOk'),
      cancelText: t('common.cancel'),
    });
    if (!confirmedImport) {
      return;
    }

    setImporting(true);
    try {
      const resolve = await resolveMeetingAttendanceImportRequest({
        meetingId,
        focalNos: validRows.map((row) => row.focalNo),
      });
      const missing = new Set(resolve.missing);
      const alreadyAttending = new Set(resolve.alreadyAttending);
      const matchedByFocal = new Map(
        resolve.found.map((item) => [item.focalNo, item.displayName]),
      );

      checkedRows = validateAttendanceImportRows(checkedRows, messages, {
        missingFocalNos: missing,
        alreadyAttendingFocalNos: alreadyAttending,
        matchedByFocal,
      });
      setRows(checkedRows);
      validRows = checkedRows.filter((row) => isAttendanceImportRowValid(row));

      if (validRows.length === 0) {
        setSelectedRowKeys([]);
        setValidityFilter('invalid');
        setPage(1);
        showToast({
          message: t('meetingAttendancePanel.import.noValidRows'),
          severity: 'warning',
        });
        return;
      }

      const otherInvalidCount = checkedRows.length - validRows.length;
      if (otherInvalidCount > 0) {
        const confirmed = await confirmDialog({
          title: t('meetingAttendancePanel.import.confirmIgnoreInvalidTitle'),
          message: t(
            'meetingAttendancePanel.import.confirmIgnoreInvalidMessage',
            {
              invalid: otherInvalidCount,
              valid: validRows.length,
            },
          ),
          okText: t('meetingAttendancePanel.import.confirmIgnoreInvalidOk'),
          cancelText: t('common.cancel'),
          danger: true,
        });
        if (!confirmed) {
          setValidityFilter('invalid');
          setPage(1);
          return;
        }
      }

      const result = await importMeetingAttendanceRequest({
        meetingId,
        rows: validRows.map((row) => ({
          focalNo: row.focalNo,
          remark: row.remark || null,
        })),
      });

      const failureByFocal = new Map(
        result.results
          .filter((row) => !row.ok)
          .map((row) => [row.focalNo, row.error ?? '']),
      );
      const successFocals = new Set(
        result.results.filter((row) => row.ok).map((row) => row.focalNo),
      );

      const remaining = checkedRows
        .filter((row) => !successFocals.has(row.focalNo))
        .map((row) =>
          failureByFocal.has(row.focalNo)
            ? {
                ...row,
                importError:
                  failureByFocal.get(row.focalNo) ||
                  t('meetingAttendancePanel.import.rowFailed'),
              }
            : row,
        );

      if (remaining.length > 0) {
        setRows(validateAttendanceImportRows(remaining, messages));
        setSelectedRowKeys([]);
        setValidityFilter('invalid');
        setPage(1);
        if (result.imported > 0) {
          showToast({
            message: t('meetingAttendancePanel.import.importSuccess', {
              count: result.imported,
            }),
            severity: 'success',
          });
        }
        if (result.failed > 0) {
          showToast({
            message: t('meetingAttendancePanel.import.importPartialFailed', {
              count: result.failed,
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
        message: t('meetingAttendancePanel.import.importSuccess', {
          count: result.imported,
        }),
        severity: 'success',
      });
      onClose();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingAttendancePanel.import.checkFailed'),
        severity: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  const columns: ColumnsType<AttendanceImportRow> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_value, _row, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: t('meetingAttendancePanel.import.columns.name'),
      dataIndex: 'name',
      width: 220,
      onCell: (row) => errorCellProps(Boolean(row.errors.name)),
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <ErrorCell
            value={row.name}
            error={row.errors.name}
            disabled={importing}
            maxLength={255}
            onChange={(value) => updateField(row.key, 'name', value)}
          />
          {row.matchedName ? (
            <Typography.Text type='secondary' style={{ fontSize: 11 }}>
              {t('meetingAttendancePanel.import.matchedName', {
                name: row.matchedName,
              })}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('meetingAttendancePanel.import.columns.focalNo'),
      dataIndex: 'focalNo',
      width: 140,
      onCell: (row) => errorCellProps(Boolean(row.errors.focalNo)),
      render: (_value, row) => (
        <ErrorCell
          value={row.focalNo}
          error={row.errors.focalNo}
          disabled={importing}
          maxLength={FOCAL_NO_MAX_LENGTH}
          onChange={(value) =>
            updateField(row.key, 'focalNo', normalizeFocalNo(value))
          }
        />
      ),
    },
    {
      title: t('meetingAttendancePanel.import.columns.remark'),
      dataIndex: 'remark',
      onCell: (row) => errorCellProps(Boolean(row.errors.remark)),
      render: (_value, row) => (
        <ErrorCell
          value={row.remark}
          error={row.errors.remark}
          disabled={importing}
          maxLength={512}
          onChange={(value) => updateField(row.key, 'remark', value)}
        />
      ),
    },
    {
      title: t('meetingAttendancePanel.import.status'),
      key: 'status',
      width: 110,
      render: (_value, row) => {
        const valid = isAttendanceImportRowValid(row);
        const tooltip = buildStatusErrorTooltip(row);
        const tag = valid ? (
          <Tag icon={<CheckCircleOutlined />} color='success'>
            {t('meetingAttendancePanel.import.filterValid')}
          </Tag>
        ) : (
          <Tag icon={<WarningOutlined />} color='error'>
            {t('meetingAttendancePanel.import.filterInvalid')}
          </Tag>
        );
        return tooltip ? <Tooltip title={tooltip}>{tag}</Tooltip> : tag;
      },
    },
    {
      title: t('meetingAttendancePanel.import.actionsColumn'),
      key: 'actions',
      width: 72,
      align: 'center',
      render: (_value, row) => (
        <Dropdown
          disabled={importing}
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: t('meetingAttendancePanel.import.actions.edit'),
                onClick: () => openEdit(row),
              },
              {
                key: 'remove',
                icon: <DeleteOutlined />,
                danger: true,
                label: t('meetingAttendancePanel.import.actions.remove'),
                onClick: () => removeRow(row.key),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button
            type='text'
            icon={<MoreOutlined />}
            disabled={importing}
            aria-label={t('meetingAttendancePanel.import.actions.menu')}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <Flex
        wrap
        gap={8}
        justify='space-between'
        align='center'
        style={{ marginBottom: 16 }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          {t('meetingAttendancePanel.import.title')}
        </Typography.Title>
        <Flex wrap gap={8} align='center'>
          {fileName ? (
            <Typography.Text type='secondary' style={{ fontSize: 13 }}>
              {fileName} ·{' '}
              {t('meetingAttendancePanel.import.rowCount', {
                count: rows.length,
              })}
            </Typography.Text>
          ) : null}
          <Tooltip title={t('meetingAttendancePanel.import.infoButton')}>
            <Button
              icon={<InfoCircleOutlined />}
              aria-label={t('meetingAttendancePanel.import.infoButton')}
              disabled={importing}
              onClick={() => setInfoOpen(true)}
            />
          </Tooltip>
          <Button
            icon={<DownloadOutlined />}
            onClick={onDownloadTemplate}
            disabled={importing}
          >
            {t('meetingAttendancePanel.import.downloadTemplate')}
          </Button>
          <Button
            icon={<UploadOutlined />}
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('meetingAttendancePanel.import.pickFile')}
          </Button>
          <Button
            type='primary'
            icon={<ImportOutlined />}
            loading={importing}
            disabled={importing || validCount === 0}
            onClick={() => void onImport()}
          >
            {t('meetingAttendancePanel.import.importAction', {
              count: validCount,
            })}
          </Button>
          <input
            ref={fileInputRef}
            type='file'
            accept='.csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
            style={{ display: 'none' }}
            onChange={(event) => void onPickFile(event)}
          />
        </Flex>
      </Flex>

      <Flex style={{ marginBottom: 12 }}>
        <Segmented
          value={validityFilter}
          options={[
            {
              label: `${t('meetingAttendancePanel.import.filterValid')} (${validCount})`,
              value: 'valid',
            },
            {
              label: `${t('meetingAttendancePanel.import.filterInvalid')} (${invalidCount})`,
              value: 'invalid',
            },
          ]}
          onChange={(value) => {
            setValidityFilter(value as ValidityFilter);
            setSelectedRowKeys([]);
            setPage(1);
          }}
        />
      </Flex>

      {selectedRowKeys.length > 0 ? (
        <Flex gap={8} align='center' style={{ marginBottom: 12 }}>
          <Typography.Text>
            {t('meetingAttendancePanel.import.selectedCount', {
              count: selectedRowKeys.length,
            })}
          </Typography.Text>
          <Button
            danger
            disabled={importing}
            onClick={removeSelectedRows}
          >
            {t('meetingAttendancePanel.import.removeSelected', {
              count: selectedRowKeys.length,
            })}
          </Button>
          <Button
            disabled={importing}
            onClick={() => setSelectedRowKeys([])}
          >
            {t('meetingAttendancePanel.import.clearSelection')}
          </Button>
        </Flex>
      ) : null}

      <Table<AttendanceImportRow>
        className='meeting-attendance-import-table'
        rowKey='key'
        size='small'
        columns={columns}
        dataSource={filteredRows}
        rowSelection={rowSelection}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [50, 100, 200],
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
          showTotal: (count) =>
            t('meetingAttendancePanel.import.filteredTotal', { count }),
        }}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                rows.length === 0
                  ? t('meetingAttendancePanel.import.empty')
                  : t('meetingAttendancePanel.import.emptyFilter')
              }
            />
          ),
        }}
      />

      <style>{`
        .meeting-attendance-import-table td.employee-import-cell-invalid {
          background: ${token.colorErrorBg} !important;
        }
      `}</style>

      <Modal
        open={infoOpen}
        title={t('meetingAttendancePanel.import.infoTitle')}
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
            {t('meetingAttendancePanel.import.infoIntro')}
          </Typography.Paragraph>
          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {t('meetingAttendancePanel.import.infoMandatoryTitle')}
            </Typography.Title>
            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
              <li>
                <Typography.Text code>name</Typography.Text>
                {' — '}
                {t('meetingAttendancePanel.import.nameHint')}
              </li>
              <li>
                <Typography.Text code>focalNo</Typography.Text>
                {' — '}
                {t('meetingAttendancePanel.fields.focalNo')}
              </li>
            </ul>
          </div>
          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {t('meetingAttendancePanel.import.infoOptionalTitle')}
            </Typography.Title>
            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
              <li>
                <Typography.Text code>remark</Typography.Text>
                {' — '}
                {t('meetingAttendancePanel.fields.remark')}
              </li>
            </ul>
          </div>
        </Space>
      </Modal>

      <Modal
        open={Boolean(editRow)}
        title={t('meetingAttendancePanel.import.editTitle')}
        onCancel={closeEdit}
        onOk={() => void saveEdit()}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnHidden
        centered
      >
        <Form form={editForm} layout='vertical' style={{ marginTop: 8 }}>
          <Form.Item
            name='name'
            label={t('meetingAttendancePanel.import.columns.name')}
            rules={[
              {
                required: true,
                message: t('meetingAttendancePanel.import.nameRequired'),
              },
            ]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name='focalNo'
            label={t('meetingAttendancePanel.import.columns.focalNo')}
            rules={[
              {
                required: true,
                message: t('meetingAttendancePanel.validation.focalNoRequired'),
              },
            ]}
            normalize={(value: string) => normalizeFocalNo(value ?? '')}
          >
            <Input maxLength={FOCAL_NO_MAX_LENGTH} />
          </Form.Item>
          <Form.Item
            name='remark'
            label={t('meetingAttendancePanel.import.columns.remark')}
          >
            <Input.TextArea rows={3} style={{ resize: 'none' }} maxLength={512} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
