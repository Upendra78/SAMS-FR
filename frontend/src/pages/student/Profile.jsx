import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleInfo,
  faEnvelope,
  faGraduationCap,
  faLock,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState({
    studentId: "",
    fullName: "",
    email: "",
    department: "",
    program: "",
    year: "",
    semester: "",
    enrollmentStatus: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const initials =
    profile.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "ST";

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));

    setSaveMessage("");
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();

    const trimmedName = profile.fullName.trim();

    if (!trimmedName) {
      setSaveMessage("Full name is required.");
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setSaveMessage("Full name must contain between 2 and 100 characters.");
      return;
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      fullName: trimmedName,
    }));

    setIsEditing(false);
    setSaveMessage("Profile changes are ready for backend integration.");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((currentPasswords) => ({
      ...currentPasswords,
      [name]: value,
    }));

    setPasswordMessage("");
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (!passwords.current) {
      setPasswordMessage("Current password is required.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordMessage("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirm) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    setPasswordMessage(
      "Password change is ready for backend integration.",
    );

    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });
  };

  return (
    <section className="student-profile">
      {/* Header */}
      <div className="student-profile-header">
        <div>
          <span className="student-profile-eyebrow">Account Management</span>
          <h1>Student Profile</h1>
          <p>
            View and manage your personal information, academic details and
            account security.
          </p>
        </div>

        <div className="student-profile-account-status">
          <span>Student Account</span>
          <strong>
            <span className="student-profile-status-dot" />
            Active
          </strong>
        </div>
      </div>

      {/* Profile Overview */}
      <section className="student-profile-overview">
        <div className="student-profile-avatar">{initials}</div>

        <div className="student-profile-overview-content">
          <span className="student-profile-overview-label">
            Student Account
          </span>

          <h2>{profile.fullName || "N/A"}</h2>

          <div className="student-profile-overview-meta">
            <span>
              <FontAwesomeIcon icon={faUser} />
              Student ID: {profile.studentId || "N/A"}
            </span>

            <span>
              <FontAwesomeIcon icon={faEnvelope} />
              {profile.email || "N/A"}
            </span>
          </div>
        </div>

        <div className="student-profile-overview-status">
          <span className="student-profile-status-dot" />
          {profile.enrollmentStatus || "N/A"}
        </div>
      </section>

      {/* Personal Information */}
      <section className="student-profile-panel">
        <div className="student-profile-panel-header">
          <div>
            <span>Personal Information</span>
            <h2>Basic Account Details</h2>
          </div>

          {!isEditing && (
            <button
              type="button"
              className="student-profile-primary-button"
              onClick={() => {
                setIsEditing(true);
                setSaveMessage("");
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form
            className="student-profile-form"
            onSubmit={handleSaveProfile}
          >
            <div className="student-profile-field">
              <label htmlFor="student-id">Student ID</label>
              <input
                id="student-id"
                name="studentId"
                value={profile.studentId}
                placeholder="N/A"
                disabled
              />
              <small>Student ID cannot be changed from the portal.</small>
            </div>

            <div className="student-profile-field">
              <label htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                name="fullName"
                value={profile.fullName}
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                maxLength={100}
              />
            </div>

            <div className="student-profile-field">
              <label htmlFor="student-email">Email</label>
              <input
                id="student-email"
                name="email"
                value={profile.email}
                placeholder="N/A"
                disabled
              />
              <small>
                Email changes require backend verification.
              </small>
            </div>

            <div className="student-profile-form-actions">
              <button
                type="button"
                className="student-profile-secondary-button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveMessage("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="student-profile-primary-button"
              >
                Save Changes
              </button>
            </div>

            {saveMessage && (
              <div className="student-profile-message">
                <FontAwesomeIcon icon={faCircleInfo} />
                <span>{saveMessage}</span>
              </div>
            )}
          </form>
        ) : (
          <div className="student-profile-info-grid">
            <div>
              <span>Student ID</span>
              <strong>{profile.studentId || "N/A"}</strong>
            </div>

            <div>
              <span>Full Name</span>
              <strong>{profile.fullName || "N/A"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{profile.email || "N/A"}</strong>
            </div>
          </div>
        )}
      </section>

      {/* Academic Information */}
      <section className="student-profile-panel">
        <div className="student-profile-panel-header">
          <div>
            <span>Academic Information</span>
            <h2>Academic Details</h2>
          </div>

          <div className="student-profile-panel-icon">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
        </div>

        <div className="student-profile-info-grid">
          <div>
            <span>Department</span>
            <strong>{profile.department || "N/A"}</strong>
          </div>

          <div>
            <span>Program</span>
            <strong>{profile.program || "N/A"}</strong>
          </div>

          <div>
            <span>Year</span>
            <strong>{profile.year || "N/A"}</strong>
          </div>

          <div>
            <span>Semester</span>
            <strong>{profile.semester || "N/A"}</strong>
          </div>

          <div>
            <span>Enrollment Status</span>
            <strong>{profile.enrollmentStatus || "N/A"}</strong>
          </div>
        </div>

        <div className="student-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />
          <span>
            Academic information is managed by the institution and cannot be
            edited from the student portal.
          </span>
        </div>
      </section>

      {/* Account Security */}
      <section className="student-profile-panel">
        <div className="student-profile-panel-header">
          <div>
            <span>Account Security</span>
            <h2>Password & Security</h2>
          </div>

          <div className="student-profile-panel-icon">
            <FontAwesomeIcon icon={faLock} />
          </div>
        </div>

        <div className="student-profile-security">
          <div>
            <strong>Password</strong>
            <p>
              Your password is securely protected and is never displayed in
              the portal.
            </p>
          </div>

          <button
            type="button"
            className="student-profile-secondary-button"
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordMessage("");
            }}
          >
            Change Password
          </button>
        </div>
      </section>

      {/* Account Information */}
      <section className="student-profile-panel">
        <div className="student-profile-panel-header">
          <div>
            <span>Account Information</span>
            <h2>System Account</h2>
          </div>
        </div>

        <div className="student-profile-account-grid">
          <div>
            <span>Student ID</span>
            <strong>{profile.studentId || "N/A"}</strong>
          </div>

          <div>
            <span>Account Status</span>
            <strong>{profile.enrollmentStatus || "N/A"}</strong>
          </div>

          <div>
            <span>Role</span>
            <strong>STUDENT</strong>
          </div>

          <div>
            <span>Department</span>
            <strong>{profile.department || "N/A"}</strong>
          </div>
        </div>
      </section>

      {/* Integration Note */}
      <section className="student-profile-integration-note">
        <div className="student-profile-note-icon">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>

        <div>
          <strong>Profile data integration</strong>
          <p>
            Profile information will be loaded for the authenticated student
            from the backend. Changes and password operations will be persisted
            only after the corresponding Flask services are connected.
          </p>
        </div>
      </section>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="student-profile-modal-backdrop"
          role="presentation"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="student-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-password-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="student-profile-modal-header">
              <div>
                <span>Account Security</span>
                <h2 id="student-password-title">Change Password</h2>
              </div>

              <button
                type="button"
                aria-label="Close password modal"
                onClick={() => setShowPasswordModal(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form
              className="student-profile-password-form"
              onSubmit={handlePasswordSubmit}
            >
              <label>
                <span>Current Password</span>
                <input
                  type="password"
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                />
              </label>

              <label>
                <span>New Password</span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
              </label>

              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
              </label>

              <p className="student-profile-password-hint">
                The new password must contain at least 8 characters.
              </p>

              {passwordMessage && (
                <div className="student-profile-message">
                  <FontAwesomeIcon icon={faCircleInfo} />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="student-profile-modal-actions">
                <button
                  type="button"
                  className="student-profile-secondary-button"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-profile-primary-button"
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

export default Profile;