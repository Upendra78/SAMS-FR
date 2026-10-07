import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCalendar,
  faChartLine,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faClock,
  faMagnifyingGlass,
  faRotateRight,
  faSpinner,
  faUserCheck,
  faUserGraduate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import "./Attendance.css";

import {
  closeFacultyAttendanceSession,
  getActiveFacultyAttendanceSession,
  getFacultyAttendanceRecords,
  getFacultyAttendanceSessions,
  getFacultyCourses,
  getFacultyStudents,
  markFacultyAttendance,
  startFacultyAttendanceSession,
} from "../../services/facultyService";

const EMPTY_METRICS = {
  todaySessions: null,
  activeSession: null,
  studentsPresent: null,
  attendanceRate: null,
};

const formatMetric = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value;
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCourseLabel = (course) => {
  const code = course?.course_code || "";
  const name = course?.course_name || "";

  if (code && name) {
    return `${code} - ${name}`;
  }

  return (
    code ||
    name ||
    `Offering ${course?.offering_id ?? "N/A"}`
  );
};

const getStudentName = (student) => {
  return student?.name || "Unknown Student";
};

const getAttendanceStatus = (record) => {
  return record?.status || "NOT MARKED";
};

function Attendance() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [error, setError] = useState("");
  const [coursesError, setCoursesError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [recordsError, setRecordsError] = useState("");

  const [startError, setStartError] = useState("");
  const [closeError, setCloseError] = useState("");
  const [markAttendanceError, setMarkAttendanceError] =
    useState("");

  const [markingStudentId, setMarkingStudentId] =
    useState(null);

  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] =
    useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] =
    useState("All Classes");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("All");

  /*
   * Load attendance sessions and active session.
   */
  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      setLoading(true);
      setError("");

      try {
        const [sessionsResult, activeResult] =
          await Promise.all([
            getFacultyAttendanceSessions(),
            getActiveFacultyAttendanceSession(),
          ]);

        if (!isMounted) {
          return;
        }

        if (!sessionsResult?.success) {
          throw new Error(
            sessionsResult?.message ||
              "Unable to load attendance sessions."
          );
        }

        setSessions(
          Array.isArray(sessionsResult.data)
            ? sessionsResult.data
            : []
        );

        if (!activeResult?.success) {
          throw new Error(
            activeResult?.message ||
              "Unable to load active attendance session."
          );
        }

        setActiveSession(activeResult.data || null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setSessions([]);
        setActiveSession(null);

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load attendance sessions."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Load faculty course offerings.
   */
  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const result = await getFacultyCourses();

        if (!isMounted) {
          return;
        }

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Unable to load faculty courses."
          );
        }

        const courseData = Array.isArray(result.data)
          ? result.data
          : [];

        setCourses(courseData);

        if (courseData.length > 0) {
          setSelectedOfferingId(
            String(courseData[0].offering_id)
          );
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setCourses([]);

        setCoursesError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load faculty courses."
        );
      } finally {
        if (isMounted) {
          setCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Load faculty students.
   */
  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      setStudentsLoading(true);
      setStudentsError("");

      try {
        const result = await getFacultyStudents();

        if (!isMounted) {
          return;
        }

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Unable to load faculty students."
          );
        }

        setStudents(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setStudents([]);

        setStudentsError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load faculty students."
        );
      } finally {
        if (isMounted) {
          setStudentsLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Course lookup by offering ID.
   */
  const courseMap = useMemo(() => {
    return new Map(
      courses.map((course) => [
        String(course.offering_id),
        course,
      ])
    );
  }, [courses]);

  /*
   * Get readable course name for a session.
   */
  const getSessionClassName = useCallback(
    (session) => {
      const course = courseMap.get(
        String(session?.offering_id)
      );

      return course
        ? getCourseLabel(course)
        : "N/A";
    },
    [courseMap]
  );

  /*
   * Class filter options.
   */
  const classOptions = useMemo(() => {
    const values = sessions
      .map((session) =>
        courseMap.get(
          String(session.offering_id)
        )
      )
      .filter(Boolean)
      .map(getCourseLabel);

    return [
      "All Classes",
      ...Array.from(new Set(values)).sort(),
    ];
  }, [sessions, courseMap]);

  /*
   * Filter session history.
   */
  const filteredSessions = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return sessions.filter((session) => {
      const className =
        getSessionClassName(session);

      const matchesSearch =
        !normalizedSearch ||
        className
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesClass =
        selectedClass === "All Classes" ||
        className === selectedClass;

      const matchesDate =
        !date ||
        session.session_date === date;

      const matchesStatus =
        status === "All" ||
        session.status === status;

      return (
        matchesSearch &&
        matchesClass &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    sessions,
    searchTerm,
    selectedClass,
    date,
    status,
    getSessionClassName,
  ]);

  /*
   * Today's session count.
   */
  const todaySessions = useMemo(() => {
    const today = getTodayDate();

    return sessions.filter(
      (session) =>
        session.session_date === today
    ).length;
  }, [sessions]);

  /*
   * Attendance record lookup by student ID.
   */
  const attendanceRecordMap = useMemo(() => {
    return new Map(
      attendanceRecords.map((record) => [
        String(record.student_id),
        record,
      ])
    );
  }, [attendanceRecords]);

  /*
   * Students currently marked present.
   */
  const studentsPresent = useMemo(() => {
    return attendanceRecords.filter(
      (record) => record.status === "PRESENT"
    ).length;
  }, [attendanceRecords]);

  /*
   * Load attendance records for a selected session.
   */
  const loadAttendanceRecords = useCallback(
    async (session) => {
      if (!session?.session_id) {
        setSelectedSession(null);
        setAttendanceRecords([]);
        setRecordsError("");
        return;
      }

      setSelectedSession(session);
      setRecordsLoading(true);
      setRecordsError("");
      setMarkAttendanceError("");

      try {
        const result =
          await getFacultyAttendanceRecords(
            session.session_id
          );

        if (!result?.success) {
          throw new Error(
            result?.message ||
              "Unable to load attendance records."
          );
        }

        setAttendanceRecords(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (requestError) {
        setAttendanceRecords([]);

        setRecordsError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load attendance records."
        );
      } finally {
        setRecordsLoading(false);
      }
    },
    []
  );

  /*
   * Select a session.
   */
  const handleSessionSelect = async (session) => {
    await loadAttendanceRecords(session);
  };

  /*
   * Mark one student manually.
   */
  const handleMarkAttendance = async (studentId) => {
    if (!selectedSession?.session_id) {
      setMarkAttendanceError(
        "Select an attendance session first."
      );
      return;
    }

    if (selectedSession.status !== "ACTIVE") {
      setMarkAttendanceError(
        "Attendance can only be marked for an active session."
      );
      return;
    }

    const existingRecord =
      attendanceRecordMap.get(String(studentId));

    if (existingRecord?.status === "PRESENT") {
      setMarkAttendanceError(
        "Attendance is already marked for this student."
      );
      return;
    }

    setMarkingStudentId(studentId);
    setMarkAttendanceError("");

    try {
      const result = await markFacultyAttendance(
        selectedSession.session_id,
        {
          student_id: studentId,
          recognition_method: "MANUAL",
        }
      );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Unable to mark attendance."
        );
      }

      const returnedRecord = result.data;

      setAttendanceRecords((currentRecords) => {
        const existingIndex =
          currentRecords.findIndex(
            (record) =>
              String(record.student_id) ===
              String(returnedRecord.student_id)
          );

        if (existingIndex === -1) {
          return [
            ...currentRecords,
            returnedRecord,
          ];
        }

        return currentRecords.map(
          (record, index) =>
            index === existingIndex
              ? returnedRecord
              : record
        );
      });
    } catch (requestError) {
      setMarkAttendanceError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to mark attendance."
      );
    } finally {
      setMarkingStudentId(null);
    }
  };

  /*
   * Start attendance session.
   */
  const handleStartAttendance = async () => {
    if (!selectedOfferingId) {
      setStartError(
        "Please select a course before starting attendance."
      );
      return;
    }

    setStartingSession(true);
    setStartError("");

    try {
      const result =
        await startFacultyAttendanceSession(
          Number(selectedOfferingId)
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Unable to start attendance session."
        );
      }

      const newSession = result.data;

      setSessions((currentSessions) => [
        newSession,
        ...currentSessions,
      ]);

      setActiveSession(newSession);
      setSelectedSession(newSession);
      setAttendanceRecords([]);
      setRecordsError("");
      setMarkAttendanceError("");
      setShowStartModal(false);
    } catch (requestError) {
      setStartError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to start attendance session."
      );
    } finally {
      setStartingSession(false);
    }
  };

  /*
   * Close active attendance session.
   */
  const handleCloseAttendance = async () => {
    if (!activeSession?.session_id) {
      return;
    }

    setClosingSession(true);
    setCloseError("");

    try {
      const result =
        await closeFacultyAttendanceSession(
          activeSession.session_id
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Unable to close attendance session."
        );
      }

      const closedSession = result.data;

      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.session_id ===
          closedSession.session_id
            ? closedSession
            : session
        )
      );

      setActiveSession(null);

      if (
        selectedSession?.session_id ===
        closedSession.session_id
      ) {
        setSelectedSession(closedSession);
      }

      setAttendanceRecords((currentRecords) => [
        ...currentRecords,
      ]);
    } catch (requestError) {
      setCloseError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to close attendance session."
      );
    } finally {
      setClosingSession(false);
    }
  };

  /*
   * Open start-session modal.
   */
  const handleOpenStartModal = () => {
    setStartError("");

    if (
      !selectedOfferingId &&
      courses.length > 0
    ) {
      setSelectedOfferingId(
        String(courses[0].offering_id)
      );
    }

    setShowStartModal(true);
  };

  /*
   * Clear session filters.
   */
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

  /*
   * Dashboard metrics.
   */
  const metrics = [
    {
      label: "Today's Sessions",
      value: formatMetric(
        loading
          ? EMPTY_METRICS.todaySessions
          : todaySessions
      ),
      tone: "blue",
      icon: faCalendar,
    },
    {
      label: "Active Session",
      value: formatMetric(
        loading
          ? EMPTY_METRICS.activeSession
          : activeSession
            ? 1
            : 0
      ),
      tone: "purple",
      icon: faClock,
    },
    {
      label: "Students Present",
      value: formatMetric(
        selectedSession
          ? studentsPresent
          : EMPTY_METRICS.studentsPresent
      ),
      tone: "green",
      icon: faUserCheck,
    },
    {
      label: "Attendance Rate",
      value: formatMetric(
        EMPTY_METRICS.attendanceRate
      ),
      tone: "orange",
      icon: faChartLine,
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
            Conduct attendance sessions, monitor
            attendance records and review attendance
            for your assigned classes.
          </p>
        </div>

        <button
          type="button"
          className="attendance-primary-button"
          onClick={handleOpenStartModal}
          disabled={
            coursesLoading ||
            courses.length === 0 ||
            Boolean(activeSession)
          }
          title={
            activeSession
              ? "Close the active session before starting another session"
              : courses.length === 0
                ? "No faculty course offerings are available"
                : "Start attendance"
          }
        >
          <FontAwesomeIcon icon={faCalendar} />
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
              <FontAwesomeIcon icon={metric.icon} />
            </div>

            <div className="attendance-metric-content">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </article>
        ))}
      </section>

      {error && (
        <section className="attendance-integration-notice">
          <div className="attendance-notice-icon">
            <FontAwesomeIcon icon={faCircleExclamation} />
          </div>

          <div>
            <strong>
              Unable to load attendance sessions
            </strong>

            <p>{error}</p>
          </div>
        </section>
      )}

      <section className="active-attendance-card">
        <div className="active-attendance-heading">
          <div>
            <h2>Active Attendance</h2>

            <p>
              Current attendance session status.
            </p>
          </div>

          <span
            className={`session-status ${
              activeSession
                ? "active"
                : "pending"
            }`}
          >
            {activeSession
              ? "Active Session"
              : "No Active Session"}
          </span>
        </div>

        {activeSession ? (
          <div className="active-attendance-empty">
            <div className="active-attendance-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>

            <h3>
              {getSessionClassName(activeSession)}
            </h3>

            <p>
              Session started at{" "}
              {formatTime(
                activeSession.start_time
              )}{" "}
              on{" "}
              {formatDate(
                activeSession.session_date
              )}
              .
            </p>

            {closeError && (
              <p className="attendance-error-text">
                {closeError}
              </p>
            )}

            <button
              type="button"
              className="attendance-outline-button"
              onClick={handleCloseAttendance}
              disabled={closingSession}
            >
              {closingSession ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                  />
                  Closing Session...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faXmark} />
                  Close Attendance
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="active-attendance-empty">
            <div className="active-attendance-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>

            <h3>
              No attendance session is currently active
            </h3>

            <p>
              Start an attendance session for one of
              your assigned course offerings.
            </p>

            <button
              type="button"
              className="attendance-outline-button"
              onClick={handleOpenStartModal}
              disabled={
                coursesLoading ||
                courses.length === 0
              }
            >
              <FontAwesomeIcon icon={faCalendar} />
              Start Attendance
            </button>
          </div>
        )}
      </section>

      <section className="attendance-records-section">
        <div className="attendance-section-heading">
          <div>
            <h2>Attendance Records</h2>

            <p>
              Select a session to view and manage
              student attendance records.
            </p>
          </div>
        </div>

        <div className="attendance-filters-card">
          <div className="attendance-filter search-filter">
            <label htmlFor="attendance-search">
              Search Course
            </label>

            <div className="attendance-search-wrapper">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                aria-hidden="true"
              />

              <input
                id="attendance-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search by course..."
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
                setSelectedClass(
                  event.target.value
                )
              }
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
              <option value="All">All</option>
              <option value="ACTIVE">
                Active
              </option>
              <option value="CLOSED">
                Closed
              </option>
            </select>
          </div>

          <button
            type="button"
            className="attendance-clear-button"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Clear Filters
          </button>
        </div>

        <div className="attendance-table-card">
          {loading ? (
            <div className="attendance-empty-state">
              <div className="attendance-empty-icon">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                />
              </div>

              <h3>
                Loading attendance sessions...
              </h3>

              <p>
                Session information is being loaded
                from the faculty backend.
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="attendance-empty-state">
              <div className="attendance-empty-icon">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>

              <h3>
                No attendance sessions available
              </h3>

              <p>
                Start an attendance session to create
                the first session record.
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="attendance-empty-state compact">
              <div className="attendance-empty-icon">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                />
              </div>

              <h3>
                No matching sessions
              </h3>

              <p>
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.map(
                    (session) => (
                      <tr
                        key={session.session_id}
                        onClick={() =>
                          handleSessionSelect(
                            session
                          )
                        }
                        className={
                          selectedSession?.session_id ===
                          session.session_id
                            ? "selected"
                            : ""
                        }
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <td>
                          {getSessionClassName(
                            session
                          )}
                        </td>

                        <td>
                          {formatDate(
                            session.session_date
                          )}
                        </td>

                        <td>
                          {formatTime(
                            session.start_time
                          )}
                        </td>

                        <td>
                          {formatTime(
                            session.end_time
                          )}
                        </td>

                        <td>
                          <span
                            className={`attendance-status ${
                              session.status?.toLowerCase() ||
                              "unknown"
                            }`}
                          >
                            {session.status ||
                              "N/A"}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="attendance-list-footer">
          <span>
            Showing {filteredSessions.length} of{" "}
            {sessions.length} sessions
          </span>

          <div className="attendance-pagination">
            <button type="button" disabled>
              <FontAwesomeIcon icon={faArrowLeft} />
              Previous
            </button>

            <button
              type="button"
              className="active"
              disabled
            >
              1
            </button>

            <button type="button" disabled>
              Next
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </section>

      {selectedSession && (
        <section className="attendance-records-section">
          <div className="attendance-section-heading">
            <div>
              <h2>Student Attendance</h2>

              <p>
                {getSessionClassName(
                  selectedSession
                )}{" "}
                •{" "}
                {formatDate(
                  selectedSession.session_date
                )}
              </p>
            </div>

            <span
              className={`session-status ${
                selectedSession.status === "ACTIVE"
                  ? "active"
                  : "pending"
              }`}
            >
              {selectedSession.status || "N/A"}
            </span>
          </div>

          {recordsError && (
            <section className="attendance-integration-notice">
              <div className="attendance-notice-icon">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                />
              </div>

              <div>
                <strong>
                  Unable to load attendance records
                </strong>

                <p>{recordsError}</p>
              </div>
            </section>
          )}

          {markAttendanceError && (
            <section className="attendance-integration-notice">
              <div className="attendance-notice-icon">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                />
              </div>

              <div>
                <strong>
                  Unable to mark attendance
                </strong>

                <p>{markAttendanceError}</p>
              </div>
            </section>
          )}

          <div className="attendance-table-card">
            {recordsLoading ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                  />
                </div>

                <h3>
                  Loading student attendance...
                </h3>

                <p>
                  Attendance records are being loaded
                  from the faculty backend.
                </p>
              </div>
            ) : studentsLoading ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                  />
                </div>

                <h3>Loading students...</h3>

                <p>
                  Faculty student information is being
                  loaded.
                </p>
              </div>
            ) : students.length === 0 ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon
                    icon={faUserGraduate}
                  />
                </div>

                <h3>No students available</h3>

                <p>
                  No students are currently assigned
                  to this faculty.
                </p>
              </div>
            ) : (
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Enrollment No.</th>
                      <th>Section</th>
                      <th>Status</th>
                      <th>Marked At</th>
                      <th>Method</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((student) => {
                      const record =
                        attendanceRecordMap.get(
                          String(
                            student.student_id
                          )
                        );

                      const isPresent =
                        record?.status ===
                        "PRESENT";

                      const isMarking =
                        markingStudentId ===
                        student.student_id;

                      return (
                        <tr
                          key={student.student_id}
                        >
                          <td>
                            {getStudentName(
                              student
                            )}
                          </td>

                          <td>
                            {student.enrollment_no ||
                              "N/A"}
                          </td>

                          <td>
                            {student.section ||
                              "N/A"}
                          </td>

                          <td>
                            <span
                              className={`attendance-status ${
                                isPresent
                                  ? "present"
                                  : "unknown"
                              }`}
                            >
                              {getAttendanceStatus(
                                record
                              )}
                            </span>
                          </td>

                          <td>
                            {formatTime(
                              record?.marked_at
                            )}
                          </td>

                          <td>
                            {record?.recognition_method ||
                              "N/A"}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="attendance-outline-button"
                              onClick={() =>
                                handleMarkAttendance(
                                  student.student_id
                                )
                              }
                              disabled={
                                isPresent ||
                                selectedSession.status !==
                                  "ACTIVE" ||
                                isMarking
                              }
                            >
                              {isMarking ? (
                                <>
                                  <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                  />
                                  Marking...
                                </>
                              ) : isPresent ? (
                                <>
                                  <FontAwesomeIcon
                                    icon={faCircleCheck}
                                  />
                                  Present
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon
                                    icon={faUserCheck}
                                  />
                                  Mark Present
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {studentsError && (
            <section className="attendance-integration-notice">
              <div className="attendance-notice-icon">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                />
              </div>

              <div>
                <strong>
                  Student data unavailable
                </strong>

                <p>{studentsError}</p>
              </div>
            </section>
          )}
        </section>
      )}

      {coursesError && (
        <section className="attendance-integration-notice">
          <div className="attendance-notice-icon">
            <FontAwesomeIcon
              icon={faCircleExclamation}
            />
          </div>

          <div>
            <strong>
              Course data unavailable
            </strong>

            <p>{coursesError}</p>
          </div>
        </section>
      )}

      <section className="attendance-integration-notice">
        <div className="attendance-notice-icon">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>

        <div>
          <strong>
            Faculty attendance integration connected
          </strong>

          <p>
            Attendance session creation, active-session
            lookup, session history, session closing,
            attendance record lookup and manual
            attendance marking are connected to the
            Flask faculty attendance API.
            Face-recognition attendance will be
            integrated separately.
          </p>
        </div>
      </section>

      {showStartModal && (
        <div
          className="attendance-modal-backdrop"
          role="presentation"
          onMouseDown={() =>
            setShowStartModal(false)
          }
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
                onClick={() =>
                  setShowStartModal(false)
                }
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="attendance-modal-body">
              <div className="attendance-form-group">
                <label htmlFor="start-class">
                  Course Offering
                </label>

                <select
                  id="start-class"
                  value={selectedOfferingId}
                  onChange={(event) =>
                    setSelectedOfferingId(
                      event.target.value
                    )
                  }
                  disabled={
                    coursesLoading ||
                    courses.length === 0 ||
                    startingSession
                  }
                >
                  {courses.length === 0 ? (
                    <option value="">
                      No course offerings available
                    </option>
                  ) : (
                    courses.map((course) => (
                      <option
                        key={course.offering_id}
                        value={course.offering_id}
                      >
                        {getCourseLabel(course)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="attendance-session-pending">
                <div className="attendance-pending-dot">
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                  />
                </div>

                <div>
                  <strong>
                    Session will start immediately
                  </strong>

                  <p>
                    The selected course offering will
                    receive a new ACTIVE attendance
                    session.
                  </p>
                </div>
              </div>

              {startError && (
                <div className="attendance-session-pending">
                  <div className="attendance-pending-dot">
                    <FontAwesomeIcon
                      icon={faCircleExclamation}
                    />
                  </div>

                  <div>
                    <strong>
                      Unable to start session
                    </strong>

                    <p>{startError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-secondary-button"
                onClick={() =>
                  setShowStartModal(false)
                }
                disabled={startingSession}
              >
                <FontAwesomeIcon icon={faXmark} />
                Cancel
              </button>

              <button
                type="button"
                className="attendance-primary-button"
                onClick={handleStartAttendance}
                disabled={
                  startingSession ||
                  !selectedOfferingId ||
                  courses.length === 0
                }
              >
                {startingSession ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                    />
                    Starting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faCalendar}
                    />
                    Start Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;