export type MainPageAppIcon = 'team' | 'masters' | 'admin' | 'meeting';

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
    id: 'admin',
    titleKey: 'apps.admin.title',
    descriptionKey: 'apps.admin.description',
    path: '/admin/user',
    icon: 'admin',
    color: '#455a64',
    moduleCode: 'ADMIN_SYSTEM',
  },
  {
    id: 'staff',
    titleKey: 'apps.staff.title',
    descriptionKey: 'apps.staff.description',
    path: '/staff/overview',
    icon: 'team',
    color: '#00897b',
    moduleCode: 'EMPLOYEE_MANAGEMENT_SYSTEM',
  },
  {
    id: 'masters',
    titleKey: 'apps.masters.title',
    descriptionKey: 'apps.masters.description',
    path: '/masters/location',
    icon: 'masters',
    color: '#c62828',
  },
  {
    id: 'meeting',
    titleKey: 'apps.meeting.title',
    descriptionKey: 'apps.meeting.description',
    path: '/meeting',
    icon: 'meeting',
    color: '#1565c0',
  },
];
