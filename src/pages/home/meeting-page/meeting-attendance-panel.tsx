import {
  ImportOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
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
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createMeetingAttendanceRequest,
  listMeetingAttendanceRequest,
  setMeetingAttendanceActiveRequest,
  type MeetingAttendance,
} from '../../../handlers/meeting-attendance.handler';
import {
  listEmployeesRequest,
  type Employee,
} from '../../../handlers/employee.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';

const DEFAULT_PAGE_SIZE = 20;
const EMPLOYEE_SEARCH_LIMIT = 50;
const EMPLOYEE_SEARCH_DEBOUNCE_MS = 300;
type ActiveFilter = 'active' | 'inactive';

function formatEmployeeName(row: MeetingAttendance) {
  const title = row.employee?.titleName?.trim();
  const name = row.employee?.displayName?.trim() || '';
  if (title && name) {
    return `${title} ${name}`;
  }
  return name || title || '—';
}

function formatEmployeeOptionLabel(employee: Employee) {
  const title = employee.title?.name?.trim();
  const name = employee.displayName?.trim() || '';
  const display = title && name ? `${title} ${name}` : name || title || '—';
  return (
    <div style={{ lineHeight: 1.3, paddingBlock: 2 }}>
      <div>{display}</div>
      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
        {employee.employeeNo} · {employee.focalNo}
      </Typography.Text>
    </div>
  );
}

function AddAttendanceFormBody({
  meetingId,
  onSaved,
}: {
  meetingId: string;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<{ focalNo: string; remark?: string }>();
  const [saving, setSaving] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);

  const fetchEmployees = (rawQuery?: string, debounce = false) => {
    const q = rawQuery?.trim() || undefined;
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    const run = () => {
      const requestId = ++searchRequestIdRef.current;
      setSearchingEmployees(true);
      void (async () => {
        try {
          const result = await listEmployeesRequest({
            q,
            active: true,
            page: 1,
            limit: EMPLOYEE_SEARCH_LIMIT,
          });
          if (requestId === searchRequestIdRef.current) {
            setEmployeeOptions(result.items);
          }
        } catch (error) {
          if (requestId === searchRequestIdRef.current) {
            setEmployeeOptions([]);
            showToast({
              message:
                error instanceof Error
                  ? error.message
                  : t('meetingAttendancePanel.employeeSearchFailed'),
              severity: 'error',
            });
          }
        } finally {
          if (requestId === searchRequestIdRef.current) {
            setSearchingEmployees(false);
          }
        }
      })();
    };

    if (debounce) {
      searchTimerRef.current = setTimeout(run, EMPLOYEE_SEARCH_DEBOUNCE_MS);
      return;
    }
    run();
  };

  useEffect(() => {
    fetchEmployees();
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      searchRequestIdRef.current += 1;
    };
    // Initial load of default options only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                await createMeetingAttendanceRequest({
                  meetingId,
                  focalNo: values.focalNo.trim().toUpperCase(),
                  remark: values.remark?.trim() || null,
                });
                showToast({
                  message: t('meetingAttendancePanel.createSuccess'),
                  severity: 'success',
                });
                closeDialog();
                onSaved();
              } catch (error) {
                showToast({
                  message:
                    error instanceof Error
                      ? error.message
                      : t('meetingAttendancePanel.createFailed'),
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
    meetingId,
    onSaved,
    saving,
    setDialogActions,
    showToast,
    t,
  ]);

  return (
    <Form form={form} layout='vertical' style={{ marginTop: 8 }}>
      <Form.Item
        name='focalNo'
        label={t('meetingAttendancePanel.fields.employee')}
        rules={[
          {
            required: true,
            message: t('meetingAttendancePanel.validation.employeeRequired'),
          },
        ]}
      >
        <Select
          showSearch
          allowClear
          filterOption={false}
          loading={searchingEmployees}
          placeholder={t('meetingAttendancePanel.employeeSearchPlaceholder')}
          notFoundContent={
            searchingEmployees
              ? null
              : employeeOptions.length === 0
                ? t('meetingAttendancePanel.employeeSearchEmpty')
                : null
          }
          onSearch={(value) => fetchEmployees(value, true)}
          onClear={() => fetchEmployees()}
          onDropdownVisibleChange={(open) => {
            if (open && employeeOptions.length === 0 && !searchingEmployees) {
              fetchEmployees();
            }
          }}
          options={employeeOptions.map((employee) => {
            const title = employee.title?.name?.trim();
            const name = employee.displayName?.trim() || '';
            const display =
              title && name ? `${title} ${name}` : name || title || '—';
            return {
              value: employee.focalNo,
              label: formatEmployeeOptionLabel(employee),
              // Plain text for selected-value display in the closed Select.
              title: `${display} · ${employee.employeeNo} · ${employee.focalNo}`,
            };
          })}
          optionLabelProp='title'
        />
      </Form.Item>
      <Form.Item
        name='remark'
        label={t('meetingAttendancePanel.fields.remark')}
      >
        <Input.TextArea rows={3} style={{ resize: 'none' }} />
      </Form.Item>
    </Form>
  );
}

