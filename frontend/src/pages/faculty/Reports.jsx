import PageState from "../../components/PageState";
import "./Reports.css";

function Reports() {
  return (
    <section className="faculty-reports">
      <div className="reports-heading">
        <div>
          <span className="reports-eyebrow">Attendance Analytics</span>
          <h1>Reports</h1>
          <p>
            Review attendance reports for classes assigned to the faculty
            member.
          </p>
        </div>

        <div className="reports-status">
          <span className="reports-status-dot" />
          Backend data pending
        </div>
      </div>

      <div className="reports-summary">
        <article className="reports-summary-card">
          <span>Available Reports</span>
          <strong>0</strong>
          <small>Waiting for backend report data</small>
        </article>

        <article className="reports-summary-card">
          <span>Report Source</span>
          <strong>API</strong>
          <small>Attendance service integration</small>
        </article>

        <article className="reports-summary-card">
          <span>Export</span>
          <strong>Ready</strong>
          <small>Export controls can be added after API integration</small>
        </article>
      </div>

      <div className="reports-panel">
        <div className="reports-panel-heading">
          <div>
            <span className="reports-panel-eyebrow">Faculty Reports</span>
            <h2>Attendance Reports</h2>
          </div>

          <span className="reports-panel-badge">No data loaded</span>
        </div>

        <div className="reports-content">
          <PageState
            title="No reports available"
            message="Attendance reports will appear here when report data is available from the backend."
          />
        </div>
      </div>

      <div className="reports-development-note">
        <strong>Integration note</strong>
        <span>
          This page is prepared for the agreed attendance/report API. Do not
          connect it to an unapproved endpoint.
        </span>
      </div>
    </section>
  );
}

export default Reports;
