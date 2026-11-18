import { Navigate } from 'react-router-dom';

/** Positions live under Staff. */
function PositionMasterPage() {
  return <Navigate to='/staff/position' replace />;
}

export default PositionMasterPage;
