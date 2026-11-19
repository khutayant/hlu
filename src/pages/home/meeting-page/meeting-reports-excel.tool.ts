import ExcelJS from 'exceljs';
import type { MeetingAttendance } from '../../../handlers/meeting-attendance.handler';
import type { MeetingAllowance } from '../../../handlers/meeting-allowance.handler';
import type { Meeting } from '../../../handlers/meeting.handler';

const ORGANIZATION = 'HLU';
const HEADER_FILL = 'E6F0FF';
const HLU_LOGO_URL = `${import.meta.env.BASE_URL}assets/icons/hlu-logo/android-chrome-512x512.png`;
/** 1.5" × 1.5" at Excel’s 96 DPI. */
const LOGO_SIZE_INCH = 1.5;
const LOGO_SIZE_PX = Math.round(LOGO_SIZE_INCH * 96);
/** Column L (1-based). Image top-right meets this column’s top-right. */
const LOGO_RIGHT_COL_1BASED = 12;
/** Approx columns kept clear of title/meta text under the logo. */
const LOGO_COL_RESERVE = 3;

export type MeetingReportExcelSignOffLabels = {
  preparedBy: string;
  approvedBy: string;
  verifiedBy: string;
  signature: string;
  name: string;
  position: string;
  date: string;
};

export type MeetingReportExcelLabels = {
  reportTitle: string;
  projectTitle: string;
  meetingTopic: string;
  dateAndTime: string;
  place: string;
  no: string;
  srNo: string;
  name: string;
  gender: string;
  township: string;
  organization: string;
  designation: string;
  experience: string;
  unitPrice: string;
  quantity: string;
  lineTotal: string;
  totalAmount: string;
  signature: string;
  remark: string;
  footerTotal: string;
  filename: string;
  signOff?: MeetingReportExcelSignOffLabels;
};

function formatEmployeeName(row: MeetingAttendance) {
  const title = row.employee?.titleName?.trim();
  const name = row.employee?.displayName?.trim() || '';
  if (title && name) {
    return `${title} ${name}`;
  }
  return name || title || '';
}

function formatAmount(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return parsed;
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

function applyThinBorders(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    right: { style: 'thin', color: { argb: 'FFBFBFBF' } },
  };
}

function hideSheetGridLines(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: 'normal', showGridLines: false }];
}

function cellTextLength(value: ExcelJS.CellValue) {
  if (value == null || value === '') {
    return 0;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).length;
  }
  if (value instanceof Date) {
    return value.toLocaleString().length;
  }
  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    return value.richText.reduce(
      (sum, part) => sum + String(part.text ?? '').length,
      0,
    );
  }
  if (typeof value === 'object' && 'text' in value && value.text != null) {
    return String(value.text).length;
  }
  if (typeof value === 'object' && 'result' in value && value.result != null) {
    return cellTextLength(value.result as ExcelJS.CellValue);
  }
  return 0;
}

/**
 * Size a column from table rows only (skip report meta / logo area above).
 */
function fitColumnToContent(
  sheet: ExcelJS.Worksheet,
  colIndex: number,
  options?: {
    minWidth?: number;
    maxWidth?: number;
    padding?: number;
    fromRow?: number;
  },
) {
  const minWidth = options?.minWidth ?? 8;
  const maxWidth = options?.maxWidth ?? 40;
  const padding = options?.padding ?? 2;
  const fromRow = options?.fromRow ?? 1;
  const column = sheet.getColumn(colIndex);
  let maxLen = minWidth;
  column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
    if (rowNumber < fromRow) {
      return;
    }
    const len = cellTextLength(cell.value) + padding;
    if (len > maxLen) {
      maxLen = len;
    }
  });
  column.width = Math.min(maxWidth, Math.max(minWidth, maxLen));
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
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

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadHluLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(HLU_LOGO_URL);
    if (!response.ok) {
      return null;
    }
    return arrayBufferToBase64(await response.arrayBuffer());
  } catch {
    return null;
  }
}

