import { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";
import { getStudentAttendance } from "../../services/attendanceService";
import "./AttendanceHistory.css";

function AttendanceHistory() {
  const [filter, setFilter] = useState("all");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendanceHistory() {
      try {
        setLoading(true);
        setError("");

        const result = await getStudentAttendance();

        if (result?.success) {
          setAttendanceRecords(result.data ?? []);
        } else {
          setAttendanceRecords([]);
          setError(
            result?.message || "Unable to load attendance records.",
          );
        }
      } catch (err) {
        setAttendanceRecords([]);
        setError(
          err?.response?.data?.message ||
            "Unable to load attendance records.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendanceHistory();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString();
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatStatus = (status) => {
    if (!status) {
      return "N/A";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

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
          (record) =>
            String(record.status || "").toLowerCase() === filter,
        );

  const tableRecords = filteredRecords.map((record) => ({
    date: formatDate(record.session_date),
    class: record.section || "N/A",
    subject: record.course_name || record.course_code || "N/A",
    status: formatStatus(record.status),
    markedAt: formatDateTime(record.marked_at),
  }));

  return (
    <section className="student-attendance-history">
      <div className="attendance-history-heading">
        <div>
          <span className="attendance-history-eyebrow">
            Attendance Records
          </span>

          <h1>Attendance History</h1>

          <p>
            Review individual attendance records for your registered
            classes.
          </p>
        </div>

        <div className="attendance-history-status">
          <span className="attendance-history-status-dot" />

          {loading
            ? "Loading data"
            : error
              ? "Data unavailable"
              : "Live data"}
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
            disabled={loading || Boolean(error)}
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
            {loading
              ? "Loading"
              : error
                ? "Unavailable"
                : "Backend connected"}
          </span>
        </div>

        <div className="attendance-history-content">
          {loading ? (
            <PageState
              title="Loading attendance records"
              message="Fetching your attendance history from the backend."
            />
          ) : error ? (
            <PageState
              title="Unable to load attendance records"
              message={error}
            />
          ) : filteredRecords.length === 0 ? (
            <PageState
              title="No attendance records available"
              message={
                attendanceRecords.length === 0
                  ? "Individual attendance records will appear here when attendance data is provided by the backend."
                  : "No attendance records match the selected status filter."
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={tableRecords}
              emptyMessage="No attendance records found."
            />
          )}
        </div>
      </section>

      <div className="attendance-history-note">
        <strong>Integration note</strong>

        <span>
          Attendance history is loaded for the authenticated student from
          the approved attendance API. Filtering is handled by the
          frontend after records are received.
        </span>
      </div>
    </section>
  );
}

export default AttendanceHistory;