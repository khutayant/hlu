import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import { Alert, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  formatDdMmmYyyy,
  getVaccinationEligibility,
  parseIsoDate,
  toIsoDate,
} from './age-vacination.tool';

function AgeVacinationPage() {
  const [asOfIso, setAsOfIso] = useState(() => toIsoDate(dayjs()));
  const [dobIso, setDobIso] = useState('');

  const asOfDate = useMemo(() => parseIsoDate(asOfIso), [asOfIso]);
  const dobDate = useMemo(() => parseIsoDate(dobIso), [dobIso]);

  const eligibility = useMemo(() => {
    if (!asOfDate || !dobDate) {
      return null;
    }
    return getVaccinationEligibility(dobDate, asOfDate);
  }, [asOfDate, dobDate]);

  return (
    <Stack spacing={3} className='w-full max-w-xl'>
      <Stack spacing={1}>
        <Typography variant='h4' component='h2' gutterBottom>
          Age vaccination
        </Typography>
        <Typography color='text.secondary'>
          Check BCG and vaccination eligibility from date of birth against
          today (or another as-of date).
        </Typography>
      </Stack>

      <TextField
        label='As-of date'
        type='date'
        value={asOfIso}
        onChange={(event) => setAsOfIso(event.target.value)}
        helperText={
          asOfDate
            ? `Shown as ${formatDdMmmYyyy(asOfDate)} (default: today)`
            : 'Invalid date'
        }
        fullWidth
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        label='Date of birth'
        type='date'
        value={dobIso}
        onChange={(event) => setDobIso(event.target.value)}
        helperText={
          dobDate
            ? formatDdMmmYyyy(dobDate)
            : 'Enter DOB to evaluate eligibility'
        }
        fullWidth
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: {
            max: asOfIso || undefined,
          },
        }}
      />

      {eligibility && asOfDate ? (
        <Stack spacing={1.5}>
          <Alert
            severity={eligibility.allowVaccination ? 'success' : 'error'}
            icon={<VaccinesOutlinedIcon />}
          >
            {eligibility.summary}
          </Alert>
          <Typography variant='body2' color='text.secondary'>
            Cutoffs as of {formatDdMmmYyyy(asOfDate)}: no BCG on/before{' '}
            {formatDdMmmYyyy(eligibility.noBcgCutoff)}; no vaccination
            on/before {formatDdMmmYyyy(eligibility.noVaccineCutoff)}.
          </Typography>
          <Typography variant='body2'>
            BCG: {eligibility.allowBcg ? 'allowed' : 'not allowed'}
          </Typography>
          <Typography variant='body2'>
            Vaccination:{' '}
            {eligibility.allowVaccination ? 'allowed' : 'not allowed'}
          </Typography>
        </Stack>
      ) : null}
    </Stack>
  );
}

export default AgeVacinationPage;
