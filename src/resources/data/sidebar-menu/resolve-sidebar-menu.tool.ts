import { isDev } from '../../../config';
import { ADMIN_PAGE_MENU } from './admin-page.menu';
import { MAIN_PAGE_MENU } from './main-page.menu';
import { MASTERS_PAGE_MENU } from './masters-page.menu';
import { STAFF_PAGE_MENU } from './staff-page.menu';
import type { SidebarMenuItem } from './sidebar-menu.interface';

function filterDevItems(items: SidebarMenuItem[]) {
  return items.filter((item) => !item.devOnly || isDev());
}

/**
 * Pick sidebar items for the current route area.
 * - `/admin*` → admin menu
 * - `/staff*` → staff (HR) menu
 * - `/masters*` → masters menu (reference data)
 * - otherwise → main menu (home; Test only on `/` and `/test`, and only in dev)
 */
export function resolveSidebarMenu(pathname: string): SidebarMenuItem[] {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  if (normalized === '/admin' || normalized.startsWith('/admin/')) {
    return filterDevItems(ADMIN_PAGE_MENU);
  }

  if (normalized === '/staff' || normalized.startsWith('/staff/')) {
    return filterDevItems(STAFF_PAGE_MENU);
  }

  if (normalized === '/masters' || normalized.startsWith('/masters/')) {
    return filterDevItems(MASTERS_PAGE_MENU);
  }

  const onHomeOrTest = normalized === '/' || normalized === '/test';
  const mainItems = MAIN_PAGE_MENU.filter(
    (item) => item.id !== 'test' || onHomeOrTest,
  );
  return filterDevItems(mainItems);
}
