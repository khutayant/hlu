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
import { useI18n } from '../../../providers/i18n.provider';
import {
  formatDdMmmYyyy,
  parseIsoDate,
  toDayjs,
  toIsoDate,
} from './age-for-vaccination.tool';

const PAGE_CODE = 'C001';

function AgeForVaccinationPage() {
  const { t, locale } = useI18n();
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
    () => toDayjs(selectedDate).subtract(60, 'month'),
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
          borderColor: 'primary.light',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
          {/* Beautify Icon */}
          {/* <Box
            sx={{
              width: 56,
              height: 56,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              bgcolor: 'transparent',
              border: 1,
              borderColor: 'primary.main',
              borderRadius: 1,
              flexShrink: 0,
            }}
          >
          </Box> */}

          {/* Today Date Display */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
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
          </Box>

          {/* Date Picker Trigger */}
          <IconButton
            color='primary'
            aria-label={t('ageForVaccination.asOfDate')}
            aria-haspopup='dialog'
            aria-expanded={isAsOfPickerOpen}
            onClick={openAsOfPicker}
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
        </Stack>
      </Paper>

      {/* Alert - ask true DOB */}
      <Alert severity='info'>{t('ageForVaccination.askTrueDob')}</Alert>

      {/* Card - do not give BCG vaccination */}
      <Paper
        variant='outlined'
        sx={{
          p: 2.5,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
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
      {/* Formula - today - 60 month */}
      <Paper
        variant='outlined'
        sx={{
          p: 2.5,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={1}>
          <Typography color='text.secondary'>
            {t('ageForVaccination.mmrLead')}
          </Typography>
          {/* [date1] မှ [date2] အတွင်း */}
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
            <Box component='span' className='mmr-date'>
              {minus60Display}
            </Box>{' '}
            {t('ageForVaccination.mmrFrom')}{' '}
            <Box component='span' className='mmr-date'>
              {todayDisplay}
            </Box>
            {t('ageForVaccination.mmrWithin')
              ? ` ${t('ageForVaccination.mmrWithin')}`
              : null}
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
