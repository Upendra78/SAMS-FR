import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faBookOpen,
  faCalendarDays,
  faChartPie,
  faArrowRight,
  faRotate,
  faMagnifyingGlass,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import "./Attendance.css";

function Attendance() {
  const navigate = useNavigate();

  return (
    <section className="student-attendance">
      {/* Header */}
      <header className="student-attendance-header">
        <div>
          <p className="student-attendance-eyebrow">ATTENDANCE MONITORING</p>

          <h1>Attendance</h1>

          <p className="student-attendance-subtitle">
            View your attendance records and course-wise attendance.
          </p>
        </div>

        <div className="student-attendance-semester">
          <span>Current Semester</span>
          <strong>N/A</strong>
          <small>Academic Year: N/A</small>

          <div className="student-attendance-semester-icon">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className="student-attendance-summary">
        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon blue">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>

          <div>
            <span>Overall Attendance</span>
            <strong>N/A</strong>
            <small>Attendance rate</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon green">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <div>
            <span>Classes Attended</span>
            <strong>N/A</strong>
            <small>Present sessions</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon red">
            <FontAwesomeIcon icon={faCircleXmark} />
          </div>

          <div>
            <span>Classes Missed</span>
            <strong>N/A</strong>
            <small>Absent sessions</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon purple">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>

          <div>
            <span>Total Classes</span>
            <strong>N/A</strong>
            <small>Recorded sessions</small>
          </div>
        </article>
      </section>

      {/* Overview + Schedule */}
      <section className="student-attendance-main-grid">
        <article className="student-attendance-card">
          <div className="student-attendance-card-header">
            <div>
              <h2>Attendance Overview</h2>
              <p>Your attendance summary</p>
            </div>

            <div className="student-attendance-card-icon">
              <FontAwesomeIcon icon={faChartPie} />
            </div>
          </div>

          <div className="student-attendance-overview">
            <div className="student-attendance-circle">
              <span>N/A</span>
            </div>

            <div className="student-attendance-overview-text">
              <strong>Overall Attendance</strong>

              <span>
                Attendance data will appear here once attendance records are
                available.
              </span>
            </div>
          </div>

          <div className="student-attendance-breakdown">
            <div>
              <span className="attendance-dot present" />

              <div>
                <small>Present</small>
                <strong>N/A</strong>
              </div>
            </div>

            <div>
              <span className="attendance-dot absent" />

              <div>
                <small>Absent</small>
                <strong>N/A</strong>
              </div>
            </div>

            <div>
              <span className="attendance-dot late" />

              <div>
                <small>Late</small>
                <strong>N/A</strong>
              </div>
            </div>

            <div>
              <span className="attendance-dot total" />

              <div>
                <small>Total Classes</small>
                <strong>N/A</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="student-attendance-card">
          <div className="student-attendance-card-header">
            <div>
              <h2>Today's Schedule</h2>
              <p>Your classes for today</p>
            </div>

            <div className="student-attendance-card-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>
          </div>

          <div className="student-attendance-empty">
            <div className="student-attendance-empty-icon">
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

      {/* Course-wise Attendance */}
      <section className="student-attendance-card student-course-attendance">
        <div className="student-attendance-card-header course-header">
          <div>
            <h2>Course-wise Attendance</h2>
            <p>Your attendance by course</p>
          </div>
        </div>

        <div className="student-attendance-filters">
          <div className="student-attendance-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />

            <input
              type="search"
              placeholder="Search course..."
              aria-label="Search course"
              disabled
            />
          </div>

          <label className="student-attendance-filter">
            <span>Semester</span>

            <select defaultValue="all" disabled>
              <option value="all">All</option>
            </select>
          </label>

          <label className="student-attendance-filter">
            <span>Attendance Status</span>

            <select defaultValue="all" disabled>
              <option value="all">All</option>
            </select>
          </label>

          <button
            type="button"
            className="student-attendance-clear"
            disabled
          >
            <FontAwesomeIcon icon={faRotate} />
            Clear Filters
          </button>
        </div>

        <div className="student-attendance-table-wrapper">
          <table className="student-attendance-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Semester</th>
                <th>Total Classes</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Attendance</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="8">
                  <div className="student-table-empty">
                    <div className="student-attendance-empty-icon">
                      <FontAwesomeIcon icon={faFileLines} />
                    </div>

                    <h3>No course data available</h3>

                    <p>
                      Course-wise attendance will appear here once attendance
                      records are available.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Attendance */}
      <section className="student-attendance-card student-recent-attendance">
        <div className="student-attendance-card-header course-header">
          <div>
            <h2>Recent Attendance</h2>
            <p>Your latest attendance records</p>
          </div>

          <button
            type="button"
            className="student-attendance-view-all"
            onClick={() => navigate("/student/attendance-history")}
          >
            View All
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>

        <div className="student-attendance-table-wrapper">
          <table className="student-attendance-table recent-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Session</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="5">
                  <div className="student-table-empty">
                    <div className="student-attendance-empty-icon">
                      <FontAwesomeIcon icon={faCalendarCheck} />
                    </div>

                    <h3>No attendance records available</h3>

                    <p>
                      Recent attendance records will appear here once
                      attendance data is available.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Integration Note */}
      <div className="student-attendance-note">
        <div className="student-attendance-note-icon">
          <FontAwesomeIcon icon={faChartPie} />
        </div>

        <div>
          <strong>Attendance data</strong>

          <span>
            Attendance records will be provided by the backend for the
            authenticated student. The frontend will display the returned
            attendance information and will not store attendance results
            locally.
          </span>
        </div>
      </div>
    </section>
  );
}

export default Attendance;