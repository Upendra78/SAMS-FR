import { useMemo, useState } from "react";

import "./Faculty.css";

const EMPTY_METRICS = {
  total: null,
  active: null,
  inactive: null,
  departments: null,
};

const faculty = [];

function formatMetric(value) {
  return value === null || value === undefined ? "N/A" : value;
}

function getInitials(name) {
  if (!name) {
    return "FC";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Faculty() {
  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [designation, setDesignation] = useState("All");
  const [status, setStatus] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const metrics = EMPTY_METRICS;

  const departments = ["All"];
  const designations = ["All"];
  const statuses = ["All"];

  const filteredFaculty = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return faculty.filter((member) => {
      const matchesSearch =
        !search ||
        member.facultyId?.toLowerCase().includes(search) ||
        member.name?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search);

      const matchesDepartment =
        department === "All" ||
        member.department === department;

      const matchesDesignation =
        designation === "All" ||
        member.designation === designation;

      const matchesStatus =
        status === "All" ||
        member.status === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesStatus
      );
    });
  }, [searchTerm, department, designation, status]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    department !== "All" ||
    designation !== "All" ||
    status !== "All";

  const clearFilters = () => {
    setSearchTerm("");
    setDepartment("All");
    setDesignation("All");
    setStatus("All");
  };

  const handleAddFaculty = (event) => {
    event.preventDefault();
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <section className="faculty-management-page">
      <header className="faculty-page-header">
        <div>
          <span className="faculty-eyebrow">
            Admin Portal
          </span>

          <h1>Faculty Management</h1>

          <p>
            Manage faculty members, academic information and
            assignments.
          </p>
        </div>

        <button
          type="button"
          className="faculty-add-button"
          onClick={() => setIsAddModalOpen(true)}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add Faculty
        </button>
      </header>

      <div className="faculty-summary-grid">
        <article className="faculty-summary-card faculty-summary-blue">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-users" />
          </div>

          <span>Total Faculty</span>

          <strong
            className={metrics.total === null ? "is-empty" : ""}
          >
            {formatMetric(metrics.total)}
          </strong>
        </article>

        <article className="faculty-summary-card faculty-summary-green">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-circle-check" />
          </div>

          <span>Active</span>

          <strong
            className={metrics.active === null ? "is-empty" : ""}
          >
            {formatMetric(metrics.active)}
          </strong>
        </article>

        <article className="faculty-summary-card faculty-summary-red">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-user-slash" />
          </div>

          <span>Inactive</span>

          <strong
            className={metrics.inactive === null ? "is-empty" : ""}
          >
            {formatMetric(metrics.inactive)}
          </strong>
        </article>

        <article className="faculty-summary-card faculty-summary-purple">
          <div
            className="faculty-summary-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-building-columns" />
          </div>

          <span>Departments</span>

          <strong
            className={
              metrics.departments === null ? "is-empty" : ""
            }
          >
            {formatMetric(metrics.departments)}
          </strong>
        </article>
      </div>

      <section className="faculty-filter-panel">
        <div className="faculty-search-wrapper">
          <label htmlFor="faculty-search">
            Search Faculty
          </label>

          <div className="faculty-search-box">
            <i
              className="fa-solid fa-magnifying-glass"
              aria-hidden="true"
            />

            <input
              id="faculty-search"
              type="search"
              placeholder="Search faculty by ID, name or email..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        <div className="faculty-filter-field">
          <label htmlFor="faculty-department">
            Department
          </label>

          <select
            id="faculty-department"
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

        <div className="faculty-filter-field">
          <label htmlFor="faculty-designation">
            Designation
          </label>

          <select
            id="faculty-designation"
            value={designation}
            onChange={(event) =>
              setDesignation(event.target.value)
            }
          >
            {designations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="faculty-filter-field">
          <label htmlFor="faculty-status">
            Status
          </label>

          <select
            id="faculty-status"
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
          className="faculty-clear-button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          <i
            className="fa-solid fa-rotate-right"
            aria-hidden="true"
          />
          Clear Filters
        </button>
      </section>

      <section className="faculty-table-card">
        <div className="faculty-table-scroll">
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Faculty</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredFaculty.map((member) => (
                <tr key={member.facultyId}>
                  <td>{member.facultyId}</td>

                  <td>
                    <div className="faculty-member-cell">
                      <div className="faculty-avatar">
                        {getInitials(member.name)}
                      </div>

                      <div>
                        <strong>{member.name}</strong>
                        <span>{member.facultyId}</span>
                      </div>
                    </div>
                  </td>

                  <td>{member.department || "N/A"}</td>

                  <td>{member.designation || "N/A"}</td>

                  <td>{member.email || "N/A"}</td>

                  <td>
                    <span
                      className={`faculty-status faculty-status-${member.status?.toLowerCase()}`}
                    >
                      <span aria-hidden="true" />
                      {member.status || "N/A"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="faculty-row-action"
                      aria-label={`Actions for ${member.name}`}
                      disabled
                      title="Faculty management API is not available yet"
                    >
                      <i
                        className="fa-solid fa-ellipsis-vertical"
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {faculty.length === 0 ? (
            <div className="faculty-empty-state">
              <div
                className="faculty-empty-icon"
                aria-hidden="true"
              >
                <i className="fa-solid fa-users" />
              </div>

              <h2>No faculty available</h2>

              <p>
                Faculty records will appear here when the
                required faculty management API is available
                from the backend.
              </p>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="faculty-empty-state faculty-search-empty">
              <div
                className="faculty-empty-icon"
                aria-hidden="true"
              >
                <i
                  className="fa-solid fa-magnifying-glass"
                  aria-hidden="true"
                />
              </div>

              <h2>No matching faculty</h2>

              <p>
                Try adjusting your search terms or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          ) : null}
        </div>

        <div className="faculty-integration-note">
          <div
            className="faculty-integration-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-circle-info" />
          </div>

          <div className="faculty-integration-content">
            <strong>
              Faculty management integration pending
            </strong>

            <span>
              The current Flask backend does not expose the
              faculty profile CRUD API required to load, create,
              update or delete faculty records.
            </span>
          </div>

          <span className="faculty-integration-status">
            Integration Pending
          </span>
        </div>
      </section>

      {isAddModalOpen && (
        <div
          className="faculty-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="faculty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-faculty-title"
          >
            <div className="faculty-modal-header">
              <div>
                <span className="faculty-modal-eyebrow">
                  Faculty Management
                </span>

                <h2 id="add-faculty-title">
                  Add Faculty
                </h2>

                <p>
                  Enter faculty information once the faculty
                  management API is available.
                </p>
              </div>

              <button
                type="button"
                className="faculty-modal-close"
                aria-label="Close add faculty dialog"
                onClick={handleCloseModal}
              >
                <i
                  className="fa-solid fa-xmark"
                  aria-hidden="true"
                />
              </button>
            </div>

            <form
              className="faculty-form"
              onSubmit={handleAddFaculty}
            >
              <div className="faculty-form-section">
                <div className="faculty-form-section-heading">
                  <div>
                    <h3>Basic Information</h3>

                    <p>
                      Enter the faculty member&apos;s basic
                      details.
                    </p>
                  </div>
                </div>

                <div className="faculty-form-grid">
                  <div className="faculty-form-field">
                    <label htmlFor="new-faculty-id">
                      Faculty ID
                    </label>

                    <input
                      id="new-faculty-id"
                      type="text"
                      placeholder="e.g. FAC001"
                      disabled
                    />
                  </div>

                  <div className="faculty-form-field">
                    <label htmlFor="new-faculty-name">
                      Full Name
                    </label>

                    <input
                      id="new-faculty-name"
                      type="text"
                      placeholder="Enter full name"
                      disabled
                    />
                  </div>

                  <div className="faculty-form-field faculty-form-full">
                    <label htmlFor="new-faculty-email">
                      Email
                    </label>

                    <input
                      id="new-faculty-email"
                      type="email"
                      placeholder="faculty@college.edu"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="faculty-form-section">
                <div className="faculty-form-section-heading">
                  <div>
                    <h3>Academic Information</h3>

                    <p>
                      Department and designation will be
                      connected to backend data.
                    </p>
                  </div>
                </div>

                <div className="faculty-form-grid">
                  <div className="faculty-form-field">
                    <label htmlFor="new-faculty-department">
                      Department
                    </label>

                    <select
                      id="new-faculty-department"
                      defaultValue=""
                      disabled
                    >
                      <option value="">
                        Faculty API unavailable
                      </option>
                    </select>
                  </div>

                  <div className="faculty-form-field">
                    <label htmlFor="new-faculty-designation">
                      Designation
                    </label>

                    <select
                      id="new-faculty-designation"
                      defaultValue=""
                      disabled
                    >
                      <option value="">
                        Faculty API unavailable
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="faculty-modal-backend-note">
                <i
                  className="fa-solid fa-circle-info"
                  aria-hidden="true"
                />

                <span>
                  Faculty creation is currently disabled until
                  the Flask Faculty API contract is available.
                </span>
              </div>

              <div className="faculty-modal-actions">
                <button
                  type="button"
                  className="faculty-secondary-button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="faculty-primary-button"
                  disabled
                  title="Faculty management API is not available yet"
                >
                  Add Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Faculty;