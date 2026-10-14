
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  recognizeFacultyAttendance,
  startFacultyAttendanceSession,
} from "../../services/facultyService";

const EMPTY_METRICS = {
  todaySessions: null,
  activeSession: null,
  studentsPresent: null,
  attendanceRate: null,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const getList = (result) =>
  Array.isArray(result?.data) ? result.data : [];

const formatMetric = (value) =>
  value === null || value === undefined ? "N/A" : value;

const formatDate = (value) => {
  if (!value) return "N/A";

  // Handle date-only values without timezone shifts.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));

  const date = dateOnly
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return "N/A";

  // Flask may return a time-only string such as 10:12:00.
  const timeOnly = String(value).match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (timeOnly) {
    const hours = Number(timeOnly[1]);
    const minutes = Number(timeOnly[2]);

    if (hours > 23 || minutes > 59) return String(value);

    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    );
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleTimeString([], {
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
  const name =
    course?.course_name ||
    course?.name ||
    "";

  if (code && name) return `${code} - ${name}`;

  return code || name || `Offering ${course?.offering_id ?? "N/A"}`;
};

const getStudentName = (student) =>
  student?.name ||
  student?.full_name ||
  [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
  "Unknown Student";

const getAttendanceStatus = (record) =>
  record?.status || "NOT MARKED";

const isSameId = (left, right) =>
  left != null && right != null && String(left) === String(right);

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
  const [markAttendanceError, setMarkAttendanceError] = useState("");

  const [markingStudentId, setMarkingStudentId] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [closingSession, setClosingSession] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  const [showFaceAttendance, setShowFaceAttendance] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recognizingFace, setRecognizingFace] = useState(false);
  const [faceAttendanceError, setFaceAttendanceError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recordsRequestRef = useRef(0);
  const recognitionRequestRef = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("All");

  // Stop the camera if this component unmounts.
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  // Attach the active media stream to the video when the modal opens.
  useEffect(() => {
    if (!showFaceAttendance || !cameraStreamRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    video.srcObject = cameraStreamRef.current;
    let cancelled = false;

    const startVideo = async () => {
      try {
        await video.play();

        if (!cancelled) {
          setCameraReady(true);
          setFaceAttendanceError("");
        }
      } catch (playError) {
        if (!cancelled) {
          setCameraReady(false);
          setFaceAttendanceError(
            getErrorMessage(
              playError,
              "Unable to start the camera preview."
            )
          );
        }
      }
    };

    if (video.readyState >= 2) {
      startVideo();
    } else {
      video.addEventListener("loadeddata", startVideo, { once: true });
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", startVideo);
    };
  }, [showFaceAttendance]);

  // Load session history and active session.
  const refreshSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [sessionsResult, activeResult] = await Promise.all([
        getFacultyAttendanceSessions(),
        getActiveFacultyAttendanceSession(),
      ]);

      if (!sessionsResult?.success) {
        throw new Error(
          sessionsResult?.message || "Unable to load attendance sessions."
        );
      }

      if (!activeResult?.success) {
        throw new Error(
          activeResult?.message || "Unable to load the active session."
        );
      }

      const sessionList = getList(sessionsResult);
      const active = activeResult.data || null;

      setSessions(sessionList);
      setActiveSession(active);

      // Keep the selected session status in sync with refreshed session data.
      setSelectedSession((current) => {
        if (!current) return active;

        return (
          sessionList.find((item) =>
            isSameId(item.session_id, current.session_id)
          ) || current
        );
      });
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to load attendance sessions.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  const timerId = setTimeout(() => {
    refreshSessions();
  }, 0);

  return () => clearTimeout(timerId);
}, [refreshSessions]);

  // Load course offerings.
  useEffect(() => {
    let mounted = true;

    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const result = await getFacultyCourses();

        if (!result?.success) {
          throw new Error(result?.message || "Unable to load courses.");
        }

        const courseList = getList(result);
        if (!mounted) return;

        setCourses(courseList);
        setSelectedOfferingId((current) => {
          if (
            current &&
            courseList.some((course) =>
              isSameId(course.offering_id, current)
            )
          ) {
            return current;
          }

          return courseList[0]?.offering_id != null
            ? String(courseList[0].offering_id)
            : "";
        });
      } catch (requestError) {
        if (!mounted) return;
        setCourses([]);
        setCoursesError(
          getErrorMessage(requestError, "Unable to load faculty courses.")
        );
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    };

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  // Load faculty students.
  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      setStudentsLoading(true);
      setStudentsError("");

      try {
        const result = await getFacultyStudents();

        if (!result?.success) {
          throw new Error(result?.message || "Unable to load students.");
        }

        if (mounted) setStudents(getList(result));
      } catch (requestError) {
        if (!mounted) return;

        setStudents([]);
        setStudentsError(
          getErrorMessage(requestError, "Unable to load faculty students.")
        );
      } finally {
        if (mounted) setStudentsLoading(false);
      }
    };

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

  const courseMap = useMemo(
    () =>
      new Map(
        courses.map((course) => [String(course.offering_id), course])
      ),
    [courses]
  );

  const getSessionClassName = useCallback(
    (session) =>
      courseMap.has(String(session?.offering_id))
        ? getCourseLabel(courseMap.get(String(session.offering_id)))
        : `Offering ${session?.offering_id ?? "N/A"}`,
    [courseMap]
  );

  const classOptions = useMemo(() => {
    const labels = sessions
      .map((session) => getSessionClassName(session))
      .filter(Boolean);

    return ["All Classes", ...Array.from(new Set(labels)).sort()];
  }, [sessions, getSessionClassName]);

  const filteredSessions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return sessions.filter((session) => {
      const courseName = getSessionClassName(session);

      return (
        (!query || courseName.toLowerCase().includes(query)) &&
        (selectedClass === "All Classes" || courseName === selectedClass) &&
        (!date || String(session.session_date || "").slice(0, 10) === date) &&
        (status === "All" || session.status === status)
      );
    });
  }, [sessions, searchTerm, selectedClass, date, status, getSessionClassName]);

  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          String(session.session_date || "").slice(0, 10) === getTodayDate()
      ).length,
    [sessions]
  );

  const attendanceRecordMap = useMemo(
    () =>
      new Map(
        attendanceRecords.map((record) => [
          String(record.student_id),
          record,
        ])
      ),
    [attendanceRecords]
  );

  const studentsPresent = useMemo(
    () =>
      attendanceRecords.filter((record) => record.status === "PRESENT").length,
    [attendanceRecords]
  );

  const studentsAbsent = useMemo(
    () =>
      attendanceRecords.filter((record) => record.status === "ABSENT").length,
    [attendanceRecords]
  );

  const attendanceRate = useMemo(() => {
    const totalRecorded = studentsPresent + studentsAbsent;

    if (!selectedSession || totalRecorded === 0) return null;

    return Math.round((studentsPresent / totalRecorded) * 100);
  }, [selectedSession, studentsPresent, studentsAbsent]);

  // The faculty students API must include offering_id for safe course filtering.
  const sessionStudents = useMemo(() => {
    if (!selectedSession) return [];

    return students.filter(
      (student) =>
        student.offering_id != null &&
        isSameId(student.offering_id, selectedSession.offering_id)
    );
  }, [students, selectedSession]);

  const studentEnrollmentScopeAvailable = useMemo(
    () =>
      students.some((student) => student.offering_id != null),
    [students]
  );

  // Load records. Request IDs prevent older responses overwriting newer selections.
  const loadAttendanceRecords = useCallback(async (session) => {
    const requestId = ++recordsRequestRef.current;

    if (!session?.session_id) {
      setSelectedSession(null);
      setAttendanceRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
      return;
    }

    setSelectedSession(session);
    setRecordsLoading(true);
    setRecordsError("");
    setMarkAttendanceError("");
    setAttendanceRecords([]);

    try {
      const result = await getFacultyAttendanceRecords(session.session_id);

      if (requestId !== recordsRequestRef.current) return;

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to load attendance records."
        );
      }

      setAttendanceRecords(getList(result));
    } catch (requestError) {
      if (requestId !== recordsRequestRef.current) return;

      setAttendanceRecords([]);
      setRecordsError(
        getErrorMessage(requestError, "Unable to load attendance records.")
      );
    } finally {
      if (requestId === recordsRequestRef.current) {
        setRecordsLoading(false);
      }
    }
  }, []);

  const handleSessionSelect = (session) => {
    loadAttendanceRecords(session);
  };

  const handleMarkAttendance = async (studentId) => {
    const session = selectedSession;

    if (!session?.session_id) {
      setMarkAttendanceError("Select an attendance session first.");
      return;
    }

    if (session.status !== "ACTIVE") {
      setMarkAttendanceError(
        "Attendance can only be marked for an active session."
      );
      return;
    }

    if (attendanceRecordMap.has(String(studentId))) {
      setMarkAttendanceError(
        "An attendance record already exists for this student."
      );
      return;
    }

    setMarkingStudentId(studentId);
    setMarkAttendanceError("");

    try {
      const result = await markFacultyAttendance(session.session_id, {
        student_id: studentId,
        recognition_method: "MANUAL",
      });

      if (!result?.success || !result.data) {
        throw new Error(result?.message || "Unable to mark attendance.");
      }

      setAttendanceRecords((current) => {
        const exists = current.some((record) =>
          isSameId(record.student_id, result.data.student_id)
        );

        return exists
          ? current.map((record) =>
              isSameId(record.student_id, result.data.student_id)
                ? result.data
                : record
            )
          : [...current, result.data];
      });
    } catch (requestError) {
      setMarkAttendanceError(
        getErrorMessage(requestError, "Unable to mark attendance.")
      );
    } finally {
      setMarkingStudentId(null);
    }
  };

  const handleStartFaceAttendance = async () => {
    const session = activeSession || selectedSession;

    if (!session?.session_id) {
      setFaceAttendanceError("Start or select an attendance session first.");
      return;
    }

    if (session.status !== "ACTIVE") {
      setFaceAttendanceError(
        "Face attendance is available only for active sessions."
      );
      return;
    }

    if (selectedSession?.session_id !== session.session_id) {
      await loadAttendanceRecords(session);
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setFaceAttendanceError(
        "Camera access is unavailable. Use HTTPS or localhost in a supported browser."
      );
      return;
    }

    setFaceAttendanceError("");
    setCameraReady(false);

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setShowFaceAttendance(true);
    } catch (cameraError) {
      setFaceAttendanceError(
        cameraError?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser settings."
          : getErrorMessage(
              cameraError,
              "Unable to access the camera. Check that it is connected and not being used by another application."
            )
      );
    }
  };

  const handleCloseFaceAttendance = () => {
    stopCamera();
    recognitionRequestRef.current = false;
    setRecognizingFace(false);
    setFaceAttendanceError("");
    setShowFaceAttendance(false);
  };

  const handleRecognizeFace = async () => {
    const session = activeSession || selectedSession;

    if (!session?.session_id || session.status !== "ACTIVE") {
      setFaceAttendanceError("An active attendance session is required.");
      return;
    }

    if (
      recognitionRequestRef.current ||
      !cameraReady ||
      !videoRef.current ||
      !canvasRef.current
    ) {
      if (!cameraReady) {
        setFaceAttendanceError("Camera is not ready. Please wait and try again.");
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setFaceAttendanceError("The camera has not produced a usable frame yet.");
      return;
    }

    recognitionRequestRef.current = true;
    setRecognizingFace(true);
    setFaceAttendanceError("");

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to capture the camera frame.");

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("Unable to create an image from the camera frame.")),
          "image/jpeg",
          0.9
        );
      });

      const result = await recognizeFacultyAttendance(
        session.session_id,
        imageBlob
      );

      // Recognition may return HTTP 200 with success:false.
      if (!result?.success || !result.data) {
        const detail = result?.data?.status
          ? ` (${result.data.status})`
          : "";

        throw new Error(
          `${result?.message || "Face recognition did not identify a student."}${detail}`
        );
      }

      setAttendanceRecords((current) => {
        const exists = current.some((record) =>
          isSameId(record.student_id, result.data.student_id)
        );

        return exists
          ? current.map((record) =>
              isSameId(record.student_id, result.data.student_id)
                ? result.data
                : record
            )
          : [...current, result.data];
      });

      handleCloseFaceAttendance();
    } catch (requestError) {
      setFaceAttendanceError(
        getErrorMessage(requestError, "Face recognition failed. Please try again.")
      );
    } finally {
      recognitionRequestRef.current = false;
      setRecognizingFace(false);
    }
  };

  const handleStartAttendance = async () => {
    if (!selectedOfferingId) {
      setStartError("Please select a course before starting attendance.");
      return;
    }

    setStartingSession(true);
    setStartError("");

    try {
      const result = await startFacultyAttendanceSession(
        Number(selectedOfferingId)
      );

      if (!result?.success || !result.data) {
        throw new Error(result?.message || "Unable to start attendance session.");
      }

      const newSession = result.data;

      setSessions((current) => [
        newSession,
        ...current.filter(
          (session) => !isSameId(session.session_id, newSession.session_id)
        ),
      ]);

      setActiveSession(newSession);
      setSelectedSession(newSession);
      setAttendanceRecords([]);
      setRecordsError("");
      setMarkAttendanceError("");
      setShowStartModal(false);
    } catch (requestError) {
      setStartError(
        getErrorMessage(requestError, "Unable to start attendance session.")
      );
    } finally {
      setStartingSession(false);
    }
  };

  const handleCloseAttendance = async () => {
    if (!activeSession?.session_id) return;

    setClosingSession(true);
    setCloseError("");

    try {
      const result = await closeFacultyAttendanceSession(
        activeSession.session_id
      );

      if (!result?.success) {
        throw new Error(result?.message || "Unable to close attendance session.");
      }

      const closedSession = result.data || {
        ...activeSession,
        status: "CLOSED",
      };

      setSessions((current) =>
        current.map((session) =>
          isSameId(session.session_id, closedSession.session_id)
            ? { ...session, ...closedSession, status: "CLOSED" }
            : session
        )
      );

      setActiveSession(null);

      // Reload after closing so backend-generated ABSENT records are included.
      await loadAttendanceRecords({
        ...closedSession,
        status: "CLOSED",
      });
    } catch (requestError) {
      setCloseError(
        getErrorMessage(requestError, "Unable to close attendance session.")
      );
    } finally {
      setClosingSession(false);
    }
  };

  const handleOpenStartModal = () => {
    setStartError("");

    if (!selectedOfferingId && courses.length > 0) {
      setSelectedOfferingId(String(courses[0].offering_id));
    }

    setShowStartModal(true);
  };

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
      value: formatMetric(loading ? EMPTY_METRICS.todaySessions : todaySessions),
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
        recordsLoading
          ? null
          : selectedSession
            ? studentsPresent
            : EMPTY_METRICS.studentsPresent
      ),
      tone: "green",
      icon: faUserCheck,
    },
    {
      label: "Attendance Rate",
      value: recordsLoading
        ? "…"
        : attendanceRate === null
          ? "N/A"
          : `${attendanceRate}%`,
      tone: "orange",
      icon: faChartLine,
    },
  ];

  return (
    <div className="faculty-attendance-page">
      <section className="attendance-page-header">
        <div>
          <span className="attendance-eyebrow">FACULTY PORTAL</span>
          <h1>Attendance</h1>
          <p>
            Conduct attendance sessions, monitor attendance records and review
            attendance for your assigned classes.
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
          <article className="attendance-metric-card" key={metric.label}>
            <div className={`attendance-metric-icon ${metric.tone}`}>
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
        <section className="attendance-integration-notice" role="alert">
          <div className="attendance-notice-icon">
            <FontAwesomeIcon icon={faCircleExclamation} />
          </div>
          <div>
            <strong>Unable to load attendance sessions</strong>
            <p>{error}</p>
            <button
              type="button"
              className="attendance-outline-button"
              onClick={refreshSessions}
            >
              <FontAwesomeIcon icon={faRotateRight} />
              Retry
            </button>
          </div>
        </section>
      )}

      <section className="active-attendance-card">
        <div className="active-attendance-heading">
          <div>
            <h2>Active Attendance</h2>
            <p>Current attendance session status.</p>
          </div>
          <span className={`session-status ${activeSession ? "active" : "pending"}`}>
            {activeSession ? "Active Session" : "No Active Session"}
          </span>
        </div>

        {activeSession ? (
          <div className="active-attendance-empty">
            <div className="active-attendance-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <h3>{getSessionClassName(activeSession)}</h3>
            <p>
              Session started at {formatTime(activeSession.start_time)} on{" "}
              {formatDate(activeSession.session_date)}.
            </p>

            {closeError && <p className="attendance-error-text">{closeError}</p>}
            {faceAttendanceError && !showFaceAttendance && (
              <p className="attendance-error-text">{faceAttendanceError}</p>
            )}

            <div className="attendance-action-row">
              <button
                type="button"
                className="attendance-outline-button"
                onClick={handleCloseAttendance}
                disabled={closingSession}
              >
                {closingSession ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Closing Session...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faXmark} />
                    Close Attendance
                  </>
                )}
              </button>

              <button
                type="button"
                className="attendance-primary-button"
                onClick={handleStartFaceAttendance}
                disabled={closingSession || showFaceAttendance}
              >
                <FontAwesomeIcon icon={faUserCheck} />
                Face Attendance
              </button>
            </div>
          </div>
        ) : (
          <div className="active-attendance-empty">
            <div className="active-attendance-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>
            <h3>No attendance session is currently active</h3>
            <p>Start an attendance session for one of your assigned course offerings.</p>
            <button
              type="button"
              className="attendance-outline-button"
              onClick={handleOpenStartModal}
              disabled={coursesLoading || courses.length === 0}
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
            <p>Select a session to view and manage student attendance records.</p>
          </div>
        </div>

        <div className="attendance-filters-card">
          <div className="attendance-filter search-filter">
            <label htmlFor="attendance-search">Search Course</label>
            <div className="attendance-search-wrapper">
              <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
              <input
                id="attendance-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by course..."
              />
            </div>
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-class">Class</label>
            <select
              id="attendance-class"
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

          <div className="attendance-filter">
            <label htmlFor="attendance-date">Date</label>
            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="attendance-filter">
            <label htmlFor="attendance-status">Status</label>
            <select
              id="attendance-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="All">All</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
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
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
              <h3>Loading attendance sessions...</h3>
              <p>Session information is being loaded from the faculty backend.</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="attendance-empty-state">
              <div className="attendance-empty-icon">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <h3>No attendance sessions available</h3>
              <p>Start an attendance session to create the first session record.</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="attendance-empty-state compact">
              <div className="attendance-empty-icon">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </div>
              <h3>No matching sessions</h3>
              <p>Try changing your search or filters.</p>
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
                  {filteredSessions.map((session) => (
                    <tr
                      key={session.session_id}
                      onClick={() => handleSessionSelect(session)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSessionSelect(session);
                        }
                      }}
                      tabIndex={0}
                      aria-selected={isSameId(
                        selectedSession?.session_id,
                        session.session_id
                      )}
                      className={
                        isSameId(selectedSession?.session_id, session.session_id)
                          ? "selected"
                          : ""
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>{getSessionClassName(session)}</td>
                      <td>{formatDate(session.session_date)}</td>
                      <td>{formatTime(session.start_time)}</td>
                      <td>{formatTime(session.end_time)}</td>
                      <td>
                        <span
                          className={`attendance-status ${
                            session.status?.toLowerCase() || "unknown"
                          }`}
                        >
                          {session.status || "N/A"}
                        </span>
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
            Showing {filteredSessions.length} of {sessions.length} sessions
          </span>
          <div className="attendance-pagination">
            <button type="button" disabled aria-label="Previous page">
              <FontAwesomeIcon icon={faArrowLeft} />
              Previous
            </button>
            <button type="button" className="active" disabled>
              1
            </button>
            <button type="button" disabled aria-label="Next page">
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
                {getSessionClassName(selectedSession)} •{" "}
                {formatDate(selectedSession.session_date)}
              </p>
            </div>
            <span
              className={`session-status ${
                selectedSession.status === "ACTIVE" ? "active" : "pending"
              }`}
            >
              {selectedSession.status || "N/A"}
            </span>
          </div>

          {recordsError && (
            <section className="attendance-integration-notice" role="alert">
              <div className="attendance-notice-icon">
                <FontAwesomeIcon icon={faCircleExclamation} />
              </div>
              <div>
                <strong>Unable to load attendance records</strong>
                <p>{recordsError}</p>
                <button
                  type="button"
                  className="attendance-outline-button"
                  onClick={() => loadAttendanceRecords(selectedSession)}
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  Retry
                </button>
              </div>
            </section>
          )}

          {markAttendanceError && (
            <section className="attendance-integration-notice" role="alert">
              <div className="attendance-notice-icon">
                <FontAwesomeIcon icon={faCircleExclamation} />
              </div>
              <div>
                <strong>Unable to mark attendance</strong>
                <p>{markAttendanceError}</p>
              </div>
            </section>
          )}

          <div className="attendance-table-card">
            {recordsLoading || studentsLoading ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon icon={faSpinner} spin />
                </div>
                <h3>
                  {recordsLoading
                    ? "Loading student attendance..."
                    : "Loading students..."}
                </h3>
                <p>Information is being loaded from the faculty backend.</p>
              </div>
            ) : studentsError ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon icon={faCircleExclamation} />
                </div>
                <h3>Student data unavailable</h3>
                <p>{studentsError}</p>
              </div>
            ) : !studentEnrollmentScopeAvailable ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon icon={faUserGraduate} />
                </div>
                <h3>Course enrollment data is required</h3>
                <p>
                  The faculty students endpoint does not provide offering IDs.
                  To safely display students for this course, update the backend
                  to return students enrolled in this specific offering. The
                  component will not assume every faculty student is enrolled
                  in every course.
                </p>
              </div>
            ) : sessionStudents.length === 0 ? (
              <div className="attendance-empty-state">
                <div className="attendance-empty-icon">
                  <FontAwesomeIcon icon={faUserGraduate} />
                </div>
                <h3>No enrolled students found</h3>
                <p>
                  No students with this course offering ID were returned by the
                  faculty students endpoint.
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
                    {sessionStudents.map((student) => {
                      const record = attendanceRecordMap.get(
                        String(student.student_id)
                      );
                      const isPresent = record?.status === "PRESENT";
                      const hasRecord = Boolean(record);
                      const isMarking = isSameId(
                        markingStudentId,
                        student.student_id
                      );

                      return (
                        <tr key={student.student_id}>
                          <td>{getStudentName(student)}</td>
                          <td>{student.enrollment_no || "N/A"}</td>
                          <td>{student.section || "N/A"}</td>
                          <td>
                            <span
                              className={`attendance-status ${
                                record?.status?.toLowerCase() || "unknown"
                              }`}
                            >
                              {getAttendanceStatus(record)}
                            </span>
                          </td>
                          <td>{formatTime(record?.marked_at)}</td>
                          <td>{record?.recognition_method || "N/A"}</td>
                          <td>
                            <button
                              type="button"
                              className="attendance-outline-button"
                              onClick={() =>
                                handleMarkAttendance(student.student_id)
                              }
                              disabled={
                                hasRecord ||
                                selectedSession.status !== "ACTIVE" ||
                                isMarking
                              }
                            >
                              {isMarking ? (
                                <>
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                  Marking...
                                </>
                              ) : isPresent ? (
                                <>
                                  <FontAwesomeIcon icon={faCircleCheck} />
                                  Present
                                </>
                              ) : hasRecord ? (
                                "Already Recorded"
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faUserCheck} />
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
        </section>
      )}

      {coursesError && (
        <section className="attendance-integration-notice" role="alert">
          <div className="attendance-notice-icon">
            <FontAwesomeIcon icon={faCircleExclamation} />
          </div>
          <div>
            <strong>Course data unavailable</strong>
            <p>{coursesError}</p>
          </div>
        </section>
      )}

      <section className="attendance-integration-notice">
        <div className="attendance-notice-icon">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>
        <div>
          <strong>Faculty attendance services connected</strong>
          <p>
            Session management, attendance records, manual attendance marking,
            and face-recognition requests use the Flask API. Face recognition
            requires an active session and a registered student face profile.
          </p>
        </div>
      </section>

      {showFaceAttendance && (
        <div
          className="attendance-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !recognizingFace
            ) {
              handleCloseFaceAttendance();
            }
          }}
        >
          <div
            className="attendance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="face-attendance-title"
          >
            <div className="attendance-modal-header">
              <div>
                <h2 id="face-attendance-title">Face Attendance</h2>
                <p>
                  Position one student in front of the camera and capture
                  their face.
                </p>
              </div>
              <button
                type="button"
                className="attendance-modal-close"
                onClick={handleCloseFaceAttendance}
                disabled={recognizingFace}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="attendance-modal-body">
              <div className="attendance-camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="attendance-camera-video"
                />
                <canvas
                  ref={canvasRef}
                  className="attendance-camera-canvas"
                  aria-hidden="true"
                />
              </div>

              {faceAttendanceError && (
                <div className="attendance-session-pending" role="alert">
                  <div className="attendance-pending-dot">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                  </div>
                  <div>
                    <strong>Face recognition unavailable</strong>
                    <p>{faceAttendanceError}</p>
                  </div>
                </div>
              )}

              {!cameraReady && !faceAttendanceError && (
                <p className="attendance-camera-help">Starting camera...</p>
              )}

              {cameraReady && !faceAttendanceError && (
                <p className="attendance-camera-help">
                  Camera ready. Make sure exactly one student is visible
                  before capturing.
                </p>
              )}
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-secondary-button"
                onClick={handleCloseFaceAttendance}
                disabled={recognizingFace}
              >
                <FontAwesomeIcon icon={faXmark} />
                Cancel
              </button>
              <button
                type="button"
                className="attendance-primary-button"
                onClick={handleRecognizeFace}
                disabled={!cameraReady || recognizingFace}
              >
                {recognizingFace ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Recognizing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserCheck} />
                    Capture & Recognize
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStartModal && (
        <div
          className="attendance-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !startingSession
            ) {
              setShowStartModal(false);
            }
          }}
        >
          <div
            className="attendance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-attendance-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="attendance-modal-header">
              <div>
                <span className="attendance-eyebrow">ATTENDANCE</span>
                <h2 id="start-attendance-title">Start Attendance</h2>
              </div>
              <button
                type="button"
                className="attendance-modal-close"
                onClick={() => setShowStartModal(false)}
                disabled={startingSession}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="attendance-modal-body">
              <div className="attendance-form-group">
                <label htmlFor="start-class">Course Offering</label>
                <select
                  id="start-class"
                  value={selectedOfferingId}
                  onChange={(event) =>
                    setSelectedOfferingId(event.target.value)
                  }
                  disabled={
                    coursesLoading || courses.length === 0 || startingSession
                  }
                >
                  {courses.length === 0 ? (
                    <option value="">No course offerings available</option>
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
                  <FontAwesomeIcon icon={faCircleInfo} />
                </div>
                <div>
                  <strong>Session will start immediately</strong>
                  <p>
                    The selected course offering will receive a new ACTIVE
                    attendance session.
                  </p>
                </div>
              </div>

              {startError && (
                <div className="attendance-session-pending" role="alert">
                  <div className="attendance-pending-dot">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                  </div>
                  <div>
                    <strong>Unable to start session</strong>
                    <p>{startError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-secondary-button"
                onClick={() => setShowStartModal(false)}
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
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Starting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCalendar} />
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
