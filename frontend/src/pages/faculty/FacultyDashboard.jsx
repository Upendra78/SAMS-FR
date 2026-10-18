import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  Camera,
  Users,
  ChevronDown,
  Building,
  User as UserIcon,
  Clock,
  Zap,
  Headphones,
  CheckCircle2,
  Calendar,
  SquareCheck,
  BarChart3,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  X,
} from "lucide-react";

import "./FacultyDashboard.css";
import useAuth from "../../hooks/useAuth";
import { getFacultyDashboard } from "../../services/portalService";
import { getFacultyAttendanceAnalytics } from "../../services/reportService";
import {
  getFacultyCourses,
  getFacultyAttendanceSessions,
  getActiveFacultyAttendanceSession,
  startFacultyAttendanceSession,
  getFacultyTimetable,
} from "../../services/facultyService";

// Card background illustrations
import assignedCoursesImg from "../../../image/Assigned Courses.png";
import todaysClassesImg from "../../../image/Today's Classes.png";
import activeSessionsImg from "../../../image/Active Sessions.png";
import avgAttendanceImg from "../../../image/Average Attendance.png";
import goodMorningBannerImg from "../../../image/opposite goodmorning card for faculty.png";

function getDisplayName(user) {
  if (!user || typeof user !== "object") return "Faculty Member";

  const fullName =
    user.full_name ||
    user.fullName ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    [user.firstName, user.lastName].filter(Boolean).join(" ");

  return typeof fullName === "string" && fullName.trim()
    ? fullName.trim()
    : "Faculty Member";
}

