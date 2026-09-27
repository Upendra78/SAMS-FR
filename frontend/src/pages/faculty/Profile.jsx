import { useEffect, useState } from "react";
import "./Profile.css";

import { getCurrentUser } from "../../services/authService";

const EMPTY_PROFILE = {
  userId: null,
  fullName: null,
  email: null,
  facultyId: null,
  department: null,
  role: null,
  accountStatus: null,
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return value;
};

const getInitials = (name) => {
  if (!name) {
    return "FR";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

function Profile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const result = await getCurrentUser();

        if (!result?.success || !result?.data) {
          throw new Error(
            result?.message || "Unable to load your profile.",
          );
        }

        if (result.data.role !== "FACULTY") {
          throw new Error(
            "The authenticated account is not a faculty account.",
          );
        }

        if (!isMounted) {
          return;
        }

        setProfile({
          userId: result.data.user_id ?? null,
          fullName: result.data.name ?? null,
          email: result.data.email ?? null,
          facultyId: null,
          department: null,
          role: result.data.role ?? null,
          accountStatus: null,
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setProfile(EMPTY_PROFILE);
        setError(
          requestError?.message ||
            "Unable to load your profile information.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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

    setPasswordMessage(
      "Password change is unavailable until a backend password-change API is provided.",
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
            View your faculty account information and security
            settings.
          </p>
        </div>
      </section>

      {loading ? (
        <section className="faculty-profile-integration-notice">
          <div className="faculty-profile-notice-icon">i</div>

          <div>
            <strong>Loading profile</strong>

            <p>
              Your authenticated faculty account information is being
              loaded.
            </p>
          </div>
        </section>
      ) : error ? (
        <section className="faculty-profile-integration-notice">
          <div className="faculty-profile-notice-icon">!</div>

          <div>
            <strong>Unable to load profile</strong>

            <p>{error}</p>
          </div>
        </section>
      ) : (
        <>
          <section className="faculty-profile-overview-card">
            <div className="faculty-profile-avatar">
              {getInitials(profile.fullName)}
            </div>

            <div className="faculty-profile-overview-content">
              <h2>{displayValue(profile.fullName)}</h2>

              <div className="faculty-profile-overview-meta">
                <span>
                  <strong>User ID:</strong>{" "}
                  {displayValue(profile.userId)}
                </span>

                <span>
                  <strong>Email:</strong>{" "}
                  {displayValue(profile.email)}
                </span>

                <span>
                  <strong>Department:</strong>{" "}
                  {displayValue(profile.department)}
                </span>
              </div>
            </div>
          </section>

          <section className="faculty-profile-section">
            <div className="faculty-profile-section-heading">
              <h2>Personal Information</h2>

              <p>
                Faculty account information and organizational
                details.
              </p>
            </div>

            <div className="faculty-profile-information-card">
              <div className="faculty-profile-field">
                <span>User ID</span>

                <strong>{displayValue(profile.userId)}</strong>

                <small>Read-only</small>
              </div>

              <div className="faculty-profile-field">
                <span>Full Name</span>

                <strong>{displayValue(profile.fullName)}</strong>

                <small>Read-only</small>
              </div>

              <div className="faculty-profile-field">
                <span>Email</span>

                <strong>{displayValue(profile.email)}</strong>

                <small>Read-only</small>
              </div>

              <div className="faculty-profile-field">
                <span>Department</span>

                <strong>{displayValue(profile.department)}</strong>

                <small>
                  Not provided by current backend contract
                </small>
              </div>

              <div className="faculty-profile-field">
                <span>Role</span>

                <strong>{displayValue(profile.role)}</strong>

                <small>Read-only</small>
              </div>
            </div>
          </section>

          <section className="faculty-profile-section">
            <div className="faculty-profile-section-heading">
              <h2>Account Security</h2>

              <p>
                Manage your password without exposing sensitive
                account information.
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
                  Your password is securely stored and never
                  displayed.
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

              <p>
                Read-only information about your faculty account.
              </p>
            </div>

            <div className="faculty-profile-account-card">
              <div>
                <span>User ID</span>

                <strong>{displayValue(profile.userId)}</strong>
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
              <strong>
                Faculty profile API integration partially available
              </strong>

              <p>
                Your name, email, user ID, and role are loaded from
                the authenticated account. Faculty ID, department,
                account status, profile editing, and password changes
                require additional backend APIs.
              </p>
            </div>
          </section>
        </>
      )}

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
                  <label htmlFor="new-password">
                    New Password
                  </label>

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

                <div className="faculty-profile-password-message">
                  {passwordMessage ||
                    "Password changes are currently unavailable because no backend password-change endpoint has been confirmed."}
                </div>
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