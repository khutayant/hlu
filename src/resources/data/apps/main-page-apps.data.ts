export type MainPageAppIcon =
  | 'experiment'
  | 'team'
  | 'file'
  | 'setting'
  | 'appstore'
  | 'admin';

export type MainPageApp = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  path: string;
  icon: MainPageAppIcon;
  color: string;
  /** When set, the module gate must allow this system or module code. */
  moduleCode?: string;
};

export const MAIN_PAGE_APPS: MainPageApp[] = [
  {
    id: 'test',
    titleKey: 'apps.test.title',
    descriptionKey: 'apps.test.description',
    path: '/test',
    icon: 'experiment',
    color: '#1565c0',
  },
  {
    id: 'admin',
    titleKey: 'apps.admin.title',
    descriptionKey: 'apps.admin.description',
    path: '/admin/user-role',
    icon: 'admin',
    color: '#455a64',
    moduleCode: 'ADMIN_SYSTEM',
  },
  {
    id: 'staff',
    titleKey: 'apps.staff.title',
    descriptionKey: 'apps.staff.description',
    path: '/',
    icon: 'team',
    color: '#00897b',
  },
  {
    id: 'files',
    titleKey: 'apps.files.title',
    descriptionKey: 'apps.files.description',
    path: '/',
    icon: 'file',
    color: '#6a1b9a',
  },
  {
    id: 'settings',
    titleKey: 'apps.settings.title',
    descriptionKey: 'apps.settings.description',
    path: '/',
    icon: 'setting',
    color: '#ef6c00',
  },
  {
    id: 'catalog',
    titleKey: 'apps.catalog.title',
    descriptionKey: 'apps.catalog.description',
    path: '/',
    icon: 'appstore',
    color: '#c62828',
  },
];
