import {
  CopyOutlined,
  DownloadOutlined,
  FileWordOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Flex,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  listEmployeesRequest,
  type Employee,
} from '../../../handlers/employee.handler';
import {
  listMeetingAttendanceRequest,
  type MeetingAttendance,
} from '../../../handlers/meeting-attendance.handler';
import type { Meeting } from '../../../handlers/meeting.handler';
import { listPositionsRequest } from '../../../handlers/position.handler';
import {
  listTownshipsRequest,
  type Township,
} from '../../../handlers/township.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { translateEn, useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { buildMeetingReportFilename } from './meeting-reports-filename.tool';
import { downloadMeetingSummaryReportDocx } from './meeting-reports-summary-docx.tool';

const REPORT_PAGE_SIZE = 100;
const HEAD_OFFICE_KEY = '__head_office__';
const TOWNSHIP_FILTER_NONE = '__none__';
const SUMMARY_TOWNSHIPS_PARAM = 'summaryTownships';
const SUMMARY_ADD_HEAD_OFFICE_PARAM = 'summaryAddHeadOffice';
const HEAD_OFFICE_POSITION_CODE = 'HEAD_OFFICE_POSITION';
/** Table 2: all head-office positions roll up to this category label. */
const PROGRAM_AND_SUPPORTING_CATEGORY = 'Program and Supporting';

type TownshipBucket = {
  key: string;
  name: string;
  isHeadOffice: boolean;
};

type GenderSummaryRow = {
  key: string;
  township: string;
  female: number;
  male: number;
  total: number;
  isTotal?: boolean;
};

type CategorySummaryRow = {
  key: string;
  category: string;
  counts: Record<string, number>;
  total: number;
  isTotal?: boolean;
};

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
  townshipIds: string[],
) {
  const next = new URLSearchParams(searchParams);
  if (townshipIds.length === 0) {
    next.delete(SUMMARY_TOWNSHIPS_PARAM);
  } else {
    next.set(SUMMARY_TOWNSHIPS_PARAM, townshipIds.join(','));
  }
  return next;
}

