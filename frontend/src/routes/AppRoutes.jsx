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
      {/* ==================== DEFAULT ROUTE ==================== */}

      <Route path="/" element={<Navigate to="/auth" replace />} />

      {/* ==================== AUTHENTICATION ==================== */}

      <Route path="/auth" element={<Login />} />

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ==================== ADMIN PORTAL ==================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <Students />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <Faculty />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <Departments />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/attendance-reports"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout>
              <AttendanceReports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== FACULTY PORTAL ==================== */}

      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyLayout>
              <FacultyDashboard />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/classes"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyLayout>
              <Classes />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/students"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyLayout>
              <FacultyStudents />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/attendance"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyLayout>
              <Attendance />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/reports"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyLayout>
              <Reports />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== STUDENT PORTAL ==================== */}

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentDashboard />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <Profile />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <StudentAttendance />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/attendance-history"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout>
              <AttendanceHistory />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;