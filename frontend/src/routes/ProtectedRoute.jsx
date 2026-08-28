import { Navigate } from "react-router-dom";
import { getAuth } from "../auth/authStorage";

function ProtectedRoute({ allowedRole, children }) {
  const auth = getAuth();

  if (!auth) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRole && auth.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;