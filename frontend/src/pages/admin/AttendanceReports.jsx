import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getAdminAttendanceAnalytics,
  getAdminAttendanceRecords,
  getAdminAttendanceSessions,
} from "../../services/adminService";

import "./AttendanceReports.css";

const EMPTY_METRICS = {
  overallAttendance: null,
  present: null,
  absent: null,
  totalSessions: null,
};

function formatMetric(value, suffix = "") {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return `${value}${suffix}`;
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

function formatDate(dateValue) {
  if (!dateValue) {
    return "N/A";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString();
}

function formatTime(timeValue) {
  if (!timeValue) {
    return "N/A";
  }

  const value = String(timeValue);

  if (value.length >= 5) {
    return value.slice(0, 5);
  }

  return value;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load attendance reports."
  );
}

function AttendanceReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [course, setCourse] = useState("All");
  const [faculty, setFaculty] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("All");

  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [sessionRecords, setSessionRecords] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showExportModal, setShowExportModal] = useState(false);

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (course !== "All") {
        params.offering_id = course;
      }

      if (faculty !== "All") {
        params.faculty_id = faculty;
      }

      if (fromDate) {
        params.from_date = fromDate;
      }

      if (toDate) {
        params.to_date = toDate;
      }

      const [sessionsResponse, analyticsResponse] =
        await Promise.all([
          getAdminAttendanceSessions(params),
          getAdminAttendanceAnalytics(params),
        ]);

      setSessions(
        Array.isArray(sessionsResponse?.data)
          ? sessionsResponse.data
          : [],
      );

      setAnalytics(
        analyticsResponse?.data ||
          null,
      );
    } catch (requestError) {
      setSessions([]);
      setAnalytics(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [
    course,
    faculty,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const loadSessionRecords = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        return [];
      }

      if (sessionRecords[String(sessionId)]) {
        return sessionRecords[String(sessionId)];
      }

      setRecordsLoading(true);

      try {
        const response =
          await getAdminAttendanceRecords(sessionId);

        const records = Array.isArray(response?.data)
          ? response.data
          : [];

        setSessionRecords((current) => ({
          ...current,
          [String(sessionId)]: records,
        }));

        return records;
      } catch (requestError) {
        setError(getErrorMessage(requestError));
        return [];
      } finally {
        setRecordsLoading(false);
      }
    },
    [sessionRecords],
  );

  const courseOptions = useMemo(() => {
    const options = [
      {
        value: "All",
        label: "All",
      },
    ];

    const seen = new Set();

    sessions.forEach((session) => {
      const offeringId = session?.offering_id;
      const courseCode =
        session?.course?.course_code;
      const courseName =
        session?.course?.course_name;

      if (
        offeringId === null ||
        offeringId === undefined ||
        seen.has(String(offeringId))
      ) {
        return;
      }

      seen.add(String(offeringId));

      options.push({
        value: String(offeringId),
        label:
          courseCode && courseName
            ? `${courseCode} - ${courseName}`
            : courseCode ||
              courseName ||
              `Offering ${offeringId}`,
      });
    });

    return options;
  }, [sessions]);

  const facultyOptions = useMemo(() => {
    const options = [
      {
        value: "All",
        label: "All",
      },
    ];

    const seen = new Set();

    sessions.forEach((session) => {
      const facultyId = session?.faculty_id;

      if (
        facultyId === null ||
        facultyId === undefined ||
        seen.has(String(facultyId))
      ) {
        return;
      }

      seen.add(String(facultyId));

      options.push({
        value: String(facultyId),
        label: `Faculty ${facultyId}`,
      });
    });

    return options;
  }, [sessions]);

  const statusOptions = [
    "All",
    "PRESENT",
    "ABSENT",
  ];

  const metrics = useMemo(() => {
    if (!analytics) {
      return EMPTY_METRICS;
    }

    return {
      overallAttendance:
        analytics.overall_percentage ??
        null,
      present:
        analytics.total_present ??
        null,
      absent:
        analytics.total_absent ??
        null,
      totalSessions:
        analytics.total_sessions ??
        null,
    };
  }, [analytics]);

  const attendanceRecords = useMemo(() => {
    const records = [];

    sessions.forEach((session) => {
      const sessionId = session?.session_id;

      if (!sessionId) {
        return;
      }

      const sessionRecordList =
        sessionRecords[String(sessionId)];

      if (!Array.isArray(sessionRecordList)) {
        return;
      }

      sessionRecordList.forEach((record) => {
        records.push({
          id: record.attendance_id,
          sessionId,
          studentId:
            record.student_id ??
            record.student?.student_id,
          studentName:
            record.student?.name ||
            "Unknown Student",
          enrollmentNo:
            record.student?.enrollment_no ||
            "N/A",
          course:
            session.course?.course_code ||
            session.course?.course_name ||
            "N/A",
          courseName:
            session.course?.course_name ||
            "N/A",
          courseOffering:
            session.offering
              ? `${session.offering.academic_year || ""} • Semester ${session.offering.semester ?? "N/A"} • Section ${session.offering.section || "N/A"}`
              : "N/A",
          faculty:
            session.faculty_id
              ? `Faculty ${session.faculty_id}`
              : "N/A",
          department: "N/A",
          date: session.session_date,
          time:
            session.start_time ||
            record.marked_at ||
            null,
          status: record.status,
          markedAt: record.marked_at,
          confidenceScore:
            record.confidence_score,
          recognitionMethod:
            record.recognition_method,
        });
      });
    });

    return records;
  }, [sessions, sessionRecords]);

  const filteredRecords = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return attendanceRecords.filter((record) => {
      const matchesSearch =
        !search ||
        String(record.studentId || "")
          .toLowerCase()
          .includes(search) ||
        String(record.enrollmentNo || "")
          .toLowerCase()
          .includes(search) ||
        String(record.studentName || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        status === "All" ||
        record.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [
    attendanceRecords,
    searchTerm,
    status,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    course !== "All" ||
    faculty !== "All" ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    status !== "All";

  const handleClearFilters = () => {
    setSearchTerm("");
    setCourse("All");
    setFaculty("All");
    setFromDate("");
    setToDate("");
    setStatus("All");
  };

  const handleViewRecord = async (record) => {
    const records = await loadSessionRecords(
      record.sessionId,
    );

    const matchingRecord = records.find(
      (item) =>
        String(item.attendance_id) ===
        String(record.id),
    );

    setSelectedRecord(
      matchingRecord
        ? {
            ...record,
            rawRecord: matchingRecord,
          }
        : record,
    );
  };

  const sessionsNeedingRecords = useMemo(
    () =>
      sessions.filter(
        (session) =>
          !sessionRecords[
            String(session.session_id)
          ],
      ),
    [sessions, sessionRecords],
  );

  const handleLoadRecords = async () => {
    if (sessionsNeedingRecords.length === 0) {
      return;
    }

    setRecordsLoading(true);

    try {
      await Promise.all(
        sessionsNeedingRecords.map(
          (session) =>
            loadSessionRecords(
              session.session_id,
            ),
        ),
      );
    } finally {
      setRecordsLoading(false);
    }
  };

  const overallAttendance =
    metrics.overallAttendance;

  return (
    <section className="attendance-reports-page">
      <header className="attendance-page-header">
        <div>
          <span className="attendance-eyebrow">
            Admin Portal
          </span>

          <h1>Attendance Reports</h1>

          <p>
            Monitor attendance records, session activity
            and student attendance performance.
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

      {error && (
        <div className="attendance-integration-notice">
          <div
            className="attendance-integration-icon"
            aria-hidden="true"
          >
            !
          </div>

          <div>
            <strong>
              Unable to load attendance reports
            </strong>

            <span>{error}</span>
          </div>

          <button
            type="button"
            className="attendance-secondary-button"
            onClick={fetchAttendanceData}
          >
            Retry
          </button>
        </div>
      )}

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
            {loading
              ? "..."
              : formatMetric(
                  metrics.overallAttendance,
                  "%",
                )}
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
            {loading
              ? "..."
              : formatMetric(metrics.present)}
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
            {loading
              ? "..."
              : formatMetric(metrics.absent)}
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
            {loading
              ? "..."
              : formatMetric(
                  metrics.totalSessions,
                )}
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
                setSearchTerm(
                  event.target.value,
                )
              }
            />
          </div>
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
            {courseOptions.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
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
            {facultyOptions.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
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
            {statusOptions.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All"
                  : item}
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
              {formatMetric(
                overallAttendance,
                "%",
              )}
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

        {sessions.length > 0 &&
          attendanceRecords.length === 0 &&
          !recordsLoading && (
            <div className="attendance-empty-state">
              <div
                className="attendance-empty-icon"
                aria-hidden="true"
              >
                ✓
              </div>

              <h3>
                Attendance records are ready
              </h3>

              <p>
                Load the attendance records for the
                sessions returned by the Admin API.
              </p>

              <button
                type="button"
                className="attendance-primary-button"
                onClick={handleLoadRecords}
              >
                Load Attendance Records
              </button>
            </div>
          )}

        {recordsLoading && (
          <div className="attendance-empty-state">
            <div
              className="attendance-empty-icon"
              aria-hidden="true"
            >
              ...
            </div>

            <h3>
              Loading attendance records
            </h3>

            <p>
              Fetching attendance records for the
              selected sessions.
            </p>
          </div>
        )}

        {!loading &&
          !recordsLoading &&
          sessions.length === 0 && (
            <div className="attendance-empty-state">
              <div
                className="attendance-empty-icon"
                aria-hidden="true"
              >
                ✓
              </div>

              <h3>
                No attendance sessions available
              </h3>

              <p>
                No attendance sessions match the
                current filters.
              </p>
            </div>
          )}

        {!recordsLoading &&
          filteredRecords.length > 0 && (
            <>
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
                    {filteredRecords.map(
                      (record) => (
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
                                  {
                                    record.studentName
                                  }
                                </strong>

                                <span>
                                  {
                                    record.enrollmentNo
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {record.studentId}
                          </td>

                          <td>
                            <div className="attendance-course-cell">
                              <strong>
                                {record.course}
                              </strong>

                              <span>
                                {
                                  record.courseOffering
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            {record.faculty}
                          </td>

                          <td>
                            {formatDate(
                              record.date,
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.time,
                            )}
                          </td>

                          <td>
                            <span
                              className={`attendance-status attendance-status-${String(
                                record.status ||
                                  "",
                              ).toLowerCase()}`}
                            >
                              ●{" "}
                              {record.status ||
                                "N/A"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="attendance-action-button"
                              onClick={() =>
                                handleViewRecord(
                                  record,
                                )
                              }
                              aria-label={`View attendance details for ${record.studentName}`}
                              title="View attendance details"
                            >
                              ⋮
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="attendance-pagination">
                <span>
                  Showing{" "}
                  {filteredRecords.length} of{" "}
                  {attendanceRecords.length}{" "}
                  attendance records
                </span>

                <div className="attendance-pagination-controls">
                  <button
                    type="button"
                    disabled
                  >
                    ‹ Previous
                  </button>

                  <button
                    type="button"
                    className="attendance-page-number"
                    disabled
                  >
                    1
                  </button>

                  <button
                    type="button"
                    disabled
                  >
                    Next ›
                  </button>
                </div>
              </div>
            </>
          )}

        {!recordsLoading &&
          attendanceRecords.length > 0 &&
          filteredRecords.length === 0 && (
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
                Try adjusting your search terms or
                attendance status filter.
              </p>
            </div>
          )}
      </div>

      {selectedRecord && (
        <div
          className="attendance-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
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
                <FontAwesomeIcon
                  icon={faXmark}
                />
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
                <span>Enrollment No.</span>
                <strong>
                  {selectedRecord.enrollmentNo}
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
                  {formatDate(
                    selectedRecord.date,
                  )}
                </strong>
              </div>

              <div>
                <span>Recorded Time</span>
                <strong>
                  {selectedRecord.markedAt ||
                    selectedRecord.time ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {selectedRecord.status ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>Recognition Method</span>
                <strong>
                  {selectedRecord
                    .recognitionMethod ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>Confidence Score</span>
                <strong>
                  {selectedRecord
                    .confidenceScore ??
                    "N/A"}
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
            if (
              event.target ===
              event.currentTarget
            ) {
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
                  Export is not available because
                  the current Admin backend does not
                  expose a report export endpoint.
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
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>
            </div>

            <div className="attendance-export-options">
              <button type="button" disabled>
                <strong>CSV</strong>
                <span>
                  Export API not available
                </span>
              </button>

              <button type="button" disabled>
                <strong>Excel</strong>
                <span>
                  Export API not available
                </span>
              </button>

              <button type="button" disabled>
                <strong>PDF</strong>
                <span>
                  Export API not available
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