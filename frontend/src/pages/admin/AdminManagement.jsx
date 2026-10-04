import { useContext, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faPlus,
  faShieldHalved,
  faSpinner,
  faTrash,
  faUser,
  faUserGraduate,
  faUsers,
  faUserTie,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} from "../../services/adminService";

import AuthContext from "../../context/authContext";

import "./AdminManagement.css";

const PAGE_SIZE = 5;

const initialFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
};

const initialEditFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
};

function getRoleLabel(role) {
  switch (role) {
    case "STUDENT":
      return "Student";
    case "FACULTY":
      return "Faculty";
    case "ADMIN":
      return "Admin";
    default:
      return role || "Unknown";
  }
}

function getRoleIcon(role) {
  switch (role) {
    case "STUDENT":
      return faUserGraduate;
    case "FACULTY":
      return faUserTie;
    case "ADMIN":
      return faShieldHalved;
    default:
      return faUser;
  }
}

function getInitials(name) {
  if (!name) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function AdminManagement() {
  const { user: currentUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [faceStatusFilter, setFaceStatusFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [faceRegistrationUser, setFaceRegistrationUser] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [editFormData, setEditFormData] = useState(
    initialEditFormData
  );

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  async function loadUsers() {
    setLoadingUsers(true);

    try {
      const result = await getUsers();

      if (!result?.success) {
        setStatus({
          type: "error",
          message: result?.message || "Unable to load users.",
        });

        return;
      }

      setUsers(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to load users. Please try again.",
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initializeUsers() {
      try {
        const result = await getUsers();

        if (!active) {
          return;
        }

        if (!result?.success) {
          setStatus({
            type: "error",
            message:
              result?.message || "Unable to load users.",
          });

          return;
        }

        setUsers(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Unable to load users. Please try again.",
        });
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    }

    initializeUsers();

    return () => {
      active = false;
    };
  }, []);

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(event) {
    setRoleFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleFaceStatusFilterChange(event) {
    setFaceStatusFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleCreateChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCreateModal() {
    setStatus({
      type: "",
      message: "",
    });

    setFormData(initialFormData);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (submitting) {
      return;
    }

    setShowCreateModal(false);
    setFormData(initialFormData);
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    setStatus({
      type: "",
      message: "",
    });

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      setStatus({
        type: "error",
        message: "Name cannot be empty.",
      });

      return;
    }

    if (!email) {
      setStatus({
        type: "error",
        message: "Email cannot be empty.",
      });

      return;
    }

    if (formData.password.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });

      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
      });

      return;
    }

    setSubmitting(true);

    try {
      const result = await createUser({
        name,
        email,
        password: formData.password,
        role: formData.role,
      });

      if (!result?.success) {
        setStatus({
          type: "error",
          message:
            result?.message || "Unable to create user.",
        });

        return;
      }

      setStatus({
        type: "success",
        message: "User created successfully.",
      });

      setShowCreateModal(false);
      setFormData(initialFormData);

      await loadUsers();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to create user. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(user) {
    setStatus({
      type: "",
      message: "",
    });

    setEditingUser(user);

    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
      role: user.role || "STUDENT",
    });
  }

  function closeEditModal() {
    if (updatingUserId !== null) {
      return;
    }

    setEditingUser(null);
    setEditFormData(initialEditFormData);
  }

  async function handleUpdateUser(event) {
    event.preventDefault();

    if (!editingUser?.user_id) {
      return;
    }

    setStatus({
      type: "",
      message: "",
    });

    const name = editFormData.name.trim();
    const email = editFormData.email.trim();

    if (!name) {
      setStatus({
        type: "error",
        message: "Name cannot be empty.",
      });

      return;
    }

    if (!email) {
      setStatus({
        type: "error",
        message: "Email cannot be empty.",
      });

      return;
    }

    if (
      editFormData.password &&
      editFormData.password.length < 8
    ) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });

      return;
    }

    if (
      editFormData.password !==
      editFormData.confirmPassword
    ) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
      });

      return;
    }

    const isCurrentUser =
      currentUser?.user_id === editingUser.user_id;

    if (
      isCurrentUser &&
      editFormData.role !== "ADMIN"
    ) {
      setStatus({
        type: "error",
        message:
          "Your current account must remain an administrator.",
      });

      return;
    }

    const updateData = {
      name,
      email,
      role: editFormData.role,
    };

    if (editFormData.password) {
      updateData.password = editFormData.password;
    }

    setUpdatingUserId(editingUser.user_id);

    try {
      const result = await updateUser(
        editingUser.user_id,
        updateData
      );

      if (!result?.success) {
        setStatus({
          type: "error",
          message:
            result?.message || "Unable to update user.",
        });

        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.user_id === editingUser.user_id
            ? {
                ...user,
                ...result.data,
              }
            : user
        )
      );

      setStatus({
        type: "success",
        message: "User updated successfully.",
      });

      closeEditModal();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to update user. Please try again.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(user) {
    if (!user?.user_id) {
      return;
    }

    if (
      currentUser?.user_id &&
      user.user_id === currentUser.user_id
    ) {
      setStatus({
        type: "error",
        message:
          "You cannot delete your current account.",
      });

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setStatus({
      type: "",
      message: "",
    });

    setDeletingUserId(user.user_id);

    try {
      const result = await deleteUser(user.user_id);

      if (!result?.success) {
        setStatus({
          type: "error",
          message:
            result?.message || "Unable to delete user.",
        });

        return;
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (item) => item.user_id !== user.user_id
        )
      );

      setStatus({
        type: "success",
        message: "User deleted successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to delete user. Please try again.",
      });
    } finally {
      setDeletingUserId(null);
    }
  }

  function openFaceRegistration(user) {
    setStatus({
      type: "",
      message: "",
    });

    setFaceRegistrationUser(user);
  }

  function closeFaceRegistration() {
    setFaceRegistrationUser(null);
  }

  const userCounts = useMemo(
    () => ({
      total: users.length,
      students: users.filter(
        (user) => user.role === "STUDENT"
      ).length,
      faculty: users.filter(
        (user) => user.role === "FACULTY"
      ).length,
      admins: users.filter(
        (user) => user.role === "ADMIN"
      ).length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        String(user.user_id)
          .toLowerCase()
          .includes(searchValue) ||
        user.role?.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role === roleFilter;

      /*
       * Face Profile integration is intentionally pending.
       * /api/admin/users does not currently provide face status.
       */
      const matchesFaceStatus =
        faceStatusFilter === "ALL";

      return (
        matchesSearch &&
        matchesRole &&
        matchesFaceStatus
      );
    });
  }, [
    users,
    searchTerm,
    roleFilter,
    faceStatusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const firstVisibleUser =
    filteredUsers.length === 0
      ? 0
      : (safeCurrentPage - 1) * PAGE_SIZE + 1;

  const lastVisibleUser = Math.min(
    safeCurrentPage * PAGE_SIZE,
    filteredUsers.length
  );

  return (
    <section className="admin-management">
      <div className="admin-management-page-header">
        <div className="admin-management-title-icon">
          <FontAwesomeIcon icon={faUsers} />
        </div>

        <div>
          <h1>Users Management</h1>

          <p>
            Manage all system users and their account access.
          </p>
        </div>
      </div>

      {status.message && (
        <div
          className={`admin-form-status admin-form-status-${status.type}`}
          role="alert"
        >
          <FontAwesomeIcon
            icon={
              status.type === "success"
                ? faCheck
                : faXmark
            }
          />

          <span>{status.message}</span>
        </div>
      )}

      <section className="admin-user-summary">
        <article className="admin-summary-card admin-summary-total">
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div>
            <span>Total Users</span>
            <strong>{userCounts.total}</strong>
            <small>All system users</small>
          </div>
        </article>

        <article className="admin-summary-card admin-summary-students">
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>

          <div>
            <span>Students</span>
            <strong>{userCounts.students}</strong>
            <small>Registered students</small>
          </div>
        </article>

        <article className="admin-summary-card admin-summary-faculty">
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faUserTie} />
          </div>

          <div>
            <span>Faculty</span>
            <strong>{userCounts.faculty}</strong>
            <small>Registered faculty members</small>
          </div>
        </article>

        <article className="admin-summary-card admin-summary-admins">
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>

          <div>
            <span>Admins</span>
            <strong>{userCounts.admins}</strong>
            <small>System administrators</small>
          </div>
        </article>
      </section>

      <section className="admin-users-card">
        <div className="admin-users-toolbar">
          <div className="admin-search-box">
            <FontAwesomeIcon icon={faMagnifyingGlass} />

            <input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, email, ID or role..."
              aria-label="Search users"
            />
          </div>

          <label className="admin-filter-select">
            <span className="sr-only">
              Filter by role
            </span>

            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admins</option>
            </select>

            <FontAwesomeIcon icon={faChevronDown} />
          </label>

          <label className="admin-filter-select">
            <span className="sr-only">
              Filter by face status
            </span>

            <select
              value={faceStatusFilter}
              onChange={handleFaceStatusFilterChange}
            >
              <option value="ALL">All Face Status</option>

              <option value="REGISTERED" disabled>
                Registered
              </option>

              <option value="NOT_REGISTERED" disabled>
                Not Registered
              </option>
            </select>

            <FontAwesomeIcon icon={faChevronDown} />
          </label>

          <button
            type="button"
            className="admin-add-user-button"
            onClick={openCreateModal}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add User</span>
          </button>
        </div>

        {loadingUsers ? (
          <div className="admin-list-state">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-list-state">
            <FontAwesomeIcon icon={faUsers} />

            <span>
              {searchTerm
                ? "No users match your search."
                : "No users found."}
            </span>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-management-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Face Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user, index) => {
                    const isCurrentUser =
                      currentUser?.user_id ===
                      user.user_id;

                    const isDeleting =
                      deletingUserId === user.user_id;

                    const isUpdating =
                      updatingUserId === user.user_id;

                    return (
                      <tr key={user.user_id}>
                        <td>
                          {(safeCurrentPage - 1) *
                            PAGE_SIZE +
                            index +
                            1}
                        </td>

                        <td>
                          <div className="admin-user-name-cell">
                            <div
                              className={`admin-user-avatar admin-avatar-${user.role?.toLowerCase()}`}
                            >
                              {getInitials(user.name)}
                            </div>

                            <div>
                              <strong>{user.name}</strong>

                              {isCurrentUser && (
                                <small>
                                  Current account
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="admin-user-id">
                            {user.user_id}
                          </span>
                        </td>

                        <td>{user.email}</td>

                        <td>
                          <span
                            className={`admin-role-badge admin-role-${user.role?.toLowerCase()}`}
                          >
                            <FontAwesomeIcon
                              icon={getRoleIcon(user.role)}
                            />

                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        <td>
                          <span className="admin-pending-value">
                            Not available
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="admin-face-pending"
                            onClick={() =>
                              openFaceRegistration(user)
                            }
                            title="Open face registration"
                          >
                            Register Face
                          </button>
                        </td>

                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-action-button"
                              onClick={() =>
                                openEditModal(user)
                              }
                              disabled={
                                isDeleting ||
                                isUpdating
                              }
                              title="Edit user"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="admin-action-icon"
                              onClick={() =>
                                handleDeleteUser(user)
                              }
                              disabled={
                                isCurrentUser ||
                                isDeleting ||
                                isUpdating
                              }
                              title={
                                isCurrentUser
                                  ? "You cannot delete your current account."
                                  : "Delete user"
                              }
                              aria-label={
                                isCurrentUser
                                  ? "Delete disabled for current account"
                                  : "Delete user"
                              }
                            >
                              {isDeleting ? (
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  spin
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={faTrash}
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="admin-table-footer">
              <span>
                Showing {firstVisibleUser} to{" "}
                {lastVisibleUser} of{" "}
                {filteredUsers.length} users
              </span>

              <div className="admin-pagination">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  disabled={safeCurrentPage === 1}
                  aria-label="Previous page"
                  title="Previous page"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .slice(0, 5)
                  .map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={
                        safeCurrentPage === page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(page)
                      }
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                    )
                  }
                  disabled={
                    safeCurrentPage === totalPages
                  }
                  aria-label="Next page"
                  title="Next page"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="admin-face-pending-card">
        <div className="admin-face-pending-header">
          <div className="admin-face-pending-icon">
            <FontAwesomeIcon icon={faUser} />
          </div>

          <div>
            <h2>Face Registration</h2>

            <p>
              Register a user's face when the Face Profile
              backend integration is available.
            </p>
          </div>
        </div>

        <div className="admin-face-pending-content">
          <div>
            <FontAwesomeIcon icon={faShieldHalved} />

            <div>
              <strong>
                Face registration integration pending
              </strong>

              <p>
                The registration window is prepared, but
                camera capture and face-profile submission
                must use the confirmed Face Profile API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="create-user-title">
                  Add User
                </h2>

                <p>
                  Create a new system user account.
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeCreateModal}
                disabled={submitting}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form
              className="admin-modal-form"
              onSubmit={handleCreateUser}
            >
              <div className="admin-form-field">
                <label htmlFor="admin-user-name">
                  Name
                </label>

                <input
                  id="admin-user-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleCreateChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-email">
                  Email
                </label>

                <input
                  id="admin-user-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleCreateChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-role">
                  Role
                </label>

                <select
                  id="admin-user-role"
                  name="role"
                  value={formData.role}
                  onChange={handleCreateChange}
                >
                  <option value="STUDENT">
                    Student
                  </option>

                  <option value="FACULTY">
                    Faculty
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-password">
                  Password
                </label>

                <input
                  id="admin-user-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleCreateChange}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-confirm-password">
                  Confirm Password
                </label>

                <input
                  id="admin-user-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleCreateChange}
                  placeholder="Re-enter password"
                  minLength={8}
                  required
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={closeCreateModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-add-user-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="edit-user-title">
                  Edit User
                </h2>

                <p>
                  Update the selected user's account.
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeEditModal}
                disabled={updatingUserId !== null}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form
              className="admin-modal-form"
              onSubmit={handleUpdateUser}
            >
              <div className="admin-form-field">
                <label htmlFor="edit-user-name">
                  Name
                </label>

                <input
                  id="edit-user-name"
                  name="name"
                  type="text"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  disabled={updatingUserId !== null}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-user-email">
                  Email
                </label>

                <input
                  id="edit-user-email"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  disabled={updatingUserId !== null}
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-user-role">
                  Role
                </label>

                <select
                  id="edit-user-role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditChange}
                  disabled={
                    updatingUserId !== null ||
                    currentUser?.user_id ===
                      editingUser.user_id
                  }
                >
                  <option value="STUDENT">
                    Student
                  </option>

                  <option value="FACULTY">
                    Faculty
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-user-password">
                  New Password
                </label>

                <input
                  id="edit-user-password"
                  name="password"
                  type="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current"
                  minLength={8}
                  disabled={updatingUserId !== null}
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-user-confirm-password">
                  Confirm New Password
                </label>

                <input
                  id="edit-user-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={
                    editFormData.confirmPassword
                  }
                  onChange={handleEditChange}
                  placeholder="Re-enter new password"
                  minLength={8}
                  disabled={updatingUserId !== null}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={closeEditModal}
                  disabled={updatingUserId !== null}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-add-user-button"
                  disabled={updatingUserId !== null}
                >
                  {updatingUserId !== null ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {faceRegistrationUser && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="face-registration-title"
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="face-registration-title">
                  Register Face
                </h2>

                <p>
                  Register face profile for{" "}
                  <strong>
                    {faceRegistrationUser.name}
                  </strong>
                  .
                </p>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={closeFaceRegistration}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="admin-modal-form">
              <div className="admin-form-field">
                <label htmlFor="face-registration-user">
                  User
                </label>

                <input
                  id="face-registration-user"
                  type="text"
                  value={`${faceRegistrationUser.name} — ${faceRegistrationUser.email}`}
                  readOnly
                />
              </div>

              <div className="admin-form-field">
                <label>
                  Face Capture
                </label>

                <div className="admin-list-state">
                  <FontAwesomeIcon icon={faUser} />

                  <span>
                    Camera capture will be enabled after
                    the Face Profile backend integration
                    is confirmed.
                  </span>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={closeFaceRegistration}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="admin-add-user-button"
                  disabled
                  title="Waiting for Face Profile backend integration"
                >
                  Register Face
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminManagement;