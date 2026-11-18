import {
  listEmployeesRequest,
  type Employee,
  type EmployeeGender,
} from '../../../../handlers/employee.handler';

/** Columns for employee list CSV export (import-compatible + employeeNo). */
export const EMPLOYEE_EXPORT_COLUMNS = [
  'employeeNo',
  'displayName',
  'focalNo',
  'gender',
  'townshipName',
  'position',
  'experience',
  'email',
  'phone',
  'hireDate',
  'endDate',
  'remark',
] as const;

export type EmployeeExportColumn = (typeof EMPLOYEE_EXPORT_COLUMNS)[number];

export type EmployeeExportFilters = {
  q?: string;
  active?: boolean;
  gender?: EmployeeGender;
  townshipName?: string;
  position?: string;
};

const EXPORT_PAGE_SIZE = 100;

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatExportDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? value;
}

function cellValue(employee: Employee, column: EmployeeExportColumn): string {
  switch (column) {
    case 'employeeNo':
      return employee.employeeNo ?? '';
    case 'displayName':
      return employee.displayName ?? '';
    case 'focalNo':
      return employee.focalNo ?? '';
    case 'gender':
      return employee.gender ?? '';
    case 'townshipName':
      return employee.township?.name ?? employee.townshipName ?? '';
    case 'position':
      return employee.position?.name ?? employee.positionName ?? '';
    case 'experience':
      return employee.experience ?? '';
    case 'email':
      return employee.email ?? '';
    case 'phone':
      return employee.phone ?? '';
    case 'hireDate':
      return formatExportDate(employee.hireDate);
    case 'endDate':
      return formatExportDate(employee.endDate);
    case 'remark':
      return employee.remark ?? '';
    default:
      return '';
  }
}

export function employeesToCsv(employees: Employee[]): string {
  const header = EMPLOYEE_EXPORT_COLUMNS.join(',');
  const rows = employees.map((employee) =>
    EMPLOYEE_EXPORT_COLUMNS.map((column) =>
      escapeCsvCell(cellValue(employee, column)),
    ).join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadEmployeeCsv(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Fetch every page matching filters (server max 100/page). */
export async function fetchAllEmployeesForExport(
  filters: EmployeeExportFilters,
): Promise<Employee[]> {
  const all: Employee[] = [];
  let page = 1;
  let total = Infinity;

  while (all.length < total) {
    const result = await listEmployeesRequest({
      ...filters,
      page,
      limit: EXPORT_PAGE_SIZE,
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
