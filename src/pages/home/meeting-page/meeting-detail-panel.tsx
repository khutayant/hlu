import { EditOutlined } from '@ant-design/icons';
import { Button, Flex, Switch, Tag, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import {
  setMeetingActiveRequest,
  type Meeting,
} from '../../../handlers/meeting.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';
import { MeetingFormBody } from './meeting-panel';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(110px, 160px) 1fr',
        columnGap: 24,
        rowGap: 4,
        paddingBlock: 14,
        borderBottom: '1px solid rgba(5, 5, 5, 0.08)',
      }}
    >
      <Typography.Text type='secondary' style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 15 }}>{value}</Typography.Text>
    </div>
  );
}

/** Meeting details section content for the detail page. */
export function MeetingDetailPanel({
  meeting,
  onChanged,
}: {
  meeting: Meeting;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [statusBusy, setStatusBusy] = useState(false);

  const openEdit = () => {
    customDialog({
      title: t('meetingPanel.editTitle'),
      width: 480,
      content: (
        <MeetingFormBody
          mode='edit'
          initial={meeting}
          onSaved={onChanged}
        />
      ),
    });
  };

  const onToggleActive = async (nextActive: boolean) => {
    setStatusBusy(true);
    try {
      await setMeetingActiveRequest(meeting.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'meetingPanel.statusActivateSuccess'
            : 'meetingPanel.statusDeactivateSuccess',
          { name: meeting.name },
        ),
        severity: 'success',
      });
      onChanged();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('meetingPanel.statusChangeFailed'),
        severity: 'error',
      });
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div>
      <Flex justify='flex-end' style={{ marginBottom: 8 }}>
        <Button type='primary' icon={<EditOutlined />} onClick={openEdit}>
          {t('meetingPanel.actions.edit')}
        </Button>
      </Flex>

      <DetailRow label={t('meetingPanel.fields.name')} value={meeting.name} />
      <DetailRow
        label={t('meetingPanel.fields.meetingNo')}
        value={meeting.meetingNo}
      />
      <DetailRow
        label={t('meetingPanel.fields.fromDate')}
        value={formatDisplayDateTime(meeting.fromDate)}
      />
      <DetailRow
        label={t('meetingPanel.fields.toDate')}
        value={formatDisplayDateTime(meeting.toDate)}
      />
      <DetailRow
        label={t('meetingPanel.fields.description')}
        value={meeting.description || '—'}
      />
      <DetailRow
        label={t('meetingPanel.columns.status')}
        value={
          <Flex align='center' gap={8}>
            <Switch
              checked={meeting.active}
              loading={statusBusy}
              onChange={(checked) => {
                void onToggleActive(checked);
              }}
            />
            <Tag color={meeting.active ? 'success' : 'default'}>
              {meeting.active
                ? t('meetingPanel.filterActive')
                : t('meetingPanel.filterInactive')}
            </Tag>
          </Flex>
        }
      />
      <DetailRow
        label={t('meetingPanel.columns.createdBy')}
        value={
          <div style={{ lineHeight: 1.35 }}>
            <div>{meeting.createdBy?.name || '—'}</div>
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {formatDisplayDateTime(meeting.createdDate)}
            </Typography.Text>
          </div>
        }
      />
      <DetailRow
        label={t('meetingPanel.columns.updatedBy')}
        value={
          <div style={{ lineHeight: 1.35 }}>
            <div>{meeting.updatedBy?.name || '—'}</div>
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {formatDisplayDateTime(meeting.updatedDate)}
            </Typography.Text>
          </div>
        }
      />
    </div>
  );
}
