import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { parseCsv } from '../../../tools/parse-csv.tool';

/** Letters A–Z then digits 0–9 only; max 9 (e.g. A91, M003). */
export const FOCAL_NO_PATTERN = /^[A-Z]+[0-9]+$/;
export const FOCAL_NO_MAX_LENGTH = 9;

export const ATTENDANCE_IMPORT_COLUMNS = [
  'name',
  'focalNo',
  'remark',
] as const;

export type AttendanceImportColumn = (typeof ATTENDANCE_IMPORT_COLUMNS)[number];

export type AttendanceImportFieldErrors = Partial<
  Record<AttendanceImportColumn, string>
>;

export type AttendanceImportRow = {
  key: string;
  /** Display-only verification name — not stored. */
  name: string;
  focalNo: string;
  remark: string;
  /** Matched employee display name from server (after resolve). */
  matchedName?: string | null;
  errors: AttendanceImportFieldErrors;
  importError?: string | null;
};

export type AttendanceImportMessages = {
  nameRequired: string;
  focalNoRequired: string;
  focalNoPattern: string;
  focalNoMaxLength: string;
  focalNoDuplicateFile: string;
  focalNoMissingEmployee: string;
  focalNoAlreadyAttending: string;
};

const HEADER_ALIASES: Record<string, AttendanceImportColumn> = {
  name: 'name',
  displayname: 'name',
  display_name: 'name',
  employeename: 'name',
  employee_name: 'name',
  focalno: 'focalNo',
  focal_no: 'focalNo',
  focal: 'focalNo',
  remark: 'remark',
  remarks: 'remark',
};

const HEADER_FILL = 'C6EFCE';

export function normalizeFocalNo(value: string) {
  return value.trim().toUpperCase();
}

export function resolveImportHeader(
  header: string,
): AttendanceImportColumn | null {
  const key = header.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return HEADER_ALIASES[key] ?? null;
}

function mapRawRows(
  headers: string[],
  rows: Record<string, string>[],
): AttendanceImportRow[] {
  const columnMap = new Map<number, AttendanceImportColumn>();
  headers.forEach((header, index) => {
    const column = resolveImportHeader(header);
    if (column) {
      columnMap.set(index, column);
    }
  });

  if (columnMap.size === 0) {
    throw new Error('NO_KNOWN_COLUMNS');
  }

  return rows.map((raw, index) => {
    const mapped: Partial<Record<AttendanceImportColumn, string>> = {};
    columnMap.forEach((column, colIndex) => {
      const header = headers[colIndex];
      mapped[column] = (raw[header] ?? '').trim();
    });

    return {
      key: `row-${index + 1}-${Date.now()}`,
      name: mapped.name ?? '',
      focalNo: mapped.focalNo ?? '',
      remark: mapped.remark ?? '',
      matchedName: null,
      errors: {},
      importError: null,
    };
  });
}

export function parseAttendanceImportCsv(text: string): AttendanceImportRow[] {
  const { headers, rows } = parseCsv(text);
  return mapRawRows(headers, rows);
}

export async function parseAttendanceImportFile(
  file: File,
): Promise<AttendanceImportRow[]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return [];
    }
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });
    if (matrix.length === 0) {
      return [];
    }
    const headers = (matrix[0] ?? []).map((cell) => String(cell ?? '').trim());
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < matrix.length; i += 1) {
      const cells = matrix[i] ?? [];
      const isEmpty = cells.every((cell) => String(cell ?? '').trim() === '');
      if (isEmpty) {
        continue;
      }
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (!header) {
          return;
        }
        row[header] = String(cells[index] ?? '').trim();
      });
      rows.push(row);
    }
    return mapRawRows(headers, rows);
  }

  const text = await file.text();
  return parseAttendanceImportCsv(text);
}

export function validateAttendanceImportRows(
  rows: AttendanceImportRow[],
  messages: AttendanceImportMessages,
  options?: {
    missingFocalNos?: Set<string>;
    alreadyAttendingFocalNos?: Set<string>;
    matchedByFocal?: Map<string, string>;
  },
): AttendanceImportRow[] {
  const missing = options?.missingFocalNos ?? new Set<string>();
  const alreadyAttending =
    options?.alreadyAttendingFocalNos ?? new Set<string>();
  const matchedByFocal = options?.matchedByFocal ?? new Map<string, string>();

  const focalCounts = new Map<string, number>();
  for (const row of rows) {
    const focalNo = normalizeFocalNo(row.focalNo);
    if (!focalNo) {
      continue;
    }
    focalCounts.set(focalNo, (focalCounts.get(focalNo) ?? 0) + 1);
  }

  return rows.map((row) => {
    const errors: AttendanceImportFieldErrors = {};
    const name = row.name.trim();
    const focalNo = normalizeFocalNo(row.focalNo);
    const remark = row.remark.trim();
    const matchedName = matchedByFocal.get(focalNo) ?? row.matchedName ?? null;

    if (!name) {
      errors.name = messages.nameRequired;
    }

    if (!focalNo) {
      errors.focalNo = messages.focalNoRequired;
    } else if (focalNo.length > FOCAL_NO_MAX_LENGTH) {
      errors.focalNo = messages.focalNoMaxLength;
    } else if (!FOCAL_NO_PATTERN.test(focalNo)) {
      errors.focalNo = messages.focalNoPattern;
    } else if ((focalCounts.get(focalNo) ?? 0) > 1) {
      errors.focalNo = messages.focalNoDuplicateFile;
    } else if (missing.has(focalNo)) {
      errors.focalNo = messages.focalNoMissingEmployee;
    } else if (alreadyAttending.has(focalNo)) {
      errors.focalNo = messages.focalNoAlreadyAttending;
    }

    return {
      ...row,
      name,
      focalNo,
      remark,
      matchedName,
      errors,
    };
  });
}

export function isAttendanceImportRowValid(row: AttendanceImportRow) {
  return Object.keys(row.errors).length === 0 && !row.importError;
}

export async function downloadAttendanceImportTemplate(labels: {
  name: string;
  focalNo: string;
  remark: string;
  sheetName: string;
  filename: string;
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(labels.sheetName);

  const headerRow = sheet.addRow([labels.name, labels.focalNo, labels.remark]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  sheet.addRow(['Example Name', 'A91', '']);
  sheet.columns = [{ width: 28 }, { width: 14 }, { width: 32 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = labels.filename.endsWith('.xlsx')
    ? labels.filename
    : `${labels.filename}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
