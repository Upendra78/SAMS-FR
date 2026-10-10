import { useCallback, useEffect, useMemo, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getAdminDepartments } from "../../services/adminService";

import "./Departments.css";

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

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await getAdminDepartments();

      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error("Unexpected department API response.");
      }

      const normalizedDepartments = response.data.map((item) => ({
        departmentId: String(item.department_id),
        code: item.department_code ?? "",
        name: item.department_name ?? "",
        headName: null,
        facultyCount: null,
        studentCount: null,
        status: null,
      }));

      setDepartments(normalizedDepartments);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load departments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    fetchDepartments();
  };

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      try {
        const response = await getAdminDepartments();

        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected department API response.");
        }

        const normalizedDepartments = response.data.map((item) => ({
          departmentId: String(item.department_id),
          code: item.department_code ?? "",
          name: item.department_name ?? "",
          headName: null,
          facultyCount: null,
          studentCount: null,
          status: null,
        }));

        if (!cancelled) {
          setDepartments(normalizedDepartments);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load departments.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  // The backend does not currently provide department status or counts.
  const metrics = useMemo(
    () => ({
      total: departments.length,
      active: null,
      inactive: null,
    }),
    [departments],
  );

  const statuses = ["All"];

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return departments.filter((department) => {
      const matchesSearch =
        !search ||
        department.departmentId.toLowerCase().includes(search) ||
        department.name.toLowerCase().includes(search) ||
        department.code.toLowerCase().includes(search);

      const matchesStatus =
        status === "All" || department.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, status]);

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

  // Department creation is not supported by the current backend.
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

          <strong>{formatMetric(metrics.total)}</strong>
        </article>

        <article className="department-summary-card department-summary-green">
          <div
            className="department-summary-icon"
            aria-hidden="true"
          >
            <span>✓</span>
          </div>

          <span>Active Departments</span>

          <strong>{formatMetric(metrics.active)}</strong>
        </article>

        <article className="department-summary-card department-summary-red">
          <div
            className="department-summary-icon"
            aria-hidden="true"
          >
            <span>−</span>
          </div>

          <span>Inactive Departments</span>

          <strong>{formatMetric(metrics.inactive)}</strong>
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
              placeholder="Search by department name, ID, or code..."
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
            onChange={(event) => setStatus(event.target.value)}
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
              {!loading &&
                !error &&
                filteredDepartments.map((department) => (
                  <tr key={department.departmentId}>
                    <td>
                      <div className="department-identity">
                        <div className="department-avatar">
                          {getInitials(department.name)}
                        </div>

                        <div>
                          <strong>{department.name || "Unnamed Department"}</strong>

                          {department.code && (
                            <span>{department.code}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>{department.departmentId}</td>

                    <td>{department.headName || "N/A"}</td>

                    <td>
                      {department.facultyCount ?? "N/A"}
                    </td>

                    <td>
                      {department.studentCount ?? "N/A"}
                    </td>

                    <td>
                      <span className="department-status">
                        {department.status || "Not provided"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="department-action-button"
                        aria-label={`Actions for ${department.name || "department"}`}
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

          {loading ? (
            <div
              className="department-empty-state"
              role="status"
            >
              <h2>Loading departments...</h2>
              <p>Please wait while department records are loaded.</p>
            </div>
          ) : error ? (
            <div
              className="department-empty-state"
              role="alert"
            >
              <h2>Unable to load departments</h2>
              <p>{error}</p>

              <button
                type="button"
                className="department-secondary-button"
                onClick={handleRetry}
              >
                Retry
              </button>
            </div>
          ) : departments.length === 0 ? (
            <div className="department-empty-state">
              <div
                className="department-empty-icon"
                aria-hidden="true"
              >
                ▪
              </div>

              <h2>No departments available</h2>

              <p>
                No department records were returned by the backend.
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
            Showing {loading || error ? 0 : filteredDepartments.length} of{" "}
            {loading || error ? 0 : departments.length} departments
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
          <strong>Department listing connected</strong>

          <span>
            Department listing is connected to the Flask API.
            Status management and department create, edit, and
            delete operations are not yet available.
          </span>
        </div>

        <span className="department-integration-badge">
          Listing Connected
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
                  Department creation will be enabled when the
                  corresponding backend API is implemented.
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
                  Saving departments will be enabled after the backend
                  creation endpoint is connected.
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