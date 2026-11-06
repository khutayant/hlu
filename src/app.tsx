import { Flex, Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import GuestOnly from './components/guest-only';
import RequireAuth from './components/require-auth';
import AuthLayout from './layouts/auth.layout';
import HomeLayout from './layouts/home.layout';
import { AuthProvider } from './providers/auth.provider';

const MainPage = lazy(() => import('./pages/home/main-page/main-page'));
const LoginPage = lazy(() => import('./pages/auth/login/login-page'));
const CallbackPage = lazy(
  () => import('./pages/auth/callback/callback-page'),
);

function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <Flex align='center' justify='center' style={{ minHeight: '50vh' }}>
            <Spin size='large' />
          </Flex>
        }
      >
        <Routes>
          <Route element={<GuestOnly />}>
            <Route element={<AuthLayout />}>
              <Route
                path='/auth'
                element={<Navigate to='/auth/login' replace />}
              />
              <Route path='/auth/login' element={<LoginPage />} />
              <Route path='/auth/callback' element={<CallbackPage />} />
            </Route>
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<HomeLayout />}>
              <Route path='/' element={<MainPage />} />
            </Route>
          </Route>

          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
