import { useEffect, useMemo, useState } from "react";
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
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { getStudentCourses } from "../../services/portalService";
import "./Courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      try {
        setLoading(true);
        setError("");

        const result = await getStudentCourses();

        if (!mounted) return;

        if (result?.success && Array.isArray(result.data)) {
          setCourses(result.data);
        } else {
          setCourses([]);
          setError(result?.message || "Unable to load courses.");
        }
      } catch (err) {
        if (!mounted) return;

        console.error("Failed to load student courses:", err);

        setCourses([]);
        setError(
          err?.response?.data?.message ||
            "Unable to connect to the course service."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !searchValue ||
        course.course_code?.toLowerCase().includes(searchValue) ||
        course.course_name?.toLowerCase().includes(searchValue);

      const matchesSemester =
        semester === "all" ||
        String(course.semester) === String(semester);

      const matchesStatus =
        status === "all" ||
        course.status?.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesSemester && matchesStatus;
    });
  }, [courses, search, semester, status]);

  const semesters = useMemo(() => {
    return [...new Set(courses.map((course) => course.semester).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b));
  }, [courses]);

  const enrolledCount = courses.length;

  const activeCount = courses.filter(
    (course) => course.status?.toUpperCase() === "ACTIVE"
  ).length;

  const completedCount = courses.filter(
    (course) => course.status?.toUpperCase() === "COMPLETED"
  ).length;

  const currentSemester =
    courses.length > 0
      ? courses[0].semester ?? "N/A"
      : "N/A";

  const academicYear =
    courses.length > 0
      ? courses[0].academic_year ?? "N/A"
      : "N/A";

  function clearFilters() {
    setSearch("");
    setSemester("all");
    setStatus("all");
  }

  function formatStatus(value) {
    if (!value) return "N/A";

    return value.charAt(0) + value.slice(1).toLowerCase();
  }

  function formatSchedule(course) {
    if (course.schedule) {
      return course.schedule;
    }

    if (course.room) {
      return `Room ${course.room}`;
    }

    return "N/A";
  }

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
          <strong>{currentSemester}</strong>
          <small>Academic Year: {academicYear}</small>

          <div className="student-courses-semester-icon">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="student-courses-empty">
          <div className="student-courses-empty-icon">
            <FontAwesomeIcon icon={faRotate} spin />
          </div>

          <h3>Loading courses...</h3>

          <p>
            Retrieving your enrolled courses from the academic system.
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="student-courses-empty">
          <div className="student-courses-empty-icon">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>

          <h3>Unable to load courses</h3>

          <p>{error}</p>

          <button
            type="button"
            className="student-course-view"
            onClick={() => window.location.reload()}
          >
            Retry
            <FontAwesomeIcon icon={faRotate} />
          </button>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && (
        <>
          <section className="student-courses-summary">
            <article className="student-courses-summary-card">
              <div className="student-courses-summary-icon blue">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>

              <div>
                <span>Enrolled Courses</span>
                <strong>{enrolledCount}</strong>
                <small>Total courses enrolled</small>
              </div>
            </article>

            <article className="student-courses-summary-card">
              <div className="student-courses-summary-icon green">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>

              <div>
                <span>Active Courses</span>
                <strong>{activeCount}</strong>
                <small>Currently in progress</small>
              </div>
            </article>

            <article className="student-courses-summary-card">
              <div className="student-courses-summary-icon purple">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>

              <div>
                <span>Completed Courses</span>
                <strong>{completedCount}</strong>
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
                <small>Attendance API not included in course response</small>
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
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <label className="student-courses-filter">
              <span>Semester</span>

              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
              >
                <option value="all">All</option>

                {semesters.map((item) => (
                  <option key={item} value={item}>
                    Semester {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="student-courses-filter">
              <span>Status</span>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="all">All</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </label>

            <button
              type="button"
              className="student-courses-clear"
              onClick={clearFilters}
              disabled={!search && semester === "all" && status === "all"}
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
                {filteredCourses.length}{" "}
                {filteredCourses.length === 1 ? "Course" : "Courses"}
              </span>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="student-courses-empty">
                <div className="student-courses-empty-icon">
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>

                <h3>
                  {courses.length === 0
                    ? "No course data available"
                    : "No courses match your filters"}
                </h3>

                <p>
                  {courses.length === 0
                    ? "No enrolled courses were returned by the academic system."
                    : "Try changing your search or filters."}
                </p>
              </div>
            ) : (
              <div className="student-courses-grid">
                {filteredCourses.map((course) => (
                  <article
                    className="student-course-card"
                    key={course.enrollment_id}
                  >
                    <div className="student-course-card-top">
                      <div className="student-course-code">
                        {course.course_code}
                      </div>

                      <span className="student-course-status">
                        {formatStatus(course.status)}
                      </span>
                    </div>

                    <h3>{course.course_name}</h3>

                    <div className="student-course-details">
                      <div>
                        <FontAwesomeIcon icon={faBuildingColumns} />
                        <span>
                          <small>Department</small>
                          <strong>N/A</strong>
                        </span>
                      </div>

                      <div>
                        <FontAwesomeIcon icon={faBookOpen} />
                        <span>
                          <small>Credits</small>
                          <strong>{course.credits ?? "N/A"}</strong>
                        </span>
                      </div>

                      <div>
                        <FontAwesomeIcon icon={faUserTie} />
                        <span>
                          <small>Faculty</small>
                          <strong>
                            {course.faculty?.name || "N/A"}
                          </strong>
                        </span>
                      </div>

                      <div>
                        <FontAwesomeIcon icon={faCalendarDays} />
                        <span>
                          <small>Semester</small>
                          <strong>{course.semester ?? "N/A"}</strong>
                        </span>
                      </div>

                      <div>
                        <FontAwesomeIcon icon={faClock} />
                        <span>
                          <small>Schedule / Room</small>
                          <strong>{formatSchedule(course)}</strong>
                        </span>
                      </div>

                      <div>
                        <FontAwesomeIcon icon={faChartPie} />
                        <span>
                          <small>Attendance</small>
                          <strong>N/A</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="student-course-view"
                    >
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
                Course information is retrieved from the backend for the
                authenticated student. Department, timetable and
                course-level attendance will be displayed when those fields
                are provided by their corresponding backend APIs.
              </span>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default Courses;