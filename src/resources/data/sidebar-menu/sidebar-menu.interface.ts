export type SidebarMenuIcon = 'home' | 'test' | 'userRole';

export type SidebarMenuItem = {
  id: string;
  labelKey: string;
  path: string;
  icon: SidebarMenuIcon;
  /** Shown only when `isDev()` / TEST_MODE is true. */
  devOnly?: boolean;
  /** When set, the module gate must allow this system or module code. */
  moduleCode?: string;
};
