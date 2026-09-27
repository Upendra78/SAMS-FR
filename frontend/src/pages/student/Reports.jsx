import { useEffect, useMemo, useState } from "react";
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
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
} from "../../services/attendanceService";
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
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [courseSummary, setCourseSummary] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const [attendanceResult, summaryResult] =
          await Promise.all([
            getStudentAttendance(),
            getStudentAttendanceSummary(),
          ]);

        if (!isMounted) {
          return;
        }

        if (attendanceResult?.success) {
          setAttendanceHistory(attendanceResult.data ?? []);
        } else {
          setAttendanceHistory([]);
        }

        if (summaryResult?.success) {
          setCourseSummary(summaryResult.data ?? []);
        } else {
          setCourseSummary([]);
        }

        if (
          !attendanceResult?.success ||
          !summaryResult?.success
        ) {
          setError(
            "Some attendance report data is currently unavailable.",
          );
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (requestError?.response?.status === 401) {
          setError(
            "Your session has expired. Please log in again.",
          );
        } else if (requestError?.response?.status === 403) {
          setError(
            "Student access is required to view attendance reports.",
          );
        } else {
          setError(
            "Unable to load attendance report data.",
          );
        }

        setAttendanceHistory([]);
        setCourseSummary([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatPercentage = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "N/A";
    }

    return `${numericValue.toFixed(1)}%`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString();
  };

  const formatTime = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    if (!status) {
      return "N/A";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      );
  };

  const overallStats = useMemo(() => {
    const totalSessions = courseSummary.reduce(
      (total, course) =>
        total + Number(course.total_sessions || 0),
      0,
    );

    const presentSessions = courseSummary.reduce(
      (total, course) =>
        total + Number(course.present_sessions || 0),
      0,
    );

    const absentSessions = courseSummary.reduce(
      (total, course) =>
        total + Number(course.absent_sessions || 0),
      0,
    );

    const attendancePercentage =
      totalSessions > 0
        ? (presentSessions / totalSessions) * 100
        : null;

    return {
      totalSessions,
      presentSessions,
      absentSessions,
      attendancePercentage,
    };
  }, [courseSummary]);

  const semesterOptions = useMemo(() => {
    const semesters = courseSummary
      .map((course) => course.semester)
      .filter(Boolean);

    return [...new Set(semesters)];
  }, [courseSummary]);

  const filteredCourses = useMemo(() => {
    const searchValue = filters.search
      .trim()
      .toLowerCase();

    return courseSummary.filter((course) => {
      const courseName = String(
        course.course_name || "",
      ).toLowerCase();

      const courseCode = String(
        course.course_code || "",
      ).toLowerCase();

      const semester = String(
        course.semester || "",
      );

      const matchesSearch =
        !searchValue ||
        `${courseName} ${courseCode}`.includes(
          searchValue,
        );

      const matchesSemester =
        filters.semester === "all" ||
        semester === filters.semester;

      return matchesSearch && matchesSemester;
    });
  }, [
    courseSummary,
    filters.search,
    filters.semester,
  ]);

  const filteredAttendanceHistory = useMemo(() => {
    const searchValue = filters.search
      .trim()
      .toLowerCase();

    return attendanceHistory.filter((record) => {
      const courseName = String(
        record.course_name || "",
      ).toLowerCase();

      const courseCode = String(
        record.course_code || "",
      ).toLowerCase();

      const status = String(
        record.status || "",
      ).toLowerCase();

      const sessionDate = record.session_date
        ? new Date(record.session_date)
        : null;

      const matchesSearch =
        !searchValue ||
        `${courseName} ${courseCode}`.includes(
          searchValue,
        );

      const matchesStatus =
        filters.status === "all" ||
        status === filters.status;

      let matchesDateFrom = true;
      let matchesDateTo = true;

      if (
        filters.dateFrom &&
        sessionDate &&
        !Number.isNaN(sessionDate.getTime())
      ) {
        const fromDate = new Date(
          `${filters.dateFrom}T00:00:00`,
        );

        matchesDateFrom = sessionDate >= fromDate;
      }

      if (
        filters.dateTo &&
        sessionDate &&
        !Number.isNaN(sessionDate.getTime())
      ) {
        const toDate = new Date(
          `${filters.dateTo}T23:59:59`,
        );

        matchesDateTo = sessionDate <= toDate;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    attendanceHistory,
    filters.search,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const currentSemester = useMemo(() => {
    if (courseSummary.length > 0) {
      return courseSummary[0]?.semester || "N/A";
    }

    return "N/A";
  }, [courseSummary]);

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

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
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
            View your attendance performance, course-wise
            records and attendance history.
          </p>
        </div>

        <div className="student-reports-header-actions">
          <div className="student-reports-semester">
            <span>Current Semester</span>

            <strong>{currentSemester}</strong>
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

          <strong>
            {courseSummary.length > 0
              ? formatPercentage(
                  overallStats.attendancePercentage,
                )
              : "N/A"}
          </strong>

          <small>Attendance percentage</small>
        </article>

        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faFileLines} />
          </div>

          <span>Total Sessions</span>

          <strong>
            {courseSummary.length > 0
              ? overallStats.totalSessions
              : "N/A"}
          </strong>

          <small>
            Recorded attendance sessions
          </small>
        </article>

        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <span>Present</span>

          <strong>
            {courseSummary.length > 0
              ? overallStats.presentSessions
              : "N/A"}
          </strong>

          <small>
            Present attendance records
          </small>
        </article>

        <article>
          <div className="student-reports-card-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <span>Absent</span>

          <strong>
            {courseSummary.length > 0
              ? overallStats.absentSessions
              : "N/A"}
          </strong>

          <small>
            Absent attendance records
          </small>
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
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
              />

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
              <option value="all">
                All Semesters
              </option>

              {semesterOptions.map((semester) => (
                <option
                  value={semester}
                  key={semester}
                >
                  {semester}
                </option>
              ))}
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
              <option value="all">
                All Status
              </option>

              <option value="present">
                Present
              </option>

              <option value="absent">
                Absent
              </option>
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

          <span className="student-reports-status">
            {loading
              ? "Loading"
              : error
                ? "Data unavailable"
                : "Backend data"}
          </span>
        </div>

        <div className="student-reports-overview">
          <div>
            <span>Overall Attendance</span>

            <strong>
              {courseSummary.length > 0
                ? formatPercentage(
                    overallStats.attendancePercentage,
                  )
                : "N/A"}
            </strong>
          </div>

          <div>
            <span>Present</span>

            <strong>
              {courseSummary.length > 0
                ? overallStats.presentSessions
                : "N/A"}
            </strong>
          </div>

          <div>
            <span>Absent</span>

            <strong>
              {courseSummary.length > 0
                ? overallStats.absentSessions
                : "N/A"}
            </strong>
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
          {loading ? (
            <div className="student-reports-empty">
              <PageState
                title="Loading attendance reports"
                message="Fetching your course-wise attendance data."
              />
            </div>
          ) : error && courseSummary.length === 0 ? (
            <div className="student-reports-empty">
              <PageState
                title="Unable to load reports"
                message={error}
              />
            </div>
          ) : filteredCourses.length === 0 ? (
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
                    : "Course-wise attendance reports will appear here once attendance data is available."
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
                  <tr
                    key={
                      course.offering_id ||
                      course.course_id ||
                      course.course_code
                    }
                  >
                    <td>
                      {course.course_name || "N/A"}
                    </td>

                    <td>
                      {course.course_code || "N/A"}
                    </td>

                    <td>
                      {course.total_sessions ?? "N/A"}
                    </td>

                    <td>
                      {course.present_sessions ?? "N/A"}
                    </td>

                    <td>
                      {course.absent_sessions ?? "N/A"}
                    </td>

                    <td>N/A</td>

                    <td>
                      {formatPercentage(
                        course.attendance_percentage,
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="student-reports-view-button"
                        onClick={() =>
                          handleViewDetails(course)
                        }
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

          <span className="student-reports-record-count">
            {filteredAttendanceHistory.length} records
          </span>
        </div>

        <div className="student-reports-table-wrapper">
          {loading ? (
            <div className="student-reports-empty student-reports-history-empty">
              <PageState
                title="Loading attendance history"
                message="Fetching your individual attendance records."
              />
            </div>
          ) : filteredAttendanceHistory.length === 0 ? (
            <div className="student-reports-empty student-reports-history-empty">
              <PageState
                title={
                  hasActiveFilters
                    ? "No matching attendance records"
                    : "No attendance history available"
                }
                message={
                  hasActiveFilters
                    ? "No attendance records match the selected filters."
                    : "Individual attendance records will appear here once attendance data is available."
                }
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
                {filteredAttendanceHistory.map(
                  (record) => (
                    <tr
                      key={
                        record.attendance_id ||
                        record.session_id
                      }
                    >
                      <td>
                        {formatDate(
                          record.session_date,
                        )}
                      </td>

                      <td>
                        {record.course_name ||
                          record.course_code ||
                          "N/A"}
                      </td>

                      <td>
                        {formatTime(record.marked_at)}
                      </td>

                      <td>
                        {formatStatus(record.status)}
                      </td>

                      <td>N/A</td>
                    </tr>
                  ),
                )}
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
            Attendance information is retrieved for the
            authenticated student from the backend.
            The frontend displays backend-provided
            attendance records and summaries without
            storing attendance results locally.
          </p>
        </div>
      </section>

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="student-reports-modal-backdrop"
          role="presentation"
          onClick={() =>
            setShowExportModal(false)
          }
        >
          <div
            className="student-reports-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-reports-export-title"
            onClick={(event) =>
              event.stopPropagation()
            }
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
                onClick={() =>
                  setShowExportModal(false)
                }
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="student-reports-modal-body">
              <label>
                <span>Report Type</span>

                <select defaultValue="course">
                  <option value="course">
                    Course-wise Attendance
                  </option>

                  <option value="history">
                    Attendance History
                  </option>
                </select>
              </label>

              <label>
                <span>Date Range</span>

                <select defaultValue="semester">
                  <option value="semester">
                    Current Semester
                  </option>

                  <option value="custom">
                    Custom Date Range
                  </option>
                </select>
              </label>

              <div>
                <span className="student-reports-format-label">
                  Format
                </span>

                <div className="student-reports-format-options">
                  <button
                    type="button"
                    disabled
                  >
                    CSV
                  </button>

                  <button
                    type="button"
                    disabled
                  >
                    Excel
                  </button>

                  <button
                    type="button"
                    disabled
                  >
                    PDF
                  </button>
                </div>
              </div>

              <p className="student-reports-modal-note">
                Export functionality will be enabled
                when a backend reporting/export service
                is available.
              </p>
            </div>

            <div className="student-reports-modal-footer">
              <button
                type="button"
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

      {/* Course Details Modal */}
      {showDetailsModal && (
        <div
          className="student-reports-modal-backdrop"
          role="presentation"
          onClick={() =>
            setShowDetailsModal(false)
          }
        >
          <div
            className="student-reports-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-reports-details-title"
            onClick={(event) =>
              event.stopPropagation()
            }
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
                onClick={() =>
                  setShowDetailsModal(false)
                }
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="student-reports-details">
              <div className="student-reports-detail-course">
                <span>Course</span>

                <strong>
                  {selectedCourse?.course_name ||
                    "N/A"}
                </strong>
              </div>

              <div className="student-reports-detail-course">
                <span>Course Code</span>

                <strong>
                  {selectedCourse?.course_code ||
                    "N/A"}
                </strong>
              </div>

              <div className="student-reports-detail-grid">
                <div>
                  <span>Total Sessions</span>

                  <strong>
                    {selectedCourse?.total_sessions ??
                      "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Present</span>

                  <strong>
                    {selectedCourse?.present_sessions ??
                      "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Absent</span>

                  <strong>
                    {selectedCourse?.absent_sessions ??
                      "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Late</span>

                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Attendance</span>

                  <strong>
                    {formatPercentage(
                      selectedCourse?.attendance_percentage,
                    )}
                  </strong>
                </div>
              </div>

              <div className="student-reports-detail-history">
                <span>Attendance History</span>

                <PageState
                  title="Course history unavailable"
                  message="The backend currently provides course-wise attendance summaries, but no course-specific history endpoint."
                />
              </div>
            </div>

            <div className="student-reports-modal-footer">
              <button
                type="button"
                onClick={() =>
                  setShowDetailsModal(false)
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

export default Reports;