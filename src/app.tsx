import { Box, CircularProgress } from '@mui/material';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomeLayout from './layouts/home.layout';

const AgeForVaccinationPage = lazy(
  () => import('./pages/home/age-for-vaccination/age-for-vaccination'),
);

function App() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'grid', minHeight: '50vh', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
        <Route element={<HomeLayout />}>
          <Route path='/' element={<AgeForVaccinationPage />} />
          <Route
            path='/age-for-vaccination'
            element={<Navigate to='/' replace />}
          />
          <Route
            path='/age-vacination'
            element={<Navigate to='/' replace />}
          />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
