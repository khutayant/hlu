import {
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Space,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  createUserRoleRequest,
  listUserRolesRequest,
  updateUserRoleRequest,
  type UserRole,
  type UserRoleActor,
} from '../../../../handlers/user-role.handler';
import { useDialog } from '../../../../providers/dialog.provider';
import { useI18n } from '../../../../providers/i18n.provider';
import {
  RibbonTitle,
  useSetRibbon,
} from '../../../../providers/ribbon.provider';
import { useToast } from '../../../../providers/toast.provider';

const DEFAULT_PAGE_SIZE = 20;
const ACTOR_DATE_FORMAT = 'DD-MMM-YYYY hh:mm:ss A';

type UserRoleFormValues = {
  name: string;
  code: string;
  description?: string;
};

function formatActorDate(value: string) {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(ACTOR_DATE_FORMAT) : value;
}

function renderActorCell(
  actor: UserRoleActor | null | undefined,
  date: string,
): ReactNode {
  return (
    <div style={{ lineHeight: 1.35 }}>
      <Typography.Text style={{ display: 'block', fontSize: 13 }}>
        {actor?.name || '—'}
      </Typography.Text>
      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
        {formatActorDate(date)}
      </Typography.Text>
    </div>
  );
}

function suggestCodeFromName(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

function UserRoleFormDialogBody({
  mode,
  initial,
  onSaved,
}: {
  mode: 'create' | 'edit';
  initial?: Pick<UserRole, 'id' | 'name' | 'code' | 'description'>;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { closeDialog, setDialogActions } = useDialog();
  const [form] = Form.useForm<UserRoleFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initial) {
      form.setFieldsValue({
        name: initial.name,
        code: initial.code,
        description: initial.description ?? undefined,
      });
    }
  }, [form, initial, mode]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (mode === 'edit' && initial) {
        await updateUserRoleRequest(initial.id, {
          name: values.name.trim(),
          description: values.description?.trim() || null,
        });
        closeDialog();
        showToast({
          message: t('userRolePage.editSuccess'),
          severity: 'success',
        });
      } else {
        await createUserRoleRequest({
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          description: values.description?.trim() || null,
        });
        closeDialog();
        showToast({
          message: t('userRolePage.createSuccess'),
          severity: 'success',
        });
      }

      onSaved();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      showToast({
        message:
          error instanceof Error
            ? error.message
            : t(
                mode === 'edit'
                  ? 'userRolePage.editFailed'
                  : 'userRolePage.createFailed',
              ),
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    setDialogActions(
      <Flex justify='flex-end' gap={8}>
        <Button disabled={saving} onClick={closeDialog}>
          {t('common.cancel')}
        </Button>
        <Button
          type='primary'
          loading={saving}
          onClick={() => void onSubmitRef.current()}
        >
          {t(
            mode === 'edit'
              ? 'userRolePage.editSubmit'
              : 'userRolePage.createSubmit',
          )}
        </Button>
      </Flex>,
    );
  }, [closeDialog, mode, saving, setDialogActions, t]);

  return (
    <Form
      form={form}
      layout='vertical'
      requiredMark
      style={{ marginTop: 4, width: '100%' }}
      onValuesChange={(changed) => {
        if (
          mode === 'create' &&
          'name' in changed &&
          typeof changed.name === 'string' &&
          !form.isFieldTouched('code')
        ) {
          form.setFieldValue('code', suggestCodeFromName(changed.name));
        }
      }}
    >
      <Form.Item
        name='name'
        label={t('userRolePage.fields.name')}
        rules={[
          {
            required: true,
            message: t('userRolePage.validation.nameRequired'),
          },
        ]}
      >
        <Input maxLength={125} autoFocus />
      </Form.Item>
      <Form.Item
        name='code'
        label={t('userRolePage.fields.code')}
        rules={
          mode === 'create'
            ? [
                {
                  required: true,
                  message: t('userRolePage.validation.codeRequired'),
                },
                {
                  pattern: /^[A-Z0-9_]+$/i,
                  message: t('userRolePage.validation.codePattern'),
                },
              ]
            : undefined
        }
        normalize={(value: string) => value?.toUpperCase?.() ?? value}
      >
        <Input maxLength={64} disabled={mode === 'edit'} />
      </Form.Item>
      <Form.Item
        name='description'
        label={
          <span>
            {t('userRolePage.fields.description')}{' '}
            <Typography.Text type='secondary'>
              ({t('common.optional')})
            </Typography.Text>
          </span>
        }
      >
        <Input.TextArea rows={3} maxLength={256} />
      </Form.Item>
    </Form>
  );
}

