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
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listCategoriesRequest,
  type Category,
} from '../../../../handlers/category.handler';
import {
  createPositionRequest,
  listPositionsRequest,
  setPositionActiveRequest,
  updatePositionRequest,
  type Position,
  type PositionActor,
} from '../../../../handlers/position.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
const CATEGORY_FETCH_LIMIT = 100;
const POSITION_CATEGORIES_ROOT = 'POSITION_CATEGORIES';
type ActiveFilter = 'active' | 'inactive';

function renderActorCell(
  actor: PositionActor | null | undefined,
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

function positionCategoryOptions(categories: Category[]): Category[] {
  const root = categories.find((item) => item.code === POSITION_CATEGORIES_ROOT);
  if (!root) {
    return categories;
  }
  return categories.filter((item) => item.parentCategoryId === root.id);
}

function categoryChipColor(code: string | null | undefined) {
  switch (code) {
    case 'HEAD_OFFICE_POSITION':
      return 'blue';
    case 'FIELD_OFFICE_POSITION':
      return 'green';
    default:
      return 'default';
  }
}

function PositionFormBody({
  mode,
  initial,
  categories,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Position;
  categories: Category[];
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    code: string;
    categoryId?: string | null;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  const categoryChoices = useMemo(() => {
    const options = positionCategoryOptions(categories);
    if (
      initial?.categoryId &&
      !options.some((item) => item.id === initial.categoryId)
    ) {
      const current = categories.find((item) => item.id === initial.categoryId);
      if (current) {
        return [...options, current];
      }
    }
    return options;
  }, [categories, initial?.categoryId]);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        code: initial.code,
        categoryId: initial.categoryId,
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
                const categoryId = values.categoryId || null;
                if (mode === 'create') {
                  await createPositionRequest({
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    categoryId,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('positionMasterPage.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updatePositionRequest(initial.id, {
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    categoryId,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('positionMasterPage.editSuccess'),
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
                        ? t('positionMasterPage.createFailed')
                        : t('positionMasterPage.editFailed'),
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
        label={t('positionMasterPage.fields.name')}
        rules={[
          {
            required: true,
            message: t('positionMasterPage.validation.nameRequired'),
          },
        ]}
        extra={
          mode === 'edit' ? t('positionMasterPage.fields.nameHint') : undefined
        }
      >
        <Input placeholder='Midwife, Medical Officer' />
      </Form.Item>
      <Form.Item
        name='code'
        label={t('positionMasterPage.fields.code')}
        normalize={(value: string) =>
          typeof value === 'string' ? value.toUpperCase() : value
        }
        rules={[
          {
            required: true,
            message: t('positionMasterPage.validation.codeRequired'),
          },
          {
            pattern: /^[A-Z0-9_]+$/,
            message: t('positionMasterPage.validation.codePattern'),
          },
        ]}
        extra={
          mode === 'edit' ? t('positionMasterPage.fields.codeHint') : undefined
        }
      >
        <Input placeholder='MIDWIFE' />
      </Form.Item>
      <Form.Item
        name='categoryId'
        label={t('positionMasterPage.fields.category')}
      >
        <Select
          allowClear
          showSearch
          optionFilterProp='label'
          placeholder={t('positionMasterPage.fields.categoryNone')}
          options={categoryChoices.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.code})`,
          }))}
        />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('positionMasterPage.fields.description')}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}

function EmployeePositionsPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [items, setItems] = useState<Position[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const title = t('positionMasterPage.title');
  const description = t('positionMasterPage.description');

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => navigate('/')}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [result, categoryResult] = await Promise.all([
          listPositionsRequest({
            q: q || undefined,
            page,
            limit: pageSize,
            active: activeFilter === 'active',
          }),
          listCategoriesRequest({
            page: 1,
            limit: CATEGORY_FETCH_LIMIT,
            active: true,
          }),
        ]);
        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
          setCategories(categoryResult.items);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('positionMasterPage.loadFailed'),
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
      title: t('positionMasterPage.createPosition'),
      width: 480,
      content: (
        <PositionFormBody
          mode='create'
          categories={categories}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Position) => {
    customDialog({
      title: t('positionMasterPage.editPosition'),
      width: 480,
      content: (
        <PositionFormBody
          mode='edit'
          initial={row}
          categories={categories}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Position, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setPositionActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'positionMasterPage.statusActivateSuccess'
            : 'positionMasterPage.statusDeactivateSuccess',
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
            : t('positionMasterPage.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<Position> = [
    {
      title: t('positionMasterPage.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (value: string, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div>{value}</div>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('positionMasterPage.columns.category'),
      key: 'category',
      width: 200,
      render: (_value, row) =>
        row.category ? (
          <Tag color={categoryChipColor(row.category.code)}>
            {row.category.name}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: t('positionMasterPage.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('positionMasterPage.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('positionMasterPage.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('positionMasterPage.columns.status'),
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
      title: t('positionMasterPage.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('positionMasterPage.actions.edit')}
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
    showTotal: (count) => t('positionMasterPage.total', { count }),
    onChange: (nextPage, nextPageSize) => {
      setPage(nextPage);
      setPageSize(nextPageSize);
    },
  };

  return (
    <div
      style={{
        width: '100%',
        padding: token.paddingLG,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
      }}
    >
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
            placeholder={t('positionMasterPage.searchPlaceholder')}
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
                label: t('positionMasterPage.filterActive'),
                value: 'active',
              },
              {
                label: t('positionMasterPage.filterInactive'),
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
          {t('positionMasterPage.createPosition')}
        </Button>
      </Flex>

      <Table<Position>
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
              description={t('positionMasterPage.empty')}
            />
          ),
        }}
      />
    </div>
  );
}

export default EmployeePositionsPage;
