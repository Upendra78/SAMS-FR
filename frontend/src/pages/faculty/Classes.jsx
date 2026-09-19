import { useMemo, useState } from "react";
import "./Classes.css";

const classes = [];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [semester, setSemester] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedClass, setSelectedClass] = useState(null);

  const metrics = EMPTY_METRICS;

  const departments = ["All"];
  const semesters = ["All"];

  const filteredClasses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return classes.filter((item) => {
      const matchesSearch =
        !search ||
        item.courseId?.toLowerCase().includes(search) ||
        item.courseName?.toLowerCase().includes(search);

      const matchesDepartment =
        department === "All" || item.department === department;

      const matchesSemester =
        semester === "All" || item.semester === semester;

      const matchesStatus =
        status === "All" || item.status === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [searchTerm, department, semester, status]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartment("All");
    setSemester("All");
    setStatus("All");
  };

  const handleStartAttendance = () => {
    // Attendance workflow will be connected when the backend
    // session API and attendance route are finalized.
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
            <strong>{formatMetric(metrics.assignedCourses)}</strong>
          </div>
        </article>

        <article className="faculty-classes-summary-card faculty-summary-purple">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M8 3v4M16 3v4M4 10h16" />
            </svg>
          </div>

          <div>
            <span>Today's Classes</span>
            <strong>{formatMetric(metrics.todaysClasses)}</strong>
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
            <strong>{formatMetric(metrics.activeClasses)}</strong>
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
            <strong>{formatMetric(metrics.totalStudents)}</strong>
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

        {classes.length === 0 ? (
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
              Your assigned classes will appear here when course
              assignment data is provided by the backend.
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
                key={item.courseId}
              >
                <div className="faculty-class-card-header">
                  <div className="faculty-class-identity">
                    <div className="faculty-class-avatar">
                      {getInitials(item.courseName)}
                    </div>

                    <div>
                      <strong>{item.courseId}</strong>
                      <span>{item.courseName}</span>
                    </div>
                  </div>

                  <span
                    className={`faculty-class-status faculty-class-status-${item.status?.toLowerCase()}`}
                  >
                    ● {item.status}
                  </span>
                </div>

                <div className="faculty-class-details">
                  <div>
                    <span>Department</span>
                    <strong>{item.department}</strong>
                  </div>

                  <div>
                    <span>Credits</span>
                    <strong>{item.credits ?? "N/A"}</strong>
                  </div>
                </div>

                <div className="faculty-class-meta">
                  <div>
                    <span>Students</span>
                    <strong>{item.students ?? "N/A"}</strong>
                  </div>

                  <div>
                    <span>Schedule</span>
                    <strong>{item.schedule ?? "N/A"}</strong>
                  </div>
                </div>

                <div className="faculty-class-card-footer">
                  <button
                    type="button"
                    className="faculty-class-secondary-button"
                    onClick={() => setSelectedClass(item)}
                  >
                    View Class
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
          <strong>Backend integration pending</strong>

          <span>
            Assigned classes will be loaded from the backend when
            the required faculty course-assignment API is available.
          </span>
        </div>

        <span className="faculty-integration-badge">
          Integration Pending
        </span>
      </div>

      {/* View Class Modal */}
      {selectedClass && (
        <div
          className="faculty-class-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedClass(null);
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
                  {selectedClass.courseName}
                </h2>

                <p>{selectedClass.courseId}</p>
              </div>

              <button
                type="button"
                className="faculty-class-modal-close"
                onClick={() => setSelectedClass(null)}
                aria-label="Close class details"
              >
                ×
              </button>
            </div>

            <div className="faculty-class-modal-content">
              <div className="faculty-class-modal-info">
                <span>Department</span>
                <strong>
                  {selectedClass.department ?? "N/A"}
                </strong>
              </div>

              <div className="faculty-class-modal-info">
                <span>Credits</span>
                <strong>
                  {selectedClass.credits ?? "N/A"}
                </strong>
              </div>

              <div className="faculty-class-modal-info">
                <span>Students</span>
                <strong>
                  {selectedClass.students ?? "N/A"}
                </strong>
              </div>

              <div className="faculty-class-modal-info">
                <span>Schedule</span>
                <strong>
                  {selectedClass.schedule ?? "N/A"}
                </strong>
              </div>
            </div>

            <div className="faculty-class-modal-section">
              <h3>Students</h3>

              <div className="faculty-class-modal-empty">
                Student information will be available when the
                backend enrollment data is connected.
              </div>
            </div>

            <div className="faculty-class-modal-section">
              <h3>Schedule</h3>

              <div className="faculty-class-modal-empty">
                Class schedule information will be displayed here
                when provided by the backend.
              </div>
            </div>

            <div className="faculty-class-modal-footer">
              <button
                type="button"
                className="faculty-class-secondary-button"
                onClick={() => setSelectedClass(null)}
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