import { EditOutlined } from '@ant-design/icons';
import { Button, Flex, Switch, Tag, Typography } from 'antd';
import { useState, type ReactNode } from 'react';
import {
  setProjectActiveRequest,
  type Project,
} from '../../../handlers/project.handler';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import { useToast } from '../../../providers/toast.provider';
import { formatDisplayDateTime } from '../../../tools/format-date.tool';
import { ProjectFormBody } from './project-panel';

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

/** Project details section for the project detail shell. */
export function ProjectDetailPanel({
  project,
  onChanged,
}: {
  project: Project;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [statusBusy, setStatusBusy] = useState(false);

  const openEdit = () => {
    customDialog({
      title: t('projectPanel.editTitle'),
      width: 480,
      content: (
        <ProjectFormBody mode='edit' initial={project} onSaved={onChanged} />
      ),
    });
  };

  const onToggleActive = async (nextActive: boolean) => {
    setStatusBusy(true);
    try {
      await setProjectActiveRequest(project.id, nextActive);
      showToast({
        message: t(
          nextActive
            ? 'projectPanel.statusActivateSuccess'
            : 'projectPanel.statusDeactivateSuccess',
          { name: project.name },
        ),
        severity: 'success',
      });
      onChanged();
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t('projectPanel.statusChangeFailed'),
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
          {t('projectPanel.actions.edit')}
        </Button>
      </Flex>

      <DetailRow label={t('projectPanel.fields.name')} value={project.name} />
      <DetailRow
        label={t('projectPanel.fields.projectNo')}
        value={project.projectNo}
      />
      <DetailRow
        label={t('projectPanel.fields.description')}
        value={project.description || '—'}
      />
      <DetailRow
        label={t('projectPanel.columns.status')}
        value={
          <Flex align='center' gap={8}>
            <Switch
              checked={project.active}
              loading={statusBusy}
              onChange={(checked) => {
                void onToggleActive(checked);
              }}
            />
            <Tag color={project.active ? 'success' : 'default'}>
              {project.active
                ? t('projectPanel.filterActive')
                : t('projectPanel.filterInactive')}
            </Tag>
          </Flex>
        }
      />
      <DetailRow
        label={t('projectPanel.columns.createdBy')}
        value={
          <div style={{ lineHeight: 1.35 }}>
            <div>{project.createdBy?.name || '—'}</div>
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {formatDisplayDateTime(project.createdDate)}
            </Typography.Text>
          </div>
        }
      />
      <DetailRow
        label={t('projectPanel.columns.updatedBy')}
        value={
          <div style={{ lineHeight: 1.35 }}>
            <div>{project.updatedBy?.name || '—'}</div>
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {formatDisplayDateTime(project.updatedDate)}
            </Typography.Text>
          </div>
        }
      />
    </div>
  );
}
