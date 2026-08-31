import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import Unauthorized from "../pages/Unauthorized";

import AdminLayout from "../layouts/AdminLayout";
import FacultyLayout from "../layouts/FacultyLayout";
import StudentLayout from "../layouts/StudentLayout";

import Login from "../pages/auth/Login";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Students from "../pages/admin/Students";
import Faculty from "../pages/admin/Faculty";
import Departments from "../pages/admin/Departments";
import AttendanceReports from "../pages/admin/AttendanceReports";

import FacultyDashboard from "../pages/faculty/FacultyDashboard";
import Classes from "../pages/faculty/Classes";
import FacultyStudents from "../pages/faculty/Students";
import Attendance from "../pages/faculty/Attendance";
import Reports from "../pages/faculty/Reports";

import StudentDashboard from "../pages/student/StudentDashboard";
import Profile from "../pages/student/Profile";
import StudentAttendance from "../pages/student/Attendance";
import AttendanceHistory from "../pages/student/AttendanceHistory";

function AppRoutes() {
  return (
    <Routes>
      {/* ==================== DEFAULT ==================== */}

      <Route path="/" element={<Navigate to="/auth" replace />} />

      {/* ==================== AUTHENTICATION ==================== */}

      <Route path="/auth" element={<Login />} />

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ==================== ADMIN PORTAL ==================== */}

      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Students />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Faculty />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <Departments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/attendance-reports"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout>
              <AttendanceReports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== FACULTY PORTAL ==================== */}

      <Route
        path="/faculty"
        element={<Navigate to="/faculty/dashboard" replace />}
      />

      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <FacultyDashboard />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/classes"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <Classes />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/students"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <FacultyStudents />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/attendance"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <Attendance />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/reports"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <Reports />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== STUDENT PORTAL ==================== */}

      <Route
        path="/student"
        element={<Navigate to="/student/dashboard" replace />}
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout>
              <StudentDashboard />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout>
              <Profile />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout>
              <StudentAttendance />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/attendance-history"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout>
              <AttendanceHistory />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== UNKNOWN ROUTES ==================== */}

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default AppRoutes;