/** Excel character-width → pixel approximation (default Calibri). */
function excelColWidthToPx(width: number) {
  if (width < 1) {
    return Math.max(1, Math.floor(width * 12));
  }
  return Math.max(1, Math.floor(width * 7 + 5));
}

/**
 * Floating 0-based column for the logo’s top-left so its top-right
 * meets the top-right corner of column L.
 */
function logoTopLeftColAlignedToL(sheet: ExcelJS.Worksheet) {
  // Right edge of column L == left edge of column M == 12 (0-based floating).
  const rightEdge = LOGO_RIGHT_COL_1BASED;
  let remainingPx = LOGO_SIZE_PX;
  let colIndex0 = rightEdge;

  while (remainingPx > 0 && colIndex0 > 0) {
    colIndex0 -= 1;
    const widthChars = sheet.getColumn(colIndex0 + 1).width ?? 8.43;
    const widthPx = excelColWidthToPx(widthChars);
    if (remainingPx <= widthPx) {
      return colIndex0 + (1 - remainingPx / widthPx);
    }
    remainingPx -= widthPx;
  }
  return 0;
}

async function addHluLogoTopRight(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
) {
  const base64 = await loadHluLogoBase64();
  if (!base64) {
    return;
  }
  // Ensure column L exists with a default width for positioning math.
  if (sheet.getColumn(LOGO_RIGHT_COL_1BASED).width == null) {
    sheet.getColumn(LOGO_RIGHT_COL_1BASED).width = 12;
  }
  const imageId = workbook.addImage({
    base64,
    extension: 'png',
  });
  sheet.addImage(imageId, {
    tl: { col: logoTopLeftColAlignedToL(sheet), row: 0 },
    ext: { width: LOGO_SIZE_PX, height: LOGO_SIZE_PX },
  });
}

/** Table body / footer data rows only. */
const TABLE_ROW_HEIGHT = 28;
/**
 * Fixed height for table column headers and report meta rows
 * (everything in the header block except the report title).
 */
const FIXED_HEADER_ROW_HEIGHT = 22;
/** Excel default-ish line height (points) for title / signature content fit. */
const CONTENT_LINE_HEIGHT = 15;
/** Cap wrap estimation so title/signature rows cannot become huge. */
const MAX_CONTENT_LINES = 3;

function clearCellBorder(cell: ExcelJS.Cell) {
  cell.border = {};
}

/**
 * Title / signature only: height = minimum needed to fit content (capped).
 * Table headers and meta label rows use FIXED_HEADER_ROW_HEIGHT instead.
 */
function fitNonTableRowHeight(row: ExcelJS.Row, options?: { minLines?: number }) {
  const minLines = options?.minLines ?? 1;
  let lines = minLines;
  let fontSize = 11;
  row.eachCell({ includeEmpty: false }, (cell) => {
    if (cell.font?.size && cell.font.size > fontSize) {
      fontSize = cell.font.size;
    }
    const len = cellTextLength(cell.value);
    if (len <= 0) {
      return;
    }
    if (cell.alignment?.wrapText) {
      const colWidth = Number(
        row.worksheet.getColumn(Number(cell.col)).width ?? 10,
      );
      const charsPerLine = Math.max(12, Math.floor(colWidth));
      lines = Math.max(lines, Math.ceil(len / charsPerLine));
    } else {
      lines = Math.max(lines, 1);
    }
  });
  lines = Math.min(lines, MAX_CONTENT_LINES);
  const lineHeight = Math.max(CONTENT_LINE_HEIGHT, fontSize + 4);
  row.height = lines * lineHeight;
}

