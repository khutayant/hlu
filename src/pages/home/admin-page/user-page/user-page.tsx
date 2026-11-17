import { SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Empty,
  Flex,
  Image,
  Input,
  Segmented,
  Space,
  Switch,
  Table,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAuthorizedFileUrl } from '../../../../handlers/file.handler';
import {
  listUsersRequest,
  setUserActiveRequest,
  type AppUser,
} from '../../../../handlers/user.handler';
import { useAuth } from '../../../../providers/auth.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
const AVATAR_SIZE = 36;
const ADMIN_ROLE = 'ADMIN';

type ActiveFilter = 'active' | 'inactive';

function UserNameCell({ user }: { user: AppUser }) {
  const [src, setSrc] = useState<string | null>(null);
  const uuidName = user.profileImage?.uuidName;

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!uuidName) {
      setSrc(null);
      return;
    }

    void (async () => {
      try {
        const url = await fetchAuthorizedFileUrl(uuidName);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      } catch {
        if (!cancelled) {
          setSrc(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [uuidName]);

  return (
    <Flex align='center' gap={10} style={{ minWidth: 0 }}>
      {src ? (
        <Image
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          src={src}
          alt={user.displayName}
          preview={{ mask: false }}
          style={{
            flexShrink: 0,
            borderRadius: '50%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />
      ) : (
        <Avatar
          size={AVATAR_SIZE}
          icon={<UserOutlined />}
          style={{ flexShrink: 0, background: '#1565c0' }}
        />
      )}
      <div style={{ lineHeight: 1.35, minWidth: 0 }}>
        <Typography.Text
          style={{ display: 'block', fontSize: 13 }}
          ellipsis={{ tooltip: user.displayName }}
        >
          {user.displayName}
        </Typography.Text>
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          {user.username}
        </Typography.Text>
      </div>
    </Flex>
  );
}

function UserPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const title = t('userPage.title');
  const description = t('userPage.description');
  const canManageStatus = currentUser?.role === ADMIN_ROLE;

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => navigate(-1)}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t],
  );

  const onSearch = (value: string) => {
    setQ(value.trim());
    setPage(1);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await listUsersRequest({
          q: q || undefined,
          page,
          limit: pageSize,
          active: activeFilter === 'active',
        });
        if (cancelled) {
          return;
        }
        setItems(result.items);
        setTotal(result.total);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setItems([]);
        setTotal(0);
        showToast({
          message:
            error instanceof Error ? error.message : t('userPage.loadFailed'),
          severity: 'error',
        });
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

  const onToggleActive = async (row: AppUser, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setUserActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'userPage.statusActivateSuccess'
            : 'userPage.statusDeactivateSuccess',
          { name: row.displayName },
        ),
        severity: 'success',
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('userPage.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<AppUser> = [
    {
      title: t('userPage.columns.displayName'),
      key: 'displayName',
      render: (_: unknown, row: AppUser) => <UserNameCell user={row} />,
    },
    {
      title: t('userPage.columns.email'),
      dataIndex: 'email',
      key: 'email',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('userPage.columns.role'),
      dataIndex: 'role',
      key: 'role',
      width: 120,
    },
    {
      title: t('userPage.columns.status'),
      key: 'status',
      width: 120,
      render: (_: unknown, row: AppUser) => {
        const canSwitch =
          Boolean(canManageStatus) && currentUser?.id !== row.id;
        return (
          <Switch
            checked={row.active}
            checkedChildren={t('userPage.statusActive')}
            unCheckedChildren={t('userPage.statusInactive')}
            disabled={!canSwitch}
            loading={statusBusyId === row.id}
            onChange={(checked) => {
              void onToggleActive(row, checked);
            }}
          />
        );
      },
    },
    {
      title: t('userPage.columns.lastLoginAt'),
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 200,
      render: (value: string | null) => formatDisplayDateTime(value),
    },
    {
      title: t('userPage.columns.createdDate'),
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 200,
      render: (value: string) => formatDisplayDateTime(value),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
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
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        <Flex wrap gap={8} justify='space-between' align='center'>
          <Segmented
            value={activeFilter}
            options={[
              { label: t('userPage.filterActive'), value: 'active' },
              { label: t('userPage.filterInactive'), value: 'inactive' },
            ]}
            onChange={(value) => {
              setActiveFilter(value as ActiveFilter);
              setPage(1);
            }}
          />
          <Input.Search
            allowClear
            size='middle'
            value={searchInput}
            placeholder={t('userPage.searchPlaceholder')}
            prefix={<SearchOutlined />}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={onSearch}
            style={{ width: 280, maxWidth: '100%' }}
          />
        </Flex>

        <Table<AppUser>
          rowKey='id'
          size='small'
          loading={loading}
          columns={columns}
          dataSource={items}
          onChange={onTableChange}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            hideOnSinglePage: false,
            pageSizeOptions: ['10', '20', '50', '100'],
            position: ['bottomRight'],
            showTotal: (count) => t('userPage.total', { count }),
          }}
          locale={{
            emptyText: (
              <Empty
                image={
                  <TeamOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                }
                styles={{ image: { height: 64 } }}
                description={t('userPage.empty')}
              />
            ),
          }}
          scroll={{ x: true }}
        />
      </Space>
    </div>
  );
}

export default UserPage;
