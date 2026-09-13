import { Link } from "react-router-dom";
import PageState from "../../components/PageState";
import "./Attendance.css";

function Attendance() {
  const classes = [];

  return (
    <section className="faculty-attendance">
      <div className="attendance-heading">
        <div>
          <span className="attendance-eyebrow">Attendance</span>

          <h1>Start Attendance</h1>

          <p>
            Start and monitor attendance sessions for your assigned
            classes using the SAMS-FR recognition workflow.
          </p>
        </div>

        <div className="attendance-status">
          <span className="status-dot" />
          Recognition system
        </div>
      </div>

      <div className="attendance-workflow">
        <div className="workflow-step">
          <span className="workflow-number">01</span>

          <div>
            <strong>Select Class</strong>
            <small>Choose an assigned class.</small>
          </div>
        </div>

        <div className="workflow-line" />

        <div className="workflow-step">
          <span className="workflow-number">02</span>

          <div>
            <strong>Start Session</strong>
            <small>Begin the attendance session.</small>
          </div>
        </div>

        <div className="workflow-line" />

        <div className="workflow-step">
          <span className="workflow-number">03</span>

          <div>
            <strong>Recognition</strong>
            <small>Identify students automatically.</small>
          </div>
        </div>

        <div className="workflow-line" />

        <div className="workflow-step">
          <span className="workflow-number">04</span>

          <div>
            <strong>Record Results</strong>
            <small>Save attendance records.</small>
          </div>
        </div>
      </div>

      <div className="attendance-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Session setup</span>

            <h2>Attendance Session</h2>
          </div>

          <span className="panel-badge">Not started</span>
        </div>

        <div className="attendance-content">
          {classes.length === 0 ? (
            <PageState
              title="No classes available"
              message="Assigned classes will appear here when class data is available from the backend."
            />
          ) : (
            <div className="attendance-session-form">
              <label htmlFor="attendance-class">
                Select class
              </label>

              <select id="attendance-class" defaultValue="">
                <option value="" disabled>
                  Select an assigned class
                </option>

                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <button type="button" disabled>
                Start Attendance
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="attendance-info-grid">
        <section className="attendance-info-card">
          <span className="info-number">01</span>

          <div>
            <h2>Recognition workflow</h2>

            <p>
              The future session will connect the faculty interface
              with the backend recognition service.
            </p>
          </div>
        </section>

        <section className="attendance-info-card">
          <span className="info-number">02</span>

          <div>
            <h2>Automatic attendance</h2>

            <p>
              Recognized students will be recorded against the active
              attendance session.
            </p>
          </div>
        </section>

        <section className="attendance-info-card">
          <span className="info-number">03</span>

          <div>
            <h2>Session monitoring</h2>

            <p>
              Faculty will be able to monitor recognized, pending, and
              unmatched students during a session.
            </p>
          </div>
        </section>
      </div>

      <div className="attendance-footer-note">
        <strong>Backend integration pending</strong>

        <span>
          Recognition and attendance session controls will become
          active when the required backend APIs are available.
        </span>
      </div>

      <div className="attendance-navigation">
        <Link to="/faculty/classes">
          ← View My Classes
        </Link>
      </div>
    </section>
  );
}

export default Attendance;