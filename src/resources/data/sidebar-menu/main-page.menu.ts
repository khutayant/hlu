import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the main (home) app area. */
export const MAIN_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'home',
    labelKey: 'nav.mainPage',
    path: '/',
    icon: 'home',
  },
  {
    id: 'test',
    labelKey: 'nav.testPage',
    path: '/test',
    icon: 'test',
    devOnly: true,
  },
];
