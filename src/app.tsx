import { Box, CircularProgress } from '@mui/material';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomeLayout from './layouts/home.layout';

const AgeVacinationPage = lazy(
  () => import('./pages/home/age-vacination/age-vacination'),
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
          <Route path='/' element={<AgeVacinationPage />} />
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