function styleMetaRow(
  row: ExcelJS.Row,
  columnCount: number,
  options?: { isTitle?: boolean },
) {
  for (let col = 1; col <= columnCount; col += 1) {
    const cell = row.getCell(col);
    clearCellBorder(cell);
    cell.alignment = {
      ...(cell.alignment || {}),
      vertical: 'middle',
    };
  }
  if (options?.isTitle) {
    fitNonTableRowHeight(row);
  } else {
    row.height = FIXED_HEADER_ROW_HEIGHT;
  }
}

function writeReportMeta(
  sheet: ExcelJS.Worksheet,
  meeting: Meeting,
  labels: MeetingReportExcelLabels,
  dateTimeValue: string,
  columnCount: number,
) {
  // Keep columns under the logo (ending at L) free of title/meta text.
  const contentEndCol = Math.max(
    1,
    Math.min(columnCount, LOGO_RIGHT_COL_1BASED - LOGO_COL_RESERVE),
  );

  const titleRow = sheet.addRow([labels.reportTitle]);
  titleRow.font = { bold: true, size: 14 };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  if (contentEndCol > 1) {
    sheet.mergeCells(1, 1, 1, contentEndCol);
  }
  styleMetaRow(titleRow, columnCount, { isTitle: true });

  const metaRows: Array<[string, string]> = [
    [labels.projectTitle, meeting.project?.name || ''],
    [labels.meetingTopic, meeting.name || ''],
    [labels.dateAndTime, dateTimeValue],
    [labels.place, meeting.place?.trim() || ''],
  ];

  for (const [label, value] of metaRows) {
    const row = sheet.addRow([]);
    const rowNumber = row.number;
    row.getCell(1).value = label;
    row.getCell(1).alignment = { vertical: 'middle' };

    // First two columns are reserved for the label.
    if (columnCount >= 2) {
      sheet.mergeCells(rowNumber, 1, rowNumber, 2);
    }

    // Value spans remaining width, leaving top-right cols free for the logo.
    if (contentEndCol >= 3) {
      row.getCell(3).value = value;
      row.getCell(3).alignment = { vertical: 'middle', wrapText: true };
      if (contentEndCol > 3) {
        sheet.mergeCells(rowNumber, 3, rowNumber, contentEndCol);
      }
    }

    styleMetaRow(row, columnCount);
  }

  sheet.addRow([]);
}

function writeAllowanceSignOff(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
  signOff: MeetingReportExcelSignOffLabels,
) {
  sheet.addRow([]);
  sheet.addRow([]);

  const roles = [signOff.preparedBy, signOff.approvedBy, signOff.verifiedBy];
  const fields = [
    signOff.signature,
    signOff.name,
    signOff.position,
    signOff.date,
  ];

  // At least 2 cols per block: label | value line
  const blockWidth = Math.max(2, Math.floor(columnCount / 3));
  const blocks = roles.map((role, index) => {
    const start = index * blockWidth + 1;
    const rawEnd =
      index === roles.length - 1 ? columnCount : (index + 1) * blockWidth;
    const end = Math.min(columnCount, Math.max(start + 1, rawEnd));
    return { role, start, end };
  });

  const titleRow = sheet.addRow([]);
  for (const block of blocks) {
    const cell = titleRow.getCell(block.start);
    cell.value = block.role;
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    clearCellBorder(cell);
    if (block.end > block.start) {
      sheet.mergeCells(titleRow.number, block.start, titleRow.number, block.end);
    }
  }
  fitNonTableRowHeight(titleRow);

  // Space for handwritten signature (one content line min).
  const spaceRow = sheet.addRow([]);
  for (let col = 1; col <= columnCount; col += 1) {
    clearCellBorder(spaceRow.getCell(col));
  }
  fitNonTableRowHeight(spaceRow);

  for (const field of fields) {
    const row = sheet.addRow([]);
    for (const block of blocks) {
      const labelCell = row.getCell(block.start);
      labelCell.value = field;
      labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
      clearCellBorder(labelCell);

      const valueStart = block.start + 1;
      const valueCell = row.getCell(valueStart);
      valueCell.value = '';
      valueCell.alignment = { vertical: 'middle', horizontal: 'left' };
      valueCell.border = {
        bottom: { style: 'thin', color: { argb: 'FF595959' } },
      };
      if (block.end > valueStart) {
        sheet.mergeCells(row.number, valueStart, row.number, block.end);
      }
    }
    fitNonTableRowHeight(row);
  }
}

