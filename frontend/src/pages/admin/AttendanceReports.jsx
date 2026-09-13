import { useState } from "react";
import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";
import "./AttendanceReports.css";

function AttendanceReports() {
  const [searchTerm, setSearchTerm] = useState("");

  // Temporary frontend structure.
  // Replace with backend report data when the required API is available.
  const reports = [];

  const columns = [
    { key: "date", label: "Date" },
    { key: "class", label: "Class" },
    { key: "present", label: "Present" },
    { key: "absent", label: "Absent" },
    { key: "percentage", label: "Attendance %" },
  ];

  const filteredReports = reports.filter((report) => {
    const searchValue = searchTerm.toLowerCase();

    return (
      report.date?.toLowerCase().includes(searchValue) ||
      report.class?.toLowerCase().includes(searchValue)
    );
  });

  return (
    <section className="attendance-reports-page">
      <div className="reports-heading">
        <div>
          <span className="reports-eyebrow">Reporting</span>

          <h1>Attendance Reports</h1>

          <p>
            Review attendance records, class participation, and overall
            attendance performance across the SAMS-FR system.
          </p>
        </div>

        <div className="reports-status">
          <span className="status-dot" />
          <span>Reports ready</span>
        </div>
      </div>

      <div className="report-stats">
        <article className="report-stat-card">
          <span className="report-stat-label">Total Classes</span>
          <strong>—</strong>
          <small>Awaiting backend data</small>
        </article>

        <article className="report-stat-card">
          <span className="report-stat-label">Present</span>
          <strong>—</strong>
          <small>Attendance records pending</small>
        </article>

        <article className="report-stat-card">
          <span className="report-stat-label">Absent</span>
          <strong>—</strong>
          <small>Attendance records pending</small>
        </article>

        <article className="report-stat-card report-stat-highlight">
          <span className="report-stat-label">Average Attendance</span>
          <strong>—</strong>
          <small>Calculated from backend reports</small>
        </article>
      </div>

      <section className="reports-filter-panel">
        <div className="filter-heading">
          <div>
            <span className="panel-eyebrow">Reports</span>
            <h2>Attendance Records</h2>
          </div>

          <span className="record-count">
            {reports.length} records
          </span>
        </div>

        <div className="search-field">
          <label htmlFor="attendance-report-search">
            Search reports
          </label>

          <input
            id="attendance-report-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by date or class"
          />
        </div>
      </section>

      <section className="reports-table-panel">
        {filteredReports.length === 0 ? (
          <PageState
            title="No attendance reports available"
            message="Attendance report records will be displayed here when they are provided by the backend."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredReports}
            emptyMessage="No attendance reports found."
          />
        )}
      </section>

      <div className="reports-footer-note">
        <strong>Backend integration pending</strong>

        <span>
          Attendance reports will be connected to the backend API when
          the required reporting endpoints are available.
        </span>
      </div>
    </section>
  );
}

export default AttendanceReports;