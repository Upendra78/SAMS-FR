import { useState } from "react";
import "./Profile.css";

const EMPTY_PROFILE = {
  facultyId: null,
  fullName: null,
  email: null,
  department: null,
  role: "Faculty",
  accountStatus: null,
};

const displayValue = (value) => value || "N/A";

const getInitials = (name) => {
  if (!name) return "FR";

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

function Profile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName || "");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const handleEdit = () => {
    setFullName(profile.fullName || "");
    setProfileMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFullName(profile.fullName || "");
    setProfileMessage("");
    setIsEditing(false);
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setProfileMessage("Full name is required.");
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setProfileMessage(
        "Full name must be between 2 and 100 characters."
      );
      return;
    }

    setProfile({
      ...profile,
      fullName: trimmedName,
    });

    setProfileMessage(
      "Profile changes are ready for backend integration."
    );
    setIsEditing(false);
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("");
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("");
  };

  const handleChangePassword = (event) => {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordMessage("Current password is required.");
      return;
    }

    if (!newPassword) {
      setPasswordMessage("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New password and confirmation do not match."
      );
      return;
    }

    setPasswordMessage(
      "Password change is ready for backend integration."
    );
  };

  return (
    <div className="faculty-profile-page">
      <section className="faculty-profile-header">
        <div>
          <span className="faculty-profile-eyebrow">
            FACULTY PORTAL
          </span>

          <h1>Faculty Profile</h1>

          <p>
            View and manage your faculty account information and
            security settings.
          </p>
        </div>
      </section>

      <section className="faculty-profile-overview-card">
        <div className="faculty-profile-avatar">
          {getInitials(profile.fullName)}
        </div>

        <div className="faculty-profile-overview-content">
          <h2>{displayValue(profile.fullName)}</h2>

          <div className="faculty-profile-overview-meta">
            <span>
              <strong>Faculty ID:</strong>{" "}
              {displayValue(profile.facultyId)}
            </span>

            <span>
              <strong>Email:</strong> {displayValue(profile.email)}
            </span>

            <span>
              <strong>Department:</strong>{" "}
              {displayValue(profile.department)}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="faculty-profile-primary-button"
          onClick={handleEdit}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 20h9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="m16.5 3.5 4 4L8 20H4v-4L16.5 3.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          Edit Profile
        </button>
      </section>

      <section className="faculty-profile-section">
        <div className="faculty-profile-section-heading">
          <h2>Personal Information</h2>
          <p>
            Faculty account information and organizational details.
          </p>
        </div>

        <div className="faculty-profile-information-card">
          <div className="faculty-profile-field">
            <span>Faculty ID</span>
            <strong>{displayValue(profile.facultyId)}</strong>
            <small>Read-only</small>
          </div>

          <div className="faculty-profile-field">
            <span>Full Name</span>

            {isEditing ? (
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setProfileMessage("");
                }}
                placeholder="Enter full name"
                maxLength={100}
              />
            ) : (
              <strong>{displayValue(profile.fullName)}</strong>
            )}

            {isEditing && <small>Editable</small>}
          </div>

          <div className="faculty-profile-field">
            <span>Email</span>
            <strong>{displayValue(profile.email)}</strong>
            <small>Read-only</small>
          </div>

          <div className="faculty-profile-field">
            <span>Department</span>
            <strong>{displayValue(profile.department)}</strong>
            <small>Read-only</small>
          </div>

          <div className="faculty-profile-field">
            <span>Role</span>
            <strong>{displayValue(profile.role)}</strong>
            <small>Read-only</small>
          </div>
        </div>

        {isEditing && (
          <form
            className="faculty-profile-edit-actions"
            onSubmit={handleSaveProfile}
          >
            {profileMessage && (
              <p className="faculty-profile-form-message">
                {profileMessage}
              </p>
            )}

            <div className="faculty-profile-action-buttons">
              <button
                type="button"
                className="faculty-profile-secondary-button"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="faculty-profile-primary-button"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="faculty-profile-section">
        <div className="faculty-profile-section-heading">
          <h2>Account Security</h2>
          <p>
            Manage your password without exposing sensitive account
            information.
          </p>
        </div>

        <div className="faculty-profile-security-card">
          <div className="faculty-profile-security-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="15"
                r="1"
                fill="currentColor"
              />
            </svg>
          </div>

          <div className="faculty-profile-security-content">
            <h3>Password</h3>

            <p>
              Your password is securely stored and never displayed.
            </p>
          </div>

          <button
            type="button"
            className="faculty-profile-secondary-button"
            onClick={handleOpenPasswordModal}
          >
            Change Password
          </button>
        </div>
      </section>

      <section className="faculty-profile-section">
        <div className="faculty-profile-section-heading">
          <h2>Account Information</h2>
          <p>Read-only information about your faculty account.</p>
        </div>

        <div className="faculty-profile-account-card">
          <div>
            <span>Faculty ID</span>
            <strong>{displayValue(profile.facultyId)}</strong>
          </div>

          <div>
            <span>Account Status</span>

            <strong>
              {profile.accountStatus ? (
                <span className="faculty-profile-status">
                  {profile.accountStatus}
                </span>
              ) : (
                "N/A"
              )}
            </strong>
          </div>

          <div>
            <span>Role</span>
            <strong>{displayValue(profile.role)}</strong>
          </div>

          <div>
            <span>Department</span>
            <strong>{displayValue(profile.department)}</strong>
          </div>
        </div>
      </section>

      <section className="faculty-profile-integration-notice">
        <div className="faculty-profile-notice-icon">i</div>

        <div>
          <strong>Profile service integration pending</strong>

          <p>
            Faculty profile information will be loaded and updated
            through the Flask backend once the profile API is
            available.
          </p>
        </div>
      </section>

      {showPasswordModal && (
        <div
          className="faculty-profile-modal-backdrop"
          onMouseDown={handleClosePasswordModal}
        >
          <div
            className="faculty-profile-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="faculty-profile-modal-header">
              <div>
                <span className="faculty-profile-eyebrow">
                  ACCOUNT SECURITY
                </span>

                <h2>Change Password</h2>
              </div>

              <button
                type="button"
                className="faculty-profile-modal-close"
                onClick={handleClosePasswordModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="faculty-profile-modal-body">
                <div className="faculty-profile-password-field">
                  <label htmlFor="current-password">
                    Current Password
                  </label>

                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setPasswordMessage("");
                    }}
                    autoComplete="current-password"
                  />
                </div>

                <div className="faculty-profile-password-field">
                  <label htmlFor="new-password">New Password</label>

                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setPasswordMessage("");
                    }}
                    autoComplete="new-password"
                  />

                  <small>Minimum 8 characters.</small>
                </div>

                <div className="faculty-profile-password-field">
                  <label htmlFor="confirm-password">
                    Confirm New Password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordMessage("");
                    }}
                    autoComplete="new-password"
                  />
                </div>

                {passwordMessage && (
                  <div className="faculty-profile-password-message">
                    {passwordMessage}
                  </div>
                )}
              </div>

              <div className="faculty-profile-modal-footer">
                <button
                  type="button"
                  className="faculty-profile-secondary-button"
                  onClick={handleClosePasswordModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="faculty-profile-primary-button"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;