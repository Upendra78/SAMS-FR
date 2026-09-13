import { Link } from "react-router-dom";
import PageState from "../../components/PageState";
import StatCard from "../../components/StatCard";
import "./FacultyDashboard.css";

function FacultyDashboard() {
  // Temporary frontend demonstration state.
  // Replace with API data when faculty dashboard endpoints are available.
  const isLoading = false;
  const hasData = false;

  if (isLoading) {
    return (
      <PageState
        title="Loading dashboard"
        message="Faculty dashboard information is being loaded."
      />
    );
  }

  return (
    <section className="faculty-dashboard">
      <div className="faculty-dashboard-heading">
        <div>
          <span className="faculty-dashboard-eyebrow">
            Overview
          </span>

          <h1>Faculty Dashboard</h1>

          <p>
            Manage your classes, students, attendance, and reports
            from one place.
          </p>
        </div>

        <div className="faculty-dashboard-status">
          <span className="faculty-status-dot" />
          <span>Faculty workspace</span>
        </div>
      </div>

      <div className="faculty-stats-grid">
        <StatCard
          title="Classes"
          value={hasData ? "—" : "N/A"}
          description="Assigned classes."
        />

        <StatCard
          title="Students"
          value={hasData ? "—" : "N/A"}
          description="Students from assigned classes."
        />

        <StatCard
          title="Today's Attendance"
          value={hasData ? "—" : "N/A"}
          description="Today's attendance summary."
        />

        <StatCard
          title="Reports"
          value={hasData ? "—" : "N/A"}
          description="Available attendance reports."
        />
      </div>

      <div className="faculty-dashboard-grid">
        <section className="faculty-dashboard-panel">
          <div className="faculty-panel-heading">
            <div>
              <span className="faculty-panel-eyebrow">
                Attendance
              </span>

              <h2>Today's Attendance</h2>
            </div>

            <span className="faculty-panel-badge">Pending</span>
          </div>

          <div className="faculty-attendance-content">
            <PageState
              title="No attendance data available"
              message="Attendance information will appear here when the required backend services are available."
            />
          </div>
        </section>

        <section className="faculty-dashboard-panel">
          <div className="faculty-panel-heading">
            <div>
              <span className="faculty-panel-eyebrow">
                Navigation
              </span>

              <h2>Quick Actions</h2>
            </div>
          </div>

          <div className="faculty-quick-actions">
            <Link
              to="/faculty/classes"
              className="faculty-quick-action"
            >
              <span className="faculty-quick-action-number">01</span>

              <span>
                <strong>My Classes</strong>
                <small>View assigned classes</small>
              </span>
            </Link>

            <Link
              to="/faculty/students"
              className="faculty-quick-action"
            >
              <span className="faculty-quick-action-number">02</span>

              <span>
                <strong>My Students</strong>
                <small>View assigned students</small>
              </span>
            </Link>

            <Link
              to="/faculty/attendance"
              className="faculty-quick-action"
            >
              <span className="faculty-quick-action-number">03</span>

              <span>
                <strong>Take Attendance</strong>
                <small>Start attendance workflow</small>
              </span>
            </Link>

            <Link
              to="/faculty/reports"
              className="faculty-quick-action"
            >
              <span className="faculty-quick-action-number">04</span>

              <span>
                <strong>View Reports</strong>
                <small>Review attendance reports</small>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <div className="faculty-development-note">
        <strong>Backend integration pending</strong>

        <span>
          Faculty dashboard values will be loaded from the backend
          API when the required endpoints are available.
        </span>
      </div>
    </section>
  );
}

export default FacultyDashboard;