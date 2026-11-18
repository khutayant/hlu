import { isDev } from '../../../config';
import { ADMIN_PAGE_MENU } from './admin-page.menu';
import { MAIN_PAGE_MENU } from './main-page.menu';
import { MASTERS_PAGE_MENU } from './masters-page.menu';
import { MEETING_PAGE_MENU } from './meeting-page.menu';
import { STAFF_PAGE_MENU } from './staff-page.menu';
import type { SidebarMenuItem } from './sidebar-menu.interface';

function filterDevItems(items: SidebarMenuItem[]): SidebarMenuItem[] {
  return items
    .filter((item) => !item.devOnly || isDev())
    .map((item) => {
      if (!item.children) {
        return item;
      }
      return {
        ...item,
        children: item.children.filter(
          (child) => !child.devOnly || isDev(),
        ),
      };
    })
    .filter((item) => !item.children || item.children.length > 0);
}

/** Flatten leaf items (for selection / module gating). */
export function flattenSidebarMenuLeaves(
  items: SidebarMenuItem[],
): Extract<SidebarMenuItem, { path: string }>[] {
  const leaves: Extract<SidebarMenuItem, { path: string }>[] = [];
  for (const item of items) {
    if (item.children) {
      leaves.push(...item.children);
    } else {
      leaves.push(item);
    }
  }
  return leaves;
}

/**
 * Pick sidebar items for the current route area.
 * - `/admin*` → admin menu
 * - `/staff*` → staff (HR) menu
 * - `/masters*` → masters menu (reference data)
 * - `/meeting*` → meeting and attendance menu
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

  if (normalized === '/meeting' || normalized.startsWith('/meeting/')) {
    return filterDevItems(MEETING_PAGE_MENU);
  }

  const onHomeOrTest = normalized === '/' || normalized === '/test';
  const mainItems = MAIN_PAGE_MENU.filter(
    (item) => item.id !== 'test' || onHomeOrTest,
  );
  return filterDevItems(mainItems);
}
