import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Segmented,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useState, type ReactNode } from 'react';
import {
  createMeetingAllowanceRequest,
  listMeetingAllowancesRequest,
  setMeetingAllowanceActiveRequest,
  updateMeetingAllowanceRequest,
  type MeetingAllowance,
  type MeetingAllowanceActor,
} from '../../../handlers/meeting-allowance.handler';
import type { Meeting } from '../../../handlers/meeting.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
type ActiveFilter = 'active' | 'inactive';

type AllowanceFormValues = {
  name: string;
  sequenceNo?: number | null;
  unitPriceLabel?: string;
  unitPrice?: number | null;
  quantityLabel?: string;
  quantity?: number | null;
  totalAmountLabel?: string;
  totalAmount?: number | null;
  showTotalOnly: boolean;
  excludeHeadOffice: boolean;
};

function toNumericString(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }
  return value.toFixed(2);
}

function parseNumeric(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Total = unit price × quantity (2 decimal places). */
function computeTotalAmount(
  unitPrice?: number | null,
  quantity?: number | null,
) {
  const price =
    typeof unitPrice === 'number' && Number.isFinite(unitPrice) ? unitPrice : 0;
  const qty =
    typeof quantity === 'number' && Number.isFinite(quantity) ? quantity : 0;
  return Math.round(price * qty * 100) / 100;
}

function formatAmount(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value || '—';
  }
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function renderActorCell(
  actor: MeetingAllowanceActor | null | undefined,
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

function AllowanceFormBody({
  meetingId,
  mode,
  initial,
  onSaved,
}: {
  meetingId: string;
  mode: 'create' | 'edit';
  initial?: MeetingAllowance;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<AllowanceFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      const unitPrice = parseNumeric(initial.unitPrice);
      const quantity = parseNumeric(initial.quantity);
      form.setFieldsValue({
        name: initial.name,
        sequenceNo: initial.sequenceNo,
        unitPriceLabel: initial.unitPriceLabel ?? undefined,
        unitPrice,
        quantityLabel: initial.quantityLabel ?? undefined,
        quantity,
        totalAmountLabel: initial.totalAmountLabel ?? undefined,
        totalAmount: computeTotalAmount(unitPrice, quantity),
        showTotalOnly: initial.showTotalOnly,
        excludeHeadOffice: initial.excludeHeadOffice,
      });
    } else {
      form.setFieldsValue({
        sequenceNo: undefined,
        showTotalOnly: false,
        excludeHeadOffice: false,
        unitPrice: 0,
        quantity: 0,
        totalAmount: 0,
      });
    }
  }, [form, initial]);

  useEffect(() => {
    setDialogActions(
      <Space>
        <Button disabled={saving} onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button
          type='primary'
          loading={saving}
          onClick={() => {
            void form.validateFields().then(async (values) => {
              setSaving(true);
              try {
                const totalAmount = computeTotalAmount(
                  values.unitPrice,
                  values.quantity,
                );
                form.setFieldsValue({ totalAmount });
                const sequenceNo =
                  typeof values.sequenceNo === 'number' &&
                  Number.isInteger(values.sequenceNo) &&
                  values.sequenceNo >= 1
                    ? values.sequenceNo
                    : undefined;
                const payload = {
                  name: values.name.trim(),
                  sequenceNo,
                  unitPriceLabel: values.unitPriceLabel?.trim() || null,
                  unitPrice: toNumericString(values.unitPrice),
                  quantityLabel: values.quantityLabel?.trim() || null,
                  quantity: toNumericString(values.quantity),
                  totalAmountLabel: values.totalAmountLabel?.trim() || null,
                  totalAmount: toNumericString(totalAmount),
                  showTotalOnly: values.showTotalOnly,
                  excludeHeadOffice: values.excludeHeadOffice,
                };
                if (mode === 'create') {
                  await createMeetingAllowanceRequest({
                    meetingId,
                    ...payload,
                  });
                  showToast({
                    message: t('meetingAllowancePanel.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateMeetingAllowanceRequest(initial.id, payload);
                  showToast({
                    message: t('meetingAllowancePanel.editSuccess'),
                    severity: 'success',
                  });
                }
                closeDialog();
                onSaved();
              } catch (error) {
                showToast({
                  message:
                    error instanceof Error
                      ? error.message
                      : mode === 'create'
                        ? t('meetingAllowancePanel.createFailed')
                        : t('meetingAllowancePanel.editFailed'),
                  severity: 'error',
                });
              } finally {
                setSaving(false);
              }
            });
          }}
        >
          {t('common.save')}
        </Button>
      </Space>,
    );
  }, [
    closeDialog,
    form,
    initial,
    meetingId,
    mode,
    onSaved,
    saving,
    setDialogActions,
    showToast,
    t,
  ]);

  return (
    <Form
      form={form}
      layout='vertical'
      style={{ marginTop: 4 }}
      onValuesChange={(changed, all) => {
        if ('unitPrice' in changed || 'quantity' in changed) {
          form.setFieldsValue({
            totalAmount: computeTotalAmount(all.unitPrice, all.quantity),
          });
        }
      }}
    >
      <Flex gap={12} align='flex-start'>
        <Form.Item
          name='name'
          label={t('meetingAllowancePanel.fields.name')}
          rules={[
            {
              required: true,
              message: t('meetingAllowancePanel.validation.nameRequired'),
            },
          ]}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Input maxLength={125} />
        </Form.Item>
        <Form.Item
          name='sequenceNo'
          label={t('meetingAllowancePanel.fields.sequenceNo')}
          rules={[
            {
              required: mode === 'edit',
              message: t('meetingAllowancePanel.validation.sequenceNoRequired'),
            },
            {
              type: 'number',
              min: 1,
              message: t('meetingAllowancePanel.validation.sequenceNoMin'),
            },
          ]}
          style={{ width: 120, flexShrink: 0 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            step={1}
            precision={0}
            placeholder={
              mode === 'create'
                ? t('meetingAllowancePanel.fields.sequenceNoAuto')
                : undefined
            }
          />
        </Form.Item>
        <Form.Item
          name='showTotalOnly'
          label={t('meetingAllowancePanel.fields.showTotalOnly')}
          valuePropName='checked'
          style={{ width: 120, flexShrink: 0 }}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name='excludeHeadOffice'
          label={t('meetingAllowancePanel.fields.excludeHeadOffice')}
          valuePropName='checked'
          style={{ width: 150, flexShrink: 0 }}
        >
          <Switch />
        </Form.Item>
      </Flex>

      <Flex gap={12}>
        <Form.Item
          name='unitPriceLabel'
          label={t('meetingAllowancePanel.fields.unitPriceLabel')}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Input maxLength={125} />
        </Form.Item>
        <Form.Item
          name='unitPrice'
          label={t('meetingAllowancePanel.fields.unitPrice')}
          style={{ flex: 1, minWidth: 0 }}
        >
          <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
        </Form.Item>
      </Flex>

      <Flex gap={12}>
        <Form.Item
          name='quantityLabel'
          label={t('meetingAllowancePanel.fields.quantityLabel')}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Input maxLength={125} />
        </Form.Item>
        <Form.Item
          name='quantity'
          label={t('meetingAllowancePanel.fields.quantity')}
          style={{ flex: 1, minWidth: 0 }}
        >
          <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
        </Form.Item>
      </Flex>

      <Flex gap={12}>
        <Form.Item
          name='totalAmountLabel'
          label={t('meetingAllowancePanel.fields.totalAmountLabel')}
          style={{ flex: 1, minWidth: 0 }}
        >
          <Input maxLength={125} />
        </Form.Item>
        <Form.Item
          name='totalAmount'
          label={t('meetingAllowancePanel.fields.totalAmount')}
          style={{ flex: 1, minWidth: 0 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.01}
            disabled
            readOnly
            controls={false}
          />
        </Form.Item>
      </Flex>
    </Form>
  );
}

/** Allowance list/CRUD panel for a meeting (`MeetingAllowanceMaster`). */
export function MeetingAllowancePanel({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [items, setItems] = useState<MeetingAllowance[]>([]);
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
        const result = await listMeetingAllowancesRequest({
          meetingId: meeting.id,
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
                : t('meetingAllowancePanel.loadFailed'),
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
  }, [meeting.id, page, pageSize, q, activeFilter, reloadKey, showToast, t]);

  const openCreate = () => {
    customDialog({
      title: t('meetingAllowancePanel.createTitle'),
      width: 640,
      content: (
        <AllowanceFormBody
          meetingId={meeting.id}
          mode='create'
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: MeetingAllowance) => {
    customDialog({
      title: t('meetingAllowancePanel.editTitle'),
      width: 640,
      content: (
        <AllowanceFormBody
          meetingId={meeting.id}
          mode='edit'
          initial={row}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: MeetingAllowance, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setMeetingAllowanceActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'meetingAllowancePanel.statusActivateSuccess'
            : 'meetingAllowancePanel.statusDeactivateSuccess',
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
            : t('meetingAllowancePanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<MeetingAllowance> = [
    {
      title: t('meetingAllowancePanel.columns.sequenceNo'),
      dataIndex: 'sequenceNo',
      key: 'sequenceNo',
      width: 88,
      align: 'center',
    },
    {
      title: t('meetingAllowancePanel.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div>{row.name}</div>
          {row.excludeHeadOffice ? (
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {t('meetingAllowancePanel.columns.excludeHeadOfficeBadge')}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('meetingAllowancePanel.columns.unitPrice'),
      key: 'unitPrice',
      width: 160,
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div>{formatAmount(row.unitPrice)}</div>
          {row.unitPriceLabel ? (
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {row.unitPriceLabel}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('meetingAllowancePanel.columns.quantity'),
      key: 'quantity',
      width: 140,
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div>{formatAmount(row.quantity)}</div>
          {row.quantityLabel ? (
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {row.quantityLabel}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('meetingAllowancePanel.columns.totalAmount'),
      key: 'totalAmount',
      width: 160,
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div>{formatAmount(row.totalAmount)}</div>
          {row.totalAmountLabel ? (
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {row.totalAmountLabel}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('meetingAllowancePanel.columns.showTotalOnly'),
      key: 'showTotalOnly',
      width: 120,
      render: (_value, row) => (row.showTotalOnly ? '✓' : '—'),
    },
    {
      title: t('meetingAllowancePanel.columns.createdBy'),
      key: 'createdBy',
      width: 180,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('meetingAllowancePanel.columns.updatedBy'),
      key: 'updatedBy',
      width: 180,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('meetingAllowancePanel.columns.status'),
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
      title: t('meetingAllowancePanel.columns.actions'),
      key: 'actions',
      width: 72,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('meetingAllowancePanel.actions.edit')}
          onClick={() => openEdit(row)}
        />
      ),
    },
  ];

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (count) => t('meetingAllowancePanel.total', { count }),
    onChange: (nextPage, nextPageSize) => {
      setPage(nextPage);
      setPageSize(nextPageSize);
    },
  };

  return (
    <>
      <Flex
        wrap
        gap={8}
        justify='space-between'
        align='center'
        style={{ marginBottom: 16 }}
      >
        <Flex wrap gap={8} style={{ flex: 1, minWidth: 0 }}>
          <Input.Search
            allowClear
            value={searchInput}
            placeholder={t('meetingAllowancePanel.searchPlaceholder')}
            prefix={<SearchOutlined />}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
              setPage(1);
            }}
            style={{ width: 280, maxWidth: '100%' }}
          />
          <Segmented
            value={activeFilter}
            options={[
              {
                label: t('meetingAllowancePanel.filterActive'),
                value: 'active',
              },
              {
                label: t('meetingAllowancePanel.filterInactive'),
                value: 'inactive',
              },
            ]}
            onChange={(value) => {
              setActiveFilter(value as ActiveFilter);
              setPage(1);
            }}
          />
        </Flex>
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
          {t('meetingAllowancePanel.createTitle')}
        </Button>
      </Flex>

      <Table<MeetingAllowance>
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
              description={t('meetingAllowancePanel.empty')}
            />
          ),
        }}
      />
    </>
  );
}
