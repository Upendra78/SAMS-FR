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
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import {
  getFacultyProfile,
  updateFacultyProfile,
} from "../../services/facultyService";
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

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    designation: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [passwordMessage, setPasswordMessage] = useState("");

  const applyFacultyProfile = (faculty) => {
    return {
      userId: faculty.user_id ?? "",
      facultyId: faculty.faculty_id ?? "",
      fullName: faculty.name ?? "",
      email: faculty.email ?? "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      fatherName: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      department: faculty.department?.department_name ?? "",
      designation: faculty.designation ?? "",
      qualification: "",
      specialization: "",
      joiningDate: "",
      employmentStatus: "",
      role: "FACULTY",
      accountStatus: "",
    };
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getFacultyProfile();

        if (!result?.success || !result?.data) {
          throw new Error(
            result?.message || "Unable to load your faculty profile.",
          );
        }

        const faculty = result.data;

        if (!isMounted) {
          return;
        }

        setProfile(applyFacultyProfile(faculty));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProfile(EMPTY_PROFILE);

        setErrorMessage(
          error?.message || "Unable to load your faculty profile.",
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

  const openEditMode = () => {
    setEditForm({
      name: profile.fullName,
      email: profile.email,
      designation: profile.designation,
    });

    setEditMessage("");
    setEditError("");
    setIsEditing(true);
  };

  const closeEditMode = () => {
    if (editLoading) {
      return;
    }

    setIsEditing(false);

    setEditForm({
      name: "",
      email: "",
      designation: "",
    });

    setEditMessage("");
    setEditError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setEditMessage("");
    setEditError("");
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const designation = editForm.designation.trim();

    if (!name || !email || !designation) {
      setEditError(
        "Name, email and designation are required.",
      );
      return;
    }

    setEditLoading(true);
    setEditMessage("");
    setEditError("");

    try {
      const result = await updateFacultyProfile({
        name,
        email,
        designation,
      });

      if (!result?.success || !result?.data) {
        throw new Error(
          result?.message || "Unable to update your faculty profile.",
        );
      }

      const updatedProfile = applyFacultyProfile(result.data);

      setProfile(updatedProfile);

      setEditForm({
        name: updatedProfile.fullName,
        email: updatedProfile.email,
        designation: updatedProfile.designation,
      });

      setEditMessage("Faculty profile updated successfully.");

      setIsEditing(false);
    } catch (error) {
      setEditError(
        error?.message || "Unable to update your faculty profile.",
      );
    } finally {
      setEditLoading(false);
    }
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

      {/* Edit Profile */}
      {isEditing && (
        <section className="faculty-profile-panel">
          <div className="faculty-profile-panel-header">
            <div>
              <span>Profile Management</span>

              <h2>Edit Faculty Profile</h2>
            </div>

            <div className="faculty-profile-panel-icon">
              <FontAwesomeIcon icon={faPenToSquare} />
            </div>
          </div>

          <form onSubmit={handleEditSubmit}>
            <div className="faculty-profile-info-grid">
              <label>
                <span>Full Name</span>

                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  required
                />
              </label>

              <label>
                <span>Email</span>

                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  required
                />
              </label>

              <label>
                <span>Designation</span>

                <input
                  type="text"
                  name="designation"
                  value={editForm.designation}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  required
                />
              </label>
            </div>

            {editError && (
              <div className="faculty-profile-message">
                <FontAwesomeIcon icon={faCircleInfo} />

                <span>{editError}</span>
              </div>
            )}

            {editMessage && (
              <div className="faculty-profile-message">
                <FontAwesomeIcon icon={faCircleCheck} />

                <span>{editMessage}</span>
              </div>
            )}

            <div className="faculty-profile-modal-actions">
              <button
                type="button"
                className="faculty-profile-secondary-button"
                onClick={closeEditMode}
                disabled={editLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="faculty-profile-primary-button"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="faculty-profile-readonly-note">
            <FontAwesomeIcon icon={faCircleInfo} />

            <span>
              Only name, email and designation are currently supported
              by the confirmed faculty profile update API.
            </span>
          </div>
        </section>
      )}

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

        <button
          type="button"
          className="faculty-profile-secondary-button"
          onClick={openEditMode}
          disabled={isEditing}
        >
          <FontAwesomeIcon icon={faPenToSquare} />
          Edit Profile
        </button>
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
            Name, email, faculty ID, designation and department are
            currently loaded from the confirmed{" "}
            <code>/api/faculty/profile</code> endpoint. Name, email
            and designation can be updated through the confirmed{" "}
            <code>PATCH /api/faculty/profile</code> endpoint. Fields
            that are not provided by the faculty profile API are
            shown as N/A.
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