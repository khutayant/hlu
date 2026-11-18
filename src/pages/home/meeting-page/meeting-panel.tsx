import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Segmented,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createMeetingRequest,
  listMeetingsRequest,
  setMeetingActiveRequest,
  updateMeetingRequest,
  type Meeting,
  type MeetingActor,
} from '../../../handlers/meeting.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
const DATE_TIME_FORMAT = 'DD-MMM-YYYY hh:mm A';
type ActiveFilter = 'active' | 'inactive';

function toDateTimePayload(value?: Dayjs | null) {
  if (!value) {
    return null;
  }
  return value.toISOString();
}

function renderActorCell(
  actor: MeetingActor | null | undefined,
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

/** Shared create/edit form body used by list and detail dialogs. */
export function MeetingFormBody({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Meeting;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    fromDate: Dayjs;
    toDate: Dayjs;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        fromDate: dayjs(initial.fromDate),
        toDate: dayjs(initial.toDate),
        description: initial.description ?? undefined,
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
                const fromDate = toDateTimePayload(values.fromDate);
                const toDate = toDateTimePayload(values.toDate);
                if (!fromDate || !toDate) {
                  throw new Error(
                    t('meetingPanel.validation.dateRangeRequired'),
                  );
                }
                if (mode === 'create') {
                  await createMeetingRequest({
                    name: values.name.trim(),
                    fromDate,
                    toDate,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('meetingPanel.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateMeetingRequest(initial.id, {
                    name: values.name.trim(),
                    fromDate,
                    toDate,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('meetingPanel.editSuccess'),
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
                        ? t('meetingPanel.createFailed')
                        : t('meetingPanel.editFailed'),
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
    mode,
    onSaved,
    saving,
    setDialogActions,
    showToast,
    t,
  ]);

  return (
    <Form form={form} layout='vertical' style={{ marginTop: 8 }}>
      {mode === 'edit' && initial ? (
        <Form.Item label={t('meetingPanel.fields.meetingNo')}>
          <Input value={initial.meetingNo} disabled />
        </Form.Item>
      ) : null}
      <Form.Item
        name='name'
        label={t('meetingPanel.fields.name')}
        rules={[
          { required: true, message: t('meetingPanel.validation.nameRequired') },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='fromDate'
        label={t('meetingPanel.fields.fromDate')}
        rules={[
          {
            required: true,
            message: t('meetingPanel.validation.fromDateRequired'),
          },
        ]}
      >
        <DatePicker
          showTime={{ format: 'hh:mm A', minuteStep: 5 }}
          style={{ width: '100%' }}
          format={DATE_TIME_FORMAT}
        />
      </Form.Item>
      <Form.Item
        name='toDate'
        label={t('meetingPanel.fields.toDate')}
        dependencies={['fromDate']}
        rules={[
          {
            required: true,
            message: t('meetingPanel.validation.toDateRequired'),
          },
          ({ getFieldValue }) => ({
            validator(_, value?: Dayjs | null) {
              const fromDate = getFieldValue('fromDate') as Dayjs | undefined;
              if (!value || !fromDate || !value.isBefore(fromDate)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(t('meetingPanel.validation.toDateAfterFromDate')),
              );
            },
          }),
        ]}
      >
        <DatePicker
          showTime={{ format: 'hh:mm A', minuteStep: 5 }}
          style={{ width: '100%' }}
          format={DATE_TIME_FORMAT}
        />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('meetingPanel.fields.description')}
      >
        <Input.TextArea rows={3} style={{ resize: 'none' }} />
      </Form.Item>
    </Form>
  );
}

/** Meeting list/CRUD panel. */
export function MeetingPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const navigate = useNavigate();
  const [items, setItems] = useState<Meeting[]>([]);
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
        const result = await listMeetingsRequest({
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
                : t('meetingPanel.loadFailed'),
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
  }, [page, pageSize, q, activeFilter, reloadKey, showToast, t]);

  const openCreate = () => {
    customDialog({
      title: t('meetingPanel.createTitle'),
      width: 480,
      content: (
        <MeetingFormBody
          mode='create'
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Meeting) => {
    customDialog({
      title: t('meetingPanel.editTitle'),
      width: 480,
      content: (
        <MeetingFormBody
          mode='edit'
          initial={row}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Meeting, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setMeetingActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'meetingPanel.statusActivateSuccess'
            : 'meetingPanel.statusDeactivateSuccess',
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
            : t('meetingPanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<Meeting> = [
    {
      title: t('meetingPanel.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (value: string, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <Typography.Link
            style={{ display: 'block', fontSize: 13 }}
            onClick={() => navigate(`/meeting/${row.id}/details`)}
          >
            {value}
          </Typography.Link>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.meetingNo}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('meetingPanel.columns.fromDate'),
      dataIndex: 'fromDate',
      key: 'fromDate',
      width: 240,
      render: (value: string) => (
        <Typography.Text style={{ whiteSpace: 'nowrap' }}>
          {formatDisplayDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: t('meetingPanel.columns.toDate'),
      dataIndex: 'toDate',
      key: 'toDate',
      width: 240,
      render: (value: string) => (
        <Typography.Text style={{ whiteSpace: 'nowrap' }}>
          {formatDisplayDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: t('meetingPanel.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('meetingPanel.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('meetingPanel.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('meetingPanel.columns.status'),
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
      title: t('meetingPanel.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('meetingPanel.actions.edit')}
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
    showTotal: (count) => t('meetingPanel.total', { count }),
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
            placeholder={t('meetingPanel.searchPlaceholder')}
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
                label: t('meetingPanel.filterActive'),
                value: 'active',
              },
              {
                label: t('meetingPanel.filterInactive'),
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
          {t('meetingPanel.createTitle')}
        </Button>
      </Flex>

      <Table<Meeting>
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
              description={t('meetingPanel.empty')}
            />
          ),
        }}
      />
    </>
  );
}
