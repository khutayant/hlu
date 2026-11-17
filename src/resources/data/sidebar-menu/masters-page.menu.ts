import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the masters (reference data) app area. */
export const MASTERS_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'location',
    labelKey: 'nav.locationMasterPage',
    path: '/masters/location',
    icon: 'location',
  },
  {
    id: 'category',
    labelKey: 'nav.categoryMasterPage',
    path: '/masters/category',
    icon: 'category',
  },
  {
    id: 'project',
    labelKey: 'nav.projectMasterPage',
    path: '/masters/project',
    icon: 'project',
  },
  {
    id: 'session',
    labelKey: 'nav.sessionMasterPage',
    path: '/masters/session',
    icon: 'session',
  },
];
