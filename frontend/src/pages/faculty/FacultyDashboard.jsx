
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./FacultyDashboard.css";
import { getFacultyDashboard } from "../../services/portalService";
import {
  getFacultyCourses,
  getFacultyAttendanceSessions,
  getActiveFacultyAttendanceSession,
  startFacultyAttendanceSession,
} from "../../services/facultyService";

const PENDING = "API integration pending";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getCourseLabel(course) {
  const code = course.course_code || "Course";
  const name = course.course_name || "Unnamed course";
  const section = course.section ? ` · Section ${course.section}` : "";
  const semester = course.semester ? ` · Semester ${course.semester}` : "";

  return `${code} — ${name}${section}${semester}`;
}

function getSessionCourseLabel(session, courses) {
  const course = courses.find(
    (item) =>
      String(item.offering_id) === String(session?.offering_id),
  );

  return course ? getCourseLabel(course) : `Offering #${session?.offering_id}`;
}

function FacultyDashboard() {
  const navigate = useNavigate();

  const [backendStatus, setBackendStatus] = useState("loading");
  const [backendMessage, setBackendMessage] = useState(
    "Verifying your faculty access...",
  );

  const [courses, setCourses] = useState([]);
  const [coursesStatus, setCoursesStatus] = useState("loading");
  const [coursesError, setCoursesError] = useState("");

  const [activeSession, setActiveSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("loading");
  const [sessionError, setSessionError] = useState("");

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [startError, setStartError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const openPage = (path) => navigate(path);

  const loadDashboardData = useCallback(async () => {
    setBackendStatus("loading");
    setBackendMessage("Verifying your faculty access...");
    setCoursesStatus("loading");
    setCoursesError("");
    setSessionStatus("loading");
    setSessionError("");

    try {
      const result = await getFacultyDashboard();

      if (result?.success && result?.data?.role === "FACULTY") {
        setBackendStatus("connected");
        setBackendMessage(
          "Faculty access confirmed. Dashboard sections are connected individually where supported.",
        );
      } else {
        throw new Error(
          result?.message || "Unable to verify faculty access.",
        );
      }
    } catch (error) {
      setBackendStatus("error");

      if (error?.response?.status === 401) {
        setBackendMessage("Your session has expired. Please log in again.");
      } else if (error?.response?.status === 403) {
        setBackendMessage("Faculty access is required for this portal.");
      } else {
        setBackendMessage(
          getErrorMessage(
            error,
            "Faculty backend service is currently unavailable.",
          ),
        );
      }
    }

    try {
      const result = await getFacultyCourses();

      if (!result?.success) {
        throw new Error(result?.message || "Unable to load course offerings.");
      }

      const items = Array.isArray(result.data) ? result.data : [];
      setCourses(items);
      setCoursesStatus("loaded");

      if (items.length > 0) {
        setSelectedOfferingId((current) => {
          const stillExists = items.some(
            (item) => String(item.offering_id) === String(current),
          );
          return stillExists ? current : String(items[0].offering_id);
        });
      }
    } catch (error) {
      setCourses([]);
      setCoursesStatus("error");
      setCoursesError(
        getErrorMessage(error, "Unable to load course offerings."),
      );
    }

    try {
      const [activeResult, sessionsResult] = await Promise.all([
        getActiveFacultyAttendanceSession(),
        getFacultyAttendanceSessions(),
      ]);

      if (!activeResult?.success) {
        throw new Error(
          activeResult?.message || "Unable to check the active session.",
        );
      }

      if (!sessionsResult?.success) {
        throw new Error(
          sessionsResult?.message || "Unable to load session history.",
        );
      }

      const activeData = activeResult.data;
      const confirmedActive =
        activeData &&
        activeData.session_id &&
        String(activeData.status).toUpperCase() === "ACTIVE"
          ? activeData
          : null;

      setActiveSession(confirmedActive);
      setSessionStatus("loaded");
      setSessionError("");
    } catch (error) {
      setActiveSession(null);
      setSessionStatus("error");
      setSessionError(
        getErrorMessage(error, "Unable to check attendance session status."),
      );
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        await loadDashboardData(controller.signal);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load dashboard data:", error);
        }
      }
    };

    loadData();

    return () => controller.abort();
  }, [loadDashboardData]);

  const handleOpenStartDialog = () => {
    setStartError("");
    setSuccessMessage("");

    if (sessionStatus === "error") {
      setSessionError(
        "Session status could not be verified. Refresh the dashboard before starting a new session.",
      );
      return;
    }

    if (activeSession) {
      setSuccessMessage("An active attendance session is already running.");
      return;
    }

    if (coursesStatus === "error") {
      setStartError(
        coursesError || "Course offerings could not be loaded.",
      );
      setShowStartDialog(true);
      return;
    }

    if (courses.length === 0 && coursesStatus === "loaded") {
      setStartError(
        "No assigned course offerings were returned. Contact your administrator to check your course assignments.",
      );
      setShowStartDialog(true);
      return;
    }

    setShowStartDialog(true);
  };

  const handleStartAttendance = async (event) => {
    event.preventDefault();
    setStartError("");
    setSuccessMessage("");

    if (!selectedOfferingId) {
      setStartError("Please select a course before starting attendance.");
      return;
    }

    if (activeSession) {
      setStartError("An active attendance session already exists.");
      return;
    }

    setStartingSession(true);

    try {
      const result = await startFacultyAttendanceSession(
        Number(selectedOfferingId),
      );

      if (!result?.success || !result?.data?.session_id) {
        throw new Error(
          result?.message || "The backend did not confirm a started session.",
        );
      }

      const newSession = result.data;

      if (String(newSession.status).toUpperCase() !== "ACTIVE") {
        throw new Error(
          "The backend response did not confirm an active session.",
        );
      }

      setActiveSession(newSession);
      setSessionStatus("loaded");
      setSessionError("");
      setShowStartDialog(false);
      setSuccessMessage("Attendance session started successfully.");
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to start attendance session.",
      );

      setStartError(message);

      // A conflict may mean another active session already exists.
      if (error?.response?.status === 409) {
        try {
          const result = await getActiveFacultyAttendanceSession();

          if (result?.success && result?.data?.session_id) {
            setActiveSession(result.data);
            setSessionStatus("loaded");
          }
        } catch {
          // Keep the original start error visible.
        }
      }
    } finally {
      setStartingSession(false);
    }
  };

  const summaryCards = [
    {
      title: "Assigned Courses",
      value:
        coursesStatus === "loaded" ? String(courses.length) : PENDING,
      icon: "▦",
      color: "blue",
      description: "Assigned course offerings",
    },
    {
      title: "Today's Classes",
      value: PENDING,
      icon: "◷",
      color: "purple",
      description: "Today's teaching schedule",
    },
    {
      title: "Active Sessions",
      value:
        sessionStatus === "loaded"
          ? activeSession
            ? "1"
            : "0"
          : PENDING,
      icon: "●",
      color: "green",
      description: "Confirmed active session",
    },
    {
      title: "Average Attendance",
      value: PENDING,
      icon: "%",
      color: "orange",
      description: "Attendance performance",
    },
  ];

  const quickActions = [
    {
      title: activeSession ? "Attendance In Progress" : "Start Attendance",
      description: activeSession
        ? "View the active session on this dashboard"
        : "Start a session for an assigned course",
      icon: "▶",
      onClick: handleOpenStartDialog,
      primary: true,
    },
    {
      title: "Attendance",
      description: "Open attendance management",
      icon: "✓",
      path: "/faculty/attendance",
    },
    {
      title: "My Classes",
      description: "View assigned class offerings",
      icon: "▦",
      path: "/faculty/classes",
    },
    {
      title: "Students",
      description: "View enrolled students",
      icon: "♟",
      path: "/faculty/students",
    },
    {
      title: "Reports",
      description: "Open attendance reports",
      icon: "▤",
      path: "/faculty/reports",
    },
    {
      title: "My Profile",
      description: "View faculty profile details",
      icon: "◉",
      path: "/faculty/profile",
    },
  ];

  return (
    <section className="faculty-dashboard-page">
      <header className="faculty-dashboard-header">
        <div className="faculty-dashboard-heading">
          <span className="faculty-dashboard-eyebrow">
            <span className="faculty-eyebrow-dot" />
            Faculty Portal
          </span>

          <h1>Faculty Dashboard</h1>
          <p>
            Manage your classes, monitor attendance, and access your
            teaching tools from one place.
          </p>
        </div>

        <button
          type="button"
          className="faculty-primary-button"
          onClick={handleOpenStartDialog}
          disabled={startingSession || sessionStatus === "loading"}
        >
          <span aria-hidden="true">▶</span>
          {activeSession ? "Attendance In Progress" : "Start Attendance"}
          <span className="faculty-button-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </header>

      {successMessage && (
        <div className="faculty-dashboard-feedback faculty-feedback-success" role="status">
          <span>{successMessage}</span>
          {activeSession && (
            <span>
              Session #{activeSession.session_id} ·{" "}
              {getSessionCourseLabel(activeSession, courses)}
            </span>
          )}
        </div>
      )}

      {sessionError && (
        <div className="faculty-dashboard-feedback faculty-feedback-error" role="alert">
          {sessionError}
          <button type="button" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      )}

      <section className="faculty-dashboard-summary" aria-label="Faculty summary">
        {summaryCards.map((card) => (
          <article
            className={`faculty-summary-card faculty-summary-${card.color}`}
            key={card.title}
          >
            <div className="faculty-summary-top">
              <span className="faculty-summary-label">{card.title}</span>
              <span className="faculty-summary-icon" aria-hidden="true">
                {card.icon}
              </span>
            </div>
            <strong className="faculty-summary-value">{card.value}</strong>
            <span className="faculty-summary-description">
              {card.description}
            </span>
          </article>
        ))}
      </section>

      <div className="faculty-dashboard-main-grid">
        <div className="faculty-dashboard-primary-column">
          <section className="faculty-dashboard-card faculty-schedule-card">
            <div className="faculty-section-header">
              <div>
                <span className="faculty-section-eyebrow">Teaching Schedule</span>
                <h2>Today's Schedule</h2>
                <p className="faculty-section-subtitle">
                  Your classes and teaching sessions for today.
                </p>
              </div>
              <span className="faculty-section-badge">◷ Today</span>
            </div>

            <div className="faculty-pending-state">
              <div className="faculty-pending-icon faculty-pending-icon-blue" aria-hidden="true">
                ◷
              </div>
              <h3>Schedule data is not connected yet</h3>
              <p>
                The timetable API has not been verified for this dashboard.
                Today's schedule will appear here when that integration is available.
              </p>
              <span className="faculty-pending-label">{PENDING}</span>
            </div>
          </section>

          <section className="faculty-dashboard-card faculty-session-card">
            <div className="faculty-section-header">
              <div>
                <span className="faculty-section-eyebrow">Live Activity</span>
                <h2>Active Attendance Session</h2>
                <p className="faculty-section-subtitle">
                  Current session status confirmed by the backend.
                </p>
              </div>
              <span
                className={`faculty-section-badge ${
                  activeSession ? "faculty-session-active-badge" : "faculty-section-badge-neutral"
                }`}
              >
                {sessionStatus === "loading"
                  ? "Checking status"
                  : sessionStatus === "error"
                    ? "Status unavailable"
                    : activeSession
                      ? "Active"
                      : "No active session"}
              </span>
            </div>

            <div className="faculty-session-content">
              <div className="faculty-session-symbol" aria-hidden="true">
                {activeSession ? "●" : "◉"}
              </div>

              <div className="faculty-session-copy">
                <h3>
                  {sessionStatus === "loading"
                    ? "Checking attendance session..."
                    : sessionStatus === "error"
                      ? "Session status unavailable"
                      : activeSession
                        ? `Session #${activeSession.session_id} is active`
                        : "No active attendance session"}
                </h3>

                <p>
                  {sessionStatus === "loading"
                    ? "Waiting for the backend to confirm the current session."
                    : sessionStatus === "error"
                      ? sessionError
                      : activeSession
                        ? `${getSessionCourseLabel(activeSession, courses)} · Started ${activeSession.start_time || "time unavailable"}`
                        : "Choose an assigned course and start attendance when your class is ready."}
                </p>

                {activeSession && (
                  <span className="faculty-pending-label">
                    Backend status: {activeSession.status}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="faculty-outline-button"
                onClick={activeSession ? () => openPage("/faculty/attendance") : handleOpenStartDialog}
                disabled={sessionStatus === "loading"}
              >
                {activeSession ? "Manage Session" : "Start Attendance"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section className="faculty-dashboard-card faculty-overview-card">
            <div className="faculty-section-header">
              <div>
                <span className="faculty-section-eyebrow">Attendance Summary</span>
                <h2>Attendance Overview</h2>
              </div>
            </div>

            <div className="faculty-overview-grid">
              {["Overall Attendance", "Present", "Absent", "Late"].map((label) => (
                <div className="faculty-overview-item" key={label}>
                  <span>{label}</span>
                  <strong>{PENDING}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="faculty-dashboard-side-column">
          <section className="faculty-dashboard-card faculty-quick-actions-card">
            <div className="faculty-section-header">
              <div>
                <span className="faculty-section-eyebrow">Shortcuts</span>
                <h2>Quick Actions</h2>
                <p className="faculty-section-subtitle">
                  Jump to a faculty workspace.
                </p>
              </div>
            </div>

            <div className="faculty-quick-actions">
              {quickActions.map((action) => (
                <button
                  type="button"
                  className={`faculty-action-card ${action.primary ? "faculty-action-primary" : ""}`}
                  key={action.title}
                  onClick={action.onClick || (() => openPage(action.path))}
                >
                  <span className="faculty-action-icon" aria-hidden="true">
                    {action.icon}
                  </span>
                  <span className="faculty-action-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>
                  <span className="faculty-action-arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </section>

          <section className="faculty-dashboard-card faculty-help-card">
            <div className="faculty-help-icon" aria-hidden="true">?</div>
            <span className="faculty-section-eyebrow">Need assistance?</span>
            <h2>Faculty Help</h2>
            <p>
              If your courses, timetable, or attendance data are missing,
              contact your administrator to verify the relevant records.
            </p>
            <button
              type="button"
              className="faculty-help-link"
              onClick={() => openPage("/faculty/profile")}
            >
              View faculty profile <span aria-hidden="true">→</span>
            </button>
          </section>
        </aside>
      </div>

      <section className="faculty-dashboard-card faculty-lower-grid">
        <div className="faculty-lower-panel">
          <div className="faculty-lower-heading">
            <span className="faculty-lower-icon" aria-hidden="true">✓</span>
            <div>
              <h2>Recent Attendance Activity</h2>
              <p>Recent session history and attendance changes.</p>
            </div>
          </div>
          <div className="faculty-lower-pending">
            <span>{PENDING}</span>
            <p>Recent activity is not connected to this dashboard yet.</p>
          </div>
          <button
            type="button"
            className="faculty-text-button"
            onClick={() => openPage("/faculty/attendance")}
          >
            View attendance history <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="faculty-lower-panel faculty-lower-panel-bordered">
          <div className="faculty-lower-heading">
            <span className="faculty-lower-icon" aria-hidden="true">▦</span>
            <div>
              <h2>My Courses</h2>
              <p>Your assigned courses and class offerings.</p>
            </div>
          </div>

          {coursesStatus === "loaded" && courses.length > 0 ? (
            <div className="faculty-course-list">
              {courses.slice(0, 4).map((course) => (
                <div className="faculty-course-row" key={course.offering_id}>
                  <strong>{course.course_code || "Course"}</strong>
                  <span>{course.course_name || "Unnamed course"}</span>
                  <small>
                    {course.section ? `Section ${course.section}` : "Section not specified"}
                    {course.room ? ` · Room ${course.room}` : ""}
                  </small>
                </div>
              ))}
              {courses.length > 4 && (
                <p className="faculty-course-more">
                  +{courses.length - 4} more assigned offerings
                </p>
              )}
            </div>
          ) : (
            <div className="faculty-lower-pending">
              <span>{coursesStatus === "error" ? "Course data unavailable" : PENDING}</span>
              <p>
                {coursesStatus === "error"
                  ? coursesError
                  : "Course offerings will appear here when available from the faculty API."}
              </p>
            </div>
          )}

          <button
            type="button"
            className="faculty-text-button"
            onClick={() => openPage("/faculty/classes")}
          >
            View my classes <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <div
        className={`faculty-integration-notice faculty-integration-${backendStatus}`}
        role="status"
        aria-live="polite"
      >
        <span className="faculty-integration-icon" aria-hidden="true">
          {backendStatus === "connected" ? "✓" : "i"}
        </span>
        <div className="faculty-integration-copy">
          <strong>
            {backendStatus === "loading"
              ? "Connecting to faculty backend"
              : backendStatus === "connected"
                ? "Faculty access confirmed"
                : "Faculty backend connection issue"}
          </strong>
          <span>{backendMessage}</span>
        </div>
        <span className="faculty-integration-badge">
          {backendStatus === "loading"
            ? "Connecting"
            : backendStatus === "connected"
              ? "Access confirmed"
              : "Connection issue"}
        </span>
      </div>

      {showStartDialog && (
        <div
          className="faculty-start-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !startingSession) {
              setShowStartDialog(false);
            }
          }}
        >
          <section
            className="faculty-start-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-start-dialog-title"
          >
            <div className="faculty-start-dialog-heading">
              <div>
                <span className="faculty-section-eyebrow">Attendance</span>
                <h2 id="faculty-start-dialog-title">Start Attendance</h2>
                <p>Select the course offering for this session.</p>
              </div>
              <button
                type="button"
                className="faculty-dialog-close"
                aria-label="Close dialog"
                disabled={startingSession}
                onClick={() => setShowStartDialog(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStartAttendance}>
              <label className="faculty-course-select-label" htmlFor="faculty-offering-select">
                Course offering
              </label>
              <select
                id="faculty-offering-select"
                className="faculty-course-select"
                value={selectedOfferingId}
                onChange={(event) => setSelectedOfferingId(event.target.value)}
                disabled={startingSession || coursesStatus !== "loaded" || courses.length === 0}
                required
              >
                {courses.length === 0 && (
                  <option value="">
                    {coursesStatus === "loading"
                      ? "Loading assigned courses..."
                      : "No assigned courses available"}
                  </option>
                )}
                {courses.map((course) => (
                  <option key={course.offering_id} value={course.offering_id}>
                    {getCourseLabel(course)}
                  </option>
                ))}
              </select>

              {coursesStatus === "error" && (
                <p className="faculty-dialog-error">{coursesError}</p>
              )}
              {startError && (
                <p className="faculty-dialog-error" role="alert">{startError}</p>
              )}

              <p className="faculty-dialog-note">
                This creates an attendance session on the backend. The camera and
                recognition controls remain in the Attendance workspace.
              </p>

              <div className="faculty-start-dialog-actions">
                <button
                  type="button"
                  className="faculty-dialog-cancel"
                  disabled={startingSession}
                  onClick={() => setShowStartDialog(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="faculty-primary-button"
                  disabled={
                    startingSession ||
                    coursesStatus !== "loaded" ||
                    courses.length === 0 ||
                    !selectedOfferingId
                  }
                >
                  {startingSession ? "Starting..." : "Confirm & Start"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

export default FacultyDashboard;
