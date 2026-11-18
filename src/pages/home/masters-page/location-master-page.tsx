import { EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import { Button, Grid, Menu, theme } from 'antd';
import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TOOLBAR_HEIGHT_PX } from '../../../components/toolbar';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RIBBON_MIN_HEIGHT_PX,
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';
import { CountryMasterPanel } from './country-master-page';
import { TownshipMasterPanel } from './township-master-page';

/** Matches `HomeLayout` Content padding so this shell can bleed edge-to-edge. */
const CONTENT_PAD_X = 20;
const CONTENT_PAD_TOP = 20;
const CONTENT_PAD_BOTTOM = 32;

const { useBreakpoint } = Grid;

const LOCATION_SECTIONS = ['country', 'township'] as const;

type LocationSection = (typeof LOCATION_SECTIONS)[number];

function isLocationSection(value: string | undefined): value is LocationSection {
  return LOCATION_SECTIONS.includes(value as LocationSection);
}

function LocationMasterPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { section: sectionParam } = useParams<{ section?: string }>();

  const section = useMemo<LocationSection | null>(() => {
    if (!isLocationSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = t('locationMasterPage.title');
  const description = t('locationMasterPage.description');

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => navigate('/')}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t],
  );

  if (!section) {
    return <Navigate to='/masters/location/country' replace />;
  }

  const mainContent =
    section === 'country' ? (
      <CountryMasterPanel />
    ) : (
      <TownshipMasterPanel />
    );

  const shellHeight = `calc(100vh - ${TOOLBAR_HEIGHT_PX + RIBBON_MIN_HEIGHT_PX}px)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'stretch',
        flex: 1,
        width: `calc(100% + ${CONTENT_PAD_X * 2}px)`,
        marginInline: -CONTENT_PAD_X,
        marginTop: -CONTENT_PAD_TOP,
        marginBottom: -CONTENT_PAD_BOTTOM,
        height: shellHeight,
        maxHeight: shellHeight,
        minHeight: 0,
        overflow: 'hidden',
        background: '#f5f7fa',
      }}
    >
      <nav
        aria-label={title}
        style={{
          width: isMobile ? '100%' : 280,
          flexShrink: 0,
          minHeight: 0,
          overflow: 'auto',
          background: '#fff',
          borderInlineEnd: isMobile
            ? 'none'
            : '1px solid rgba(5, 5, 5, 0.06)',
          borderBottom: isMobile ? '1px solid rgba(5, 5, 5, 0.06)' : 'none',
          paddingBlock: 12,
          paddingInline: 8,
          boxSizing: 'border-box',
        }}
      >
        <Menu
          mode={isMobile ? 'horizontal' : 'vertical'}
          selectedKeys={[section]}
          onClick={({ key }) => {
            navigate(`/masters/location/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
          }}
          items={[
            {
              key: 'country',
              icon: <GlobalOutlined />,
              label: t('locationMasterPage.menu.country'),
            },
            {
              key: 'township',
              icon: <EnvironmentOutlined />,
              label: t('locationMasterPage.menu.township'),
            },
          ]}
        />
      </nav>

      <main
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          padding: isMobile ? 16 : 20,
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            minHeight: '100%',
            padding: token.paddingLG,
            borderRadius: token.borderRadiusLG,
            background: token.colorBgContainer,
            boxSizing: 'border-box',
          }}
        >
          {mainContent}
        </div>
      </main>
    </div>
  );
}

export default LocationMasterPage;
