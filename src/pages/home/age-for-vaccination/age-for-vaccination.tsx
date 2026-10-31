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
import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import feedingChildIcon from '../../../assets/svgs/feeding-child.svg';
import infantIcon from '../../../assets/svgs/infant.svg';
import noVaccinationIcon from '../../../assets/svgs/no-vaccination.svg';
import vaccinationIcon from '../../../assets/svgs/vaccination.svg';
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

const CARD_ICON_SX = { width: 44, height: 44, flexShrink: 0 } as const;

const cardPaperSx = {
  p: 2.5,
  position: 'relative',
  bgcolor: 'background.paper',
} as const;

const myanmarEraChipSx = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  height: 24,
  fontWeight: 600,
  fontSize: '0.75rem',
} as const;

const dateValueSx = {
  fontWeight: 700,
  fontSize: '1.25rem',
  lineHeight: 1.2,
} as const;

const cutoffDateValueSx = {
  ...dateValueSx,
  color: 'primary.main',
} as const;

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

/** Lead line stays above; icon top-left spans the two content lines. */
function CardIconBody({
  iconSrc,
  children,
}: {
  iconSrc: string;
  children: ReactNode;
}) {
  return (
    <Stack direction='row' spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box
        component='img'
        src={iconSrc}
        alt=''
        aria-hidden
        sx={CARD_ICON_SX}
      />
      <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
        {children}
      </Stack>
    </Stack>
  );
}

function MyanmarEraChip({
  onClick,
  'aria-label': ariaLabel,
}: {
  onClick: () => void;
  'aria-label': string;
}) {
  return (
    <Chip
      label='သက္ကရာဇ်'
      size='small'
      variant='outlined'
      clickable
      onClick={onClick}
      aria-label={ariaLabel}
      sx={myanmarEraChipSx}
    />
  );
}

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
  const minus9Date = useMemo(
    () => toDayjs(selectedDate).subtract(9, 'month'),
    [selectedDate],
  );
  const isAsOfToday = asOfDate
    ? asOfDate.isSame(toDayjs(dayjs()), 'day')
    : false;
  const todayDisplay = formatDdMmmYyyy(selectedDate, locale);
  const minus12Display = formatDdMmmYyyy(minus12Date, locale);
  const minus60Display = formatDdMmmYyyy(minus60Date, locale);
  const minus9Display = formatDdMmmYyyy(minus9Date, locale);
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

  const openMinus60MyanmarDate = () => {
    openDialog({
      title: t('ageForVaccination.myanmarEraTitle'),
      content: (
        <Typography variant='h6' sx={{ fontWeight: 700 }}>
          {formatMyanmarCalendarDate(minus60Date)}
        </Typography>
      ),
      width: 360,
    });
  };

  const openMmrMyanmarDate = () => {
    const fromLabel = formatMyanmarCalendarDate(minus60Date);
    const toLabel = formatMyanmarCalendarDate(minus9Date);
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
        sx={{ ...cardPaperSx, borderColor: 'primary.light' }}
      >
        <MyanmarEraChip
          onClick={openSelectedMyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
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
              // Keep MM month/year; English weekday headers (Mon, Tue, …)
              dayOfWeekFormatter={(date) => date.locale('en').format('ddd')}
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
          <CardIconBody iconSrc={vaccinationIcon}>
            <Typography sx={dateValueSx}>{todayDisplay}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {t('ageForVaccination.todayCardHint')}
            </Typography>
          </CardIconBody>
        </Stack>
      </Paper>

      {/* Alert - ask true DOB */}
      <Alert severity='info'>{t('ageForVaccination.askTrueDob')}</Alert>

      {/* Card - no vaccination (today − 60 month + 1 day) */}
      <Paper
        variant='outlined'
        sx={{ ...cardPaperSx, borderColor: 'divider' }}
      >
        <MyanmarEraChip
          onClick={openMinus60MyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
        />
        <Stack spacing={1}>
          <Typography color='text.secondary'>
            {t('ageForVaccination.minus60Lead')}
          </Typography>
          <CardIconBody iconSrc={noVaccinationIcon}>
            <Typography sx={cutoffDateValueSx}>{minus60Display}</Typography>
            <Typography color='text.secondary'>
              {t('ageForVaccination.minus60Rule')}
            </Typography>
          </CardIconBody>
          <Alert severity='warning'>
            {t('ageForVaccination.minus60Warning')}
          </Alert>
        </Stack>
      </Paper>

      {/* Card - do not give BCG vaccination */}
      <Paper
        variant='outlined'
        sx={{ ...cardPaperSx, borderColor: 'divider' }}
      >
        <MyanmarEraChip
          onClick={openMinus12MyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
        />
        <Stack spacing={1}>
          <Typography color='text.secondary'>
            {t('ageForVaccination.minus12Lead')}
          </Typography>
          <CardIconBody iconSrc={infantIcon}>
            <Typography sx={cutoffDateValueSx}>{minus12Display}</Typography>
            <Typography color='text.secondary'>
              {t('ageForVaccination.minus12Rule')}
            </Typography>
          </CardIconBody>
        </Stack>
      </Paper>

      {/* Card - to give MMR */}
      {/* Formula - today − 60 month + 1 day → today − 9 month */}
      <Paper
        variant='outlined'
        sx={{ ...cardPaperSx, borderColor: 'divider' }}
      >
        <MyanmarEraChip
          onClick={openMmrMyanmarDate}
          aria-label={t('ageForVaccination.showMyanmarDate')}
        />
        <Stack spacing={1}>
          <Typography color='text.secondary'>
            {t('ageForVaccination.mmrLead')}
          </Typography>
          {/* EN: from [−60m+1d] until [−9m] | MM: [−60m+1d] မှ [−9m] နေ့အထိ */}
          <CardIconBody iconSrc={feedingChildIcon}>
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
                    {minus9Display}
                  </Box>
                </>
              ) : (
                <>
                  <Box component='span' className='mmr-date'>
                    {/* MMR Start Date */}
                    {minus60Display}
                  </Box>{' '}
                  {t('ageForVaccination.mmrFrom')}{' '}
                  <Box component='span' className='mmr-date'>
                    {/* MMR End Date */}
                    {minus9Display}
                  </Box>{' '}
                  {t('ageForVaccination.mmrWithin')}
                </>
              )}
            </Typography>
            <Typography color='text.secondary'>
              {t('ageForVaccination.mmrRule')}
            </Typography>
          </CardIconBody>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default AgeForVaccinationPage;
