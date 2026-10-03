import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleInfo,
  faEnvelope,
  faGraduationCap,
  faLock,
  faUser,
  faBriefcase,
  faXmark,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { getCurrentUser } from "../../services/authService";
import "./Profile.css";

const EMPTY_PROFILE = {
  userId: "",
  facultyId: "",
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
  specialization: "",
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
    return "FC";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "FC"
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

        if (user.role !== "FACULTY") {
          throw new Error(
            "The authenticated account is not a faculty account.",
          );
        }

        if (!isMounted) {
          return;
        }

        /*
         * Only fields confirmed by the current backend are guaranteed:
         * user_id, name, email and role.
         *
         * Other fields are read defensively. If the backend starts
         * returning them later, they will automatically appear here.
         * Otherwise the UI displays N/A.
         */
        setProfile({
          userId: user.user_id ?? "",
          facultyId: user.faculty_id ?? "",
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
          specialization: user.specialization ?? "",
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
            "Unable to load your faculty profile.",
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
      <section className="faculty-profile-page">
        <div className="faculty-profile-header">
          <div>
            <span className="faculty-profile-eyebrow">
              Account Management
            </span>

            <h1>Faculty Profile</h1>

            <p>
              View your personal information, professional details
              and account security.
            </p>
          </div>
        </div>

        <section className="faculty-profile-integration-notice">
          <div className="faculty-profile-notice-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <div>
            <strong>Loading profile</strong>

            <p>
              Loading your authenticated faculty account information
              from the backend.
            </p>
          </div>
        </section>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="faculty-profile-page">
        <div className="faculty-profile-header">
          <div>
            <span className="faculty-profile-eyebrow">
              Account Management
            </span>

            <h1>Faculty Profile</h1>

            <p>
              View your personal information, professional details
              and account security.
            </p>
          </div>
        </div>

        <section className="faculty-profile-integration-notice">
          <div className="faculty-profile-notice-icon">
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
    <section className="faculty-profile-page">
      {/* Header */}
      <div className="faculty-profile-header">
        <div>
          <span className="faculty-profile-eyebrow">
            Account Management
          </span>

          <h1>Faculty Profile</h1>

          <p>
            View your personal information, professional details and
            account security.
          </p>
        </div>

        <div className="faculty-profile-account-status">
          <span>Faculty Account</span>

          <strong>
            <span className="faculty-profile-status-dot" />
            Authenticated
          </strong>
        </div>
      </div>

      {/* Profile Overview */}
      <section className="faculty-profile-overview">
        <div className="faculty-profile-avatar">
          {initials}
        </div>

        <div className="faculty-profile-overview-content">
          <span className="faculty-profile-overview-label">
            Faculty Account
          </span>

          <h2>{displayValue(profile.fullName)}</h2>

          <div className="faculty-profile-overview-meta">
            <span>
              <FontAwesomeIcon icon={faUser} />
              User ID: {displayValue(profile.userId)}
            </span>

            <span>
              <FontAwesomeIcon icon={faEnvelope} />
              {displayValue(profile.email)}
            </span>

            <span>
              <FontAwesomeIcon icon={faBriefcase} />
              {displayValue(profile.designation)}
            </span>
          </div>
        </div>

        <div className="faculty-profile-overview-status">
          <span className="faculty-profile-status-dot" />

          {displayValue(profile.role)}
        </div>
      </section>

      {/* Personal Information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Personal Information</span>

            <h2>Basic Personal Details</h2>
          </div>

          <div className="faculty-profile-panel-icon">
            <FontAwesomeIcon icon={faUser} />
          </div>
        </div>

        <div className="faculty-profile-info-grid">
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

        <div className="faculty-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Personal information is currently read-only. Fields that
            are not provided by the backend are displayed as N/A.
          </span>
        </div>
      </section>

      {/* Contact Information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Contact Information</span>

            <h2>Address &amp; Location</h2>
          </div>

          <div className="faculty-profile-panel-icon">
            <FontAwesomeIcon icon={faLocationDot} />
          </div>
        </div>

        <div className="faculty-profile-info-grid">
          <div className="faculty-profile-wide-field">
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

      {/* Professional Information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Professional Information</span>

            <h2>Faculty Details</h2>
          </div>

          <div className="faculty-profile-panel-icon">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
        </div>

        <div className="faculty-profile-info-grid">
          <div>
            <span>Faculty ID</span>
            <strong>{displayValue(profile.facultyId)}</strong>
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
            <span>Specialization</span>
            <strong>{displayValue(profile.specialization)}</strong>
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

        <div className="faculty-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Professional information will be populated when the
            corresponding faculty profile data is provided by the
            backend. Unavailable fields are displayed as N/A.
          </span>
        </div>
      </section>

      {/* Account Security */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Account Security</span>

            <h2>Password &amp; Security</h2>
          </div>

          <div className="faculty-profile-panel-icon">
            <FontAwesomeIcon icon={faLock} />
          </div>
        </div>

        <div className="faculty-profile-security">
          <div>
            <strong>Password</strong>

            <p>
              Your password is securely protected and is never
              displayed in the portal.
            </p>
          </div>

          <button
            type="button"
            className="faculty-profile-secondary-button"
            onClick={openPasswordModal}
          >
            Change Password
          </button>
        </div>

        <div className="faculty-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />

          <span>
            Password changes are currently unavailable because the
            confirmed Flask backend does not provide a
            password-change endpoint.
          </span>
        </div>
      </section>

      {/* Account Information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Account Information</span>

            <h2>System Account</h2>
          </div>
        </div>

        <div className="faculty-profile-account-grid">
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
      <section className="faculty-profile-integration-note">
        <div className="faculty-profile-note-icon">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>

        <div>
          <strong>Faculty profile integration</strong>

          <p>
            Name, email, user ID and role are currently loaded from
            the authenticated Flask session through the confirmed{" "}
            <code>/api/auth/me</code> endpoint. Additional faculty
            information will appear automatically when supplied by
            the backend. Until then, unavailable fields are shown as
            N/A.
          </p>
        </div>
      </section>

      {/* Password Modal */}
      {showPasswordModal && (
        <div
          className="faculty-profile-modal-backdrop"
          role="presentation"
          onClick={closePasswordModal}
        >
          <div
            className="faculty-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-password-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="faculty-profile-modal-header">
              <div>
                <span>Account Security</span>

                <h2 id="faculty-password-title">
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
              className="faculty-profile-password-form"
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

              <p className="faculty-profile-password-hint">
                Password changes will become available after the
                backend password service is implemented.
              </p>

              {passwordMessage && (
                <div className="faculty-profile-message">
                  <FontAwesomeIcon icon={faCircleInfo} />

                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="faculty-profile-modal-actions">
                <button
                  type="button"
                  className="faculty-profile-secondary-button"
                  onClick={closePasswordModal}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="faculty-profile-primary-button"
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