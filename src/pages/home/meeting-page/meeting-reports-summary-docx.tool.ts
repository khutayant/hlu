import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
} from 'docx';
import dayjs from 'dayjs';
import type { Meeting } from '../../../handlers/meeting.handler';

const PURPLE = '77206E';
const FONT = 'Times New Roman';
/** A4 page size in DXA/twips. */
const A4_WIDTH_DXA = 11906;
const A4_HEIGHT_DXA = 16838;
const PAGE_MARGIN_INCH = 1;
/** Usable content width with 1" margins on A4. */
const PAGE_WIDTH_DXA =
  A4_WIDTH_DXA - convertInchesToTwip(PAGE_MARGIN_INCH) * 2;
const HLU_LOGO_URL = `${import.meta.env.BASE_URL}assets/icons/hlu-logo/android-chrome-512x512.png`;
/** 2" × 2" at 96 DPI (docx transformation pixels). */
const LOGO_SIZE_INCH = 2;
const LOGO_SIZE_PX = Math.round(LOGO_SIZE_INCH * 96);

async function loadHluLogoBytes(): Promise<Uint8Array | null> {
  try {
    const response = await fetch(HLU_LOGO_URL);
    if (!response.ok) {
      return null;
    }
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export type SummaryGenderRow = {
  township: string;
  female: number;
  male: number;
  total: number;
  isTotal?: boolean;
};

export type SummaryCategoryRow = {
  category: string;
  counts: Record<string, number>;
  total: number;
  isTotal?: boolean;
};

export type SummaryCategoryColumn = {
  key: string;
  name: string;
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF',
};

const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};

const metaBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

const dataBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

function textRun(
  text: string,
  options?: {
    bold?: boolean;
    color?: string;
    size?: number;
  },
) {
  return new TextRun({
    text,
    font: FONT,
    bold: options?.bold ?? false,
    color: options?.color ?? '000000',
    size: options?.size ?? 24,
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 280, after: 160 },
    children: [textRun(text, { bold: true, size: 28 })],
  });
}

function subHeading(text: string) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [textRun(text, { bold: true, size: 24 })],
  });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [textRun(text, { size: 24 })],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 180 },
    children: [textRun(`• ${text}`, { size: 24 })],
  });
}

function emptyLine() {
  return new Paragraph({
    spacing: { after: 80 },
    children: [textRun('')],
  });
}

function joinList(names: string[]) {
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0]!;
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function buildParticipantLocationPhrase(
  townshipNames: string[],
  includeHeadOffice: boolean,
) {
  const count = townshipNames.length;
  const townshipPart =
    count === 0
      ? ''
      : `${count} township${count === 1 ? '' : 's'} (${joinList(townshipNames)})`;

  if (townshipPart && includeHeadOffice) {
    return `${townshipPart} and HLU Head Office`;
  }
  if (townshipPart) {
    return townshipPart;
  }
  if (includeHeadOffice) {
    return 'HLU Head Office';
  }
  return 'selected locations';
}

function buildExecutiveSummary(params: {
  meeting: Meeting;
  participantTotal: number;
  townshipNames: string[];
  includeHeadOffice: boolean;
}) {
  const { meeting, participantTotal, townshipNames, includeHeadOffice } =
    params;
  const locationPhrase = buildParticipantLocationPhrase(
    townshipNames,
    includeHeadOffice,
  );
  const meetingLabel = meeting.name?.trim() || 'the meeting';
  return `The meeting brought together ${participantTotal} participants from ${locationPhrase} for ${meetingLabel}. The session reviewed implementation achievements, progress against targets, and priorities for the next planning period.`;
}

function metaLabelCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: metaBorders,
    shading: { type: ShadingType.CLEAR, fill: PURPLE },
    margins: {
      top: 60,
      bottom: 60,
      left: 100,
      right: 100,
    },
    children: [
      new Paragraph({
        children: [textRun(text, { bold: true, color: 'FFFFFF', size: 22 })],
      }),
    ],
  });
}

function metaValueCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: metaBorders,
    margins: {
      top: 60,
      bottom: 60,
      left: 100,
      right: 100,
    },
    children: [
      new Paragraph({
        children: [textRun(text || '—', { size: 22 })],
      }),
    ],
  });
}

function metaRow(label: string, value: string) {
  const labelWidth = 3200;
  const valueWidth = PAGE_WIDTH_DXA - labelWidth;
  return new TableRow({
    children: [
      metaLabelCell(label, labelWidth),
      metaValueCell(value, valueWidth),
    ],
  });
}

function dataCell(
  text: string | number,
  options?: {
    bold?: boolean;
    width?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  },
) {
  return new TableCell({
    width: {
      size: options?.width ?? 1200,
      type: WidthType.DXA,
    },
    borders: dataBorders,
    margins: {
      top: 40,
      bottom: 40,
      left: 60,
      right: 60,
    },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: options?.align ?? AlignmentType.LEFT,
        children: [
          textRun(String(text), {
            bold: options?.bold ?? false,
            size: 22,
          }),
        ],
      }),
    ],
  });
}

function formatMeetingDateTime(meeting: Meeting) {
  const from = meeting.fromDate ? dayjs(meeting.fromDate) : null;
  const to = meeting.toDate ? dayjs(meeting.toDate) : null;
  if (!from?.isValid()) {
    return '—';
  }
  if (to?.isValid() && from.isSame(to, 'day')) {
    return `${from.format('D MMMM YYYY')}, ${from.format('h A')}-${to.format('h A')}`;
  }
  if (to?.isValid()) {
    return `${from.format('D MMMM YYYY h A')} – ${to.format('D MMMM YYYY h A')}`;
  }
  return from.format('D MMMM YYYY, h A');
}

function percent(part: number, total: number) {
  if (total <= 0) {
    return '0.0';
  }
  return ((part / total) * 100).toFixed(1);
}

function buildMetaTable(meeting: Meeting) {
  return new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [3200, PAGE_WIDTH_DXA - 3200],
    rows: [
      metaRow('Title of Workshop/Training', meeting.name || '—'),
      metaRow('Topics', meeting.description?.trim() || meeting.name || '—'),
      metaRow(
        'Grant',
        meeting.project
          ? `${meeting.project.name}${
              meeting.project.projectNo
                ? ` (${meeting.project.projectNo})`
                : ''
            }`
          : '—',
      ),
      metaRow('Date and Time', formatMeetingDateTime(meeting)),
      metaRow('Organized by', 'HLU'),
      metaRow('Trainer', 'HLU'),
      metaRow('Report Submission Date', dayjs().format('D MMMM YYYY')),
    ],
  });
}

function buildGenderTable(rows: SummaryGenderRow[]) {
  const widths = [2200, 1000, 1000, 1000];
  const header = new TableRow({
    children: ['Township', 'Female', 'Male', 'Total'].map((title, index) =>
      dataCell(title, {
        bold: true,
        width: widths[index],
        align: index === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
      }),
    ),
  });
  const body = rows.map(
    (row) =>
      new TableRow({
        children: [
          dataCell(row.township, {
            bold: Boolean(row.isTotal),
            width: widths[0],
          }),
          dataCell(row.female, {
            bold: Boolean(row.isTotal),
            width: widths[1],
            align: AlignmentType.RIGHT,
          }),
          dataCell(row.male, {
            bold: Boolean(row.isTotal),
            width: widths[2],
            align: AlignmentType.RIGHT,
          }),
          dataCell(row.total, {
            bold: Boolean(row.isTotal),
            width: widths[3],
            align: AlignmentType.RIGHT,
          }),
        ],
      }),
  );
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [header, ...body],
  });
}

