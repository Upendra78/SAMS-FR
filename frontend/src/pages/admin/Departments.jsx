import { useMemo, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Departments.css";

const departments = [];

const EMPTY_METRICS = {
  total: null,
  active: null,
  inactive: null,
};

function formatMetric(value) {
  return value === null || value === undefined ? "N/A" : value;
}

function getInitials(name) {
  if (!name) {
    return "DE";
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

function Departments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    departmentId: "",
    departmentName: "",
    description: "",
  });

  const metrics = EMPTY_METRICS;

  const statuses = ["All"];

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return departments.filter((department) => {
      const matchesSearch =
        !search ||
        department.departmentId
          ?.toLowerCase()
          .includes(search) ||
        department.name?.toLowerCase().includes(search);

      const matchesStatus =
        status === "All" ||
        department.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, status]);

  const hasActiveFilters =
    Boolean(searchTerm) || status !== "All";

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatus("All");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddDepartment = (event) => {
    event.preventDefault();
  };

  const handleCloseModal = () => {
    setShowAddModal(false);

    setFormData({
      departmentId: "",
      departmentName: "",
      description: "",
    });
  };

  return (
    <section className="department-management-page">
      <header className="department-page-header">
        <div>
          <span className="department-eyebrow">
            Admin Portal
          </span>

          <h1>Department Management</h1>

          <p>
            Manage academic departments and their associated
            faculty and student records.
          </p>
        </div>

        <button
          type="button"
          className="department-primary-button"
          onClick={() => setShowAddModal(true)}
        >
          <span aria-hidden="true">+</span>
          Add Department
        </button>
      </header>

      <div className="department-summary-grid">
        <article className="department-summary-card department-summary-blue">
          <div
            className="department-summary-icon"
            aria-hidden="true"
          >
            <span>▪</span>
          </div>

          <span>Total Departments</span>

          <strong>
            {formatMetric(metrics.total)}
          </strong>
        </article>

        <article className="department-summary-card department-summary-green">
          <div
            className="department-summary-icon"
            aria-hidden="true"
          >
            <span>✓</span>
          </div>

          <span>Active Departments</span>

          <strong>
            {formatMetric(metrics.active)}
          </strong>
        </article>

        <article className="department-summary-card department-summary-red">
          <div
            className="department-summary-icon"
            aria-hidden="true"
          >
            <span>−</span>
          </div>

          <span>Inactive Departments</span>

          <strong>
            {formatMetric(metrics.inactive)}
          </strong>
        </article>
      </div>

      <div className="department-filter-panel">
        <div className="department-search-field">
          <label htmlFor="department-search">
            Search Department
          </label>

          <div className="department-input-with-icon">
            <span aria-hidden="true">⌕</span>

            <input
              id="department-search"
              type="search"
              placeholder="Search by department name or ID..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        <div className="department-filter-field">
          <label htmlFor="department-status">
            Status
          </label>

          <select
            id="department-status"
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
          className="department-clear-button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          ↻ Clear Filters
        </button>
      </div>

      <div className="department-table-card">
        <div className="department-table-wrapper">
          <table className="department-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Department ID</th>
                <th>Head / HOD</th>
                <th>Faculty</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDepartments.map((department) => (
                <tr key={department.departmentId}>
                  <td>
                    <div className="department-identity">
                      <div className="department-avatar">
                        {getInitials(department.name)}
                      </div>

                      <div>
                        <strong>
                          {department.name}
                        </strong>

                        <span>
                          {department.departmentId}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {department.departmentId}
                  </td>

                  <td>
                    {department.headName || "N/A"}
                  </td>

                  <td>
                    {department.facultyCount ?? "N/A"}
                  </td>

                  <td>
                    {department.studentCount ?? "N/A"}
                  </td>

                  <td>
                    <span
                      className={`department-status department-status-${department.status?.toLowerCase()}`}
                    >
                      ● {department.status || "N/A"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="department-action-button"
                      aria-label={`Actions for ${department.name}`}
                      disabled
                      title="Department management API is not available yet"
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {departments.length === 0 ? (
            <div className="department-empty-state">
              <div
                className="department-empty-icon"
                aria-hidden="true"
              >
                ▪
              </div>

              <h2>No departments available</h2>

              <p>
                Department records will appear here when the
                required department management API is available
                from the backend.
              </p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="department-empty-state department-search-empty">
              <div
                className="department-empty-icon"
                aria-hidden="true"
              >
                ⌕
              </div>

              <h2>No matching departments</h2>

              <p>
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : null}
        </div>

        <div className="department-pagination">
          <span>
            Showing {filteredDepartments.length} of{" "}
            {departments.length} departments
          </span>

          <div className="department-pagination-controls">
            <button type="button" disabled>
              ‹ Previous
            </button>

            <button
              type="button"
              className="department-page-number"
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

      <div className="department-integration-notice">
        <div
          className="department-integration-icon"
          aria-hidden="true"
        >
          i
        </div>

        <div>
          <strong>
            Department management integration pending
          </strong>

          <span>
            The current Flask backend does not expose the
            department management API required to load, create,
            update or delete department records.
          </span>
        </div>

        <span className="department-integration-badge">
          Integration Pending
        </span>
      </div>

      {showAddModal && (
        <div
          className="department-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="department-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-department-title"
          >
            <div className="department-modal-header">
              <div>
                <span className="department-eyebrow">
                  Department Management
                </span>

                <h2 id="add-department-title">
                  Add Department
                </h2>

                <p>
                  Enter department information once the
                  department management API is available.
                </p>
              </div>

              <button
                type="button"
                className="department-modal-close"
                onClick={handleCloseModal}
                aria-label="Close add department dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleAddDepartment}>
              <div className="department-form-section">
                <h3>Department Information</h3>

                <div className="department-form-grid">
                  <div className="department-form-field">
                    <label htmlFor="department-id">
                      Department ID
                    </label>

                    <input
                      id="department-id"
                      name="departmentId"
                      type="text"
                      value={formData.departmentId}
                      onChange={handleFormChange}
                      placeholder="Enter department ID"
                      disabled
                    />
                  </div>

                  <div className="department-form-field">
                    <label htmlFor="department-name">
                      Department Name
                    </label>

                    <input
                      id="department-name"
                      name="departmentName"
                      type="text"
                      value={formData.departmentName}
                      onChange={handleFormChange}
                      placeholder="Enter department name"
                      disabled
                    />
                  </div>

                  <div className="department-form-field department-form-full">
                    <label htmlFor="department-description">
                      Description
                      <span className="department-optional">
                        Optional
                      </span>
                    </label>

                    <textarea
                      id="department-description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      placeholder="Enter department description"
                      rows="4"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="department-modal-backend-note">
                <span aria-hidden="true">i</span>

                <span>
                  Department creation is currently disabled
                  until the Flask Department API contract is
                  available.
                </span>
              </div>

              <div className="department-modal-footer">
                <button
                  type="button"
                  className="department-secondary-button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="department-primary-button"
                  disabled
                  title="Department API is not available yet"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Departments;