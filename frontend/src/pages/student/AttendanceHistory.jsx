import { useState } from "react";
import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";
import "./AttendanceHistory.css";

function AttendanceHistory() {
  const [filter, setFilter] = useState("all");

  const attendanceRecords = [];

  const columns = [
    { key: "date", label: "Date" },
    { key: "class", label: "Class" },
    { key: "subject", label: "Subject" },
    { key: "status", label: "Status" },
    { key: "markedAt", label: "Marked At" },
  ];

  const filteredRecords =
    filter === "all"
      ? attendanceRecords
      : attendanceRecords.filter(
          (record) => record.status?.toLowerCase() === filter,
        );

  return (
    <section className="student-attendance-history">
      <div className="attendance-history-heading">
        <div>
          <span className="attendance-history-eyebrow">
            Attendance Records
          </span>
          <h1>Attendance History</h1>
          <p>
            Review individual attendance records for your registered classes.
          </p>
        </div>

        <div className="attendance-history-status">
          <span className="attendance-history-status-dot" />
          Data pending
        </div>
      </div>

      <div className="attendance-history-toolbar">
        <div>
          <span className="attendance-history-toolbar-label">
            Record Filter
          </span>
          <strong>
            {filteredRecords.length}{" "}
            {filteredRecords.length === 1 ? "record" : "records"}
          </strong>
        </div>

        <label className="attendance-history-filter">
          <span>Status</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All records</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </label>
      </div>

      <section className="attendance-history-panel">
        <div className="attendance-history-panel-heading">
          <div>
            <span className="attendance-history-panel-eyebrow">
              Detailed Records
            </span>
            <h2>Attendance History</h2>
          </div>

          <span className="attendance-history-badge">
            Backend data pending
          </span>
        </div>

        <div className="attendance-history-content">
          {filteredRecords.length === 0 ? (
            <PageState
              title="No attendance records available"
              message="Individual attendance records will appear here when attendance data is provided by the backend."
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredRecords}
              emptyMessage="No attendance records found."
            />
          )}
        </div>
      </section>

      <div className="attendance-history-note">
        <strong>Integration note</strong>
        <span>
          Attendance history will be loaded for the authenticated student from
          the approved attendance API. Filtering is handled by the frontend
          after records are received.
        </span>
      </div>
    </section>
  );
}

export default AttendanceHistory;
