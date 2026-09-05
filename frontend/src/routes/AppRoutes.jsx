import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import FacultyLayout from "../layouts/FacultyLayout";
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

import StudentLayout from "../layouts/StudentLayout";
import StudentDashboard from "../pages/student/StudentDashboard";
import Profile from "../pages/student/Profile";
import StudentAttendance from "../pages/student/Attendance";
import AttendanceHistory from "../pages/student/AttendanceHistory";

function AppRoutes() {
  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/auth" replace />} />

      {/* Authentication */}
      <Route path="/auth" element={<Login />} />

      {/* ==================== ADMIN PORTAL ==================== */}

      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/students"
        element={
          <AdminLayout>
            <Students />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/faculty"
        element={
          <AdminLayout>
            <Faculty />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <AdminLayout>
            <Departments />
          </AdminLayout>
        }
      />

      <Route
        path="/admin/attendance-reports"
        element={
          <AdminLayout>
            <AttendanceReports />
          </AdminLayout>
        }
      />

      {/* ==================== FACULTY PORTAL ==================== */}

      <Route
        path="/faculty"
        element={
          <FacultyLayout>
            <FacultyDashboard />
          </FacultyLayout>
        }
      />

      <Route
        path="/faculty/classes"
        element={
          <FacultyLayout>
            <Classes />
          </FacultyLayout>
        }
      />

      <Route
        path="/faculty/students"
        element={
          <FacultyLayout>
            <FacultyStudents />
          </FacultyLayout>
        }
      />

      <Route
        path="/faculty/attendance"
        element={
          <FacultyLayout>
            <Attendance />
          </FacultyLayout>
        }
      />

      <Route
        path="/faculty/reports"
        element={
          <FacultyLayout>
            <Reports />
          </FacultyLayout>
        }
      />

      {/* ==================== STUDENT PORTAL ==================== */}

      <Route
        path="/student"
        element={
          <StudentLayout>
            <StudentDashboard />
          </StudentLayout>
        }
      />

      <Route
        path="/student/profile"
        element={
          <StudentLayout>
            <Profile />
          </StudentLayout>
        }
      />

      <Route
        path="/student/attendance"
        element={
          <StudentLayout>
            <StudentAttendance />
          </StudentLayout>
        }
      />

      <Route
        path="/student/attendance-history"
        element={
          <StudentLayout>
            <AttendanceHistory />
          </StudentLayout>
        }
      />

    </Routes>
  );
}

export default AppRoutes;