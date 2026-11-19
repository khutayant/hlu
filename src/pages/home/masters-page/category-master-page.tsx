import {
  EditOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Breadcrumb,
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createCategoryRequest,
  listCategoriesRequest,
  setCategoryActiveRequest,
  updateCategoryRequest,
  type Category,
  type CategoryActor,
} from '../../../handlers/category.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const FETCH_LIMIT = 100;
const PATH_QUERY_KEY = 'path';
type ActiveFilter = 'active' | 'inactive';

function parsePathCodes(raw: string | null): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split('/')
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

function resolvePathIds(
  codes: readonly string[],
  items: readonly Category[],
): string[] {
  if (codes.length === 0 || items.length === 0) {
    return [];
  }
  const byCode = new Map(items.map((item) => [item.code, item]));
  const ids: string[] = [];
  let parentId: string | null = null;
  for (const code of codes) {
    const match = items.find(
      (item) => item.code === code && item.parentCategoryId === parentId,
    );
    const fallback = match ?? byCode.get(code);
    if (!fallback) {
      break;
    }
    ids.push(fallback.id);
    parentId = fallback.id;
  }
  return ids;
}

function renderActorCell(
  actor: CategoryActor | null | undefined,
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

function CategoryFormBody({
  mode,
  initial,
  parentOptions,
  defaultParentId,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Category;
  parentOptions: Category[];
  defaultParentId?: string | null;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    code: string;
    parentCategoryId?: string | null;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        code: initial.code,
        parentCategoryId: initial.parentCategoryId,
        description: initial.description ?? undefined,
      });
    } else {
      form.setFieldsValue({
        parentCategoryId: defaultParentId ?? null,
      });
    }
  }, [defaultParentId, form, initial]);

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
                const parentCategoryId = values.parentCategoryId || null;
                if (mode === 'create') {
                  await createCategoryRequest({
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    parentCategoryId,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('categoryMasterPage.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateCategoryRequest(initial.id, {
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    parentCategoryId,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('categoryMasterPage.editSuccess'),
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
                        ? t('categoryMasterPage.createFailed')
                        : t('categoryMasterPage.editFailed'),
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

  const selectableParents = parentOptions.filter(
    (item) => item.id !== initial?.id,
  );

  return (
    <Form form={form} layout='vertical' style={{ marginTop: 8 }}>
      <Form.Item
        name='name'
        label={t('categoryMasterPage.fields.name')}
        rules={[
          {
            required: true,
            message: t('categoryMasterPage.validation.nameRequired'),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='code'
        label={t('categoryMasterPage.fields.code')}
        normalize={(value: string) =>
          typeof value === 'string' ? value.toUpperCase() : value
        }
        rules={[
          {
            required: true,
            message: t('categoryMasterPage.validation.codeRequired'),
          },
          {
            pattern: /^[A-Z0-9_]+$/,
            message: t('categoryMasterPage.validation.codePattern'),
          },
        ]}
        extra={
          mode === 'edit' ? t('categoryMasterPage.fields.codeHint') : undefined
        }
      >
        <Input placeholder='FILE_CATEGORIES' />
      </Form.Item>
      <Form.Item
        name='parentCategoryId'
        label={t('categoryMasterPage.fields.parent')}
      >
        <Select
          allowClear
          showSearch
          optionFilterProp='label'
          placeholder={t('categoryMasterPage.fields.parentNone')}
          options={selectableParents.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.code})`,
          }))}
        />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('categoryMasterPage.fields.description')}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}

function CategoryMasterPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [allItems, setAllItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const pathCodes = useMemo(
    () => parsePathCodes(searchParams.get(PATH_QUERY_KEY)),
    [searchParams],
  );

  const title = t('categoryMasterPage.title');
  const description = t('categoryMasterPage.description');

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
        const result = await listCategoriesRequest({
          page: 1,
          limit: FETCH_LIMIT,
          active: activeFilter === 'active',
        });
        if (!cancelled) {
          setAllItems(result.items);
        }
      } catch (error) {
        if (!cancelled) {
          setAllItems([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('categoryMasterPage.loadFailed'),
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
  }, [activeFilter, reloadKey, showToast, t]);

  const byId = useMemo(() => {
    const map = new Map<string, Category>();
    for (const item of allItems) {
      map.set(item.id, item);
    }
    return map;
  }, [allItems]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const item of allItems) {
      const key = item.parentCategoryId;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [allItems]);

  const pathIds = useMemo(
    () => resolvePathIds(pathCodes, allItems),
    [allItems, pathCodes],
  );

  const setPathIds = (nextIds: string[] | ((prev: string[]) => string[])) => {
    const resolved =
      typeof nextIds === 'function' ? nextIds(pathIds) : nextIds;
    const codes = resolved
      .map((id) => byId.get(id)?.code)
      .filter((code): code is string => Boolean(code));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (codes.length === 0) {
          next.delete(PATH_QUERY_KEY);
        } else {
          next.set(PATH_QUERY_KEY, codes.join('/'));
        }
        return next;
      },
      { replace: false },
    );
  };

  /** Drop invalid path segments from the URL once data is loaded. */
  useEffect(() => {
    if (loading || allItems.length === 0) {
      return;
    }
    const resolvedCodes = pathIds
      .map((id) => byId.get(id)?.code)
      .filter((code): code is string => Boolean(code));
    if (resolvedCodes.join('/') === pathCodes.join('/')) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (resolvedCodes.length === 0) {
          next.delete(PATH_QUERY_KEY);
        } else {
          next.set(PATH_QUERY_KEY, resolvedCodes.join('/'));
        }
        return next;
      },
      { replace: true },
    );
  }, [allItems, byId, loading, pathCodes, pathIds, setSearchParams]);

  const currentParentId = pathIds.length > 0 ? pathIds[pathIds.length - 1]! : null;

  const pathCategories = useMemo(
    () =>
      pathIds
        .map((id) => byId.get(id))
        .filter((item): item is Category => Boolean(item)),
    [byId, pathIds],
  );

  const searchLower = q.trim().toLowerCase();

  const visibleItems = useMemo(() => {
    if (searchLower) {
      return allItems
        .filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.code.toLowerCase().includes(searchLower) ||
            (item.description ?? '').toLowerCase().includes(searchLower),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return childrenByParent.get(currentParentId) ?? [];
  }, [allItems, childrenByParent, currentParentId, searchLower]);

  const childCount = (id: string) => childrenByParent.get(id)?.length ?? 0;

  const openCreate = () => {
    customDialog({
      title: t('categoryMasterPage.createTitle'),
      width: 480,
      content: (
        <CategoryFormBody
          mode='create'
          parentOptions={allItems}
          defaultParentId={currentParentId}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Category) => {
    customDialog({
      title: t('categoryMasterPage.editTitle'),
      width: 480,
      content: (
        <CategoryFormBody
          mode='edit'
          initial={row}
          parentOptions={allItems}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Category, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setCategoryActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'categoryMasterPage.statusActivateSuccess'
            : 'categoryMasterPage.statusDeactivateSuccess',
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
            : t('categoryMasterPage.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const openChildren = (row: Category) => {
    setQ('');
    setSearchInput('');
    setPathIds((prev) => [...prev, row.id]);
  };

  const columns: ColumnsType<Category> = [
    {
      title: t('categoryMasterPage.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 280,
      render: (value: string, row) => {
        const count = childCount(row.id);
        const canOpen = count > 0 && !searchLower;
        return (
          <button
            type='button'
            onClick={() => {
              if (canOpen) {
                openChildren(row);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: 0,
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              cursor: canOpen ? 'pointer' : 'default',
            }}
          >
            {canOpen ? (
              <FolderOpenOutlined style={{ color: token.colorPrimary }} />
            ) : (
              <span style={{ width: 14 }} />
            )}
            <span style={{ lineHeight: 1.35, minWidth: 0 }}>
              <Typography.Text style={{ display: 'block' }}>
                {value}
              </Typography.Text>
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                {row.code}
                {count > 0
                  ? ` · ${t('categoryMasterPage.childCount', { count })}`
                  : ''}
              </Typography.Text>
            </span>
            {canOpen ? (
              <RightOutlined
                style={{ marginInlineStart: 'auto', color: token.colorTextSecondary }}
              />
            ) : null}
          </button>
        );
      },
    },
    {
      title: t('categoryMasterPage.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('categoryMasterPage.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('categoryMasterPage.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('categoryMasterPage.columns.status'),
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
      title: t('categoryMasterPage.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('categoryMasterPage.actions.edit')}
          onClick={() => openEdit(row)}
        />
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
            placeholder={t('categoryMasterPage.searchPlaceholder')}
            prefix={<SearchOutlined />}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
            }}
            style={{ width: 280, maxWidth: '100%' }}
          />
          <Segmented
            value={activeFilter}
            options={[
              {
                label: t('categoryMasterPage.filterActive'),
                value: 'active',
              },
              {
                label: t('categoryMasterPage.filterInactive'),
                value: 'inactive',
              },
            ]}
            onChange={(value) => {
              setActiveFilter(value as ActiveFilter);
              setPathIds([]);
            }}
          />
        </Flex>
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
          {t('categoryMasterPage.createTitle')}
        </Button>
      </Flex>

      <div
        aria-label={t('categoryMasterPage.locator')}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 12,
          minHeight: 40,
          paddingBlock: 8,
          paddingInline: 12,
          borderRadius: token.borderRadius,
          background: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          lineHeight: 1.4,
          overflow: 'hidden',
        }}
      >
        <Breadcrumb
          className='category-master-locator'
          separator='/'
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
          items={[
            {
              title:
                pathCategories.length === 0 && !searchLower ? (
                  <span>{t('categoryMasterPage.breadcrumbRoot')}</span>
                ) : (
                  <a
                    href='#root'
                    onClick={(event) => {
                      event.preventDefault();
                      setQ('');
                      setSearchInput('');
                      setPathIds([]);
                    }}
                  >
                    {t('categoryMasterPage.breadcrumbRoot')}
                  </a>
                ),
            },
            ...pathCategories.map((item, index) => {
              const isLast =
                index === pathCategories.length - 1 && !searchLower;
              return {
                title: isLast ? (
                  <span>{item.name}</span>
                ) : (
                  <a
                    href={`#${item.code}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setQ('');
                      setSearchInput('');
                      setPathIds((prev) => prev.slice(0, index + 1));
                    }}
                  >
                    {item.name}
                  </a>
                ),
              };
            }),
          ]}
        />
      </div>

      {loading ? (
        <Flex justify='center' style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : (
        <Table<Category>
          rowKey='id'
          size='small'
          columns={columns}
          dataSource={visibleItems}
          scroll={{ x: 'max-content' }}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchLower
                    ? t('categoryMasterPage.searchEmpty')
                    : t('categoryMasterPage.emptyLevel')
                }
              />
            ),
          }}
        />
      )}
    </div>
  );
}

export default CategoryMasterPage;
