
import { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";
import { getStudentAttendance } from "../../services/attendanceService";
import "./AttendanceHistory.css";

const PAGE_SIZE = 20;

function AttendanceHistory() {
  const [filter, setFilter] = useState("all");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadAttendanceHistory() {
      try {
        setLoading(true);
        setError("");

        const params = { page, per_page: PAGE_SIZE };

        if (filter !== "all") {
          params.status = filter.toUpperCase();
        }

        const result = await getStudentAttendance(params);

        if (isCancelled) return;

        if (!result?.success) {
          setAttendanceRecords([]);
          setTotalRecords(0);
          setTotalPages(0);
          setError(result?.message || "Unable to load attendance records.");
          return;
        }

        setAttendanceRecords(result.data ?? []);
        setTotalRecords(result.total_records ?? 0);
        setTotalPages(result.total_pages ?? 0);
      } catch (err) {
        if (isCancelled) return;
        setAttendanceRecords([]);
        setTotalRecords(0);
        setTotalPages(0);
        setError(
          err?.response?.data?.message ||
            "Unable to load attendance records.",
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadAttendanceHistory();

    return () => {
      isCancelled = true;
    };
  }, [page, filter]);

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
    setPage(1);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString();
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "N/A";

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

  const tableRecords = attendanceRecords.map((record) => ({
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
            {totalRecords} {totalRecords === 1 ? "record" : "records"}
          </strong>
        </div>

        <label className="attendance-history-filter">
          <span>Status</span>

          <select
            value={filter}
            onChange={handleFilterChange}
            disabled={loading || Boolean(error)}
          >
            <option value="all">All records</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
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
          ) : attendanceRecords.length === 0 ? (
            <PageState
              title="No attendance records available"
              message={
                totalRecords === 0
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

        {!loading && !error && totalRecords > 0 && (
          <div
            className="attendance-history-toolbar"
            aria-label="Attendance history pagination"
          >
            <span>
              Page {page} of {Math.max(totalPages, 1)}
            </span>

            <div>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="attendance-history-note">
        <strong>Integration note</strong>

        <span>
          Attendance history and status filters are loaded from the
          authenticated student's attendance API. Records are paginated
          by the backend.
        </span>
      </div>
    </section>
  );
}

export default AttendanceHistory;
