
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faCircleCheck,
  faCircleInfo,
  faEnvelope,
  faGraduationCap,
  faLock,
  faLocationDot,
  faPenToSquare,
  faRotateRight,
  faUser,
  faXmark,
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

const EMPTY_EDIT_FORM = {
  name: "",
  email: "",
  designation: "",
};

const EMPTY_PASSWORD_FORM = {
  current: "",
  newPassword: "",
  confirm: "",
};

const displayValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "N/A";
  }

  return String(value);
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") {
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

const applyFacultyProfile = (faculty) => ({
  ...EMPTY_PROFILE,
  userId: faculty?.user_id ?? "",
  facultyId: faculty?.faculty_id ?? "",
  fullName: faculty?.name ?? "",
  email: faculty?.email ?? "",
  department:
    typeof faculty?.department === "object"
      ? faculty.department?.department_name ?? ""
      : faculty?.department ?? "",
  designation: faculty?.designation ?? "",
  role: faculty?.role ?? "FACULTY",
});

function Profile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORD_FORM);

  const editNameRef = useRef(null);
  const passwordCloseRef = useRef(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await getFacultyProfile();

      if (!result?.success || !result?.data) {
        throw new Error(
          result?.message || "Unable to load your faculty profile.",
        );
      }

      setProfile(applyFacultyProfile(result.data));
    } catch (error) {
      setErrorMessage(
        error?.message || "Unable to load your faculty profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getFacultyProfile();

        if (!active) return;

        if (!result?.success || !result?.data) {
          throw new Error(
            result?.message || "Unable to load your faculty profile.",
          );
        }

        setProfile(applyFacultyProfile(result.data));
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error?.message || "Unable to load your faculty profile.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isEditing) {
      editNameRef.current?.focus();
    }
  }, [isEditing]);

  const closePasswordModal = useCallback(() => {
    setShowPasswordModal(false);
    setPasswords(EMPTY_PASSWORD_FORM);
  }, []);

  useEffect(() => {
    if (!showPasswordModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closePasswordModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    passwordCloseRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPasswordModal, closePasswordModal]);

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
    if (editLoading) return;

    setIsEditing(false);
    setEditForm(EMPTY_EDIT_FORM);
    setEditError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
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
      setEditError("Name, email and designation are required.");
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
      setEditMessage("Your faculty profile was updated successfully.");
      setIsEditing(false);
    } catch (error) {
      setEditError(
        error?.message || "Unable to update your faculty profile.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const openPasswordModal = () => {
    setPasswords(EMPTY_PASSWORD_FORM);
    setShowPasswordModal(true);
  };


  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const renderPageHeader = () => (
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
    </div>
  );

  if (loading) {
    return (
      <section
        className="faculty-profile-page"
        aria-busy="true"
        aria-live="polite"
      >
        {renderPageHeader()}

        <section className="faculty-profile-integration-notice">
          <div className="faculty-profile-notice-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <div>
            <strong>Loading your profile</strong>
            <p>
              Retrieving your faculty account information from the
              backend.
            </p>
          </div>
        </section>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="faculty-profile-page">
        {renderPageHeader()}

        <section
          className="faculty-profile-integration-notice"
          role="alert"
        >
          <div className="faculty-profile-notice-icon">
            <FontAwesomeIcon icon={faCircleInfo} />
          </div>

          <div>
            <strong>Unable to load your profile</strong>
            <p>{errorMessage}</p>

            <button
              type="button"
              className="faculty-profile-primary-button"
              onClick={loadProfile}
              style={{ marginTop: 14 }}
            >
              <FontAwesomeIcon icon={faRotateRight} />
              Retry
            </button>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="faculty-profile-page">
      {renderPageHeader()}

      {editMessage && (
        <div
          className="faculty-profile-message"
          role="status"
          aria-live="polite"
        >
          <FontAwesomeIcon icon={faCircleCheck} />
          <span>{editMessage}</span>
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <section className="faculty-profile-panel">
          <div className="faculty-profile-panel-header">
            <div>
              <span>Profile management</span>
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
                  ref={editNameRef}
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  autoComplete="name"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                <span>Email Address</span>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  autoComplete="email"
                  maxLength={254}
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
                  maxLength={120}
                  required
                />
              </label>
            </div>

            {editError && (
              <div
                className="faculty-profile-message"
                role="alert"
              >
                <FontAwesomeIcon icon={faCircleInfo} />
                <span>{editError}</span>
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
                {editLoading ? "Saving changes..." : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="faculty-profile-readonly-note">
            <FontAwesomeIcon icon={faCircleInfo} />
            <span>
              Only name, email and designation are submitted to the
              existing profile update API.
            </span>
          </div>
        </section>
      )}

      {/* Profile overview */}
      <section className="faculty-profile-overview">
        <div className="faculty-profile-avatar" aria-hidden="true">
          {initials}
        </div>

        <div className="faculty-profile-overview-content">
          <span className="faculty-profile-overview-label">
            Faculty account
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

      {/* Personal information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Personal information</span>
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
            <span>Email Address</span>
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
            Personal information is read-only in this portal. Fields
            not returned by the backend are displayed as N/A.
          </span>
        </div>
      </section>

      {/* Contact information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Contact information</span>
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

      {/* Professional information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Professional information</span>
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
            Professional details depend on the fields returned by the
            faculty profile API. Missing fields are not inferred.
          </span>
        </div>
      </section>

      {/* Account security */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Account security</span>
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
              Your password is never displayed on this page. Password
              changes require a supported backend operation.
            </p>
          </div>

          <button
            type="button"
            className="faculty-profile-secondary-button"
            onClick={openPasswordModal}
          >
            <FontAwesomeIcon icon={faLock} />
            Password Options
          </button>
        </div>

        <div className="faculty-profile-readonly-note">
          <FontAwesomeIcon icon={faCircleInfo} />
          <span>
            Password changes are not enabled because the current
            integration does not provide a confirmed password-change
            endpoint.
          </span>
        </div>
      </section>

      {/* Account information */}
      <section className="faculty-profile-panel">
        <div className="faculty-profile-panel-header">
          <div>
            <span>Account information</span>
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

      {/* API integration details */}
      <section className="faculty-profile-integration-note">
        <div className="faculty-profile-note-icon">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>

        <div>
          <strong>Faculty profile integration</strong>
          <p>
            Profile details are loaded through the existing{" "}
            <code>/api/faculty/profile</code> integration. Profile
            edits submit name, email and designation through the
            existing update service. Other displayed fields remain
            unavailable unless the backend returns them.
          </p>
        </div>
      </section>

      {/* Password information modal */}
      {showPasswordModal && (
        <div
          className="faculty-profile-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <section
            className="faculty-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-password-title"
            aria-describedby="faculty-password-description"
          >
            <div className="faculty-profile-modal-header">
              <div>
                <span>Account security</span>
                <h2 id="faculty-password-title">
                  Password Options
                </h2>
              </div>

              <button
                ref={passwordCloseRef}
                type="button"
                aria-label="Close password dialog"
                onClick={closePasswordModal}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="faculty-profile-password-form">
              <p
                id="faculty-password-description"
                className="faculty-profile-password-hint"
              >
                Password changes are not currently available through
                the connected backend. These fields are disabled and
                no password change will be submitted.
              </p>

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

              <div className="faculty-profile-modal-actions">
                <button
                  type="button"
                  className="faculty-profile-secondary-button"
                  onClick={closePasswordModal}
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default Profile;
