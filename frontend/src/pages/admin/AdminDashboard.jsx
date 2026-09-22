import { Link } from "react-router-dom";

import "./AdminDashboard.css";

function AdminDashboard() {
  /*
   * Backend integration point.
   *
   * Do not add mock business data here.
   * These values will be populated from approved backend APIs.
   */
  const dashboardData = {
    students: null,
    faculty: null,
    departments: null,
    attendance: null,
    activeCourses: null,
    courseOfferings: null,
    attendanceRecords: null,
    pendingApprovals: null,
  };

  const hasAttendanceData = dashboardData.attendance !== null;
  const hasTrendData = false;
  const hasRecentActivity = false;

  const formatMetric = (value) => {
    return value === null || value === undefined ? "N/A" : value;
  };

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
            Monitor students, faculty, departments, and attendance from one
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
              dashboardData.students === null ? "is-empty" : ""
            }`}
          >
            {formatMetric(dashboardData.students)}
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
              dashboardData.faculty === null ? "is-empty" : ""
            }`}
          >
            {formatMetric(dashboardData.faculty)}
          </strong>

          <span className="admin-stat-description">
            Registered faculty members
          </span>
        </Link>

        <Link
          to="/admin/departments"
          className="admin-stat-card admin-stat-green"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">
              <i className="fa-solid fa-building-columns" />
            </div>

            <i className="fa-solid fa-arrow-up-right-from-square admin-stat-arrow" />
          </div>

          <span className="admin-stat-label">Total Departments</span>

          <strong
            className={`admin-stat-value ${
              dashboardData.departments === null ? "is-empty" : ""
            }`}
          >
            {formatMetric(dashboardData.departments)}
          </strong>

          <span className="admin-stat-description">
            Active academic departments
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
              dashboardData.attendance === null ? "is-empty" : ""
            }`}
          >
            {hasAttendanceData
              ? `${dashboardData.attendance}%`
              : "N/A"}
          </strong>

          <span className="admin-stat-description">
            Current attendance rate
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
                  Attendance analytics from verified system records
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
                  Attendance analytics will appear here when verified
                  attendance records are available from the backend.
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
                {/* Backend attendance trend chart */}
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
            >
              <div className="admin-attendance-ring-inner">
                <strong>
                  {hasAttendanceData
                    ? `${dashboardData.attendance}%`
                    : "N/A"}
                </strong>

                {!hasAttendanceData && (
                  <span>No data</span>
                )}
              </div>
            </div>

            <h3>
              {hasAttendanceData
                ? "Attendance available"
                : "Attendance unavailable"}
            </h3>

            <p>
              Attendance statistics will be displayed when the backend
              provides verified attendance records.
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
              <span>View registered faculty members</span>
            </div>

            <i className="fa-solid fa-chevron-right" />
          </Link>

          <Link to="/admin/departments" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-green">
              <i className="fa-solid fa-building-columns" />
            </div>

            <div>
              <strong>Departments</strong>
              <span>View academic departments</span>
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

          <Link
            to="/admin/academic-management"
            className="admin-quick-action"
          >
            <div className="admin-quick-action-icon admin-icon-cyan">
              <i className="fa-solid fa-book-open" />
            </div>

            <div>
              <strong>Academic Management</strong>
              <span>View courses and academic structure</span>
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
                  Recent administrative activity from the backend
                </p>
              </div>
            </div>
          </div>

          <div className="admin-recent-content">
            {hasRecentActivity ? (
              <div>
                {/* Backend activity records */}
              </div>
            ) : (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <i className="fa-solid fa-clock" />
                </div>

                <h3>No recent activity</h3>

                <p>
                  Recent system activities will appear here when activity
                  data becomes available from the backend.
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
              <span>Active Courses</span>

              <strong
                className={
                  dashboardData.activeCourses === null
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(dashboardData.activeCourses)}
              </strong>

              <small>Academic data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-purple">
              <span>Course Offerings</span>

              <strong
                className={
                  dashboardData.courseOfferings === null
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(dashboardData.courseOfferings)}
              </strong>

              <small>Academic data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-green">
              <span>Attendance Records</span>

              <strong
                className={
                  dashboardData.attendanceRecords === null
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(dashboardData.attendanceRecords)}
              </strong>

              <small>Attendance data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-neutral">
              <span>Pending Approvals</span>

              <strong
                className={
                  dashboardData.pendingApprovals === null
                    ? "is-empty"
                    : ""
                }
              >
                {formatMetric(dashboardData.pendingApprovals)}
              </strong>

              <small>Backend information</small>
            </div>
          </div>
        </section>
      </div>

    
    </section>
  );
}

export default AdminDashboard;