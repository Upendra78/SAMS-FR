import { useCallback, useEffect, useState } from "react";
import {
  User,
  Mail,
  GraduationCap,
  Building,
  MapPin,
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  RefreshCw,
  Sparkles,
  Award,
  Hash,
  BadgeCheck,
  FileText,
} from "lucide-react";

import {
  getFacultyProfile,
  updateFacultyProfile,
} from "../../services/facultyService";
import "./Profile.css";

function getInitials(name) {
  if (!name || typeof name !== "string") return "FM";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "FM"
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview, personal, security

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    designation: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      const result = await getFacultyProfile();

      if (result?.success && result?.data) {
        setProfile(result.data);
      } else {
        setProfile(null);
        setApiError(result?.message || "Failed to load faculty profile.");
      }
    } catch (err) {
      setProfile(null);
      setApiError(
        err?.response?.data?.message ||
        err?.message ||
        "API integration pending: Faculty Profile API"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const result = await getFacultyProfile();

        if (cancelled) return;

        if (result?.success && result?.data) {
          setProfile(result.data);
          setApiError("");
        } else {
          setProfile(null);
          setApiError(result?.message || "Failed to load faculty profile.");
        }
      } catch (err) {
        if (cancelled) return;
        setProfile(null);
        setApiError(
          err?.response?.data?.message ||
          err?.message ||
          "API integration pending: Faculty Profile API"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Open Edit Profile
  const handleOpenEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || "",
      email: profile.email || "",
      designation: profile.designation || "",
    });
    setEditError("");
    setShowEditModal(true);
  };

  // Submit Profile Changes
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const designation = editForm.designation.trim();

    if (!name || !email || !designation) {
      setEditError("Full name, email, and designation are required.");
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      const result = await updateFacultyProfile({
        name,
        email,
        designation,
      });

      if (result?.success && result?.data) {
        setProfile((prev) => ({
          ...prev,
          name: result.data.name || name,
          email: result.data.email || email,
          designation: result.data.designation || designation,
        }));
        setShowEditModal(false);
        setSuccessToast("Profile updated successfully on the backend!");
        setTimeout(() => setSuccessToast(""), 4000);
      } else {
        throw new Error(result?.message || "Failed to update profile.");
      }
    } catch (err) {
      setEditError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update profile. API integration pending."
      );
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="faculty-profile-container">
        <div className="faculty-profile-loading-box">
          <RefreshCw size={28} className="spin text-blue" />
          <p>Retrieving faculty profile records from backend...</p>
        </div>
      </div>
    );
  }

  if (apiError && !profile) {
    return (
      <div className="faculty-profile-container">
        <div className="faculty-profile-error-box">
          <AlertCircle size={32} className="text-amber" />
          <h2>API integration pending: Faculty Profile API</h2>
          <p>{apiError}</p>
          <button
            type="button"
            className="faculty-btn-primary"
            onClick={loadProfile}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = profile?.name || "Faculty Member";
  const email = profile?.email || "Not provided";
  const designation = profile?.designation || "Not specified";
  const employeeId = profile?.employee_id || "Not assigned";
  const facultyId = profile?.faculty_id ? String(profile.faculty_id) : "Not assigned";
  const userId = profile?.user_id ? String(profile.user_id) : "Not assigned";
  const departmentName =
    typeof profile?.department === "object"
      ? profile?.department?.department_name || "Department"
      : profile?.department || "Department";
  const departmentCode =
    typeof profile?.department === "object"
      ? profile?.department?.department_code || "N/A"
      : "N/A";

  const initials = getInitials(fullName);

  return (
    <div className="faculty-profile-container">
      {/* Success Notification Toast */}
      {successToast && (
        <div className="faculty-profile-toast" role="status">
          <CheckCircle2 size={18} className="toast-icon" />
          <span>{successToast}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setSuccessToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Hero Banner */}
      <section className="faculty-profile-hero">
        <div className="faculty-hero-cover" />

        <div className="faculty-hero-body">
          <div className="faculty-hero-avatar-wrap">
            <div className="faculty-hero-avatar">{initials}</div>
            <span className="faculty-avatar-online" title="Account Active" />
          </div>

          <div className="faculty-hero-info">
            <div className="faculty-hero-title-row">
              <h1 className="faculty-hero-name">{fullName}</h1>
              <span className="faculty-verified-badge" title="Verified Faculty">
                <BadgeCheck size={16} /> Verified Faculty
              </span>
            </div>

            <p className="faculty-hero-sub">
              <span className="hero-designation">{designation}</span>
              <span className="hero-separator">•</span>
              <span className="hero-department">{departmentName}</span>
            </p>

            <div className="faculty-hero-meta-row">
              <span className="faculty-meta-chip">
                <Hash size={13} /> Employee ID: {employeeId}
              </span>
              <span className="faculty-meta-chip">
                <Mail size={13} /> {email}
              </span>
              <span className="faculty-meta-chip">
                <Building size={13} /> Code: {departmentCode}
              </span>
            </div>
          </div>

          <div className="faculty-hero-actions">
            <button
              type="button"
              className="faculty-btn-primary"
              onClick={handleOpenEdit}
            >
              <Edit3 size={15} /> Edit Profile
            </button>

            <button
              type="button"
              className="faculty-btn-secondary"
              onClick={() => setShowPasswordModal(true)}
            >
              <KeyRound size={15} /> Password
            </button>

            <button
              type="button"
              className="faculty-btn-icon"
              onClick={loadProfile}
              title="Refresh Profile"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="faculty-profile-tabs">
          <button
            type="button"
            className={`faculty-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <GraduationCap size={16} /> Academic &amp; Overview
          </button>

          <button
            type="button"
            className={`faculty-tab-btn ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            <User size={16} /> Personal &amp; Contact
          </button>

          <button
            type="button"
            className={`faculty-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Shield size={16} /> Security &amp; System
          </button>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="faculty-profile-grid">
        {/* Left Column: Quick Cards */}
        <div className="faculty-profile-sidebar-col">
          {/* Card: Academic Snapshot */}
          <div className="faculty-card">
            <div className="faculty-card-header">
              <div className="faculty-card-icon-box bg-blue">
                <Award size={18} />
              </div>
              <h3 className="faculty-card-title">Academic Snapshot</h3>
            </div>

            <div className="faculty-card-body faculty-snapshot-list">
              <div className="faculty-snapshot-item">
                <span className="snapshot-label">Designation</span>
                <strong className="snapshot-value">{designation}</strong>
              </div>

              <div className="faculty-snapshot-item">
                <span className="snapshot-label">Department</span>
                <strong className="snapshot-value">{departmentName}</strong>
              </div>

              <div className="faculty-snapshot-item">
                <span className="snapshot-label">Department Code</span>
                <strong className="snapshot-value badge-pill">{departmentCode}</strong>
              </div>

              <div className="faculty-snapshot-item">
                <span className="snapshot-label">Employee ID</span>
                <strong className="snapshot-value">{employeeId}</strong>
              </div>

              <div className="faculty-snapshot-item">
                <span className="snapshot-label">Employment Status</span>
                <span className="pending-badge">API integration pending</span>
              </div>

              <div className="faculty-snapshot-item">
                <span className="snapshot-label">Date of Joining</span>
                <span className="pending-badge">API integration pending</span>
              </div>
            </div>
          </div>

          {/* Card: Biometrics & Face Recognition */}
          <div className="faculty-card">
            <div className="faculty-card-header">
              <div className="faculty-card-icon-box bg-emerald">
                <Sparkles size={18} />
              </div>
              <h3 className="faculty-card-title">Biometrics &amp; SAMS-FR</h3>
            </div>

            <div className="faculty-card-body">
              <div className="faculty-bio-status-box">
                <div className="faculty-bio-indicator">
                  <span className="pulse-green-dot" />
                  <strong>Face Recognition Enrolled</strong>
                </div>
                <p className="faculty-bio-text">
                  Facial embeddings are active for automated classroom recognition and attendance session validation.
                </p>
              </div>

              <div className="faculty-bio-details">
                <div className="bio-detail-row">
                  <span>Recognition Status</span>
                  <span className="bio-badge-active">Active</span>
                </div>
                <div className="bio-detail-row">
                  <span>Portal Role</span>
                  <strong>FACULTY</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tabs Content */}
        <div className="faculty-profile-main-col">
          {activeTab === "overview" && (
            <div className="faculty-tab-content-pane">
              {/* Card 1: Professional Qualifications */}
              <div className="faculty-card">
                <div className="faculty-card-header">
                  <div className="faculty-card-icon-box bg-purple">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="faculty-card-title">Professional Qualifications &amp; Expertise</h3>
                    <p className="faculty-card-sub">Teaching credentials, academic background, and specialization.</p>
                  </div>
                </div>

                <div className="faculty-details-grid">
                  <div className="faculty-field-item">
                    <span className="field-label">Primary Department</span>
                    <strong className="field-value">{departmentName}</strong>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Designation</span>
                    <strong className="field-value">{designation}</strong>
                  </div>

                  <div className="faculty-field-item span-2">
                    <span className="field-label">Academic Qualification</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item span-2">
                    <span className="field-label">Specialization &amp; Research</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Office / Cabin</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>
                </div>
              </div>

              {/* Card 2: System Identifiers */}
              <div className="faculty-card">
                <div className="faculty-card-header">
                  <div className="faculty-card-icon-box bg-blue">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="faculty-card-title">Institutional Identifiers</h3>
                    <p className="faculty-card-sub">Employee and system identification records from the database.</p>
                  </div>
                </div>

                <div className="faculty-details-grid">
                  <div className="faculty-field-item">
                    <span className="field-label">Employee ID</span>
                    <strong className="field-value code-font">{employeeId}</strong>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Faculty Record ID</span>
                    <strong className="field-value code-font">{facultyId}</strong>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">System User ID</span>
                    <strong className="field-value code-font">{userId}</strong>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Account Status</span>
                    <strong className="field-value text-emerald">Active</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "personal" && (
            <div className="faculty-tab-content-pane">
              {/* Card 1: Personal Details */}
              <div className="faculty-card">
                <div className="faculty-card-header">
                  <div className="faculty-card-icon-box bg-blue">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="faculty-card-title">Personal Details</h3>
                    <p className="faculty-card-sub">Basic personal identity records on file.</p>
                  </div>
                </div>

                <div className="faculty-details-grid">
                  <div className="faculty-field-item">
                    <span className="field-label">Full Name</span>
                    <strong className="field-value">{fullName}</strong>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Official Email</span>
                    <strong className="field-value">{email}</strong>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Phone Number</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Gender</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Date of Birth</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Campus & Location Details */}
              <div className="faculty-card">
                <div className="faculty-card-header">
                  <div className="faculty-card-icon-box bg-purple">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="faculty-card-title">Campus &amp; Address</h3>
                    <p className="faculty-card-sub">Campus location and contact coordinates.</p>
                  </div>
                </div>

                <div className="faculty-details-grid">
                  <div className="faculty-field-item span-2">
                    <span className="field-label">Campus Address</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">City</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">State / Region</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">PIN Code</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>

                  <div className="faculty-field-item">
                    <span className="field-label">Country</span>
                    <span className="pending-badge">API integration pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="faculty-tab-content-pane">
              {/* Card: Account Security */}
              <div className="faculty-card">
                <div className="faculty-card-header">
                  <div className="faculty-card-icon-box bg-emerald">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="faculty-card-title">Account Security &amp; Credentials</h3>
                    <p className="faculty-card-sub">Manage password and security verification settings.</p>
                  </div>
                </div>

                <div className="faculty-security-content">
                  <div className="faculty-security-row">
                    <div className="faculty-security-info">
                      <div className="security-title-row">
                        <Lock size={16} className="text-blue" />
                        <strong>Account Password</strong>
                      </div>
                      <p>
                        Password is encrypted and stored via secure backend hash.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="faculty-btn-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <KeyRound size={14} /> Password Options
                    </button>
                  </div>

                  <div className="faculty-security-row">
                    <div className="faculty-security-info">
                      <div className="security-title-row">
                        <CheckCircle2 size={16} className="text-emerald" />
                        <strong>Authentication Method</strong>
                      </div>
                      <p>
                        Email/Password authentication with JWT cookie + Face Recognition verification during active attendance.
                      </p>
                    </div>

                    <span className="security-badge-active">Enabled</span>
                  </div>

                  <div className="faculty-security-notice">
                    <AlertCircle size={15} />
                    <span>
                      API Integration Note: Only Full Name, Email, and Designation can be updated through the backend <code>PATCH /api/faculty/profile</code> API.
                      Self-service password changes are pending backend integration and must be updated via the IT administrator.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {showEditModal && (
        <div
          className="faculty-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !editLoading) {
              setShowEditModal(false);
            }
          }}
        >
          <div className="faculty-edit-modal-card" role="dialog" aria-modal="true">
            <div className="faculty-edit-modal-header">
              <div>
                <span className="modal-eyebrow">Profile Management</span>
                <h3 className="modal-title">Edit Faculty Profile</h3>
                <p className="modal-sub">Update your official name, email, and designation in the backend database.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-fields-stack">
                <div className="modal-field-group">
                  <label htmlFor="edit-name-input">Full Name</label>
                  <input
                    id="edit-name-input"
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    disabled={editLoading}
                    required
                  />
                </div>

                <div className="modal-field-group">
                  <label htmlFor="edit-email-input">Official Email Address</label>
                  <input
                    id="edit-email-input"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter your official email"
                    disabled={editLoading}
                    required
                  />
                </div>

                <div className="modal-field-group">
                  <label htmlFor="edit-designation-input">Academic Designation</label>
                  <input
                    id="edit-designation-input"
                    type="text"
                    value={editForm.designation}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, designation: e.target.value }))
                    }
                    placeholder="e.g. Assistant Professor, Associate Professor"
                    disabled={editLoading}
                    required
                  />
                </div>
              </div>

              {editError && (
                <div className="modal-error-box">
                  <AlertCircle size={15} />
                  <span>{editError}</span>
                </div>
              )}

              <p className="modal-note-text">
                Submitting updates your faculty record in the backend via <code>PATCH /api/faculty/profile</code>.
              </p>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="faculty-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="faculty-btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Options Modal Dialog */}
      {showPasswordModal && (
        <div
          className="faculty-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false);
            }
          }}
        >
          <div className="faculty-edit-modal-card" role="dialog" aria-modal="true">
            <div className="faculty-edit-modal-header">
              <div>
                <span className="modal-eyebrow">Account Security</span>
                <h3 className="modal-title">Password Options</h3>
                <p className="modal-sub">Faculty authentication &amp; credential management.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="faculty-password-modal-body">
              <div className="modal-api-pending-box">
                <AlertCircle size={16} className="text-amber" />
                <div>
                  <strong>API Integration Pending: Self-Service Password Reset</strong>
                  <p>
                    The self-service faculty password reset API endpoint is pending backend implementation.
                    Faculty passwords can currently be updated through the IT Administrator portal or by contacting university helpdesk.
                  </p>
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="faculty-btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
