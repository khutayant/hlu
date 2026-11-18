import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
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
import { useEffect, useState, type ReactNode } from 'react';
import {
  createCountryRequest,
  listCountriesRequest,
  setCountryActiveRequest,
  updateCountryRequest,
  type Country,
  type CountryActor,
} from '../../../handlers/country.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
type ActiveFilter = 'active' | 'inactive';

function renderActorCell(
  actor: CountryActor | null | undefined,
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

function CountryFormBody({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Country;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    code: string;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        code: initial.code,
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
                if (mode === 'create') {
                  await createCountryRequest({
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('countryMasterPage.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateCountryRequest(initial.id, {
                    name: values.name.trim(),
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('countryMasterPage.editSuccess'),
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
                        ? t('countryMasterPage.createFailed')
                        : t('countryMasterPage.editFailed'),
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
      <Form.Item
        name='name'
        label={t('countryMasterPage.fields.name')}
        rules={[{ required: true, message: t('countryMasterPage.validation.nameRequired') }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='code'
        label={t('countryMasterPage.fields.code')}
        rules={[
          { required: true, message: t('countryMasterPage.validation.codeRequired') },
          {
            pattern: /^[A-Za-z0-9_]+$/,
            message: t('countryMasterPage.validation.codePattern'),
          },
        ]}
        extra={
          mode === 'edit' ? t('countryMasterPage.fields.codeLocked') : undefined
        }
      >
        <Input disabled={mode === 'edit'} style={{ textTransform: 'uppercase' }} />
      </Form.Item>
      <Form.Item name='description' label={t('countryMasterPage.fields.description')}>
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}

/** Country list/CRUD panel (used inside Locations). */
export function CountryMasterPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [items, setItems] = useState<Country[]>([]);
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
        const result = await listCountriesRequest({
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
                : t('countryMasterPage.loadFailed'),
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
      title: t('countryMasterPage.createTitle'),
      width: 480,
      content: (
        <CountryFormBody
          mode='create'
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Country) => {
    customDialog({
      title: t('countryMasterPage.editTitle'),
      width: 480,
      content: (
        <CountryFormBody
          mode='edit'
          initial={row}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Country, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setCountryActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'countryMasterPage.statusActivateSuccess'
            : 'countryMasterPage.statusDeactivateSuccess',
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
            : t('countryMasterPage.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<Country> = [
    {
      title: t('countryMasterPage.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (value: string, row) => (
        <div>
          <div>{value}</div>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('countryMasterPage.columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('countryMasterPage.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('countryMasterPage.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('countryMasterPage.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('countryMasterPage.columns.status'),
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
      title: t('countryMasterPage.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('countryMasterPage.actions.edit')}
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
    showTotal: (count) => t('countryMasterPage.total', { count }),
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
            placeholder={t('countryMasterPage.searchPlaceholder')}
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
                label: t('countryMasterPage.filterActive'),
                value: 'active',
              },
              {
                label: t('countryMasterPage.filterInactive'),
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
          {t('countryMasterPage.createTitle')}
        </Button>
      </Flex>

      <Table<Country>
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
              description={t('countryMasterPage.empty')}
            />
          ),
        }}
      />
    </>
  );
}

export default CountryMasterPanel;
