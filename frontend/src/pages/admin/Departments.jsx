import { useCallback, useEffect, useMemo, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  getAdminDepartments,
  getAdminFaculty,
  createAdminDepartment,
  updateAdminDepartment,
} from "../../services/adminService";
import "./Departments.css";

const EMPTY_FORM = {
  departmentId: "",
  departmentName: "",
  departmentCode: "",
  headFacultyId: "",
  isActive: "true",
};

function getInitials(name) {
  if (!name?.trim()) return "DE";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function normalizeDepartment(item) {
  return {
    departmentId: String(item.department_id),
    name: item.department_name ?? "",
    code: item.department_code ?? "",
    headFacultyId:
      item.head_faculty_id == null ? "" : String(item.head_faculty_id),
    headName: item.head_name ?? null,
    facultyCount: Number.isFinite(Number(item.faculty_count))
      ? Number(item.faculty_count)
      : 0,
    studentCount: Number.isFinite(Number(item.student_count))
      ? Number(item.student_count)
      : 0,
    isActive: item.is_active === true || item.is_active === 1,
  };
}

function Departments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facultyError, setFacultyError] = useState("");

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await getAdminDepartments();

      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error("Unexpected department API response.");
      }

      setDepartments(response.data.map(normalizeDepartment));
      setError("");
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFaculty = useCallback(async () => {
    try {
      const response = await getAdminFaculty();

      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error("Unexpected faculty API response.");
      }

      setFaculty(response.data);
      setFacultyError("");
      return true;
    } catch (err) {
      setFacultyError(getErrorMessage(err));
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const [departmentsResult, facultyResult] = await Promise.allSettled([
        getAdminDepartments(),
        getAdminFaculty(),
      ]);

      if (cancelled) return;

      if (departmentsResult.status === "fulfilled") {
        const response = departmentsResult.value;

        if (response?.success && Array.isArray(response.data)) {
          setDepartments(response.data.map(normalizeDepartment));
          setError("");
        } else {
          setError("Unexpected department API response.");
        }
      } else {
        setError(getErrorMessage(departmentsResult.reason));
      }

      if (facultyResult.status === "fulfilled") {
        const response = facultyResult.value;

        if (response?.success && Array.isArray(response.data)) {
          setFaculty(response.data);
          setFacultyError("");
        } else {
          setFacultyError("Unexpected faculty API response.");
        }
      } else {
        setFacultyError(getErrorMessage(facultyResult.reason));
      }

      setLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return departments;

    return departments.filter((department) =>
      [
        department.departmentId,
        department.name,
        department.code,
        department.headName ?? "",
      ].some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [departments, searchTerm]);

  const departmentFaculty = useMemo(() => {
    if (!editingDepartment) return [];

    return faculty.filter(
      (member) =>
        String(member.department_id) === editingDepartment.departmentId,
    );
  }, [faculty, editingDepartment]);

  const activeDepartments = departments.filter(
    (department) => department.isActive,
  ).length;

  const inactiveDepartments = departments.length - activeDepartments;

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setFormData({
      departmentId: department.departmentId,
      departmentName: department.name,
      departmentCode: department.code,
      headFacultyId: department.headFacultyId,
      isActive: String(department.isActive),
    });
    setFormError("");
    setShowAddModal(true);
  };

  const closeModal = () => {
    if (savingDepartment) return;

    setShowAddModal(false);
    setEditingDepartment(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) setFormError("");
  };

  const handleSaveDepartment = async (event) => {
    event.preventDefault();

    const name = formData.departmentName.trim();
    const code = formData.departmentCode.trim().toUpperCase();

    if (!name || !code) {
      setFormError("Department name and code are required.");
      return;
    }

    if (name.length > 100 || code.length > 20) {
      setFormError(
        "Department name must be at most 100 characters and code at most 20.",
      );
      return;
    }

    setSavingDepartment(true);
    setFormError("");

    try {
      const payload = {
        department_name: name,
        department_code: code,
      };

      let response;

      if (editingDepartment) {
        payload.head_faculty_id = formData.headFacultyId
          ? Number(formData.headFacultyId)
          : null;
        payload.is_active = formData.isActive === "true";

        response = await updateAdminDepartment(
          editingDepartment.departmentId,
          payload,
        );
      } else {
        response = await createAdminDepartment(payload);
      }

      if (!response?.success) {
        throw new Error(response?.message || "Unable to save department.");
      }

      const wasEditing = Boolean(editingDepartment);

      setShowAddModal(false);
      setEditingDepartment(null);
      setFormData(EMPTY_FORM);

      const refreshed = await fetchDepartments();

      setPageMessage(
        refreshed
          ? wasEditing
            ? "Department updated successfully."
            : "Department created successfully."
          : "The save succeeded, but the department list could not refresh. Use Retry to reload it.",
      );
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError("");
    await fetchDepartments();
    await fetchFaculty();
  };

  return (
    <section className="department-management-page">
      <header className="department-page-header">
        <div>
          <span className="department-eyebrow">Admin Portal</span>
          <h1>Department Management</h1>
          <p>
            Manage academic departments, heads of department, faculty, and
            student records.
          </p>
        </div>

        <button
          type="button"
          className="department-primary-button"
          onClick={openCreateModal}
        >
          <span aria-hidden="true">+</span> Add Department
        </button>
      </header>

      <div className="department-summary-grid">
        <article className="department-summary-card department-summary-blue">
          <div className="department-summary-icon" aria-hidden="true">
            <span>▪</span>
          </div>
          <span>Total Departments</span>
          <strong>{departments.length}</strong>
        </article>

        <article className="department-summary-card department-summary-green">
          <div className="department-summary-icon" aria-hidden="true">
            <span>✓</span>
          </div>
          <span>Active Departments</span>
          <strong>{activeDepartments}</strong>
        </article>

        <article className="department-summary-card department-summary-red">
          <div className="department-summary-icon" aria-hidden="true">
            <span>−</span>
          </div>
          <span>Inactive Departments</span>
          <strong>{inactiveDepartments}</strong>
        </article>
      </div>

      <div className="department-filter-panel">
        <div className="department-search-field">
          <label htmlFor="department-search">Search Department</label>
          <div className="department-input-with-icon">
            <span aria-hidden="true">⌕</span>
            <input
              id="department-search"
              type="search"
              placeholder="Search by department name, ID, code, or HOD..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="department-clear-button"
          onClick={() => setSearchTerm("")}
          disabled={!searchTerm}
        >
          ↻ Clear Search
        </button>
      </div>

      {pageMessage && (
        <p className="department-form-success" role="status">
          {pageMessage}
          <button
            type="button"
            onClick={() => setPageMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </p>
      )}

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
                          <strong>
                            {department.name || "Unnamed Department"}
                          </strong>
                          {department.code && <span>{department.code}</span>}
                        </div>
                      </div>
                    </td>

                    <td>{department.departmentId}</td>
                    <td>{department.headName || "Not assigned"}</td>
                    <td>{department.facultyCount}</td>
                    <td>{department.studentCount}</td>
                    <td>
                      <span
                        className={`department-status ${
                          department.isActive
                            ? "department-status-active"
                            : "department-status-inactive"
                        }`}
                      >
                        {department.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="department-action-button"
                        aria-label={`Edit ${department.name || "department"}`}
                        title="Edit department"
                        onClick={() => openEditModal(department)}
                      >
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {loading ? (
            <div className="department-empty-state" role="status">
              <h2>Loading departments...</h2>
              <p>Please wait while department records are loaded.</p>
            </div>
          ) : error ? (
            <div className="department-empty-state" role="alert">
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
              <h2>No departments available</h2>
              <p>Create a department to get started.</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="department-empty-state">
              <h2>No matching departments</h2>
              <p>Try another search term.</p>
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

      {showAddModal && (
        <div
          className="department-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="department-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="department-modal-title"
          >
            <div className="department-modal-header">
              <div>
                <span className="department-eyebrow">
                  Department Management
                </span>
                <h2 id="department-modal-title">
                  {editingDepartment ? "Edit Department" : "Add Department"}
                </h2>
                <p>
                  {editingDepartment
                    ? "Update department information, HOD, and status."
                    : "Create a new academic department."}
                </p>
              </div>

              <button
                type="button"
                className="department-modal-close"
                onClick={closeModal}
                disabled={savingDepartment}
                aria-label="Close department dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment}>
              <div className="department-form-section">
                <h3>Department Information</h3>

                <div className="department-form-grid">
                  <div className="department-form-field">
                    <label htmlFor="department-id">Department ID</label>
                    <input
                      id="department-id"
                      name="departmentId"
                      type="text"
                      value={formData.departmentId}
                      placeholder="Generated automatically"
                      disabled
                    />
                    <small>
                      Department ID is generated by the database.
                    </small>
                  </div>

                  <div className="department-form-field">
                    <label htmlFor="department-name">Department Name</label>
                    <input
                      id="department-name"
                      name="departmentName"
                      type="text"
                      value={formData.departmentName}
                      onChange={handleFormChange}
                      placeholder="e.g. Computer Science Engineering"
                      maxLength={100}
                      required
                      disabled={savingDepartment}
                    />
                  </div>

                  <div className="department-form-field">
                    <label htmlFor="department-code">Department Code</label>
                    <input
                      id="department-code"
                      name="departmentCode"
                      type="text"
                      value={formData.departmentCode}
                      onChange={handleFormChange}
                      placeholder="e.g. CSE"
                      maxLength={20}
                      required
                      disabled={savingDepartment}
                    />
                  </div>

                  {editingDepartment && (
                    <>
                      <div className="department-form-field department-form-full">
                        <label htmlFor="department-hod">
                          Head of Department (HOD)
                        </label>
                        <select
                          id="department-hod"
                          name="headFacultyId"
                          value={formData.headFacultyId}
                          onChange={handleFormChange}
                          disabled={savingDepartment || Boolean(facultyError)}
                        >
                          <option value="">No HOD assigned</option>
                          {departmentFaculty
                            .filter((member) => member.is_active === true)
                            .map((member) => (
                              <option
                                key={member.faculty_id}
                                value={String(member.faculty_id)}
                              >
                                {member.name} ({member.employee_id})
                              </option>
                            ))}
                        </select>
                        <small>
                          Only active faculty accounts from this department can
                          be assigned as HOD.
                        </small>
                        {facultyError && (
                          <p className="department-form-error" role="alert">
                            Unable to load faculty: {facultyError}. Retry the
                            page to load the faculty list.
                          </p>
                        )}
                        {!facultyError && departmentFaculty.length === 0 && (
                          <small>
                            No faculty members are registered in this
                            department.
                          </small>
                        )}
                      </div>

                      <div className="department-form-field department-form-full">
                        <label htmlFor="department-status">
                          Department Status
                        </label>
                        <select
                          id="department-status"
                          name="isActive"
                          value={formData.isActive}
                          onChange={handleFormChange}
                          disabled={savingDepartment}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        <small>
                          Inactive departments remain in the database; this
                          changes their status rather than deleting them.
                        </small>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {formError && (
                <p className="department-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="department-modal-footer">
                <button
                  type="button"
                  className="department-secondary-button"
                  onClick={closeModal}
                  disabled={savingDepartment}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="department-primary-button"
                  disabled={savingDepartment}
                >
                  {savingDepartment
                    ? "Saving..."
                    : editingDepartment
                      ? "Save Changes"
                      : "Add Department"}
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
