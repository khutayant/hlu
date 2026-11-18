export type SidebarMenuIcon =
  | 'home'
  | 'test'
  | 'userRole'
  | 'users'
  | 'employee'
  | 'country'
  | 'township'
  | 'location'
  | 'category'
  | 'project'
  | 'title'
  | 'position'
  | 'overview';

type SidebarMenuBase = {
  id: string;
  labelKey: string;
  icon: SidebarMenuIcon;
  /** Shown only when `isDev()` / TEST_MODE is true. */
  devOnly?: boolean;
  /** When set, the module gate must allow this system or module code. */
  moduleCode?: string;
};

/** Leaf item that navigates to a route. */
export type SidebarMenuLeaf = SidebarMenuBase & {
  path: string;
  children?: undefined;
};

/** Group that expands to child leaf items (no direct route). */
export type SidebarMenuGroup = SidebarMenuBase & {
  path?: undefined;
  children: SidebarMenuLeaf[];
};

export type SidebarMenuItem = SidebarMenuLeaf | SidebarMenuGroup;
