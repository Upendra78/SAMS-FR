import { Link } from "react-router-dom";

import PageState from "../../components/PageState";
import StatCard from "../../components/StatCard";

import "./AdminDashboard.css";

function AdminDashboard() {
  // Temporary frontend demonstration data.
  // Replace with API data when the backend dashboard endpoints are available.
  const isLoading = false;
  const hasData = true;

  if (isLoading) {
    return (
      <PageState
        title="Loading dashboard"
        message="Dashboard information is being loaded."
      />
    );
  }

  if (!hasData) {
    return (
      <section className="admin-dashboard">
        <div className="dashboard-heading">
          <div>
            <span className="dashboard-eyebrow">Overview</span>

            <h1>Admin Dashboard</h1>

            <p>
              Monitor students, faculty, departments, and attendance
              across the SAMS-FR system.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            title="Students"
            value="N/A"
            description="Student data will be loaded from the backend."
          />

          <StatCard
            title="Faculty"
            value="N/A"
            description="Faculty data will be loaded from the backend."
          />

          <StatCard
            title="Departments"
            value="N/A"
            description="Department data will be loaded from the backend."
          />

          <StatCard
            title="Attendance"
            value="N/A"
            description="Attendance data will be loaded from the backend."
          />
        </div>

        <PageState
          title="No dashboard data available"
          message="Connect the dashboard to the backend API when the required endpoints are available."
        />
      </section>
    );
  }

  return (
    <section className="admin-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">Overview</span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor students, faculty, departments, and attendance
            across the SAMS-FR system.
          </p>
        </div>

        <div className="dashboard-status">
          <span className="status-dot" />
          <span>System overview</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Students"
          value="450"
          description="Total registered students."
        />

        <StatCard
          title="Faculty"
          value="32"
          description="Total registered faculty members."
        />

        <StatCard
          title="Departments"
          value="8"
          description="Total active departments."
        />

        <StatCard
          title="Attendance"
          value="91%"
          description="Overall attendance rate."
          className="stat-card-highlight"
        />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">Attendance</span>

              <h2>Attendance Overview</h2>
            </div>

            <span className="panel-badge">Current</span>
          </div>

          <div className="attendance-overview">
            <div className="attendance-value">
              <strong>91%</strong>

              <span>Overall attendance</span>
            </div>

            <div className="attendance-progress">
              <div className="attendance-progress-track">
                <div
                  className="attendance-progress-value"
                  style={{ width: "91%" }}
                />
              </div>

              <div className="attendance-progress-labels">
                <span>Attendance rate</span>

                <strong>91%</strong>
              </div>
            </div>
          </div>

          <p className="panel-note">
            Attendance analytics will be connected to backend report
            data when the required API endpoints are available.
          </p>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">Navigation</span>

              <h2>Quick Actions</h2>
            </div>
          </div>

          <div className="quick-actions">
            <Link
              to="/admin/students"
              className="quick-action"
            >
              <span className="quick-action-icon">01</span>

              <span>
                <strong>Manage Students</strong>

                <small>View registered students</small>
              </span>
            </Link>

            <Link
              to="/admin/faculty"
              className="quick-action"
            >
              <span className="quick-action-icon">02</span>

              <span>
                <strong>Manage Faculty</strong>

                <small>View faculty members</small>
              </span>
            </Link>

            <Link
              to="/admin/attendance-reports"
              className="quick-action"
            >
              <span className="quick-action-icon">03</span>

              <span>
                <strong>Attendance Reports</strong>

                <small>Review attendance records</small>
              </span>
            </Link>

            <Link
              to="/admin/academic-management"
              className="quick-action"
            >
              <span className="quick-action-icon">04</span>

              <span>
                <strong>Academic Management</strong>

                <small>Manage academic structure</small>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <div className="dashboard-footer-note">
        <strong>Development data</strong>

        <span>
          The dashboard currently displays temporary frontend data.
          Production values will come from the backend API.
        </span>
      </div>
    </section>
  );
}

export default AdminDashboard;