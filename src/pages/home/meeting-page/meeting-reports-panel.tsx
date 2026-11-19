import { DownloadOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Empty,
  Flex,
  Popover,
  Select,
  Spin,
  Table,
  Tabs,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  listEmployeesRequest,
  type Employee,
} from '../../../handlers/employee.handler';
import {
  listMeetingAttendanceRequest,
  type MeetingAttendance,
  type MeetingAttendanceEmployee,
} from '../../../handlers/meeting-attendance.handler';
import {
  listMeetingAllowancesRequest,
  type MeetingAllowance,
} from '../../../handlers/meeting-allowance.handler';
import type { Meeting } from '../../../handlers/meeting.handler';
import { listPositionsRequest } from '../../../handlers/position.handler';
import {
  listTownshipsRequest,
  type Township,
} from '../../../handlers/township.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { translateEn, useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatMeetingDateTimeRange } from '../../../tools/format-date.tool';
import {
  downloadAllowanceReportExcel,
  downloadAttendanceReportExcel,
} from './meeting-reports-excel.tool';
import { buildMeetingReportFilename } from './meeting-reports-filename.tool';
import { ReportsSummaryTab } from './meeting-reports-summary-tab';

const REPORT_TABS = ['attendance', 'allowance', 'summary'] as const;
type ReportTab = (typeof REPORT_TABS)[number];

function isReportTab(value: string | null): value is ReportTab {
  return REPORT_TABS.includes(value as ReportTab);
}

const ORGANIZATION = 'HLU';
const REPORT_PAGE_SIZE = 100;

/** Sentinel for attendees with no township (head office). */
const TOWNSHIP_FILTER_NONE = '__none__';

const ATTENDANCE_TOWNSHIPS_PARAM = 'attendanceTownships';
const ALLOWANCE_TOWNSHIPS_PARAM = 'allowanceTownships';
const ADD_HEAD_OFFICE_PARAM = 'addHeadOffice';
const HEAD_OFFICE_POSITION_CODE = 'HEAD_OFFICE_POSITION';

