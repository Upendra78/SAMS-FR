import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
} from "../../services/attendanceService";
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

  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError("");

        const [attendanceResult, summaryResult] = await Promise.all([
          getStudentAttendance(),
          getStudentAttendanceSummary(),
        ]);

        if (attendanceResult?.success) {
          setAttendance(attendanceResult.data ?? []);
        } else {
          setAttendance([]);
        }

        if (summaryResult?.success) {
          setSummary(summaryResult.data ?? []);
        } else {
          setSummary([]);
        }
      } catch (err) {
        setAttendance([]);
        setSummary([]);

        setError(
          err?.response?.data?.message ||
            "Unable to load attendance data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  const totalClasses = summary.reduce(
    (total, course) => total + Number(course.total_sessions || 0),
    0
  );

  const totalPresent = summary.reduce(
    (total, course) => total + Number(course.present_sessions || 0),
    0
  );

  const totalAbsent = summary.reduce(
    (total, course) => total + Number(course.absent_sessions || 0),
    0
  );

  const overallAttendance =
    totalClasses > 0
      ? (totalPresent / totalClasses) * 100
      : null;

  const currentSemester =
    summary.length > 0
      ? summary[0]?.semester || "N/A"
      : "N/A";

  const academicYear =
    summary.length > 0
      ? summary[0]?.academic_year || "N/A"
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

  const getStatusLabel = (status) => {
    if (!status) {
      return "N/A";
    }

    return String(status).replace(/_/g, " ");
  };

  return (
    <section className="student-attendance">
      {/* Loading State */}
      {loading && (
        <div className="student-attendance-note">
          <div className="student-attendance-note-icon">
            <FontAwesomeIcon icon={faClock} />
          </div>

          <div>
            <strong>Loading attendance</strong>
            <span>Fetching your attendance records...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="student-attendance-note">
          <div className="student-attendance-note-icon">
            <FontAwesomeIcon icon={faCircleXmark} />
          </div>

          <div>
            <strong>Unable to load attendance</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="student-attendance-header">
        <div>
          <p className="student-attendance-eyebrow">
            ATTENDANCE MONITORING
          </p>

          <h1>Attendance</h1>

          <p className="student-attendance-subtitle">
            View your attendance records and course-wise attendance.
          </p>
        </div>

        <div className="student-attendance-semester">
          <span>Current Semester</span>

          <strong>{currentSemester}</strong>

          <small>Academic Year: {academicYear}</small>

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

            <strong>
              {formatPercentage(overallAttendance)}
            </strong>

            <small>Attendance rate</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon green">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <div>
            <span>Classes Attended</span>

            <strong>
              {summary.length > 0 ? totalPresent : "N/A"}
            </strong>

            <small>Present sessions</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon red">
            <FontAwesomeIcon icon={faCircleXmark} />
          </div>

          <div>
            <span>Classes Missed</span>

            <strong>
              {summary.length > 0 ? totalAbsent : "N/A"}
            </strong>

            <small>Absent sessions</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon purple">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>

          <div>
            <span>Total Classes</span>

            <strong>
              {summary.length > 0 ? totalClasses : "N/A"}
            </strong>

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
              <span>
                {formatPercentage(overallAttendance)}
              </span>
            </div>

            <div className="student-attendance-overview-text">
              <strong>Overall Attendance</strong>

              <span>
                {summary.length > 0
                  ? "Your attendance summary is based on the recorded sessions provided by the backend."
                  : "Attendance data will appear here once attendance records are available."}
              </span>
            </div>
          </div>

          <div className="student-attendance-breakdown">
            <div>
              <span className="attendance-dot present" />

              <div>
                <small>Present</small>

                <strong>
                  {summary.length > 0 ? totalPresent : "N/A"}
                </strong>
              </div>
            </div>

            <div>
              <span className="attendance-dot absent" />

              <div>
                <small>Absent</small>

                <strong>
                  {summary.length > 0 ? totalAbsent : "N/A"}
                </strong>
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

                <strong>
                  {summary.length > 0 ? totalClasses : "N/A"}
                </strong>
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
              {summary.length > 0 ? (
                summary.map((course) => (
                  <tr
                    key={`${course.offering_id}-${course.course_code}`}
                  >
                    <td>{course.course_code || "N/A"}</td>

                    <td>{course.course_name || "N/A"}</td>

                    <td>{course.semester || "N/A"}</td>

                    <td>
                      {course.total_sessions ?? "N/A"}
                    </td>

                    <td>
                      {course.present_sessions ?? "N/A"}
                    </td>

                    <td>
                      {course.absent_sessions ?? "N/A"}
                    </td>

                    <td>N/A</td>

                    <td>
                      {formatPercentage(
                        course.attendance_percentage
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">
                    <div className="student-table-empty">
                      <div className="student-attendance-empty-icon">
                        <FontAwesomeIcon icon={faFileLines} />
                      </div>

                      <h3>No course data available</h3>

                      <p>
                        Course-wise attendance will appear here once
                        attendance records are available.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
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
            onClick={() =>
              navigate("/student/attendance-history")
            }
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
              {attendance.length > 0 ? (
                attendance.slice(0, 5).map((record) => (
                  <tr key={record.attendance_id}>
                    <td>
                      {formatDate(record.session_date)}
                    </td>

                    <td>
                      <div>
                        <strong>
                          {record.course_code || "N/A"}
                        </strong>

                        <small>
                          {record.course_name || "N/A"}
                        </small>
                      </div>
                    </td>

                    <td>
                      {record.section || "N/A"}
                    </td>

                    <td>
                      {formatTime(record.marked_at)}
                    </td>

                    <td>
                      {getStatusLabel(record.status)}
                    </td>
                  </tr>
                ))
              ) : (
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
              )}
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
            Attendance records are provided by the backend for the
            authenticated student. The frontend displays the returned
            attendance information and does not store attendance results
            locally.
          </span>
        </div>
      </div>
    </section>
  );
}

export default Attendance;