
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  faRotateRight,
  faPowerOff,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  reactivateUser,
} from "../../services/adminService";

import AuthContext from "../../context/authContext";
import totalUserImage from "../../../image/Total User.png";
import activeAccountImage from "../../../image/Active Account.png";
import inactiveAccountImage from "../../../image/InActive Account.png";
import studentImage from "../../../image/Student.png";
import facultyImage from "../../../image/Faculty.png";
import adminsImage from "../../../image/Admins.png";
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
  const normalized = String(role ?? "").trim().toUpperCase();

  switch (normalized) {
    case "STUDENT":
      return "Student";
    case "FACULTY":
      return "Faculty";
    case "ADMIN":
      return "Admin";
    default:
      return normalized || "Unknown";
  }
}

function getRoleIcon(role) {
  switch (String(role ?? "").toUpperCase()) {
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
  if (!name?.trim()) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getApiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function isUserActive(user) {
  // Treat only an explicit false as inactive, for compatibility
  // with existing API responses that may omit is_active.
  return user?.is_active !== false;
}

function AdminManagement() {
  const { user: currentUser } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshingUsers, setRefreshingUsers] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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
  const [reactivatingUserId, setReactivatingUserId] = useState(null);

  const loadUsers = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshingUsers(true);
    } else {
      setLoadingUsers(true);
    }

    try {
      const result = await getUsers();

      if (!result?.success) {
        setStatus({
          type: "error",
          message: result?.message || "Unable to load users.",
        });
        return false;
      }

      setUsers(Array.isArray(result.data) ? result.data : []);
      return true;
    } catch (error) {
      setStatus({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to load users. Please try again."
        ),
      });
      return false;
    } finally {
      setLoadingUsers(false);
      setRefreshingUsers(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        await loadUsers();
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load users:", error);
        }
      }
    };

    void fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [loadUsers]);

  function showMessage(type, message) {
    setStatus({ type, message });
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(event) {
    setRoleFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value);
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
    setStatus({ type: "", message: "" });
    setFormData(initialFormData);
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    if (submitting) return;

    setShowCreateModal(false);
    setFormData(initialFormData);
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name || !email) {
      showMessage("error", "Name and email are required.");
      return;
    }

    if (formData.password.length < 8) {
      showMessage("error", "Password must be at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage("error", "Passwords do not match.");
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
        showMessage(
          "error",
          result?.message || "Unable to create user."
        );
        return;
      }

      setShowCreateModal(false);
      setFormData(initialFormData);

      const userId = result?.data?.user_id;
      showMessage(
        "success",
        userId
          ? `User created successfully. User ID: ${userId}.`
          : "User created successfully."
      );

      await loadUsers(true);
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Unable to create user.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(user) {
    setStatus({ type: "", message: "" });
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
    if (updatingUserId !== null) return;

    setEditingUser(null);
    setEditFormData(initialEditFormData);
  }

  async function handleUpdateUser(event) {
    event.preventDefault();

    if (!editingUser?.user_id) return;

    setStatus({ type: "", message: "" });

    const name = editFormData.name.trim();
    const email = editFormData.email.trim();

    if (!name || !email) {
      showMessage("error", "Name and email are required.");
      return;
    }

    if (
      editFormData.password &&
      editFormData.password.length < 8
    ) {
      showMessage("error", "Password must be at least 8 characters.");
      return;
    }

    if (editFormData.password !== editFormData.confirmPassword) {
      showMessage("error", "Passwords do not match.");
      return;
    }

    const isCurrentUser =
      currentUser?.user_id === editingUser.user_id;

    if (isCurrentUser && editFormData.role !== "ADMIN") {
      showMessage(
        "error",
        "Your current account must remain an administrator."
      );
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
        showMessage(
          "error",
          result?.message || "Unable to update user."
        );
        return;
      }

      setUsers((current) =>
        current.map((user) =>
          user.user_id === editingUser.user_id
            ? { ...user, ...result.data }
            : user
        )
      );

      setEditingUser(null);
      setEditFormData(initialEditFormData);
      showMessage("success", "User updated successfully.");
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Unable to update user.")
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(user) {
    if (!user?.user_id) return;

    if (currentUser?.user_id === user.user_id) {
      showMessage("error", "You cannot delete your current account.");
      return;
    }

    const confirmed = window.confirm(
      `Remove access for "${user.name}"?\n\n` +
        "If academic or attendance history exists, the account will " +
        "be deactivated and that history will be preserved."
    );

    if (!confirmed) return;

    setStatus({ type: "", message: "" });
    setDeletingUserId(user.user_id);

    try {
      const result = await deleteUser(user.user_id);

      if (!result?.success) {
        showMessage(
          "error",
          result?.message || "Unable to remove this user."
        );
        return;
      }

      if (result.action === "deactivated") {
        setUsers((current) =>
          current.map((item) =>
            item.user_id === user.user_id
              ? { ...item, is_active: false }
              : item
          )
        );

        showMessage(
          "success",
          result.message ||
            "Account deactivated. Academic and attendance history has been preserved."
        );
      } else if (result.action === "deleted") {
        setUsers((current) =>
          current.filter((item) => item.user_id !== user.user_id)
        );

        showMessage(
          "success",
          result.message || "User permanently deleted."
        );
      } else {
        await loadUsers(true);
        showMessage(
          "success",
          result.message || "User operation completed."
        );
      }
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(error, "Unable to remove this user.")
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleReactivateUser(user) {
    if (!user?.user_id || isUserActive(user)) return;

    const confirmed = window.confirm(
      `Reactivate "${user.name}"?\n\n` +
        "This will restore login access to the existing account. " +
        "Confirm that this person is authorized to return."
    );

    if (!confirmed) return;

    setStatus({ type: "", message: "" });
    setReactivatingUserId(user.user_id);

    try {
      const result = await reactivateUser(user.user_id);

      if (!result?.success) {
        showMessage(
          "error",
          result?.message || "Unable to reactivate this account."
        );
        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.user_id === user.user_id
            ? {
                ...item,
                ...(result.data || {}),
                is_active: true,
              }
            : item
        )
      );

      showMessage(
        "success",
        result.message ||
          `${user.name}'s account has been reactivated. Previous academic history remains preserved.`
      );
    } catch (error) {
      showMessage(
        "error",
        getApiErrorMessage(
          error,
          "Unable to reactivate this account."
        )
      );
    } finally {
      setReactivatingUserId(null);
    }
  }

  const userCounts = useMemo(() => {
    const active = users.filter(isUserActive).length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      students: users.filter(
        (user) => user.role === "STUDENT"
      ).length,
      faculty: users.filter(
        (user) => user.role === "FACULTY"
      ).length,
      admins: users.filter(
        (user) => user.role === "ADMIN"
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !searchValue ||
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        String(user.user_id).toLowerCase().includes(searchValue) ||
        user.role?.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const active = isUserActive(user);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

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
        <div className="admin-management-heading">
          <div className="admin-management-title-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <div>
            <h1>Users Management</h1>
            <p>Manage system accounts, access, and account status.</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-add-user-button admin-add-user-header-button"
          onClick={openCreateModal}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add User</span>
        </button>
      </div>

      {status.message && (
        <div
          className={`admin-form-status admin-form-status-${status.type}`}
          role={status.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <FontAwesomeIcon
            icon={status.type === "success" ? faCheck : faXmark}
          />
          <span>{status.message}</span>
        </div>
      )}

      <section className="admin-user-summary">
        <article
          className="admin-summary-card admin-summary-total"
          style={{ "--summary-bg-image": `url("${totalUserImage}")` }}
        >
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <span>Total Users</span>
            <strong>{userCounts.total}</strong>
            <small>All system accounts</small>
          </div>
        </article>

        <article
          className="admin-summary-card admin-summary-active"
          style={{ "--summary-bg-image": `url("${activeAccountImage}")` }}
        >
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>
          <div>
            <span>Active Accounts</span>
            <strong>{userCounts.active}</strong>
            <small>Login enabled</small>
          </div>
        </article>

        <article
          className="admin-summary-card admin-summary-inactive"
          style={{ "--summary-bg-image": `url("${inactiveAccountImage}")` }}
        >
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faPowerOff} />
          </div>
          <div>
            <span>Inactive Accounts</span>
            <strong>{userCounts.inactive}</strong>
            <small>Login disabled</small>
          </div>
        </article>

        <article
          className="admin-summary-card admin-summary-students"
          style={{ "--summary-bg-image": `url("${studentImage}")` }}
        >
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>
          <div>
            <span>Students</span>
            <strong>{userCounts.students}</strong>
            <small>Student accounts</small>
          </div>
        </article>

        <article
          className="admin-summary-card admin-summary-faculty"
          style={{ "--summary-bg-image": `url("${facultyImage}")` }}
        >
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faUserTie} />
          </div>
          <div>
            <span>Faculty</span>
            <strong>{userCounts.faculty}</strong>
            <small>Faculty accounts</small>
          </div>
        </article>

        <article
          className="admin-summary-card admin-summary-admins"
          style={{ "--summary-bg-image": `url("${adminsImage}")` }}
        >
          <div className="admin-summary-icon">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <div>
            <span>Admins</span>
            <strong>{userCounts.admins}</strong>
            <small>Administrator accounts</small>
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
            <span className="sr-only">Filter by role</span>
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
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <FontAwesomeIcon icon={faChevronDown} />
          </label>

          <button
            type="button"
            className="admin-action-button"
            onClick={() => loadUsers(true)}
            disabled={loadingUsers || refreshingUsers}
            title="Refresh user list"
          >
            <FontAwesomeIcon
              icon={refreshingUsers ? faSpinner : faRotateRight}
              spin={refreshingUsers}
            />
            Refresh
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
            <span>No users match the selected filters.</span>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-management-table">
                <thead>
                  <tr>
                    <th>S.N.</th>
                    <th>Name</th>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user, index) => {
                    const isCurrentUser =
                      currentUser?.user_id === user.user_id;
                    const active = isUserActive(user);
                    const busy =
                      deletingUserId === user.user_id ||
                      updatingUserId === user.user_id ||
                      reactivatingUserId === user.user_id;

                    return (
                      <tr
                        key={user.user_id}
                        className={!active ? "admin-user-row-inactive" : ""}
                      >
                        <td>
                          {(safeCurrentPage - 1) * PAGE_SIZE +
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
                                <small>Current account</small>
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
                          <span
                            className={`admin-user-status ${
                              active
                                ? "admin-user-status-active"
                                : "admin-user-status-inactive"
                            }`}
                          >
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-action-button"
                              onClick={() => openEditModal(user)}
                              disabled={busy}
                              title="Edit user"
                            >
                              Edit
                            </button>

                            {active ? (
                              <button
                                type="button"
                                className="admin-action-icon"
                                onClick={() => handleDeleteUser(user)}
                                disabled={isCurrentUser || busy}
                                title={
                                  isCurrentUser
                                    ? "You cannot remove your current account."
                                    : "Deactivate or delete account"
                                }
                                aria-label={`Remove access for ${user.name}`}
                              >
                                {deletingUserId === user.user_id ? (
                                  <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                  />
                                ) : (
                                  <FontAwesomeIcon icon={faTrash} />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-action-button admin-reactivate-button"
                                onClick={() => handleReactivateUser(user)}
                                disabled={busy}
                                title="Restore login access"
                              >
                                <FontAwesomeIcon
                                  icon={
                                    reactivatingUserId === user.user_id
                                      ? faSpinner
                                      : faRotateRight
                                  }
                                  spin={
                                    reactivatingUserId === user.user_id
                                  }
                                />
                                {reactivatingUserId === user.user_id
                                  ? "Restoring..."
                                  : "Reactivate"}
                              </button>
                            )}
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
                Showing {firstVisibleUser} to {lastVisibleUser} of{" "}
                {filteredUsers.length} users
              </span>

              <div className="admin-pagination">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
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
                        safeCurrentPage === page ? "active" : ""
                      }
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={safeCurrentPage === totalPages}
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
                <h2 id="create-user-title">Add User</h2>
                <p>Create a new system login account.</p>
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
                <label htmlFor="admin-user-name">Full Name</label>
                <input
                  id="admin-user-name"
                  name="name"
                  value={formData.name}
                  onChange={handleCreateChange}
                  placeholder="Enter full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-email">Email</label>
                <input
                  id="admin-user-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleCreateChange}
                  placeholder="Enter email address"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-password">Password</label>
                <input
                  id="admin-user-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleCreateChange}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-user-role">Role</label>
                <select
                  id="admin-user-role"
                  name="role"
                  value={formData.role}
                  onChange={handleCreateChange}
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admin</option>
                </select>
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
                      <FontAwesomeIcon icon={faSpinner} spin />
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
                <h2 id="edit-user-title">Edit User</h2>
                <p>Update the selected user's account.</p>
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
                <label htmlFor="edit-user-name">Full Name</label>
                <input
                  id="edit-user-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  disabled={updatingUserId !== null}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-user-email">Email</label>
                <input
                  id="edit-user-email"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  disabled={updatingUserId !== null}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="edit-user-role">Role</label>
                <select
                  id="edit-user-role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditChange}
                  disabled={
                    updatingUserId !== null ||
                    currentUser?.user_id === editingUser.user_id
                  }
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admin</option>
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
                  autoComplete="new-password"
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
                  value={editFormData.confirmPassword}
                  onChange={handleEditChange}
                  placeholder="Re-enter new password"
                  minLength={8}
                  autoComplete="new-password"
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
                      <FontAwesomeIcon icon={faSpinner} spin />
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
    </section>
  );
}

export default AdminManagement;