function parseTownshipIdsParam(value: string | null): string[] {
  if (!value?.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function writeTownshipIdsParam(
  searchParams: URLSearchParams,
  key: string,
  townshipIds: string[],
) {
  const next = new URLSearchParams(searchParams);
  if (townshipIds.length === 0) {
    next.delete(key);
  } else {
    next.set(key, townshipIds.join(','));
  }
  return next;
}

function filterAttendeesByTownship(
  items: MeetingAttendance[],
  townshipIds: string[],
) {
  if (townshipIds.length === 0) {
    return items;
  }
  const includeNone = townshipIds.includes(TOWNSHIP_FILTER_NONE);
  const selected = new Set(
    townshipIds.filter((id) => id !== TOWNSHIP_FILTER_NONE),
  );
  return items.filter((row) => {
    const id = row.employee?.townshipId;
    if (id == null || id === '') {
      return includeNone;
    }
    return selected.has(id);
  });
}

function useTownships() {
  const [townships, setTownships] = useState<Township[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await listTownshipsRequest({
          active: true,
          page: 1,
          limit: 200,
        });
        if (!cancelled) {
          setTownships(result.items);
        }
      } catch {
        if (!cancelled) {
          setTownships([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return townships;
}

function ReportTownshipFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const { t } = useI18n();
  const townships = useTownships();

  return (
    <Flex wrap gap={8} align='center'>
      <Typography.Text type='secondary'>
        {t('meetingReportsPanel.filters.township')}
      </Typography.Text>
      <Select
        mode='multiple'
        allowClear
        showSearch
        optionFilterProp='label'
        value={value}
        onChange={onChange}
        placeholder={
          placeholder ?? t('meetingReportsPanel.filters.townshipAll')
        }
        style={{ minWidth: 280, flex: 1 }}
        popupMatchSelectWidth={false}
        options={[
          {
            value: TOWNSHIP_FILTER_NONE,
            label: t('meetingReportsPanel.filters.townshipNone'),
          },
          ...townships.map((township) => ({
            value: township.id,
            label: `${township.name} (${township.code})`,
          })),
        ]}
      />
    </Flex>
  );
}

function formatEmployeeName(row: MeetingAttendance) {
  const title = row.employee?.titleName?.trim();
  const name = row.employee?.displayName?.trim() || '';
  if (title && name) {
    return `${title} ${name}`;
  }
  return name || title || '—';
}

function formatGenderLabel(
  gender: string | null | undefined,
  t: (key: string) => string,
) {
  if (!gender) {
    return '—';
  }
  if (gender === 'MALE' || gender === 'FEMALE' || gender === 'OTHER') {
    return t(`employeePage.gender.${gender}`);
  }
  return gender;
}

function EmployeeDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <Typography.Text type='secondary' style={{ flex: '0 0 110px' }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ flex: 1, wordBreak: 'break-word' }}>
        {value}
      </Typography.Text>
    </div>
  );
}

function ReportEmployeeName({ row }: { row: MeetingAttendance }) {
  const { t } = useI18n();
  const displayName = formatEmployeeName(row);
  const employee: MeetingAttendanceEmployee | null = row.employee;

  if (!employee) {
    return <>{displayName}</>;
  }

  return (
    <Popover
      trigger='hover'
      placement='rightTop'
      content={
        <div style={{ minWidth: 240, maxWidth: 360 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {displayName}
          </Typography.Text>
          <EmployeeDetailRow
            label={t('meetingReportsPanel.employeeDetail.employeeNo')}
            value={employee.employeeNo || '—'}
          />
          <EmployeeDetailRow
            label={t('meetingReportsPanel.employeeDetail.focalNo')}
            value={employee.focalNo || '—'}
          />
          <EmployeeDetailRow
            label={t('meetingReportsPanel.employeeDetail.gender')}
            value={formatGenderLabel(employee.gender, t)}
          />
          <EmployeeDetailRow
            label={t('meetingReportsPanel.employeeDetail.township')}
            value={employee.townshipName?.trim() || '—'}
          />
          <EmployeeDetailRow
            label={t('meetingReportsPanel.employeeDetail.position')}
            value={employee.positionName?.trim() || '—'}
          />
          <EmployeeDetailRow
            label={t('meetingReportsPanel.employeeDetail.experience')}
            value={employee.experience?.trim() || '—'}
          />
        </div>
      }
    >
      <span
        style={{
          cursor: 'default',
          borderBottom: '1px dotted rgba(0, 0, 0, 0.25)',
        }}
      >
        {displayName}
      </span>
    </Popover>
  );
}

function formatAmount(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function isHeadOfficeAttendee(row: MeetingAttendance) {
  const id = row.employee?.townshipId;
  return id == null || id === '';
}

function isHeadOfficePerson(
  row: MeetingAttendance,
  headOfficeEmployeeIds: Set<string>,
) {
  if (isHeadOfficeAttendee(row)) {
    return true;
  }
  const employeeId = row.employee?.id;
  return Boolean(employeeId && headOfficeEmployeeIds.has(employeeId));
}

function allowanceAmountForAttendee(
  allowance: MeetingAllowance,
  row: MeetingAttendance,
  field: 'unitPrice' | 'quantity' | 'totalAmount',
  headOfficeEmployeeIds: Set<string>,
) {
  if (
    allowance.excludeHeadOffice &&
    isHeadOfficePerson(row, headOfficeEmployeeIds)
  ) {
    return '0';
  }
  return allowance[field];
}

function sumAllowanceTotalsForAttendee(
  allowances: MeetingAllowance[],
  row: MeetingAttendance,
  headOfficeEmployeeIds: Set<string>,
) {
  return allowances.reduce((acc, allowance) => {
    const parsed = Number(
      allowanceAmountForAttendee(
        allowance,
        row,
        'totalAmount',
        headOfficeEmployeeIds,
      ),
    );
    return acc + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

function employeeAsAttendanceRow(
  employee: Employee,
  meetingId: string,
): MeetingAttendance {
  return {
    id: `head-office-${employee.id}`,
    meetingId,
    remark: null,
    active: true,
    createdDate: employee.createdDate,
    updatedDate: employee.updatedDate,
    createdBy: null,
    updatedBy: null,
    employee: {
      id: employee.id,
      employeeNo: employee.employeeNo,
      focalNo: employee.focalNo,
      displayName: employee.displayName,
      titleName: employee.title?.name ?? null,
      gender: employee.gender,
      townshipId: employee.township?.id ?? null,
      townshipName: employee.township?.name ?? null,
      positionName: employee.position?.name ?? null,
      experience: employee.experience ?? null,
    },
  };
}

async function loadHeadOfficePositionEmployees() {
  const positions = await listPositionsRequest({
    active: true,
    page: 1,
    limit: 200,
  });
  const hoPositions = positions.items.filter(
    (position) => position.category?.code === HEAD_OFFICE_POSITION_CODE,
  );
  if (hoPositions.length === 0) {
    return [] as Employee[];
  }

  const collected: Employee[] = [];
  const seen = new Set<string>();
  for (const position of hoPositions) {
    let page = 1;
    let total = 0;
    do {
      const result = await listEmployeesRequest({
        active: true,
        position: position.name,
        page,
        limit: REPORT_PAGE_SIZE,
      });
      for (const employee of result.items) {
        if (seen.has(employee.id)) {
          continue;
        }
        seen.add(employee.id);
        collected.push(employee);
      }
      total = result.total;
      page += 1;
    } while ((page - 1) * REPORT_PAGE_SIZE < total);
  }
  return collected;
}

function countAllowanceLeafColumns(allowances: MeetingAllowance[]) {
  return allowances.reduce((acc, allowance) => {
    return acc + (allowance.showTotalOnly ? 1 : 3);
  }, 0);
}

/** Township name ASC, then person name ASC (same string as the Name column). */
function sortAttendeesByTownshipThenName(items: MeetingAttendance[]) {
  return [...items].sort((a, b) => {
    const townshipA = a.employee?.townshipName?.trim() || '';
    const townshipB = b.employee?.townshipName?.trim() || '';
    const byTownship = townshipA.localeCompare(townshipB, undefined, {
      sensitivity: 'base',
    });
    if (byTownship !== 0) {
      return byTownship;
    }
    return formatEmployeeName(a).localeCompare(formatEmployeeName(b), undefined, {
      sensitivity: 'base',
    });
  });
}

async function loadAllAttendance(meetingId: string) {
  const collected: MeetingAttendance[] = [];
  let page = 1;
  let total = 0;
  do {
    const result = await listMeetingAttendanceRequest({
      meetingId,
      active: true,
      page,
      limit: REPORT_PAGE_SIZE,
    });
    collected.push(...result.items);
    total = result.total;
    page += 1;
  } while (collected.length < total && page <= 20);
  return sortAttendeesByTownshipThenName(collected);
}

/** Allowance report columns follow sequenceNo ASC (then name). */
function sortAllowancesBySequence(items: MeetingAllowance[]) {
  return [...items].sort((a, b) => {
    const bySequence = (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0);
    if (bySequence !== 0) {
      return bySequence;
    }
    return (a.name || '').localeCompare(b.name || '', undefined, {
      sensitivity: 'base',
    });
  });
}

async function loadAllAllowances(meetingId: string) {
  const collected: MeetingAllowance[] = [];
  let page = 1;
  let total = 0;
  do {
    const result = await listMeetingAllowancesRequest({
      meetingId,
      active: true,
      page,
      limit: REPORT_PAGE_SIZE,
    });
    collected.push(...result.items);
    total = result.total;
    page += 1;
  } while (collected.length < total && page <= 20);
  return sortAllowancesBySequence(collected);
}

function ReportHeader({
  reportTitle,
  meeting,
}: {
  reportTitle: string;
  meeting: Meeting;
}) {
  const rows: Array<{ label: string; value: string }> = [
    {
      label: translateEn('meetingReportsPanel.header.projectTitle'),
      value: meeting.project?.name || '—',
    },
    {
      label: translateEn('meetingReportsPanel.header.meetingTopic'),
      value: meeting.name || '—',
    },
    {
      label: translateEn('meetingReportsPanel.header.dateAndTime'),
      value: formatMeetingDateTimeRange(meeting.fromDate, meeting.toDate),
    },
    {
      label: translateEn('meetingReportsPanel.header.place'),
      value: meeting.place?.trim() || '—',
    },
  ];

  return (
    <div style={{ marginBottom: 24 }}>
      <Typography.Title
        level={3}
        style={{
          textAlign: 'center',
          marginTop: 0,
          marginBottom: 20,
          fontWeight: 600,
        }}
      >
        {reportTitle}
      </Typography.Title>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 180px) 1fr',
          columnGap: 16,
          rowGap: 8,
          maxWidth: 720,
        }}
      >
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'contents' }}>
            <Typography.Text type='secondary'>{row.label}</Typography.Text>
            <Typography.Text>{row.value}</Typography.Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignOffField({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        columnGap: 8,
        alignItems: 'end',
      }}
    >
      <Typography.Text style={{ width: 88, whiteSpace: 'nowrap' }}>
        {label}
      </Typography.Text>
      <div
        style={{
          borderBottom: '1px solid rgba(5, 5, 5, 0.45)',
          minHeight: 18,
        }}
      />
    </div>
  );
}

function AllowanceSignOffBlock({ role }: { role: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        maxWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Typography.Text strong style={{ marginBottom: 4 }}>
        {role}
      </Typography.Text>
      <div style={{ height: 56 }} aria-hidden />
      <SignOffField
        label={translateEn('meetingReportsPanel.signOff.signature')}
      />
      <SignOffField label={translateEn('meetingReportsPanel.signOff.name')} />
      <SignOffField
        label={translateEn('meetingReportsPanel.signOff.position')}
      />
      <SignOffField label={translateEn('meetingReportsPanel.signOff.date')} />
    </div>
  );
}

function AllowanceSignOffFooter() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
        marginTop: 40,
        flexWrap: 'wrap',
      }}
    >
      <AllowanceSignOffBlock
        role={translateEn('meetingReportsPanel.signOff.preparedBy')}
      />
      <AllowanceSignOffBlock
        role={translateEn('meetingReportsPanel.signOff.approvedBy')}
      />
      <AllowanceSignOffBlock
        role={translateEn('meetingReportsPanel.signOff.verifiedBy')}
      />
    </div>
  );
}

