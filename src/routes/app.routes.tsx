import { Flex, Spin } from 'antd';
import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthRoutes } from './auth.routes';
import { HomeRoutes } from './home.routes';

function RouteFallback() {
  return (
    <Flex align='center' justify='center' style={{ minHeight: '50vh' }}>
      <Spin size='large' />
    </Flex>
  );
}

/** Top-level app route tree. */
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {AuthRoutes()}
        {HomeRoutes()}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Suspense>
  );
}
