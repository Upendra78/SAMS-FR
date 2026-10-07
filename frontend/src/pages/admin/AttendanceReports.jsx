import { useMemo, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./AttendanceReports.css";

const attendanceRecords = [];

const EMPTY_METRICS = {
  overallAttendance: null,
  present: null,
  absent: null,
  totalSessions: null,
};

function formatMetric(value) {
  return value === null || value === undefined
    ? "N/A"
    : value;
}

function getInitials(name) {
  if (!name) {
    return "ST";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AttendanceReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [course, setCourse] = useState("All");
  const [faculty, setFaculty] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("All");
  const [showExportModal, setShowExportModal] =
    useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const metrics = EMPTY_METRICS;

  const departments = ["All"];
  const courses = ["All"];
  const facultyMembers = ["All"];
  const statuses = ["All"];

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return attendanceRecords.filter((record) => {
      const matchesSearch =
        !search ||
        record.studentId
          ?.toLowerCase()
          .includes(search) ||
        record.studentName
          ?.toLowerCase()
          .includes(search);

      const matchesDepartment =
        department === "All" ||
        record.department === department;

      const matchesCourse =
        course === "All" ||
        record.course === course;

      const matchesFaculty =
        faculty === "All" ||
        record.faculty === faculty;

      const matchesFromDate =
        !fromDate || record.date >= fromDate;

      const matchesToDate =
        !toDate || record.date <= toDate;

      const matchesStatus =
        status === "All" ||
        record.status === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesCourse &&
        matchesFaculty &&
        matchesFromDate &&
        matchesToDate &&
        matchesStatus
      );
    });
  }, [
    searchTerm,
    department,
    course,
    faculty,
    fromDate,
    toDate,
    status,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    department !== "All" ||
    course !== "All" ||
    faculty !== "All" ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    status !== "All";

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartment("All");
    setCourse("All");
    setFaculty("All");
    setFromDate("");
    setToDate("");
    setStatus("All");
  };

  return (
    <section className="attendance-reports-page">
      <header className="attendance-page-header">
        <div>
          <span className="attendance-eyebrow">
            Admin Portal
          </span>

          <h1>Attendance Reports</h1>

          <p>
            Monitor attendance records, session activity and
            student attendance performance.
          </p>
        </div>

        <button
          type="button"
          className="attendance-primary-button"
          onClick={() => setShowExportModal(true)}
        >
          <span aria-hidden="true">⇩</span>
          Export Report
        </button>
      </header>

      <div className="attendance-summary-grid">
        <article className="attendance-summary-card attendance-summary-blue">
          <div
            className="attendance-summary-icon"
            aria-hidden="true"
          >
            %
          </div>

          <span>Overall Attendance</span>

          <strong>
            {formatMetric(metrics.overallAttendance)}
          </strong>
        </article>

        <article className="attendance-summary-card attendance-summary-green">
          <div
            className="attendance-summary-icon"
            aria-hidden="true"
          >
            ✓
          </div>

          <span>Present</span>

          <strong>
            {formatMetric(metrics.present)}
          </strong>
        </article>

        <article className="attendance-summary-card attendance-summary-red">
          <div
            className="attendance-summary-icon"
            aria-hidden="true"
          >
            −
          </div>

          <span>Absent</span>

          <strong>
            {formatMetric(metrics.absent)}
          </strong>
        </article>

        <article className="attendance-summary-card attendance-summary-purple">
          <div
            className="attendance-summary-icon"
            aria-hidden="true"
          >
            ▪
          </div>

          <span>Total Sessions</span>

          <strong>
            {formatMetric(metrics.totalSessions)}
          </strong>
        </article>
      </div>

      <div className="attendance-filter-card">
        <div className="attendance-filter-field attendance-search-field">
          <label htmlFor="attendance-student-search">
            Search Student
          </label>

          <div className="attendance-input-with-icon">
            <span aria-hidden="true">⌕</span>

            <input
              id="attendance-student-search"
              type="search"
              placeholder="Search by Student ID or name..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        <div className="attendance-filter-field">
          <label htmlFor="attendance-department">
            Department
          </label>

          <select
            id="attendance-department"
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-filter-field">
          <label htmlFor="attendance-course">
            Course
          </label>

          <select
            id="attendance-course"
            value={course}
            onChange={(event) =>
              setCourse(event.target.value)
            }
          >
            {courses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-filter-field">
          <label htmlFor="attendance-faculty">
            Faculty
          </label>

          <select
            id="attendance-faculty"
            value={faculty}
            onChange={(event) =>
              setFaculty(event.target.value)
            }
          >
            {facultyMembers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-filter-field attendance-date-field">
          <label htmlFor="attendance-from-date">
            From
          </label>

          <input
            id="attendance-from-date"
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
          />
        </div>

        <div className="attendance-filter-field attendance-date-field">
          <label htmlFor="attendance-to-date">
            To
          </label>

          <input
            id="attendance-to-date"
            type="date"
            value={toDate}
            onChange={(event) =>
              setToDate(event.target.value)
            }
          />
        </div>

        <div className="attendance-filter-field">
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
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="attendance-clear-button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          ↻ Clear Filters
        </button>
      </div>

      <div className="attendance-overview-card">
        <div className="attendance-section-heading">
          <div>
            <span className="attendance-section-eyebrow">
              Attendance Summary
            </span>

            <h2>Attendance Overview</h2>
          </div>
        </div>

        <div className="attendance-overview-grid">
          <div className="attendance-overview-item">
            <span>Overall Attendance</span>

            <strong>
              {formatMetric(metrics.overallAttendance)}
            </strong>
          </div>

          <div className="attendance-overview-item">
            <span>Present</span>

            <strong>
              {formatMetric(metrics.present)}
            </strong>
          </div>

          <div className="attendance-overview-item">
            <span>Absent</span>

            <strong>
              {formatMetric(metrics.absent)}
            </strong>
          </div>

          <div className="attendance-overview-item">
            <span>Late</span>

            <strong>N/A</strong>
          </div>
        </div>
      </div>

      <div className="attendance-table-card">
        <div className="attendance-table-header">
          <div>
            <span className="attendance-section-eyebrow">
              Attendance Data
            </span>

            <h2>Attendance Records</h2>
          </div>

          <span className="attendance-record-count">
            {filteredRecords.length} records
          </span>
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Faculty</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="attendance-student-identity">
                      <div className="attendance-avatar">
                        {getInitials(
                          record.studentName,
                        )}
                      </div>

                      <div>
                        <strong>
                          {record.studentName}
                        </strong>

                        <span>
                          {record.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{record.studentId}</td>

                  <td>
                    <div className="attendance-course-cell">
                      <strong>
                        {record.course}
                      </strong>

                      <span>
                        {record.courseOffering}
                      </span>
                    </div>
                  </td>

                  <td>{record.faculty}</td>

                  <td>{record.date}</td>

                  <td>{record.time}</td>

                  <td>
                    <span
                      className={`attendance-status attendance-status-${record.status?.toLowerCase()}`}
                    >
                      ● {record.status || "N/A"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="attendance-action-button"
                      onClick={() =>
                        setSelectedRecord(record)
                      }
                      aria-label={`View attendance details for ${record.studentName}`}
                      disabled
                      title="Attendance reporting API is not available yet"
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {attendanceRecords.length === 0 ? (
            <div className="attendance-empty-state">
              <div
                className="attendance-empty-icon"
                aria-hidden="true"
              >
                ✓
              </div>

              <h3>
                No attendance records available
              </h3>

              <p>
                Admin attendance records will appear here when
                the required backend reporting API is available.
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="attendance-empty-state attendance-search-empty">
              <div
                className="attendance-empty-icon"
                aria-hidden="true"
              >
                ⌕
              </div>

              <h3>
                No matching attendance records
              </h3>

              <p>
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : null}
        </div>

        <div className="attendance-pagination">
          <span>
            Showing {filteredRecords.length} of{" "}
            {attendanceRecords.length} attendance records
          </span>

          <div className="attendance-pagination-controls">
            <button type="button" disabled>
              ‹ Previous
            </button>

            <button
              type="button"
              className="attendance-page-number"
              disabled
            >
              1
            </button>

            <button type="button" disabled>
              Next ›
            </button>
          </div>
        </div>
      </div>

      <div className="attendance-integration-notice">
        <div
          className="attendance-integration-icon"
          aria-hidden="true"
        >
          i
        </div>

        <div>
          <strong>
            Admin attendance reporting integration pending
          </strong>

          <span>
            The current Flask backend provides student attendance
            endpoints, but does not expose the Admin attendance
            reporting, summary or export APIs required by this page.
          </span>
        </div>

        <span className="attendance-integration-badge">
          Integration Pending
        </span>
      </div>

      {selectedRecord && (
        <div
          className="attendance-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecord(null);
            }
          }}
        >
          <div
            className="attendance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-details-title"
          >
            <div className="attendance-modal-header">
              <div>
                <span className="attendance-eyebrow">
                  Attendance Reports
                </span>

                <h2 id="attendance-details-title">
                  Attendance Details
                </h2>
              </div>

              <button
                type="button"
                className="attendance-modal-close"
                onClick={() =>
                  setSelectedRecord(null)
                }
                aria-label="Close attendance details"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="attendance-details-grid">
              <div>
                <span>Student</span>
                <strong>
                  {selectedRecord.studentName}
                </strong>
              </div>

              <div>
                <span>Student ID</span>
                <strong>
                  {selectedRecord.studentId}
                </strong>
              </div>

              <div>
                <span>Course</span>
                <strong>
                  {selectedRecord.course}
                </strong>
              </div>

              <div>
                <span>Course Offering</span>
                <strong>
                  {selectedRecord.courseOffering}
                </strong>
              </div>

              <div>
                <span>Faculty</span>
                <strong>
                  {selectedRecord.faculty}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {selectedRecord.date}
                </strong>
              </div>

              <div>
                <span>Recorded Time</span>
                <strong>
                  {selectedRecord.time}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedRecord.status}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div
          className="attendance-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowExportModal(false);
            }
          }}
        >
          <div
            className="attendance-modal attendance-export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-report-title"
          >
            <div className="attendance-modal-header">
              <div>
                <span className="attendance-eyebrow">
                  Attendance Reports
                </span>

                <h2 id="export-report-title">
                  Export Report
                </h2>

                <p>
                  Report export will be enabled after the Admin
                  reporting API is available.
                </p>
              </div>

              <button
                type="button"
                className="attendance-modal-close"
                onClick={() =>
                  setShowExportModal(false)
                }
                aria-label="Close export report dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="attendance-export-options">
              <button type="button" disabled>
                <strong>CSV</strong>
                <span>
                  Backend integration pending
                </span>
              </button>

              <button type="button" disabled>
                <strong>Excel</strong>
                <span>
                  Backend integration pending
                </span>
              </button>

              <button type="button" disabled>
                <strong>PDF</strong>
                <span>
                  Backend integration pending
                </span>
              </button>
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-secondary-button"
                onClick={() =>
                  setShowExportModal(false)
                }
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

export default AttendanceReports;