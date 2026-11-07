import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Flex,
  Input,
  Popover,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import type { Key } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  addUserRolePermissionsRequest,
  listUserRolePermissionCandidatesRequest,
  listUserRolePermissionsRequest,
  removeUserRolePermissionRequest,
  type UserRoleAssignedPermission,
  type UserRolePermission,
} from '../../../../handlers/user-role.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import { useToast } from '../../../../providers/toast.provider';

const DEFAULT_PAGE_SIZE = 20;
const ADD_BATCH_LIMIT = 20;
const CANDIDATE_PAGE_SIZE = 20;

type UserRolePermissionsPanelProps = {
  roleId: string;
};

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <header style={{ marginBottom: 28 }}>
      <Typography.Title
        level={2}
        style={{
          margin: 0,
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </Typography.Title>
      <Typography.Paragraph
        type='secondary'
        style={{ margin: '8px 0 0', fontSize: 15, maxWidth: 520 }}
      >
        {hint}
      </Typography.Paragraph>
    </header>
  );
}

function DescriptionCell({ value }: { value: string | null }) {
  if (!value) {
    return '—';
  }

  return (
    <Popover
      trigger='hover'
      content={
        <div
          style={{
            maxWidth: 420,
            maxHeight: 280,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </div>
      }
    >
      <span
        style={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          cursor: 'default',
        }}
      >
        {value}
      </span>
    </Popover>
  );
}

function AddPermissionDialogBody({
  roleId,
  onAdded,
}: {
  roleId: string;
  onAdded: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<UserRolePermission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await listUserRolePermissionCandidatesRequest(roleId, {
          q: q || undefined,
          page,
          limit: CANDIDATE_PAGE_SIZE,
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
                : t('userRolePage.rolePermissions.loadFailed'),
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
  }, [roleId, q, page, showToast, t]);

  const onSearch = (value: string) => {
    setQ(value.trim());
    setPage(1);
  };

  const onSelectChange = (keys: Key[]) => {
    if (keys.length > ADD_BATCH_LIMIT) {
      showToast({
        message: t('userRolePage.rolePermissions.batchLimit', {
          max: ADD_BATCH_LIMIT,
        }),
        severity: 'warning',
      });
      setSelectedRowKeys(keys.slice(0, ADD_BATCH_LIMIT));
      return;
    }
    setSelectedRowKeys(keys);
  };

  const onAdd = async () => {
    if (selectedRowKeys.length === 0) {
      showToast({
        message: t('userRolePage.rolePermissions.validation.required'),
        severity: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await addUserRolePermissionsRequest(
        roleId,
        selectedRowKeys.map(String),
      );
      showToast({
        message: t('userRolePage.rolePermissions.addSuccess', {
          count: result.added,
        }),
        severity: 'success',
      });
      closeDialog();
      onAdded();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('userRolePage.rolePermissions.addFailed'),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;

  useEffect(() => {
    setDialogActions(
      <Space>
        <Button onClick={closeDialog} disabled={saving}>
          {t('common.close')}
        </Button>
        <Button
          type='primary'
          loading={saving}
          disabled={selectedRowKeys.length === 0}
          onClick={() => {
            void onAddRef.current();
          }}
        >
          {t('userRolePage.rolePermissions.addSubmit')}
          {selectedRowKeys.length > 0
            ? ` (${selectedRowKeys.length})`
            : ''}
        </Button>
      </Space>,
    );
  }, [closeDialog, saving, selectedRowKeys.length, setDialogActions, t]);

  const columns: ColumnsType<UserRolePermission> = [
    {
      title: t('userRolePage.columns.name'),
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (_value, row) => (
        <div>
          <div>{row.name}</div>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.subject}.{row.action}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('userRolePage.columns.code'),
      dataIndex: 'code',
      key: 'code',
      width: 200,
    },
    {
      title: t('userRolePage.columns.description'),
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (value: string | null) => <DescriptionCell value={value} />,
    },
  ];

  const rowSelection: TableRowSelection<UserRolePermission> = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    fixed: true,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled:
        selectedRowKeys.length >= ADD_BATCH_LIMIT &&
        !selectedRowKeys.includes(record.id),
    }),
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxHeight: 'calc(100vh - 220px)',
        overflow: 'hidden',
      }}
    >
      <Flex
        wrap
        gap={8}
        justify='space-between'
        align='center'
        style={{ flexShrink: 0 }}
      >
        <Input.Search
          allowClear
          value={searchInput}
          placeholder={t(
            'userRolePage.rolePermissions.searchPermissionPlaceholder',
          )}
          prefix={<SearchOutlined />}
          onChange={(event) => setSearchInput(event.target.value)}
          onSearch={onSearch}
          style={{ width: 320, maxWidth: '100%' }}
        />
        <Typography.Text type='secondary'>
          {t('userRolePage.rolePermissions.selectedCount', {
            count: selectedRowKeys.length,
            max: ADD_BATCH_LIMIT,
          })}
        </Typography.Text>
      </Flex>

      <Table<UserRolePermission>
        rowKey='id'
        size='small'
        loading={loading}
        columns={columns}
        dataSource={items}
        rowSelection={rowSelection}
        scroll={{ x: 'max-content', y: 'min(48vh, 420px)' }}
        pagination={{
          current: page,
          pageSize: CANDIDATE_PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (count) =>
            t('userRolePage.rolePermissions.total', { count }),
          onChange: (nextPage) => setPage(nextPage),
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('userRolePage.rolePermissions.candidatesEmpty')}
            />
          ),
        }}
      />
    </div>
  );
}

