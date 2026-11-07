import {
  AppstoreOutlined,
  ControlOutlined,
  ExperimentOutlined,
  FileOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card, Typography } from 'antd';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useModule } from '../../../providers/module.provider';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';
import {
  MAIN_PAGE_APPS,
  type MainPageAppIcon,
} from '../../../resources/data/apps/main-page-apps.data';

const APP_ICONS: Record<MainPageAppIcon, ReactNode> = {
  experiment: <ExperimentOutlined />,
  team: <TeamOutlined />,
  file: <FileOutlined />,
  setting: <SettingOutlined />,
  appstore: <AppstoreOutlined />,
  admin: <ControlOutlined />,
};

function MainPage() {
  const { t } = useI18n();
  const { ready, hasModule } = useModule();
  const title = t('mainPage.title');
  const description = t('mainPage.description');
  useSetRibbon(
    <RibbonTitle title={title} description={description} />,
    [title, description],
  );

  return (
    <div
      className='main-page-apps-grid'
      style={{
        display: 'grid',
        gap: 16,
        width: '100%',
      }}
    >
      {MAIN_PAGE_APPS.filter(
        (app) => !app.moduleCode || (ready && hasModule(app.moduleCode)),
      ).map((app) => (
        <Link
          key={app.id}
          to={app.path}
          style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
        >
          <Card
            hoverable
            styles={{
              body: {
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                height: '100%',
              },
            }}
            style={{ height: '100%' }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${app.color}14`,
                color: app.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {APP_ICONS[app.icon]}
            </div>
            <Typography.Text strong style={{ fontSize: 15 }}>
              {t(app.titleKey)}
            </Typography.Text>
            <Typography.Text
              type='secondary'
              style={{ fontSize: 13, lineHeight: 1.4 }}
            >
              {t(app.descriptionKey)}
            </Typography.Text>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default MainPage;
