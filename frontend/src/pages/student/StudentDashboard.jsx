import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCircleCheck,
  faCircleXmark,
  faBookOpen,
  faClock,
  faCalendarDays,
  faFileLines,
  faBell,
  faArrowRight,
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";

import { getStudentDashboard } from "../../services/portalService";
import { getStudentAttendance } from "../../services/attendanceService";
import "./StudentDashboard.css";

const summaryCards = [
  {
    label: "Overall Attendance",
    icon: faCalendarCheck,
  },
  {
    label: "Classes Attended",
    icon: faCircleCheck,
  },
  {
    label: "Classes Missed",
    icon: faCircleXmark,
  },
  {
    label: "Enrolled Courses",
    value: "N/A",
    icon: faBookOpen,
  },
];

const quickActions = [
  {
    label: "View Attendance",
    description: "Check your attendance records",
    path: "/student/attendance",
    icon: faCalendarCheck,
  },
  {
    label: "My Courses",
    description: "View your enrolled courses",
    path: "/student/courses",
    icon: faBookOpen,
  },
  {
    label: "View Schedule",
    description: "Check your class timetable",
    path: "/student/schedule",
    icon: faCalendarDays,
  },
  {
    label: "View Reports",
    description: "Review attendance reports",
    path: "/student/reports",
    icon: faFileLines,
  },
];

