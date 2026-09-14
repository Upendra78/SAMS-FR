import { Link } from "react-router-dom";
import StatCard from "../../components/StatCard";
import PageState from "../../components/PageState";
import "./StudentDashboard.css";

function StudentDashboard() {
  return (
    <section className="student-dashboard">
      <div className="student-dashboard-heading">
        <div>
          <span className="student-dashboard-eyebrow">Student Portal</span>
          <h1>Dashboard</h1>
          <p>
            Monitor your attendance, academic information, and recent
            attendance activity from one place.
          </p>
        </div>

        <div className="student-dashboard-status">
          <span className="student-status-dot" />
          Account active
        </div>
      </div>

      <div className="student-stats-grid">
        <StatCard
          title="Overall Attendance"
          value="N/A"
          description="Attendance percentage"
        />

        <StatCard
          title="Total Classes"
          value="N/A"
          description="Registered classes"
        />

        <StatCard
          title="Present"
          value="N/A"
          description="Classes attended"
        />

        <StatCard
          title="Absent"
          value="N/A"
          description="Classes missed"
        />
      </div>

      <div className="student-dashboard-grid">
        <section className="student-dashboard-panel">
          <div className="student-panel-heading">
            <div>
              <span className="student-panel-eyebrow">
                Attendance Overview
              </span>
              <h2>My Attendance</h2>
            </div>

            <span className="student-panel-badge">Data pending</span>
          </div>

          <div className="student-attendance-content">
            <PageState
              title="Attendance data is not available"
              message="Your attendance overview will appear here when attendance data is provided by the backend."
            />
          </div>
        </section>

        <section className="student-dashboard-panel">
          <div className="student-panel-heading">
            <div>
              <span className="student-panel-eyebrow">Quick Access</span>
              <h2>Student Services</h2>
            </div>
          </div>

          <div className="student-quick-actions">
            <Link to="/student/profile" className="student-quick-action">
              <span className="student-quick-action-number">01</span>

              <span>
                <strong>My Profile</strong>
                <small>View personal and academic information</small>
              </span>
            </Link>

            <Link to="/student/attendance" className="student-quick-action">
              <span className="student-quick-action-number">02</span>

              <span>
                <strong>Attendance Summary</strong>
                <small>Review class-wise attendance</small>
              </span>
            </Link>

            <Link
              to="/student/attendance-history"
              className="student-quick-action"
            >
              <span className="student-quick-action-number">03</span>

              <span>
                <strong>Attendance History</strong>
                <small>View detailed attendance records</small>
              </span>
            </Link>
          </div>
        </section>
      </div>

      <div className="student-dashboard-bottom">
        <section className="student-dashboard-panel student-recent-panel">
          <div className="student-panel-heading">
            <div>
              <span className="student-panel-eyebrow">
                Recent Activity
              </span>
              <h2>Attendance Activity</h2>
            </div>

            <span className="student-panel-badge">No records</span>
          </div>

          <div className="student-recent-content">
            <PageState
              title="No recent attendance activity"
              message="Recent attendance records will appear here when attendance data becomes available."
            />
          </div>
        </section>
      </div>

      <div className="student-development-note">
        <strong>Integration note</strong>
        <span>
          Dashboard statistics and attendance activity will be populated
          through the approved student and attendance APIs.
        </span>
      </div>
    </section>
  );
}

export default StudentDashboard;
