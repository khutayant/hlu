import {
  EditOutlined,
  ExportOutlined,
  IdcardOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  Flex,
  Image,
  Input,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listEmployeeFilterOptionsRequest,
  listEmployeesRequest,
  setEmployeeActiveRequest,
  type Employee,
  type EmployeeActor,
  type EmployeeGender,
} from '../../../../handlers/employee.handler';
import { fetchAuthorizedFileUrl } from '../../../../handlers/file.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../../tools/format-date.tool';
import {
  downloadEmployeeCsv,
  employeesToCsv,
  fetchAllEmployeesForExport,
} from './employee-export.tool';
import { EmployeeFormDialogBody } from './employee-form-dialog';

const DEFAULT_PAGE_SIZE = 20;
const AVATAR_SIZE = 36;
type ActiveFilter = 'active' | 'inactive';

function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD-MMM-YYYY') : value;
}

function renderActorCell(
  actor: EmployeeActor | null | undefined,
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

function EmployeeNameCell({
  employee,
  onOpen,
}: {
  employee: Employee;
  onOpen: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const uuidName = employee.profileImage?.uuidName;

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

  const meta = [employee.employeeNo, employee.focalNo]
    .filter(Boolean)
    .join(' · ');

  return (
    <Flex
      align='center'
      gap={10}
      style={{ minWidth: 0, cursor: 'pointer' }}
      onClick={onOpen}
      role='link'
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {src ? (
        <Image
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          src={src}
          alt={employee.displayName}
          preview={false}
          style={{
            flexShrink: 0,
            borderRadius: '50%',
            objectFit: 'cover',
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
        <Typography.Link
          style={{ display: 'block', fontSize: 13 }}
          ellipsis
          onClick={(event) => {
            event.preventDefault();
            onOpen();
          }}
        >
          {employee.displayName}
        </Typography.Link>
        <Typography.Text
          type='secondary'
          style={{ fontSize: 12 }}
          ellipsis={{ tooltip: meta }}
        >
          {meta}
        </Typography.Text>
      </div>
    </Flex>
  );
}

function EmployeePage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const { confirmDialog, customDialog } = useDialog();
  const navigate = useNavigate();
  const [items, setItems] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');
  const [genderFilter, setGenderFilter] = useState<EmployeeGender | null>(null);
  const [townshipFilter, setTownshipFilter] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [townships, setTownships] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  const title = t('employeePage.title');
  const description = t('employeePage.description');

  const onExport = async () => {
    if (total === 0) {
      showToast({
        message: t('employeePage.export.empty'),
        severity: 'info',
      });
      return;
    }

    const confirmed = await confirmDialog({
      title: t('employeePage.export.confirmTitle'),
      message: t('employeePage.export.confirmMessage', { count: total }),
      okText: t('employeePage.export.confirmOk'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) {
      return;
    }

    setExporting(true);
    try {
      const employees = await fetchAllEmployeesForExport({
        q: q || undefined,
        active: activeFilter === 'active',
        gender: genderFilter ?? undefined,
        townshipName: townshipFilter ?? undefined,
        position: positionFilter ?? undefined,
      });
      if (employees.length === 0) {
        showToast({
          message: t('employeePage.export.empty'),
          severity: 'info',
        });
        return;
      }
      const stamp = dayjs().format('YYYYMMDD-HHmmss');
      downloadEmployeeCsv(
        employeesToCsv(employees),
        `employee-list-${stamp}.csv`,
      );
      showToast({
        message: t('employeePage.export.success', {
          count: employees.length,
        }),
        severity: 'success',
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('employeePage.export.failed'),
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Space style={{ marginInlineStart: 'auto', flexShrink: 0 }}>
        <Button
          icon={<ExportOutlined />}
          loading={exporting}
          disabled={exporting}
          onClick={() => void onExport()}
        >
          {t('employeePage.export.ribbon')}
        </Button>
        <Button
          icon={<ImportOutlined />}
          onClick={() => navigate('/staff/employee/import')}
        >
          {t('employeePage.import.ribbon')}
        </Button>
        <Button onClick={() => navigate('/')}>{t('common.close')}</Button>
      </Space>
    </>,
    [
      title,
      description,
      navigate,
      t,
      exporting,
      total,
      q,
      activeFilter,
      genderFilter,
      townshipFilter,
      positionFilter,
      confirmDialog,
      showToast,
    ],
  );

  const onSearch = (value: string) => {
    setQ(value.trim());
    setPage(1);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const options = await listEmployeeFilterOptionsRequest();
        if (!cancelled) {
          setTownships(options.townships);
          setPositions(options.positions);
        }
      } catch {
        if (!cancelled) {
          setTownships([]);
          setPositions([]);
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
        const result = await listEmployeesRequest({
          q: q || undefined,
          page,
          limit: pageSize,
          active: activeFilter === 'active',
          gender: genderFilter ?? undefined,
          townshipName: townshipFilter ?? undefined,
          position: positionFilter ?? undefined,
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
            error instanceof Error
              ? error.message
              : t('employeePage.loadFailed'),
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
  }, [
    page,
    pageSize,
    q,
    activeFilter,
    genderFilter,
    townshipFilter,
    positionFilter,
    reloadKey,
    showToast,
    t,
  ]);

  const openCreate = () => {
    customDialog({
      title: t('employeePage.createTitle'),
      width: 560,
      content: (
        <EmployeeFormDialogBody
          mode='create'
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const openEdit = (row: Employee) => {
    customDialog({
      title: t('employeePage.editTitle'),
      width: 560,
      content: (
        <EmployeeFormDialogBody
          mode='edit'
          initial={row}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: Employee, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setEmployeeActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'employeePage.statusActivateSuccess'
            : 'employeePage.statusDeactivateSuccess',
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
            : t('employeePage.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const actionsTitle = t('employeePage.columns.actions');

  const columns: ColumnsType<Employee> = [
    {
      title: t('employeePage.columns.name'),
      key: 'name',
      width: 250,
      fixed: 'left',
      render: (_: unknown, row: Employee) => (
        <EmployeeNameCell
          employee={row}
          onOpen={() => navigate(`/staff/employee/${row.id}`)}
        />
      ),
    },
    {
      title: t('employeePage.columns.gender'),
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      render: (value: EmployeeGender) =>
        value ? t(`employeePage.gender.${value}`) : '—',
    },
    {
      title: t('employeePage.columns.townshipName'),
      dataIndex: 'townshipName',
      key: 'townshipName',
      width: 160,
      ellipsis: true,
    },
    {
      title: t('employeePage.columns.position'),
      dataIndex: 'position',
      key: 'position',
      width: 140,
      ellipsis: true,
    },
    {
      title: t('employeePage.columns.experience'),
      dataIndex: 'experience',
      key: 'experience',
      width: 120,
      ellipsis: true,
      render: (value: string) => (
        <Typography.Text ellipsis={{ tooltip: value || undefined }}>
          {value || '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('employeePage.columns.user'),
      key: 'user',
      width: 180,
      render: (_: unknown, row: Employee) =>
        row.user ? (
          <Flex align='center' gap={6}>
            <UserOutlined style={{ color: '#8c8c8c' }} />
            <Typography.Text ellipsis={{ tooltip: row.user.username }}>
              {row.user.displayName}
            </Typography.Text>
          </Flex>
        ) : (
          '—'
        ),
    },
    {
      title: t('employeePage.columns.hireDate'),
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 130,
      render: (value: string | null) => formatDateOnly(value),
    },
    {
      title: t('employeePage.columns.status'),
      key: 'status',
      width: 120,
      render: (_: unknown, row: Employee) => (
        <Switch
          checked={row.active}
          checkedChildren={t('employeePage.statusActive')}
          unCheckedChildren={t('employeePage.statusInactive')}
          loading={statusBusyId === row.id}
          onChange={(checked) => {
            void onToggleActive(row, checked);
          }}
        />
      ),
    },
    {
      title: t('employeePage.columns.createdBy'),
      key: 'createdBy',
      width: 180,
      render: (_: unknown, row: Employee) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('employeePage.columns.updatedBy'),
      key: 'updatedBy',
      width: 180,
      render: (_: unknown, row: Employee) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: actionsTitle,
      key: 'actions',
      width: 80,
      fixed: 'right',
      align: 'center',
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_: unknown, row: Employee) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: t('employeePage.actions.edit'),
                onClick: () => openEdit(row),
              },
            ],
          }}
        >
          <Button
            type='text'
            size='small'
            icon={<MoreOutlined />}
            aria-label={t('employeePage.actions.menu')}
          />
        </Dropdown>
      ),
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
              { label: t('employeePage.filterActive'), value: 'active' },
              {
                label: t('employeePage.filterInactive'),
                value: 'inactive',
              },
            ]}
            onChange={(value) => {
              setActiveFilter(value as ActiveFilter);
              setPage(1);
            }}
          />
          <Flex wrap gap={8} align='center'>
            <Input.Search
              allowClear
              size='middle'
              value={searchInput}
              placeholder={t('employeePage.searchPlaceholder')}
              prefix={<SearchOutlined />}
              onChange={(event) => setSearchInput(event.target.value)}
              onSearch={onSearch}
              style={{ width: 280, maxWidth: '100%' }}
            />
            <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
              {t('employeePage.addNew')}
            </Button>
          </Flex>
        </Flex>

        <Flex wrap gap={8} align='center'>
          <Select
            allowClear
            placeholder={t('employeePage.filterGender')}
            value={genderFilter}
            onChange={(value) => {
              setGenderFilter(value ?? null);
              setPage(1);
            }}
            options={(['MALE', 'FEMALE', 'OTHER'] as EmployeeGender[]).map(
              (gender) => ({
                value: gender,
                label: t(`employeePage.gender.${gender}`),
              }),
            )}
            style={{ width: 140 }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp='label'
            placeholder={t('employeePage.filterTownship')}
            value={townshipFilter}
            onChange={(value) => {
              setTownshipFilter(value ?? null);
              setPage(1);
            }}
            options={townships.map((value) => ({ value, label: value }))}
            style={{ width: 180 }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp='label'
            placeholder={t('employeePage.filterPosition')}
            value={positionFilter}
            onChange={(value) => {
              setPositionFilter(value ?? null);
              setPage(1);
            }}
            options={positions.map((value) => ({ value, label: value }))}
            style={{ width: 180 }}
          />
        </Flex>

        <Table<Employee>
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
            showTotal: (count) => t('employeePage.total', { count }),
          }}
          locale={{
            emptyText: (
              <Empty
                image={
                  <IdcardOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                }
                styles={{ image: { height: 64 } }}
                description={t('employeePage.empty')}
              />
            ),
          }}
          scroll={{ x: 1400 }}
        />
      </Space>
    </div>
  );
}

export default EmployeePage;
