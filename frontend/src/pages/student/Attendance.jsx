import PageState from "../../components/PageState";
import "./Attendance.css";

function Attendance() {
  return (
    <section className="student-attendance">
      <div className="student-attendance-heading">
        <div>
          <span className="student-attendance-eyebrow">
            Attendance Monitoring
          </span>
          <h1>Attendance</h1>
          <p>
            Monitor your overall attendance and review attendance by class.
          </p>
        </div>

        <div className="student-attendance-status">
          <span className="student-attendance-status-dot" />
          Data pending
        </div>
      </div>

      <div className="student-attendance-stats">
        <article>
          <span>Overall Attendance</span>
          <strong>N/A</strong>
          <small>Attendance percentage</small>
        </article>

        <article>
          <span>Total Classes</span>
          <strong>N/A</strong>
          <small>Classes attended and recorded</small>
        </article>

        <article>
          <span>Present</span>
          <strong>N/A</strong>
          <small>Present attendance records</small>
        </article>

        <article>
          <span>Absent</span>
          <strong>N/A</strong>
          <small>Absent attendance records</small>
        </article>
      </div>

      <section className="student-attendance-panel">
        <div className="student-attendance-panel-heading">
          <div>
            <span className="student-attendance-panel-eyebrow">
              Attendance Summary
            </span>
            <h2>Class-wise Attendance</h2>
          </div>

          <span className="student-attendance-badge">
            Backend data pending
          </span>
        </div>

        <div className="student-attendance-empty">
          <PageState
            title="Attendance summary is not available"
            message="Class-wise attendance information will appear here when attendance data is provided by the backend."
          />
        </div>
      </section>

      <div className="student-attendance-note">
        <strong>How this will work</strong>
        <span>
          The backend will provide attendance records for the authenticated
          student. The frontend will calculate and display the appropriate
          summary without storing attendance results locally.
        </span>
      </div>
    </section>
  );
}

export default Attendance;