function buildCategoryTable(
  columns: SummaryCategoryColumn[],
  rows: SummaryCategoryRow[],
) {
  const firstWidth = 2600;
  const otherWidth = Math.max(
    900,
    Math.floor((PAGE_WIDTH_DXA - firstWidth) / (columns.length + 1)),
  );
  const widths = [firstWidth, ...columns.map(() => otherWidth), otherWidth];

  const headerTitles = [
    'Participant Category',
    ...columns.map((column) => column.name),
    'Total',
  ];
  const header = new TableRow({
    children: headerTitles.map((title, index) =>
      dataCell(title, {
        bold: true,
        width: widths[index],
        align: index === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
      }),
    ),
  });

  const body = rows.map((row) => {
    const values: Array<string | number> = [
      row.category,
      ...columns.map((column) => row.counts[column.key] ?? 0),
      row.total,
    ];
    return new TableRow({
      children: values.map((value, index) =>
        dataCell(value, {
          bold: Boolean(row.isTotal),
          width: widths[index],
          align: index === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
        }),
      ),
    });
  });

  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [header, ...body],
  });
}

function placeholderScoreTable() {
  const half = Math.floor(PAGE_WIDTH_DXA / 2);
  const widths = [half, PAGE_WIDTH_DXA - half];
  const rows: Array<[string, string]> = [
    ['Pre-test Mean Score', '—'],
    ['Post-test Mean Score', '—'],
    ['Percentage Improvement', '—'],
  ];
  return new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            dataCell(label, { bold: true, width: widths[0] }),
            dataCell(value, { width: widths[1], align: AlignmentType.RIGHT }),
          ],
        }),
    ),
  });
}

function signatureLabelValueCell(
  text: string,
  width: number,
  options?: { bold?: boolean },
) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: dataBorders,
    margins: {
      top: 40,
      bottom: 40,
      left: 60,
      right: 60,
    },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [
          textRun(text, {
            bold: options?.bold ?? false,
            size: 22,
          }),
        ],
      }),
    ],
  });
}

function signaturePlaceholderTable() {
  const half = Math.floor(PAGE_WIDTH_DXA / 2);
  const labelWidth = Math.floor(half * 0.38);
  const valueWidth = half - labelWidth;
  const widths = [labelWidth, valueWidth, labelWidth, valueWidth];
  const signatureHeight = convertInchesToTwip(1.5);

  const titleCell = (title: string, spanWidth: number) =>
    new TableCell({
      columnSpan: 2,
      width: { size: spanWidth, type: WidthType.DXA },
      borders: dataBorders,
      margins: {
        top: 60,
        bottom: 60,
        left: 60,
        right: 60,
      },
      children: [
        new Paragraph({
          children: [textRun(title, { bold: true, size: 22 })],
        }),
      ],
    });

  const fieldRow = (label: string) =>
    new TableRow({
      cantSplit: true,
      children: [
        signatureLabelValueCell(label, widths[0]!, { bold: true }),
        signatureLabelValueCell('', widths[1]!),
        signatureLabelValueCell(label, widths[2]!, { bold: true }),
        signatureLabelValueCell('', widths[3]!),
      ],
    });

  return new Table({
    width: { size: PAGE_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          titleCell('Reported by', half),
          titleCell('Approved by', half),
        ],
      }),
      new TableRow({
        cantSplit: true,
        height: {
          value: signatureHeight,
          rule: HeightRule.EXACT,
        },
        children: [
          signatureLabelValueCell('Signature', widths[0]!, { bold: true }),
          signatureLabelValueCell('', widths[1]!),
          signatureLabelValueCell('Signature', widths[2]!, { bold: true }),
          signatureLabelValueCell('', widths[3]!),
        ],
      }),
      fieldRow('Name:'),
      fieldRow('Position:'),
      fieldRow('Date:'),
    ],
  });
}