export async function downloadAttendanceReportExcel(params: {
  meeting: Meeting;
  attendees: MeetingAttendance[];
  dateTimeValue: string;
  genderLabel: (gender: string | null | undefined) => string;
  labels: MeetingReportExcelLabels;
}) {
  const { meeting, attendees, dateTimeValue, genderLabel, labels } = params;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance');
  hideSheetGridLines(sheet);

  const headers = [
    labels.no,
    labels.name,
    labels.gender,
    labels.township,
    labels.organization,
    labels.designation,
    labels.experience,
    labels.remark,
  ];
  writeReportMeta(sheet, meeting, labels, dateTimeValue, headers.length);
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    applyThinBorders(cell);
  });
  headerRow.height = FIXED_HEADER_ROW_HEIGHT;

  attendees.forEach((row, index) => {
    const dataRow = sheet.addRow([
      index + 1,
      formatEmployeeName(row),
      genderLabel(row.employee?.gender),
      row.employee?.townshipName || '',
      ORGANIZATION,
      row.employee?.positionName || '',
      row.employee?.experience || '',
      row.remark || '',
    ]);
    dataRow.height = TABLE_ROW_HEIGHT;
    dataRow.eachCell((cell) => {
      applyThinBorders(cell);
      cell.alignment = {
        ...(cell.alignment || {}),
        vertical: 'middle',
      };
    });
  });

  // no / name / gender / township / org / designation / experience / remark
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(6).width = 24;
  sheet.getColumn(7).width = 28;
  sheet.getColumn(8).width = 24;

  // Gender / township / organization: fit table content only (skip meta rows).
  const tableHeaderRow = 7;
  fitColumnToContent(sheet, 3, { minWidth: 6, maxWidth: 16, fromRow: tableHeaderRow });
  fitColumnToContent(sheet, 4, { minWidth: 8, maxWidth: 28, fromRow: tableHeaderRow });
  fitColumnToContent(sheet, 5, { minWidth: 6, maxWidth: 18, fromRow: tableHeaderRow });

  // Title: fit content. Other header/meta rows: fixed 22.
  fitNonTableRowHeight(sheet.getRow(1));
  for (let r = 2; r < tableHeaderRow; r += 1) {
    sheet.getRow(r).height = FIXED_HEADER_ROW_HEIGHT;
  }

  await addHluLogoTopRight(workbook, sheet);
  await downloadWorkbook(workbook, labels.filename);
}

type AllowanceLeaf = {
  key: string;
  title: string;
  field: 'unitPrice' | 'quantity' | 'totalAmount';
  allowance: MeetingAllowance;
  groupStart: boolean;
};

function buildAllowanceLeaves(
  allowances: MeetingAllowance[],
  labels: MeetingReportExcelLabels,
): Array<{
  groupTitle: string | null;
  leaves: AllowanceLeaf[];
}> {
  return allowances.map((allowance) => {
    if (allowance.showTotalOnly) {
      return {
        groupTitle: null,
        leaves: [
          {
            key: `${allowance.id}-total`,
            title:
              allowance.totalAmountLabel?.trim() ||
              allowance.name ||
              labels.lineTotal,
            field: 'totalAmount' as const,
            allowance,
            groupStart: true,
          },
        ],
      };
    }

    return {
      groupTitle: allowance.name,
      leaves: [
        {
          key: `${allowance.id}-unitPrice`,
          title: allowance.unitPriceLabel?.trim() || labels.unitPrice,
          field: 'unitPrice' as const,
          allowance,
          groupStart: true,
        },
        {
          key: `${allowance.id}-quantity`,
          title: allowance.quantityLabel?.trim() || labels.quantity,
          field: 'quantity' as const,
          allowance,
          groupStart: false,
        },
        {
          key: `${allowance.id}-total`,
          title: allowance.totalAmountLabel?.trim() || labels.lineTotal,
          field: 'totalAmount' as const,
          allowance,
          groupStart: false,
        },
      ],
    };
  });
}

