import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faCircleCheck,
  faGraduationCap,
  faChartPie,
  faMagnifyingGlass,
  faRotate,
  faBuildingColumns,
  faUserTie,
  faCalendarDays,
  faClock,
  faArrowRight,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import "./Courses.css";

const courseCards = [];

function Courses() {
  return (
    <section className="student-courses">
      {/* Header */}
      <header className="student-courses-header">
        <div>
          <p className="student-courses-eyebrow">MY COURSES</p>

          <h1>My Courses</h1>

          <p className="student-courses-subtitle">
            View your enrolled courses, faculty information, schedules and
            attendance.
          </p>
        </div>

        <div className="student-courses-semester">
          <span>Current Semester</span>
          <strong>N/A</strong>
          <small>Academic Year: N/A</small>

          <div className="student-courses-semester-icon">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className="student-courses-summary">
        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon blue">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>

          <div>
            <span>Enrolled Courses</span>
            <strong>N/A</strong>
            <small>Total courses enrolled</small>
          </div>
        </article>

        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon green">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <div>
            <span>Active Courses</span>
            <strong>N/A</strong>
            <small>Currently in progress</small>
          </div>
        </article>

        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon purple">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>

          <div>
            <span>Completed Courses</span>
            <strong>N/A</strong>
            <small>Successfully completed</small>
          </div>
        </article>

        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon orange">
            <FontAwesomeIcon icon={faChartPie} />
          </div>

          <div>
            <span>Average Attendance</span>
            <strong>N/A</strong>
            <small>Across all courses</small>
          </div>
        </article>
      </section>

      {/* Filters */}
      <section className="student-courses-filter-card">
        <div className="student-courses-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />

          <input
            type="search"
            placeholder="Search courses by code or name..."
            aria-label="Search courses"
            disabled
          />
        </div>

        <label className="student-courses-filter">
          <span>Semester</span>

          <select defaultValue="all" disabled>
            <option value="all">All</option>
          </select>
        </label>

        <label className="student-courses-filter">
          <span>Status</span>

          <select defaultValue="all" disabled>
            <option value="all">All</option>
          </select>
        </label>

        <button
          type="button"
          className="student-courses-clear"
          disabled
        >
          <FontAwesomeIcon icon={faRotate} />
          Clear Filters
        </button>
      </section>

      {/* Courses */}
      <section className="student-courses-list-section">
        <div className="student-courses-section-heading">
          <div>
            <p>ACADEMIC ENROLLMENT</p>
            <h2>Your Courses</h2>
          </div>

          <span className="student-courses-count">
            N/A Courses
          </span>
        </div>

        {courseCards.length === 0 ? (
          <div className="student-courses-empty">
            <div className="student-courses-empty-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>

            <h3>No course data available</h3>

            <p>
              Your enrolled courses will appear here once course information
              is provided by the academic system.
            </p>
          </div>
        ) : (
          <div className="student-courses-grid">
            {courseCards.map((course) => (
              <article
                className="student-course-card"
                key={course.id}
              >
                <div className="student-course-card-top">
                  <div className="student-course-code">
                    {course.code}
                  </div>

                  <span className="student-course-status">
                    {course.status}
                  </span>
                </div>

                <h3>{course.name}</h3>

                <div className="student-course-details">
                  <div>
                    <FontAwesomeIcon icon={faBuildingColumns} />
                    <span>
                      <small>Department</small>
                      <strong>{course.department}</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faBookOpen} />
                    <span>
                      <small>Credits</small>
                      <strong>{course.credits}</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faUserTie} />
                    <span>
                      <small>Faculty</small>
                      <strong>{course.faculty}</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>
                      <small>Semester</small>
                      <strong>{course.semester}</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faClock} />
                    <span>
                      <small>Schedule</small>
                      <strong>{course.schedule}</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faChartPie} />
                    <span>
                      <small>Attendance</small>
                      <strong>{course.attendance}</strong>
                    </span>
                  </div>
                </div>

                <button type="button" className="student-course-view">
                  View Course
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Course Information */}
      <section className="student-courses-info">
        <div className="student-courses-info-icon">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>

        <div>
          <strong>Course information</strong>

          <span>
            Your enrolled courses will be retrieved for the authenticated
            student from the backend. Course information displayed here will
            come from the academic system and will not be stored locally.
          </span>
        </div>
      </section>
    </section>
  );
}

export default Courses;