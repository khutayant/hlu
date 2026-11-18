import { Navigate } from 'react-router-dom';

/** Titles live under Staff → Employees. */
function TitleMasterPage() {
  return <Navigate to='/staff/title' replace />;
}

export default TitleMasterPage;
