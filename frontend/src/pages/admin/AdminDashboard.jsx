import { Link } from "react-router-dom";

import "./AdminDashboard.css";

function AdminDashboard() {
  // Backend data will be connected here later.
  // Keep the dashboard empty until real API data is available.
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

  return (
    <section className="admin-dashboard">
      {/* Dashboard Header */}
      <header className="admin-dashboard-header">
        <div>
          <span className="admin-dashboard-eyebrow">Administration</span>

          <h1>Welcome back, Admin!</h1>

          <p>
            Here&apos;s an overview of what&apos;s happening across the
            SAMS-FR system.
          </p>
        </div>

        <div className="admin-dashboard-header-status">
          <span className="admin-dashboard-status-dot" />
          <span>System overview</span>
        </div>
      </header>

      {/* Main Statistics */}
      <div className="admin-stat-grid">
        <Link to="/admin/students" className="admin-stat-card admin-stat-blue">
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">ST</div>

            <span className="admin-stat-arrow">›</span>
          </div>

          <div className="admin-stat-label">Total Students</div>

          <div className="admin-stat-value">
            {dashboardData.students ?? "N/A"}
          </div>

          <div className="admin-stat-description">
            Registered students
          </div>
        </Link>

        <Link to="/admin/faculty" className="admin-stat-card admin-stat-purple">
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">FC</div>

            <span className="admin-stat-arrow">›</span>
          </div>

          <div className="admin-stat-label">Total Faculty</div>

          <div className="admin-stat-value">
            {dashboardData.faculty ?? "N/A"}
          </div>

          <div className="admin-stat-description">
            Registered faculty members
          </div>
        </Link>

        <Link
          to="/admin/departments"
          className="admin-stat-card admin-stat-green"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">DP</div>

            <span className="admin-stat-arrow">›</span>
          </div>

          <div className="admin-stat-label">Total Departments</div>

          <div className="admin-stat-value">
            {dashboardData.departments ?? "N/A"}
          </div>

          <div className="admin-stat-description">
            Active departments
          </div>
        </Link>

        <Link
          to="/admin/attendance-reports"
          className="admin-stat-card admin-stat-orange"
        >
          <div className="admin-stat-card-top">
            <div className="admin-stat-icon">AT</div>

            <span className="admin-stat-arrow">›</span>
          </div>

          <div className="admin-stat-label">Overall Attendance</div>

          <div className="admin-stat-value">
            {dashboardData.attendance !== null
              ? `${dashboardData.attendance}%`
              : "N/A"}
          </div>

          <div className="admin-stat-description">
            Current attendance rate
          </div>
        </Link>
      </div>

      {/* Attendance + Quick Actions */}
      <div className="admin-dashboard-main-grid">
        <section className="admin-dashboard-panel admin-attendance-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-blue">
                ↗
              </div>

              <div>
                <span className="admin-panel-eyebrow">
                  Attendance Overview
                </span>

                <h2>Attendance Trend</h2>

                <p>
                  Overall attendance information provided by the backend
                </p>
              </div>
            </div>

            <Link
              to="/admin/attendance-reports"
              className="admin-panel-link"
            >
              View Reports
            </Link>
          </div>

          <div className="admin-attendance-body">
            {!hasTrendData ? (
              <div className="admin-empty-state admin-trend-empty">
                <div className="admin-empty-icon">↗</div>

                <h3>No attendance trend data</h3>

                <p>
                  Attendance analytics will appear here when attendance
                  records are available from the backend.
                </p>

                <Link
                  to="/admin/attendance-reports"
                  className="admin-empty-link"
                >
                  Open attendance reports →
                </Link>
              </div>
            ) : (
              <div>{/* Backend attendance trend chart will render here. */}</div>
            )}
          </div>
        </section>

        <section className="admin-dashboard-panel admin-attendance-status-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-orange">
                AT
              </div>

              <div>
                <span className="admin-panel-eyebrow">Current Status</span>

                <h2>Attendance</h2>
              </div>
            </div>

            <span className="admin-data-badge">Backend data</span>
          </div>

          <div className="admin-attendance-status-content">
            <div className="admin-attendance-ring">
              <span>
                {hasAttendanceData
                  ? `${dashboardData.attendance}%`
                  : "N/A"}
              </span>
            </div>

            <h3>
              {hasAttendanceData
                ? "Attendance available"
                : "Attendance unavailable"}
            </h3>

            <p>
              Attendance statistics will be displayed when the backend
              provides the required records.
            </p>
          </div>

          <Link
            to="/admin/attendance-reports"
            className="admin-status-footer-link"
          >
            View attendance reports
            <span>→</span>
          </Link>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="admin-dashboard-panel admin-quick-actions-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title-group">
            <div className="admin-panel-icon admin-panel-icon-blue">
              ✦
            </div>

            <div>
              <span className="admin-panel-eyebrow">Shortcuts</span>

              <h2>Quick Actions</h2>

              <p>Navigate to common administration sections</p>
            </div>
          </div>

          <span className="admin-panel-link">View All</span>
        </div>

        <div className="admin-quick-actions-grid">
          <Link to="/admin/students" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-blue">ST</div>

            <div>
              <strong>Students</strong>
              <span>View and manage registered students</span>
            </div>

            <b>›</b>
          </Link>

          <Link to="/admin/faculty" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-purple">
              FC
            </div>

            <div>
              <strong>Faculty</strong>
              <span>View registered faculty members</span>
            </div>

            <b>›</b>
          </Link>

          <Link to="/admin/departments" className="admin-quick-action">
            <div className="admin-quick-action-icon admin-icon-green">
              DP
            </div>

            <div>
              <strong>Departments</strong>
              <span>View academic departments</span>
            </div>

            <b>›</b>
          </Link>

          <Link
            to="/admin/attendance-reports"
            className="admin-quick-action"
          >
            <div className="admin-quick-action-icon admin-icon-orange">
              AT
            </div>

            <div>
              <strong>Attendance Reports</strong>
              <span>Review attendance records</span>
            </div>

            <b>›</b>
          </Link>

          <Link
            to="/admin/academic-management"
            className="admin-quick-action"
          >
            <div className="admin-quick-action-icon admin-icon-cyan">
              AC
            </div>

            <div>
              <strong>Academic Management</strong>
              <span>View courses and academic structure</span>
            </div>

            <b>›</b>
          </Link>
        </div>
      </section>

      {/* Recent Activity + Quick Stats */}
      <div className="admin-dashboard-bottom-grid">
        <section className="admin-dashboard-panel admin-recent-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-blue">
                ◷
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

            <span className="admin-panel-link">View All</span>
          </div>

          <div className="admin-recent-content">
            {hasRecentActivity ? (
              <div>
                {/* Recent activity records will be rendered here. */}
              </div>
            ) : (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">◷</div>

                <h3>No recent activity</h3>

                <p>
                  Recent system activities will appear here when activity
                  data is available from the backend.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="admin-dashboard-panel admin-quick-stats-panel">
          <div className="admin-panel-header">
            <div className="admin-panel-title-group">
              <div className="admin-panel-icon admin-panel-icon-blue">
                ▥
              </div>

              <div>
                <span className="admin-panel-eyebrow">Key Metrics</span>

                <h2>Quick Stats</h2>

                <p>Key metrics at a glance</p>
              </div>
            </div>
          </div>

          <div className="admin-quick-stats-grid">
            <div className="admin-quick-stat admin-quick-stat-blue">
              <span>Active Courses</span>
              <strong>{dashboardData.activeCourses ?? "N/A"}</strong>
              <small>Academic data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-purple">
              <span>Course Offerings</span>
              <strong>{dashboardData.courseOfferings ?? "N/A"}</strong>
              <small>Academic data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-green">
              <span>Attendance Records</span>
              <strong>{dashboardData.attendanceRecords ?? "N/A"}</strong>
              <small>Attendance data</small>
            </div>

            <div className="admin-quick-stat admin-quick-stat-neutral">
              <span>Pending Approvals</span>
              <strong>{dashboardData.pendingApprovals ?? "N/A"}</strong>
              <small>Backend information</small>
            </div>
          </div>
        </section>
      </div>

      {/* Backend Integration Note */}
      <div className="admin-dashboard-integration-note">
        <div>
          <strong>Backend integration</strong>

          <span>
            Dashboard values, attendance analytics, recent activity, and
            academic metrics will be populated from approved backend APIs.
          </span>
        </div>

        <span className="admin-integration-status">
          Frontend ready
        </span>
      </div>
    </section>
  );
}

export default AdminDashboard;
