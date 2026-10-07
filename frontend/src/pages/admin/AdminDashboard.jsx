import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAdminDashboard } from "../../services/adminService";

import "./AdminDashboard.css";

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const result = await getAdminDashboard();

        if (!result?.success) {
          throw new Error(
            result?.message || "Failed to load admin dashboard."
          );
        }

        if (!isMounted) {
          return;
        }

        setDashboardData(result.data || null);
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboardData(null);
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatMetric = (value) => {
    return value === null || value === undefined ? "N/A" : value;
  };

  const totalStudents = dashboardData?.total_students;
  const totalFaculty = dashboardData?.total_faculty;
  const totalCourses = dashboardData?.total_courses;

  const attendanceSummary = dashboardData?.attendance_summary;

  const totalAttendanceRecords = attendanceSummary?.total_records;
  const presentAttendance = attendanceSummary?.present;
  const absentAttendance = attendanceSummary?.absent;

  const hasAttendanceData =
    attendanceSummary &&
    typeof totalAttendanceRecords === "number" &&
    totalAttendanceRecords > 0;

  const attendancePercentage = hasAttendanceData
    ? Math.round(
        (presentAttendance / totalAttendanceRecords) * 100
      )
    : null;

  const hasTrendData = false;
  const hasRecentActivity = false;

  if (loading) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard-loading">
          <div className="admin-loading-icon">
            <i className="fa-solid fa-spinner fa-spin" />
          </div>

          <h2>Loading dashboard</h2>

          <p>
            Fetching the latest administration statistics from the
            backend.
          </p>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="admin-dashboard">
        <div className="admin-dashboard-error">
          <div className="admin-error-icon">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>

          <h2>Unable to load dashboard</h2>

          <p>{errorMessage}</p>

          <span>API integration is currently unavailable.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      {/* =========================
          HEADER
      ========================== */}

      <header className="admin-dashboard-header">
        <div className="admin-dashboard-heading">
          <div className="admin-dashboard-heading-top">
            <span className="admin-dashboard-eyebrow">
              Administration
            </span>
          </div>

          <h1>Welcome back, Admin!</h1>

          <p>
            Monitor students, faculty, courses, and attendance from one
            centralized dashboard.
          </p>
        </div>
      </header>

      {/* =========================
          PRIMARY STATISTICS
      ========================== */}

      <div className="admin-stat-grid">
        <Link
          to="/admin/students"
          className="admin-stat-card admin-stat-blue"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">
              <i className="fa-solid fa-user-graduate" />
            </div>

            <i className="fa-solid fa-arrow-up-right-from-square admin-stat-arrow" />
          </div>

          <span className="admin-stat-label">Total Students</span>

          <strong
            className={`admin-stat-value ${
              totalStudents === null ||
              totalStudents === undefined
                ? "is-empty"
                : ""
            }`}
          >
            {formatMetric(totalStudents)}
          </strong>

          <span className="admin-stat-description">
            Registered students
          </span>
        </Link>

        <Link
          to="/admin/faculty"
          className="admin-stat-card admin-stat-purple"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">
              <i className="fa-solid fa-chalkboard-user" />
            </div>

            <i className="fa-solid fa-arrow-up-right-from-square admin-stat-arrow" />
          </div>

          <span className="admin-stat-label">Total Faculty</span>

          <strong
            className={`admin-stat-value ${
              totalFaculty === null ||
              totalFaculty === undefined
                ? "is-empty"
                : ""
            }`}
          >
            {formatMetric(totalFaculty)}
          </strong>

          <span className="admin-stat-description">
            Registered faculty members
          </span>
        </Link>

        <Link
          to="/admin/academic-management"
          className="admin-stat-card admin-stat-green"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">
              <i className="fa-solid fa-book-open" />
            </div>

            <i className="fa-solid fa-arrow-up-right-from-square admin-stat-arrow" />
          </div>

          <span className="admin-stat-label">Total Courses</span>

          <strong
            className={`admin-stat-value ${
              totalCourses === null ||
              totalCourses === undefined
                ? "is-empty"
                : ""
            }`}
          >
            {formatMetric(totalCourses)}
          </strong>

          <span className="admin-stat-description">
            Courses in the system
          </span>
        </Link>

        <Link
          to="/admin/attendance-reports"
          className="admin-stat-card admin-stat-orange"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">
              <i className="fa-solid fa-chart-line" />
            </div>

            <i className="fa-solid fa-arrow-up-right-from-square admin-stat-arrow" />
          </div>

          <span className="admin-stat-label">Overall Attendance</span>

          <strong
            className={`admin-stat-value ${
              attendancePercentage === null ? "is-empty" : ""
            }`}
          >
            {attendancePercentage === null
              ? "N/A"
              : `${attendancePercentage}%`}
          </strong>

          <span className="admin-stat-description">
            Based on verified attendance records
          </span>
        </Link>
      </div>

      {/* =========================
          ATTENDANCE OVERVIEW
      ========================== */}

      <div className="admin-dashboard-main-grid">
        <section className="admin-dashboard-panel admin-attendance-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-blue">
                <i className="fa-solid fa-chart-area" />
              </div>

              <div>
                <span className="admin-panel-eyebrow">
                  Attendance Overview
                </span>

                <h2>Attendance Trend</h2>

                <p>
                  Attendance trend analytics require a dedicated trend API.
                </p>
              </div>
            </div>

            <Link
              to="/admin/attendance-reports"
              className="admin-panel-link"
            >
              View Reports
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>

          <div className="admin-attendance-body">
            {!hasTrendData ? (
              <div className="admin-empty-state admin-trend-empty">
                <div className="admin-empty-icon">
                  <i className="fa-solid fa-chart-line" />
                </div>

                <h3>No attendance trend data</h3>

                <p>
                  API integration is pending for historical attendance
                  trend data.
                </p>

                <Link
                  to="/admin/attendance-reports"
                  className="admin-empty-link"
                >
                  Open attendance reports
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            ) : (
              <div>
                {/* Attendance trend API integration */}
              </div>
            )}
          </div>
        </section>

        {/* =========================
            CURRENT ATTENDANCE
        ========================== */}

        <section className="admin-dashboard-panel admin-attendance-status-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-orange">
                <i className="fa-solid fa-calendar-check" />
              </div>

              <div>
                <span className="admin-panel-eyebrow">
                  Current Status
                </span>

                <h2>Attendance</h2>
              </div>
            </div>

            <span className="admin-data-badge">
              <i className="fa-solid fa-database" />
              Backend
            </span>
          </div>

          <div className="admin-attendance-status-content">
            <div
              className={`admin-attendance-ring ${
                !hasAttendanceData ? "is-empty" : ""
              }`}
              style={
                hasAttendanceData
                  ? {
                      background: `conic-gradient(
                        #e98a19 0deg ${attendancePercentage * 3.6}deg,
                        #e2e8f0 ${attendancePercentage * 3.6}deg 360deg
                      )`,
                    }
                  : undefined
              }
            >
              <div className="admin-attendance-ring-inner">
                <strong>
                  {attendancePercentage === null
                    ? "N/A"
                    : `${attendancePercentage}%`}
                </strong>

                {attendancePercentage === null && (
                  <span>No data</span>
                )}
              </div>
            </div>

            <h3>
              {hasAttendanceData
                ? "Attendance available"
                : "No attendance records"}
            </h3>

            <p>
              {hasAttendanceData
                ? `${presentAttendance} present and ${absentAttendance} absent attendance records.`
                : "Verified attendance records are not available yet."}
            </p>
          </div>

          <Link
            to="/admin/attendance-reports"
            className="admin-status-footer-link"
          >
            <span>View attendance reports</span>
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </section>
      </div>

      {/* =========================
          QUICK ACTIONS
      ========================== */}

      <section className="admin-dashboard-panel admin-quick-actions-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title-group">
            <div className="admin-panel-icon admin-panel-icon-blue">
              <i className="fa-solid fa-bolt" />
            </div>

            <div>
              <span className="admin-panel-eyebrow">Shortcuts</span>

              <h2>Quick Actions</h2>

              <p>
                Quickly access common administration sections
              </p>
            </div>
          </div>
        </div>

        <div className="admin-quick-actions-grid">
          <Link to="/admin/students" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-blue">
              <i className="fa-solid fa-user-graduate" />
            </div>

            <div>
              <strong>Students</strong>
              <span>View and manage registered students</span>
            </div>

            <i className="fa-solid fa-chevron-right" />
          </Link>

          <Link to="/admin/faculty" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-purple">
              <i className="fa-solid fa-chalkboard-user" />
            </div>

            <div>
              <strong>Faculty</strong>
              <span>View and manage faculty members</span>
            </div>

            <i className="fa-solid fa-chevron-right" />
          </Link>

          <Link to="/admin/academic-management" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-green">
              <i className="fa-solid fa-book-open" />
            </div>

            <div>
              <strong>Academic Management</strong>
              <span>View courses and academic structure</span>
            </div>

            <i className="fa-solid fa-chevron-right" />
          </Link>

          <Link
            to="/admin/attendance-reports"
            className="admin-quick-action"
          >
            <div className="admin-quick-action-icon admin-icon-orange">
              <i className="fa-solid fa-chart-column" />
            </div>

            <div>
              <strong>Attendance Reports</strong>
              <span>Review attendance records</span>
            </div>

            <i className="fa-solid fa-chevron-right" />
          </Link>
        </div>
      </section>

      {/* =========================
          ACTIVITY + QUICK STATS
      ========================== */}

      <div className="admin-dashboard-bottom-grid">
        <section className="admin-dashboard-panel admin-recent-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-blue">
                <i className="fa-solid fa-clock-rotate-left" />
              </div>

              <div>
                <span className="admin-panel-eyebrow">
                  Latest System Activities
                </span>

                <h2>Recent Activity</h2>

                <p>
                  Activity history requires a dedicated backend API.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-recent-content">
            {!hasRecentActivity && (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fa-solid fa-clock" />
                </div>

                <h3>No recent activity</h3>

                <p>
                  API integration is pending for recent system activity.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="admin-dashboard-panel admin-quick-stats-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-blue">
                <i className="fa-solid fa-chart-simple" />
              </div>

              <div>
                <span className="admin-panel-eyebrow">
                  Key Metrics
                </span>

                <h2>Quick Stats</h2>

                <p>Key metrics at a glance</p>
              </div>
            </div>
          </div>

          <div className="admin-quick-stats-grid">
            <div className="admin-quick-stat admin-quick-stat-blue">
              <span>Total Courses</span>

              <strong
                className={
                  totalCourses === null ||
                  totalCourses === undefined
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(totalCourses)}
              </strong>

              <small>Backend data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-purple">
              <span>Total Students</span>

              <strong
                className={
                  totalStudents === null ||
                  totalStudents === undefined
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(totalStudents)}
              </strong>

              <small>Backend data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-green">
              <span>Attendance Records</span>

              <strong
                className={
                  totalAttendanceRecords === null ||
                  totalAttendanceRecords === undefined
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(totalAttendanceRecords)}
              </strong>

              <small>Verified records</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-neutral">
              <span>Absent Records</span>

              <strong
                className={
                  absentAttendance === null ||
                  absentAttendance === undefined
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(absentAttendance)}
              </strong>

              <small>Attendance data</small>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default AdminDashboard;