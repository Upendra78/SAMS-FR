
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import Unauthorized from "../pages/Unauthorized";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyOtp from "../pages/auth/VerifyOtp";

import AdminLayout from "../layouts/AdminLayout";
import FacultyLayout from "../layouts/FacultyLayout";
import StudentLayout from "../layouts/StudentLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Students from "../pages/admin/Students";
import Faculty from "../pages/admin/Faculty";
import Departments from "../pages/admin/Departments";
import AcademicManagement from "../pages/admin/AcademicManagement";
import AttendanceReports from "../pages/admin/AttendanceReports";
import AdminManagement from "../pages/admin/AdminManagement";
import BatchManagement from "../pages/admin/BatchManagement";
import TimetableManagement from "../pages/admin/TimetableManagement";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminSettings from "../pages/admin/AdminSettings";

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
import Courses from "../pages/student/Courses";
import Schedule from "../pages/student/Schedule";
import StudentReports from "../pages/student/Reports";
import StudentSettings from "../pages/student/Settings";

function AppRoutes() {
  return (
    <Routes>
      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/auth" replace />}
      />

      {/* Authentication */}
      <Route path="/auth" element={<Login />} />

      <Route
        path="/auth/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/auth/verify-otp"
        element={<VerifyOtp />}
      />

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* Admin portal */}
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

        {/* User management */}
        <Route
          path="management"
          element={<AdminManagement />}
        />

        <Route
          path="students"
          element={<Students />}
        />

        <Route
          path="faculty"
          element={<Faculty />}
        />

        {/* Departments */}
        <Route
          path="departments"
          element={<Departments />}
        />

        {/* Academic management */}
        <Route
          path="academic-management"
          element={
            <Navigate
              to="/admin/academic-management/courses"
              replace
            />
          }
        />

        <Route
          path="academic-management/courses"
          element={<AcademicManagement />}
        />

        <Route
          path="academic-management/course-offerings"
          element={<AcademicManagement />}
        />

        <Route
          path="academic-management/course-enrollments"
          element={<AcademicManagement />}
        />

        <Route
          path="academic-management/assignments"
          element={<AcademicManagement />}
        />

        {/* Keep the original batch URL working */}
        <Route
          path="academic-management/batches"
          element={
            <Navigate to="/admin/batches" replace />
          }
        />

        {/* Batches: matches the sidebar URL */}
        <Route
          path="batches"
          element={<BatchManagement />}
        />

        {/* Timetable management */}
        <Route
          path="timetable"
          element={<TimetableManagement />}
        />
        <Route
          path="timetable/faculty-adjustment"
          element={<TimetableManagement />}
        />

        {/* Attendance reports */}
        <Route
          path="attendance-reports"
          element={<AttendanceReports />}
        />
        <Route
          path="attendance"
          element={<AttendanceReports />}
        />

        {/* Admin account */}
        <Route
          path="profile"
          element={<AdminProfile />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />
      </Route>

      {/* Faculty portal */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRole="FACULTY">
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/faculty/dashboard" replace />}
        />

        <Route
          path="dashboard"
          element={<FacultyDashboard />}
        />

        <Route
          path="classes"
          element={<Classes />}
        />

        <Route
          path="students"
          element={<FacultyStudents />}
        />

        <Route
          path="attendance"
          element={<Attendance />}
        />

        <Route
          path="reports"
          element={<Reports />}
        />

        <Route
          path="profile"
          element={<FacultyProfile />}
        />

        <Route
          path="settings"
          element={<FacultySettings />}
        />
      </Route>

      {/* Student portal */}
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

        <Route
          path="reports"
          element={<StudentReports />}
        />

        <Route
          path="settings"
          element={<StudentSettings />}
        />
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/auth" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;
