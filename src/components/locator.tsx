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
  { path: '/admin/user-role', labelKey: 'nav.userRolePage' },
  { path: '/admin/user-role/:id', labelKey: 'nav.userRoleDetail' },
  {
    path: '/admin/user-role/:id/users',
    labelKey: 'userRolePage.menu.users',
  },
  {
    path: '/admin/user-role/:id/permissions',
    labelKey: 'userRolePage.menu.permissions',
  },
  {
    path: '/admin/user-role/:id/modules',
    labelKey: 'userRolePage.menu.modules',
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

function resolveRouteChain(pathname: string) {
  const normalized = normalizePath(pathname);
  if (normalized === '/' || normalized === '') {
    return [];
  }

  return ROUTE_LABELS.filter(
    (route) => route.path !== '/' && routeMatches(route.path, normalized),
  ).sort((a, b) => a.path.length - b.path.length);
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
