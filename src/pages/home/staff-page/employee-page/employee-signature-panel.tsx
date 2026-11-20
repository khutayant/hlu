import {
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Flex,
  Input,
  Modal,
  Segmented,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useState, type ReactNode } from 'react';
import {
  SignaturePaperBlock,
  useEmployeeSignatureEditor,
} from '../../../../components/employee-signature/employee-signature-editor-dialog';
import type { Employee } from '../../../../handlers/employee.handler';
import {
  listEmployeeSignaturesRequest,
  setEmployeeSignatureActiveRequest,
  type EmployeeSignature,
  type EmployeeSignatureActor,
} from '../../../../handlers/employee-signature.handler';
import { fetchAuthorizedFileUrl } from '../../../../handlers/file.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import { useToast } from '../../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
type ActiveFilter = 'active' | 'inactive';

function revokeIfBlob(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function renderActorCell(
  actor: EmployeeSignatureActor | null | undefined,
  date: string,
): ReactNode {
  return (
    <div style={{ lineHeight: 1.35 }}>
      <Typography.Text style={{ display: 'block', fontSize: 13 }}>
        {actor?.name || '—'}
      </Typography.Text>
      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
        {formatDisplayDateTime(date)}
      </Typography.Text>
    </div>
  );
}

function SignaturePreview({
  row,
}: {
  row: EmployeeSignature;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const canOpen = Boolean(url);

  return (
    <>
      <div
        role={canOpen ? 'button' : undefined}
        tabIndex={canOpen ? 0 : undefined}
        onClick={() => {
          if (canOpen) {
            setPreviewOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (!canOpen) {
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setPreviewOpen(true);
          }
        }}
        style={{
          lineHeight: 1.35,
          maxWidth: 200,
          cursor: canOpen ? 'pointer' : 'default',
        }}
      >
        <Typography.Text
          style={{
            display: 'block',
            fontSize: 13,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.signatureName}
        >
          {row.signatureName || '—'}
        </Typography.Text>
        <Typography.Text
          type='secondary'
          style={{
            display: 'block',
            fontSize: 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={row.signaturePosition}
        >
          {row.signaturePosition || '—'}
        </Typography.Text>
      </div>
      <Modal
        open={previewOpen}
        title={t('employeeSignaturePanel.paperPreviewTitle')}
        onCancel={() => setPreviewOpen(false)}
        footer={
          <Button type='primary' onClick={() => setPreviewOpen(false)}>
            {t('common.close')}
          </Button>
        }
        centered
        destroyOnHidden
        width={420}
      >
        <SignaturePaperBlock
          imageUrl={url}
          signatureName={row.signatureName}
          signaturePosition={row.signaturePosition}
          styles={row.signatureStyles}
        />
      </Modal>
    </>
  );
}

export function EmployeeSignaturePanel({ employee }: { employee: Employee }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { confirmDialog } = useDialog();
  const { openCreate, openEdit } = useEmployeeSignatureEditor();
  const [items, setItems] = useState<EmployeeSignature[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await listEmployeeSignaturesRequest({
          employeeId: employee.id,
          q: q || undefined,
          page,
          limit: pageSize,
          active: activeFilter === 'active',
        });
        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
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
  }, [employee.id, page, pageSize, q, activeFilter, reloadKey, showToast, t]);

  const onSaved = () => setReloadKey((key) => key + 1);

  const onToggleActive = async (
    row: EmployeeSignature,
    nextActive: boolean,
  ) => {
    const confirmed = await confirmDialog({
      title: t(
        nextActive
          ? 'employeeSignaturePanel.statusActivateConfirmTitle'
          : 'employeeSignaturePanel.statusDeactivateConfirmTitle',
      ),
      message: t(
        nextActive
          ? 'employeeSignaturePanel.statusActivateConfirmMessage'
          : 'employeeSignaturePanel.statusDeactivateConfirmMessage',
        { name: row.name },
      ),
      okText: t(
        nextActive
          ? 'employeeSignaturePanel.statusActivateConfirmOk'
          : 'employeeSignaturePanel.statusDeactivateConfirmOk',
      ),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) {
      return;
    }

    setStatusBusyId(row.id);
    try {
      await setEmployeeSignatureActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'employeeSignaturePanel.statusActivateSuccess'
            : 'employeeSignaturePanel.statusDeactivateSuccess',
          { name: row.name },
        ),
        severity: 'success',
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeeSignaturePanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<EmployeeSignature> = [
    {
      title: t('employeeSignaturePanel.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 160,
    },
    {
      title: t('employeeSignaturePanel.columns.preview'),
      key: 'preview',
      width: 200,
      render: (_value, row) => <SignaturePreview row={row} />,
    },
    {
      title: t('employeeSignaturePanel.columns.primary'),
      key: 'primary',
      width: 100,
      render: (_value, row) =>
        row.primary ? (
          <Tag color='blue'>{t('common.yes')}</Tag>
        ) : (
          <Tag>{t('common.no')}</Tag>
        ),
    },
    {
      title: t('employeeSignaturePanel.columns.createdBy'),
      key: 'createdBy',
      width: 180,
      render: (_value, row) => renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('employeeSignaturePanel.columns.updatedBy'),
      key: 'updatedBy',
      width: 180,
      render: (_value, row) => renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('employeeSignaturePanel.columns.status'),
      key: 'status',
      width: 100,
      render: (_value, row) => (
        <Switch
          checked={row.active}
          loading={statusBusyId === row.id}
          onChange={(checked) => {
            void onToggleActive(row, checked);
          }}
        />
      ),
    },
    {
      title: t('employeeSignaturePanel.columns.actions'),
      key: 'actions',
      width: 72,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('employeeSignaturePanel.actions.edit')}
          onClick={() => {
            void openEdit({
              employeeId: employee.id,
              employee,
              initial: row,
              onSaved,
            });
          }}
        />
      ),
    },
  ];

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (count) => t('employeeSignaturePanel.total', { count }),
    onChange: (nextPage, nextPageSize) => {
      setPage(nextPage);
      setPageSize(nextPageSize);
    },
  };

  return (
    <Flex vertical gap={16} style={{ width: '100%' }}>
      <Flex justify='space-between' align='center' gap={12} wrap>
        <Flex gap={8} wrap>
          <Input.Search
            allowClear
            placeholder={t('employeeSignaturePanel.searchPlaceholder')}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
              setPage(1);
            }}
            style={{ width: 260 }}
            enterButton={<SearchOutlined />}
          />
          <Segmented
            value={activeFilter}
            options={[
              {
                label: t('employeeSignaturePanel.filterActive'),
                value: 'active',
              },
              {
                label: t('employeeSignaturePanel.filterInactive'),
                value: 'inactive',
              },
            ]}
            onChange={(value) => {
              setActiveFilter(value as ActiveFilter);
              setPage(1);
            }}
          />
        </Flex>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => {
            void openCreate({
              employeeId: employee.id,
              employee,
              onSaved,
            });
          }}
        >
          {t('employeeSignaturePanel.createTitle')}
        </Button>
      </Flex>

      <Table<EmployeeSignature>
        rowKey='id'
        size='small'
        loading={loading}
        columns={columns}
        dataSource={items}
        scroll={{ x: 'max-content' }}
        pagination={pagination}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('employeeSignaturePanel.empty')}
            />
          ),
        }}
      />
    </Flex>
  );
}
