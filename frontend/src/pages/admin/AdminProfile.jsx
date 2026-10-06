import { useEffect, useMemo, useState } from "react";

import {
  getAdminProfile,
  updateAdminProfile,
} from "../../services/adminService";

import "./AdminProfile.css";

function getInitials(name) {
  if (!name) {
    return "AD";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      label: "Enter a password",
      level: 0,
    };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  if (score <= 2) {
    return {
      label: "Weak",
      level: 1,
    };
  }

  if (score <= 3) {
    return {
      label: "Moderate",
      level: 2,
    };
  }

  if (score === 4) {
    return {
      label: "Strong",
      level: 3,
    };
  }

  return {
    label: "Very strong",
    level: 4,
  };
}

function AdminProfile() {
  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminProfile();

        if (!mounted) {
          return;
        }

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to load admin profile."
          );
        }

        const data = response.data;

        setProfile(data);
        setName(data?.name || "");
        setEmail(data?.email || "");
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setProfile(null);

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Failed to load admin profile."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const initials = useMemo(
    () => getInitials(profile?.name),
    [profile?.name]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const profileChanged =
    profile &&
    (name.trim() !== (profile.name || "") ||
      email.trim() !== (profile.email || ""));

  const passwordChanged =
    password.length > 0 || confirmPassword.length > 0;

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

 
  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    clearMessages();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    if (!trimmedEmail) {
      setError("Email cannot be empty.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await updateAdminProfile({
        name: trimmedName,
        email: trimmedEmail,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update profile."
        );
      }

      const updatedProfile = response.data;

      setProfile(updatedProfile);
      setName(updatedProfile?.name || "");
      setEmail(updatedProfile?.email || "");

      setSuccess(
        "Profile information updated successfully."
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setPasswordError("");

    if (password.length < 8) {
      setPasswordError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);

      const response = await updateAdminProfile({
        password,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update password."
        );
      }

      setProfile(response.data);

      setPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      setSuccess("Password updated successfully.");
    } catch (requestError) {
      setPasswordError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetProfile = () => {
    if (!profile) {
      return;
    }

    setName(profile.name || "");
    setEmail(profile.email || "");

    clearMessages();
  };

  const handleResetPassword = () => {
    setPassword("");
    setConfirmPassword("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setPasswordError("");
    clearMessages();
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);

    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);

    if (passwordError) {
      setPasswordError("");
    }
  };

  if (loading) {
    return (
      <section className="admin-profile-page">
        <div className="admin-profile-state">
          <div className="admin-profile-state-icon">
            <i
              className="fa-solid fa-spinner fa-spin"
              aria-hidden="true"
            />
          </div>

          <h2>Loading profile</h2>

          <p>
            Fetching your administrator account
            information.
          </p>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="admin-profile-page">
        <div className="admin-profile-state admin-profile-state-error">
          <div className="admin-profile-state-icon">
            <i
              className="fa-solid fa-triangle-exclamation"
              aria-hidden="true"
            />
          </div>

          <h2>Unable to load profile</h2>

          <p>
            {error ||
              "Administrator profile information is unavailable."}
          </p>

          <button
            type="button"
            className="admin-profile-primary-button"
            onClick={() => window.location.reload()}
          >
            <i
              className="fa-solid fa-rotate-right"
              aria-hidden="true"
            />
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-profile-page">
      <header className="admin-profile-header">
        <div className="admin-profile-header-content">
          <span className="admin-profile-eyebrow">
            Account Management
          </span>

          <h1>Admin Profile</h1>

          <p>
            View your administrator account details and
            securely manage your profile information.
          </p>
        </div>

        <div className="admin-profile-account-status">
          <span>Administrator Account</span>

          <strong>
            <span
              className="admin-profile-status-dot"
              aria-hidden="true"
            />
            Account active
          </strong>
        </div>
      </header>

      {(error || success) && (
        <div
          className={`admin-profile-alert ${
            error
              ? "admin-profile-alert-error"
              : "admin-profile-alert-success"
          }`}
          role={error ? "alert" : "status"}
        >
          <div className="admin-profile-alert-icon">
            <i
              className={`fa-solid ${
                error
                  ? "fa-circle-exclamation"
                  : "fa-circle-check"
              }`}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>
              {error ? "Something went wrong" : "Success"}
            </strong>

            <span>{error || success}</span>
          </div>

          <button
            type="button"
            className="admin-profile-alert-close"
            onClick={clearMessages}
            aria-label="Dismiss message"
          >
            <i
              className="fa-solid fa-xmark"
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      <section className="admin-profile-overview">
        <div className="admin-profile-avatar">
          {initials}
        </div>

        <div className="admin-profile-overview-content">
          <span className="admin-profile-overview-label">
            Administrator Account
          </span>

          <h2>{profile.name || "Administrator"}</h2>

          <div className="admin-profile-overview-meta">
            <span>
              <i
                className="fa-solid fa-envelope"
                aria-hidden="true"
              />
              {profile.email || "N/A"}
            </span>

            <span>
              <i
                className="fa-solid fa-id-card"
                aria-hidden="true"
              />
              User ID: {profile.user_id ?? "N/A"}
            </span>

            <span>
              <i
                className="fa-solid fa-shield-halved"
                aria-hidden="true"
              />
              {profile.role || "ADMIN"}
            </span>
          </div>
        </div>

        <span className="admin-profile-overview-status">
          <i
            className="fa-solid fa-circle-check"
            aria-hidden="true"
          />
          Active
        </span>
      </section>

      <div className="admin-profile-layout">
        {/* Profile Information */}
        <section className="admin-profile-card admin-profile-card-wide">
          <div className="admin-profile-card-header">
            <div className="admin-profile-card-title">
              <div className="admin-profile-card-icon">
                <i
                  className="fa-solid fa-user"
                  aria-hidden="true"
                />
              </div>

              <div>
                <span>Personal Information</span>
                <h2>Profile Information</h2>
              </div>
            </div>

            <span className="admin-profile-readonly-badge">
              Read only
            </span>
          </div>

          <div className="admin-profile-info-grid">
            <div className="admin-profile-info-item">
              <span>Name</span>

              <strong>{profile.name || "N/A"}</strong>
            </div>

            <div className="admin-profile-info-item">
              <span>Email</span>

              <strong>{profile.email || "N/A"}</strong>
            </div>

            <div className="admin-profile-info-item">
              <span>User ID</span>

              <strong>
                {profile.user_id ?? "N/A"}
              </strong>
            </div>

            <div className="admin-profile-info-item">
              <span>Role</span>

              <strong>
                {profile.role || "N/A"}
              </strong>
            </div>

            <div className="admin-profile-info-item">
              <span>Created At</span>

              <strong>
                {formatDate(profile.created_at)}
              </strong>
            </div>

            <div className="admin-profile-info-item">
              <span>Updated At</span>

              <strong>
                {formatDate(profile.updated_at)}
              </strong>
            </div>
          </div>
        </section>

        {/* Edit Profile */}
        <section className="admin-profile-card">
          <div className="admin-profile-card-header">
            <div className="admin-profile-card-title">
              <div className="admin-profile-card-icon">
                <i
                  className="fa-solid fa-pen-to-square"
                  aria-hidden="true"
                />
              </div>

              <div>
                <span>Account Details</span>
                <h2>Edit Profile</h2>
              </div>
            </div>
          </div>

          <form
            className="admin-profile-form"
            onSubmit={handleProfileSubmit}
          >
            <div className="admin-profile-form-field">
              <label htmlFor="admin-profile-name">
                Full Name
              </label>

              <div className="admin-profile-input-wrapper">
                <i
                  className="fa-solid fa-user"
                  aria-hidden="true"
                />

                <input
                  id="admin-profile-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="admin-profile-form-field">
              <label htmlFor="admin-profile-email">
                Email Address
              </label>

              <div className="admin-profile-input-wrapper">
                <i
                  className="fa-solid fa-envelope"
                  aria-hidden="true"
                />

                <input
                  id="admin-profile-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="admin-profile-form-actions">
              <button
                type="button"
                className="admin-profile-secondary-button"
                onClick={handleResetProfile}
                disabled={
                  savingProfile || !profileChanged
                }
              >
                <i
                  className="fa-solid fa-rotate-left"
                  aria-hidden="true"
                />
                Reset
              </button>

              <button
                type="submit"
                className="admin-profile-primary-button"
                disabled={
                  savingProfile || !profileChanged
                }
              >
                {savingProfile ? (
                  <>
                    <i
                      className="fa-solid fa-spinner fa-spin"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <i
                      className="fa-solid fa-floppy-disk"
                      aria-hidden="true"
                    />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Change Password */}
        <section className="admin-profile-card">
          <div className="admin-profile-card-header">
            <div className="admin-profile-card-title">
              <div className="admin-profile-card-icon admin-profile-security-icon">
                <i
                  className="fa-solid fa-shield-halved"
                  aria-hidden="true"
                />
              </div>

              <div>
                <span>Account Security</span>
                <h2>Change Password</h2>
              </div>
            </div>
          </div>

          <form
            className="admin-profile-form"
            onSubmit={handlePasswordSubmit}
          >
            <div className="admin-profile-form-field">
              <label htmlFor="admin-profile-password">
                New Password
              </label>

              <div className="admin-profile-input-wrapper">
                <i
                  className="fa-solid fa-lock"
                  aria-hidden="true"
                />

                <input
                  id="admin-profile-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="admin-profile-input-action"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <i
                    className={`fa-solid ${
                      showPassword
                        ? "fa-eye-slash"
                        : "fa-eye"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {password && (
                <div className="admin-profile-password-strength">
                  <div className="admin-profile-strength-header">
                    <span>Password strength</span>

                    <strong
                      className={`strength-${passwordStrength.level}`}
                    >
                      {passwordStrength.label}
                    </strong>
                  </div>

                  <div className="admin-profile-strength-bars">
                    {[1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={
                          bar <= passwordStrength.level
                            ? `strength-active strength-${passwordStrength.level}`
                            : ""
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-profile-form-field">
              <label htmlFor="admin-profile-confirm-password">
                Confirm Password
              </label>

              <div className="admin-profile-input-wrapper">
                <i
                  className="fa-solid fa-lock"
                  aria-hidden="true"
                />

                <input
                  id="admin-profile-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="admin-profile-input-action"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                >
                  <i
                    className={`fa-solid ${
                      showConfirmPassword
                        ? "fa-eye-slash"
                        : "fa-eye"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`admin-profile-password-match ${
                    password === confirmPassword
                      ? "password-match"
                      : "password-mismatch"
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      password === confirmPassword
                        ? "fa-circle-check"
                        : "fa-circle-exclamation"
                    }`}
                    aria-hidden="true"
                  />

                  <span>
                    {password === confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </span>
                </div>
              )}
            </div>

            {/* Password validation error appears only after submit */}
            {passwordError && (
              <div
                className="admin-profile-message admin-profile-message-error"
                role="alert"
              >
                <i
                  className="fa-solid fa-circle-exclamation"
                  aria-hidden="true"
                />

                <span>{passwordError}</span>
              </div>
            )}

            <div className="admin-profile-form-actions">
              <button
                type="button"
                className="admin-profile-secondary-button"
                onClick={handleResetPassword}
                disabled={
                  savingPassword || !passwordChanged
                }
              >
                <i
                  className="fa-solid fa-rotate-left"
                  aria-hidden="true"
                />
                Clear
              </button>

              <button
                type="submit"
                className="admin-profile-primary-button"
                disabled={
                  savingPassword || !passwordChanged
                }
              >
                {savingPassword ? (
                  <>
                    <i
                      className="fa-solid fa-spinner fa-spin"
                      aria-hidden="true"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <i
                      className="fa-solid fa-key"
                      aria-hidden="true"
                    />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="admin-profile-integration-note">
        <div className="admin-profile-note-icon">
          <i
            className="fa-solid fa-circle-check"
            aria-hidden="true"
          />
        </div>

        <div>
          <strong>Admin profile API integrated</strong>

          <p>
            Profile information is loaded and updated through{" "}
            <code>/api/admin/profile</code>. Name, email and
            password updates are supported by the confirmed
            backend API.
          </p>
        </div>

        <span className="admin-profile-integration-status">
          Integrated
        </span>
      </div>
    </section>
  );
}

export default AdminProfile;