function AttendanceReportTab({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { confirmDialog } = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<MeetingAttendance[]>([]);
  const townshipIds = useMemo(
    () => parseTownshipIdsParam(searchParams.get(ATTENDANCE_TOWNSHIPS_PARAM)),
    [searchParams],
  );
  const setTownshipIds = (ids: string[]) => {
    setSearchParams(
      writeTownshipIdsParam(searchParams, ATTENDANCE_TOWNSHIPS_PARAM, ids),
      { replace: true },
    );
  };
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const collected = await loadAllAttendance(meeting.id);
        if (!cancelled) {
          setItems(collected);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('meetingReportsPanel.attendanceLoadFailed'),
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
  }, [meeting.id, showToast, t]);

  const filteredItems = useMemo(
    () => filterAttendeesByTownship(items, townshipIds),
    [items, townshipIds],
  );

  const onDownloadExcel = async () => {
    const confirmed = await confirmDialog({
      title: t('meetingReportsPanel.downloadExcelConfirmTitle'),
      message: t('meetingReportsPanel.downloadExcelConfirmMessage', {
        count: filteredItems.length,
      }),
      okText: t('meetingReportsPanel.downloadExcelConfirmOk'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) {
      return;
    }

    setDownloading(true);
    try {
      await downloadAttendanceReportExcel({
        meeting,
        attendees: filteredItems,
        dateTimeValue: formatMeetingDateTimeRange(
          meeting.fromDate,
          meeting.toDate,
        ),
        genderLabel: (gender) => {
          if (!gender) {
            return '';
          }
          const key = `employeePage.gender.${gender}`;
          const label = translateEn(key);
          return label === key ? gender : label;
        },
        labels: {
          reportTitle: translateEn('meetingReportsPanel.titles.attendanceList'),
          projectTitle: translateEn('meetingReportsPanel.header.projectTitle'),
          meetingTopic: translateEn('meetingReportsPanel.header.meetingTopic'),
          dateAndTime: translateEn('meetingReportsPanel.header.dateAndTime'),
          place: translateEn('meetingReportsPanel.header.place'),
          no: translateEn('meetingReportsPanel.columns.no'),
          srNo: translateEn('meetingReportsPanel.columns.srNo'),
          name: translateEn('meetingReportsPanel.columns.name'),
          gender: translateEn('meetingReportsPanel.columns.gender'),
          township: translateEn('meetingReportsPanel.columns.township'),
          organization: translateEn('meetingReportsPanel.columns.organization'),
          designation: translateEn('meetingReportsPanel.columns.designation'),
          experience: translateEn('meetingReportsPanel.columns.experience'),
          unitPrice: translateEn('meetingReportsPanel.columns.unitPrice'),
          quantity: translateEn('meetingReportsPanel.columns.quantity'),
          lineTotal: translateEn('meetingReportsPanel.columns.lineTotal'),
          totalAmount: translateEn('meetingReportsPanel.columns.totalAmount'),
          signature: translateEn('meetingReportsPanel.columns.signature'),
          remark: translateEn('meetingReportsPanel.columns.remark'),
          footerTotal: translateEn('meetingReportsPanel.footerTotal'),
          filename: buildMeetingReportFilename(meeting.name, 'xlsx'),
        },
      });
      showToast({
        message: t('meetingReportsPanel.downloadExcelSuccess'),
        severity: 'success',
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingReportsPanel.downloadExcelFailed'),
        severity: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  const columns: ColumnsType<MeetingAttendance> = [
    {
      title: translateEn('meetingReportsPanel.columns.no'),
      key: 'no',
      width: 56,
      align: 'center',
      render: (_value, _row, index) => index + 1,
    },
    {
      title: translateEn('meetingReportsPanel.columns.name'),
      key: 'name',
      render: (_value, row) => <ReportEmployeeName row={row} />,
    },
    {
      title: translateEn('meetingReportsPanel.columns.gender'),
      key: 'gender',
      render: (_value, row) => {
        const gender = row.employee?.gender;
        if (!gender) {
          return '—';
        }
        const key = `employeePage.gender.${gender}`;
        const label = translateEn(key);
        return label === key ? gender : label;
      },
    },
    {
      title: translateEn('meetingReportsPanel.columns.township'),
      key: 'township',
      render: (_value, row) => row.employee?.townshipName || '—',
    },
    {
      title: translateEn('meetingReportsPanel.columns.organization'),
      key: 'organization',
      render: () => ORGANIZATION,
    },
    {
      title: translateEn('meetingReportsPanel.columns.designation'),
      key: 'designation',
      width: 160,
      render: (_value, row) => row.employee?.positionName || '—',
    },
    {
      title: translateEn('meetingReportsPanel.columns.experience'),
      key: 'experience',
      width: 180,
      render: (_value, row) => row.employee?.experience || '—',
    },
    {
      title: translateEn('meetingReportsPanel.columns.remark'),
      key: 'remark',
      render: (_value, row) => row.remark || '—',
    },
  ];

  let body: ReactNode;
  if (loading) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  } else {
    body = (
      <Table<MeetingAttendance>
        className='meeting-report-table'
        rowKey='id'
        size='small'
        bordered
        pagination={false}
        columns={columns}
        dataSource={filteredItems}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('meetingReportsPanel.attendanceEmpty')}
            />
          ),
        }}
      />
    );
  }

  return (
    <div>
      <Flex
        justify='space-between'
        align='center'
        wrap
        gap={12}
        style={{ marginBottom: 12 }}
      >
        <ReportTownshipFilter value={townshipIds} onChange={setTownshipIds} />
        <Button
          type='primary'
          icon={<DownloadOutlined />}
          loading={downloading}
          disabled={loading || filteredItems.length === 0}
          onClick={() => {
            void onDownloadExcel();
          }}
        >
          {t('meetingReportsPanel.downloadExcel')}
        </Button>
      </Flex>
      <ReportHeader
        reportTitle={translateEn('meetingReportsPanel.titles.attendanceList')}
        meeting={meeting}
      />
      {body}
    </div>
  );
}

function AllowanceReportTab({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { confirmDialog } = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [attendees, setAttendees] = useState<MeetingAttendance[]>([]);
  const [allowances, setAllowances] = useState<MeetingAllowance[]>([]);
  const [headOfficeEmployees, setHeadOfficeEmployees] = useState<Employee[]>(
    [],
  );
  const townshipIds = useMemo(
    () => parseTownshipIdsParam(searchParams.get(ALLOWANCE_TOWNSHIPS_PARAM)),
    [searchParams],
  );
  const setTownshipIds = (ids: string[]) => {
    setSearchParams(
      writeTownshipIdsParam(searchParams, ALLOWANCE_TOWNSHIPS_PARAM, ids),
      { replace: true },
    );
  };
  const addHeadOffice = searchParams.get(ADD_HEAD_OFFICE_PARAM) === '1';
  const setAddHeadOffice = (checked: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (checked) {
      next.set(ADD_HEAD_OFFICE_PARAM, '1');
    } else {
      next.delete(ADD_HEAD_OFFICE_PARAM);
    }
    setSearchParams(next, { replace: true });
  };
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [attendanceRows, allowanceRows, hoEmployees] = await Promise.all([
          loadAllAttendance(meeting.id),
          loadAllAllowances(meeting.id),
          loadHeadOfficePositionEmployees(),
        ]);
        if (!cancelled) {
          setAttendees(attendanceRows);
          setAllowances(allowanceRows);
          setHeadOfficeEmployees(hoEmployees);
        }
      } catch (error) {
        if (!cancelled) {
          setAttendees([]);
          setAllowances([]);
          setHeadOfficeEmployees([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('meetingReportsPanel.allowanceLoadFailed'),
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
  }, [meeting.id, showToast, t]);

  const headOfficeEmployeeIds = useMemo(
    () => new Set(headOfficeEmployees.map((employee) => employee.id)),
    [headOfficeEmployees],
  );

  const townshipSelected = townshipIds.length > 0;
  const filteredAttendees = useMemo(() => {
    if (!townshipSelected) {
      return [];
    }
    const base = filterAttendeesByTownship(attendees, townshipIds);
    if (!addHeadOffice) {
      return base;
    }
    const seen = new Set(
      base
        .map((row) => row.employee?.id)
        .filter((id): id is string => Boolean(id)),
    );
    const extras = headOfficeEmployees
      .filter((employee) => !seen.has(employee.id))
      .map((employee) => employeeAsAttendanceRow(employee, meeting.id));
    return sortAttendeesByTownshipThenName([...base, ...extras]);
  }, [
    addHeadOffice,
    attendees,
    headOfficeEmployees,
    meeting.id,
    townshipIds,
    townshipSelected,
  ]);

  const grandTotalAmount = useMemo(() => {
    const total = filteredAttendees.reduce(
      (acc, row) =>
        acc +
        sumAllowanceTotalsForAttendee(allowances, row, headOfficeEmployeeIds),
      0,
    );
    return formatAmount(String(total));
  }, [allowances, filteredAttendees, headOfficeEmployeeIds]);
  const allowanceLeafCount = useMemo(
    () => countAllowanceLeafColumns(allowances),
    [allowances],
  );

  const columns = useMemo<ColumnsType<MeetingAttendance>>(() => {
    const sepHeader = () => ({ className: 'meeting-report-allowance-sep' });
    const sepCell = () => ({ className: 'meeting-report-allowance-sep' });
    const allowanceColumns: ColumnsType<MeetingAttendance> = [];

    for (const allowance of allowances) {
      if (allowance.showTotalOnly) {
        allowanceColumns.push({
          title:
            allowance.totalAmountLabel?.trim() ||
            allowance.name ||
            translateEn('meetingReportsPanel.columns.lineTotal'),
          key: `${allowance.id}-total`,
          width: 120,
          align: 'right',
          onHeaderCell: sepHeader,
          onCell: sepCell,
          render: (_value, row) =>
            formatAmount(
              allowanceAmountForAttendee(
                allowance,
                row,
                'totalAmount',
                headOfficeEmployeeIds,
              ),
            ),
        });
        continue;
      }

      allowanceColumns.push({
        title: allowance.name,
        key: `${allowance.id}-group`,
        align: 'center',
        onHeaderCell: sepHeader,
        children: [
          {
            title:
              allowance.unitPriceLabel?.trim() ||
              translateEn('meetingReportsPanel.columns.unitPrice'),
            key: `${allowance.id}-unitPrice`,
            width: 110,
            align: 'right',
            onHeaderCell: sepHeader,
            onCell: sepCell,
            render: (_value, row) =>
              formatAmount(
                allowanceAmountForAttendee(
                  allowance,
                  row,
                  'unitPrice',
                  headOfficeEmployeeIds,
                ),
              ),
          },
          {
            title:
              allowance.quantityLabel?.trim() ||
              translateEn('meetingReportsPanel.columns.quantity'),
            key: `${allowance.id}-quantity`,
            align: 'right',
            render: (_value, row) =>
              formatAmount(
                allowanceAmountForAttendee(
                  allowance,
                  row,
                  'quantity',
                  headOfficeEmployeeIds,
                ),
              ),
          },
          {
            title: (
              <Typography.Text strong>
                {allowance.totalAmountLabel?.trim() ||
                  translateEn('meetingReportsPanel.columns.lineTotal')}
              </Typography.Text>
            ),
            key: `${allowance.id}-total`,
            width: 110,
            align: 'right',
            render: (_value, row) => (
              <Typography.Text strong>
                {formatAmount(
                  allowanceAmountForAttendee(
                    allowance,
                    row,
                    'totalAmount',
                    headOfficeEmployeeIds,
                  ),
                )}
              </Typography.Text>
            ),
          },
        ],
      });
    }

    return [
      {
        title: translateEn('meetingReportsPanel.columns.srNo'),
        key: 'srNo',
        width: 64,
        align: 'center',
        fixed: 'left',
        render: (_value, _row, index) => index + 1,
      },
      {
        title: translateEn('meetingReportsPanel.columns.name'),
        key: 'name',
        fixed: 'left',
        width: 200,
        render: (_value, row) => <ReportEmployeeName row={row} />,
      },
      {
        title: translateEn('meetingReportsPanel.columns.township'),
        key: 'township',
        render: (_value, row) => row.employee?.townshipName || '—',
      },
      ...allowanceColumns,
      {
        title: (
          <Typography.Text strong>
            {translateEn('meetingReportsPanel.columns.totalAmount')}
          </Typography.Text>
        ),
        key: 'totalAmount',
        width: 130,
        align: 'right',
        onHeaderCell: sepHeader,
        onCell: sepCell,
        render: (_value, row) =>
          allowances.length ? (
            <Typography.Text strong>
              {formatAmount(
                String(
                  sumAllowanceTotalsForAttendee(
                    allowances,
                    row,
                    headOfficeEmployeeIds,
                  ),
                ),
              )}
            </Typography.Text>
          ) : (
            '—'
          ),
      },
      {
        title: translateEn('meetingReportsPanel.columns.signature'),
        key: 'signature',
        width: 140,
        render: () => '',
      },
      {
        title: translateEn('meetingReportsPanel.columns.remark'),
        key: 'remark',
        width: 160,
        render: (_value, row) => row.remark || '',
      },
    ];
  }, [allowances, headOfficeEmployeeIds]);

  const onDownloadExcel = async () => {
    if (!townshipSelected || filteredAttendees.length === 0) {
      return;
    }

    const confirmed = await confirmDialog({
      title: t('meetingReportsPanel.downloadExcelConfirmTitle'),
      message: t('meetingReportsPanel.downloadExcelConfirmMessage', {
        count: filteredAttendees.length,
      }),
      okText: t('meetingReportsPanel.downloadExcelConfirmOk'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) {
      return;
    }

    setDownloading(true);
    try {
      await downloadAllowanceReportExcel({
        meeting,
        attendees: filteredAttendees,
        allowances,
        headOfficeEmployeeIds: [...headOfficeEmployeeIds],
        dateTimeValue: formatMeetingDateTimeRange(
          meeting.fromDate,
          meeting.toDate,
        ),
        labels: {
          reportTitle: translateEn('meetingReportsPanel.titles.allowanceReceipt'),
          projectTitle: translateEn('meetingReportsPanel.header.projectTitle'),
          meetingTopic: translateEn('meetingReportsPanel.header.meetingTopic'),
          dateAndTime: translateEn('meetingReportsPanel.header.dateAndTime'),
          place: translateEn('meetingReportsPanel.header.place'),
          no: translateEn('meetingReportsPanel.columns.no'),
          srNo: translateEn('meetingReportsPanel.columns.srNo'),
          name: translateEn('meetingReportsPanel.columns.name'),
          gender: translateEn('meetingReportsPanel.columns.gender'),
          township: translateEn('meetingReportsPanel.columns.township'),
          organization: translateEn('meetingReportsPanel.columns.organization'),
          designation: translateEn('meetingReportsPanel.columns.designation'),
          experience: translateEn('meetingReportsPanel.columns.experience'),
          unitPrice: translateEn('meetingReportsPanel.columns.unitPrice'),
          quantity: translateEn('meetingReportsPanel.columns.quantity'),
          lineTotal: translateEn('meetingReportsPanel.columns.lineTotal'),
          totalAmount: translateEn('meetingReportsPanel.columns.totalAmount'),
          signature: translateEn('meetingReportsPanel.columns.signature'),
          remark: translateEn('meetingReportsPanel.columns.remark'),
          footerTotal: translateEn('meetingReportsPanel.footerTotal'),
          filename: buildMeetingReportFilename(meeting.name, 'xlsx'),
          signOff: {
            preparedBy: translateEn('meetingReportsPanel.signOff.preparedBy'),
            approvedBy: translateEn('meetingReportsPanel.signOff.approvedBy'),
            verifiedBy: translateEn('meetingReportsPanel.signOff.verifiedBy'),
            signature: translateEn('meetingReportsPanel.signOff.signature'),
            name: translateEn('meetingReportsPanel.signOff.name'),
            position: translateEn('meetingReportsPanel.signOff.position'),
            date: translateEn('meetingReportsPanel.signOff.date'),
          },
        },
      });
      showToast({
        message: t('meetingReportsPanel.downloadExcelSuccess'),
        severity: 'success',
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingReportsPanel.downloadExcelFailed'),
        severity: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  } else {
    body = (
      <Table<MeetingAttendance>
        className='meeting-report-table meeting-report-allowance-table'
        rowKey='id'
        size='small'
        bordered
        pagination={false}
        columns={columns}
        dataSource={filteredAttendees}
        scroll={{ x: 'max-content' }}
        summary={() => {
          if (filteredAttendees.length === 0) {
            return null;
          }
          const fixedLeft = 3;
          const totalAmountIndex = fixedLeft + allowanceLeafCount;
          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={fixedLeft} align='right'>
                  <Typography.Text strong>
                    {translateEn('meetingReportsPanel.footerTotal')}
                  </Typography.Text>
                </Table.Summary.Cell>
                {Array.from({ length: allowanceLeafCount }, (_, i) => (
                  <Table.Summary.Cell
                    key={`allowance-sum-${i}`}
                    index={fixedLeft + i}
                  />
                ))}
                <Table.Summary.Cell
                  index={totalAmountIndex}
                  align='right'
                  className='meeting-report-allowance-sep'
                >
                  <Typography.Text strong>{grandTotalAmount}</Typography.Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={totalAmountIndex + 1} />
                <Table.Summary.Cell index={totalAmountIndex + 2} />
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                !townshipSelected
                  ? t('meetingReportsPanel.filters.townshipRequired')
                  : allowances.length === 0
                    ? t('meetingReportsPanel.allowanceEmpty')
                    : t('meetingReportsPanel.attendanceEmpty')
              }
            />
          ),
        }}
      />
    );
  }

  return (
    <div>
      <Flex
        justify='space-between'
        align='center'
        wrap
        gap={12}
        style={{ marginBottom: 12 }}
      >
        <Flex wrap gap={12} align='center' style={{ flex: 1, minWidth: 0 }}>
          <ReportTownshipFilter
            value={townshipIds}
            onChange={setTownshipIds}
            placeholder={t('meetingReportsPanel.filters.townshipRequired')}
          />
          <Checkbox
            checked={addHeadOffice}
            onChange={(event) => {
              setAddHeadOffice(event.target.checked);
            }}
          >
            {t('meetingReportsPanel.filters.addHeadOffice')}
          </Checkbox>
        </Flex>
        <Button
          type='primary'
          icon={<DownloadOutlined />}
          loading={downloading}
          disabled={
            loading || !townshipSelected || filteredAttendees.length === 0
          }
          onClick={() => {
            void onDownloadExcel();
          }}
        >
          {t('meetingReportsPanel.downloadExcel')}
        </Button>
      </Flex>
      <ReportHeader
        reportTitle={translateEn('meetingReportsPanel.titles.allowanceReceipt')}
        meeting={meeting}
      />
      {body}
      {loading || !townshipSelected ? null : <AllowanceSignOffFooter />}
    </div>
  );
}

/** Reports panel for a meeting (Attendance / Allowance tabs). */
export function MeetingReportsPanel({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = isReportTab(searchParams.get('tab'))
    ? searchParams.get('tab')!
    : 'attendance';

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => {
        if (!isReportTab(key)) {
          return;
        }
        const next = new URLSearchParams(searchParams);
        next.set('tab', key);
        setSearchParams(next, { replace: true });
      }}
      items={[
        {
          key: 'attendance',
          label: t('meetingReportsPanel.tabs.attendance'),
          children: <AttendanceReportTab meeting={meeting} />,
        },
        {
          key: 'allowance',
          label: t('meetingReportsPanel.tabs.allowance'),
          children: <AllowanceReportTab meeting={meeting} />,
        },
        {
          key: 'summary',
          label: t('meetingReportsPanel.tabs.summary'),
          children: <ReportsSummaryTab meeting={meeting} />,
        },
      ]}
    />
  );
}
