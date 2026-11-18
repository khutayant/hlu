import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useState, type ReactNode } from 'react';
import {
  listCountriesRequest,
  type Country,
} from '../../../handlers/country.handler';
import {
  createTownshipRequest,
  listTownshipsRequest,
  setTownshipActiveRequest,
  updateTownshipRequest,
  type Township,
  type TownshipActor,
} from '../../../handlers/township.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
type ActiveFilter = 'active' | 'inactive';

function renderActorCell(
  actor: TownshipActor | null | undefined,
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

function TownshipFormBody({
  mode,
  initial,
  countries,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Township;
  countries: Country[];
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    code: string;
    countryId: string;
    focalPrefix: string;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        code: initial.code,
        countryId: initial.countryId,
        focalPrefix: initial.focalPrefix,
        description: initial.description ?? undefined,
      });
    } else if (countries[0]) {
      form.setFieldsValue({ countryId: countries[0].id });
    }
  }, [countries, form, initial]);

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
                  await createTownshipRequest({
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    countryId: values.countryId,
                    focalPrefix: values.focalPrefix.trim().toUpperCase(),
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('townshipMasterPage.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateTownshipRequest(initial.id, {
                    name: values.name.trim(),
                    countryId: values.countryId,
                    focalPrefix: values.focalPrefix.trim().toUpperCase(),
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('townshipMasterPage.editSuccess'),
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
                        ? t('townshipMasterPage.createFailed')
                        : t('townshipMasterPage.editFailed'),
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
        name='countryId'
        label={t('townshipMasterPage.fields.country')}
        rules={[
          {
            required: true,
            message: t('townshipMasterPage.validation.countryRequired'),
          },
        ]}
      >
        <Select
          options={countries.map((country) => ({
            value: country.id,
            label: `${country.name} (${country.code})`,
          }))}
          showSearch
          optionFilterProp='label'
        />
      </Form.Item>
      <Form.Item
        name='name'
        label={t('townshipMasterPage.fields.name')}
        rules={[
          {
            required: true,
            message: t('townshipMasterPage.validation.nameRequired'),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='code'
        label={t('townshipMasterPage.fields.code')}
        rules={[
          {
            required: true,
            message: t('townshipMasterPage.validation.codeRequired'),
          },
          {
            pattern: /^[A-Za-z0-9_]+$/,
            message: t('townshipMasterPage.validation.codePattern'),
          },
        ]}
        extra={
          mode === 'edit' ? t('townshipMasterPage.fields.codeLocked') : undefined
        }
      >
        <Input disabled={mode === 'edit'} style={{ textTransform: 'uppercase' }} />
      </Form.Item>
      <Form.Item
        name='focalPrefix'
        label={t('townshipMasterPage.fields.focalPrefix')}
        extra={t('townshipMasterPage.fields.focalPrefixHint')}
        rules={[
          {
            required: true,
            message: t('townshipMasterPage.validation.focalPrefixRequired'),
          },
          {
            max: 5,
            message: t('townshipMasterPage.validation.focalPrefixMaxLength'),
          },
          {
            pattern: /^[A-Za-z0-9]+$/,
            message: t('townshipMasterPage.validation.focalPrefixPattern'),
          },
        ]}
      >
        <Input
          maxLength={5}
          style={{ textTransform: 'uppercase' }}
        />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('townshipMasterPage.fields.description')}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}

/** Township list/CRUD panel (used inside Locations). */
export function TownshipMasterPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [items, setItems] = useState<Township[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await listCountriesRequest({
          active: true,
          limit: 100,
          page: 1,
        });
        if (!cancelled) {
          setCountries(result.items);
        }
      } catch {
        if (!cancelled) {
          setCountries([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await listTownshipsRequest({
          q: q || undefined,
          page,
          limit: pageSize,
          active: activeFilter === 'active',
          countryId: countryFilter ?? undefined,
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
                : t('townshipMasterPage.loadFailed'),
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
  }, [page, pageSize, q, activeFilter, countryFilter, reloadKey, showToast, t]);

  const openCreate = () => {
    if (countries.length === 0) {
      showToast({
        message: t('townshipMasterPage.noCountries'),
        severity: 'warning',
      });
      return;
    }
    customDialog({
      title: t('townshipMasterPage.createTitle'),
      width: 520,
      content: (
        <TownshipFormBody
          mode='create'
          countries={countries}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Township) => {
    customDialog({
      title: t('townshipMasterPage.editTitle'),
      width: 520,
      content: (
        <TownshipFormBody
          mode='edit'
          initial={row}
          countries={countries}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Township, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setTownshipActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'townshipMasterPage.statusActivateSuccess'
            : 'townshipMasterPage.statusDeactivateSuccess',
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
            : t('townshipMasterPage.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<Township> = [
    {
      title: t('townshipMasterPage.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (value: string, row) => (
        <div>
          <div>{value}</div>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.code}
            {row.focalPrefix ? ` · ${row.focalPrefix}` : ''}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('townshipMasterPage.columns.country'),
      key: 'country',
      width: 180,
      render: (_value, row) =>
        row.country
          ? `${row.country.name} (${row.country.code})`
          : '—',
    },
    {
      title: t('townshipMasterPage.columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: t('townshipMasterPage.columns.focalPrefix'),
      dataIndex: 'focalPrefix',
      key: 'focalPrefix',
      width: 120,
      render: (value: string | null) => value || '—',
    },
    {
      title: t('townshipMasterPage.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('townshipMasterPage.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('townshipMasterPage.columns.status'),
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
      title: t('townshipMasterPage.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('townshipMasterPage.actions.edit')}
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
    showTotal: (count) => t('townshipMasterPage.total', { count }),
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
            placeholder={t('townshipMasterPage.searchPlaceholder')}
            prefix={<SearchOutlined />}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
              setPage(1);
            }}
            style={{ width: 240, maxWidth: '100%' }}
          />
          <Select
            allowClear
            placeholder={t('townshipMasterPage.filterCountry')}
            value={countryFilter}
            onChange={(value) => {
              setCountryFilter(value ?? null);
              setPage(1);
            }}
            options={countries.map((country) => ({
              value: country.id,
              label: country.name,
            }))}
            style={{ width: 200, maxWidth: '100%' }}
          />
          <Segmented
            value={activeFilter}
            options={[
              {
                label: t('townshipMasterPage.filterActive'),
                value: 'active',
              },
              {
                label: t('townshipMasterPage.filterInactive'),
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
          {t('townshipMasterPage.createTitle')}
        </Button>
      </Flex>

      <Table<Township>
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
              description={t('townshipMasterPage.empty')}
            />
          ),
        }}
      />
    </>
  );
}

export default TownshipMasterPanel;