function filterAttendeesByTownship(
  items: MeetingAttendance[],
  townshipIds: string[],
) {
  if (townshipIds.length === 0) {
    return [];
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

function townshipBucket(row: MeetingAttendance): TownshipBucket {
  const id = row.employee?.townshipId;
  const name = row.employee?.townshipName?.trim();
  if (id == null || id === '' || !name) {
    return {
      key: HEAD_OFFICE_KEY,
      name: translateEn('meetingReportsPanel.summary.headOffice'),
      isHeadOffice: true,
    };
  }
  return { key: id, name, isHeadOffice: false };
}

function sortTownshipBuckets(buckets: TownshipBucket[]) {
  return [...buckets].sort((a, b) => {
    if (a.isHeadOffice !== b.isHeadOffice) {
      return a.isHeadOffice ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function sortTownshipColumns(buckets: TownshipBucket[]) {
  return [...buckets].sort((a, b) => {
    if (a.isHeadOffice !== b.isHeadOffice) {
      return a.isHeadOffice ? 1 : -1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
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
  } while ((page - 1) * REPORT_PAGE_SIZE < total);
  return collected;
}

function buildGenderSummary(items: MeetingAttendance[]): GenderSummaryRow[] {
  const map = new Map<
    string,
    { bucket: TownshipBucket; female: number; male: number; total: number }
  >();

  for (const row of items) {
    const bucket = townshipBucket(row);
    const current = map.get(bucket.key) ?? {
      bucket,
      female: 0,
      male: 0,
      total: 0,
    };
    const gender = row.employee?.gender;
    if (gender === 'FEMALE') {
      current.female += 1;
    } else if (gender === 'MALE') {
      current.male += 1;
    }
    current.total += 1;
    map.set(bucket.key, current);
  }

  const rows = sortTownshipBuckets(
    [...map.values()].map((entry) => entry.bucket),
  ).map((bucket) => {
    const entry = map.get(bucket.key)!;
    return {
      key: bucket.key,
      township: bucket.name,
      female: entry.female,
      male: entry.male,
      total: entry.total,
    };
  });

  if (rows.length === 0) {
    return [];
  }

  const totals = rows.reduce(
    (acc, row) => ({
      female: acc.female + row.female,
      male: acc.male + row.male,
      total: acc.total + row.total,
    }),
    { female: 0, male: 0, total: 0 },
  );

  return [
    ...rows,
    {
      key: '__total__',
      township: translateEn('meetingReportsPanel.summary.total'),
      female: totals.female,
      male: totals.male,
      total: totals.total,
      isTotal: true,
    },
  ];
}

function buildCategorySummary(
  items: MeetingAttendance[],
  headOfficeEmployeeIds: Set<string>,
): {
  columns: TownshipBucket[];
  rows: CategorySummaryRow[];
} {
  const townshipMap = new Map<string, TownshipBucket>();
  const categoryMap = new Map<string, Record<string, number>>();

  for (const row of items) {
    const bucket = townshipBucket(row);
    townshipMap.set(bucket.key, bucket);

    const employeeId = row.employee?.id;
    const categoryName =
      employeeId && headOfficeEmployeeIds.has(employeeId)
        ? PROGRAM_AND_SUPPORTING_CATEGORY
        : row.employee?.positionName?.trim() ||
          translateEn('meetingReportsPanel.summary.unknownCategory');
    const counts = categoryMap.get(categoryName) ?? {};
    counts[bucket.key] = (counts[bucket.key] ?? 0) + 1;
    categoryMap.set(categoryName, counts);
  }

  const columns = sortTownshipColumns([...townshipMap.values()]);

  const rows: CategorySummaryRow[] = [...categoryMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([category, counts]) => {
      const normalized: Record<string, number> = {};
      let total = 0;
      for (const column of columns) {
        const value = counts[column.key] ?? 0;
        normalized[column.key] = value;
        total += value;
      }
      return {
        key: category,
        category,
        counts: normalized,
        total,
      };
    });

  if (rows.length === 0) {
    return { columns, rows: [] };
  }

  const totalCounts: Record<string, number> = {};
  let grandTotal = 0;
  for (const column of columns) {
    const value = rows.reduce(
      (acc, row) => acc + (row.counts[column.key] ?? 0),
      0,
    );
    totalCounts[column.key] = value;
    grandTotal += value;
  }

  return {
    columns,
    rows: [
      ...rows,
      {
        key: '__total__',
        category: translateEn('meetingReportsPanel.summary.total'),
        counts: totalCounts,
        total: grandTotal,
        isTotal: true,
      },
    ],
  };
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function tableMatrixToTsv(matrix: Array<Array<string | number>>) {
  return matrix
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell);
          if (/[\t\n\r"]/.test(text)) {
            return `"${text.replaceAll('"', '""')}"`;
          }
          return text;
        })
        .join('\t'),
    )
    .join('\n');
}

function tableMatrixToHtml(matrix: Array<Array<string | number>>) {
  const rows = matrix
    .map((row, rowIndex) => {
      const tag = rowIndex === 0 ? 'th' : 'td';
      const cells = row
        .map((cell) => `<${tag}>${escapeHtml(String(cell))}</${tag}>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table border="1" cellspacing="0" cellpadding="4">${rows}</table>`;
}

async function copyTableMatrix(matrix: Array<Array<string | number>>) {
  const plain = tableMatrixToTsv(matrix);
  const html = tableMatrixToHtml(matrix);
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([plain], { type: 'text/plain' }),
        'text/html': new Blob([html], { type: 'text/html' }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(plain);
}

function downloadTableMatrixExcel(params: {
  matrix: Array<Array<string | number>>;
  sheetName: string;
  filename: string;
}) {
  const { matrix, sheetName, filename } = params;
  const worksheet = XLSX.utils.aoa_to_sheet(matrix);
  worksheet['!cols'] = matrix[0]?.map((cell) => ({
    wch: Math.max(10, String(cell).length + 2),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(
    workbook,
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  );
}

function SummaryTableMenu({
  matrix,
  sheetName,
  filename,
}: {
  matrix: Array<Array<string | number>>;
  sheetName: string;
  filename: string;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          {
            key: 'download-excel',
            icon: <DownloadOutlined />,
            label: t('meetingReportsPanel.summary.menu.downloadExcel'),
            onClick: () => {
              try {
                downloadTableMatrixExcel({ matrix, sheetName, filename });
                showToast({
                  message: t(
                    'meetingReportsPanel.summary.menu.downloadExcelSuccess',
                  ),
                  severity: 'success',
                });
              } catch (error) {
                showToast({
                  message:
                    error instanceof Error
                      ? error.message
                      : t(
                          'meetingReportsPanel.summary.menu.downloadExcelFailed',
                        ),
                  severity: 'error',
                });
              }
            },
          },
          {
            key: 'copy-table',
            icon: <CopyOutlined />,
            label: t('meetingReportsPanel.summary.menu.copyTable'),
            onClick: () => {
              void (async () => {
                try {
                  await copyTableMatrix(matrix);
                  showToast({
                    message: t(
                      'meetingReportsPanel.summary.menu.copyTableSuccess',
                    ),
                    severity: 'success',
                  });
                } catch (error) {
                  showToast({
                    message:
                      error instanceof Error
                        ? error.message
                        : t(
                            'meetingReportsPanel.summary.menu.copyTableFailed',
                          ),
                    severity: 'error',
                  });
                }
              })();
            },
          },
        ],
      }}
    >
      <Button
        type='text'
        icon={<MoreOutlined />}
        aria-label={t('meetingReportsPanel.summary.menu.actions')}
      />
    </Dropdown>
  );
}

/** Summary tables for meeting reports (gender by township + category matrix). */
export function ReportsSummaryTab({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { confirmDialog } = useDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<MeetingAttendance[]>([]);
  const [headOfficeEmployees, setHeadOfficeEmployees] = useState<Employee[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const townships = useTownships();

  const townshipIds = useMemo(
    () => parseTownshipIdsParam(searchParams.get(SUMMARY_TOWNSHIPS_PARAM)),
    [searchParams],
  );
  const setTownshipIds = (ids: string[]) => {
    setSearchParams(writeTownshipIdsParam(searchParams, ids), {
      replace: true,
    });
  };
  const addHeadOffice =
    searchParams.get(SUMMARY_ADD_HEAD_OFFICE_PARAM) === '1';
  const setAddHeadOffice = (checked: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (checked) {
      next.set(SUMMARY_ADD_HEAD_OFFICE_PARAM, '1');
    } else {
      next.delete(SUMMARY_ADD_HEAD_OFFICE_PARAM);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [rows, hoEmployees] = await Promise.all([
          loadAllAttendance(meeting.id),
          loadHeadOfficePositionEmployees(),
        ]);
        if (!cancelled) {
          setItems(rows);
          setHeadOfficeEmployees(hoEmployees);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          setHeadOfficeEmployees([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('meetingReportsPanel.summary.loadFailed'),
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

  const townshipSelected = townshipIds.length > 0;

  const headOfficeEmployeeIds = useMemo(
    () => new Set(headOfficeEmployees.map((employee) => employee.id)),
    [headOfficeEmployees],
  );

  const filteredItems = useMemo(() => {
    if (!townshipSelected) {
      return [];
    }
    const base = filterAttendeesByTownship(items, townshipIds);
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
    return [...base, ...extras];
  }, [
    addHeadOffice,
    headOfficeEmployees,
    items,
    meeting.id,
    townshipIds,
    townshipSelected,
  ]);

  const genderRows = useMemo(
    () => buildGenderSummary(filteredItems),
    [filteredItems],
  );
  const categorySummary = useMemo(
    () => buildCategorySummary(filteredItems, headOfficeEmployeeIds),
    [filteredItems, headOfficeEmployeeIds],
  );

  const genderColumns = useMemo<ColumnsType<GenderSummaryRow>>(
    () => [
      {
        title: translateEn('meetingReportsPanel.summary.columns.township'),
        dataIndex: 'township',
        key: 'township',
        render: (value: string, row) =>
          row.isTotal ? (
            <Typography.Text strong>{value}</Typography.Text>
          ) : (
            value
          ),
      },
      {
        title: translateEn('meetingReportsPanel.summary.columns.female'),
        dataIndex: 'female',
        key: 'female',
        align: 'right',
        width: 100,
        render: (value: number, row) =>
          row.isTotal ? (
            <Typography.Text strong>{value.toLocaleString()}</Typography.Text>
          ) : (
            value.toLocaleString()
          ),
      },
      {
        title: translateEn('meetingReportsPanel.summary.columns.male'),
        dataIndex: 'male',
        key: 'male',
        align: 'right',
        width: 100,
        render: (value: number, row) =>
          row.isTotal ? (
            <Typography.Text strong>{value.toLocaleString()}</Typography.Text>
          ) : (
            value.toLocaleString()
          ),
      },
      {
        title: translateEn('meetingReportsPanel.summary.columns.total'),
        dataIndex: 'total',
        key: 'total',
        align: 'right',
        width: 100,
        render: (value: number, row) =>
          row.isTotal ? (
            <Typography.Text strong>{value.toLocaleString()}</Typography.Text>
          ) : (
            value.toLocaleString()
          ),
      },
    ],
    [],
  );

  const categoryColumns = useMemo<ColumnsType<CategorySummaryRow>>(() => {
    const townshipColumns: ColumnsType<CategorySummaryRow> =
      categorySummary.columns.map((column) => ({
        title: column.name,
        key: column.key,
        align: 'right',
        width: 110,
        render: (_value, row) => {
          const value = row.counts[column.key] ?? 0;
          return row.isTotal ? (
            <Typography.Text strong>{value.toLocaleString()}</Typography.Text>
          ) : (
            value.toLocaleString()
          );
        },
      }));

    return [
      {
        title: translateEn(
          'meetingReportsPanel.summary.columns.participantCategory',
        ),
        dataIndex: 'category',
        key: 'category',
        fixed: 'left',
        width: 220,
        render: (value: string, row) =>
          row.isTotal ? (
            <Typography.Text strong>{value}</Typography.Text>
          ) : (
            value
          ),
      },
      ...townshipColumns,
      {
        title: translateEn('meetingReportsPanel.summary.columns.total'),
        dataIndex: 'total',
        key: 'total',
        align: 'right',
        width: 100,
        render: (value: number, row) =>
          row.isTotal ? (
            <Typography.Text strong>{value.toLocaleString()}</Typography.Text>
          ) : (
            value.toLocaleString()
          ),
      },
    ];
  }, [categorySummary.columns]);

  const genderMatrix = useMemo<Array<Array<string | number>>>(() => {
    const header = [
      translateEn('meetingReportsPanel.summary.columns.township'),
      translateEn('meetingReportsPanel.summary.columns.female'),
      translateEn('meetingReportsPanel.summary.columns.male'),
      translateEn('meetingReportsPanel.summary.columns.total'),
    ];
    return [
      header,
      ...genderRows.map((row) => [
        row.township,
        row.female,
        row.male,
        row.total,
      ]),
    ];
  }, [genderRows]);

  const categoryMatrix = useMemo<Array<Array<string | number>>>(() => {
    const header = [
      translateEn('meetingReportsPanel.summary.columns.participantCategory'),
      ...categorySummary.columns.map((column) => column.name),
      translateEn('meetingReportsPanel.summary.columns.total'),
    ];
    return [
      header,
      ...categorySummary.rows.map((row) => [
        row.category,
        ...categorySummary.columns.map(
          (column) => row.counts[column.key] ?? 0,
        ),
        row.total,
      ]),
    ];
  }, [categorySummary.columns, categorySummary.rows]);

  const onDownloadSummaryDocx = async () => {
    if (!townshipSelected || filteredItems.length === 0) {
      return;
    }

    const confirmed = await confirmDialog({
      title: t('meetingReportsPanel.summary.downloadDocxConfirmTitle'),
      message: (
        <Space
          direction='vertical'
          size={12}
          style={{ width: '100%', paddingBottom: 16 }}
        >
          <span>
            {t('meetingReportsPanel.summary.downloadDocxConfirmMessage', {
              count: filteredItems.length,
            })}
          </span>
          <Alert
            type='warning'
            showIcon
            message={t(
              'meetingReportsPanel.summary.downloadDocxConfirmWarning',
            )}
          />
        </Space>
      ),
      okText: t('meetingReportsPanel.summary.downloadDocxConfirmOk'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) {
      return;
    }

    setDownloadingDocx(true);
    try {
      await downloadMeetingSummaryReportDocx({
        meeting,
        genderRows,
        categoryColumns: categorySummary.columns,
        categoryRows: categorySummary.rows,
        filename: buildMeetingReportFilename(meeting.name, 'docx'),
      });
      showToast({
        message: t('meetingReportsPanel.summary.downloadDocxSuccess'),
        severity: 'success',
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingReportsPanel.summary.downloadDocxFailed'),
        severity: 'error',
      });
    } finally {
      setDownloadingDocx(false);
    }
  };

  let body;
  if (loading) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  } else if (!townshipSelected) {
    body = (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('meetingReportsPanel.filters.townshipRequired')}
      />
    );
  } else if (filteredItems.length === 0) {
    body = (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('meetingReportsPanel.summary.empty')}
      />
    );
  } else {
    body = (
      <Flex vertical gap={28}>
        <div>
          <Flex
            justify='space-between'
            align='center'
            gap={8}
            style={{ marginBottom: 12 }}
          >
            <Typography.Title level={5} style={{ margin: 0 }}>
              {translateEn('meetingReportsPanel.summary.table1Title')}
            </Typography.Title>
            <SummaryTableMenu
              matrix={genderMatrix}
              sheetName='Table 1'
              filename='reports-summary-table-1-gender.xlsx'
            />
          </Flex>
          <Table<GenderSummaryRow>
            className='meeting-report-table'
            rowKey='key'
            size='small'
            bordered
            pagination={false}
            columns={genderColumns}
            dataSource={genderRows}
          />
        </div>
        <div>
          <Flex
            justify='space-between'
            align='center'
            gap={8}
            style={{ marginBottom: 12 }}
          >
            <Typography.Title level={5} style={{ margin: 0 }}>
              {translateEn('meetingReportsPanel.summary.table2Title')}
            </Typography.Title>
            <SummaryTableMenu
              matrix={categoryMatrix}
              sheetName='Table 2'
              filename='reports-summary-table-2-category.xlsx'
            />
          </Flex>
          <Table<CategorySummaryRow>
            className='meeting-report-table'
            rowKey='key'
            size='small'
            bordered
            pagination={false}
            columns={categoryColumns}
            dataSource={categorySummary.rows}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </Flex>
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
          <Flex wrap gap={8} align='center' style={{ flex: 1, minWidth: 0 }}>
            <Typography.Text type='secondary'>
              {t('meetingReportsPanel.filters.township')}
            </Typography.Text>
            <Select
              mode='multiple'
              allowClear
              showSearch
              optionFilterProp='label'
              value={townshipIds}
              onChange={setTownshipIds}
              placeholder={t('meetingReportsPanel.filters.townshipRequired')}
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
          icon={<FileWordOutlined />}
          loading={downloadingDocx}
          disabled={
            loading || !townshipSelected || filteredItems.length === 0
          }
          onClick={() => {
            void onDownloadSummaryDocx();
          }}
        >
          {t('meetingReportsPanel.summary.downloadDocx')}
        </Button>
      </Flex>
      {body}
    </div>
  );
}
