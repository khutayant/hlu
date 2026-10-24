import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState, type MouseEvent } from 'react';
import { useDialog } from '../../../providers/dialog.provider';
import { useI18n } from '../../../providers/i18n.provider';
import {
  formatDdMmmYyyy,
  formatMyanmarCalendarDate,
  parseIsoDate,
  toDayjs,
  toIsoDate,
} from './age-for-vaccination.tool';

const PAGE_CODE = 'C001';

function AgeForVaccinationPage() {
  const { t, locale } = useI18n();
  const { openDialog } = useDialog();
  const [asOfIso, setAsOfIso] = useState(() => toIsoDate(dayjs()));
  const [asOfPickerAnchor, setAsOfPickerAnchor] = useState<HTMLElement | null>(
    null,
  );

  const asOfDate = useMemo(() => parseIsoDate(asOfIso), [asOfIso]);
  const selectedDate = asOfDate ?? dayjs();
  const minus12Date = useMemo(
    () => toDayjs(selectedDate).subtract(12, 'month').add(1, 'day'),
    [selectedDate],
  );
  const minus60Date = useMemo(
    () => toDayjs(selectedDate).subtract(60, 'month').add(1, 'day'),
    [selectedDate],
  );
  const isAsOfToday = asOfDate
    ? asOfDate.isSame(toDayjs(dayjs()), 'day')
    : false;
  const todayDisplay = formatDdMmmYyyy(selectedDate, locale);
  const minus12Display = formatDdMmmYyyy(minus12Date, locale);
  const minus60Display = formatDdMmmYyyy(minus60Date, locale);
  const isAsOfPickerOpen = Boolean(asOfPickerAnchor);

  const openAsOfPicker = (event: MouseEvent<HTMLElement>) => {
    setAsOfPickerAnchor(event.currentTarget);
  };

  const closeAsOfPicker = () => {
    setAsOfPickerAnchor(null);
  };

  const handleAsOfChange = (value: Dayjs | null) => {
    if (!value || !value.isValid()) {
      return;
    }
    setAsOfIso(toIsoDate(value));
    closeAsOfPicker();
  };

  const openSelectedMyanmarDate = () => {
    openDialog({
      title: t('ageForVaccination.myanmarEraTitle'),
      content: (
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {formatMyanmarCalendarDate(selectedDate)}
        </Typography>
      ),
      width: 360,
    });
  };

  const openMinus12MyanmarDate = () => {
    openDialog({
      title: t('ageForVaccination.myanmarEraTitle'),
      content: (
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {formatMyanmarCalendarDate(minus12Date)}
        </Typography>
      ),
      width: 360,
    });
  };

  const myanmarDateChipSx = {
    height: 'auto',
    py: 0.75,
    maxWidth: '100%',
    '& .MuiChip-label': {
      display: 'block',
      whiteSpace: 'normal',
      fontWeight: 700,
      lineHeight: 1.4,
      fontSize: '0.95rem',
    },
  } as const;

  const openMmrMyanmarDate = () => {
    const fromLabel = formatMyanmarCalendarDate(minus60Date);
    const toLabel = formatMyanmarCalendarDate(selectedDate);
    const fromChip = (
      <Chip
        label={fromLabel}
        color='primary'
        variant='outlined'
        sx={myanmarDateChipSx}
      />
    );
    const toChip = (
      <Chip
        label={toLabel}
        color='primary'
        variant='outlined'
        sx={myanmarDateChipSx}
      />
    );

    openDialog({
      title: t('ageForVaccination.myanmarEraTitle'),
      content:
        locale === 'en' ? (
          <Stack spacing={1.25}>
            <Stack
              direction='row'
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Typography component='span' sx={{ fontWeight: 600 }}>
                {t('ageForVaccination.mmrFrom')}
              </Typography>
              {fromChip}
            </Stack>
            <Stack
              direction='row'
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Typography component='span' sx={{ fontWeight: 600 }}>
                {t('ageForVaccination.mmrWithin')}
              </Typography>
              {toChip}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            <Stack
              direction='row'
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {fromChip}
              <Typography component='span' sx={{ fontWeight: 600 }}>
                {t('ageForVaccination.mmrFrom')}
              </Typography>
            </Stack>
            <Stack
              direction='row'
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {toChip}
              <Typography component='span' sx={{ fontWeight: 600 }}>
                {t('ageForVaccination.mmrWithin')}
              </Typography>
            </Stack>
          </Stack>
        ),
      width: 420,
    });
  };

  return (
    <Stack spacing={3} className='w-full max-w-xl'>
      {/* Header */}
      <Stack spacing={1}>
        {/* Code */}
        <Chip
          label={PAGE_CODE}
          size='small'
          color={PAGE_CODE.startsWith('C') ? 'success' : 'default'}
          variant='outlined'
          sx={{
            alignSelf: 'flex-start',
            height: 22,
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: 0.4,
          }}
        />
        {/* Title */}
        <Typography variant='h4' component='h2' gutterBottom>
          {t('ageForVaccination.title')}
        </Typography>
        {/* Description */}
        <Typography color='text.secondary'>
          {t('ageForVaccination.description')}
        </Typography>
      </Stack>

      {/* Today Card */}
      <Paper
        variant='outlined'
        sx={{
          p: 2.5,
          position: 'relative',
          borderColor: 'primary.light',
          bgcolor: 'background.paper',
        }}
      >
        <Chip
          label='သက္ကရာဇ်'
          size='small'
          variant='outlined'
          clickable
          onClick={openSelectedMyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            height: 24,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
        {/* Date Picker Trigger */}
        <IconButton
          color='primary'
          aria-label={t('ageForVaccination.asOfDate')}
          aria-haspopup='dialog'
          aria-expanded={isAsOfPickerOpen}
          onClick={openAsOfPicker}
          sx={{
            position: 'absolute',
            top: 40,
            right: 4,
            zIndex: 1,
          }}
        >
          <EditCalendarOutlinedIcon />
        </IconButton>
        {/* Date Picker Popover (stays inside viewport) */}
        <Popover
          open={isAsOfPickerOpen}
          anchorEl={asOfPickerAnchor}
          onClose={closeAsOfPicker}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          marginThreshold={8}
          slotProps={{
            paper: {
              sx: {
                maxWidth: 'calc(100vw - 16px)',
                overflow: 'auto',
              },
            },
          }}
        >
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale={locale === 'mm' ? 'my' : 'en'}
          >
            <DateCalendar
              value={asOfDate ?? dayjs()}
              onChange={handleAsOfChange}
              disableFuture={false}
            />
            {/* Select Today */}
            <Box
              sx={{
                px: 2,
                pb: 1.5,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button size='small' onClick={() => handleAsOfChange(dayjs())}>
                {t('ageForVaccination.todayChip')}
              </Button>
            </Box>
          </LocalizationProvider>
        </Popover>

        {/* Today Date Display */}
        <Stack spacing={0.5}>
          {/* Vaccination Date Label */}
          <Stack
            direction='row'
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography variant='overline' color='text.secondary'>
              {t('ageForVaccination.todayCardTitle')}
            </Typography>
            {isAsOfToday ? (
              <Chip
                size='small'
                color='primary'
                variant='outlined'
                label={t('ageForVaccination.todayChip')}
              />
            ) : null}
          </Stack>
          {/* Today Value */}
          <Typography variant='h5' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {todayDisplay}
          </Typography>
          {/* Today Hint */}
          <Typography variant='caption' color='text.secondary'>
            {t('ageForVaccination.todayCardHint')}
          </Typography>
        </Stack>
      </Paper>

      {/* Alert - ask true DOB */}
      <Alert severity='info'>{t('ageForVaccination.askTrueDob')}</Alert>

      {/* Card - do not give BCG vaccination */}
      <Paper
        variant='outlined'
        sx={{
          p: 2.5,
          position: 'relative',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Chip
          label='သက္ကရာဇ်'
          size='small'
          variant='outlined'
          clickable
          onClick={openMinus12MyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            height: 24,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
        <Stack spacing={1}>
          <Typography color='text.secondary'>
            {t('ageForVaccination.minus12Lead')}
          </Typography>
          <Typography
            variant='h5'
            sx={{ fontWeight: 700, lineHeight: 1.2, color: 'primary.main' }}
          >
            {minus12Display}
          </Typography>
          <Typography color='text.secondary'>
            {t('ageForVaccination.minus12Rule')}
          </Typography>
        </Stack>
      </Paper>

      {/* Card - to give MMR */}
      {/* Formula - today − 60 month + 1 day → today */}
      <Paper
        variant='outlined'
        sx={{
          p: 2.5,
          position: 'relative',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Chip
          label='သက္ကရာဇ်'
          size='small'
          variant='outlined'
          clickable
          onClick={openMmrMyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            height: 24,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
        <Stack spacing={1}>
          <Typography color='text.secondary'>
            {t('ageForVaccination.mmrLead')}
          </Typography>
          {/* EN: from [−60m+1d] until [today] | MM: [−60m+1d] မှ [today] နေ့အထိ */}
          <Typography
            component='p'
            sx={{
              m: 0,
              lineHeight: 1.6,
              color: 'text.secondary',
              '& .mmr-date': {
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'primary.main',
                whiteSpace: 'nowrap',
              },
            }}
          >
            {locale === 'en' ? (
              <>
                {t('ageForVaccination.mmrFrom')}{' '}
                <Box component='span' className='mmr-date'>
                  {minus60Display}
                </Box>{' '}
                {t('ageForVaccination.mmrWithin')}{' '}
                <Box component='span' className='mmr-date'>
                  {todayDisplay}
                </Box>
              </>
            ) : (
              <>
                <Box component='span' className='mmr-date'>
                  {minus60Display}
                </Box>{' '}
                {t('ageForVaccination.mmrFrom')}{' '}
                <Box component='span' className='mmr-date'>
                  {todayDisplay}
                </Box>{' '}
                {t('ageForVaccination.mmrWithin')}
              </>
            )}
          </Typography>
          <Typography color='text.secondary'>
            {t('ageForVaccination.mmrRule')}
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default AgeForVaccinationPage;
