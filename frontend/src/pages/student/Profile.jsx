import { useEffect, useState } from "react";
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
import { getCurrentUser } from "../../services/authService";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState({
    userId: "",
    studentId: "",
    fullName: "",
    email: "",
    department: "",
    program: "",
    year: "",
    semester: "",
    enrollmentStatus: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getCurrentUser();

        if (!result?.success || !result?.data) {
          throw new Error(
            result?.message || "Unable to load your profile.",
          );
        }

        const user = result.data;

        if (user.role !== "STUDENT") {
          throw new Error("Authenticated user is not a student.");
        }

        if (isMounted) {
          setProfile({
            userId: user.user_id ?? "",
            studentId: "",
            fullName: user.name ?? "",
            email: user.email ?? "",
            department: "",
            program: "",
            year: "",
            semester: "",
            enrollmentStatus: "",
            role: user.role ?? "STUDENT",
          });
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error?.message || "Unable to load your profile.",
          );
        }
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

  const initials =
    profile.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "ST";

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

    setPasswordMessage(
      "Password changes are not available until the backend password service is connected.",
    );
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordMessage("");
    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });
  };

  if (loading) {
    return (
      <section className="student-profile">
        <div className="student-profile-header">
          <div>
            <span className="student-profile-eyebrow">
              Account Management
            </span>
            <h1>Student Profile</h1>
            <p>
              View and manage your personal information, academic details and
              account security.
            </p>
          </div>
        </div>

        <section className="student-profile-panel">
          <div className="student-profile-integration-note">
            <div className="student-profile-note-icon">
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>

            <div>
              <strong>Loading profile</strong>
              <p>
                Loading your authenticated account information from the
                backend.
              </p>
            </div>
          </div>
        </section>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="student-profile">
        <div className="student-profile-header">
          <div>
            <span className="student-profile-eyebrow">
              Account Management
            </span>
            <h1>Student Profile</h1>
            <p>
              View and manage your personal information, academic details and
              account security.
            </p>
          </div>
        </div>

        <section className="student-profile-panel">
          <div className="student-profile-integration-note">
            <div className="student-profile-note-icon">
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>

            <div>
              <strong>Unable to load profile</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="student-profile">
      {/* Header */}
      <div className="student-profile-header">
        <div>
          <span className="student-profile-eyebrow">
            Account Management
          </span>

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
            Authenticated
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
              User ID: {profile.userId || "N/A"}
            </span>

            <span>
              <FontAwesomeIcon icon={faEnvelope} />
              {profile.email || "N/A"}
            </span>
          </div>
        </div>

        <div className="student-profile-overview-status">
          <span className="student-profile-status-dot" />
          {profile.role || "N/A"}
        </div>
      </section>

      {/* Personal Information */}
      <section className="student-profile-panel">
        <div className="student-profile-panel-header">
          <div>
            <span>Personal Information</span>
            <h2>Basic Account Details</h2>
          </div>
        </div>

        <div className="student-profile-info-grid">
          <div>
            <span>Full Name</span>
            <strong>{profile.fullName || "N/A"}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{profile.email || "N/A"}</strong>
          </div>

          <div>
            <span>User ID</span>
            <strong>{profile.userId || "N/A"}</strong>
          </div>
        </div>

        <div className="student-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Profile editing is currently unavailable because the confirmed
            Flask backend does not provide a student profile update endpoint.
          </span>
        </div>
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
            <span>Student ID</span>
            <strong>{profile.studentId || "N/A"}</strong>
          </div>

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
            Academic information is managed by the institution. The current
            backend does not provide a student academic profile endpoint.
          </span>
        </div>
      </section>

      {/* Account Security */}
      <section className="student-profile-panel">
        <div className="student-profile-panel-header">
          <div>
            <span>Account Security</span>
            <h2>Password &amp; Security</h2>
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

        <div className="student-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Password changes are currently unavailable because the confirmed
            Flask backend does not provide a password-change endpoint.
          </span>
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
            <span>User ID</span>
            <strong>{profile.userId || "N/A"}</strong>
          </div>

          <div>
            <span>Account Status</span>
            <strong>Authenticated</strong>
          </div>

          <div>
            <span>Role</span>
            <strong>{profile.role || "N/A"}</strong>
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
            Name, email, user ID and role are loaded from the authenticated
            Flask session through the confirmed <code>/api/auth/me</code>{" "}
            endpoint. Student academic information and profile/password
            updates remain unavailable until corresponding backend services
            are provided.
          </p>
        </div>
      </section>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="student-profile-modal-backdrop"
          role="presentation"
          onClick={closePasswordModal}
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
                onClick={closePasswordModal}
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
                  disabled
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
                  disabled
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
                  disabled
                />
              </label>

              <p className="student-profile-password-hint">
                Password changes will become available after the backend
                password service is implemented.
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
                  onClick={closePasswordModal}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="student-profile-primary-button"
                  disabled
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