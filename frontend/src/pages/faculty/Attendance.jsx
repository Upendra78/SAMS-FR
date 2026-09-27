import { useMemo, useState } from "react";

import "./Attendance.css";

const attendanceRecords = [];
const attendanceSessions = [];

const EMPTY_METRICS = {
  todaySessions: null,
  activeSession: null,
  studentsPresent: null,
  attendanceRate: null,
};

const classOptions = ["All Classes"];
const statuses = ["All", "Present", "Absent", "Late"];

const formatMetric = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value;
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "S";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
};

function Attendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("All");
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return attendanceRecords.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        record.studentId?.toLowerCase().includes(normalizedSearch) ||
        record.studentName?.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "All Classes" ||
        record.className === selectedClass;

      const matchesDate = !date || record.date === date;

      const matchesStatus =
        status === "All" || record.status === status;

      return (
        matchesSearch &&
        matchesClass &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [searchTerm, selectedClass, date, status]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClass("All Classes");
    setDate("");
    setStatus("All");
  };

  const hasFilters =
    Boolean(searchTerm) ||
    selectedClass !== "All Classes" ||
    Boolean(date) ||
    status !== "All";

  const metrics = [
    {
      label: "Today's Sessions",
      value: formatMetric(EMPTY_METRICS.todaySessions),
      tone: "blue",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 2v4M16 2v4M3 9h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Active Session",
      value: formatMetric(EMPTY_METRICS.activeSession),
      tone: "purple",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v5l3 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Students Present",
      value: formatMetric(EMPTY_METRICS.studentsPresent),
      tone: "green",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m16 11 2 2 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Attendance Rate",
      value: formatMetric(EMPTY_METRICS.attendanceRate),
      tone: "orange",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 19V5M4 19h17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="m7 15 4-4 3 2 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="faculty-attendance-page">
      <section className="attendance-page-header">
        <div>
          <span className="attendance-eyebrow">
            FACULTY PORTAL
          </span>

          <h1>Attendance</h1>

          <p>
            Conduct attendance sessions, monitor attendance records and
            review student attendance for your assigned classes.
          </p>
        </div>

        <button
          type="button"
          className="attendance-primary-button"
          onClick={() => setShowStartModal(true)}
        >
          <span aria-hidden="true">+</span>
          Start Attendance
        </button>
      </section>

      <section className="attendance-metrics-grid">
        {metrics.map((metric) => (
          <article
            className="attendance-metric-card"
            key={metric.label}
          >
            <div
              className={`attendance-metric-icon ${metric.tone}`}
            >
              {metric.icon}
            </div>

            <div className="attendance-metric-content">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="active-attendance-card">
        <div className="active-attendance-heading">
          <div>
            <h2>Active Attendance</h2>
            <p>Current attendance session status.</p>
          </div>

          <span className="session-status pending">
            No Active Session
          </span>
        </div>

        <div className="active-attendance-empty">
          <div className="active-attendance-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 5h16v14H4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M8 9h8M8 13h5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h3>
            No attendance session is currently active
          </h3>

          <p>
            Start a session for one of your assigned classes when
            attendance session services are available.
          </p>

          <button
            type="button"
            className="attendance-outline-button"
            onClick={() => setShowStartModal(true)}
          >
            Start Attendance
          </button>
        </div>
      </section>

      <section className="attendance-records-section">
        <div className="attendance-section-heading">
          <div>
            <h2>Attendance Records</h2>

            <p>
              Review attendance records for your assigned classes.
            </p>
          </div>
        </div>

        <div className="attendance-filters-card">
          <div className="attendance-filter search-filter">
            <label htmlFor="attendance-search">
              Search Student
            </label>

            <div className="attendance-search-wrapper">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m20 20-4-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <input
                id="attendance-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search by student ID or name..."
              />
            </div>
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-class">
              Class
            </label>

            <select
              id="attendance-class"
              value={selectedClass}
              onChange={(event) =>
                setSelectedClass(event.target.value)
              }
            >
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-date">
              Date
            </label>

            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-status">
              Status
            </label>

            <select
              id="attendance-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="attendance-clear-button"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            <span aria-hidden="true">↻</span>
            Clear Filters
          </button>
        </div>

        <div className="attendance-table-card">
          {attendanceRecords.length === 0 ? (
            <div className="attendance-empty-state">
              <div className="attendance-empty-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M5 4h14v16H5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 8h8M8 12h8M8 16h5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3>
                No attendance records available
              </h3>

              <p>
                Attendance records will appear here when a faculty
                attendance-record API is provided by the backend.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="attendance-empty-state compact">
              <div className="attendance-empty-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="m20 20-4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3>No matching records</h3>

              <p>
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Class</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="attendance-student">
                          <div className="attendance-student-avatar">
                            {getInitials(record.studentName)}
                          </div>

                          <strong>
                            {record.studentName}
                          </strong>
                        </div>
                      </td>

                      <td>{record.studentId}</td>

                      <td>
                        {record.className || "N/A"}
                      </td>

                      <td>{record.date || "N/A"}</td>

                      <td>{record.time || "N/A"}</td>

                      <td>
                        <span
                          className={`attendance-status ${
                            record.status?.toLowerCase() ||
                            "unknown"
                          }`}
                        >
                          {record.status || "N/A"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="attendance-view-button"
                          onClick={() =>
                            setSelectedRecord(record)
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="attendance-list-footer">
          <span>
            Showing {filteredRecords.length} of{" "}
            {attendanceRecords.length} records
          </span>

          <div className="attendance-pagination">
            <button type="button" disabled>
              ‹ Previous
            </button>

            <button
              type="button"
              className="active"
              disabled
            >
              1
            </button>

            <button type="button" disabled>
              Next ›
            </button>
          </div>
        </div>
      </section>

      <section className="attendance-sessions-section">
        <div className="attendance-section-heading">
          <div>
            <h2>Recent Attendance Sessions</h2>

            <p>
              Review completed attendance sessions.
            </p>
          </div>
        </div>

        <div className="attendance-table-card session-history-card">
          {attendanceSessions.length === 0 ? (
            <div className="attendance-empty-state compact">
              <div className="attendance-empty-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M12 7v5l3 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3>
                No attendance sessions available
              </h3>

              <p>
                Completed attendance sessions will appear here when
                backend session data is available.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.course || "N/A"}</td>
                      <td>{session.date || "N/A"}</td>
                      <td>{session.session || "N/A"}</td>
                      <td>{session.students || "N/A"}</td>
                      <td>{session.status || "N/A"}</td>

                      <td>
                        <button
                          type="button"
                          className="attendance-view-button"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="attendance-integration-notice">
        <div className="attendance-notice-icon">
          i
        </div>

        <div>
          <strong>
            Attendance session integration pending
          </strong>

          <p>
            The Flask backend currently provides the face-recognition
            attendance recording endpoint, but faculty session creation,
            session listing and attendance-record retrieval APIs are not
            available yet. These APIs are required before this page can
            perform live attendance operations.
          </p>
        </div>
      </section>

      {showStartModal && (
        <div
          className="attendance-modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowStartModal(false)}
        >
          <div
            className="attendance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-attendance-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="attendance-modal-header">
              <div>
                <span className="attendance-eyebrow">
                  ATTENDANCE
                </span>

                <h2 id="start-attendance-title">
                  Start Attendance
                </h2>
              </div>

              <button
                type="button"
                className="attendance-modal-close"
                onClick={() => setShowStartModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="attendance-modal-body">
              <div className="attendance-form-group">
                <label htmlFor="start-class">
                  Class
                </label>

                <select
                  id="start-class"
                  defaultValue="All Classes"
                >
                  {classOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-form-group">
                <label htmlFor="start-date">
                  Date
                </label>

                <input
                  id="start-date"
                  type="date"
                />
              </div>

              <div className="attendance-session-pending">
                <div className="attendance-pending-dot" />

                <div>
                  <strong>
                    Attendance session API unavailable
                  </strong>

                  <p>
                    The current backend does not yet provide the
                    session-creation endpoint required to start an
                    attendance session.
                  </p>
                </div>
              </div>
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-secondary-button"
                onClick={() => setShowStartModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="attendance-primary-button"
                disabled
              >
                Start Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div
          className="attendance-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedRecord(null)}
        >
          <div
            className="attendance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-details-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="attendance-modal-header">
              <div>
                <span className="attendance-eyebrow">
                  ATTENDANCE RECORD
                </span>

                <h2 id="attendance-details-title">
                  Attendance Details
                </h2>
              </div>

              <button
                type="button"
                className="attendance-modal-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="attendance-detail-grid">
              <div>
                <span>Student</span>

                <strong>
                  {selectedRecord.studentName || "N/A"}
                </strong>
              </div>

              <div>
                <span>Student ID</span>

                <strong>
                  {selectedRecord.studentId || "N/A"}
                </strong>
              </div>

              <div>
                <span>Class</span>

                <strong>
                  {selectedRecord.className || "N/A"}
                </strong>
              </div>

              <div>
                <span>Date</span>

                <strong>
                  {selectedRecord.date || "N/A"}
                </strong>
              </div>

              <div>
                <span>Time</span>

                <strong>
                  {selectedRecord.time || "N/A"}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {selectedRecord.status || "N/A"}
                </strong>
              </div>

              <div>
                <span>Recognition</span>

                <strong>
                  {selectedRecord.recognition || "N/A"}
                </strong>
              </div>
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-secondary-button"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;