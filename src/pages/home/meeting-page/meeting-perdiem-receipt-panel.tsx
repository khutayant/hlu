import { Empty } from 'antd';
import { useI18n } from '../../../providers/i18n.provider';
import type { Meeting } from '../../../handlers/meeting.handler';

/** Perdiem receipt calculation panel for a meeting. */
export function MeetingPerdiemReceiptPanel({
  meeting,
}: {
  meeting: Meeting;
}) {
  const { t } = useI18n();

  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={t('meetingPerdiemReceiptPanel.comingSoon', {
        name: meeting.name,
      })}
    />
  );
}
