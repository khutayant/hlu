import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the staff (HR) app area. */
export const STAFF_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'employees',
    labelKey: 'nav.employeePage',
    path: '/staff/employee',
    icon: 'employee',
    moduleCode: 'EMPLOYEE_MANAGEMENT_SYSTEM',
  },
];
