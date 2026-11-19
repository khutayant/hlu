import { DownloadOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Select, Spin, Table, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as XLSX from 'xlsx';
import {
  listMeetingAttendanceRequest,
  type MeetingAttendance,
} from '../../../handlers/meeting-attendance.handler';
import type { Meeting } from '../../../handlers/meeting.handler';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';

const PAGE_SIZE = 100;
/** Sentinel for attendees with no township (head office). */
const TOWNSHIP_FILTER_NONE = '__none__';

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

function percent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((part / total) * 1000) / 10;
}

async function loadActiveAttendance(meetingId: string) {
  const collected: MeetingAttendance[] = [];
  let page = 1;
  let total = 0;
  do {
    const result = await listMeetingAttendanceRequest({
      meetingId,
      active: true,
      page,
      limit: PAGE_SIZE,
    });
    collected.push(...result.items);
    total = result.total;
    page += 1;
  } while (collected.length < total && page <= 20);
  return collected;
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
      <Flex gap={20} align='center' wrap>
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

type BreakdownRow = {
  key: string;
  name: string;
  count: number;
};

function downloadPositionBreakdownExcel(params: {
  rows: BreakdownRow[];
  total: number;
  labels: {
    title: string;
    name: string;
    count: string;
    percent: string;
    total: string;
  };
  filename: string;
}) {
  const { rows, total, labels, filename } = params;
  const header = [labels.name, labels.count, labels.percent];
  const body = rows.map((row) => [
    row.name,
    row.count,
    `${percent(row.count, total)}%`,
  ]);
  body.push([labels.total, total, total > 0 ? '100%' : '0%']);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  worksheet['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 10 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, labels.title.slice(0, 31));
  XLSX.writeFile(
    workbook,
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  );
}

function countBy(
  items: MeetingAttendance[],
  getKey: (row: MeetingAttendance) => { key: string; name: string },
): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  for (const row of items) {
    const { key, name } = getKey(row);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { key, name, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function HorizontalBars({
  rows,
  total,
  color,
}: {
  rows: BreakdownRow[];
  total: number;
  color: string;
}) {
  if (rows.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <Flex vertical gap={12}>
      {rows.map((row) => (
        <div key={row.key}>
          <Flex justify='space-between' gap={8} style={{ marginBottom: 4 }}>
            <Typography.Text ellipsis style={{ maxWidth: '70%' }}>
              {row.name}
            </Typography.Text>
            <Typography.Text type='secondary' style={{ flexShrink: 0 }}>
              {row.count.toLocaleString()} ({percent(row.count, total)}%)
            </Typography.Text>
          </Flex>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(5, 5, 5, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(row.count / max) * 100}%`,
                height: '100%',
                background: color,
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </Flex>
  );
}

export function MeetingAttendanceAnalysisPanel({
  meeting,
}: {
  meeting: Meeting;
}) {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const [items, setItems] = useState<MeetingAttendance[]>([]);
  const [townshipIds, setTownshipIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const rows = await loadActiveAttendance(meeting.id);
        if (!cancelled) {
          setItems(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setItems([]);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('meetingAttendanceAnalysisPanel.loadFailed'),
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

  const townshipOptions = useMemo(() => {
    const map = new Map<string, string>();
    let hasNone = false;
    for (const row of items) {
      const id = row.employee?.townshipId;
      const name = row.employee?.townshipName?.trim();
      if (!id || !name) {
        hasNone = true;
        continue;
      }
      map.set(id, name);
    }
    const options = [...map.entries()]
      .sort((a, b) =>
        a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }),
      )
      .map(([value, label]) => ({ value, label }));
    if (hasNone) {
      options.unshift({
        value: TOWNSHIP_FILTER_NONE,
        label: t('meetingAttendanceAnalysisPanel.noTownship'),
      });
    }
    return options;
  }, [items, t]);

  const filteredItems = useMemo(
    () => filterAttendeesByTownship(items, townshipIds),
    [items, townshipIds],
  );

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const townshipKeys = new Set(
      filteredItems.map((row) => row.employee?.townshipId || TOWNSHIP_FILTER_NONE),
    );
    return {
      total,
      townshipCount: townshipKeys.size,
    };
  }, [filteredItems]);

  const genderSlices = useMemo<PieSlice[]>(() => {
    const counts = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
      UNKNOWN: 0,
    };
    for (const row of filteredItems) {
      const gender = row.employee?.gender;
      if (gender === 'MALE' || gender === 'FEMALE' || gender === 'OTHER') {
        counts[gender] += 1;
      } else {
        counts.UNKNOWN += 1;
      }
    }
    const colors = {
      MALE: '#1677ff',
      FEMALE: '#eb2f96',
      OTHER: '#722ed1',
      UNKNOWN: '#8c8c8c',
    };
    return (
      [
        {
          key: 'MALE',
          label: t('employeePage.gender.MALE'),
          count: counts.MALE,
          color: colors.MALE,
        },
        {
          key: 'FEMALE',
          label: t('employeePage.gender.FEMALE'),
          count: counts.FEMALE,
          color: colors.FEMALE,
        },
        {
          key: 'OTHER',
          label: t('employeePage.gender.OTHER'),
          count: counts.OTHER,
          color: colors.OTHER,
        },
        {
          key: 'UNKNOWN',
          label: t('meetingAttendanceAnalysisPanel.unknown'),
          count: counts.UNKNOWN,
          color: colors.UNKNOWN,
        },
      ] as PieSlice[]
    ).filter((slice) => slice.count > 0);
  }, [filteredItems, t]);

  const townshipRows = useMemo(
    () =>
      countBy(filteredItems, (row) => {
        const id = row.employee?.townshipId;
        const name = row.employee?.townshipName?.trim();
        if (!id || !name) {
          return {
            key: TOWNSHIP_FILTER_NONE,
            name: t('meetingAttendanceAnalysisPanel.noTownship'),
          };
        }
        return { key: id, name };
      }),
    [filteredItems, t],
  );

  const positionRows = useMemo(
    () =>
      countBy(filteredItems, (row) => {
        const name = row.employee?.positionName?.trim();
        if (!name) {
          return {
            key: '__unknown__',
            name: t('meetingAttendanceAnalysisPanel.unknown'),
          };
        }
        return { key: name, name };
      }),
    [filteredItems, t],
  );

  const breakdownColumns = useMemo<ColumnsType<BreakdownRow>>(
    () => [
      {
        title: t('meetingAttendanceAnalysisPanel.columns.name'),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: t('meetingAttendanceAnalysisPanel.columns.count'),
        dataIndex: 'count',
        key: 'count',
        width: 100,
        align: 'right',
        render: (value: number) => value.toLocaleString(),
      },
      {
        title: t('meetingAttendanceAnalysisPanel.columns.percent'),
        key: 'percent',
        width: 100,
        align: 'right',
        render: (_value, row) => `${percent(row.count, stats.total)}%`,
      },
    ],
    [stats.total, t],
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('meetingAttendanceAnalysisPanel.empty')}
      />
    );
  }

  return (
    <Flex vertical gap={20}>
      <Flex
        justify='space-between'
        align='flex-start'
        wrap
        gap={12}
      >
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('meetingAttendanceAnalysisPanel.title')}
          </Typography.Title>
          <Typography.Text type='secondary'>
            {meeting.name}
            {meeting.meetingNo ? ` · ${meeting.meetingNo}` : ''}
          </Typography.Text>
        </div>
        <Flex wrap gap={8} align='center' style={{ flex: '1 1 280px', maxWidth: 520 }}>
          <Typography.Text type='secondary'>
            {t('meetingAttendanceAnalysisPanel.filters.township')}
          </Typography.Text>
          <Select
            mode='multiple'
            allowClear
            showSearch
            optionFilterProp='label'
            value={townshipIds}
            onChange={setTownshipIds}
            placeholder={t('meetingAttendanceAnalysisPanel.filters.townshipAll')}
            style={{ minWidth: 240, flex: 1 }}
            popupMatchSelectWidth={false}
            options={townshipOptions}
          />
        </Flex>
      </Flex>

      {filteredItems.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('meetingAttendanceAnalysisPanel.filters.empty')}
        />
      ) : (
        <>
          <Flex wrap gap={12}>
            <SummaryCard
              label={t('meetingAttendanceAnalysisPanel.summary.total')}
              value={stats.total}
              accent={token.colorPrimary}
            />
            <SummaryCard
              label={t('meetingAttendanceAnalysisPanel.summary.townships')}
              value={stats.townshipCount}
              accent='#13c2c2'
            />
          </Flex>

          <Flex wrap gap={16}>
            <SectionCard
              title={t('meetingAttendanceAnalysisPanel.charts.gender')}
            >
              <OverviewPieChart
                slices={genderSlices}
                ariaLabel={t('meetingAttendanceAnalysisPanel.charts.gender')}
              />
            </SectionCard>
          </Flex>

          <Flex wrap gap={16}>
            <SectionCard
              title={t('meetingAttendanceAnalysisPanel.charts.township')}
            >
              <HorizontalBars
                rows={townshipRows}
                total={stats.total}
                color={token.colorPrimary}
              />
            </SectionCard>
            <SectionCard
              title={t('meetingAttendanceAnalysisPanel.charts.position')}
              extra={
                <Button
                  size='small'
                  icon={<DownloadOutlined />}
                  disabled={positionRows.length === 0}
                  onClick={() => {
                    try {
                      const stamp = new Date().toISOString().slice(0, 10);
                      downloadPositionBreakdownExcel({
                        rows: positionRows,
                        total: stats.total,
                        labels: {
                          title: t(
                            'meetingAttendanceAnalysisPanel.charts.position',
                          ),
                          name: t(
                            'meetingAttendanceAnalysisPanel.columns.name',
                          ),
                          count: t(
                            'meetingAttendanceAnalysisPanel.columns.count',
                          ),
                          percent: t(
                            'meetingAttendanceAnalysisPanel.columns.percent',
                          ),
                          total: t(
                            'meetingAttendanceAnalysisPanel.summary.total',
                          ),
                        },
                        filename: `attendance-by-position-${stamp}.xlsx`,
                      });
                      showToast({
                        message: t(
                          'meetingAttendanceAnalysisPanel.downloadPositionSuccess',
                        ),
                        severity: 'success',
                      });
                    } catch (error) {
                      showToast({
                        message:
                          error instanceof Error
                            ? error.message
                            : t(
                                'meetingAttendanceAnalysisPanel.downloadPositionFailed',
                              ),
                        severity: 'error',
                      });
                    }
                  }}
                >
                  {t('meetingAttendanceAnalysisPanel.downloadPosition')}
                </Button>
              }
            >
              <Table<BreakdownRow>
                size='small'
                rowKey='key'
                pagination={false}
                columns={breakdownColumns}
                dataSource={positionRows}
                scroll={{ y: 320 }}
              />
            </SectionCard>
          </Flex>
        </>
      )}
    </Flex>
  );
}
