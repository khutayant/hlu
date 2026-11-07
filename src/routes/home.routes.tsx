import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ModuleGate from '../guards/module-gate/module-gate';
import RequireAuthGuard from '../guards/require-auth.guard';
import { ADMIN_SYSTEM_CODE } from '../providers/module.provider';
import HomeLayout from '../layouts/home.layout';

const MainPage = lazy(() => import('../pages/home/main-page/main-page'));
const TestPage = lazy(() => import('../pages/home/test-page/test-page'));
const ProfilePage = lazy(
  () => import('../pages/home/profile-page/profile-page'),
);
const UserRolePage = lazy(
  () => import('../pages/home/admin-page/user-role-page/user-role-page'),
);
const UserRoleDetailPage = lazy(
  () =>
    import(
      '../pages/home/admin-page/user-role-page/user-role-detail-page'
    ),
);

/** Authenticated home-area routes. */
export function HomeRoutes() {
  return (
    <Route element={<RequireAuthGuard />}>
      <Route element={<HomeLayout />}>
        <Route path='/' element={<MainPage />} />
        <Route path='/test' element={<TestPage />} />
        <Route
          path='/profile'
          element={<Navigate to='/profile/profile' replace />}
        />
        <Route path='/profile/:section' element={<ProfilePage />} />
        <Route element={<ModuleGate code={ADMIN_SYSTEM_CODE} />}>
          <Route
            path='/admin'
            element={<Navigate to='/admin/user-role' replace />}
          />
          <Route path='/admin/user-role' element={<UserRolePage />} />
          <Route path='/admin/user-role/:id' element={<UserRoleDetailPage />} />
          <Route
            path='/admin/user-role/:id/:section'
            element={<UserRoleDetailPage />}
          />
        </Route>
      </Route>
    </Route>
  );
}