/** Attendance list for a meeting, with mass-import subview. */
export function MeetingAttendancePanel({ meetingId }: { meetingId: string }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const navigate = useNavigate();
  const [items, setItems] = useState<MeetingAttendance[]>([]);
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
        const result = await listMeetingAttendanceRequest({
          meetingId,
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
                : t('meetingAttendancePanel.loadFailed'),
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
  }, [meetingId, page, pageSize, q, activeFilter, reloadKey, showToast, t]);

  const openAdd = () => {
    customDialog({
      title: t('meetingAttendancePanel.createTitle'),
      width: 520,
      content: (
        <AddAttendanceFormBody
          meetingId={meetingId}
          onSaved={() => setReloadKey((key) => key + 1)}
        />
      ),
    });
  };

  const onToggleActive = async (row: MeetingAttendance, nextActive: boolean) => {
    setStatusBusyId(row.id);
    try {
      await setMeetingAttendanceActiveRequest(row.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'meetingAttendancePanel.statusActivateSuccess'
            : 'meetingAttendancePanel.statusDeactivateSuccess',
          { name: formatEmployeeName(row) },
        ),
        severity: 'success',
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingAttendancePanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const columns: ColumnsType<MeetingAttendance> = [
    {
      title: t('meetingAttendancePanel.columns.name'),
      key: 'name',
      fixed: 'left',
      width: 220,
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <Typography.Text style={{ display: 'block', fontSize: 13 }}>
            {formatEmployeeName(row)}
          </Typography.Text>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {row.employee?.employeeNo || '—'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('meetingAttendancePanel.columns.focalNo'),
      key: 'focalNo',
      width: 120,
      render: (_value, row) => row.employee?.focalNo || '—',
    },
    {
      title: t('meetingAttendancePanel.columns.remark'),
      dataIndex: 'remark',
      key: 'remark',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('meetingAttendancePanel.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_value, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <Typography.Text style={{ display: 'block', fontSize: 13 }}>
            {row.createdBy?.name || '—'}
          </Typography.Text>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {formatDisplayDateTime(row.createdDate)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('meetingAttendancePanel.columns.status'),
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
  ];

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (count) => t('meetingAttendancePanel.total', { count }),
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
        <Segmented
          value={activeFilter}
          options={[
            {
              label: t('meetingAttendancePanel.filterActive'),
              value: 'active',
            },
            {
              label: t('meetingAttendancePanel.filterInactive'),
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
            value={searchInput}
            placeholder={t('meetingAttendancePanel.searchPlaceholder')}
            prefix={<SearchOutlined />}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setQ(value.trim());
              setPage(1);
            }}
            style={{ width: 280, maxWidth: '100%' }}
          />
          <Button
            icon={<ImportOutlined />}
            onClick={() =>
              navigate(`/meeting/${meetingId}/attendance-import`)
            }
          >
            {t('meetingAttendancePanel.import.ribbon')}
          </Button>
          <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
            {t('meetingAttendancePanel.addNew')}
          </Button>
        </Flex>
      </Flex>

      <Table<MeetingAttendance>
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
              description={t('meetingAttendancePanel.empty')}
            />
          ),
        }}
      />
    </>
  );
}