function UserRolePage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { customDialog } = useDialog();
  const [items, setItems] = useState<UserRole[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');

  const title = t('userRolePage.title');
  const description = t('userRolePage.description');

  useSetRibbon(
    <RibbonTitle title={title} description={description} />,
    [title, description],
  );

  const reloadList = () => {
    setReloadKey((key) => key + 1);
  };

  const onSearch = (value: string) => {
    setQ(value.trim());
    setPage(1);
  };

  const openCreate = () => {
    customDialog({
      title: t('userRolePage.createTitle'),
      width: 480,
      actions: null,
      content: (
        <UserRoleFormDialogBody
          mode='create'
          onSaved={() => {
            setPage(1);
            reloadList();
          }}
        />
      ),
    });
  };

  const openEdit = (role: UserRole) => {
    customDialog({
      title: t('userRolePage.editTitle'),
      width: 480,
      actions: null,
      content: (
        <UserRoleFormDialogBody
          mode='edit'
          initial={role}
          onSaved={reloadList}
        />
      ),
    });
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const result = await listUserRolesRequest({
          q: q || undefined,
          page,
          limit: pageSize,
        });
        if (cancelled) {
          return;
        }
        setItems(result.items);
        setTotal(result.total);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setItems([]);
        setTotal(0);
        showToast({
          message:
            error instanceof Error
              ? error.message
              : t('userRolePage.loadFailed'),
          severity: 'error',
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, q, reloadKey, showToast, t]);

  const columns: ColumnsType<UserRole> = [
    {
      title: t('userRolePage.columns.name'),
      key: 'name',
      render: (_: unknown, row: UserRole) => (
        <div style={{ lineHeight: 1.35 }}>
          <Link
            to={`/admin/user-role/${row.id}`}
            style={{
              fontSize: 13,
              color: '#1677ff',
              fontWeight: 500,
            }}
          >
            {row.name}
          </Link>
          <Typography.Text
            type='secondary'
            style={{ display: 'block', fontSize: 12 }}
          >
            {row.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: t('userRolePage.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('userRolePage.columns.createdBy'),
      key: 'createdBy',
      width: 200,
      render: (_: unknown, row: UserRole) =>
        renderActorCell(row.createdBy, row.createdDate),
    },
    {
      title: t('userRolePage.columns.updatedBy'),
      key: 'updatedBy',
      width: 200,
      render: (_: unknown, row: UserRole) =>
        renderActorCell(row.updatedBy, row.updatedDate),
    },
    {
      title: t('userRolePage.columns.actions'),
      key: 'actions',
      width: 72,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, row: UserRole) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: t('userRolePage.actions.edit'),
                onClick: () => openEdit(row),
              },
            ],
          }}
        >
          <Button
            type='text'
            size='small'
            icon={<MoreOutlined />}
            aria-label={t('userRolePage.actions.menu')}
          />
        </Dropdown>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? DEFAULT_PAGE_SIZE);
  };

  return (
    <Space direction='vertical' size={12} style={{ width: '100%' }}>
      <Flex wrap gap={8} justify='space-between' align='center'>
        <Input.Search
          allowClear
          size='middle'
          value={searchInput}
          placeholder={t('userRolePage.searchPlaceholder')}
          prefix={<SearchOutlined />}
          onChange={(event) => setSearchInput(event.target.value)}
          onSearch={onSearch}
          style={{ width: 280, maxWidth: '100%' }}
        />
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
          {t('userRolePage.addNew')}
        </Button>
      </Flex>

      <Table<UserRole>
        rowKey='id'
        size='small'
        loading={loading}
        columns={columns}
        dataSource={items}
        onChange={onTableChange}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          hideOnSinglePage: false,
          pageSizeOptions: ['10', '20', '50', '100'],
          position: ['bottomRight'],
          showTotal: (count) => t('userRolePage.total', { count }),
        }}
        locale={{
          emptyText: (
            <Empty
              image={
                <TeamOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
              }
              styles={{ image: { height: 64 } }}
              description={t('userRolePage.empty')}
            />
          ),
        }}
        scroll={{ x: true }}
      />
    </Space>
  );
}

export default UserRolePage;