export async function downloadAllowanceReportExcel(params: {
  meeting: Meeting;
  attendees: MeetingAttendance[];
  allowances: MeetingAllowance[];
  headOfficeEmployeeIds?: string[];
  dateTimeValue: string;
  labels: MeetingReportExcelLabels;
}) {
  const { meeting, attendees, allowances, dateTimeValue, labels } = params;
  const headOfficeEmployeeIds = new Set(params.headOfficeEmployeeIds ?? []);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Allowance');
  hideSheetGridLines(sheet);

  const groups = buildAllowanceLeaves(allowances, labels);
  const allLeaves = groups.flatMap((group) => group.leaves);
  const fixedLeftCount = 3;
  const totalColIndex = fixedLeftCount + allLeaves.length + 1;
  const signatureColIndex = totalColIndex + 1;
  const remarkColIndex = signatureColIndex + 1;
  const columnCount = remarkColIndex;
  const headerStartRow = 7;

  writeReportMeta(sheet, meeting, labels, dateTimeValue, columnCount);

  const topValues: Array<string | null> = Array.from(
    { length: columnCount },
    () => null,
  );
  const bottomValues: Array<string | null> = Array.from(
    { length: columnCount },
    () => null,
  );

  topValues[0] = labels.srNo;
  topValues[1] = labels.name;
  topValues[2] = labels.township;

  let nextCol = fixedLeftCount + 1;
  for (const group of groups) {
    if (group.groupTitle === null) {
      topValues[nextCol - 1] = group.leaves[0]?.title ?? labels.lineTotal;
      nextCol += 1;
      continue;
    }
    topValues[nextCol - 1] = group.groupTitle;
    for (const leaf of group.leaves) {
      bottomValues[nextCol - 1] = leaf.title;
      nextCol += 1;
    }
  }

  topValues[totalColIndex - 1] = labels.totalAmount;
  topValues[signatureColIndex - 1] = labels.signature;
  topValues[remarkColIndex - 1] = labels.remark;

  const topRow = sheet.addRow(topValues);
  const bottomRow = sheet.addRow(bottomValues);

  const styleHeaderCell = (cell: ExcelJS.Cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    applyThinBorders(cell);
  };

  for (let col = 1; col <= columnCount; col += 1) {
    styleHeaderCell(topRow.getCell(col));
    styleHeaderCell(bottomRow.getCell(col));
  }
  topRow.height = FIXED_HEADER_ROW_HEIGHT;
  bottomRow.height = FIXED_HEADER_ROW_HEIGHT;

  // Fixed left + trailing columns + total-only leaves: merge vertically.
  for (let col = 1; col <= fixedLeftCount; col += 1) {
    sheet.mergeCells(headerStartRow, col, headerStartRow + 1, col);
  }
  sheet.mergeCells(
    headerStartRow,
    totalColIndex,
    headerStartRow + 1,
    totalColIndex,
  );
  sheet.mergeCells(
    headerStartRow,
    signatureColIndex,
    headerStartRow + 1,
    signatureColIndex,
  );
  sheet.mergeCells(
    headerStartRow,
    remarkColIndex,
    headerStartRow + 1,
    remarkColIndex,
  );

  nextCol = fixedLeftCount + 1;
  for (const group of groups) {
    if (group.groupTitle === null) {
      sheet.mergeCells(headerStartRow, nextCol, headerStartRow + 1, nextCol);
      nextCol += 1;
      continue;
    }
    const span = group.leaves.length;
    if (span > 1) {
      sheet.mergeCells(
        headerStartRow,
        nextCol,
        headerStartRow,
        nextCol + span - 1,
      );
    }
    nextCol += span;
  }

  let grandTotal = 0;

  attendees.forEach((row, index) => {
    const leafValues = allLeaves.map((leaf) =>
      formatAmount(
        allowanceAmountForAttendee(
          leaf.allowance,
          row,
          leaf.field,
          headOfficeEmployeeIds,
        ),
      ),
    );
    const rowTotal = sumAllowanceTotalsForAttendee(
      allowances,
      row,
      headOfficeEmployeeIds,
    );
    grandTotal += rowTotal;
    const values: Array<string | number> = [
      index + 1,
      formatEmployeeName(row),
      row.employee?.townshipName || '',
      ...leafValues,
      allowances.length ? rowTotal : '',
      '',
      row.remark || '',
    ];
    const dataRow = sheet.addRow(values);
    dataRow.height = TABLE_ROW_HEIGHT;
    dataRow.eachCell((cell, cellCol) => {
      applyThinBorders(cell);
      cell.alignment = {
        ...(cell.alignment || {}),
        vertical: 'middle',
      };
      if (cellCol === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      if (
        (cellCol > fixedLeftCount && cellCol <= totalColIndex) ||
        cellCol === totalColIndex
      ) {
        cell.alignment = {
          ...(cell.alignment || {}),
          horizontal: 'right',
          vertical: 'middle',
        };
      }
      if (cellCol === totalColIndex) {
        cell.font = { bold: true };
      }
    });
  });

  if (attendees.length > 0) {
    const footerValues: Array<string | number> = Array.from(
      { length: columnCount },
      () => '',
    );
    footerValues[0] = labels.footerTotal;
    footerValues[totalColIndex - 1] = allowances.length ? grandTotal : '';
    const footerRow = sheet.addRow(footerValues);
    footerRow.height = TABLE_ROW_HEIGHT;
    sheet.mergeCells(
      footerRow.number,
      1,
      footerRow.number,
      fixedLeftCount,
    );
    footerRow.eachCell((cell, cellCol) => {
      cell.font = { bold: true };
      applyThinBorders(cell);
      cell.alignment = {
        ...(cell.alignment || {}),
        vertical: 'middle',
      };
      if (cellCol === 1) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      if (cellCol === totalColIndex) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
  }

  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 28;
  for (let i = 0; i < allLeaves.length; i += 1) {
    sheet.getColumn(fixedLeftCount + 1 + i).width = 12;
  }
  sheet.getColumn(totalColIndex).width = 14;
  sheet.getColumn(signatureColIndex).width = 16;
  sheet.getColumn(remarkColIndex).width = 20;

  // Township + quantity: fit table content only (skip meta / sign-off skew).
  fitColumnToContent(sheet, 3, {
    minWidth: 8,
    maxWidth: 28,
    fromRow: headerStartRow,
  });
  for (let i = 0; i < allLeaves.length; i += 1) {
    if (allLeaves[i]?.key.endsWith('-quantity')) {
      fitColumnToContent(sheet, fixedLeftCount + 1 + i, {
        minWidth: 6,
        maxWidth: 16,
        fromRow: headerStartRow,
      });
    }
  }

  // Title: fit content. Other header/meta rows: fixed 22.
  fitNonTableRowHeight(sheet.getRow(1));
  for (let r = 2; r < headerStartRow; r += 1) {
    sheet.getRow(r).height = FIXED_HEADER_ROW_HEIGHT;
  }

  if (labels.signOff) {
    writeAllowanceSignOff(sheet, columnCount, labels.signOff);
  }

  await addHluLogoTopRight(workbook, sheet);
  await downloadWorkbook(workbook, labels.filename);
}
