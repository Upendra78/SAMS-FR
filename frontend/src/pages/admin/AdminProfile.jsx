import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleInfo,
  faEnvelope,
  faUser,
  faLock,
  faXmark,
  faLocationDot,
  faUserShield,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { getCurrentUser } from "../../services/authService";
import "./AdminProfile.css";

const EMPTY_PROFILE = {
  userId: "",
  adminId: "",
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  fatherName: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  department: "",
  designation: "",
  qualification: "",
  joiningDate: "",
  employmentStatus: "",
  role: "",
  accountStatus: "",
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return value;
};

const getInitials = (name) => {
  if (!name) {
    return "AD";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "AD"
  );
};

function Profile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);

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

        if (user.role !== "ADMIN") {
          throw new Error(
            "The authenticated account is not an administrator account.",
          );
        }

        if (!isMounted) {
          return;
        }

        setProfile({
          userId: user.user_id ?? "",
          adminId: user.admin_id ?? "",
          fullName: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          gender: user.gender ?? "",
          dateOfBirth:
            user.date_of_birth ??
            user.dateOfBirth ??
            "",
          fatherName: user.father_name ?? "",
          address: user.address ?? "",
          city: user.city ?? "",
          state: user.state ?? "",
          country: user.country ?? "",
          pincode: user.pincode ?? user.pin_code ?? "",
          department: user.department ?? "",
          designation: user.designation ?? "",
          qualification: user.qualification ?? "",
          joiningDate:
            user.joining_date ??
            user.joiningDate ??
            "",
          employmentStatus:
            user.employment_status ??
            user.employmentStatus ??
            "",
          role: user.role ?? "",
          accountStatus:
            user.account_status ??
            user.accountStatus ??
            "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProfile(EMPTY_PROFILE);

        setErrorMessage(
          error?.message ||
            "Unable to load your administrator profile.",
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

  const initials = getInitials(profile.fullName);

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

  const openPasswordModal = () => {
    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });

    setPasswordMessage("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);

    setPasswords({
      current: "",
      newPassword: "",
      confirm: "",
    });

    setPasswordMessage("");
  };

  if (loading) {
    return (
      <section className="admin-profile-page">
        <div className="admin-profile-header">
          <div>
            <span className="admin-profile-eyebrow">
              Account Management
            </span>

            <h1>Admin Profile</h1>

            <p>
              View your personal information, administrative details
              and account security.
            </p>
          </div>
        </div>

        <section className="admin-profile-integration-notice">
          <div className="admin-profile-notice-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <div>
            <strong>Loading profile</strong>

            <p>
              Loading your authenticated administrator account
              information from the backend.
            </p>
          </div>
        </section>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="admin-profile-page">
        <div className="admin-profile-header">
          <div>
            <span className="admin-profile-eyebrow">
              Account Management
            </span>

            <h1>Admin Profile</h1>

            <p>
              View your personal information, administrative details
              and account security.
            </p>
          </div>
        </div>

        <section className="admin-profile-integration-notice">
          <div className="admin-profile-notice-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <div>
            <strong>Unable to load profile</strong>

            <p>{errorMessage}</p>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="admin-profile-page">
      {/* Header */}
      <div className="admin-profile-header">
        <div>
          <span className="admin-profile-eyebrow">
            Account Management
          </span>

          <h1>Admin Profile</h1>

          <p>
            View your personal information, administrative details
            and account security.
          </p>
        </div>

        <div className="admin-profile-account-status">
          <span>Administrator Account</span>

          <strong>
            <span className="admin-profile-status-dot" />
            Authenticated
          </strong>
        </div>
      </div>

      {/* Profile Overview */}
      <section className="admin-profile-overview">
        <div className="admin-profile-avatar">
          {initials}
        </div>

        <div className="admin-profile-overview-content">
          <span className="admin-profile-overview-label">
            Administrator Account
          </span>

          <h2>{displayValue(profile.fullName)}</h2>

          <div className="admin-profile-overview-meta">
            <span>
              <FontAwesomeIcon icon={faUser} />
              User ID: {displayValue(profile.userId)}
            </span>

            <span>
              <FontAwesomeIcon icon={faEnvelope} />
              {displayValue(profile.email)}
            </span>

            <span>
              <FontAwesomeIcon icon={faUserShield} />
              {displayValue(profile.designation)}
            </span>
          </div>
        </div>

        <div className="admin-profile-overview-status">
          <span className="admin-profile-status-dot" />

          {displayValue(profile.role)}
        </div>
      </section>

      {/* Personal Information */}
      <section className="admin-profile-panel">
        <div className="admin-profile-panel-header">
          <div>
            <span>Personal Information</span>

            <h2>Basic Personal Details</h2>
          </div>

          <div className="admin-profile-panel-icon">
            <FontAwesomeIcon icon={faUser} />
          </div>
        </div>

        <div className="admin-profile-info-grid">
          <div>
            <span>Full Name</span>
            <strong>{displayValue(profile.fullName)}</strong>
          </div>

          <div>
            <span>Email</span>
            <strong>{displayValue(profile.email)}</strong>
          </div>

          <div>
            <span>Phone Number</span>
            <strong>{displayValue(profile.phone)}</strong>
          </div>

          <div>
            <span>Gender</span>
            <strong>{displayValue(profile.gender)}</strong>
          </div>

          <div>
            <span>Date of Birth</span>
            <strong>{displayValue(profile.dateOfBirth)}</strong>
          </div>

          <div>
            <span>Father / Spouse Name</span>
            <strong>{displayValue(profile.fatherName)}</strong>
          </div>
        </div>

        <div className="admin-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Personal information is currently read-only. Fields not
            provided by the backend are displayed as N/A.
          </span>
        </div>
      </section>

      {/* Contact Information */}
      <section className="admin-profile-panel">
        <div className="admin-profile-panel-header">
          <div>
            <span>Contact Information</span>

            <h2>Address &amp; Location</h2>
          </div>

          <div className="admin-profile-panel-icon">
            <FontAwesomeIcon icon={faLocationDot} />
          </div>
        </div>

        <div className="admin-profile-info-grid">
          <div className="admin-profile-wide-field">
            <span>Address</span>
            <strong>{displayValue(profile.address)}</strong>
          </div>

          <div>
            <span>City</span>
            <strong>{displayValue(profile.city)}</strong>
          </div>

          <div>
            <span>State</span>
            <strong>{displayValue(profile.state)}</strong>
          </div>

          <div>
            <span>Country</span>
            <strong>{displayValue(profile.country)}</strong>
          </div>

          <div>
            <span>PIN Code</span>
            <strong>{displayValue(profile.pincode)}</strong>
          </div>
        </div>
      </section>

      {/* Administrative Information */}
      <section className="admin-profile-panel">
        <div className="admin-profile-panel-header">
          <div>
            <span>Administrative Information</span>

            <h2>Administrator Details</h2>
          </div>

          <div className="admin-profile-panel-icon">
            <FontAwesomeIcon icon={faBuilding} />
          </div>
        </div>

        <div className="admin-profile-info-grid">
          <div>
            <span>Admin ID</span>
            <strong>{displayValue(profile.adminId)}</strong>
          </div>

          <div>
            <span>Department</span>
            <strong>{displayValue(profile.department)}</strong>
          </div>

          <div>
            <span>Designation</span>
            <strong>{displayValue(profile.designation)}</strong>
          </div>

          <div>
            <span>Qualification</span>
            <strong>{displayValue(profile.qualification)}</strong>
          </div>

          <div>
            <span>Joining Date</span>
            <strong>{displayValue(profile.joiningDate)}</strong>
          </div>

          <div>
            <span>Employment Status</span>
            <strong>{displayValue(profile.employmentStatus)}</strong>
          </div>
        </div>

        <div className="admin-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Administrative information will be populated when the
            corresponding backend profile data is provided.
            Unavailable fields are displayed as N/A.
          </span>
        </div>
      </section>

      {/* Account Security */}
      <section className="admin-profile-panel">
        <div className="admin-profile-panel-header">
          <div>
            <span>Account Security</span>

            <h2>Password &amp; Security</h2>
          </div>

          <div className="admin-profile-panel-icon">
            <FontAwesomeIcon icon={faLock} />
          </div>
        </div>

        <div className="admin-profile-security">
          <div>
            <strong>Password</strong>

            <p>
              Your password is securely protected and is never
              displayed in the portal.
            </p>
          </div>

          <button
            type="button"
            className="admin-profile-secondary-button"
            onClick={openPasswordModal}
          >
            Change Password
          </button>
        </div>

        <div className="admin-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Password changes are currently unavailable because the
            confirmed Flask backend does not provide a
            password-change endpoint.
          </span>
        </div>
      </section>

      {/* Account Information */}
      <section className="admin-profile-panel">
        <div className="admin-profile-panel-header">
          <div>
            <span>Account Information</span>

            <h2>System Account</h2>
          </div>
        </div>

        <div className="admin-profile-account-grid">
          <div>
            <span>User ID</span>
            <strong>{displayValue(profile.userId)}</strong>
          </div>

          <div>
            <span>Account Status</span>
            <strong>{displayValue(profile.accountStatus)}</strong>
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

      {/* Integration Note */}
      <section className="admin-profile-integration-note">
        <div className="admin-profile-note-icon">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>

        <div>
          <strong>Admin profile integration</strong>

          <p>
            Name, email, user ID and role are currently loaded from
            the authenticated Flask session through the confirmed{" "}
            <code>/api/auth/me</code> endpoint. Additional
            administrator information will appear automatically when
            supplied by the backend. Until then, unavailable fields
            are shown as N/A.
          </p>
        </div>
      </section>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="admin-profile-modal-backdrop"
          role="presentation"
          onClick={closePasswordModal}
        >
          <div
            className="admin-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-password-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-profile-modal-header">
              <div>
                <span>Account Security</span>

                <h2 id="admin-password-title">
                  Change Password
                </h2>
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
              className="admin-profile-password-form"
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

              <p className="admin-profile-password-hint">
                Password changes will become available after the
                backend password service is implemented.
              </p>

              {passwordMessage && (
                <div className="admin-profile-message">
                  <FontAwesomeIcon icon={faCircleInfo} />

                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="admin-profile-modal-actions">
                <button
                  type="button"
                  className="admin-profile-secondary-button"
                  onClick={closePasswordModal}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="admin-profile-primary-button"
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