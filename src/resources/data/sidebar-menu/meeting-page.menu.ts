import type { SidebarMenuItem } from './sidebar-menu.interface';

/** Sidebar for the meeting and attendance app area. */
export const MEETING_PAGE_MENU: SidebarMenuItem[] = [
  {
    id: 'meetings',
    labelKey: 'nav.meetingsList',
    path: '/meeting',
    icon: 'meeting',
    moduleCode: 'MEETING_AND_ATTENDANCE_MANAGEMENT_SYSTEM',
  },
];
