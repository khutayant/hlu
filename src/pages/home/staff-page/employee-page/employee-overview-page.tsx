import {
  FileExcelOutlined,
  FileImageOutlined,
  MoreOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  Empty,
  Flex,
  Select,
  Spin,
  Table,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { toPng } from 'html-to-image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  getEmployeeOverviewRequest,
  listEmployeeFilterOptionsRequest,
  type EmployeeFilterPosition,
  type EmployeeFilterTownship,
  type EmployeeOverview,
  type EmployeeOverviewMatrix,
  type EmployeeOverviewMatrixRow,
} from '../../../../handlers/employee.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';
import { TownshipEmployeesDialogBody } from './township-employees-dialog';

const FILTER_ALL = 'ALL';

function percent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((part / total) * 1000) / 10;
}

function SummaryCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent: string;
}) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        flex: '1 1 160px',
        minWidth: 140,
        padding: '16px 18px',
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderTop: `3px solid ${accent}`,
      }}
    >
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <Typography.Title level={2} style={{ margin: '4px 0 0', lineHeight: 1.2 }}>
        {value.toLocaleString()}
      </Typography.Title>
      {hint ? (
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          {hint}
        </Typography.Text>
      ) : null}
    </div>
  );
}

type PieSlice = {
  key: string;
  label: string;
  count: number;
  color: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function OverviewPieChart({
  slices,
  ariaLabel,
}: {
  slices: PieSlice[];
  ariaLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;

  if (total <= 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  let angle = 0;
  const paths =
    slices.length === 1
      ? [
          <circle
            key={slices[0].key}
            cx={cx}
            cy={cy}
            r={radius}
            fill={slices[0].color}
          />,
        ]
      : slices.map((slice) => {
          const sweep = (slice.count / total) * 360;
          const start = angle;
          const end = angle + sweep;
          angle = end;
          return (
            <path
              key={slice.key}
              d={describeSlice(cx, cy, radius, start, end)}
              fill={slice.color}
            />
          );
        });

  return (
    <Flex justify='center' align='center' style={{ width: '100%' }}>
      <Flex gap={20} align='center' wrap={false}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role='img'
          aria-label={ariaLabel}
          style={{ flexShrink: 0, display: 'block' }}
        >
          {paths}
        </svg>
        <Flex vertical gap={10} style={{ minWidth: 140 }}>
          {slices.map((slice) => (
            <Flex key={slice.key} align='center' gap={8}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: slice.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <Typography.Text style={{ display: 'block', lineHeight: 1.3 }}>
                  {slice.label}
                </Typography.Text>
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  {slice.count.toLocaleString()} ({percent(slice.count, total)}
                  %)
                </Typography.Text>
              </div>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}

function SectionCard({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        flex: '1 1 320px',
        minWidth: 280,
        padding: token.paddingLG,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex
        align='center'
        justify='space-between'
        gap={8}
        style={{ marginBottom: 16 }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {extra}
      </Flex>
      {children}
    </div>
  );
}

function downloadMatrixExcel(
  matrix: EmployeeOverviewMatrix,
  labels: { no: string; position: string; total: string },
  filename: string,
) {
  const header = [
    labels.no,
    labels.position,
    ...matrix.columns.map((column) => column.name),
    labels.total,
  ];

  const rows: (string | number)[][] = matrix.rows.map((row, index) => [
    index + 1,
    row.name,
    ...matrix.columns.map((column) => row.counts[column.id] ?? 0),
    row.total,
  ]);

  rows.push([
    '',
    labels.total,
    ...matrix.columns.map((column) => matrix.columnTotals[column.id] ?? 0),
    matrix.grandTotal,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    ...matrix.columns.map(() => ({ wch: 14 })),
    { wch: 10 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Position by township');
  XLSX.writeFile(
    workbook,
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function downloadMatrixPng(
  matrix: EmployeeOverviewMatrix,
  labels: { no: string; position: string; total: string; title: string },
  filename: string,
) {
  const headerCells = [
    labels.no,
    labels.position,
    ...matrix.columns.map((column) => column.name),
    labels.total,
  ]
    .map(
      (cell) =>
        `<th style="border:1px solid #d9d9d9;padding:10px 12px;background:#fafafa;font-weight:600;white-space:nowrap">${escapeHtml(cell)}</th>`,
    )
    .join('');

  const bodyRows = matrix.rows
    .map((row, index) => {
      const cells = [
        { value: String(index + 1), highlight: false },
        { value: row.name, highlight: false },
        ...matrix.columns.map((column) => {
          const value = row.counts[column.id] ?? 0;
          return { value: String(value), highlight: value > 0 };
        }),
        {
          value: String(row.total),
          highlight: row.total > 0,
        },
      ]
        .map((cell, cellIndex) => {
          const align = cellIndex <= 1 ? 'left' : 'right';
          const bg = cell.highlight ? '#e6f4ff' : '#ffffff';
          const weight = cell.highlight ? '600' : '400';
          return `<td style="border:1px solid #d9d9d9;padding:10px 12px;text-align:${align};background:${bg};font-weight:${weight};white-space:nowrap">${escapeHtml(cell.value)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const totalCells = [
    { value: '', align: 'left' },
    { value: labels.total, align: 'left' },
    ...matrix.columns.map((column) => ({
      value: String(matrix.columnTotals[column.id] ?? 0),
      align: 'right',
    })),
    { value: String(matrix.grandTotal), align: 'right' },
  ]
    .map(
      (cell) =>
        `<td style="border:1px solid #d9d9d9;padding:10px 12px;text-align:${cell.align};background:#f5f5f5;font-weight:700;white-space:nowrap">${escapeHtml(cell.value)}</td>`,
    )
    .join('');

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';
  host.innerHTML = `
    <div id="matrix-png-root" style="display:inline-block;padding:24px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141414">
      <div style="font-size:18px;font-weight:600;margin-bottom:16px">${escapeHtml(labels.title)}</div>
      <table style="border-collapse:collapse;font-size:14px;line-height:1.4">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}<tr>${totalCells}</tr></tbody>
      </table>
    </div>
  `;
  document.body.appendChild(host);

  try {
    const root = host.querySelector('#matrix-png-root');
    if (!(root instanceof HTMLElement)) {
      throw new Error('PNG export root not found');
    }
    const dataUrl = await toPng(root, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
    });
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    anchor.click();
  } finally {
    host.remove();
  }
}

function EmployeeOverviewPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<EmployeeOverview | null>(null);
  const [townships, setTownships] = useState<EmployeeFilterTownship[]>([]);
  const [positions, setPositions] = useState<EmployeeFilterPosition[]>([]);
  const [townshipId, setTownshipId] = useState<string>(FILTER_ALL);
  const [positionId, setPositionId] = useState<string>(FILTER_ALL);
  const [matrixViewRows, setMatrixViewRows] = useState<
    EmployeeOverviewMatrixRow[]
  >([]);

  const title = t('employeeOverviewPage.title');
  const description = t('employeeOverviewPage.description');

  const openTownshipEmployeesList = () => {
    customDialog({
      title: t('employeeOverviewPage.townshipList.title'),
      size: 'fullscreen',
      actions: null,
      content: <TownshipEmployeesDialogBody townships={townships} />,
    });
  };

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
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const result = await getEmployeeOverviewRequest({
          townshipId:
            townshipId && townshipId !== FILTER_ALL ? townshipId : undefined,
          positionId:
            positionId && positionId !== FILTER_ALL ? positionId : undefined,
        });
        if (!cancelled) {
          setOverview(result);
          setMatrixViewRows(result.matrix.rows);
        }
      } catch (error) {
        if (!cancelled) {
          setOverview(null);
          setMatrixViewRows([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('employeeOverviewPage.loadFailed'),
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
  }, [positionId, showToast, t, townshipId]);

  const genderColors: Record<string, string> = {
    MALE: '#1677ff',
    FEMALE: '#eb2f96',
    OTHER: '#8c8c8c',
  };

  const matrixColumns: ColumnsType<EmployeeOverviewMatrixRow> = useMemo(() => {
    const columns = overview?.matrix.columns ?? [];
    const positionRows = overview?.matrix.rows ?? [];
    return [
      {
        title: t('employeeOverviewPage.matrix.no'),
        key: 'no',
        width: 56,
        fixed: 'left',
        align: 'center',
        render: (_value, _row, index) => index + 1,
      },
      {
        title: t('employeeOverviewPage.matrix.position'),
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        width: 200,
        filters: positionRows.map((row) => ({
          text: row.name,
          value: row.id,
        })),
        filterSearch: true,
        filterMultiple: true,
        onFilter: (value, row) => row.id === value,
      },
      ...columns.map((column) => ({
        title: column.name,
        key: column.id,
        width: 110,
        align: 'right' as const,
        onCell: (row: EmployeeOverviewMatrixRow) => {
          const value = row.counts[column.id] ?? 0;
          if (value <= 0) {
            return {};
          }
          return {
            style: {
              background: token.colorPrimaryBg,
              fontWeight: 600,
            },
          };
        },
        render: (_value: unknown, row: EmployeeOverviewMatrixRow) =>
          (row.counts[column.id] ?? 0).toLocaleString(),
      })),
      {
        title: t('employeeOverviewPage.matrix.rowTotal'),
        dataIndex: 'total',
        key: 'total',
        width: 88,
        align: 'right',
        fixed: 'right',
        onCell: (row: EmployeeOverviewMatrixRow) =>
          row.total > 0
            ? {
                style: {
                  background: token.colorPrimaryBg,
                  fontWeight: 600,
                },
              }
            : {},
        render: (value: number) => value.toLocaleString(),
      },
    ];
  }, [overview?.matrix.columns, overview?.matrix.rows, t, token.colorPrimaryBg]);

  const matrixViewTotals = useMemo(() => {
    const columns = overview?.matrix.columns ?? [];
    const columnTotals: Record<string, number> = {};
    for (const column of columns) {
      columnTotals[column.id] = 0;
    }
    let grandTotal = 0;
    for (const row of matrixViewRows) {
      grandTotal += row.total;
      for (const column of columns) {
        columnTotals[column.id] =
          (columnTotals[column.id] ?? 0) + (row.counts[column.id] ?? 0);
      }
    }
    return { columnTotals, grandTotal };
  }, [matrixViewRows, overview?.matrix.columns]);

  const filterBar = (
    <div
      style={{
        marginBottom: 16,
        padding: token.paddingLG,
        borderRadius: token.borderRadiusLG,
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex wrap gap={8} align='center'>
        <Select
          showSearch
          optionFilterProp='label'
          value={townshipId}
          onChange={(value) => setTownshipId(value || FILTER_ALL)}
          style={{ minWidth: 200 }}
          options={[
            {
              value: FILTER_ALL,
              label: t('employeeOverviewPage.filters.townshipAll'),
            },
            ...townships.map((township) => ({
              value: township.id,
              label: township.name,
            })),
          ]}
        />
        <Select
          showSearch
          optionFilterProp='label'
          value={positionId}
          onChange={(value) => setPositionId(value || FILTER_ALL)}
          style={{ minWidth: 220 }}
          options={[
            {
              value: FILTER_ALL,
              label: t('employeeOverviewPage.filters.positionAll'),
            },
            ...positions.map((position) => ({
              value: position.id,
              label: position.name,
            })),
          ]}
        />
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'township-employees',
                icon: <TeamOutlined />,
                label: t('employeeOverviewPage.menu.townshipEmployeesList'),
                onClick: openTownshipEmployeesList,
              },
            ],
          }}
        >
          <Button
            type='text'
            icon={<MoreOutlined />}
            aria-label={t('employeeOverviewPage.menu.actions')}
            style={{ marginInlineStart: 'auto' }}
          />
        </Dropdown>
      </Flex>
    </div>
  );

  if (loading && !overview) {
    return (
      <div style={{ width: '100%' }}>
        {filterBar}
        <Flex justify='center' align='center' style={{ minHeight: 240 }}>
          <Spin />
        </Flex>
      </div>
    );
  }

  if (!overview || overview.total === 0) {
    return (
      <div style={{ width: '100%' }}>
        {filterBar}
        <div
          style={{
            padding: token.paddingLG,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
          }}
        >
          <Empty description={t('employeeOverviewPage.empty')} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {filterBar}
      <Flex wrap gap={12} style={{ marginBottom: 16 }}>
        <SummaryCard
          label={t('employeeOverviewPage.cards.total')}
          value={overview.total}
          accent={token.colorPrimary}
        />
        <SummaryCard
          label={t('employeeOverviewPage.cards.active')}
          value={overview.active}
          hint={`${percent(overview.active, overview.total)}%`}
          accent='#52c41a'
        />
        <SummaryCard
          label={t('employeeOverviewPage.cards.inactive')}
          value={overview.inactive}
          hint={`${percent(overview.inactive, overview.total)}%`}
          accent='#faad14'
        />
        {overview.byGender.map((row) => (
          <SummaryCard
            key={row.gender}
            label={
              row.gender === 'MALE' ||
              row.gender === 'FEMALE' ||
              row.gender === 'OTHER'
                ? t(`employeePage.gender.${row.gender}`)
                : row.gender
            }
            value={row.count}
            hint={`${percent(row.count, overview.total)}%`}
            accent={genderColors[row.gender] ?? token.colorTextSecondary}
          />
        ))}
      </Flex>

      <Flex wrap gap={16} style={{ marginBottom: 16 }}>
        <SectionCard title={t('employeeOverviewPage.sections.genderPie')}>
          <OverviewPieChart
            ariaLabel={t('employeeOverviewPage.sections.genderPie')}
            slices={overview.byGender
              .filter(
                (row) =>
                  row.gender === 'MALE' ||
                  row.gender === 'FEMALE' ||
                  (row.gender === 'OTHER' && row.count > 0),
              )
              .map((row) => ({
                key: row.gender,
                label:
                  row.gender === 'MALE' ||
                  row.gender === 'FEMALE' ||
                  row.gender === 'OTHER'
                    ? t(`employeePage.gender.${row.gender}`)
                    : row.gender,
                count: row.count,
                color: genderColors[row.gender] ?? token.colorPrimary,
              }))}
          />
        </SectionCard>

        <SectionCard title={t('employeeOverviewPage.sections.status')}>
          <OverviewPieChart
            ariaLabel={t('employeeOverviewPage.sections.status')}
            slices={[
              {
                key: 'active',
                label: t('employeeOverviewPage.cards.active'),
                count: overview.active,
                color: '#52c41a',
              },
              {
                key: 'inactive',
                label: t('employeeOverviewPage.cards.inactive'),
                count: overview.inactive,
                color: '#faad14',
              },
            ].filter((slice) => slice.count > 0)}
          />
        </SectionCard>
      </Flex>

      <SectionCard
        title={t('employeeOverviewPage.sections.matrix')}
        extra={
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'download-excel',
                  icon: <FileExcelOutlined />,
                  label: t('employeeOverviewPage.matrix.downloadExcel'),
                  onClick: () => {
                    const stamp = new Date()
                      .toISOString()
                      .slice(0, 19)
                      .replaceAll(':', '');
                    downloadMatrixExcel(
                      {
                        columns: overview.matrix.columns,
                        rows: matrixViewRows,
                        columnTotals: matrixViewTotals.columnTotals,
                        grandTotal: matrixViewTotals.grandTotal,
                      },
                      {
                        no: t('employeeOverviewPage.matrix.no'),
                        position: t('employeeOverviewPage.matrix.position'),
                        total: t('employeeOverviewPage.matrix.total'),
                      },
                      `position-by-township-${stamp}.xlsx`,
                    );
                    showToast({
                      message: t(
                        'employeeOverviewPage.matrix.downloadExcelSuccess',
                      ),
                      severity: 'success',
                    });
                  },
                },
                {
                  key: 'download-png',
                  icon: <FileImageOutlined />,
                  label: t('employeeOverviewPage.matrix.downloadPng'),
                  onClick: () => {
                    const stamp = new Date()
                      .toISOString()
                      .slice(0, 19)
                      .replaceAll(':', '');
                    void (async () => {
                      try {
                        await downloadMatrixPng(
                          {
                            columns: overview.matrix.columns,
                            rows: matrixViewRows,
                            columnTotals: matrixViewTotals.columnTotals,
                            grandTotal: matrixViewTotals.grandTotal,
                          },
                          {
                            no: t('employeeOverviewPage.matrix.no'),
                            position: t(
                              'employeeOverviewPage.matrix.position',
                            ),
                            total: t('employeeOverviewPage.matrix.total'),
                            title: t('employeeOverviewPage.sections.matrix'),
                          },
                          `position-by-township-${stamp}.png`,
                        );
                        showToast({
                          message: t(
                            'employeeOverviewPage.matrix.downloadPngSuccess',
                          ),
                          severity: 'success',
                        });
                      } catch (error) {
                        showToast({
                          message:
                            error instanceof Error
                              ? error.message
                              : t(
                                  'employeeOverviewPage.matrix.downloadPngFailed',
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
              aria-label={t('employeeOverviewPage.matrix.menu')}
            />
          </Dropdown>
        }
      >
        <Table<EmployeeOverviewMatrixRow>
          rowKey='id'
          size='small'
          loading={loading}
          pagination={false}
          columns={matrixColumns}
          dataSource={overview.matrix.rows}
          scroll={{ x: 'max-content' }}
          onChange={(_pagination, _filters, _sorter, extra) => {
            setMatrixViewRows(extra.currentDataSource);
          }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} />
                <Table.Summary.Cell index={1}>
                  <Typography.Text strong>
                    {t('employeeOverviewPage.matrix.total')}
                  </Typography.Text>
                </Table.Summary.Cell>
                {overview.matrix.columns.map((column, index) => (
                  <Table.Summary.Cell
                    key={column.id}
                    index={index + 2}
                    align='right'
                  >
                    <Typography.Text strong>
                      {(
                        matrixViewTotals.columnTotals[column.id] ?? 0
                      ).toLocaleString()}
                    </Typography.Text>
                  </Table.Summary.Cell>
                ))}
                <Table.Summary.Cell
                  index={overview.matrix.columns.length + 2}
                  align='right'
                >
                  <Typography.Text strong>
                    {matrixViewTotals.grandTotal.toLocaleString()}
                  </Typography.Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('employeeOverviewPage.empty')}
              />
            ),
          }}
        />
      </SectionCard>
    </div>
  );
}

export default EmployeeOverviewPage;
