import { DownloadOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Select, Spin, Table, Typography } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import ExcelJS from 'exceljs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  listEmployeesRequest,
  type Employee,
  type EmployeeFilterTownship,
} from '../../../../handlers/employee.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import { useToast } from '../../../../providers/toast.provider';

const ORGANIZATION = 'HLU';
const HEADER_FILL = 'C6EFCE';
const PAGE_SIZE = 100;

type TownshipEmployeeRow = {
  key: string;
  no: number;
  name: string;
  gender: string;
  township: string;
  organization: string;
  designation: string;
  experience: string;
};

function formatEmployeeName(employee: Employee) {
  const title = employee.title?.name?.trim();
  const name = employee.displayName?.trim() || '';
  if (title && name) {
    return `${title} ${name}`;
  }
  return name || title || '—';
}

async function fetchEmployeesByTownshipName(
  townshipName: string,
): Promise<Employee[]> {
  const all: Employee[] = [];
  let page = 1;
  let total = Infinity;

  while (all.length < total) {
    const result = await listEmployeesRequest({
      townshipName,
      active: true,
      page,
      limit: PAGE_SIZE,
    });
    total = result.total;
    all.push(...result.items);
    if (result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return all;
}

async function downloadTownshipEmployeesExcel(
  rows: TownshipEmployeeRow[],
  labels: {
    no: string;
    name: string;
    gender: string;
    township: string;
    organization: string;
    designation: string;
    experience: string;
  },
  filename: string,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Township employees');

  const headers = [
    labels.no,
    labels.name,
    labels.gender,
    labels.township,
    labels.organization,
    labels.designation,
    labels.experience,
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  for (const row of rows) {
    sheet.addRow([
      row.no,
      row.name,
      row.gender,
      row.township,
      row.organization,
      row.designation,
      row.experience,
    ]);
  }

  sheet.columns = [
    { width: 8 },
    { width: 28 },
    { width: 12 },
    { width: 18 },
    { width: 14 },
    { width: 28 },
    { width: 28 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TownshipEmployeesDialogBody({
  townships,
}: {
  townships: EmployeeFilterTownship[];
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog } = useDialog();
  const tableHostRef = useRef<HTMLDivElement>(null);
  const [townshipId, setTownshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [tableBodyHeight, setTableBodyHeight] = useState(320);
  const [viewRows, setViewRows] = useState<TownshipEmployeeRow[]>([]);

  const selectedTownship = useMemo(
    () => townships.find((township) => township.id === townshipId) ?? null,
    [townshipId, townships],
  );

  const rows: TownshipEmployeeRow[] = useMemo(
    () =>
      employees.map((employee, index) => ({
        key: employee.id,
        no: index + 1,
        name: formatEmployeeName(employee),
        gender:
          employee.gender === 'MALE' ||
          employee.gender === 'FEMALE' ||
          employee.gender === 'OTHER'
            ? t(`employeePage.gender.${employee.gender}`)
            : employee.gender,
        township: employee.township?.name || employee.townshipName || '—',
        organization: ORGANIZATION,
        designation: employee.position?.name || employee.positionName || '—',
        experience: employee.experience || '—',
      })),
    [employees, t],
  );

  useEffect(() => {
    setViewRows(rows);
  }, [rows]);

  const townshipFilters = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((row) => row.township).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return values.map((value) => ({ text: value, value }));
  }, [rows]);

  const designationFilters = useMemo(() => {
    const values = Array.from(
      new Set(rows.map((row) => row.designation).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return values.map((value) => ({ text: value, value }));
  }, [rows]);

  useEffect(() => {
    if (!selectedTownship) {
      setEmployees([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const list = await fetchEmployeesByTownshipName(selectedTownship.name);
        if (!cancelled) {
          setEmployees(list);
        }
      } catch (error) {
        if (!cancelled) {
          setEmployees([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('employeeOverviewPage.townshipList.loadFailed'),
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
  }, [selectedTownship, showToast, t]);

  useEffect(() => {
    const host = tableHostRef.current;
    if (!host) {
      return;
    }

    const updateHeight = () => {
      const next = Math.max(host.clientHeight - 40, 160);
      setTableBodyHeight(next);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(host);
    return () => observer.disconnect();
  }, [selectedTownship, loading]);

  const handleDownloadExcel = () => {
    if (!selectedTownship || viewRows.length === 0 || loading || downloading) {
      return;
    }
    void (async () => {
      setDownloading(true);
      try {
        const stamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replaceAll(':', '');
        const townshipCode = selectedTownship.code?.toLowerCase() || 'township';
        await downloadTownshipEmployeesExcel(
          viewRows.map((row, index) => ({ ...row, no: index + 1 })),
          {
            no: t('employeeOverviewPage.townshipList.columns.no'),
            name: t('employeeOverviewPage.townshipList.columns.name'),
            gender: t('employeeOverviewPage.townshipList.columns.gender'),
            township: t('employeeOverviewPage.townshipList.columns.township'),
            organization: t(
              'employeeOverviewPage.townshipList.columns.organization',
            ),
            designation: t(
              'employeeOverviewPage.townshipList.columns.designation',
            ),
            experience: t(
              'employeeOverviewPage.townshipList.columns.experience',
            ),
          },
          `township-employees-${townshipCode}-${stamp}.xlsx`,
        );
        showToast({
          message: t('employeeOverviewPage.townshipList.downloadExcelSuccess'),
          severity: 'success',
        });
      } catch (error) {
        showToast({
          message:
            error instanceof Error
              ? error.message
              : t('employeeOverviewPage.townshipList.downloadExcelFailed'),
          severity: 'error',
        });
      } finally {
        setDownloading(false);
      }
    })();
  };

  const handleTableChange: TableProps<TownshipEmployeeRow>['onChange'] = (
    _pagination,
    _filters,
    _sorter,
    extra,
  ) => {
    setViewRows(extra.currentDataSource);
  };

  const columns: ColumnsType<TownshipEmployeeRow> = [
    {
      title: t('employeeOverviewPage.townshipList.columns.no'),
      dataIndex: 'no',
      key: 'no',
      width: 64,
      align: 'center',
    },
    {
      title: t('employeeOverviewPage.townshipList.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 220,
    },
    {
      title: t('employeeOverviewPage.townshipList.columns.gender'),
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
    },
    {
      title: t('employeeOverviewPage.townshipList.columns.township'),
      dataIndex: 'township',
      key: 'township',
      width: 160,
      filters: townshipFilters,
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value, row) => row.township === value,
    },
    {
      title: t('employeeOverviewPage.townshipList.columns.organization'),
      dataIndex: 'organization',
      key: 'organization',
      width: 120,
    },
    {
      title: t('employeeOverviewPage.townshipList.columns.designation'),
      dataIndex: 'designation',
      key: 'designation',
      width: 200,
      filters: designationFilters,
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value, row) => row.designation === value,
    },
    {
      title: t('employeeOverviewPage.townshipList.columns.experience'),
      dataIndex: 'experience',
      key: 'experience',
      width: 220,
    },
  ].map((column) => ({
    ...column,
    onHeaderCell: () => ({
      style: {
        background: `#${HEADER_FILL}`,
        fontWeight: 700,
      },
    }),
  }));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Flex
        wrap
        gap={8}
        align='center'
        justify='space-between'
        style={{ marginBottom: 16, flexShrink: 0 }}
      >
        <Flex wrap gap={8} align='center'>
          <Typography.Text>
            {t('employeeOverviewPage.townshipList.townshipLabel')}
          </Typography.Text>
          <Select
            showSearch
            optionFilterProp='label'
            placeholder={t(
              'employeeOverviewPage.townshipList.townshipPlaceholder',
            )}
            value={townshipId}
            onChange={(value) => setTownshipId(value)}
            style={{ minWidth: 240 }}
            options={townships.map((township) => ({
              value: township.id,
              label: township.name,
            }))}
          />
          {selectedTownship && !loading ? (
            <Typography.Text>
              {`- ${t('employeeOverviewPage.townshipList.totalCount', {
                count: viewRows.length,
              })}`}
            </Typography.Text>
          ) : null}
        </Flex>
        <Flex gap={8} style={{ marginInlineStart: 'auto' }}>
          <Button onClick={closeDialog}>{t('common.close')}</Button>
          <Button
            type='primary'
            icon={<DownloadOutlined />}
            loading={downloading}
            disabled={!selectedTownship || viewRows.length === 0 || loading}
            onClick={handleDownloadExcel}
          >
            {t('employeeOverviewPage.townshipList.downloadExcel')}
          </Button>
        </Flex>
      </Flex>

      <div
        ref={tableHostRef}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        {!selectedTownship ? (
          <Flex justify='center' align='center' style={{ height: '100%' }}>
            <Empty
              description={t('employeeOverviewPage.townshipList.pickTownship')}
            />
          </Flex>
        ) : loading ? (
          <Flex justify='center' align='center' style={{ height: '100%' }}>
            <Spin />
          </Flex>
        ) : (
          <Table<TownshipEmployeeRow>
            rowKey='key'
            size='small'
            bordered
            pagination={false}
            columns={columns}
            dataSource={rows}
            style={{ height: '100%' }}
            scroll={{ x: 'max-content', y: tableBodyHeight }}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('employeeOverviewPage.townshipList.empty')}
                />
              ),
            }}
          />
        )}
      </div>
    </div>
  );
}
