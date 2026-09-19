import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faCircleInfo,
  faDownload,
  faFileLines,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import PageState from "../../components/PageState";
import "./Reports.css";

function Reports() {
  const [filters, setFilters] = useState({
    search: "",
    semester: "all",
    dateFrom: "",
    dateTo: "",
    status: "all",
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredCourses = useMemo(() => {
    const reportCourses = [];
    const searchValue = filters.search.trim().toLowerCase();

    if (!searchValue) {
        return reportCourses;
    }

    return reportCourses.filter((course) =>
        `${course.name} ${course.code}`.toLowerCase().includes(searchValue),
    );
    }, [filters.search]);

    const attendanceHistory = [];


  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      semester: "all",
      dateFrom: "",
      dateTo: "",
      status: "all",
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "" && value !== "all",
  );

  return (
    <section className="student-reports">
      {/* Header */}
      <div className="student-reports-header">
        <div>
          <span className="student-reports-eyebrow">
            Attendance Reporting
          </span>
          <h1>Reports</h1>
          <p>
            View your attendance performance, course-wise records and generate
            attendance reports.
          </p>
        </div>

        <div className="student-reports-header-actions">
          <div className="student-reports-semester">
            <span>Current Semester</span>
            <strong>N/A</strong>
          </div>

          <button
            type="button"
            className="student-reports-export-button"
            onClick={() => setShowExportModal(true)}
          >
            <FontAwesomeIcon icon={faDownload} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="student-reports-summary">
        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faChartColumn} />
          </div>
          <span>Overall Attendance</span>
          <strong>N/A</strong>
          <small>Attendance percentage</small>
        </article>

        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <span>Total Sessions</span>
          <strong>N/A</strong>
          <small>Recorded attendance sessions</small>
        </article>

        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>
          <span>Present</span>
          <strong>N/A</strong>
          <small>Present attendance records</small>
        </article>

        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>
          <span>Absent</span>
          <strong>N/A</strong>
          <small>Absent attendance records</small>
        </article>
      </div>

      {/* Filters */}
      <section className="student-reports-panel">
        <div className="student-reports-panel-heading">
          <div>
            <span>Report Filters</span>
            <h2>Find Attendance Records</h2>
          </div>
        </div>

        <div className="student-reports-filters">
          <label>
            <span>Search Course</span>
            <div className="student-reports-input">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search course or code"
              />
            </div>
          </label>

          <label>
            <span>Semester</span>
            <select
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
            >
              <option value="all">All Semesters</option>
              <option value="current">Current Semester</option>
            </select>
          </label>

          <label>
            <span>Date From</span>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            <span>Date To</span>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            <span>Status</span>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </label>

          <button
            type="button"
            className="student-reports-clear"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Attendance Overview */}
      <section className="student-reports-panel">
        <div className="student-reports-panel-heading">
          <div>
            <span>Attendance Overview</span>
            <h2>Overall Performance</h2>
          </div>

          <span className="student-reports-status">Backend data pending</span>
        </div>

        <div className="student-reports-overview">
          <div>
            <span>Overall Attendance</span>
            <strong>N/A</strong>
          </div>

          <div>
            <span>Present</span>
            <strong>N/A</strong>
          </div>

          <div>
            <span>Absent</span>
            <strong>N/A</strong>
          </div>

          <div>
            <span>Late</span>
            <strong>N/A</strong>
          </div>
        </div>
      </section>

      {/* Course-wise Report */}
      <section className="student-reports-panel">
        <div className="student-reports-panel-heading">
          <div>
            <span>Course-wise Attendance</span>
            <h2>Attendance Report</h2>
          </div>

          <span className="student-reports-record-count">
            {filteredCourses.length} records
          </span>
        </div>

        <div className="student-reports-table-wrapper">
          {filteredCourses.length === 0 ? (
            <div className="student-reports-empty">
              <PageState
                title={
                  hasActiveFilters
                    ? "No matching reports"
                    : "No attendance report available"
                }
                message={
                  hasActiveFilters
                    ? "No attendance records match the selected filters."
                    : "Attendance reports will appear here once attendance data is provided by the academic system."
                }
              />
            </div>
          ) : (
            <table className="student-reports-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Sessions</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Attendance</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.name}</td>
                    <td>{course.code}</td>
                    <td>{course.sessions}</td>
                    <td>{course.present}</td>
                    <td>{course.absent}</td>
                    <td>{course.late}</td>
                    <td>{course.attendance}</td>
                    <td>
                      <button
                        type="button"
                        className="student-reports-view-button"
                        onClick={() => setShowDetailsModal(true)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Attendance History */}
      <section className="student-reports-panel">
        <div className="student-reports-panel-heading">
          <div>
            <span>Attendance History</span>
            <h2>Attendance Records</h2>
          </div>
        </div>

        <div className="student-reports-table-wrapper">
          {attendanceHistory.length === 0 ? (
            <div className="student-reports-empty student-reports-history-empty">
              <PageState
                title="No attendance history available"
                message="Individual attendance records will appear here once attendance data is available."
              />
            </div>
          ) : (
            <table className="student-reports-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Faculty</th>
                </tr>
              </thead>

              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.course}</td>
                    <td>{record.time}</td>
                    <td>{record.status}</td>
                    <td>{record.faculty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Integration Information */}
      <section className="student-reports-info">
        <div className="student-reports-info-icon">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>

        <div>
          <strong>Report information</strong>
          <p>
            Attendance information will be retrieved for the authenticated
            student from the academic system. The frontend will display
            backend-provided records and summaries without storing attendance
            results locally.
          </p>
        </div>
      </section>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="student-reports-modal-backdrop"
          role="presentation"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="student-reports-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-reports-export-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-reports-modal-header">
              <div>
                <span>Report Export</span>
                <h2 id="student-reports-export-title">
                  Export Attendance Report
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close export modal"
                onClick={() => setShowExportModal(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="student-reports-modal-body">
              <label>
                <span>Report Type</span>
                <select defaultValue="course">
                  <option value="course">Course-wise Attendance</option>
                  <option value="history">Attendance History</option>
                </select>
              </label>

              <label>
                <span>Date Range</span>
                <select defaultValue="semester">
                  <option value="semester">Current Semester</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </label>

              <div>
                <span className="student-reports-format-label">Format</span>

                <div className="student-reports-format-options">
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
              </div>

              <p className="student-reports-modal-note">
                Export functionality will be enabled when the backend
                reporting service is available.
              </p>
            </div>

            <div className="student-reports-modal-footer">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showDetailsModal && (
        <div
          className="student-reports-modal-backdrop"
          role="presentation"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="student-reports-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-reports-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-reports-modal-header">
              <div>
                <span>Course Report</span>
                <h2 id="student-reports-details-title">
                  Course Attendance Report
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close report details"
                onClick={() => setShowDetailsModal(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="student-reports-details">
              <div className="student-reports-detail-course">
                <span>Course</span>
                <strong>N/A</strong>
              </div>

              <div className="student-reports-detail-course">
                <span>Course Code</span>
                <strong>N/A</strong>
              </div>

              <div className="student-reports-detail-grid">
                <div>
                  <span>Total Sessions</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Present</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Absent</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Late</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Attendance</span>
                  <strong>N/A</strong>
                </div>
              </div>

              <div className="student-reports-detail-history">
                <span>Attendance History</span>

                <PageState
                  title="History unavailable"
                  message="Course attendance history will appear here when backend data is available."
                />
              </div>
            </div>

            <div className="student-reports-modal-footer">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
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

export default Reports;