export function UserRolePermissionsPanel({
  roleId,
}: UserRolePermissionsPanelProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog, confirmDialog } = useDialog();
  const [items, setItems] = useState<UserRoleAssignedPermission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  const reloadList = () => {
    setReloadKey((key) => key + 1);
  };

  const onSearch = (value: string) => {
    setQ(value.trim());
    setPage(1);
  };

  const openAdd = () => {
    customDialog({
      title: t('userRolePage.rolePermissions.addTitle'),
      width: 920,
      actions: null,
      content: (
        <AddPermissionDialogBody
          roleId={roleId}
          onAdded={() => {
            setPage(1);
            reloadList();
          }}
        />
      ),
    });
  };

  const onRemove = async (permission: UserRoleAssignedPermission) => {
    const confirmed = await confirmDialog({
      title: t('userRolePage.rolePermissions.removeTitle'),
      message: t('userRolePage.rolePermissions.removeConfirm', {
        name: permission.name,
      }),
      okText: t('userRolePage.rolePermissions.removeSubmit'),
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setRemovingId(permission.id);
    try {
      await removeUserRolePermissionRequest(roleId, permission.id);
      showToast({
        message: t('userRolePage.rolePermissions.removeSuccess'),
        severity: 'success',
      });
      reloadList();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('userRolePage.rolePermissions.removeFailed'),
        severity: 'error',
      });
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await listUserRolePermissionsRequest(roleId, {
          q: q || undefined,
          page,
          limit: pageSize,
        });
        if (cancelled) {
          return;
        }
        setItems(result.items);
        setTotal(result.total);
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('userRolePage.rolePermissions.loadFailed'),
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
  }, [roleId, q, page, pageSize, reloadKey, showToast, t]);

  const columns: ColumnsType<UserRoleAssignedPermission> = [
    {
      title: t('userRolePage.columns.name'),
      key: 'name',
      render: (_value, row) => (
        <div>
          <div>{row.name}</div>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.subject}.{row.action}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('userRolePage.columns.code'),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: t('userRolePage.columns.description'),
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (value: string | null) => <DescriptionCell value={value} />,
    },
    {
      title: t('userRolePage.rolePermissions.columns.assignedDate'),
      dataIndex: 'assignedDate',
      key: 'assignedDate',
      render: (value: string) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
      },
    },
    {
      title: t('userRolePage.columns.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_value, row) => (
        <Button
          type='text'
          danger
          icon={<DeleteOutlined />}
          loading={removingId === row.id}
          aria-label={t('userRolePage.rolePermissions.actions.remove')}
          onClick={() => {
            void onRemove(row);
          }}
        />
      ),
    },
  ];

  return (
    <article>
      <SectionHeader
        title={t('userRolePage.menu.permissions')}
        hint={t('userRolePage.permissionsHint')}
      />
      <Flex
        wrap
        gap={8}
        justify='space-between'
        align='center'
        style={{ marginBottom: 16 }}
      >
        <Input.Search
          allowClear
          value={searchInput}
          placeholder={t('userRolePage.rolePermissions.searchPlaceholder')}
          prefix={<SearchOutlined />}
          onChange={(event) => setSearchInput(event.target.value)}
          onSearch={onSearch}
          style={{ width: 280, maxWidth: '100%' }}
        />
        <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
          {t('userRolePage.rolePermissions.addNew')}
        </Button>
      </Flex>
      <Table<UserRoleAssignedPermission>
        rowKey='id'
        size='small'
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) =>
            t('userRolePage.rolePermissions.total', { count }),
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('userRolePage.permissionsEmpty')}
            />
          ),
        }}
      />
    </article>
  );
}
