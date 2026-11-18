import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the staff (HR) app area. */
export const STAFF_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'overview',
    labelKey: 'nav.employeeOverviewPage',
    path: '/staff/overview',
    icon: 'overview',
    moduleCode: 'EMPLOYEE_MANAGEMENT_SYSTEM',
  },
  {
    id: 'titles',
    labelKey: 'nav.titleMasterPage',
    path: '/staff/title',
    icon: 'title',
    moduleCode: 'EMPLOYEE_MANAGEMENT_SYSTEM',
  },
  {
    id: 'positions',
    labelKey: 'nav.positionMasterPage',
    path: '/staff/position',
    icon: 'position',
    moduleCode: 'EMPLOYEE_MANAGEMENT_SYSTEM',
  },
  {
    id: 'employees',
    labelKey: 'nav.employeePage',
    path: '/staff/employee',
    icon: 'employee',
    moduleCode: 'EMPLOYEE_MANAGEMENT_SYSTEM',
  },
];
