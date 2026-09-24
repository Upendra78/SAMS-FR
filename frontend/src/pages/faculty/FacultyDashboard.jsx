import { useEffect, useState } from "react";

import "./FacultyDashboard.css";
import { getFacultyDashboard } from "../../services/portalService";

const EMPTY_METRICS = {
  assignedCourses: null,
  todaysClasses: null,
  activeSessions: null,
  averageAttendance: null,
};

function formatMetric(value) {
  return value === null ? "N/A" : value;
}

function FacultyDashboard() {
  const [showAttendanceNotice, setShowAttendanceNotice] = useState(false);
  const [backendStatus, setBackendStatus] = useState("loading");
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFacultyAccess() {
      try {
        const result = await getFacultyDashboard();

        if (!isMounted) {
          return;
        }

        if (result?.success && result?.data?.role === "FACULTY") {
          setBackendStatus("connected");
          setBackendMessage("Faculty backend access confirmed.");
        } else {
          setBackendStatus("error");
          setBackendMessage(
            result?.message || "Unable to verify faculty backend access."
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          setBackendStatus("error");
          setBackendMessage("Your session has expired. Please log in again.");
        } else if (error?.response?.status === 403) {
          setBackendStatus("error");
          setBackendMessage("Faculty access is required for this portal.");
        } else {
          setBackendStatus("error");
          setBackendMessage(
            "Faculty backend service is currently unavailable."
          );
        }
      }
    }

    loadFacultyAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = EMPTY_METRICS;

  return (
    <section className="faculty-dashboard-page">
      {/* Page Header */}
      <header className="faculty-dashboard-header">
        <div>
          <span className="faculty-dashboard-eyebrow">
            Faculty Portal
          </span>

          <h1>Faculty Dashboard</h1>

          <p>
            Welcome back. Manage your courses, attendance sessions
            and student attendance.
          </p>
        </div>

        <button
          type="button"
          className="faculty-primary-button"
          onClick={() => setShowAttendanceNotice(true)}
        >
          <span aria-hidden="true">◉</span>
          Start Attendance
        </button>
      </header>

      {/* Summary Cards */}
      <div className="faculty-summary-grid">
        <article className="faculty-summary-card faculty-summary-blue">
          <div className="faculty-summary-icon" aria-hidden="true">
            ▦
          </div>

          <span>Assigned Courses</span>

          <strong>{formatMetric(metrics.assignedCourses)}</strong>
        </article>

        <article className="faculty-summary-card faculty-summary-purple">
          <div className="faculty-summary-icon" aria-hidden="true">
            ◷
          </div>

          <span>Today's Classes</span>

          <strong>{formatMetric(metrics.todaysClasses)}</strong>
        </article>

        <article className="faculty-summary-card faculty-summary-green">
          <div className="faculty-summary-icon" aria-hidden="true">
            ●
          </div>

          <span>Active Sessions</span>

          <strong>{formatMetric(metrics.activeSessions)}</strong>
        </article>

        <article className="faculty-summary-card faculty-summary-orange">
          <div className="faculty-summary-icon" aria-hidden="true">
            %
          </div>

          <span>Average Attendance</span>

          <strong>{formatMetric(metrics.averageAttendance)}</strong>
        </article>
      </div>

      {/* Today's Schedule */}
      <section className="faculty-dashboard-card faculty-schedule-card">
        <div className="faculty-section-header">
          <div>
            <span className="faculty-section-eyebrow">
              Teaching Schedule
            </span>

            <h2>Today's Schedule</h2>
          </div>

          <span className="faculty-section-badge">
            Today
          </span>
        </div>

        <div className="faculty-empty-state faculty-schedule-empty">
          <div
            className="faculty-empty-icon"
            aria-hidden="true"
          >
            ◷
          </div>

          <h3>No schedule available</h3>

          <p>
            Your teaching schedule will appear here when schedule
            data is provided by the backend.
          </p>
        </div>
      </section>

      {/* Middle Section */}
      <div className="faculty-dashboard-two-column">
        {/* Quick Actions */}
        <section className="faculty-dashboard-card">
          <div className="faculty-section-header">
            <div>
              <span className="faculty-section-eyebrow">
                Shortcuts
              </span>

              <h2>Quick Actions</h2>
            </div>
          </div>

          <div className="faculty-quick-actions">
            <button
              type="button"
              className="faculty-action-card faculty-action-primary"
              onClick={() => setShowAttendanceNotice(true)}
            >
              <span
                className="faculty-action-icon"
                aria-hidden="true"
              >
                ◉
              </span>

              <span>
                <strong>Start Attendance</strong>
                <small>Start a new attendance session</small>
              </span>

              <span aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              className="faculty-action-card"
              onClick={() => setShowAttendanceNotice(true)}
            >
              <span
                className="faculty-action-icon"
                aria-hidden="true"
              >
                ✓
              </span>

              <span>
                <strong>Attendance</strong>
                <small>View attendance activity</small>
              </span>

              <span aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              className="faculty-action-card"
              onClick={() => setShowAttendanceNotice(true)}
            >
              <span
                className="faculty-action-icon"
                aria-hidden="true"
              >
                ▦
              </span>

              <span>
                <strong>My Courses</strong>
                <small>View assigned courses</small>
              </span>

              <span aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              className="faculty-action-card"
              onClick={() => setShowAttendanceNotice(true)}
            >
              <span
                className="faculty-action-icon"
                aria-hidden="true"
              >
                ♟
              </span>

              <span>
                <strong>Students</strong>
                <small>View enrolled students</small>
              </span>

              <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        {/* Active Session */}
        <section className="faculty-dashboard-card">
          <div className="faculty-section-header">
            <div>
              <span className="faculty-section-eyebrow">
                Live Activity
              </span>

              <h2>Active Attendance Session</h2>
            </div>

            <span className="faculty-status-badge faculty-status-neutral">
              No Session
            </span>
          </div>

          <div className="faculty-empty-state faculty-active-session-empty">
            <div
              className="faculty-empty-icon faculty-empty-icon-green"
              aria-hidden="true"
            >
              ●
            </div>

            <h3>No active attendance session</h3>

            <p>
              Start an attendance session for one of your assigned
              course offerings.
            </p>

            <button
              type="button"
              className="faculty-outline-button"
              onClick={() => setShowAttendanceNotice(true)}
            >
              Start Attendance
            </button>
          </div>
        </section>
      </div>

      {/* Attendance Overview */}
      <section className="faculty-dashboard-card faculty-attendance-overview">
        <div className="faculty-section-header">
          <div>
            <span className="faculty-section-eyebrow">
              Attendance Summary
            </span>

            <h2>Attendance Overview</h2>
          </div>
        </div>

        <div className="faculty-overview-grid">
          <div className="faculty-overview-item">
            <span>Overall Attendance</span>
            <strong>N/A</strong>
          </div>

          <div className="faculty-overview-item">
            <span>Present</span>
            <strong>N/A</strong>
          </div>

          <div className="faculty-overview-item">
            <span>Absent</span>
            <strong>N/A</strong>
          </div>

          <div className="faculty-overview-item">
            <span>Late</span>
            <strong>N/A</strong>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <div className="faculty-dashboard-two-column">
        {/* Recent Activity */}
        <section className="faculty-dashboard-card">
          <div className="faculty-section-header">
            <div>
              <span className="faculty-section-eyebrow">
                Session History
              </span>

              <h2>Recent Attendance Activity</h2>
            </div>
          </div>

          <div className="faculty-empty-state faculty-small-empty">
            <div
              className="faculty-empty-icon"
              aria-hidden="true"
            >
              ✓
            </div>

            <h3>No recent attendance activity</h3>

            <p>
              Attendance sessions completed by you will appear here.
            </p>
          </div>
        </section>

        {/* My Courses */}
        <section className="faculty-dashboard-card">
          <div className="faculty-section-header">
            <div>
              <span className="faculty-section-eyebrow">
                Academic
              </span>

              <h2>My Courses</h2>
            </div>
          </div>

          <div className="faculty-empty-state faculty-small-empty">
            <div
              className="faculty-empty-icon"
              aria-hidden="true"
            >
              ▦
            </div>

            <h3>No assigned courses available</h3>

            <p>
              Your assigned courses will appear here when provided
              by the backend.
            </p>
          </div>
        </section>
      </div>

      {/* Backend Notice */}
      <div className="faculty-integration-notice">
        <div
          className="faculty-integration-icon"
          aria-hidden="true"
        >
          i
        </div>

        <div>
          <strong>
            {backendStatus === "loading"
              ? "Connecting to faculty backend"
              : backendStatus === "connected"
                ? "Faculty backend connected"
                : "Faculty backend connection issue"}
          </strong>

          <span>
            {backendStatus === "loading"
              ? "Verifying your faculty access..."
              : backendMessage}
          </span>
        </div>

        <span className="faculty-integration-badge">
          {backendStatus === "loading"
            ? "Connecting"
            : backendStatus === "connected"
              ? "Connected"
              : "Connection Issue"}
        </span>
      </div>

      {/* Temporary Attendance Notice */}
      {showAttendanceNotice && (
        <div
          className="faculty-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAttendanceNotice(false);
            }
          }}
        >
          <div
            className="faculty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-attendance-notice-title"
          >
            <div className="faculty-modal-header">
              <div>
                <span className="faculty-dashboard-eyebrow">
                  Faculty Portal
                </span>

                <h2 id="faculty-attendance-notice-title">
                  Attendance Session
                </h2>
              </div>

              <button
                type="button"
                className="faculty-modal-close"
                onClick={() => setShowAttendanceNotice(false)}
                aria-label="Close attendance session notice"
              >
                ×
              </button>
            </div>

            <div className="faculty-modal-content">
              <div className="faculty-modal-info-icon">
                i
              </div>

              <h3>Attendance backend integration pending</h3>

              <p>
                The attendance session workflow will be connected
                after the faculty attendance API and facial
                recognition session contract are available.
              </p>
            </div>

            <div className="faculty-modal-footer">
              <button
                type="button"
                className="faculty-secondary-button"
                onClick={() => setShowAttendanceNotice(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FacultyDashboard;