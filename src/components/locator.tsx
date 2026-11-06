import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb, Flex } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../providers/i18n.provider';

/** Known app routes → i18n label keys (longest prefix wins). */
const ROUTE_LABELS: { path: string; labelKey: string }[] = [
  { path: '/', labelKey: 'nav.mainPage' },
];

function resolveRouteLabel(pathname: string) {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  const exact = ROUTE_LABELS.find((route) => route.path === normalized);
  if (exact) {
    return exact;
  }

  return (
    [...ROUTE_LABELS]
      .filter((route) => route.path !== '/' && normalized.startsWith(route.path))
      .sort((a, b) => b.path.length - a.path.length)[0] ?? null
  );
}

function AppLocator() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const current = resolveRouteLabel(pathname);
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
    ...(current && !isHome
      ? [
          {
            key: current.path,
            title: t(current.labelKey),
          },
        ]
      : isHome
        ? [
            {
              key: 'main',
              title: t('nav.mainPage'),
            },
          ]
        : [
            {
              key: pathname,
              title: pathname,
            },
          ]),
  ];

  return (
    <div
      style={{
        position: 'sticky',
        insetBlockStart: 64,
        zIndex: 9,
        background: '#fff',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        paddingBlock: 10,
        paddingInline: 16,
      }}
      aria-label={t('common.locator')}
    >
      <div
        style={{
          maxWidth: 960,
          marginInline: 'auto',
          width: '100%',
        }}
      >
        <Breadcrumb items={items} />
      </div>
    </div>
  );
}

export default AppLocator;
