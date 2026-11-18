import {
  FileTextOutlined,
  InfoCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Empty, Grid, Menu, Spin, theme } from 'antd';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { TOOLBAR_HEIGHT_PX } from '../../../components/toolbar';
import {
  getMeetingByIdRequest,
  type Meeting,
} from '../../../handlers/meeting.handler';
import { useI18n } from '../../../providers/i18n.provider';
import {
  RIBBON_MIN_HEIGHT_PX,
  RibbonTitle,
  useSetRibbon,
} from '../../../providers/ribbon.provider';
import { useToast } from '../../../providers/toast.provider';
import { MeetingAttendanceImportPanel } from './meeting-attendance-import-panel';
import { MeetingAttendancePanel } from './meeting-attendance-panel';
import { MeetingDetailPanel } from './meeting-detail-panel';
import { MeetingPerdiemReceiptPanel } from './meeting-perdiem-receipt-panel';

/** Matches `HomeLayout` Content padding so this shell can bleed edge-to-edge. */
const CONTENT_PAD_X = 20;
const CONTENT_PAD_TOP = 20;
const CONTENT_PAD_BOTTOM = 32;

const { useBreakpoint } = Grid;

const MEETING_SECTIONS = [
  'details',
  'attendance',
  'attendance-import',
  'perdiem-receipt',
] as const;

type MeetingSection = (typeof MEETING_SECTIONS)[number];

function isMeetingSection(value: string | undefined): value is MeetingSection {
  return MEETING_SECTIONS.includes(value as MeetingSection);
}

function MeetingDetailPage() {
  const { t } = useI18n();
  const { token } = theme.useToken();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { id, section: sectionParam } = useParams<{
    id: string;
    section?: string;
  }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const section = useMemo<MeetingSection | null>(() => {
    if (!isMeetingSection(sectionParam)) {
      return null;
    }
    return sectionParam;
  }, [sectionParam]);

  const title = meeting?.name || t('nav.meetingDetail');
  const description = meeting?.meetingNo;

  useSetRibbon(
    <>
      <RibbonTitle title={title} description={description} />
      <Button
        onClick={() => {
          if (section === 'attendance-import' && id) {
            navigate(`/meeting/${id}/attendance`);
            return;
          }
          navigate('/meeting');
        }}
        style={{ marginInlineStart: 'auto', flexShrink: 0 }}
      >
        {t('common.close')}
      </Button>
    </>,
    [title, description, navigate, t, section, id],
  );

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setMeeting(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await getMeetingByIdRequest(id);
        if (!cancelled) {
          setMeeting(result);
        }
      } catch (error) {
        if (!cancelled) {
          setMeeting(null);
          showToast({
            message:
              error instanceof Error
                ? error.message
                : t('meetingDetailPage.loadFailed'),
            severity: 'error',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey, showToast, t]);

  if (!id) {
    return <Navigate to='/meeting' replace />;
  }

  if (!section) {
    return <Navigate to={`/meeting/${id}/details`} replace />;
  }

  const shellHeight = `calc(100vh - ${TOOLBAR_HEIGHT_PX + RIBBON_MIN_HEIGHT_PX}px)`;

  let mainContent: ReactNode;
  if (loading) {
    mainContent = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin />
      </div>
    );
  } else if (!meeting) {
    mainContent = <Empty description={t('meetingDetailPage.loadFailed')} />;
  } else if (section === 'details') {
    mainContent = (
      <MeetingDetailPanel meeting={meeting} onChanged={reload} />
    );
  } else if (section === 'attendance') {
    mainContent = <MeetingAttendancePanel meetingId={meeting.id} />;
  } else if (section === 'attendance-import') {
    mainContent = (
      <MeetingAttendanceImportPanel
        meetingId={meeting.id}
        onClose={() => navigate(`/meeting/${meeting.id}/attendance`)}
      />
    );
  } else if (section === 'perdiem-receipt') {
    mainContent = <MeetingPerdiemReceiptPanel meeting={meeting} />;
  } else {
    mainContent = null;
  }

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
        aria-label={meeting?.name || title}
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
          selectedKeys={[
            section === 'attendance-import' ? 'attendance' : section,
          ]}
          onClick={({ key }) => {
            navigate(`/meeting/${id}/${key}`);
          }}
          style={{
            border: 'none',
            background: 'transparent',
            fontSize: 15,
          }}
          items={[
            {
              key: 'details',
              icon: <InfoCircleOutlined />,
              label: t('meetingDetailPage.menu.details'),
            },
            {
              key: 'attendance',
              icon: <TeamOutlined />,
              label: t('meetingDetailPage.menu.attendance'),
            },
            {
              key: 'perdiem-receipt',
              icon: <FileTextOutlined />,
              label: t('meetingDetailPage.menu.perdiemReceipt'),
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

export default MeetingDetailPage;
