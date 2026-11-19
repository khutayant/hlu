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
import { useNavigate } from 'react-router-dom';
import {
  createProjectRequest,
  listProjectsRequest,
  setProjectActiveRequest,
  updateProjectRequest,
  type Project,
  type ProjectActor,
} from '../../../handlers/project.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
type ActiveFilter = 'active' | 'inactive';

function renderActorCell(
  actor: ProjectActor | null | undefined,
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
export function ProjectFormBody({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Project;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
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
                  await createProjectRequest({
                    name: values.name.trim(),
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('projectPanel.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateProjectRequest(initial.id, {
                    name: values.name.trim(),
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('projectPanel.editSuccess'),
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
                        ? t('projectPanel.createFailed')
                        : t('projectPanel.editFailed'),
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
        <Form.Item label={t('projectPanel.fields.projectNo')}>
          <Input value={initial.projectNo} disabled />
        </Form.Item>
      ) : null}
      <Form.Item
        name='name'
        label={t('projectPanel.fields.name')}
        rules={[
          { required: true, message: t('projectPanel.validation.nameRequired') },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('projectPanel.fields.description')}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
      {mode === 'create' ? (
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          {t('projectPanel.fields.projectNoHint')}
        </Typography.Text>
      ) : null}
    </Form>
  );
}

/** Project list/CRUD panel (used inside Projects master shell). */
export function ProjectPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const navigate = useNavigate();
  const [items, setItems] = useState<Project[]>([]);
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
        const result = await listProjectsRequest({
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
                : t('projectPanel.loadFailed'),
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
      title: t('projectPanel.createTitle'),
      width: 480,
      content: (
        <ProjectFormBody
          mode='create'
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Project) => {
    customDialog({
      title: t('projectPanel.editTitle'),
      width: 480,
      content: (
        <ProjectFormBody
          mode='edit'
          initial={row}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Project, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setProjectActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'projectPanel.statusActivateSuccess'
            : 'projectPanel.statusDeactivateSuccess',
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
            : t('projectPanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<Project> = [
    {
      title: t('projectPanel.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (value: string, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <Typography.Link
            style={{ display: 'block', fontSize: 13 }}
            onClick={() => navigate(`/masters/project/${row.id}/details`)}
          >
            {value}
          </Typography.Link>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.projectNo}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('projectPanel.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('projectPanel.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('projectPanel.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('projectPanel.columns.status'),
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
      title: t('projectPanel.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('projectPanel.actions.edit')}
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
    showTotal: (count) => t('projectPanel.total', { count }),
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
            placeholder={t('projectPanel.searchPlaceholder')}
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
                label: t('projectPanel.filterActive'),
                value: 'active',
              },
              {
                label: t('projectPanel.filterInactive'),
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
          {t('projectPanel.createTitle')}
        </Button>
      </Flex>

      <Table<Project>
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
              description={t('projectPanel.empty')}
            />
          ),
        }}
      />
    </>
  );
}
