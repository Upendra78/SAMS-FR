import { useEffect, useMemo, useState } from "react";

import {
  faBuildingColumns,
  faCircleExclamation,
  faCircleInfo,
  faFloppyDisk,
  faMagnifyingGlass,
  faPen,
  faPlus,
  faSpinner,
  faTrash,
  faUserTie,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  createAdminFaculty,
  deleteAdminFaculty,
  getAdminDepartments,
  getAdminFaculty,
  getUsers,
  updateAdminFaculty,
} from "../../services/adminService";

import "./Faculty.css";

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
  const [faculty, setFaculty] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [designation, setDesignation] = useState("All");

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [selectedFaculty, setSelectedFaculty] =
    useState(null);

  const [showFacultyModal, setShowFacultyModal] =
    useState(false);

  const [editingFaculty, setEditingFaculty] =
    useState(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [facultyForm, setFacultyForm] = useState({
    user_id: "",
    employee_id: "",
    designation: "",
    department_id: "",
  });

  const fetchFacultyData = async () => {
    setLoading(true);
    setError("");

    try {
      setDepartmentsLoading(true);
      const [facultyResponse, usersResponse, departmentsResponse] =
        await Promise.all([
          getAdminFaculty(),
          getUsers(),
          getAdminDepartments(),
        ]);

      if (!facultyResponse?.success) {
        throw new Error(
          facultyResponse?.message ||
            "Failed to load faculty."
        );
      }

      if (!usersResponse?.success) {
        throw new Error(
          usersResponse?.message ||
            "Failed to load users."
        );
      }

      if (!departmentsResponse?.success) {
        throw new Error(
          departmentsResponse?.message ||
            "Failed to load departments."
        );
      }

      const facultyData = Array.isArray(
        facultyResponse.data
      )
        ? facultyResponse.data
        : [];

      const usersData = Array.isArray(
        usersResponse.data
      )
        ? usersResponse.data
        : [];

      const departmentsData = Array.isArray(
        departmentsResponse.data
      )
        ? departmentsResponse.data
        : [];
      setDepartmentOptions(departmentsData);
      const existingFacultyUserIds = new Set(
        facultyData
          .map((member) => member?.user_id)
          .filter(
            (userId) =>
              userId !== undefined &&
              userId !== null
          )
          .map((userId) => String(userId))
      );

      const availableFacultyUsers = usersData
        .filter(
          (user) =>
            String(user?.role || "").toUpperCase() ===
            "FACULTY"
        )
        .filter(
          (user) =>
            !existingFacultyUserIds.has(
              String(user?.user_id)
            )
        );

      setFaculty(facultyData);
      setFacultyUsers(availableFacultyUsers);
    } catch (requestError) {
      setFaculty([]);
      setFacultyUsers([]);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load faculty."
      );
    } finally {
      setLoading(false);
      setDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      if (!mounted) {
        return;
      }

      await fetchFacultyData();
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const departmentIds = new Set(
      faculty
        .map((member) => member?.department_id)
        .filter(
          (departmentId) =>
            departmentId !== null &&
            departmentId !== undefined
        )
    );

    return {
      total: faculty.length,
      active: faculty.filter(
        (member) => member?.is_active === true
      ).length,
      inactive: faculty.filter(
        (member) => member?.is_active === false
      ).length,
      departments: departmentIds.size,
    };
  }, [faculty]);

  const departments = useMemo(
    () => [
      "All",
      ...departmentOptions.map(
        (item) => item.department_name
      ),
    ],
    [departmentOptions]
  );

  const designations = useMemo(() => {
    const uniqueDesignations = new Set();

    faculty.forEach((member) => {
      if (member?.designation) {
        uniqueDesignations.add(member.designation);
      }
    });

    return [
      "All",
      ...Array.from(uniqueDesignations).sort(
        (first, second) =>
          first.localeCompare(second)
      ),
    ];
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return faculty.filter((member) => {
      const searchableValues = [
        member?.faculty_id,
        member?.user_id,
        member?.name,
        member?.email,
        member?.employee_id,
        member?.designation,
        member?.department_name,
        member?.department_code,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search)
        );

      const matchesDepartment =
        department === "All" ||
        member?.department_name === department ||
        member?.department_code === department;

      const matchesDesignation =
        designation === "All" ||
        member?.designation === designation;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation
      );
    });
  }, [
    faculty,
    searchTerm,
    department,
    designation,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    department !== "All" ||
    designation !== "All";

  function clearFilters() {
    setSearchTerm("");
    setDepartment("All");
    setDesignation("All");
  }

  function resetForm() {
    setFacultyForm({
      user_id: "",
      employee_id: "",
      designation: "",
      department_id: "",
    });

    setEditingFaculty(null);
    setFormError("");
  }

  function handleOpenCreate() {
    resetForm();
    setShowFacultyModal(true);
  }

  function handleOpenEdit(member) {
    setEditingFaculty(member);

    setFacultyForm({
      user_id: String(member.user_id ?? ""),
      employee_id: member.employee_id ?? "",
      designation: member.designation ?? "",
      department_id: String(
        member.department_id ?? ""
      ),
    });

    setFormError("");
    setShowFacultyModal(true);
  }

  function handleCloseModal() {
    if (formLoading) {
      return;
    }

    setShowFacultyModal(false);
    resetForm();
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFacultyForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const employeeId =
      facultyForm.employee_id.trim();

    const designationValue =
      facultyForm.designation.trim();

    const departmentId = Number(
      facultyForm.department_id
    );

    if (!employeeId || !designationValue) {
      setFormError(
        "Employee ID and designation are required."
      );
      return;
    }

    if (
      !Number.isInteger(departmentId) ||
      departmentId <= 0
    ) {
      setFormError(
        "Department ID must be a valid positive number."
      );
      return;
    }

    setFormLoading(true);

    try {
      let response;

      if (editingFaculty) {
        response = await updateAdminFaculty(
          editingFaculty.faculty_id,
          {
            employee_id: employeeId,
            designation: designationValue,
            department_id: departmentId,
          }
        );
      } else {
        const userId = Number(
          facultyForm.user_id
        );

        if (
          !Number.isInteger(userId) ||
          userId <= 0
        ) {
          throw new Error(
            "Please select a valid Faculty User."
          );
        }

        const selectedUser =
          facultyUsers.find(
            (user) =>
              Number(user?.user_id) === userId
          );

        if (!selectedUser) {
          throw new Error(
            "Please select an available Faculty User."
          );
        }

        response = await createAdminFaculty({
          user_id: userId,
          employee_id: employeeId,
          designation: designationValue,
          department_id: departmentId,
        });
      }

      if (!response?.success) {
        throw new Error(
          response?.message ||
            `Failed to ${
              editingFaculty
                ? "update"
                : "create"
            } faculty profile.`
        );
      }

      await fetchFacultyData();

      setShowFacultyModal(false);
      resetForm();
    } catch (requestError) {
      setFormError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Faculty operation failed."
      );
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(member) {
    const confirmed = window.confirm(
      `Delete the faculty profile for ${
        member?.name || "this faculty member"
      }?\n\nThis removes only the Faculty profile. The linked User account remains available.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response =
        await deleteAdminFaculty(
          member.faculty_id
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to delete faculty profile."
        );
      }

      if (
        selectedFaculty?.faculty_id ===
        member.faculty_id
      ) {
        setSelectedFaculty(null);
      }

      await fetchFacultyData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to delete faculty profile."
      );
    }
  }

  function handleView(member) {
    setSelectedFaculty(member);
  }

  function handleCloseDetails() {
    setSelectedFaculty(null);
  }

  return (
    <section className="faculty-management-page">
      <header className="faculty-page-header">
        <div>
          <span className="faculty-eyebrow">
            Admin Portal
          </span>

          <h1>Faculty Management</h1>

          <p>
            View and manage faculty professional
            information.
          </p>
        </div>

        <button
          type="button"
          className="faculty-primary-button"
          onClick={handleOpenCreate}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Faculty
        </button>
      </header>

      <div className="faculty-summary-grid">
        <article className="faculty-summary-card faculty-summary-blue">
          <div className="faculty-summary-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <span>Total Faculty</span>

          <strong>
            {loading ? "..." : metrics.total}
          </strong>
        </article>

        <article className="faculty-summary-card faculty-summary-green">
          <div className="faculty-summary-icon">
            <FontAwesomeIcon icon={faUserTie} />
          </div>

          <span>Active</span>

          <strong>
            {loading ? "..." : metrics.active}
          </strong>
          <small>Active faculty accounts</small>
        </article>

        <article className="faculty-summary-card faculty-summary-red">
          <div className="faculty-summary-icon">
            <FontAwesomeIcon
              icon={faCircleExclamation}
            />
          </div>

          <span>Inactive</span>

          <strong>
            {loading ? "..." : metrics.inactive}
          </strong>
          <small>Inactive faculty accounts</small>
        </article>

        <article className="faculty-summary-card faculty-summary-purple">
          <div className="faculty-summary-icon">
            <FontAwesomeIcon
              icon={faBuildingColumns}
            />
          </div>

          <span>Departments</span>

          <strong>
            {loading
              ? "..."
              : metrics.departments}
          </strong>

          <small>
            Based on faculty records
          </small>
        </article>
      </div>

      <section className="faculty-filter-panel">
        <div className="faculty-search-wrapper">
          <label htmlFor="faculty-search">
            Search Faculty
          </label>

          <div className="faculty-search-box">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              aria-hidden="true"
            />

            <input
              id="faculty-search"
              type="search"
              placeholder="Search by ID, name, email or employee ID..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
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
              setDepartment(
                event.target.value
              )
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
              setDesignation(
                event.target.value
              )
            }
          >
            {designations.map((item) => (
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
          <FontAwesomeIcon
            icon={faXmark}
          />
          Clear
        </button>
      </section>

      <section className="faculty-table-card">
        <div className="faculty-table-scroll">
          {loading ? (
            <div className="faculty-empty-state">
              <div className="faculty-empty-icon">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                />
              </div>

              <h2>Loading faculty</h2>

              <p>
                Fetching faculty members from
                the Admin Faculty API.
              </p>
            </div>
          ) : error ? (
            <div className="faculty-empty-state">
              <div className="faculty-empty-icon faculty-error-icon">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                />
              </div>

              <h2>Unable to load faculty</h2>

              <p>{error}</p>
            </div>
          ) : faculty.length === 0 ? (
            <div className="faculty-empty-state">
              <div className="faculty-empty-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>

              <h2>No faculty available</h2>

              <p>
                No Faculty profiles were returned
                by the Admin Faculty API.
              </p>
            </div>
          ) : (
            <>
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Faculty ID</th>
                    <th>Faculty</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFaculty.map(
                    (member) => (
                      <tr
                        key={
                          member.faculty_id
                        }
                      >
                        <td>
                          {member.faculty_id}
                        </td>

                        <td>
                          <div className="faculty-member-cell">
                            <div className="faculty-avatar">
                              {getInitials(
                                member.name
                              )}
                            </div>

                            <div>
                              <strong>
                                {member.name ||
                                  "N/A"}
                              </strong>

                              <span>
                                User ID:{" "}
                                {member.user_id ??
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {member.employee_id ||
                            "N/A"}
                        </td>

                        <td>
                          <div className="faculty-department-cell">
                            <strong>
                              {member.department_name ||
                                "N/A"}
                            </strong>

                            {member.department_code && (
                              <span>
                                {
                                  member.department_code
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          {member.designation ||
                            "N/A"}
                        </td>

                        <td>
                          {member.email ||
                            "N/A"}
                        </td>

                         <td>
                            {typeof member.is_active === "boolean" ? (
                              <span
                                className={`faculty-status ${
                                  member.is_active
                                    ? "faculty-status-active"
                                    : "faculty-status-inactive"
                                }`}
                              >
                                {member.is_active ? "Active" : "Inactive"}
                              </span>
                            ) : (
                              <span className="faculty-status faculty-status-pending">
                                Status unavailable
                              </span>
                            )}
                          </td>

                        <td>
                          <div className="faculty-row-actions">
                            <button
                              type="button"
                              className="faculty-row-action"
                              onClick={() =>
                                handleView(
                                  member
                                )
                              }
                              title="View faculty"
                              aria-label="View faculty"
                            >
                              <FontAwesomeIcon
                                icon={
                                  faCircleInfo
                                }
                              />
                            </button>

                            <button
                              type="button"
                              className="faculty-row-action"
                              onClick={() =>
                                handleOpenEdit(
                                  member
                                )
                              }
                              title="Edit faculty profile"
                              aria-label="Edit faculty profile"
                            >
                              <FontAwesomeIcon
                                icon={faPen}
                              />
                            </button>

                            <button
                              type="button"
                              className="faculty-row-action faculty-row-action-danger"
                              onClick={() =>
                                handleDelete(
                                  member
                                )
                              }
                              title="Delete faculty profile"
                              aria-label="Delete faculty profile"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {filteredFaculty.length === 0 && (
                <div className="faculty-empty-state faculty-search-empty">
                  <div className="faculty-empty-icon">
                    <FontAwesomeIcon
                      icon={
                        faMagnifyingGlass
                      }
                    />
                  </div>

                  <h2>No matching faculty</h2>

                  <p>
                    Try adjusting your search
                    terms or filters.
                  </p>

                  <button
                    type="button"
                    className="faculty-secondary-button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!loading &&
          !error &&
          faculty.length > 0 && (
            <div className="faculty-table-footer">
              Showing{" "}
              {filteredFaculty.length} of{" "}
              {faculty.length} faculty members
            </div>
          )}
      </section>
      {showFacultyModal && (
        <div
          className="faculty-modal-overlay"
          role="presentation"
          onClick={handleCloseModal}
        >
          <div
            className="faculty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="faculty-modal-header">
              <div className="faculty-modal-profile">
                <div className="faculty-modal-avatar">
                  <FontAwesomeIcon
                    icon={faUserTie}
                  />
                </div>

                <div>
                  <span>Admin Portal</span>

                  <h2 id="faculty-modal-title">
                    {editingFaculty
                      ? "Edit Faculty"
                      : "Add Faculty"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="faculty-modal-close"
                onClick={handleCloseModal}
                disabled={formLoading}
                aria-label="Close faculty form"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>
            </div>

            {!editingFaculty && (
              <div className="faculty-form-info">
                <FontAwesomeIcon
                  icon={faCircleInfo}
                />

                <span>
                  Select an existing User account
                  with the FACULTY role. User
                  account creation is handled from
                  Users Management.
                </span>
              </div>
            )}

            <form
              className="faculty-form"
              onSubmit={handleSubmit}
            >
              <div className="faculty-form-grid">
                {!editingFaculty && (
                  <div className="faculty-form-field faculty-form-field-full">
                    <label htmlFor="faculty-user">
                      Faculty User *
                    </label>

                    <select
                      id="faculty-user"
                      name="user_id"
                      value={
                        facultyForm.user_id
                      }
                      onChange={
                        handleFormChange
                      }
                      disabled={formLoading}
                      required
                    >
                      <option value="">
                        Select a Faculty User
                      </option>

                      {facultyUsers.map(
                        (user) => (
                          <option
                            key={user.user_id}
                            value={
                              user.user_id
                            }
                          >
                            {user.name} —{" "}
                            {user.email}{" "}
                            (User ID:{" "}
                            {user.user_id})
                          </option>
                        )
                      )}
                    </select>

                    {facultyUsers.length ===
                      0 && (
                      <small>
                        No available FACULTY
                        users. Create a FACULTY
                        account first in Users
                        Management.
                      </small>
                    )}
                  </div>
                )}

                <div className="faculty-form-field">
                  <label htmlFor="faculty-employee-id">
                    Employee ID *
                  </label>

                  <input
                    id="faculty-employee-id"
                    name="employee_id"
                    type="text"
                    value={
                      facultyForm.employee_id
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={formLoading}
                    required
                  />
                </div>

                <div className="faculty-form-field">
                  <label htmlFor="faculty-designation">
                    Designation *
                  </label>

                  <input
                    id="faculty-designation"
                    name="designation"
                    type="text"
                    value={
                      facultyForm.designation
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={formLoading}
                    required
                  />
                </div>

                <div className="faculty-form-field faculty-form-field-full">
                  <label htmlFor="faculty-department-id">
                    Department *
                  </label>

                  <select
                    id="faculty-department-id"
                    name="department_id"
                    value={facultyForm.department_id}
                    onChange={handleFormChange}
                    disabled={formLoading || departmentsLoading}
                    required
                  >
                    <option value="">
                      {departmentsLoading
                        ? "Loading departments..."
                        : "Select a department"}
                    </option>

                    {departmentOptions.map((item) => (
                      <option
                        key={item.department_id}
                        value={String(item.department_id)}
                      >
                        {item.department_name} ({item.department_code})
                      </option>
                    ))}
                  </select>

                  {!departmentsLoading &&
                    departmentOptions.length === 0 && (
                      <small>
                        No departments are available. Add a department before
                        creating a faculty profile.
                      </small>
                    )}
                </div>
              </div>

              {formError && (
                <div
                  className="faculty-form-error"
                  role="alert"
                >
                  <FontAwesomeIcon
                    icon={
                      faCircleExclamation
                    }
                  />

                  <span>{formError}</span>
                </div>
              )}

              <div className="faculty-modal-footer">
                <button
                  type="button"
                  className="faculty-secondary-button"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="faculty-primary-button"
                  disabled={formLoading}
                >
                  <FontAwesomeIcon
                    icon={
                      formLoading
                        ? faSpinner
                        : editingFaculty
                          ? faFloppyDisk
                          : faPlus
                    }
                    spin={formLoading}
                  />

                  {formLoading
                    ? "Saving..."
                    : editingFaculty
                      ? "Save Changes"
                      : "Create Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedFaculty && (
        <div
          className="faculty-modal-overlay"
          role="presentation"
          onClick={handleCloseDetails}
        >
          <div
            className="faculty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-details-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="faculty-modal-header">
              <div className="faculty-modal-profile">
                <div className="faculty-modal-avatar">
                  {getInitials(
                    selectedFaculty.name
                  )}
                </div>

                <div>
                  <span>
                    Faculty Profile
                  </span>

                  <h2 id="faculty-details-title">
                    {selectedFaculty.name ||
                      "Faculty"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="faculty-modal-close"
                onClick={handleCloseDetails}
                aria-label="Close faculty details"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>
            </div>

            <div className="faculty-details-grid">
              <article>
                <span>Faculty ID</span>
                <strong>
                  {selectedFaculty.faculty_id ??
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>User ID</span>
                <strong>
                  {selectedFaculty.user_id ??
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>Name</span>
                <strong>
                  {selectedFaculty.name ||
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>Email</span>
                <strong>
                  {selectedFaculty.email ||
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>Employee ID</span>
                <strong>
                  {selectedFaculty.employee_id ||
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>Designation</span>
                <strong>
                  {selectedFaculty.designation ||
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>Department</span>
                <strong>
                  {selectedFaculty.department_name ||
                    "N/A"}
                </strong>
              </article>

              <article>
                <span>Department Code</span>
                <strong>
                  {selectedFaculty.department_code ||
                    "N/A"}
                </strong>
              </article>
            </div>

            <div className="faculty-pending-section">
              <FontAwesomeIcon
                icon={faCircleInfo}
              />

              <div>
                <strong>
                  Account status
                </strong>

                <p>
                  {typeof selectedFaculty.is_active === "boolean"
                    ? `This faculty account is ${
                        selectedFaculty.is_active
                          ? "active"
                          : "inactive"
                      }.`
                    : "Account status is unavailable for this faculty record."}
                </p>
              </div>
            </div>

            <div className="faculty-modal-footer">
              <button
                type="button"
                className="faculty-secondary-button"
                onClick={handleCloseDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Faculty;