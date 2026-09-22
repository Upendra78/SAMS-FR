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
import AcademicManagement from "../pages/admin/AcademicManagement";
import AttendanceReports from "../pages/admin/AttendanceReports";

import FacultyDashboard from "../pages/faculty/FacultyDashboard";
import Classes from "../pages/faculty/Classes";
import FacultyStudents from "../pages/faculty/Students";
import Attendance from "../pages/faculty/Attendance";
import Reports from "../pages/faculty/Reports";
import FacultyProfile from "../pages/faculty/Profile";
import FacultySettings from "../pages/faculty/Settings";

import StudentDashboard from "../pages/student/StudentDashboard";
import Profile from "../pages/student/Profile";
import StudentAttendance from "../pages/student/Attendance";
import AttendanceHistory from "../pages/student/AttendanceHistory";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminSettings from "../pages/admin/AdminSettings";
import Courses from "../pages/student/Courses";
import Schedule from "../pages/student/Schedule";
import StudentReports from "../pages/student/Reports";
import StudentSettings from "../pages/student/Settings";

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
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/admin/dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="students"
          element={<Students />}
        />

        <Route
          path="faculty"
          element={<Faculty />}
        />

        <Route
          path="departments"
          element={<Departments />}
        />

        <Route
          path="academic-management"
          element={<AcademicManagement />}
        />

        <Route
          path="attendance-reports"
          element={<AttendanceReports />}
        />

        {/* ADMIN ACCOUNT */}
        <Route
          path="profile"
          element={<AdminProfile />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />
      </Route>

      {/* ==================== FACULTY PORTAL ==================== */}

      <Route
        path="/faculty"
        element={
          <Navigate to="/faculty/dashboard" replace />
        }
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

      <Route
        path="/faculty/profile"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <FacultyProfile />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/settings"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout>
              <FacultySettings />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== STUDENT PORTAL ==================== */}

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/student/dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="attendance"
          element={<StudentAttendance />}
        />

        <Route
          path="attendance-history"
          element={<AttendanceHistory />}
        />

        <Route
          path="courses"
          element={<Courses />}
        />

        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="schedule"
          element={<Schedule />}
        />

        <Route path="reports" element={<StudentReports />} />
        <Route path="settings" element={<StudentSettings />} />

      </Route>

      {/* ==================== UNKNOWN ROUTES ==================== */}

      <Route
        path="*"
        element={<Navigate to="/auth" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;