function StudentDashboard() {
  const navigate = useNavigate();

  const [backendStatus, setBackendStatus] = useState("loading");
  const [backendMessage, setBackendMessage] = useState("");

  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudentAccess() {
      try {
        const result = await getStudentDashboard();

        if (!isMounted) {
          return;
        }

        if (result?.success && result?.data?.role === "STUDENT") {
          setBackendStatus("connected");
          setBackendMessage("Student backend access confirmed.");
        } else {
          setBackendStatus("error");
          setBackendMessage(
            result?.message ||
              "Unable to verify student backend access."
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          setBackendStatus("error");
          setBackendMessage(
            "Your session has expired. Please log in again."
          );
        } else if (error?.response?.status === 403) {
          setBackendStatus("error");
          setBackendMessage(
            "Student access is required for this portal."
          );
        } else {
          setBackendStatus("error");
          setBackendMessage(
            "Student backend service is currently unavailable."
          );
        }
      }
    }

    async function loadAttendance() {
      try {
        setAttendanceLoading(true);
        setAttendanceError("");

        const response = await getStudentAttendance();
        const records = response?.data;

        if (!isMounted) {
          return;
        }

        setAttendance(Array.isArray(records) ? records : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Student attendance error:", error);

        setAttendanceError(
          error?.response?.data?.message ||
            "Unable to load attendance records."
        );

        setAttendance([]);
      } finally {
        if (isMounted) {
          setAttendanceLoading(false);
        }
      }
    }

    loadStudentAccess();
    loadAttendance();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalClasses = attendance.length;

  const classesAttended = attendance.filter(
    (record) =>
      record.status?.toUpperCase() === "PRESENT"
  ).length;

  const classesMissed = attendance.filter(
    (record) =>
      record.status?.toUpperCase() === "ABSENT"
  ).length;

  const overallAttendance =
    totalClasses > 0
      ? Math.round((classesAttended / totalClasses) * 100)
      : 0;

  const classesLate = attendance.filter(
    (record) =>
      record.status?.toUpperCase() === "LATE"
  ).length;

  const recentAttendance = [...attendance]
    .sort(
      (a, b) =>
        new Date(b.marked_at || 0) -
        new Date(a.marked_at || 0)
    )
    .slice(0, 5);

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PRESENT":
        return "present";

      case "ABSENT":
        return "absent";

      case "LATE":
        return "late";

      default:
        return "";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case "PRESENT":
        return "Present";

      case "ABSENT":
        return "Absent";

      case "LATE":
        return "Late";

      default:
        return status || "Unknown";
    }
  };

  const handleRetryAttendance = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceError("");

      const response = await getStudentAttendance();
      const records = response?.data;

      setAttendance(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error("Student attendance error:", error);

      setAttendanceError(
        error?.response?.data?.message ||
          "Unable to load attendance records."
      );

      setAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <div className="student-dashboard">
      <section className="student-dashboard-header">
        <div>
          <p className="student-dashboard-eyebrow">
            OVERVIEW
          </p>

          <h1>Student Dashboard</h1>

          <p className="student-dashboard-subtitle">
            Welcome back, Student. Here&apos;s your
            academic overview.
          </p>
        </div>

        <div className="student-semester-info">
          <span>Current Semester</span>
          <strong>N/A</strong>
          <small>Academic Year: N/A</small>
        </div>
      </section>

      <section className="student-summary-grid">
        {summaryCards.map((card) => {
          let value = card.value || "N/A";

          if (card.label === "Overall Attendance") {
            value = attendanceLoading
              ? "..."
              : `${overallAttendance}%`;
          }

          if (card.label === "Classes Attended") {
            value = attendanceLoading
              ? "..."
              : classesAttended;
          }

          if (card.label === "Classes Missed") {
            value = attendanceLoading
              ? "..."
              : classesMissed;
          }

          return (
            <article
              className="student-summary-card"
              key={card.label}
            >
              <div className="student-summary-icon">
                <FontAwesomeIcon icon={card.icon} />
              </div>

              <div className="student-summary-content">
                <span>{card.label}</span>
                <strong>{value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="student-dashboard-grid">
        <article className="student-dashboard-card student-attendance-card">
          <div className="student-card-header">
            <div>
              <h2>Attendance Overview</h2>
              <p>Your attendance summary</p>
            </div>

            <div className="student-card-icon">
              <FontAwesomeIcon icon={faChartPie} />
            </div>
          </div>

          <div className="student-attendance-main">
            <div className="student-attendance-circle">
              <span>
                {attendanceLoading
                  ? "..."
                  : `${overallAttendance}%`}
              </span>
            </div>

            <div className="student-attendance-label">
              <strong>Overall Attendance</strong>

              <span>
                {attendanceError
                  ? attendanceError
                  : "Based on attendance records currently available."}
              </span>
            </div>
          </div>

          <div className="student-attendance-stats">
            <div>
              <span className="student-status-dot student-present-dot" />

              <div>
                <small>Present</small>
                <strong>
                  {attendanceLoading ? "..." : classesAttended}
                </strong>
              </div>
            </div>

            <div>
              <span className="student-status-dot student-absent-dot" />

              <div>
                <small>Absent</small>
                <strong>
                  {attendanceLoading ? "..." : classesMissed}
                </strong>
              </div>
            </div>

            <div>
              <span className="student-status-dot student-late-dot" />

              <div>
                <small>Late</small>
                <strong>
                  {attendanceLoading ? "..." : classesLate}
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article className="student-dashboard-card student-schedule-card">
          <div className="student-card-header">
            <div>
              <h2>Today&apos;s Schedule</h2>
              <p>Your classes for today</p>
            </div>

            <div className="student-card-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
          </div>

          <div className="student-empty-state">
            <div className="student-empty-icon">
              <FontAwesomeIcon icon={faCalendarDays} />
            </div>

            <h3>No schedule available</h3>

            <p>
              Your class schedule will appear here once
              timetable data is available.
            </p>
          </div>
        </article>
      </section>

      <section className="student-dashboard-grid">
        <article className="student-dashboard-card">
          <div className="student-card-header">
            <div>
              <h2>My Courses</h2>
              <p>Your currently enrolled courses</p>
            </div>

            <button
              type="button"
              className="student-card-link"
              onClick={() => navigate("/student/courses")}
            >
              View All
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          <div className="student-empty-state">
            <div className="student-empty-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>

            <h3>No course data available</h3>

            <p>
              Your enrolled courses are available from
              the My Courses section.
            </p>
          </div>
        </article>

        <article className="student-dashboard-card">
          <div className="student-card-header">
            <div>
              <h2>Recent Attendance</h2>
              <p>Your latest attendance records</p>
            </div>

            <button
              type="button"
              className="student-card-link"
              onClick={() =>
                navigate("/student/attendance")
              }
            >
              View All
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          {attendanceLoading ? (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>

              <h3>Loading attendance...</h3>

              <p>
                Retrieving your latest attendance records.
              </p>
            </div>
          ) : attendanceError ? (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faCircleXmark} />
              </div>

              <h3>Unable to load attendance</h3>

              <p>{attendanceError}</p>

              <button
                type="button"
                onClick={handleRetryAttendance}
              >
                Retry
              </button>
            </div>
          ) : recentAttendance.length === 0 ? (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>

              <h3>No attendance records</h3>

              <p>
                Recent attendance records will appear here
                when attendance data is available.
              </p>
            </div>
          ) : (
            <div className="student-attendance-list">
              {recentAttendance.map((record) => (
                <div
                  className="student-attendance-item"
                  key={record.attendance_id}
                >
                  <div className="student-attendance-main">
                    <div className="student-attendance-icon">
                      <FontAwesomeIcon
                        icon={faCalendarCheck}
                      />
                    </div>

                    <div>
                      <strong>Attendance Record</strong>

                      <span>
                        Session {record.session_id || "N/A"}
                      </span>

                      <small>
                        {formatDate(record.marked_at)} â€¢{" "}
                        {formatTime(record.marked_at)}
                      </small>
                    </div>
                  </div>

                  <div className="student-attendance-status">
                    <span
                      className={`student-status-badge ${getStatusClass(
                        record.status
                      )}`}
                    >
                      {getStatusText(record.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="student-dashboard-card student-alert-card">
        <div className="student-card-header">
          <div>
            <h2>Academic Alerts</h2>
            <p>Important updates and notifications</p>
          </div>

          <div className="student-card-icon">
            <FontAwesomeIcon icon={faBell} />
          </div>
        </div>

        <div className="student-alert-empty">
          <FontAwesomeIcon icon={faBell} />
          <span>No new notifications</span>
        </div>
      </section>

      <section className="student-quick-actions">
        <div className="student-section-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Access commonly used student features</p>
          </div>
        </div>

        <div className="student-actions-grid">
          {quickActions.map((action) => (
            <button
              type="button"
              className="student-action-card"
              key={action.path}
              onClick={() => navigate(action.path)}
            >
              <span className="student-action-icon">
                <FontAwesomeIcon icon={action.icon} />
              </span>

              <span className="student-action-content">
                <strong>{action.label}</strong>
                <small>{action.description}</small>
              </span>

              <FontAwesomeIcon
                className="student-action-arrow"
                icon={faArrowRight}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="student-dashboard-card">
        <div className="student-card-header">
          <div>
            <h2>Backend Connection</h2>
            <p>Student portal access status</p>
          </div>

          <div className="student-card-icon">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>
        </div>

        <div className="student-alert-empty">
          <span>
            {backendStatus === "loading"
              ? "Verifying student backend access..."
              : backendMessage}
          </span>

          <strong>
            {backendStatus === "loading"
              ? "Connecting"
              : backendStatus === "connected"
                ? "Connected"
                : "Connection Issue"}
          </strong>
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
