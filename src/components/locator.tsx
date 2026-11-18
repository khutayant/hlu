import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb, Flex } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../providers/i18n.provider';

/** Known app routes → i18n label keys (longest prefix wins). */
const ROUTE_LABELS: { path: string; labelKey: string }[] = [
  { path: '/', labelKey: 'nav.mainPage' },
  { path: '/test', labelKey: 'nav.testPage' },
  { path: '/profile', labelKey: 'nav.profilePage' },
  { path: '/profile/profile', labelKey: 'profilePage.menu.profile' },
  { path: '/profile/security', labelKey: 'profilePage.menu.security' },
  { path: '/admin', labelKey: 'nav.adminPage' },
  { path: '/admin/user', labelKey: 'nav.userPage' },
  { path: '/admin/user-role', labelKey: 'nav.userRolePage' },
  { path: '/staff', labelKey: 'nav.staffPage' },
  { path: '/staff/overview', labelKey: 'nav.employeeOverviewPage' },
  { path: '/staff/title', labelKey: 'nav.titleMasterPage' },
  { path: '/staff/position', labelKey: 'nav.positionMasterPage' },
  { path: '/staff/employee', labelKey: 'nav.employeePage' },
  { path: '/staff/employee/import', labelKey: 'nav.employeeImportPage' },
  { path: '/staff/employee/:id', labelKey: 'nav.employeeProfilePage' },
  { path: '/meeting', labelKey: 'nav.meetingPage' },
  { path: '/meeting/:id', labelKey: 'nav.meetingDetail' },
  {
    path: '/meeting/:id/details',
    labelKey: 'meetingDetailPage.menu.details',
  },
  {
    path: '/meeting/:id/attendance',
    labelKey: 'meetingDetailPage.menu.attendance',
  },
  {
    path: '/meeting/:id/attendance-import',
    labelKey: 'meetingAttendancePanel.import.title',
  },
  {
    path: '/meeting/:id/perdiem-receipt',
    labelKey: 'meetingDetailPage.menu.perdiemReceipt',
  },
  { path: '/masters', labelKey: 'nav.mastersPage' },
  { path: '/masters/location', labelKey: 'nav.locationMasterPage' },
  {
    path: '/masters/location/country',
    labelKey: 'locationMasterPage.menu.country',
  },
  {
    path: '/masters/location/township',
    labelKey: 'locationMasterPage.menu.township',
  },
  { path: '/masters/category', labelKey: 'nav.categoryMasterPage' },
  { path: '/masters/title', labelKey: 'nav.titleMasterPage' },
  { path: '/masters/position', labelKey: 'nav.positionMasterPage' },
  { path: '/masters/project', labelKey: 'nav.projectMasterPage' },
  {
    path: '/masters/project/projects',
    labelKey: 'projectMasterPage.menu.projects',
  },
  {
    path: '/masters/project/immunization-sessions',
    labelKey: 'projectMasterPage.menu.immunizationSessions',
  },
  { path: '/admin/user-role/:id', labelKey: 'nav.userRoleDetail' },
  {
    path: '/admin/user-role/:id/users',
    labelKey: 'userRolePage.menu.users',
  },
  {
    path: '/admin/user-role/:id/modules',
    labelKey: 'userRolePage.menu.modules',
  },
  {
    path: '/admin/user-role/:id/permissions',
    labelKey: 'userRolePage.menu.permissions',
  },
];

function normalizePath(pathname: string) {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

function routeMatches(routePath: string, pathname: string) {
  if (routePath.includes(':')) {
    const routeParts = routePath.split('/');
    const pathParts = pathname.split('/');
    if (pathParts.length < routeParts.length) {
      return false;
    }
    return routeParts.every(
      (part, index) => part.startsWith(':') || part === pathParts[index],
    );
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

function resolveRouteHref(routePath: string, pathname: string) {
  if (!routePath.includes(':')) {
    return routePath;
  }
  const routeParts = routePath.split('/');
  const pathParts = pathname.split('/');
  return routeParts
    .map((part, index) => (part.startsWith(':') ? pathParts[index] : part))
    .join('/');
}

/** Static paths that must win over param routes (e.g. `import` vs `:id`). */
const STATIC_ROUTE_PATHS = new Set(
  ROUTE_LABELS.filter((route) => !route.path.includes(':')).map(
    (route) => route.path,
  ),
);

function resolveRouteChain(pathname: string) {
  const normalized = normalizePath(pathname);
  if (normalized === '/' || normalized === '') {
    return [];
  }

  const matches = ROUTE_LABELS.filter(
    (route) => route.path !== '/' && routeMatches(route.path, normalized),
  ).sort((a, b) => a.path.length - b.path.length);

  // Drop param routes that collide with a real static path (e.g. /staff/employee/import).
  const withoutStaticCollisions = matches.filter((route) => {
    if (!route.path.includes(':')) {
      return true;
    }
    const href = resolveRouteHref(route.path, normalized);
    return !STATIC_ROUTE_PATHS.has(href);
  });

  // Unique breadcrumb keys by resolved href (static preferred via filter above).
  const seenHrefs = new Set<string>();
  const chain: typeof ROUTE_LABELS = [];
  for (const route of withoutStaticCollisions) {
    const href = resolveRouteHref(route.path, normalized);
    if (seenHrefs.has(href)) {
      continue;
    }
    seenHrefs.add(href);
    chain.push(route);
  }
  return chain;
}

function AppLocator() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const chain = resolveRouteChain(pathname);
  const isHome = pathname === '/' || pathname === '';

  const items = [
    {
      key: 'home',
      title: isHome ? (
        <Flex align='center' gap={6}>
          <HomeOutlined />
          <span>{t('common.home')}</span>
        </Flex>
      ) : (
        <Link to='/'>
          <Flex align='center' gap={6}>
            <HomeOutlined />
            <span>{t('common.home')}</span>
          </Flex>
        </Link>
      ),
    },
    ...(isHome
      ? [
          {
            key: 'main',
            title: t('nav.mainPage'),
          },
        ]
      : chain.length > 0
        ? chain.map((route, index) => {
            const isLast = index === chain.length - 1;
            const href = resolveRouteHref(route.path, pathname);
            return {
              key: href,
              title: isLast ? (
                t(route.labelKey)
              ) : (
                <Link to={href}>{t(route.labelKey)}</Link>
              ),
            };
          })
        : [
            {
              key: pathname,
              title: pathname,
            },
          ]),
  ];

  return (
    <div
      aria-label={t('common.locator')}
      style={{
        flex: 1,
        minWidth: 0,
        lineHeight: 1.4,
        overflow: 'hidden',
      }}
    >
      <Breadcrumb
        items={items}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      />
    </div>
  );
}

export default AppLocator;
