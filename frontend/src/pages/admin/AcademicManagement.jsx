import { useMemo, useState } from "react";

import "./AcademicManagement.css";

const courses = [];

const EMPTY_METRICS = {
  totalCourses: null,
  activeCourses: null,
  offerings: null,
  enrollments: null,
};

const TABS = [
  {
    id: "courses",
    label: "Courses",
    icon: "▣",
  },
  {
    id: "offerings",
    label: "Course Offerings",
    icon: "▪",
  },
  {
    id: "enrollments",
    label: "Enrollments",
    icon: "♟",
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: "●",
  },
];

function formatMetric(value) {
  return value === null || value === undefined
    ? "N/A"
    : value;
}

function AcademicManagement() {
  const [activeTab, setActiveTab] = useState("courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    courseId: "",
    courseName: "",
    department: "",
    credits: "",
  });

  const metrics = EMPTY_METRICS;

  const departments = ["All"];
  const statuses = ["All"];

  const filteredCourses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !search ||
        course.courseId
          ?.toLowerCase()
          .includes(search) ||
        course.name?.toLowerCase().includes(search);

      const matchesDepartment =
        department === "All" ||
        course.department === department;

      const matchesStatus =
        status === "All" ||
        course.status === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [searchTerm, department, status]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    department !== "All" ||
    status !== "All";

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartment("All");
    setStatus("All");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddCourse = (event) => {
    event.preventDefault();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm("");
    setDepartment("All");
    setStatus("All");
  };

  const handleCloseModal = () => {
    setShowAddModal(false);

    setFormData({
      courseId: "",
      courseName: "",
      department: "",
      credits: "",
    });
  };

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case "offerings":
        return {
          title: "No course offerings available",
          description:
            "Course offering records will appear here when the required backend API is available.",
          icon: "▪",
        };

      case "enrollments":
        return {
          title: "No enrollments available",
          description:
            "Enrollment records will appear here when the academic enrollment integration is connected.",
          icon: "♟",
        };

      case "assignments":
        return {
          title: "No faculty assignments available",
          description:
            "Faculty assignment records will appear here when the required backend API is available.",
          icon: "●",
        };

      default:
        return {
          title: "No courses available",
          description:
            "Course records will appear here when the required course management API is available.",
          icon: "▣",
        };
    }
  };

  const emptyState = getEmptyStateContent();

  return (
    <section className="academic-management-page">
      <header className="academic-page-header">
        <div>
          <span className="academic-eyebrow">
            Admin Portal
          </span>

          <h1>Academic Management</h1>

          <p>
            Manage courses, course offerings, enrollments and
            academic assignments.
          </p>
        </div>

        <button
          type="button"
          className="academic-primary-button"
          onClick={() => setShowAddModal(true)}
        >
          <span aria-hidden="true">+</span>
          Add Course
        </button>
      </header>

      <div className="academic-summary-grid">
        <article className="academic-summary-card academic-summary-blue">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            ▣
          </div>

          <span>Total Courses</span>

          <strong>
            {formatMetric(metrics.totalCourses)}
          </strong>
        </article>

        <article className="academic-summary-card academic-summary-green">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            ✓
          </div>

          <span>Active Courses</span>

          <strong>
            {formatMetric(metrics.activeCourses)}
          </strong>
        </article>

        <article className="academic-summary-card academic-summary-purple">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            ▪
          </div>

          <span>Course Offerings</span>

          <strong>
            {formatMetric(metrics.offerings)}
          </strong>
        </article>

        <article className="academic-summary-card academic-summary-orange">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            ♟
          </div>

          <span>Enrollments</span>

          <strong>
            {formatMetric(metrics.enrollments)}
          </strong>
        </article>
      </div>

      <div className="academic-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`academic-tab ${
              activeTab === tab.id
                ? "academic-tab-active"
                : ""
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span aria-hidden="true">
              {tab.icon}
            </span>

            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "courses" ? (
        <>
          <div className="academic-filter-panel">
            <div className="academic-search-field">
              <label htmlFor="academic-course-search">
                Search Course
              </label>

              <div className="academic-input-with-icon">
                <span aria-hidden="true">⌕</span>

                <input
                  id="academic-course-search"
                  type="search"
                  placeholder="Search by Course ID or course name..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="academic-filter-field">
              <label htmlFor="academic-department">
                Department
              </label>

              <select
                id="academic-department"
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

            <div className="academic-filter-field">
              <label htmlFor="academic-status">
                Status
              </label>

              <select
                id="academic-status"
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
              className="academic-clear-button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              ↻ Clear Filters
            </button>
          </div>

          <div className="academic-table-card">
            <div className="academic-table-wrapper">
              <table className="academic-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Course ID</th>
                    <th>Department</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.courseId}>
                      <td>
                        <div className="academic-course-identity">
                          <div className="academic-course-avatar">
                            {course.courseId?.slice(
                              0,
                              2,
                            ) || "CO"}
                          </div>

                          <div>
                            <strong>
                              {course.name}
                            </strong>

                            <span>
                              {course.courseId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{course.courseId}</td>

                      <td>
                        {course.department || "N/A"}
                      </td>

                      <td>
                        {course.credits ?? "N/A"}
                      </td>

                      <td>
                        <span
                          className={`academic-status academic-status-${course.status?.toLowerCase()}`}
                        >
                          ● {course.status || "N/A"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="academic-action-button"
                          aria-label={`Actions for ${course.name}`}
                          disabled
                          title="Course management API is not available yet"
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCourses.length === 0 && (
                <div className="academic-empty-state">
                  <div
                    className="academic-empty-icon"
                    aria-hidden="true"
                  >
                    {emptyState.icon}
                  </div>

                  <h2>{emptyState.title}</h2>

                  <p>{emptyState.description}</p>
                </div>
              )}
            </div>

            <div className="academic-pagination">
              <span>
                Showing {filteredCourses.length} of{" "}
                {courses.length} courses
              </span>

              <div className="academic-pagination-controls">
                <button type="button" disabled>
                  ‹ Previous
                </button>

                <button
                  type="button"
                  className="academic-page-number"
                  disabled
                >
                  1
                </button>

                <button type="button" disabled>
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="academic-table-card academic-future-tab">
          <div className="academic-empty-state">
            <div
              className="academic-empty-icon"
              aria-hidden="true"
            >
              {emptyState.icon}
            </div>

            <h2>{emptyState.title}</h2>

            <p>{emptyState.description}</p>
          </div>
        </div>
      )}

      <div className="academic-integration-notice">
        <div
          className="academic-integration-icon"
          aria-hidden="true"
        >
          i
        </div>

        <div>
          <strong>
            Academic management integration pending
          </strong>

          <span>
            Course, offering and faculty-assignment records
            require backend APIs that are not currently
            available. Enrollment APIs exist in Flask but the
            complete Academic Management contract is not yet
            available to this frontend.
          </span>
        </div>

        <span className="academic-integration-badge">
          Integration Pending
        </span>
      </div>

      {showAddModal && (
        <div
          className="academic-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-course-title"
          >
            <div className="academic-modal-header">
              <div>
                <span className="academic-eyebrow">
                  Academic Management
                </span>

                <h2 id="add-course-title">
                  Add Course
                </h2>

                <p>
                  Course creation is pending the backend
                  course-management API.
                </p>
              </div>

              <button
                type="button"
                className="academic-modal-close"
                onClick={handleCloseModal}
                aria-label="Close add course dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCourse}>
              <div className="academic-form-section">
                <h3>Course Information</h3>

                <div className="academic-form-grid">
                  <div className="academic-form-field">
                    <label htmlFor="course-id">
                      Course ID
                    </label>

                    <input
                      id="course-id"
                      name="courseId"
                      type="text"
                      value={formData.courseId}
                      onChange={handleFormChange}
                      placeholder="Enter course ID"
                      disabled
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-name">
                      Course Name
                    </label>

                    <input
                      id="course-name"
                      name="courseName"
                      type="text"
                      value={formData.courseName}
                      onChange={handleFormChange}
                      placeholder="Enter course name"
                      disabled
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-department">
                      Department
                    </label>

                    <select
                      id="course-department"
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                      disabled
                    >
                      <option value="">
                        Select department
                      </option>
                    </select>
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-credits">
                      Credits
                    </label>

                    <input
                      id="course-credits"
                      name="credits"
                      type="number"
                      min="0"
                      value={formData.credits}
                      onChange={handleFormChange}
                      placeholder="Enter credits"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="academic-modal-backend-note">
                <span aria-hidden="true">i</span>

                <span>
                  Course creation is currently disabled because
                  the Flask backend does not expose a confirmed
                  Admin Course API.
                </span>
              </div>

              <div className="academic-modal-footer">
                <button
                  type="button"
                  className="academic-secondary-button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="academic-primary-button"
                  disabled
                  title="Course API is not available yet"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AcademicManagement;