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
} from "@fortawesome/free-solid-svg-icons";
import {
  getStudentCourses,
} from "../../services/attendanceService";
import "./Courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        setError("");

        const result = await getStudentCourses();

        if (result?.success) {
          setCourses(result.data ?? []);
        } else {
          setCourses([]);
          setError(
            result?.message || "Unable to load course information.",
          );
        }
      } catch (err) {
        setCourses([]);
        setError(
          err?.response?.data?.message ||
            "Unable to load course information.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const semesters = useMemo(() => {
    const uniqueSemesters = courses
      .map((course) => course.semester)
      .filter(Boolean);

    return [...new Set(uniqueSemesters)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !normalizedSearch ||
        String(course.course_code || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(course.course_name || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesSemester =
        semesterFilter === "all" ||
        String(course.semester || "") === semesterFilter;

      /*
       * The confirmed backend course endpoint does not provide
       * a course status field. Until that field exists, the only
       * supported status value is "all".
       */
      const matchesStatus = statusFilter === "all";

      return matchesSearch && matchesSemester && matchesStatus;
    });
  }, [courses, search, semesterFilter, statusFilter]);

  const currentSemester =
    courses.length > 0
      ? courses[0]?.semester || "N/A"
      : "N/A";

  const academicYear =
    courses.length > 0
      ? courses[0]?.academic_year || "N/A"
      : "N/A";

  const clearFilters = () => {
    setSearch("");
    setSemesterFilter("all");
    setStatusFilter("all");
  };

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

      {/* Summary */}
      <section className="student-courses-summary">
        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon blue">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>

          <div>
            <span>Enrolled Courses</span>

            <strong>
              {courses.length > 0 ? courses.length : "N/A"}
            </strong>

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

            <small>
              Course status is not provided by the API
            </small>
          </div>
        </article>

        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon purple">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>

          <div>
            <span>Completed Courses</span>

            <strong>N/A</strong>

            <small>
              Completion status is not provided by the API
            </small>
          </div>
        </article>

        <article className="student-courses-summary-card">
          <div className="student-courses-summary-icon orange">
            <FontAwesomeIcon icon={faChartPie} />
          </div>

          <div>
            <span>Average Attendance</span>

            <strong>N/A</strong>

            <small>
              Attendance is provided by the attendance API
            </small>
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
            disabled={loading || Boolean(error)}
          />
        </div>

        <label className="student-courses-filter">
          <span>Semester</span>

          <select
            value={semesterFilter}
            onChange={(event) =>
              setSemesterFilter(event.target.value)
            }
            disabled={loading || Boolean(error)}
          >
            <option value="all">All</option>

            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </label>

        <label className="student-courses-filter">
          <span>Status</span>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            disabled
          >
            <option value="all">All</option>
          </select>
        </label>

        <button
          type="button"
          className="student-courses-clear"
          onClick={clearFilters}
          disabled={
            loading ||
            Boolean(error) ||
            (!search &&
              semesterFilter === "all" &&
              statusFilter === "all")
          }
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
            {loading
              ? "Loading..."
              : `${filteredCourses.length} ${
                  filteredCourses.length === 1
                    ? "Course"
                    : "Courses"
                }`}
          </span>
        </div>

        {loading ? (
          <div className="student-courses-empty">
            <div className="student-courses-empty-icon">
              <FontAwesomeIcon icon={faClock} />
            </div>

            <h3>Loading course data</h3>

            <p>
              Fetching your enrolled courses from the backend.
            </p>
          </div>
        ) : error ? (
          <div className="student-courses-empty">
            <div className="student-courses-empty-icon">
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>

            <h3>Unable to load courses</h3>

            <p>{error}</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="student-courses-empty">
            <div className="student-courses-empty-icon">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>

            <h3>
              {courses.length === 0
                ? "No course data available"
                : "No matching courses"}
            </h3>

            <p>
              {courses.length === 0
                ? "Your enrolled courses will appear here once course information is available from the academic system."
                : "No enrolled courses match the selected search or semester filter."}
            </p>
          </div>
        ) : (
          <div className="student-courses-grid">
            {filteredCourses.map((course) => (
              <article
                className="student-course-card"
                key={
                  course.enrollment_id ??
                  course.offering_id ??
                  course.course_id
                }
              >
                <div className="student-course-card-top">
                  <div className="student-course-code">
                    {course.course_code || "N/A"}
                  </div>

                  <span className="student-course-status">
                    Enrolled
                  </span>
                </div>

                <h3>
                  {course.course_name || "N/A"}
                </h3>

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

                      <strong>N/A</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faUserTie} />

                    <span>
                      <small>Faculty</small>

                      <strong>N/A</strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faCalendarDays} />

                    <span>
                      <small>Semester</small>

                      <strong>
                        {course.semester || "N/A"}
                      </strong>
                    </span>
                  </div>

                  <div>
                    <FontAwesomeIcon icon={faClock} />

                    <span>
                      <small>Room</small>

                      <strong>
                        {course.room || "N/A"}
                      </strong>
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
                  disabled
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
            Your enrolled courses are retrieved for the authenticated
            student from the backend. Only information provided by the
            approved course API is displayed; unavailable academic
            fields remain N/A and are not fabricated or stored locally.
          </span>
        </div>
      </section>
    </section>
  );
}

export default Courses;