import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCalendar,
  faCamera,
  faChartLine,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faClock,
  faMagnifyingGlass,
  faRotateRight,
  faSpinner,
  faUserCheck,
  faUsers,
  faXmark,
  faBolt,
  faFileLines,
  faPlay,
  faPause,
} from "@fortawesome/free-solid-svg-icons";

import "./Attendance.css";

import {
  closeFacultyAttendanceSession,
  getActiveFacultyAttendanceSession,
  getFacultyAttendanceOverview,
  getFacultyAttendanceRecords,
  getFacultyAttendanceSessions,
  getFacultyCourses,
  getFacultyStudents,
  getFacultyTimetable,
  getSystemHealth,
  recognizeFacultyAttendance,
  startFacultyAttendanceSession,
} from "../../services/facultyService";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getList = (result) =>
  Array.isArray(result?.data) ? result.data : [];

const isSameId = (left, right) =>
  left != null && right != null && String(left) === String(right);

const formatDate = (value) => {
  if (!value) return "N/A";

  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00`)
    : new Date(text);

  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return "N/A";

  const text = String(value);
  const timeOnly = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (timeOnly) {
    const hours = Number(timeOnly[1]);
    const minutes = Number(timeOnly[2]);

    if (hours > 23 || minutes > 59) return text;

    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    );
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? text
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getTodayDate = () => {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

const getCourseLabel = (course) => {
  const code = course?.course_code || "";
  const name = course?.course_name || course?.name || "";

  if (code && name) return `${code} – ${name}`;

  return code || name || `Offering ${course?.offering_id ?? "N/A"}`;
};

const getStudentName = (student) =>
  student?.name ||
  student?.full_name ||
  [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
  "Unknown Student";

const getAttendanceStatus = (record) =>
  record?.status || "NOT MARKED";

const getInitials = (name) =>
  String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

function Attendance() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [systemHealth, setSystemHealth] = useState({
    loading: true,
    connected: false,
    message: "",
  });

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
  const [faceAttendanceError, setFaceAttendanceError] = useState("");

  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  const [showFaceAttendance, setShowFaceAttendance] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [recognizingFace, setRecognizingFace] = useState(false);
  const [autoScanActive, setAutoScanActive] = useState(true);
  const [lastRecognizedStudent, setLastRecognizedStudent] = useState(null);
  const [recentDetections, setRecentDetections] = useState([]);
  const [scanStatusMessage, setScanStatusMessage] = useState("Looking for students…");

  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("All");
  const [activeTab, setActiveTab] = useState("attendance");
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const recordsRequestRef = useRef(0);
  const recognitionRequestRef = useRef(false);
  const selectedSessionRef = useRef(null);

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

  const checkSystemHealth = useCallback(async () => {
    setSystemHealth((prev) => ({ ...prev, loading: true }));
    try {
      const res = await getSystemHealth();
      if (res?.database === "ok") {
        setSystemHealth({
          loading: false,
          connected: true,
          message: "Database & Backend Connected",
        });
      } else {
        setSystemHealth({
          loading: false,
          connected: false,
          message: res?.message || "Database connection degraded",
        });
      }
    } catch (err) {
      setSystemHealth({
        loading: false,
        connected: false,
        message: getErrorMessage(err, "Backend connection failed"),
      });
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadHealth() {
      try {
        const res = await getSystemHealth();
        if (isCancelled) return;
        if (res?.database === "ok") {
          setSystemHealth({
            loading: false,
            connected: true,
            message: "Database & Backend Connected",
          });
        } else {
          setSystemHealth({
            loading: false,
            connected: false,
            message: res?.message || "Database connection degraded",
          });
        }
      } catch (err) {
        if (isCancelled) return;
        setSystemHealth({
          loading: false,
          connected: false,
          message: getErrorMessage(err, "Backend connection failed"),
        });
      }
    }

    loadHealth();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    const loadTimetable = async () => {
      setTimetableLoading(true);
      setTimetableError("");
      try {
        const result = await getFacultyTimetable();
        if (!result?.success) {
          throw new Error(
            result?.message || "Unable to load the faculty timetable."
          );
        }
        if (mounted) {
          setTimetableEntries(
            Array.isArray(result.data) ? result.data : []
          );
        }
      } catch (err) {
        if (mounted) {
          setTimetableError(
            getErrorMessage(err, "Unable to load the timetable.")
          );
        }
      } finally {
        if (mounted) {
          setTimetableLoading(false);
        }
      }
    };
    loadTimetable();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!showFaceAttendance || !cameraStreamRef.current || !videoRef.current) {
      return undefined;
    }

    const video = videoRef.current;
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
            getErrorMessage(playError, "Unable to start the camera preview.")
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

  // Automated real-time face recognition scanner loop
  useEffect(() => {
    if (!showFaceAttendance || !cameraReady || !autoScanActive) {
      return undefined;
    }

    const session = activeSession || selectedSession;
    if (!session || session.status !== "ACTIVE") {
      return undefined;
    }

    let isCancelled = false;
    let timerId = null;

    const performScanCycle = async () => {
      if (
        isCancelled ||
        recognitionRequestRef.current ||
        !videoRef.current ||
        !canvasRef.current
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
        timerId = setTimeout(performScanCycle, 500);
        return;
      }

      recognitionRequestRef.current = true;
      setRecognizingFace(true);

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(
              (blob) => (blob ? resolve(blob) : reject(new Error("Unable to capture frame"))),
              "image/jpeg",
              0.88
            );
          });

          if (!isCancelled) {
            const result = await recognizeFacultyAttendance(session.session_id, imageBlob);

            if (!isCancelled && result?.success) {
              const recognizedList = Array.isArray(result.recognized)
                ? result.recognized
                : result.data
                ? [result.data]
                : [];

              if (recognizedList.length > 0) {
                // Update local attendance records state
                setAttendanceRecords((current) => {
                  let updated = [...current];
                  for (const rec of recognizedList) {
                    if (rec.student_id) {
                      const idx = updated.findIndex((item) => isSameId(item.student_id, rec.student_id));
                      if (idx >= 0) {
                        updated[idx] = { ...updated[idx], ...rec };
                      } else {
                        updated.push(rec);
                      }
                    }
                  }
                  return updated;
                });

                const firstStudent = recognizedList[0];
                setLastRecognizedStudent(firstStudent);
                setScanStatusMessage(
                  firstStudent.is_new
                    ? `✅ Marked: ${firstStudent.name || firstStudent.student_name} (${firstStudent.enrollment_no})`
                    : `ℹ️ ${firstStudent.name || firstStudent.student_name} — Already Present`
                );

                setRecentDetections((prev) => {
                  const items = [...recognizedList, ...prev];
                  const seen = new Set();
                  const deduplicated = [];
                  for (const item of items) {
                    if (item.student_id && !seen.has(item.student_id)) {
                      seen.add(item.student_id);
                      deduplicated.push(item);
                    }
                  }
                  return deduplicated.slice(0, 6);
                });
              } else if (result.status === "no_face") {
                setScanStatusMessage("Scanning for students…");
              } else if (result.status === "not_recognized") {
                setScanStatusMessage("Face detected — verifying identity…");
              }
            }
          }
        }
      } catch (scanError) {
        if (scanError?.response?.status === 401 || scanError?.response?.status === 403) {
          setScanStatusMessage("Session expired — please refresh or log in again.");
        } else {
          console.debug("Live auto-scan error:", scanError?.message);
        }
      } finally {
        recognitionRequestRef.current = false;
        if (!isCancelled) {
          setRecognizingFace(false);
          timerId = setTimeout(performScanCycle, 850);
        }
      }
    };

    timerId = setTimeout(performScanCycle, 400);

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      recognitionRequestRef.current = false;
      setRecognizingFace(false);
    };
  }, [showFaceAttendance, cameraReady, autoScanActive, activeSession, selectedSession]);

  const loadAttendanceRecords = useCallback(async (session) => {
    const requestId = ++recordsRequestRef.current;

    if (!session?.session_id) {
      selectedSessionRef.current = null;
      setSelectedSession(null);
      setAttendanceRecords([]);
      setRecordsError("");
      setRecordsLoading(false);
      return;
    }

    selectedSessionRef.current = session;
    setSelectedSession(session);
    setRecordsLoading(true);
    setRecordsError("");

    try {
      const [recordsResult, overviewResult, studentsResult] = await Promise.all([
        getFacultyAttendanceRecords(session.session_id),
        getFacultyAttendanceOverview({ session_id: session.session_id }),
        session.offering_id
          ? getFacultyStudents({ offering_id: session.offering_id })
          : Promise.resolve(null),
      ]);

      if (requestId !== recordsRequestRef.current) return;

      if (!recordsResult?.success) {
        throw new Error(
          recordsResult?.message || "Unable to load attendance records."
        );
      }

      setAttendanceRecords(getList(recordsResult));

      if (overviewResult?.success && overviewResult?.data) {
        setOverviewData(overviewResult.data);
      }

      if (studentsResult?.success && Array.isArray(studentsResult.data)) {
        setStudents((prev) => {
          const incoming = studentsResult.data;
          const map = new Map(prev.map((s) => [String(s.student_id), s]));
          for (const s of incoming) {
            map.set(String(s.student_id), s);
          }
          return Array.from(map.values());
        });
      }
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

  const refreshSessions = useCallback(async (preserveSessionId = null) => {
    setLoading(true);
    setError("");

    try {
      const targetId = preserveSessionId || selectedSessionRef.current?.session_id;
      const [sessionsResult, activeResult, overviewResult] = await Promise.all([
        getFacultyAttendanceSessions(),
        getActiveFacultyAttendanceSession(),
        getFacultyAttendanceOverview(targetId ? { session_id: targetId } : {}),
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

      if (overviewResult?.success && overviewResult?.data) {
        setOverviewData(overviewResult.data);
      }

      // Determine target session synchronously
      let target = null;
      if (targetId) {
        target = sessionList.find((item) => isSameId(item.session_id, targetId)) || null;
      }
      if (!target) {
        target = active || sessionList[0] || null;
      }

      selectedSessionRef.current = target;
      setSelectedSession(target);

      if (target?.session_id) {
        await loadAttendanceRecords(target);
      } else {
        setAttendanceRecords([]);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to load attendance sessions.")
      );
    } finally {
      setLoading(false);
    }
  }, [loadAttendanceRecords]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      void refreshSessions();
    }, 0);

    return () => clearTimeout(timerId);
  }, [refreshSessions]);

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

  const offeringIdToLoad = selectedSession?.offering_id || activeSession?.offering_id || null;

  useEffect(() => {
    let mounted = true;
    if (!offeringIdToLoad) return undefined;

    const loadOfferingStudents = async () => {
      try {
        const result = await getFacultyStudents({ offering_id: offeringIdToLoad });
        if (mounted && result?.success && Array.isArray(result.data)) {
          setStudents((prev) => {
            const incoming = result.data;
            const map = new Map(prev.map((s) => [String(s.student_id), s]));
            for (const s of incoming) {
              map.set(String(s.student_id), s);
            }
            return Array.from(map.values());
          });
        }
      } catch {
        // gracefully handle
      }
    };

    loadOfferingStudents();

    return () => {
      mounted = false;
    };
  }, [offeringIdToLoad]);

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
      .map(getSessionClassName)
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
  }, [
    sessions,
    searchTerm,
    selectedClass,
    date,
    status,
    getSessionClassName,
  ]);

  const todaySessions = useMemo(() => {
    if (overviewData?.today_sessions != null) {
      return overviewData.today_sessions;
    }
    const today = getTodayDate();
    return sessions.filter(
      (session) => String(session.session_date || "").slice(0, 10) === today
    ).length;
  }, [overviewData, sessions]);

  const activeSessionsCount = useMemo(() => {
    if (overviewData?.active_sessions != null) {
      return overviewData.active_sessions;
    }
    return activeSession ? 1 : 0;
  }, [overviewData, activeSession]);

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

  const displayedRecentDetections = useMemo(() => {
    if (recentDetections.length > 0) return recentDetections;
    return attendanceRecords
      .filter((r) => r.status === "PRESENT" || r.status === "LATE")
      .sort((a, b) => new Date(b.marked_at) - new Date(a.marked_at))
      .slice(0, 6)
      .map((r) => {
        const student = students.find((s) => isSameId(s.student_id, r.student_id));
        return {
          student_id: r.student_id,
          name: student ? getStudentName(student) : (r.student_name || `Student #${r.student_id}`),
          marked_at: r.marked_at,
          recognition_method: r.recognition_method,
        };
      });
  }, [recentDetections, attendanceRecords, students]);

  const studentsPresent = useMemo(() => {
    if (
      overviewData?.students_present != null &&
      isSameId(overviewData?.selected_session?.session_id, selectedSession?.session_id)
    ) {
      return overviewData.students_present;
    }
    return attendanceRecords.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
  }, [overviewData, selectedSession, attendanceRecords]);

  const sessionStudents = useMemo(() => {
    if (!selectedSession) return [];

    const enrolled = students.filter(
      (student) =>
        (student.offering_id != null &&
          isSameId(student.offering_id, selectedSession.offering_id)) ||
        (Array.isArray(student.offering_ids) &&
          student.offering_ids.some((id) =>
            isSameId(id, selectedSession.offering_id)
          ))
    );

    const studentIdMap = new Map(enrolled.map((s) => [String(s.student_id), s]));
    for (const rec of attendanceRecords) {
      if (rec.student_id && !studentIdMap.has(String(rec.student_id))) {
        const studentObj = students.find((s) => isSameId(s.student_id, rec.student_id)) || {
          student_id: rec.student_id,
          name: rec.student_name || `Student #${rec.student_id}`,
          enrollment_no: rec.enrollment_no || "N/A",
          offering_id: selectedSession.offering_id,
        };
        enrolled.push(studentObj);
        studentIdMap.set(String(rec.student_id), studentObj);
      }
    }

    return enrolled;
  }, [students, selectedSession, attendanceRecords]);

  const unrecordedStudentsCount = useMemo(() => {
    if (!selectedSession) return 0;
    return Math.max(0, sessionStudents.length - studentsPresent);
  }, [selectedSession, sessionStudents.length, studentsPresent]);

  const studentsAbsent = useMemo(() => {
    if (
      overviewData?.students_absent != null &&
      isSameId(overviewData?.selected_session?.session_id, selectedSession?.session_id)
    ) {
      if (selectedSession?.status === "ACTIVE") {
        return unrecordedStudentsCount;
      }
      return overviewData.students_absent;
    }
    if (selectedSession?.status === "ACTIVE") {
      return unrecordedStudentsCount;
    }
    return attendanceRecords.filter((record) => record.status === "ABSENT").length;
  }, [overviewData, selectedSession, unrecordedStudentsCount, attendanceRecords]);

  const attendanceRate = useMemo(() => {
    if (
      overviewData?.attendance_rate != null &&
      isSameId(overviewData?.selected_session?.session_id, selectedSession?.session_id)
    ) {
      return overviewData.attendance_rate;
    }
    const total = studentsPresent + studentsAbsent;

    if (!selectedSession || total === 0) return null;

    return Math.round((studentsPresent / total) * 100);
  }, [overviewData, selectedSession, studentsPresent, studentsAbsent]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return sessionStudents.filter((student) => {
      const record = attendanceRecordMap.get(String(student.student_id));
      const name = getStudentName(student).toLowerCase();
      const enrollment = String(student.enrollment_no || "").toLowerCase();

      return (
        !query ||
        name.includes(query) ||
        enrollment.includes(query) ||
        String(student.student_id).includes(query) ||
        String(record?.status || "").toLowerCase().includes(query)
      );
    });
  }, [sessionStudents, studentSearch, attendanceRecordMap]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);
  const handleSessionSelect = (session) => {
    void loadAttendanceRecords(session);
    setActiveTab("attendance");
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

    if (
      !isSameId(selectedSession?.session_id, session.session_id)
    ) {
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
    setScanStatusMessage("Camera stopped");
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
        throw new Error(
          result?.message || "Unable to start attendance session."
        );
      }

      const newSession = result.data;

      setSessions((current) => [
        newSession,
        ...current.filter(
          (session) => !isSameId(session.session_id, newSession.session_id)
        ),
      ]);

      setActiveSession(newSession);
      selectedSessionRef.current = newSession;
      setSelectedSession(newSession);
      setAttendanceRecords([]);
      setRecordsError("");
      setShowStartModal(false);

      await loadAttendanceRecords(newSession);
      void refreshSessions(newSession.session_id);
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
        throw new Error(
          result?.message || "Unable to close attendance session."
        );
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
      stopCamera();
      setShowFaceAttendance(false);

      await loadAttendanceRecords({
        ...closedSession,
        status: "CLOSED",
      });
      void refreshSessions(closedSession.session_id);
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
      value: loading ? "…" : todaySessions,
      note: "From session history",
      icon: faCalendar,
      tone: "blue",
    },
    {
      label: "Students Present",
      value: recordsLoading
        ? "…"
        : selectedSession
          ? studentsPresent
          : "N/A",
      note: selectedSession
        ? "Selected session"
        : "Select a session",
      icon: faCircleCheck,
      tone: "green",
    },
    {
      label: "Students Absent",
      value: recordsLoading
        ? "…"
        : selectedSession
          ? selectedSession.status === "ACTIVE"
            ? unrecordedStudentsCount
            : studentsAbsent
          : "N/A",
      note: selectedSession
        ? selectedSession.status === "ACTIVE"
          ? "Unmarked in progress"
          : "Selected session"
        : "Select a session",
      icon: faUsers,
      tone: "pink",
    },
    {
      label: "Active Sessions",
      value: loading ? "…" : activeSessionsCount,
      note: activeSession ? "Currently active" : "No active session",
      icon: faClock,
      tone: "purple",
    },
  ];

  const displayStudents = activeTab === "attendance"
    ? paginatedStudents
    : [];

  return (
    <div className="faculty-attendance-page attendance-dashboard-layout">
      <main className="attendance-main-column">
        <header className="attendance-page-header">
          <div>
            <span className="attendance-eyebrow">FACULTY WORKSPACE</span>
            <h1>Attendance</h1>
            <p>
              Mark attendance, view session details and track student presence
              in real time.
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
                  ? "No course offerings are available"
                  : "Start attendance"
            }
          >
            <FontAwesomeIcon icon={faCalendar} />
            Start Attendance
          </button>
        </header>

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

        <section className="attendance-metrics-grid">
          {metrics.map((metric) => (
            <article className="attendance-metric-card" key={metric.label}>
              <div className={`attendance-metric-icon ${metric.tone}`}>
                <FontAwesomeIcon icon={metric.icon} />
              </div>
              <div className="attendance-metric-content">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.note}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="active-attendance-card">
          <div className="active-attendance-heading">
            <div>
              <h2>
                <FontAwesomeIcon icon={faCalendar} />
                Live Attendance Session
              </h2>
              <p>
                {activeSession
                  ? getSessionClassName(activeSession)
                  : "No active attendance session"}
              </p>
            </div>

            <span
              className={`session-status ${
                activeSession ? "active" : "pending"
              }`}
            >
              {activeSession ? "Active" : "Inactive"}
            </span>
          </div>

          {activeSession ? (
            <>
              <div className="attendance-session-meta">
                <span>{formatDate(activeSession.session_date)}</span>
                <span>
                  {formatTime(activeSession.start_time)} –{" "}
                  {formatTime(activeSession.end_time)}
                </span>
                <span>
                  {activeSession.session_id
                    ? `Session #${activeSession.session_id}`
                    : "Session details"}
                </span>
              </div>

              {closeError && (
                <p className="attendance-error-text" role="alert">
                  {closeError}
                </p>
              )}

              {faceAttendanceError && !showFaceAttendance && (
                <p className="attendance-error-text" role="alert">
                  {faceAttendanceError}
                </p>
              )}

              <div className="attendance-live-grid">
                <div className="attendance-live-camera">
                  {showFaceAttendance ? (
                    <div className="attendance-camera-scanner-frame">
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
                        style={{ display: "none" }}
                        aria-hidden="true"
                      />
                      <div className="attendance-scanner-viewfinder">
                        <div className="attendance-scanner-corner top-left" />
                        <div className="attendance-scanner-corner top-right" />
                        <div className="attendance-scanner-corner bottom-left" />
                        <div className="attendance-scanner-corner bottom-right" />
                        {autoScanActive && <div className="attendance-scanner-laser" />}
                      </div>
                      <span className="attendance-live-badge">
                        <span /> LIVE SCANNER
                      </span>
                      <div className="attendance-scanner-status-toast">
                        <FontAwesomeIcon icon={recognizingFace ? faSpinner : faCircleInfo} spin={recognizingFace} />
                        <span>{scanStatusMessage}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="attendance-camera-placeholder">
                      <FontAwesomeIcon icon={faCamera} />
                      <strong>Continuous Face Recognition</strong>
                      <span>
                        Start camera to automatically detect and mark attendance for enrolled students. No capture button required.
                      </span>
                      <button
                        type="button"
                        className="attendance-primary-button"
                        onClick={handleStartFaceAttendance}
                        disabled={closingSession}
                      >
                        <FontAwesomeIcon icon={faCamera} />
                        Start Live Attendance
                      </button>
                    </div>
                  )}
                </div>

                <div className="attendance-recognition-panel">
                  <div className="attendance-scanner-header">
                    <h3>Live Recognition</h3>
                    {showFaceAttendance && (
                      <span className="attendance-scanner-status-pill">
                        <span className={`attendance-pulse-dot ${autoScanActive ? "active" : "paused"}`} />
                        {autoScanActive ? "Auto-Scanning" : "Paused"}
                      </span>
                    )}
                  </div>

                  {showFaceAttendance && lastRecognizedStudent ? (
                    <div className="attendance-recognized-card">
                      <div className="attendance-recognized-avatar">
                        {getInitials(lastRecognizedStudent.name || lastRecognizedStudent.student_name)}
                      </div>
                      <div className="attendance-recognized-info">
                        <strong>{lastRecognizedStudent.name || lastRecognizedStudent.student_name}</strong>
                        <span>Enrollment: {lastRecognizedStudent.enrollment_no}</span>
                        <div className="attendance-recognized-tags">
                          <span className={`attendance-tag ${lastRecognizedStudent.is_new ? "new" : "existing"}`}>
                            <FontAwesomeIcon icon={faCircleCheck} />
                            {lastRecognizedStudent.is_new ? "Present Marked" : "Already Marked"}
                          </span>
                          {lastRecognizedStudent.confidence_score && (
                            <span className="attendance-tag score">
                              {Math.round(lastRecognizedStudent.confidence_score * 100)}% Match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="attendance-scanner-idle">
                      <div className="attendance-recognition-symbol">
                        <FontAwesomeIcon
                          icon={recognizingFace ? faSpinner : faUserCheck}
                          spin={recognizingFace}
                        />
                      </div>
                      <strong>
                        {recognizingFace
                          ? "Verifying identity…"
                          : showFaceAttendance && cameraReady
                            ? "Camera Active & Scanning"
                            : "Waiting for Camera"}
                      </strong>
                      <p>
                        {showFaceAttendance
                          ? scanStatusMessage
                          : "Activate camera to automatically scan and mark student attendance."}
                      </p>
                    </div>
                  )}

                  {displayedRecentDetections.length > 0 && (
                    <div className="attendance-recent-stream">
                      <div className="attendance-recent-title">Recent Recognitions</div>
                      <div className="attendance-recent-chips">
                        {displayedRecentDetections.map((item, idx) => (
                          <div key={item.student_id || idx} className="attendance-recent-chip">
                            <FontAwesomeIcon icon={faCircleCheck} />
                            <span>
                              {item.name ||
                                item.student_name ||
                                getStudentName(
                                  students.find((s) =>
                                    isSameId(s.student_id, item.student_id)
                                  )
                                ) ||
                                `Student #${item.student_id}`}
                            </span>
                            <small>{formatTime(item.marked_at)}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showFaceAttendance && (
                    <div className="attendance-scanner-controls">
                      <button
                        type="button"
                        className="attendance-secondary-button"
                        onClick={() => setAutoScanActive((prev) => !prev)}
                      >
                        <FontAwesomeIcon icon={autoScanActive ? faPause : faPlay} />
                        {autoScanActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        className="attendance-primary-button danger"
                        onClick={handleCloseFaceAttendance}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                        Stop Camera
                      </button>
                    </div>
                  )}

                  {faceAttendanceError && (
                    <p className="attendance-error-text" role="alert" style={{ marginTop: "10px" }}>
                      {faceAttendanceError}
                    </p>
                  )}
                </div>

                <div className="attendance-session-stats">
                  <h3>Session Stats</h3>
                  {[
                    {
                      label: "Total Recorded",
                      value: recordsLoading
                        ? "…"
                        : attendanceRecords.length,
                      icon: faUsers,
                      tone: "blue",
                    },
                    {
                      label: "Marked Present",
                      value: recordsLoading ? "…" : studentsPresent,
                      icon: faCircleCheck,
                      tone: "green",
                    },
                    {
                      label: "Marked Absent",
                      value: recordsLoading ? "…" : studentsAbsent,
                      icon: faCircleExclamation,
                      tone: "orange",
                    },
                    {
                      label: "Attendance Rate",
                      value: attendanceRate === null
                        ? "N/A"
                        : `${attendanceRate}%`,
                      icon: faChartLine,
                      tone: "purple",
                    },
                  ].map((item) => (
                    <div className="attendance-stat-row" key={item.label}>
                      <span className={`attendance-stat-icon ${item.tone}`}>
                        <FontAwesomeIcon icon={item.icon} />
                      </span>
                      <div>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="attendance-action-row">
                <button
                  type="button"
                  className="attendance-outline-button"
                  onClick={() => loadAttendanceRecords(selectedSession || activeSession)}
                  disabled={recordsLoading}
                >
                  <FontAwesomeIcon
                    icon={recordsLoading ? faSpinner : faRotateRight}
                    spin={recordsLoading}
                  />
                  Refresh Records
                </button>

                <button
                  type="button"
                  className="attendance-danger-button"
                  onClick={handleCloseAttendance}
                  disabled={closingSession}
                >
                  {closingSession ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faXmark} />
                  )}
                  {closingSession ? "Ending Session…" : "End Session"}
                </button>
              </div>
            </>
          ) : (
            <div className="active-attendance-empty">
              <div className="active-attendance-icon">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <h3>No active attendance session</h3>
              <p>
                Start a session for one of your assigned course offerings to
                mark or recognize attendance.
              </p>
              <button
                type="button"
                className="attendance-primary-button"
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
          <div className="attendance-table-card">
            <div className="attendance-table-toolbar">
              <div className="attendance-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "attendance"}
                  className={activeTab === "attendance" ? "active" : ""}
                  onClick={() => setActiveTab("attendance")}
                >
                  Recent Attendance
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "history"}
                  className={activeTab === "history" ? "active" : ""}
                  onClick={() => setActiveTab("history")}
                >
                  Session History
                </button>
              </div>

              {activeTab === "attendance" && selectedSession && (
                <div className="attendance-search-wrapper">
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    aria-label="Search students"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search students…"
                  />
                </div>
              )}
            </div>

            {activeTab === "history" && (
              <>
                <div className="attendance-filters-card">
                  <div className="attendance-filter search-filter">
                    <label htmlFor="attendance-search">Search course</label>
                    <div className="attendance-search-wrapper">
                      <FontAwesomeIcon icon={faMagnifyingGlass} />
                      <input
                        id="attendance-search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                          setPage(1);
                        }}
                        placeholder="Search courses…"
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
                    Clear
                  </button>
                </div>

                {loading ? (
                  <div className="attendance-empty-state">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <h3>Loading sessions…</h3>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="attendance-empty-state">
                    <FontAwesomeIcon icon={faBookOpen} />
                    <h3>
                      {sessions.length
                        ? "No matching sessions"
                        : "No attendance sessions"}
                    </h3>
                    <p>
                      {sessions.length
                        ? "Try changing your search or filters."
                        : "Sessions will appear here after you start attendance."}
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
                        {filteredSessions.map((session) => (
                          <tr
                            key={session.session_id}
                            tabIndex={0}
                            aria-selected={isSameId(
                              selectedSession?.session_id,
                              session.session_id
                            )}
                            className={
                              isSameId(
                                selectedSession?.session_id,
                                session.session_id
                              )
                                ? "selected"
                                : ""
                            }
                            onClick={() => handleSessionSelect(session)}
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                handleSessionSelect(session);
                              }
                            }}
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

                <div className="attendance-list-footer">
                  <span>
                    Showing {filteredSessions.length} of {sessions.length}{" "}
                    sessions
                  </span>
                </div>
              </>
            )}

            {activeTab === "attendance" && (
              <>
                {!selectedSession ? (
                  <div className="attendance-empty-state">
                    <FontAwesomeIcon icon={faCalendar} />
                    <h3>Select an attendance session</h3>
                    <p>
                      Open Session History and select a session to view its
                      attendance records.
                    </p>
                    <button
                      type="button"
                      className="attendance-outline-button"
                      onClick={() => setActiveTab("history")}
                    >
                      View Session History
                    </button>
                  </div>
                ) : recordsLoading || studentsLoading ? (
                  <div className="attendance-empty-state">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <h3>
                      {recordsLoading
                        ? "Loading attendance records…"
                        : "Loading students…"}
                    </h3>
                  </div>
                ) : recordsError ? (
                  <div className="attendance-empty-state" role="alert">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                    <h3>Unable to load attendance</h3>
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
                ) : studentsError ? (
                  <div className="attendance-empty-state" role="alert">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                    <h3>Student data unavailable</h3>
                    <p>{studentsError}</p>
                  </div>
                ) : sessionStudents.length === 0 ? (
                  <div className="attendance-empty-state">
                    <FontAwesomeIcon icon={faUsers} />
                    <h3>No enrolled students in this course</h3>
                    <p>
                      There are currently no active students enrolled in this course offering.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="attendance-table-wrapper">
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>Enrollment No.</th>
                            <th>Status</th>
                            <th>Marked At</th>
                            <th>Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayStudents.map((student, index) => {
                            const record = attendanceRecordMap.get(
                              String(student.student_id)
                            );

                            return (
                              <tr key={student.student_id}>
                                <td>{(page - 1) * pageSize + index + 1}</td>
                                <td>
                                  <div className="attendance-student-cell">
                                    <span className="attendance-student-avatar">
                                      {getInitials(getStudentName(student))}
                                    </span>
                                    <span>{getStudentName(student)}</span>
                                  </div>
                                </td>
                                <td>{student.enrollment_no || "N/A"}</td>
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="attendance-list-footer">
                      <span>
                        Showing{" "}
                        {filteredStudents.length === 0
                          ? 0
                          : (page - 1) * pageSize + 1}
                        –
                        {Math.min(page * pageSize, filteredStudents.length)} of{" "}
                        {filteredStudents.length} students
                      </span>

                      <div className="attendance-pagination">
                        <button
                          type="button"
                          onClick={() => setPage((current) => current - 1)}
                          disabled={page <= 1}
                          aria-label="Previous page"
                        >
                          <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <span>
                          {page} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage((current) => current + 1)}
                          disabled={page >= totalPages}
                          aria-label="Next page"
                        >
                          <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

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
    </main>

    <aside className="attendance-side-column">
      <section className="attendance-side-card">
        <h2>
          <FontAwesomeIcon icon={faBolt} />
          Quick Actions
        </h2>

        <button
          type="button"
          className="attendance-quick-action primary"
          onClick={handleOpenStartModal}
          disabled={
            coursesLoading ||
            courses.length === 0 ||
            Boolean(activeSession)
          }
        >
          <span className="attendance-quick-icon">
            <FontAwesomeIcon icon={faCamera} />
          </span>
          <span>
            <strong>Start Attendance</strong>
            <small>Begin a session for a course</small>
          </span>
        </button>

        <button
          type="button"
          className="attendance-quick-action"
          onClick={() => {
            const offeringParam = selectedSession?.offering_id || selectedOfferingId || "";
            navigate(offeringParam ? `/faculty/students?offering_id=${offeringParam}` : "/faculty/students");
          }}
        >
          <span className="attendance-quick-icon">
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <span>
            <strong>View Students</strong>
            <small>View available course attendance</small>
          </span>
        </button>

        <button
          type="button"
          className="attendance-quick-action"
          onClick={() => {
            const offeringParam = selectedSession?.offering_id || selectedOfferingId || "";
            navigate(offeringParam ? `/faculty/reports?offering_id=${offeringParam}` : "/faculty/reports");
          }}
        >
          <span className="attendance-quick-icon">
            <FontAwesomeIcon icon={faFileLines} />
          </span>
          <span>
            <strong>Attendance Reports</strong>
            <small>View reports & analytics</small>
          </span>
        </button>
      </section>

      <section className="attendance-side-card">
        <div className="attendance-side-heading">
          <h2>
            <FontAwesomeIcon icon={faCalendar} />
            Today's Schedule
          </h2>
          <button
            type="button"
            onClick={() => setScheduleExpanded((current) => !current)}
          >
            {scheduleExpanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {scheduleExpanded && (
          <div className="attendance-schedule-pending">
            {timetableLoading ? (
              <p>Loading timetable...</p>
            ) : timetableError ? (
              <div className="attendance-schedule-pending">
                <FontAwesomeIcon icon={faCircleExclamation} />
                <p>{timetableError}</p>
              </div>
            ) : (
              (() => {
                const dayNames = [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ];
                const today = dayNames[new Date().getDay()];
                const todayEntries = timetableEntries.filter(
                  (entry) =>
                    String(entry.day_of_week || "").trim().toLowerCase() ===
                    today.toLowerCase()
                );
                if (todayEntries.length === 0) {
                  return <p>No timetable entries found for {today}.</p>;
                }
                return (
                  <div className="attendance-schedule-list">
                    {todayEntries.map((entry) => (
                      <div
                        className="attendance-schedule-item clickable"
                        key={entry.timetable_entry_id}
                        role="button"
                        tabIndex={0}
                        title="Click to start attendance for this class"
                        onClick={() => {
                          if (!activeSession) {
                            setSelectedOfferingId(String(entry.offering_id));
                            setShowStartModal(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && !activeSession) {
                            setSelectedOfferingId(String(entry.offering_id));
                            setShowStartModal(true);
                          }
                        }}
                      >
                        <strong>
                          {entry.course_code} - {entry.course_name}
                        </strong>
                        <p>
                          {formatTime(entry.start_time)} -{" "}
                          {formatTime(entry.end_time)}
                        </p>
                        <p>
                          Section: {entry.section || "N/A"} · Room:{" "}
                          {entry.room || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </section>

      <section className="attendance-side-card attendance-help-card">
        <h2>
          <FontAwesomeIcon icon={faCircleInfo} />
          System Status
        </h2>
        <p>
          {systemHealth.loading
            ? "Verifying backend and database connectivity…"
            : systemHealth.connected
              ? "Live database connected. All attendance records, facial recognitions, and sessions are persisted to MySQL in real time."
              : `Connection error: ${systemHealth.message}. Check that the backend server is running.`}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
          <span
            className={`attendance-status-badge ${
              systemHealth.loading
                ? "pending"
                : systemHealth.connected
                  ? "live"
                  : "error"
            }`}
          >
            <FontAwesomeIcon
              icon={
                systemHealth.loading
                  ? faSpinner
                  : systemHealth.connected
                    ? faCircleCheck
                    : faCircleExclamation
              }
              spin={systemHealth.loading}
            />{" "}
            {systemHealth.loading
              ? "Checking…"
              : systemHealth.connected
                ? "Live Backend Connected"
                : "Backend Offline"}
          </span>
          {!systemHealth.connected && !systemHealth.loading && (
            <button
              type="button"
              className="attendance-outline-button"
              style={{ padding: "3px 8px", fontSize: "11px" }}
              onClick={checkSystemHealth}
              title="Retry connecting to backend"
            >
              <FontAwesomeIcon icon={faRotateRight} /> Retry
            </button>
          )}
        </div>
      </section>
    </aside>

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
                  The selected course offering will receive a new active
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
                  Starting…
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
