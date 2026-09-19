import { useMemo, useState } from "react";
import useAuth from "../../hooks/useAuth";

import "./AdminProfile.css";

function AdminProfile() {
  const { user } = useAuth();

  const initialName = user?.name || "N/A";

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [nameError, setNameError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const email = user?.email || "N/A";
  const role = user?.role || "ADMIN";
  const userId = user?.user_id ?? "N/A";

  const initials = useMemo(() => {
    if (!fullName || fullName === "N/A") {
      return "A";
    }

    const words = fullName.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }, [fullName]);

  const displayRole =
    role.toLowerCase() === "admin" ? "Administrator" : role;

  const handleEdit = () => {
    setSaveMessage("");
    setNameError("");
    setFullName(savedName);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFullName(savedName);
    setNameError("");
    setSaveMessage("");
    setIsEditing(false);
  };

  const handleSave = (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setNameError("Full name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setNameError("Full name must contain at least 2 characters.");
      return;
    }

    if (trimmedName.length > 100) {
      setNameError("Full name must not exceed 100 characters.");
      return;
    }

    setSavedName(trimmedName);
    setFullName(trimmedName);
    setNameError("");
    setSaveMessage(
      "Profile changes are saved locally for this session. Backend synchronization will be enabled when the Flask API is connected.",
    );
    setIsEditing(false);
  };

  const openPasswordModal = () => {
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    if (!newPassword) {
      setPasswordError("Enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must contain at least 8 characters.",
      );
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError(
        "New password must be different from your current password.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordError(
      "Password change is pending backend integration.",
    );
  };

  return (
    <section className="admin-profile-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-eyebrow">Profile</span>
          <h1>Profile</h1>
          <p>Manage your administrator account information.</p>
        </div>
      </header>

      {saveMessage && (
        <div className="admin-profile-feedback" role="status">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <span>{saveMessage}</span>
        </div>
      )}

      <section className="admin-profile-main-card">
        {/* Identity */}
        <div className="admin-profile-identity-panel">
          <div className="admin-profile-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="admin-profile-identity">
            <span className="admin-profile-overline">
              Administrator Account
            </span>

            <h2>{fullName}</h2>

            <p>{email}</p>

            <div className="admin-profile-tags">
              <span className="admin-profile-tag">
                <i
                  className="fa-solid fa-shield-halved"
                  aria-hidden="true"
                />
                {displayRole}
              </span>
            </div>
          </div>

          <div className="admin-profile-edit-area">
            {!isEditing ? (
              <button
                type="button"
                className="admin-profile-primary-button"
                onClick={handleEdit}
              >
                <i className="fa-solid fa-pen" aria-hidden="true" />
                Edit Profile
              </button>
            ) : (
              <div className="admin-profile-edit-actions">
                <button
                  type="button"
                  className="admin-profile-secondary-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="admin-profile-form"
                  className="admin-profile-primary-button"
                >
                  <i
                    className="fa-solid fa-check"
                    aria-hidden="true"
                  />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <form
          id="admin-profile-form"
          className="admin-profile-information"
          onSubmit={handleSave}
        >
          <div className="admin-profile-section-heading">
            <div className="admin-profile-section-icon">
              <i className="fa-solid fa-id-card" aria-hidden="true" />
            </div>

            <div>
              <h2>Administrator Information</h2>
              <p>
                Identity information associated with your administrator
                account.
              </p>
            </div>
          </div>

          <div className="admin-profile-fields">
            <div className="admin-profile-field">
              <label htmlFor="admin-id">Admin ID</label>

              <div className="admin-profile-readonly-field">
                <span>{userId}</span>
                <i className="fa-solid fa-lock" aria-hidden="true" />
              </div>

              <small>Administrator ID cannot be changed.</small>
            </div>

            <div className="admin-profile-field">
              <label htmlFor="full-name">Full Name</label>

              {isEditing ? (
                <>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName === "N/A" ? "" : fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setNameError("");
                      setSaveMessage("");
                    }}
                    maxLength={100}
                    autoComplete="name"
                  />

                  {nameError && (
                    <small className="admin-profile-field-error">
                      {nameError}
                    </small>
                  )}
                </>
              ) : (
                <div className="admin-profile-readonly-field">
                  <span>{savedName}</span>
                </div>
              )}
            </div>

            <div className="admin-profile-field">
              <label htmlFor="admin-email">Email</label>

              <div className="admin-profile-readonly-field">
                <span>{email}</span>
                <i className="fa-solid fa-lock" aria-hidden="true" />
              </div>

              <small>
                Email changes are managed by the administrator/backend.
              </small>
            </div>

            <div className="admin-profile-field">
              <label htmlFor="admin-role">Role</label>

              <div className="admin-profile-readonly-field">
                <span>{displayRole}</span>
                <i className="fa-solid fa-lock" aria-hidden="true" />
              </div>

              <small>
                Role is controlled by the authorization system.
              </small>
            </div>
          </div>
        </form>
      </section>

      {/* Account Security */}
      <section className="admin-profile-security-card">
        <div className="admin-profile-section-heading">
          <div className="admin-profile-section-icon admin-profile-green">
            <i className="fa-solid fa-lock" aria-hidden="true" />
          </div>

          <div>
            <h2>Account Security</h2>
            <p>Manage your password through the secure authentication flow.</p>
          </div>
        </div>

        <div className="admin-profile-password-row">
          <div className="admin-profile-password-icon">
            <i className="fa-solid fa-key" aria-hidden="true" />
          </div>

          <div className="admin-profile-password-content">
            <strong>Password</strong>
            <span>
              Your password is securely stored and is never displayed.
            </span>
          </div>

          <button
            type="button"
            className="admin-profile-secondary-button"
            onClick={openPasswordModal}
          >
            Change Password
          </button>
        </div>
      </section>

      {/* Backend Integration */}
      <section className="admin-profile-integration-card">
        <div className="admin-profile-integration-icon">
          <i className="fa-solid fa-server" aria-hidden="true" />
        </div>

        <div className="admin-profile-integration-content">
          <span>Backend Integration</span>
          <h2>Profile management API pending</h2>
          <p>
            Profile data currently comes from the authenticated frontend
            user context. Saving profile changes and changing passwords
            will be connected after the approved Flask API contract is
            available.
          </p>
        </div>

        <span className="admin-profile-pending-badge">
          Integration Pending
        </span>
      </section>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="admin-profile-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <div
            className="admin-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <div className="admin-profile-modal-header">
              <div>
                <span className="admin-profile-overline">
                  Account Security
                </span>
                <h2 id="change-password-title">Change Password</h2>
              </div>

              <button
                type="button"
                className="admin-profile-modal-close"
                onClick={closePasswordModal}
                aria-label="Close change password dialog"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <form
              className="admin-profile-password-form"
              onSubmit={handlePasswordSubmit}
            >
              <div className="admin-profile-password-field">
                <label htmlFor="current-password">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setPasswordError("");
                  }}
                  autoComplete="current-password"
                />
              </div>

              <div className="admin-profile-password-field">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordError("");
                  }}
                  autoComplete="new-password"
                />
              </div>

              <div className="admin-profile-password-field">
                <label htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError("");
                  }}
                  autoComplete="new-password"
                />
              </div>

              <div className="admin-profile-password-note">
                <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                <span>
                  Password validation and secure password hashing will be
                  handled by the Flask backend.
                </span>
              </div>

              {passwordError && (
                <div
                  className="admin-profile-password-error"
                  role="alert"
                >
                  <i
                    className="fa-solid fa-circle-exclamation"
                    aria-hidden="true"
                  />
                  {passwordError}
                </div>
              )}

              <div className="admin-profile-modal-actions">
                <button
                  type="button"
                  className="admin-profile-secondary-button"
                  onClick={closePasswordModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-profile-primary-button"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminProfile;