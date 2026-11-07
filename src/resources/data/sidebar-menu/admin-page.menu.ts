import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the admin app area. */
export const ADMIN_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'user-role',
    labelKey: 'nav.userRolePage',
    path: '/admin/user-role',
    icon: 'userRole',
    moduleCode: 'ADMIN_SYSTEM',
  },
  {
    id: 'test',
    labelKey: 'nav.testPage',
    path: '/test',
    icon: 'test',
    devOnly: true,
  },
];
