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

const summaryCards = [
  {
    label: "Overall Attendance",
    value: "N/A",
    icon: faCalendarCheck,
  },
  {
    label: "Classes Attended",
    value: "N/A",
    icon: faCircleCheck,
  },
  {
    label: "Classes Missed",
    value: "N/A",
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

  return (
    <div className="student-dashboard">
      <section className="student-dashboard-header">
        <div>
          <p className="student-dashboard-eyebrow">OVERVIEW</p>
          <h1>Student Dashboard</h1>
          <p className="student-dashboard-subtitle">
            Welcome back, Student. Here&apos;s your academic overview.
          </p>
        </div>

        <div className="student-semester-info">
          <span>Current Semester</span>
          <strong>N/A</strong>
          <small>Academic Year: N/A</small>
        </div>
      </section>

      <section className="student-summary-grid">
        {summaryCards.map((card) => (
          <article className="student-summary-card" key={card.label}>
            <div className="student-summary-icon">
              <FontAwesomeIcon icon={card.icon} />
            </div>

            <div className="student-summary-content">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
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
              <span>N/A</span>
            </div>

            <div className="student-attendance-label">
              <strong>Overall Attendance</strong>
              <span>Attendance data will appear here once connected.</span>
            </div>
          </div>

          <div className="student-attendance-stats">
            <div>
              <span className="student-status-dot student-present-dot" />
              <div>
                <small>Present</small>
                <strong>N/A</strong>
              </div>
            </div>

            <div>
              <span className="student-status-dot student-absent-dot" />
              <div>
                <small>Absent</small>
                <strong>N/A</strong>
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
              Your class schedule will appear here once timetable data is
              available.
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

          <div className="student-empty-state student-empty-state-compact">
            <div className="student-empty-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>
            <h3>No course data available</h3>
            <p>
              Your enrolled courses will appear here once connected to the
              academic system.
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
              onClick={() => navigate("/student/attendance")}
            >
              View All
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          <div className="student-empty-state student-empty-state-compact">
            <div className="student-empty-icon">
              <FontAwesomeIcon icon={faCalendarCheck} />
            </div>
            <h3>No attendance records</h3>
            <p>
              Recent attendance records will appear here when attendance data
              is available.
            </p>
          </div>
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
    </div>
  );
}

export default StudentDashboard;