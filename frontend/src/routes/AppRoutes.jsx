import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import FacultyLayout from "../layouts/FacultyLayout";
import StudentLayout from "../layouts/StudentLayout";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />

      <Route path="/auth" element={<div>Authentication</div>} />

      <Route
        path="/admin"
        element={
          <AdminLayout>
            <div>Admin Dashboard</div>
          </AdminLayout>
        }
      />

      <Route
        path="/faculty"
        element={
          <FacultyLayout>
            <div>Faculty Dashboard</div>
          </FacultyLayout>
        }
      />

      <Route
        path="/student"
        element={
          <StudentLayout>
            <div>Student Dashboard</div>
          </StudentLayout>
        }
      />
    </Routes>
  );
}

export default AppRoutes;