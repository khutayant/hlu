import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the masters (reference data) app area. */
export const MASTERS_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'location',
    labelKey: 'nav.locationMasterPage',
    path: '/masters/location',
    icon: 'location',
    moduleCode: 'MASTER_MANAGEMENT_SYSTEM',
  },
  {
    id: 'project',
    labelKey: 'nav.projectMasterPage',
    path: '/masters/project',
    icon: 'project',
    moduleCode: 'MASTER_MANAGEMENT_SYSTEM',
  },
  {
    id: 'category',
    labelKey: 'nav.categoryMasterPage',
    path: '/masters/category',
    icon: 'category',
    moduleCode: 'MASTER_MANAGEMENT_SYSTEM',
  },
];
