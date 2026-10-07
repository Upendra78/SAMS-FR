import { useEffect, useMemo, useState } from "react";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getFacultyCourses,
  getFacultyCourseDetails,
} from "../../services/facultyService";

import "./Classes.css";

const EMPTY_METRICS = {
  assignedCourses: null,
  todaysClasses: null,
  activeClasses: null,
  totalStudents: null,
};

const statuses = ["All"];

function formatMetric(value) {
  return value === null ? "N/A" : value;
}

function getInitials(name) {
  if (!name) {
    return "CL";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [semester, setSemester] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedClass, setSelectedClass] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const metrics = EMPTY_METRICS;

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getFacultyCourses();

        if (!result?.success || !Array.isArray(result?.data)) {
          throw new Error(
            result?.message || "Unable to load your assigned courses.",
          );
        }

        if (!isMounted) {
          return;
        }

        setClasses(result.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setClasses([]);
        setErrorMessage(
          error?.message || "Unable to load your assigned courses.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const departments = ["All"];

  const semesters = useMemo(() => {
    const uniqueSemesters = [
      ...new Set(
        classes
          .map((item) => item.semester)
          .filter(
            (semesterValue) =>
              semesterValue !== null &&
              semesterValue !== undefined &&
              semesterValue !== "",
          ),
      ),
    ];

    return ["All", ...uniqueSemesters];
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return classes.filter((item) => {
      const matchesSearch =
        !search ||
        String(item.course_id ?? "")
          .toLowerCase()
          .includes(search) ||
        item.course_code?.toLowerCase().includes(search) ||
        item.course_name?.toLowerCase().includes(search);

      const matchesDepartment = department === "All";

      const matchesSemester =
        semester === "All" || item.semester === semester;

      const matchesStatus = status === "All";

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [
    classes,
    searchTerm,
    department,
    semester,
    status,
  ]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartment("All");
    setSemester("All");
    setStatus("All");
  };

  const handleViewClass = async (courseId) => {
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedClass(null);

    try {
      const result = await getFacultyCourseDetails(courseId);

      if (!result?.success || !result?.data) {
        throw new Error(
          result?.message || "Unable to load course details.",
        );
      }

      setSelectedClass(result.data);
    } catch (error) {
      setDetailsError(
        error?.message || "Unable to load course details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseClassDetails = () => {
    setSelectedClass(null);
    setDetailsError("");
  };

  const handleStartAttendance = () => {
    // Attendance workflow will be connected when the
    // faculty attendance session API is wired into this page.
  };

  return (
    <section className="faculty-classes-page">
      {/* Page Header */}
      <header className="faculty-classes-header">
        <div>
          <span className="faculty-classes-eyebrow">
            Faculty Portal
          </span>

          <h1>Classes</h1>

          <p>
            View and manage your assigned courses, class schedules
            and student attendance.
          </p>
        </div>

        <button
          type="button"
          className="faculty-classes-primary-button"
          onClick={handleStartAttendance}
          disabled
          title="Attendance workflow is not connected yet"
        >
          <span aria-hidden="true">✓</span>
          Start Attendance
        </button>
      </header>

      {/* Summary Cards */}
      <div className="faculty-classes-summary-grid">
        <article className="faculty-classes-summary-card faculty-summary-blue">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <path d="M5 4.5h14v15H5z" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </div>

          <div>
            <span>Assigned Courses</span>
            <strong>
              {formatMetric(metrics.assignedCourses)}
            </strong>
          </div>
        </article>

        <article className="faculty-classes-summary-card faculty-summary-purple">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <rect
                x="4"
                y="5"
                width="16"
                height="15"
                rx="2"
              />
              <path d="M8 3v4M16 3v4M4 10h16" />
            </svg>
          </div>

          <div>
            <span>Today's Classes</span>
            <strong>
              {formatMetric(metrics.todaysClasses)}
            </strong>
          </div>
        </article>

        <article className="faculty-classes-summary-card faculty-summary-green">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
              <path d="m8.5 12 2.2 2.2 4.8-5" />
            </svg>
          </div>

          <div>
            <span>Active Classes</span>
            <strong>
              {formatMetric(metrics.activeClasses)}
            </strong>
          </div>
        </article>

        <article className="faculty-classes-summary-card faculty-summary-orange">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="8" r="3" />
              <path d="M3.5 19c.4-3.1 2.3-5 5.5-5s5.1 1.9 5.5 5" />
              <path d="M15 6.5a3 3 0 0 1 0 5.8M16.5 14c2.2.5 3.5 2.1 4 5" />
            </svg>
          </div>

          <div>
            <span>Total Students</span>
            <strong>
              {formatMetric(metrics.totalStudents)}
            </strong>
          </div>
        </article>
      </div>

      {/* Filters */}
      <div className="faculty-classes-filter-card">
        <div className="faculty-classes-search">
          <label htmlFor="faculty-class-search">
            Search Classes
          </label>

          <div className="faculty-classes-search-input">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.3" />
              <path d="m16 16 4.5 4.5" />
            </svg>

            <input
              id="faculty-class-search"
              type="search"
              placeholder="Search by course ID or course name..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        <div className="faculty-classes-filter">
          <label htmlFor="faculty-class-department">
            Department
          </label>

          <select
            id="faculty-class-department"
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="faculty-classes-filter">
          <label htmlFor="faculty-class-semester">
            Semester
          </label>

          <select
            id="faculty-class-semester"
            value={semester}
            onChange={(event) =>
              setSemester(event.target.value)
            }
          >
            {semesters.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="faculty-classes-filter">
          <label htmlFor="faculty-class-status">
            Status
          </label>

          <select
            id="faculty-class-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="faculty-classes-clear-button"
          onClick={handleClearFilters}
        >
          <span aria-hidden="true">↻</span>
          Clear Filters
        </button>
      </div>

      {/* Classes */}
      <div className="faculty-classes-section">
        <div className="faculty-classes-section-header">
          <div>
            <h2>My Classes</h2>

            <p>
              Courses currently assigned to your faculty account.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="faculty-classes-empty-card">
            <div
              className="faculty-classes-empty-icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M5 4.5h14v15H5z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>

            <h3>Loading classes...</h3>

            <p>
              Your assigned courses are being loaded.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="faculty-classes-empty-card">
            <div
              className="faculty-classes-empty-icon"
              aria-hidden="true"
            >
              !
            </div>

            <h3>Unable to load classes</h3>

            <p>{errorMessage}</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="faculty-classes-empty-card">
            <div
              className="faculty-classes-empty-icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M5 4.5h14v15H5z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>

            <h3>No classes available</h3>

            <p>
              No courses are currently assigned to your faculty
              account.
            </p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="faculty-classes-empty-card faculty-classes-search-empty">
            <div
              className="faculty-classes-empty-icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="10.8" cy="10.8" r="6.3" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </div>

            <h3>No matching classes</h3>

            <p>
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="faculty-class-grid">
            {filteredClasses.map((item) => (
              <article
                className="faculty-class-card"
                key={item.course_id}
              >
                <div className="faculty-class-card-header">
                  <div className="faculty-class-identity">
                    <div className="faculty-class-avatar">
                      {getInitials(item.course_name)}
                    </div>

                    <div>
                      <strong>{item.course_code}</strong>
                      <span>{item.course_name}</span>
                    </div>
                  </div>

                  <span className="faculty-class-status">
                    ● Assigned
                  </span>
                </div>

                <div className="faculty-class-details">
                  <div>
                    <span>Course ID</span>
                    <strong>{item.course_id}</strong>
                  </div>

                  <div>
                    <span>Credits</span>
                    <strong>
                      {item.credits ?? "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="faculty-class-meta">
                  <div>
                    <span>Semester</span>
                    <strong>
                      {item.semester ?? "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Section</span>
                    <strong>
                      {item.section ?? "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="faculty-class-card-footer">
                  <button
                    type="button"
                    className="faculty-class-secondary-button"
                    onClick={() => handleViewClass(item.course_id)}
                    disabled={detailsLoading}
                  >
                    {detailsLoading ? "Loading..." : "View Class"}
                  </button>

                  <button
                    type="button"
                    className="faculty-class-primary-small"
                    onClick={handleStartAttendance}
                    disabled
                    title="Attendance workflow is not connected yet"
                  >
                    Start Attendance
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="faculty-classes-pagination">
        <span>
          Showing {filteredClasses.length} of {classes.length} classes
        </span>

        <div>
          <button type="button" disabled>
            ‹ Previous
          </button>

          <button
            type="button"
            className="faculty-pagination-number"
            disabled
          >
            1
          </button>

          <button type="button" disabled>
            Next ›
          </button>
        </div>
      </div>

      {/* Integration Notice */}
      <div className="faculty-classes-integration">
        <div className="faculty-integration-icon">i</div>

        <div>
          <strong>Backend integration active</strong>

          <span>
            Assigned courses are now loaded from the faculty
            course API. Department, student-count, schedule and
            attendance metrics require additional backend data.
          </span>
        </div>

        <span className="faculty-integration-badge">
          Courses Connected
        </span>
      </div>

      {/* Course Details Loading */}
      {detailsLoading && (
        <div className="faculty-classes-empty-card">
          <h3>Loading class details...</h3>

          <p>
            The selected course details are being loaded.
          </p>
        </div>
      )}

      {/* Course Details Error */}
      {detailsError && !detailsLoading && (
        <div className="faculty-classes-empty-card">
          <h3>Unable to load class details</h3>

          <p>{detailsError}</p>
        </div>
      )}

      {/* View Class Modal */}
      {selectedClass && (
        <div
          className="faculty-class-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseClassDetails();
            }
          }}
        >
          <div
            className="faculty-class-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-class-title"
          >
            <div className="faculty-class-modal-header">
              <div>
                <span className="faculty-classes-eyebrow">
                  Class Overview
                </span>

                <h2 id="faculty-class-title">
                  {selectedClass.course_name ?? "Course"}
                </h2>

                <p>
                  {selectedClass.course_code ?? "N/A"}
                </p>
              </div>

              <button
                type="button"
                className="faculty-class-modal-close"
                onClick={handleCloseClassDetails}
                aria-label="Close class details"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="faculty-class-modal-content">
              <div className="faculty-class-modal-info">
                <span>Course ID</span>

                <strong>
                  {selectedClass.course_id ?? "N/A"}
                </strong>
              </div>

              <div className="faculty-class-modal-info">
                <span>Course Code</span>

                <strong>
                  {selectedClass.course_code ?? "N/A"}
                </strong>
              </div>

              <div className="faculty-class-modal-info">
                <span>Credits</span>

                <strong>
                  {selectedClass.credits ?? "N/A"}
                </strong>
              </div>

              {selectedClass.offerings?.length > 0 ? (
                selectedClass.offerings.map((offering) => (
                  <div
                    className="faculty-class-modal-info"
                    key={offering.offering_id}
                  >
                    <span>
                      Offering {offering.offering_id ?? "N/A"}
                    </span>

                    <strong>
                      {[
                        offering.semester,
                        offering.section
                          ? `Section ${offering.section}`
                          : null,
                        offering.academic_year,
                        offering.room
                          ? `Room ${offering.room}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "N/A"}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="faculty-class-modal-info">
                  <span>Offerings</span>

                  <strong>
                    No offering details available
                  </strong>
                </div>
              )}
            </div>

            <div className="faculty-class-modal-section">
              <h3>Students</h3>

              <div className="faculty-class-modal-empty">
                Student information is not included in the faculty
                course API response.
              </div>
            </div>

            <div className="faculty-class-modal-section">
              <h3>Schedule</h3>

              <div className="faculty-class-modal-empty">
                Detailed class schedule information is not included
                in the faculty course API response.
              </div>
            </div>

            <div className="faculty-class-modal-footer">
              <button
                type="button"
                className="faculty-class-secondary-button"
                onClick={handleCloseClassDetails}
              >
                Close
              </button>

              <button
                type="button"
                className="faculty-class-primary-small"
                disabled
                title="Attendance workflow is not connected yet"
              >
                Start Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Classes;