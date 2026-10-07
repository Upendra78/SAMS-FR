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
import "./StudentDashboard.css";
import { getStudentDashboard } from "../../services/portalService";
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
  getStudentCourses,
} from "../../services/attendanceService";

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
  const [summary, setSummary] = useState([]);
  const [courses, setCourses] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudentDashboard() {
      try {
        setDataLoading(true);
        setDataError("");

        const [
          dashboardResult,
          attendanceResult,
          summaryResult,
          coursesResult,
        ] = await Promise.all([
          getStudentDashboard(),
          getStudentAttendance(),
          getStudentAttendanceSummary(),
          getStudentCourses(),
        ]);

        if (!isMounted) {
          return;
        }

        /*
         * Student dashboard access verification.
         * The confirmed dashboard API only provides the student's role,
         * so it is used only for portal access confirmation.
         */
        if (
          dashboardResult?.success &&
          dashboardResult?.data?.role === "STUDENT"
        ) {
          setBackendStatus("connected");
          setBackendMessage("Student backend access confirmed.");
        } else {
          setBackendStatus("error");
          setBackendMessage(
            dashboardResult?.message ||
              "Unable to verify student backend access.",
          );
        }

        /*
         * Attendance records.
         */
        if (attendanceResult?.success) {
          setAttendance(attendanceResult.data ?? []);
        } else {
          setAttendance([]);
        }

        /*
         * Course-wise attendance summary.
         */
        if (summaryResult?.success) {
          setSummary(summaryResult.data ?? []);
        } else {
          setSummary([]);
        }

        /*
         * Enrolled courses.
         */
        if (coursesResult?.success) {
          setCourses(coursesResult.data ?? []);
        } else {
          setCourses([]);
        }

        /*
         * If one of the data endpoints fails while the dashboard
         * access endpoint succeeds, keep the dashboard usable and
         * show the appropriate N/A / empty states.
         */
        if (
          !attendanceResult?.success ||
          !summaryResult?.success ||
          !coursesResult?.success
        ) {
          setDataError(
            "Some student dashboard data is currently unavailable.",
          );
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          setBackendStatus("error");
          setBackendMessage(
            "Your session has expired. Please log in again.",
          );
        } else if (error?.response?.status === 403) {
          setBackendStatus("error");
          setBackendMessage(
            "Student access is required for this portal.",
          );
        } else {
          setBackendStatus("error");
          setBackendMessage(
            "Student backend service is currently unavailable.",
          );
        }

        setAttendance([]);
        setSummary([]);
        setCourses([]);
        setDataError(
          "Unable to load student dashboard data.",
        );
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    }

    loadStudentDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalClasses = summary.reduce(
    (total, course) =>
      total + Number(course.total_sessions || 0),
    0,
  );

  const totalPresent = summary.reduce(
    (total, course) =>
      total + Number(course.present_sessions || 0),
    0,
  );

  const totalAbsent = summary.reduce(
    (total, course) =>
      total + Number(course.absent_sessions || 0),
    0,
  );

  const overallAttendance =
    totalClasses > 0
      ? (totalPresent / totalClasses) * 100
      : null;

  const currentSemester =
    summary.length > 0
      ? summary[0]?.semester || "N/A"
      : courses.length > 0
        ? courses[0]?.semester || "N/A"
        : "N/A";

  const academicYear =
    courses.length > 0
      ? courses[0]?.academic_year || "N/A"
      : "N/A";

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
      return dateValue;
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

  const recentAttendance = attendance.slice(0, 5);

  return (
    <div className="student-dashboard">
      {/* Header */}
      <section className="student-dashboard-header">
        <div>
          <p className="student-dashboard-eyebrow">
            OVERVIEW
          </p>

          <h1>Student Dashboard</h1>

          <p className="student-dashboard-subtitle">
            Welcome back, Student. Here&apos;s your academic
            overview.
          </p>
        </div>

        <div className="student-semester-info">
          <span>Current Semester</span>

          <strong>{currentSemester}</strong>

          <small>
            Academic Year: {academicYear}
          </small>
        </div>
      </section>

      {/* Summary */}
      <section className="student-summary-grid">
        <article className="student-summary-card">
          <div className="student-summary-icon">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>

          <div className="student-summary-content">
            <span>Overall Attendance</span>

            <strong>
              {formatPercentage(overallAttendance)}
            </strong>
          </div>
        </article>

        <article className="student-summary-card">
          <div className="student-summary-icon">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <div className="student-summary-content">
            <span>Classes Attended</span>

            <strong>
              {summary.length > 0
                ? totalPresent
                : "N/A"}
            </strong>
          </div>
        </article>

        <article className="student-summary-card">
          <div className="student-summary-icon">
            <FontAwesomeIcon icon={faCircleXmark} />
          </div>

          <div className="student-summary-content">
            <span>Classes Missed</span>

            <strong>
              {summary.length > 0
                ? totalAbsent
                : "N/A"}
            </strong>
          </div>
        </article>

        <article className="student-summary-card">
          <div className="student-summary-icon">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>

          <div className="student-summary-content">
            <span>Enrolled Courses</span>

            <strong>
              {courses.length > 0
                ? courses.length
                : "N/A"}
            </strong>
          </div>
        </article>
      </section>

      {/* Attendance + Schedule */}
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
                {formatPercentage(overallAttendance)}
              </span>
            </div>

            <div className="student-attendance-label">
              <strong>Overall Attendance</strong>

              <span>
                {summary.length > 0
                  ? "Based on recorded attendance sessions."
                  : "Attendance data will appear here once connected."}
              </span>
            </div>
          </div>

          <div className="student-attendance-stats">
            <div>
              <span className="student-status-dot student-present-dot" />

              <div>
                <small>Present</small>

                <strong>
                  {summary.length > 0
                    ? totalPresent
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div>
              <span className="student-status-dot student-absent-dot" />

              <div>
                <small>Absent</small>

                <strong>
                  {summary.length > 0
                    ? totalAbsent
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div>
              <span className="student-status-dot student-late-dot" />

              <div>
                <small>Late</small>

                <strong>N/A</strong>
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

      {/* Courses + Recent Attendance */}
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

          {dataLoading ? (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>

              <h3>Loading course data</h3>

              <p>
                Fetching your enrolled courses.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>

              <h3>No course data available</h3>

              <p>
                Your enrolled courses will appear here once
                course information is available.
              </p>
            </div>
          ) : (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>

              <h3>
                {courses.length}{" "}
                {courses.length === 1
                  ? "course"
                  : "courses"}{" "}
                enrolled
              </h3>

              <p>
                Open My Courses to view your complete
                enrollment information.
              </p>
            </div>
          )}
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
              onClick={() => navigate("/student/attendance")}
            >
              View All

              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          {dataLoading ? (
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>

              <h3>Loading attendance</h3>

              <p>
                Fetching your recent attendance records.
              </p>
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
            <div className="student-empty-state student-empty-state-compact">
              <div className="student-empty-icon">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>

              <h3>
                {recentAttendance.length} recent{" "}
                {recentAttendance.length === 1
                  ? "record"
                  : "records"}
              </h3>

              <p>
                Latest record:{" "}
                {formatDate(
                  recentAttendance[0]?.session_date,
                )}{" "}
                at{" "}
                {formatTime(
                  recentAttendance[0]?.marked_at,
                )}
                . Open Attendance to view all records.
              </p>

              <small>
                Status:{" "}
                {formatStatus(
                  recentAttendance[0]?.status,
                )}
              </small>
            </div>
          )}
        </article>
      </section>

      {/* Academic Alerts */}
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

      {/* Quick Actions */}
      <section className="student-quick-actions">
        <div className="student-section-heading">
          <div>
            <h2>Quick Actions</h2>

            <p>
              Access commonly used student features
            </p>
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

      {/* Backend Connection */}
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

      {/* Data Error */}
      {!dataLoading && dataError && (
        <section className="student-dashboard-card">
          <div className="student-alert-empty">
            <span>{dataError}</span>

            <strong>Data unavailable</strong>
          </div>
        </section>
      )}
    </div>
  );
}

export default StudentDashboard;