import { Box, CircularProgress } from '@mui/material';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import HomeLayout from './layouts/home.layout';

const HomePage = lazy(() => import('./pages/home/home'));

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
          <Route path='/' element={<HomePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;

