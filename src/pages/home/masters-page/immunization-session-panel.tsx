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
  createImmunizationSessionRequest,
  listImmunizationSessionsRequest,
  setImmunizationSessionActiveRequest,
  updateImmunizationSessionRequest,
  type ImmunizationSession,
  type ImmunizationSessionActor,
} from '../../../handlers/immunization-session.handler';
import {
  listProjectsRequest,
  type Project,
} from '../../../handlers/project.handler';
import {
  listTownshipsRequest,
  type Township,
} from '../../../handlers/township.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
type ActiveFilter = 'active' | 'inactive';

function renderActorCell(
  actor: ImmunizationSessionActor | null | undefined,
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

function ImmunizationSessionFormBody({
  mode,
  initial,
  projects,
  townships,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: ImmunizationSession;
  projects: Project[];
  townships: Township[];
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{
    name: string;
    projectId: string;
    townshipId: string;
    description?: string;
  }>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        name: initial.name,
        projectId: initial.projectId,
        townshipId: initial.townshipId,
        description: initial.description ?? undefined,
      });
    } else {
      form.setFieldsValue({
        projectId: projects[0]?.id,
        townshipId: townships[0]?.id,
      });
    }
  }, [form, initial, projects, townships]);

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
                  await createImmunizationSessionRequest({
                    name: values.name.trim(),
                    projectId: values.projectId,
                    townshipId: values.townshipId,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('immunizationSessionPanel.createSuccess'),
                    severity: 'success',
                  });
                } else if (initial) {
                  await updateImmunizationSessionRequest(initial.id, {
                    name: values.name.trim(),
                    projectId: values.projectId,
                    townshipId: values.townshipId,
                    description: values.description?.trim() || null,
                  });
                  showToast({
                    message: t('immunizationSessionPanel.editSuccess'),
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
                        ? t('immunizationSessionPanel.createFailed')
                        : t('immunizationSessionPanel.editFailed'),
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
        <Form.Item label={t('immunizationSessionPanel.fields.sessionNo')}>
          <Input value={initial.sessionNo} disabled />
        </Form.Item>
      ) : null}
      <Form.Item
        name='projectId'
        label={t('immunizationSessionPanel.fields.project')}
        rules={[
          {
            required: true,
            message: t('immunizationSessionPanel.validation.projectRequired'),
          },
        ]}
      >
        <Select
          options={projects.map((project) => ({
            value: project.id,
            label: `${project.name} (${project.projectNo})`,
          }))}
          showSearch
          optionFilterProp='label'
        />
      </Form.Item>
      <Form.Item
        name='townshipId'
        label={t('immunizationSessionPanel.fields.township')}
        rules={[
          {
            required: true,
            message: t('immunizationSessionPanel.validation.townshipRequired'),
          },
        ]}
      >
        <Select
          options={townships.map((township) => ({
            value: township.id,
            label: `${township.name} (${township.code})`,
          }))}
          showSearch
          optionFilterProp='label'
        />
      </Form.Item>
      <Form.Item
        name='name'
        label={t('immunizationSessionPanel.fields.name')}
        rules={[
          {
            required: true,
            message: t('immunizationSessionPanel.validation.nameRequired'),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name='description'
        label={t('immunizationSessionPanel.fields.description')}
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}

/** Immunization session list/CRUD panel (Projects master shell). */
export function ImmunizationSessionPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [items, setItems] = useState<ImmunizationSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [townshipId, setTownshipId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [projectResult, townshipResult] = await Promise.all([
          listProjectsRequest({
            active: true,
            page: 1,
            limit: 100,
          }),
          listTownshipsRequest({
            active: true,
            page: 1,
            limit: 100,
          }),
        ]);
        if (!cancelled) {
          setProjects(projectResult.items);
          setTownships(townshipResult.items);
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setTownships([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await listImmunizationSessionsRequest({
          q: q || undefined,
          page,
          limit: pageSize,
          active: activeFilter === 'active',
          projectId: projectId ?? undefined,
          townshipId: townshipId ?? undefined,
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
                : t('immunizationSessionPanel.loadFailed'),
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
  }, [
    page,
    pageSize,
    q,
    activeFilter,
    projectId,
    townshipId,
    reloadKey,
    showToast,
    t,
  ]);

  const openCreate = () => {
    customDialog({
      title: t('immunizationSessionPanel.createTitle'),
      width: 480,
      content: (
        <ImmunizationSessionFormBody
          mode='create'
          projects={projects}
          townships={townships}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: ImmunizationSession) => {
    customDialog({
      title: t('immunizationSessionPanel.editTitle'),
      width: 480,
      content: (
        <ImmunizationSessionFormBody
          mode='edit'
          initial={row}
          projects={projects}
          townships={townships}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (
    row: ImmunizationSession,
    nextActive: boolean,
  ) => {
    setStatusBusyId(row.id);
    try {
      await setImmunizationSessionActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'immunizationSessionPanel.statusActivateSuccess'
            : 'immunizationSessionPanel.statusDeactivateSuccess',
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
            : t('immunizationSessionPanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<ImmunizationSession> = [
    {
      title: t('immunizationSessionPanel.columns.name'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (value: string, row) => (
        <div>
          <div>{value}</div>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.sessionNo}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('immunizationSessionPanel.columns.sessionNo'),
      dataIndex: 'sessionNo',
      key: 'sessionNo',
      width: 140,
    },
    {
      title: t('immunizationSessionPanel.columns.project'),
      key: 'project',
      width: 220,
      render: (_value, row) =>
        row.project
          ? `${row.project.name} (${row.project.projectNo})`
          : '—',
    },
    {
      title: t('immunizationSessionPanel.columns.township'),
      key: 'township',
      width: 180,
      render: (_value, row) =>
        row.township
          ? `${row.township.name} (${row.township.code})`
          : '—',
    },
    {
      title: t('immunizationSessionPanel.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('immunizationSessionPanel.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('immunizationSessionPanel.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_value, row) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('immunizationSessionPanel.columns.status'),
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
      title: t('immunizationSessionPanel.columns.actions'),
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          icon={<EditOutlined />}
          aria-label={t('immunizationSessionPanel.actions.edit')}
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
    showTotal: (count) => t('immunizationSessionPanel.total', { count }),
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
            placeholder={t('immunizationSessionPanel.searchPlaceholder')}
            prefix={<SearchOutlined />}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
              setPage(1);
            }}
            style={{ width: 280, maxWidth: '100%' }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp='label'
            placeholder={t('immunizationSessionPanel.filterProject')}
            value={projectId}
            onChange={(value) => {
              setProjectId(value ?? null);
              setPage(1);
            }}
            style={{ minWidth: 220 }}
            options={projects.map((project) => ({
              value: project.id,
              label: `${project.name} (${project.projectNo})`,
            }))}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp='label'
            placeholder={t('immunizationSessionPanel.filterTownship')}
            value={townshipId}
            onChange={(value) => {
              setTownshipId(value ?? null);
              setPage(1);
            }}
            style={{ minWidth: 200 }}
            options={townships.map((township) => ({
              value: township.id,
              label: `${township.name} (${township.code})`,
            }))}
          />
          <Segmented
            value={activeFilter}
            options={[
              {
                label: t('immunizationSessionPanel.filterActive'),
                value: 'active',
              },
              {
                label: t('immunizationSessionPanel.filterInactive'),
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
          onClick={openCreate}
          disabled={projects.length === 0 || townships.length === 0}
        >
          {t('immunizationSessionPanel.createTitle')}
        </Button>
      </Flex>

      <Table<ImmunizationSession>
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
              description={t('immunizationSessionPanel.empty')}
            />
          ),
        }}
      />
    </>
  );
}
