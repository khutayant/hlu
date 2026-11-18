import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import ModuleGate from '../guards/module-gate/module-gate';
import RequireAuthGuard from '../guards/require-auth.guard';
import {
  ADMIN_SYSTEM_CODE,
  EMPLOYEE_MANAGEMENT_SYSTEM_CODE,
} from '../providers/module.provider';
import HomeLayout from '../layouts/home.layout';

const MainPage = lazy(() => import('../pages/home/main-page/main-page'));
const TestPage = lazy(() => import('../pages/home/test-page/test-page'));
const ProfilePage = lazy(
  () => import('../pages/home/profile-page/profile-page'),
);
const UserPage = lazy(
  () => import('../pages/home/admin-page/user-page/user-page'),
);
const EmployeeOverviewPage = lazy(
  () =>
    import('../pages/home/staff-page/employee-page/employee-overview-page'),
);
const EmployeePage = lazy(
  () => import('../pages/home/staff-page/employee-page/employee-page'),
);
const EmployeeImportPage = lazy(
  () =>
    import('../pages/home/staff-page/employee-page/employee-import-page'),
);
const EmployeeTitlesPage = lazy(
  () =>
    import('../pages/home/staff-page/employee-page/employee-titles-page'),
);
const EmployeePositionsPage = lazy(
  () =>
    import('../pages/home/staff-page/employee-page/employee-positions-page'),
);
const EmployeeProfilePage = lazy(
  () =>
    import('../pages/home/staff-page/employee-page/employee-profile-page'),
);
const UserRolePage = lazy(
  () => import('../pages/home/admin-page/user-role-page/user-role-page'),
);
const LocationMasterPage = lazy(
  () => import('../pages/home/masters-page/location-master-page'),
);
const CategoryMasterPage = lazy(
  () => import('../pages/home/masters-page/category-master-page'),
);
const TitleMasterPage = lazy(
  () => import('../pages/home/masters-page/title-master-page'),
);
const PositionMasterPage = lazy(
  () => import('../pages/home/masters-page/position-master-page'),
);
const ProjectMasterPage = lazy(
  () => import('../pages/home/masters-page/project-master-page'),
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
            element={<Navigate to='/admin/user' replace />}
          />
          <Route path='/admin/user' element={<UserPage />} />
          <Route path='/admin/user-role' element={<UserRolePage />} />
          <Route path='/admin/user-role/:id' element={<UserRoleDetailPage />} />
          <Route
            path='/admin/user-role/:id/:section'
            element={<UserRoleDetailPage />}
          />
        </Route>
        <Route
          path='/admin/employee'
          element={<Navigate to='/staff/employee' replace />}
        />
        <Route element={<ModuleGate code={EMPLOYEE_MANAGEMENT_SYSTEM_CODE} />}>
          <Route
            path='/staff'
            element={<Navigate to='/staff/overview' replace />}
          />
          <Route path='/staff/overview' element={<EmployeeOverviewPage />} />
          <Route path='/staff/title' element={<EmployeeTitlesPage />} />
          <Route
            path='/staff/employee/titles'
            element={<Navigate to='/staff/title' replace />}
          />
          <Route path='/staff/position' element={<EmployeePositionsPage />} />
          <Route path='/staff/employee' element={<EmployeePage />} />
          <Route
            path='/staff/employee/import'
            element={<EmployeeImportPage />}
          />
          <Route
            path='/staff/employee/:id'
            element={<EmployeeProfilePage />}
          />
        </Route>
        <Route
          path='/masters'
          element={<Navigate to='/masters/location' replace />}
        />
        <Route
          path='/masters/location'
          element={<Navigate to='/masters/location/country' replace />}
        />
        <Route
          path='/masters/location/:section'
          element={<LocationMasterPage />}
        />
        <Route
          path='/masters/country'
          element={<Navigate to='/masters/location/country' replace />}
        />
        <Route
          path='/masters/township'
          element={<Navigate to='/masters/location/township' replace />}
        />
        <Route path='/masters/category' element={<CategoryMasterPage />} />
        <Route path='/masters/title' element={<TitleMasterPage />} />
        <Route path='/masters/position' element={<PositionMasterPage />} />
        <Route
          path='/masters/project'
          element={<Navigate to='/masters/project/projects' replace />}
        />
        <Route
          path='/masters/project/:section'
          element={<ProjectMasterPage />}
        />
      </Route>
    </Route>
  );
}