export async function downloadMeetingSummaryReportDocx(params: {
  meeting: Meeting;
  genderRows: SummaryGenderRow[];
  categoryColumns: SummaryCategoryColumn[];
  categoryRows: SummaryCategoryRow[];
  filename?: string;
}) {
  const {
    meeting,
    genderRows,
    categoryColumns,
    categoryRows,
    filename = 'meeting-summary-report.docx',
  } = params;

  const totalRow = genderRows.find((row) => row.isTotal);
  const female = totalRow?.female ?? 0;
  const male = totalRow?.male ?? 0;
  const total = totalRow?.total ?? female + male;

  const locationRows = genderRows.filter((row) => !row.isTotal);
  const townshipNames = locationRows
    .filter((row) => row.township !== 'Head Office')
    .map((row) => row.township);
  const includeHeadOffice = locationRows.some(
    (row) => row.township === 'Head Office',
  );

  const logoBytes = await loadHluLogoBytes();
  const children: Array<Paragraph | Table> = [
    new Paragraph({
      spacing: { after: 80 },
      children: [
        textRun('Template 01/2026', {
          color: 'A6A6A6',
          size: 18,
        }),
      ],
    }),
  ];

  if (logoBytes) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 200 },
        children: [
          new ImageRun({
            type: 'png',
            data: logoBytes,
            transformation: {
              width: LOGO_SIZE_PX,
              height: LOGO_SIZE_PX,
            },
            altText: {
              title: 'HLU',
              description: 'HLU logo',
              name: 'hlu-logo',
            },
          }),
        ],
      }),
    );
  }

  children.push(
    sectionHeading('Section 1: Workshop/Training Report'),
    buildMetaTable(meeting),
    sectionHeading('Section 2: Executive Summary'),
    bodyParagraph(
      buildExecutiveSummary({
        meeting,
        participantTotal: total,
        townshipNames,
        includeHeadOffice,
      }),
    ),
    sectionHeading('Section 3: Objectives'),
    subHeading('3.1 General Objectives'),
    bodyParagraph(
      `To review implementation performance related to ${
        meeting.name?.trim() || 'this meeting'
      } and strengthen planning, coordination and readiness for the next programme period.`,
    ),
    subHeading('3.2 Specific Objectives'),
    bulletParagraph('Review achievements, coverage and target performance.'),
    bulletParagraph(
      'Revise township micro plans and implementation plans.',
    ),
    bulletParagraph('Assess readiness and community engagement plans.'),
    sectionHeading('Section 4: Methodology'),
    bulletParagraph('Presentations and progress reviews.'),
    bulletParagraph('Township-level discussions and experience sharing.'),
    bulletParagraph('Microplan and target-setting discussions.'),
    bulletParagraph('M&E guidance on data quality and validation.'),
    bulletParagraph('Open discussion on challenges and recommendations.'),
    sectionHeading('Section 5: Participant Profile'),
    subHeading('1. Gender breakdown'),
    bodyParagraph(
      `Female ${female} (${percent(female, total)}%)      Male ${male} (${percent(male, total)}%)`,
    ),
    subHeading('2. Township-wise gender breakdown'),
    buildGenderTable(genderRows),
    subHeading('3. Township and participant category breakdown'),
    buildCategoryTable(categoryColumns, categoryRows),
    sectionHeading('Section 6: Agenda Overview'),
    sectionHeading('Section 7: Summary and Action Points'),
    bulletParagraph('—'),
    bulletParagraph('—'),
    bulletParagraph('—'),
    sectionHeading('Section 8: Monitoring and Evaluation Findings'),
    subHeading(
      '8.1 Knowledge Assessment (Pre and Post Test, if Applicable)',
    ),
    placeholderScoreTable(),
    subHeading('8.2 Participant Feedback'),
    bodyParagraph('—'),
    sectionHeading('Section 9: Financial Summary'),
    bodyParagraph(
      'Per Diem: Financial support for eligible participants, according to project policy.',
    ),
    bodyParagraph(
      'Data Allowance: Data allowance provided to participants to support attendance, participation and other relevant financial supporting documents.',
    ),
    sectionHeading('Section 10: Challenges and Lessons Learned'),
    subHeading('Challenges'),
    bulletParagraph('—'),
    bulletParagraph('—'),
    subHeading('Lessons Learned'),
    bulletParagraph('—'),
    bulletParagraph('—'),
    sectionHeading('Photo Annex'),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    signaturePlaceholderTable(),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: A4_WIDTH_DXA,
              height: A4_HEIGHT_DXA,
            },
            margin: {
              top: convertInchesToTwip(PAGE_MARGIN_INCH),
              bottom: convertInchesToTwip(PAGE_MARGIN_INCH),
              left: convertInchesToTwip(PAGE_MARGIN_INCH),
              right: convertInchesToTwip(PAGE_MARGIN_INCH),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}