function getInitials(name) {
  if (!name || name === "Faculty Member") return "RK";
  // Remove common prefixes / titles: Dr., Dr, Prof., Prof, Mr., Mrs., Ms.
  const cleanName = name
    .replace(/^(dr\.|dr|prof\.|prof|mr\.|mr|mrs\.|mrs|ms\.|ms)\s+/i, "")
    .trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(value) {
  if (!value) return "TBD";
  const match = String(value).match(/^(\d{2}):(\d{2})/);
  if (!match) return String(value);

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatElapsedTimer(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

function getTodayWeekday() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

function FacultyDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  // Status trackers
  const [backendStatus, setBackendStatus] = useState("loading"); // loading, connected, error
  const [coursesStatus, setCoursesStatus] = useState("loading"); // loading, loaded, error
  const [sessionStatus, setSessionStatus] = useState("loading"); // loading, loaded, error
  const [timetableStatus, setTimetableStatus] = useState("loading"); // loading, loaded, error
  const [analyticsStatus, setAnalyticsStatus] = useState("loading"); // loading, loaded, error

  // Real backend data states (NO fake data)
  const [courses, setCourses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Live timer for active session
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Start Session Modal
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [startError, setStartError] = useState("");

  // Live ticker for active session elapsed time
  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSession]);

  // Fetch all dashboard data from backend APIs
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      // 1. Backend Verification
      try {
        const result = await getFacultyDashboard();
        if (cancelled) return;
        setBackendStatus(result?.success ? "connected" : "error");
      } catch {
        if (!cancelled) setBackendStatus("error");
      }

      // 2. Assigned Courses
      try {
        const result = await getFacultyCourses();
        if (cancelled) return;
        if (result?.success && Array.isArray(result.data)) {
          setCourses(result.data);
          setCoursesStatus("loaded");
          if (result.data.length > 0) {
            setSelectedOfferingId(String(result.data[0].offering_id));
          }
        } else {
          setCourses([]);
          setCoursesStatus("error");
        }
      } catch {
        if (!cancelled) {
          setCourses([]);
          setCoursesStatus("error");
        }
      }

      // 3. Timetable / Schedule
      try {
        const result = await getFacultyTimetable();
        if (cancelled) return;
        if (result?.success) {
          const items = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data?.timetable)
            ? result.data.timetable
            : [];
          setTimetable(items);
          setTimetableStatus("loaded");
        } else {
          setTimetable([]);
          setTimetableStatus("error");
        }
      } catch {
        if (!cancelled) {
          setTimetable([]);
          setTimetableStatus("error");
        }
      }

      // 4. Active Session & Recent Sessions
      try {
        const [activeRes, sessionsRes] = await Promise.allSettled([
          getActiveFacultyAttendanceSession(),
          getFacultyAttendanceSessions(),
        ]);
        if (cancelled) return;

        if (activeRes.status === "fulfilled" && activeRes.value?.success && activeRes.value?.data) {
          const s = activeRes.value.data;
          if (s?.session_id && String(s?.status).toUpperCase() === "ACTIVE") {
            setActiveSession(s);
            setElapsedSeconds(0);
          } else {
            setActiveSession(null);
          }
          setSessionStatus("loaded");
        } else {
          setActiveSession(null);
          setSessionStatus(activeRes.status === "fulfilled" ? "loaded" : "error");
        }

        if (sessionsRes.status === "fulfilled" && sessionsRes.value?.success && Array.isArray(sessionsRes.value.data)) {
          setRecentSessions(sessionsRes.value.data);
        } else {
          setRecentSessions([]);
        }
      } catch {
        if (!cancelled) {
          setActiveSession(null);
          setRecentSessions([]);
          setSessionStatus("error");
        }
      }

      // 5. Attendance Analytics
      try {
        const result = await getFacultyAttendanceAnalytics();
        if (cancelled) return;
        if (result?.success && result?.data) {
          setAnalytics(result.data);
          setAnalyticsStatus("loaded");
        } else {
          setAnalytics(null);
          setAnalyticsStatus("error");
        }
      } catch {
        if (!cancelled) {
          setAnalytics(null);
          setAnalyticsStatus("error");
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle Starting Attendance
  const handleStartAttendance = async (e) => {
    e.preventDefault();
    setStartError("");

    if (!selectedOfferingId) {
      setStartError("Please select a course offering.");
      return;
    }

    setStartingSession(true);
    try {
      const result = await startFacultyAttendanceSession(Number(selectedOfferingId));
      if (result?.success && result?.data) {
        setActiveSession(result.data);
        setShowStartDialog(false);
      } else {
        throw new Error(result?.message || "Failed to start attendance session.");
      }
    } catch (err) {
      setStartError(err?.response?.data?.message || err?.message || "Unable to start session.");
    } finally {
      setStartingSession(false);
    }
  };

  // Filter timetable for today
  const todayWeekday = getTodayWeekday();
  const todaysClasses = timetable.filter(
    (entry) =>
      String(entry.day_of_week || "").trim().toLowerCase() ===
      todayWeekday.toLowerCase()
  );

  // Metrics from real backend data (or API integration pending)
  const assignedCoursesDisplay =
    coursesStatus === "loaded"
      ? String(courses.length)
      : coursesStatus === "loading"
      ? "..."
      : "API integration pending";

  const todaysClassesDisplay =
    timetableStatus === "loaded"
      ? String(todaysClasses.length)
      : timetableStatus === "loading"
      ? "..."
      : "API integration pending";

  const activeSessionsDisplay =
    sessionStatus === "loaded"
      ? activeSession
        ? "1"
        : "0"
      : sessionStatus === "loading"
      ? "..."
      : "API integration pending";

  const attendanceRateDisplay =
    analyticsStatus === "loaded" && analytics?.overall_attendance_percentage != null
      ? `${Number(analytics.overall_attendance_percentage).toFixed(1)}%`
      : analyticsStatus === "loading"
      ? "..."
      : "API integration pending";

  // Donut chart calculation from real analytics
  const donutPercentage =
    analyticsStatus === "loaded" && analytics?.overall_attendance_percentage != null
      ? Number(analytics.overall_attendance_percentage)
      : 0;
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeOffset = circumference - (circumference * donutPercentage) / 100;

  return (
    <div className="faculty-dashboard-container">
      {/* 1. Welcome Banner Card */}
      <section className="faculty-welcome-card" aria-label="Welcome Banner">
        <div className="faculty-welcome-left">
          <div className="faculty-welcome-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="faculty-welcome-text">
            <h1 className="faculty-welcome-title">
              Good Morning, {displayName}
            </h1>
            <p className="faculty-welcome-subtitle">
              Manage your classes, monitor attendance, and access your teaching tools from one place.
            </p>
          </div>
        </div>

        <div className="faculty-welcome-right">
          <div className="faculty-welcome-quote-block">
            <p className="faculty-welcome-quote">
              “Education is not the filling of a pail,
              <br />
              but the lighting of a fire.”
            </p>
            <span className="faculty-welcome-author">— W.B. Yeats</span>
          </div>

          <div className="faculty-welcome-image-wrap">
            <img
              src={goodMorningBannerImg || "/image/opposite goodmorning card for faculty.png"}
              alt="Faculty workspace banner desk"
              className="faculty-welcome-banner-img"
            />
          </div>
        </div>
      </section>

      {/* 2. Top Summary Stat Cards (4 Cards) */}
      <section className="faculty-stat-cards-grid" aria-label="Quick metrics">
        {/* Card 1: Assigned Courses */}
        <div
          className="faculty-stat-card faculty-stat-blue"
          style={{
            backgroundImage: `url("${assignedCoursesImg || "/image/Assigned Courses.png"}")`,
          }}
        >
          <div className="faculty-stat-header">
            <div className="faculty-stat-header-main">
              <div className="faculty-stat-icon-wrap faculty-icon-blue">
                <BookOpen size={20} strokeWidth={2.4} />
              </div>
              <div className="faculty-stat-title-wrap">
                <span className="faculty-stat-title">Assigned Courses</span>
                {coursesStatus === "error" && (
                  <span className="faculty-api-pending-tag" title="API integration pending: Courses API">
                    API integration pending
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="faculty-stat-chevron faculty-chevron-blue" />
          </div>

          <div className="faculty-stat-body">
            <span className="faculty-stat-value">{assignedCoursesDisplay}</span>
            <span className="faculty-stat-description">Assigned course offerings</span>
          </div>
        </div>

        {/* Card 2: Today's Classes */}
        <div
          className="faculty-stat-card faculty-stat-green"
          style={{
            backgroundImage: `url("${todaysClassesImg || "/image/Today's Classes.png"}")`,
          }}
        >
          <div className="faculty-stat-header">
            <div className="faculty-stat-header-main">
              <div className="faculty-stat-icon-wrap faculty-icon-green">
                <CalendarDays size={20} strokeWidth={2.4} />
              </div>
              <div className="faculty-stat-title-wrap">
                <span className="faculty-stat-title">Today's Classes</span>
                {timetableStatus === "error" && (
                  <span className="faculty-api-pending-tag" title="API integration pending: Timetable API">
                    API integration pending
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="faculty-stat-chevron faculty-chevron-green" />
          </div>

          <div className="faculty-stat-body">
            <span className="faculty-stat-value">{todaysClassesDisplay}</span>
            <span className="faculty-stat-description">Today's teaching schedule</span>
          </div>
        </div>

        {/* Card 3: Active Sessions */}
        <div
          className="faculty-stat-card faculty-stat-purple"
          style={{
            backgroundImage: `url("${activeSessionsImg || "/image/Active Sessions.png"}")`,
          }}
        >
          <div className="faculty-stat-header">
            <div className="faculty-stat-header-main">
              <div className="faculty-stat-icon-wrap faculty-icon-purple">
                <Camera size={20} strokeWidth={2.4} />
              </div>
              <div className="faculty-stat-title-wrap">
                <span className="faculty-stat-title">Active Sessions</span>
                {sessionStatus === "error" && (
                  <span className="faculty-api-pending-tag" title="API integration pending: Active Session API">
                    API integration pending
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="faculty-stat-chevron faculty-chevron-purple" />
          </div>

          <div className="faculty-stat-body">
            <span className="faculty-stat-value">{activeSessionsDisplay}</span>
            <span className="faculty-stat-description">Confirmed active session</span>
          </div>
        </div>

        {/* Card 4: Average Attendance */}
        <div
          className="faculty-stat-card faculty-stat-amber"
          style={{
            backgroundImage: `url("${avgAttendanceImg || "/image/Average Attendance.png"}")`,
          }}
        >
          <div className="faculty-stat-header">
            <div className="faculty-stat-header-main">
              <div className="faculty-stat-icon-wrap faculty-icon-amber">
                <Users size={20} strokeWidth={2.4} />
              </div>
              <div className="faculty-stat-title-wrap">
                <span className="faculty-stat-title">Average Attendance</span>
                {analyticsStatus === "error" && (
                  <span className="faculty-api-pending-tag" title="API integration pending: Analytics API">
                    API integration pending
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="faculty-stat-chevron faculty-chevron-amber" />
          </div>

          <div className="faculty-stat-body">
            <div className="faculty-stat-value-row">
              <span className="faculty-stat-value">{attendanceRateDisplay}</span>
              {analyticsStatus === "loaded" && (
                <ArrowRight size={20} strokeWidth={2.8} className="faculty-stat-arrow-right" />
              )}
            </div>
            <span className="faculty-stat-description">Attendance across closed sessions</span>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard 3-Column Content Layout */}
      <div className="faculty-columns-grid">
        {/* Column 1: Left */}
        <div className="faculty-col faculty-col-left">
          {/* Card: Today's Schedule */}
          <div className="faculty-panel-card">
            <div className="faculty-panel-header">
              <div className="faculty-panel-header-left">
                <div className="faculty-panel-header-icon faculty-icon-blue">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="faculty-panel-title">Today's Schedule</h2>
                  <p className="faculty-panel-subtitle">Your classes and teaching sessions for today.</p>
                </div>
              </div>

              <div className="faculty-dropdown-pill">
                <Calendar size={13} className="faculty-dropdown-cal-icon" />
                <span>Today</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {timetableStatus === "loading" ? (
              <div className="faculty-empty-state">
                <p>Loading schedule from backend...</p>
              </div>
            ) : timetableStatus === "error" ? (
              <div className="faculty-empty-state">
                <AlertCircle size={22} className="text-amber" />
                <strong>API integration pending: Timetable API</strong>
                <p>Timetable service endpoint is not yet connected to the backend.</p>
              </div>
            ) : todaysClasses.length === 0 ? (
              <div className="faculty-empty-state">
                <Calendar size={22} className="text-muted" />
                <strong>No classes scheduled for today</strong>
                <p>Your timetable contains no teaching sessions for {todayWeekday}.</p>
              </div>
            ) : (
              <div className="faculty-schedule-list">
                {todaysClasses.map((item, index) => (
                  <div key={item.timetable_entry_id || index} className="faculty-schedule-row">
                    <div className="faculty-schedule-time">
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </div>

                    <div className="faculty-schedule-details">
                      <div className="faculty-schedule-course">
                        <strong>{item.course_code || "Course"}</strong>
                        <span>{item.course_name || ""}</span>
                      </div>
                      <div className="faculty-schedule-meta">
                        {item.section ? `Section ${item.section}` : ""}
                        {item.semester ? ` • Sem ${item.semester}` : ""}
                      </div>
                    </div>

                    <div className="faculty-schedule-right">
                      {item.room && (
                        <div className="faculty-schedule-room">
                          <Building size={14} className="faculty-room-icon" />
                          <span>{item.room}</span>
                        </div>
                      )}
                      <span className="faculty-badge faculty-badge-ongoing">Class</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Attendance Overview */}
          <div className="faculty-panel-card">
            <div className="faculty-panel-header">
              <div className="faculty-panel-header-left">
                <div className="faculty-panel-header-icon faculty-icon-blue">
                  <SquareCheck size={18} />
                </div>
                <div>
                  <h2 className="faculty-panel-title">Attendance Overview</h2>
                </div>
              </div>
            </div>

            {analyticsStatus === "loading" ? (
              <div className="faculty-empty-state">
                <p>Loading attendance analytics from backend...</p>
              </div>
            ) : analyticsStatus === "error" ? (
              <div className="faculty-empty-state">
                <AlertCircle size={22} className="text-amber" />
                <strong>API integration pending: Analytics API</strong>
                <p>Attendance analytics endpoint is pending backend integration.</p>
              </div>
            ) : (
              <div className="faculty-overview-content">
                {/* Circular SVG Donut Chart */}
                <div className="faculty-donut-wrap">
                  <svg className="faculty-donut-svg" viewBox="0 0 110 110">
                    <circle
                      className="faculty-donut-bg"
                      cx="55"
                      cy="55"
                      r="45"
                      strokeWidth="9"
                    />
                    <circle
                      className="faculty-donut-fill"
                      cx="55"
                      cy="55"
                      r="45"
                      strokeWidth="9"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 55 55)"
                    />
                    <text x="55" y="52" className="faculty-donut-text-val" textAnchor="middle">
                      {attendanceRateDisplay}
                    </text>
                    <text x="55" y="66" className="faculty-donut-text-sub" textAnchor="middle">
                      Overall Attendance
                    </text>
                  </svg>
                </div>

                {/* Legend List */}
                <div className="faculty-overview-legend">
                  <div className="faculty-legend-item">
                    <div className="faculty-legend-label">
                      <span className="faculty-legend-dot dot-green" />
                      <span>Present</span>
                    </div>
                    <strong className="faculty-legend-val">
                      {analytics?.total_present ?? 0}
                    </strong>
                  </div>

                  <div className="faculty-legend-item">
                    <div className="faculty-legend-label">
                      <span className="faculty-legend-dot dot-red" />
                      <span>Absent</span>
                    </div>
                    <strong className="faculty-legend-val">
                      {analytics?.total_absent ?? 0}
                    </strong>
                  </div>

                  <div className="faculty-legend-item">
                    <div className="faculty-legend-label">
                      <span className="faculty-legend-dot dot-blue" />
                      <span>Closed Sessions</span>
                    </div>
                    <strong className="faculty-legend-val">
                      {analytics?.total_sessions ?? 0}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card: My Courses */}
          <div className="faculty-panel-card">
            <div className="faculty-panel-header">
              <div className="faculty-panel-header-left">
                <div className="faculty-panel-header-icon faculty-icon-blue">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 className="faculty-panel-title">My Courses</h2>
                  <p className="faculty-panel-subtitle">Your assigned courses and class offerings.</p>
                </div>
              </div>
            </div>

            {coursesStatus === "loading" ? (
              <div className="faculty-empty-state">
                <p>Loading course offerings from backend...</p>
              </div>
            ) : coursesStatus === "error" ? (
              <div className="faculty-empty-state">
                <AlertCircle size={22} className="text-amber" />
                <strong>API integration pending: Courses API</strong>
                <p>Assigned course offerings endpoint is pending backend integration.</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="faculty-empty-state">
                <BookOpen size={22} className="text-muted" />
                <strong>No assigned courses</strong>
                <p>No course offerings are currently assigned to your account.</p>
              </div>
            ) : (
              <div className="faculty-my-courses-grid">
                {courses.slice(0, 3).map((c) => (
                  <div key={c.offering_id || c.course_id} className="faculty-course-mini-card">
                    <strong className="faculty-mini-code">{c.course_code || "Course"}</strong>
                    <span className="faculty-mini-name">{c.course_name || "Unnamed"}</span>
                    <span className="faculty-mini-sec">
                      {c.section ? `Sec ${c.section}` : ""}{c.semester ? ` • Sem ${c.semester}` : ""}
                    </span>

                    <div className="faculty-mini-footer">
                      <span className="faculty-mini-room">
                        <Building size={12} /> {c.room || "TBD"}
                      </span>
                      <span className="faculty-mini-students">
                        <Users size={12} /> {c.enrolled_students || c.student_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="faculty-panel-link-btn"
              onClick={() => navigate("/faculty/classes")}
            >
              View my classes <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Column 2: Center */}
        <div className="faculty-col faculty-col-center">
          {/* Card: Active Attendance Session */}
          <div className="faculty-panel-card">
            <div className="faculty-panel-header">
              <div className="faculty-panel-header-left">
                <div className="faculty-panel-header-icon faculty-icon-green">
                  <Camera size={18} />
                </div>
                <div>
                  <h2 className="faculty-panel-title">Active Attendance Session</h2>
                  <p className="faculty-panel-subtitle">Current session status confirmed by the backend.</p>
                </div>
              </div>
            </div>

            {sessionStatus === "loading" ? (
              <div className="faculty-empty-state">
                <p>Checking active session status...</p>
              </div>
            ) : sessionStatus === "error" ? (
              <div className="faculty-empty-state">
                <AlertCircle size={22} className="text-amber" />
                <strong>API integration pending: Active Session API</strong>
                <p>Attendance session status endpoint is pending backend integration.</p>
              </div>
            ) : activeSession ? (
              <div className="faculty-active-session-box">
                <div className="faculty-active-cam-circle">
                  <Camera size={26} strokeWidth={2.4} />
                </div>

                <h3 className="faculty-active-course-title">
                  {activeSession.course_code ? `${activeSession.course_code} – ${activeSession.course_name || ""}` : `Session #${activeSession.session_id}`}
                </h3>
                <p className="faculty-active-course-sub">
                  Session #{activeSession.session_id} {activeSession.section ? `• Section ${activeSession.section}` : ""} {activeSession.room ? `• Room ${activeSession.room}` : ""}
                </p>

                <div className="faculty-active-status-row">
                  <div className="faculty-session-live-pill">
                    <span className="faculty-pulse-dot" />
                    <span>Session Active</span>
                  </div>

                  <div className="faculty-session-live-timer">
                    {formatElapsedTimer(elapsedSeconds)}
                  </div>
                </div>

                <button
                  type="button"
                  className="faculty-view-live-btn"
                  onClick={() => navigate("/faculty/attendance")}
                >
                  <Camera size={17} />
                  <span>View Live Attendance</span>
                </button>
              </div>
            ) : (
              <div className="faculty-no-active-box">
                <div className="faculty-inactive-cam-circle">
                  <Camera size={26} strokeWidth={1.8} />
                </div>
                <h3>No active attendance session</h3>
                <p>Choose an assigned course and start attendance when your class is ready.</p>

                <button
                  type="button"
                  className="faculty-start-session-btn"
                  onClick={() => setShowStartDialog(true)}
                  disabled={courses.length === 0}
                >
                  <Camera size={16} />
                  <span>Start Attendance</span>
                </button>
              </div>
            )}
          </div>

          {/* Card: Recent Attendance Activity */}
          <div className="faculty-panel-card">
            <div className="faculty-panel-header">
              <div className="faculty-panel-header-left">
                <div className="faculty-panel-header-icon faculty-icon-blue">
                  <Clock size={18} />
                </div>
                <div>
                  <h2 className="faculty-panel-title">Recent Attendance Activity</h2>
                  <p className="faculty-panel-subtitle">Recent session history and attendance changes.</p>
                </div>
              </div>

              <button
                type="button"
                className="faculty-header-link"
                onClick={() => navigate("/faculty/attendance")}
              >
                View all
              </button>
            </div>

            {sessionStatus === "loading" ? (
              <div className="faculty-empty-state">
                <p>Loading session history from backend...</p>
              </div>
            ) : sessionStatus === "error" ? (
              <div className="faculty-empty-state">
                <AlertCircle size={22} className="text-amber" />
                <strong>API integration pending: Session History API</strong>
                <p>Recent session history endpoint is pending backend integration.</p>
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="faculty-empty-state">
                <Clock size={22} className="text-muted" />
                <strong>No attendance sessions yet</strong>
                <p>Your recent sessions will appear here after attendance has been recorded.</p>
              </div>
            ) : (
              <div className="faculty-timeline-list">
                {recentSessions.slice(0, 4).map((s) => (
                  <div key={s.session_id} className="faculty-timeline-item">
                    <div className="faculty-timeline-bullet bullet-blue" />

                    <div className="faculty-timeline-content">
                      <strong className="faculty-timeline-title">
                        {s.course_code ? `${s.course_code} – ${s.course_name || ""}` : `Session #${s.session_id}`}
                      </strong>
                      <span className="faculty-timeline-meta">
                        Session #{s.session_id} • {s.session_date} {s.start_time ? `• ${formatTime(s.start_time)}` : ""}
                      </span>
                    </div>

                    <span className="faculty-closed-badge">{s.status || "Closed"}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="faculty-text-arrow-btn"
              onClick={() => navigate("/faculty/attendance")}
            >
              View attendance history <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Column 3: Right */}
        <div className="faculty-col faculty-col-right">
          {/* Card: Quick Actions */}
          <div className="faculty-panel-card">
            <div className="faculty-panel-header">
              <div className="faculty-panel-header-left">
                <div className="faculty-panel-header-icon faculty-icon-blue">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="faculty-panel-title">Quick Actions</h2>
                  <p className="faculty-panel-subtitle">Jump to a faculty workspace.</p>
                </div>
              </div>
            </div>

            <div className="faculty-quick-actions-list">
              {/* 1. Start Attendance */}
              <button
                type="button"
                className="faculty-quick-action-row"
                onClick={() => setShowStartDialog(true)}
              >
                <div className="faculty-action-icon-box bg-emerald">
                  <Camera size={18} />
                </div>
                <div className="faculty-action-copy">
                  <strong className="faculty-action-name">Start Attendance</strong>
                  <span className="faculty-action-desc">Start a session for an assigned course</span>
                </div>
                <ChevronRight size={16} className="faculty-action-chevron" />
              </button>

              {/* 2. Attendance */}
              <button
                type="button"
                className="faculty-quick-action-row"
                onClick={() => navigate("/faculty/attendance")}
              >
                <div className="faculty-action-icon-box bg-blue">
                  <SquareCheck size={18} />
                </div>
                <div className="faculty-action-copy">
                  <strong className="faculty-action-name">Attendance</strong>
                  <span className="faculty-action-desc">Open attendance management</span>
                </div>
                <ChevronRight size={16} className="faculty-action-chevron" />
              </button>

              {/* 3. My Classes */}
              <button
                type="button"
                className="faculty-quick-action-row"
                onClick={() => navigate("/faculty/classes")}
              >
                <div className="faculty-action-icon-box bg-purple">
                  <Calendar size={18} />
                </div>
                <div className="faculty-action-copy">
                  <strong className="faculty-action-name">My Classes</strong>
                  <span className="faculty-action-desc">View assigned class offerings</span>
                </div>
                <ChevronRight size={16} className="faculty-action-chevron" />
              </button>

              {/* 4. Students */}
              <button
                type="button"
                className="faculty-quick-action-row"
                onClick={() => navigate("/faculty/students")}
              >
                <div className="faculty-action-icon-box bg-teal">
                  <Users size={18} />
                </div>
                <div className="faculty-action-copy">
                  <strong className="faculty-action-name">Students</strong>
                  <span className="faculty-action-desc">View enrolled students</span>
                </div>
                <ChevronRight size={16} className="faculty-action-chevron" />
              </button>

              {/* 5. Reports */}
              <button
                type="button"
                className="faculty-quick-action-row"
                onClick={() => navigate("/faculty/reports")}
              >
                <div className="faculty-action-icon-box bg-coral">
                  <BarChart3 size={18} />
                </div>
                <div className="faculty-action-copy">
                  <strong className="faculty-action-name">Reports</strong>
                  <span className="faculty-action-desc">Open attendance reports</span>
                </div>
                <ChevronRight size={16} className="faculty-action-chevron" />
              </button>

              {/* 6. My Profile */}
              <button
                type="button"
                className="faculty-quick-action-row"
                onClick={() => navigate("/faculty/profile")}
              >
                <div className="faculty-action-icon-box bg-indigo">
                  <UserIcon size={18} />
                </div>
                <div className="faculty-action-copy">
                  <strong className="faculty-action-name">My Profile</strong>
                  <span className="faculty-action-desc">View faculty profile details</span>
                </div>
                <ChevronRight size={16} className="faculty-action-chevron" />
              </button>
            </div>
          </div>

          {/* Card: Faculty Help */}
          <div className="faculty-panel-card faculty-help-card">
            <div className="faculty-help-header">
              <div className="faculty-help-circle-icon">
                <Headphones size={20} />
              </div>
              <h2 className="faculty-panel-title">Faculty Help</h2>
            </div>

            <p className="faculty-help-text">
              If your courses, timetable, or attendance data are missing, contact your administrator to verify the relevant records.
            </p>

            <button
              type="button"
              className="faculty-help-btn"
              onClick={() => navigate("/faculty/profile")}
            >
              View faculty profile <ArrowRight size={14} />
            </button>
          </div>

          {/* Card: Faculty access confirmed */}
          <div className="faculty-panel-card faculty-status-confirmed-card">
            <div className="faculty-status-confirmed-inner">
              <div className="faculty-confirmed-circle-icon">
                <CheckCircle2 size={24} strokeWidth={2.4} />
              </div>

              <div className="faculty-confirmed-text">
                <strong className="faculty-confirmed-title">
                  {backendStatus === "connected"
                    ? "Faculty access confirmed"
                    : "Backend connection status"}
                </strong>
                <span className="faculty-confirmed-desc">
                  {backendStatus === "connected"
                    ? "All systems are connected and active."
                    : "Connecting to faculty backend service..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Attendance Dialog Modal */}
      {showStartDialog && (
        <div
          className="faculty-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !startingSession) {
              setShowStartDialog(false);
            }
          }}
        >
          <div className="faculty-modal-card" role="dialog" aria-modal="true">
            <div className="faculty-modal-header">
              <div>
                <span className="faculty-modal-eyebrow">Attendance Session</span>
                <h3 className="faculty-modal-title">Start Attendance</h3>
                <p className="faculty-modal-sub">Select the course offering for this session.</p>
              </div>

              <button
                type="button"
                className="faculty-modal-close"
                onClick={() => setShowStartDialog(false)}
                disabled={startingSession}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStartAttendance}>
              <div className="faculty-modal-field">
                <label htmlFor="course-select-input" className="faculty-modal-label">
                  Course offering
                </label>
                <select
                  id="course-select-input"
                  className="faculty-modal-select"
                  value={selectedOfferingId}
                  onChange={(e) => setSelectedOfferingId(e.target.value)}
                  disabled={startingSession || courses.length === 0}
                >
                  {courses.length === 0 ? (
                    <option value="">No assigned courses available</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.offering_id} value={c.offering_id}>
                        {c.course_code} — {c.course_name}
                        {c.section ? ` · Section ${c.section}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {startError && (
                <div className="faculty-modal-error">
                  <AlertCircle size={15} />
                  <span>{startError}</span>
                </div>
              )}

              <p className="faculty-modal-note">
                This initializes the attendance session. Camera face recognition controls will be available on the Attendance page.
              </p>

              <div className="faculty-modal-actions">
                <button
                  type="button"
                  className="faculty-modal-cancel"
                  onClick={() => setShowStartDialog(false)}
                  disabled={startingSession}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="faculty-modal-confirm"
                  disabled={startingSession || courses.length === 0}
                >
                  {startingSession ? "Starting..." : "Confirm & Start"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
