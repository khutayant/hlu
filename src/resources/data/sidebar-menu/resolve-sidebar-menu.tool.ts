import { isDev } from '../../../config';
import { ADMIN_PAGE_MENU } from './admin-page.menu';
import { MAIN_PAGE_MENU } from './main-page.menu';
import type { SidebarMenuItem } from './sidebar-menu.interface';

function filterDevItems(items: SidebarMenuItem[]) {
  return items.filter((item) => !item.devOnly || isDev());
}

/**
 * Pick sidebar items for the current route area.
 * - `/admin*` → admin menu (user role + test in dev)
 * - otherwise → main menu (home + test in dev)
 */
export function resolveSidebarMenu(pathname: string): SidebarMenuItem[] {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  if (normalized === '/admin' || normalized.startsWith('/admin/')) {
    return filterDevItems(ADMIN_PAGE_MENU);
  }

  return filterDevItems(MAIN_PAGE_MENU);
}
