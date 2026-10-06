import { useMemo, useState } from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Reports.css";

const reportStudents = [];
const classReports = [];

const EMPTY_METRICS = {
  overallAttendance: null,
  totalStudents: null,
  totalSessions: null,
  lowAttendance: null,
};

const classOptions = ["All Classes"];
const statuses = ["All", "Present", "Absent", "Late"];

const formatMetric = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${value}%`;
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

function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reportStudents.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.studentId?.toLowerCase().includes(normalizedSearch) ||
        student.studentName?.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "All Classes" ||
        student.className === selectedClass;

      const matchesFrom = !dateFrom || student.lastDate >= dateFrom;
      const matchesTo = !dateTo || student.lastDate <= dateTo;

      const matchesStatus =
        status === "All" || student.status === status;

      return (
        matchesSearch &&
        matchesClass &&
        matchesFrom &&
        matchesTo &&
        matchesStatus
      );
    });
  }, [searchTerm, selectedClass, dateFrom, dateTo, status]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClass("All Classes");
    setDateFrom("");
    setDateTo("");
    setStatus("All");
  };

  const hasFilters =
    Boolean(searchTerm) ||
    selectedClass !== "All Classes" ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    status !== "All";

  const metrics = [
    {
      label: "Overall Attendance",
      value: formatPercentage(EMPTY_METRICS.overallAttendance),
      tone: "blue",
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
    {
      label: "Total Students",
      value: formatMetric(EMPTY_METRICS.totalStudents),
      tone: "purple",
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
            d="M16 3.5a4 4 0 0 1 0 7.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      label: "Total Sessions",
      value: formatMetric(EMPTY_METRICS.totalSessions),
      tone: "green",
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
      label: "Low Attendance",
      value: formatMetric(EMPTY_METRICS.lowAttendance),
      tone: "orange",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3 22 20H2L12 3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v5M12 17v.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="faculty-reports-page">
      <section className="reports-page-header">
        <div>
          <span className="reports-eyebrow">FACULTY PORTAL</span>

          <h1>Reports</h1>

          <p>
            Analyze attendance performance for your assigned classes and
            generate attendance reports.
          </p>
        </div>

        <button
          type="button"
          className="reports-primary-button"
          onClick={() => setShowExportModal(true)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3v12M7 10l5 5 5-5M5 21h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          Export Report
        </button>
      </section>

      <section className="reports-metrics-grid">
        {metrics.map((metric) => (
          <article className="reports-metric-card" key={metric.label}>
            <div className={`reports-metric-icon ${metric.tone}`}>
              {metric.icon}
            </div>

            <div className="reports-metric-content">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Report Filters</h2>
            <p>
              Filter attendance information by student, class, and date.
            </p>
          </div>
        </div>

        <div className="reports-filters-card">
          <div className="reports-filter reports-search-filter">
            <label htmlFor="report-search">Search Student</label>

            <div className="reports-search-wrapper">
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
                id="report-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by student ID or name..."
              />
            </div>
          </div>

          <div className="reports-filter">
            <label htmlFor="report-class">Class</label>

            <select
              id="report-class"
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
            >
              {classOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="reports-filter">
            <label htmlFor="report-date-from">Date From</label>

            <input
              id="report-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="reports-filter">
            <label htmlFor="report-date-to">Date To</label>

            <input
              id="report-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>

          <div className="reports-filter">
            <label htmlFor="report-status">Status</label>

            <select
              id="report-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
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
            className="reports-clear-button"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            <span aria-hidden="true">↻</span>
            Clear Filters
          </button>
        </div>
      </section>

      <section className="reports-overview-card">
        <div className="reports-overview-header">
          <div>
            <h2>Attendance Overview</h2>
            <p>
              Attendance distribution across your assigned classes.
            </p>
          </div>

          <span className="reports-data-badge">Backend Data</span>
        </div>

        <div className="reports-overview-grid">
          <div className="reports-overview-main">
            <span>Overall Attendance</span>

            <strong>
              {formatPercentage(EMPTY_METRICS.overallAttendance)}
            </strong>

            <div className="reports-progress-track">
              <div className="reports-progress-fill" />
            </div>
          </div>

          <div className="reports-overview-stat">
            <span className="reports-stat-dot present" />

            <div>
              <small>Present</small>
              <strong>N/A</strong>
            </div>
          </div>

          <div className="reports-overview-stat">
            <span className="reports-stat-dot absent" />

            <div>
              <small>Absent</small>
              <strong>N/A</strong>
            </div>
          </div>

          <div className="reports-overview-stat">
            <span className="reports-stat-dot late" />

            <div>
              <small>Late</small>
              <strong>N/A</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Student Attendance</h2>

            <p>
              Attendance summary for students in your assigned classes.
            </p>
          </div>
        </div>

        <div className="reports-table-card">
          {reportStudents.length === 0 ? (
            <div className="reports-empty-state">
              <div className="reports-empty-icon">
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

              <h3>No attendance reports available</h3>

              <p>
                Student attendance reports will appear here when attendance
                data is provided by the backend.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="reports-empty-state compact">
              <div className="reports-empty-icon">
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

              <h3>No matching reports</h3>

              <p>Try changing your search or filters.</p>
            </div>
          ) : (
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Class</th>
                    <th>Sessions</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="reports-student">
                          <div className="reports-student-avatar">
                            {getInitials(student.studentName)}
                          </div>

                          <strong>{student.studentName}</strong>
                        </div>
                      </td>

                      <td>{student.studentId || "N/A"}</td>

                      <td>{student.className || "N/A"}</td>

                      <td>{student.sessions ?? "N/A"}</td>

                      <td>{student.present ?? "N/A"}</td>

                      <td>{student.absent ?? "N/A"}</td>

                      <td>{student.late ?? "N/A"}</td>

                      <td>{formatPercentage(student.attendanceRate)}</td>

                      <td>
                        <button
                          type="button"
                          className="reports-view-button"
                          onClick={() => setSelectedStudent(student)}
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

        <div className="reports-list-footer">
          <span>
            Showing {filteredStudents.length} of {reportStudents.length}{" "}
            students
          </span>

          <div className="reports-pagination">
            <button type="button" disabled>
              ‹ Previous
            </button>

            <button type="button" className="active" disabled>
              1
            </button>

            <button type="button" disabled>
              Next ›
            </button>
          </div>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Class-wise Attendance</h2>

            <p>
              Attendance summary across your assigned classes.
            </p>
          </div>
        </div>

        <div className="reports-table-card class-report-card">
          {classReports.length === 0 ? (
            <div className="reports-empty-state compact">
              <div className="reports-empty-icon">
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

              <h3>No class reports available</h3>

              <p>
                Class attendance summaries will appear here when reporting
                data is available from the backend.
              </p>
            </div>
          ) : (
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Students</th>
                    <th>Sessions</th>
                    <th>Attendance</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {classReports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.className || "N/A"}</td>

                      <td>{report.students ?? "N/A"}</td>

                      <td>{report.sessions ?? "N/A"}</td>

                      <td>{formatPercentage(report.attendanceRate)}</td>

                      <td>
                        <button
                          type="button"
                          className="reports-view-button"
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

      <section className="reports-integration-notice">
        <div className="reports-notice-icon">i</div>

        <div>
          <strong>Reporting service integration pending</strong>

          <p>
            Attendance analytics and report data will be loaded from the
            Flask backend once the reporting API is available.
          </p>
        </div>
      </section>

      {showExportModal && (
        <div
          className="reports-modal-backdrop"
          onMouseDown={() => setShowExportModal(false)}
        >
          <div
            className="reports-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="reports-modal-header">
              <div>
                <span className="reports-eyebrow">REPORTS</span>

                <h2>Export Report</h2>
              </div>

              <button
                type="button"
                className="reports-modal-close"
                onClick={() => setShowExportModal(false)}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="reports-modal-body">
              <p>
                Select an export format once the reporting service is
                connected.
              </p>

              <div className="reports-export-options">
                <button type="button" disabled>
                  CSV
                </button>

                <button type="button" disabled>
                  Excel
                </button>

                <button type="button" disabled>
                  PDF
                </button>
              </div>

              <div className="reports-export-pending">
                Export functionality will be enabled after backend reporting
                integration.
              </div>
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-secondary-button"
                onClick={() => setShowExportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudent && (
        <div
          className="reports-modal-backdrop"
          onMouseDown={() => setSelectedStudent(null)}
        >
          <div
            className="reports-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="reports-modal-header">
              <div>
                <span className="reports-eyebrow">
                  STUDENT REPORT
                </span>

                <h2>Attendance Report</h2>
              </div>

              <button
                type="button"
                className="reports-modal-close"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="reports-student-detail">
              <div className="reports-detail-profile">
                <div className="reports-detail-avatar">
                  {getInitials(selectedStudent.studentName)}
                </div>

                <div>
                  <strong>
                    {selectedStudent.studentName || "N/A"}
                  </strong>

                  <span>
                    {selectedStudent.studentId || "N/A"}
                  </span>
                </div>
              </div>

              <div className="reports-detail-grid">
                <div>
                  <span>Class</span>
                  <strong>
                    {selectedStudent.className || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Total Sessions</span>
                  <strong>
                    {selectedStudent.sessions ?? "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Present</span>
                  <strong>
                    {selectedStudent.present ?? "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Absent</span>
                  <strong>
                    {selectedStudent.absent ?? "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Late</span>
                  <strong>
                    {selectedStudent.late ?? "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Attendance</span>
                  <strong>
                    {formatPercentage(
                      selectedStudent.attendanceRate,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="reports-history-placeholder">
              <strong>Attendance History</strong>

              <p>
                Detailed attendance history will be displayed here when
                attendance records are available from the backend.
              </p>
            </div>

            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-secondary-button"
                onClick={() => setSelectedStudent(null)}
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

export default Reports;