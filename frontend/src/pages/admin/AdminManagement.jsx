import { useContext, useEffect, useState } from "react";

import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} from "../../services/adminService";

import AuthContext from "../../context/authContext";

import "./AdminManagement.css";

function AdminManagement() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "ADMIN",
    password: "",
    confirmPassword: "",
  });
  

  const [admins, setAdmins] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const { user: currentUser } = useContext(AuthContext);

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [editStatus, setEditStatus] = useState({
    type: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadAdminData() {
    setLoadingAdmins(true);

    try {
      const usersResult = await getUsers();

      if (!usersResult?.success) {
        setStatus({
          type: "error",
          message:
            usersResult?.message ||
            "Unable to load administrators.",
        });

        return;
      }

      const adminUsers = (usersResult.data || []).filter(
        (user) => user.role === "ADMIN"
      );

      setAdmins(adminUsers);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to load administrators. Please try again.",
      });
    } finally {
      setLoadingAdmins(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initializeAdminData() {
      try {
        const usersResult = await getUsers();

        if (!active) {
          return;
        }

        if (!usersResult?.success) {
          setStatus({
            type: "error",
            message:
              usersResult?.message ||
              "Unable to load administrators.",
          });

          return;
        }

        const adminUsers = (usersResult.data || []).filter(
          (user) => user.role === "ADMIN"
        );

        setAdmins(adminUsers);
      } catch (error) {
        if (!active) {
          return;
        }

        setStatus({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Unable to load administrators. Please try again.",
        });
      } finally {
        if (active) {
          setLoadingAdmins(false);
        }
      }
    }

    initializeAdminData();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
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

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus({
      type: "",
      message: "",
    });

    if (formData.password !== formData.confirmPassword) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
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

    setSubmitting(true);

    try {
      const result = await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: "ADMIN",
      });

      if (!result?.success) {
        setStatus({
          type: "error",
          message:
            result?.message ||
            "Unable to create admin.",
        });

        return;
      }

      setStatus({
        type: "success",
        message: "Admin account created successfully.",
      });

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      await loadAdminData();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to create admin. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingAdmin(admin) {
    setStatus({
      type: "",
      message: "",
    });

    setEditingAdmin(admin);

    setEditFormData({
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "ADMIN",
      password: "",
      confirmPassword: "",
    });
  }

  function cancelEditingAdmin() {
    setEditingAdmin(null);

    setEditFormData({
      name: "",
      email: "",
      role: "ADMIN",
      password: "",
      confirmPassword: "",
    });

    setStatus({
      type: "",
      message: "",
    });
  }

  async function handleUpdateAdmin(event) {
    event.preventDefault();

    if (!editingAdmin?.user_id) {
      return;
    }

    setEditStatus({
      type: "",
      message: "",
    });

    const name = editFormData.name.trim();
    const email = editFormData.email.trim();

    if (!name) {
      setEditStatus({
        type: "error",
        message: "Name cannot be empty.",
      });

      return;
    }

    if (!email) {
      setEditStatus({
        type: "error",
        message: "Email cannot be empty.",
      });

      return;
    }

    if (
      editFormData.password &&
      editFormData.password.length < 8
    ) {
      setEditStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });

      return;
    }

    if (
      editFormData.password !== editFormData.confirmPassword
    ) {
      setEditStatus({
        type: "error",
        message: "Passwords do not match.",
      });

      return;
    }

    const isCurrentUser =
      currentUser?.user_id === editingAdmin.user_id;

    if (isCurrentUser && editFormData.role !== "ADMIN") {
      setEditStatus({
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

    setUpdatingUserId(editingAdmin.user_id);

    try {
      const result = await updateUser(
        editingAdmin.user_id,
        updateData
      );

      if (!result?.success) {
        setEditStatus({
          type: "error",
          message:
            result?.message ||
            "Unable to update administrator.",
        });

        return;
      }

      setAdmins((currentAdmins) =>
        currentAdmins.map((admin) =>
          admin.user_id === editingAdmin.user_id
            ? {
                ...admin,
                ...result.data,
              }
            : admin
        )
      );

      if (isCurrentUser) {
        setStatus({
          type: "success",
          message:
            "Your administrator account was updated successfully.",
        });
      } else {
        setStatus({
          type: "success",
          message:
            "Administrator updated successfully.",
        });
      }

      cancelEditingAdmin();
    } catch (error) {
      setEditStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to update administrator. Please try again.",
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteAdmin(user) {
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
      `Are you sure you want to delete the administrator "${user.name}"?`
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
            result?.message ||
            "Unable to delete administrator.",
        });

        return;
      }

      setStatus({
        type: "success",
        message:
          "Administrator deleted successfully.",
      });

      setAdmins((currentAdmins) =>
        currentAdmins.filter(
          (admin) => admin.user_id !== user.user_id
        )
      );
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Unable to delete administrator. Please try again.",
      });
    } finally {
      setDeletingUserId(null);
    }
  }

  const filteredAdmins = admins.filter((admin) => {
    const searchValue = searchTerm.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      admin.name?.toLowerCase().includes(searchValue) ||
      admin.email?.toLowerCase().includes(searchValue)
    );
  });

  return (
    <section className="admin-management">
      <header className="admin-management-header">
        <div>
          <span className="admin-management-eyebrow">
            Administration
          </span>

          <h1>Admin Management</h1>

          <p>
            Create and manage administrator accounts for
            authorized system access.
          </p>
        </div>
      </header>

      {status.message && (
        <div
          className={`admin-form-status admin-form-status-${status.type}`}
          role="alert"
        >
          {status.message}
        </div>
      )}

      <section className="admin-management-card">
        <div className="admin-management-card-header">
          <div>
            <h2>Add Administrator</h2>

            <p>
              Create a new administrator account.
            </p>
          </div>
        </div>

        <form
          className="admin-management-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-form-field">
            <label htmlFor="admin-name">
              Name
            </label>

            <input
              id="admin-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter administrator name"
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="admin-email">
              Email
            </label>

            <input
              id="admin-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter administrator email"
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="admin-password">
              Password
            </label>

            <input
              id="admin-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="admin-confirm-password">
              Confirm Password
            </label>

            <input
              id="admin-confirm-password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              minLength={8}
              required
            />
          </div>

          <div className="admin-management-form-actions">
            <button
              type="submit"
              className="admin-management-submit"
              disabled={submitting}
            >
              {submitting
                ? "Creating Admin..."
                : "Create Admin"}
            </button>
          </div>
        </form>
      </section>

      {editingAdmin && (
        <section className="admin-management-card admin-edit-card">
          <div className="admin-management-card-header">
            <div>
              <h2>Edit Administrator</h2>

              <p>
                Update the selected administrator account.
              </p>
            </div>
          </div>

          <form
            className="admin-management-form"
            onSubmit={handleUpdateAdmin}
          >
            <div className="admin-form-field">
              <label htmlFor="edit-admin-name">
                Name
              </label>

              <input
                id="edit-admin-name"
                name="name"
                type="text"
                value={editFormData.name}
                onChange={handleEditChange}
                placeholder="Enter administrator name"
                disabled={updatingUserId !== null}
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="edit-admin-email">
                Email
              </label>

              <input
                id="edit-admin-email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleEditChange}
                placeholder="Enter administrator email"
                disabled={updatingUserId !== null}
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="edit-admin-role">
                Role
              </label>

              <select
                id="edit-admin-role"
                name="role"
                value={editFormData.role}
                onChange={handleEditChange}
                disabled={
                  updatingUserId !== null ||
                  currentUser?.user_id === editingAdmin.user_id
                }
              >
                <option value="ADMIN">ADMIN</option>
                <option value="FACULTY">FACULTY</option>
                <option value="STUDENT">STUDENT</option>
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="edit-admin-password">
                New Password
              </label>

              <input
                id="edit-admin-password"
                name="password"
                type="password"
                value={editFormData.password}
                onChange={handleEditChange}
                placeholder="Leave blank to keep current password"
                minLength={8}
                disabled={updatingUserId !== null}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="edit-admin-confirm-password">
                Confirm New Password
              </label>

              <input
                id="edit-admin-confirm-password"
                name="confirmPassword"
                type="password"
                value={editFormData.confirmPassword}
                onChange={handleEditChange}
                placeholder="Re-enter new password"
                minLength={8}
                disabled={updatingUserId !== null}
              />
            </div>

            {editStatus.message && (
              <div
                className={`admin-form-status admin-form-status-${editStatus.type}`}
                role="alert"
              >
                {editStatus.message}
              </div>
            )}

            <div className="admin-management-form-actions">
              <button
                type="button"
                className="admin-edit-cancel-button"
                onClick={cancelEditingAdmin}
                disabled={updatingUserId !== null}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-management-submit"
                disabled={updatingUserId !== null}
              >
                {updatingUserId !== null
                  ? "Saving Changes..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-management-card admin-list-card">
        <div className="admin-management-card-header admin-list-header">
          <div>
            <h2>Administrators</h2>

            <p>
              View and manage existing administrator accounts.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadAdminData}
            disabled={loadingAdmins}
          >
            {loadingAdmins ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="admin-list-toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by name or email"
            aria-label="Search administrators"
          />

          <span className="admin-count">
            {filteredAdmins.length} administrator
            {filteredAdmins.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loadingAdmins ? (
          <div className="admin-list-state">
            <p>Loading administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="admin-list-state">
            <p>
              {searchTerm
                ? "No administrators match your search."
                : "No administrator accounts found."}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account ID</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAdmins.map((admin) => {
                  const isCurrentUser =
                    currentUser?.user_id === admin.user_id;

                  const isDeleting =
                    deletingUserId === admin.user_id;

                  const isUpdating =
                    updatingUserId === admin.user_id;

                  return (
                    <tr key={admin.user_id}>
                      <td>
                        <div className="admin-name-cell">
                          <strong>{admin.name}</strong>

                          {isCurrentUser && (
                            <span className="admin-current-badge">
                              Current account
                            </span>
                          )}
                        </div>
                      </td>

                      <td>{admin.email}</td>

                      <td>
                        <span className="admin-role-badge">
                          {admin.role}
                        </span>
                      </td>

                      <td>{admin.user_id}</td>

                      <td>
                        <div className="admin-action-buttons">
                          <button
                            type="button"
                            className="admin-edit-button"
                            onClick={() =>
                              startEditingAdmin(admin)
                            }
                            disabled={
                              isDeleting ||
                              isUpdating
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-delete-button"
                            onClick={() =>
                              handleDeleteAdmin(admin)
                            }
                            disabled={
                              isCurrentUser ||
                              isDeleting ||
                              isUpdating
                            }
                            title={
                              isCurrentUser
                                ? "You cannot delete your current account."
                                : "Delete administrator"
                            }
                          >
                            {isDeleting
                              ? "Deleting..."
                              : isCurrentUser
                                ? "Current"
                                : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminManagement;