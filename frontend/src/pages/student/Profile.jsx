import "./Profile.css";

function Profile() {
  return (
    <section className="student-profile">
      <div className="profile-heading">
        <div>
          <span className="profile-eyebrow">Student Portal</span>
          <h1>My Profile</h1>
          <p>
            View your personal, academic, and account information registered
            in the SAMS-FR system.
          </p>
        </div>

        <div className="profile-status">
          <span className="profile-status-dot" />
          Account active
        </div>
      </div>

      <div className="profile-stats-grid">
        <article>
          <span>Student ID</span>
          <strong>N/A</strong>
          <small>Registered student identifier</small>
        </article>

        <article>
          <span>Department</span>
          <strong>N/A</strong>
          <small>Academic department</small>
        </article>

        <article>
          <span>Semester</span>
          <strong>N/A</strong>
          <small>Current semester</small>
        </article>

        <article>
          <span>Session</span>
          <strong>N/A</strong>
          <small>Academic session</small>
        </article>
      </div>

      <div className="profile-grid">
        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <span className="profile-panel-eyebrow">
                Personal Information
              </span>
              <h2>Student Details</h2>
            </div>

            <span className="profile-panel-badge">Data pending</span>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <span>Student ID</span>
              <strong>N/A</strong>
            </div>

            <div className="profile-field">
              <span>Full Name</span>
              <strong>N/A</strong>
            </div>

            <div className="profile-field">
              <span>Email Address</span>
              <strong>N/A</strong>
            </div>

            <div className="profile-field">
              <span>Phone Number</span>
              <strong>N/A</strong>
            </div>
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <span className="profile-panel-eyebrow">
                Academic Information
              </span>
              <h2>Enrollment Details</h2>
            </div>

            <span className="profile-panel-badge">Data pending</span>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <span>Department</span>
              <strong>N/A</strong>
            </div>

            <div className="profile-field">
              <span>Program</span>
              <strong>N/A</strong>
            </div>

            <div className="profile-field">
              <span>Semester</span>
              <strong>N/A</strong>
            </div>

            <div className="profile-field">
              <span>Academic Session</span>
              <strong>N/A</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="profile-panel profile-account-panel">
        <div className="profile-panel-heading">
          <div>
            <span className="profile-panel-eyebrow">Account</span>
            <h2>Account Information</h2>
          </div>

          <span className="profile-panel-badge">Authenticated</span>
        </div>

        <div className="profile-account-content">
          <div>
            <span>Account Status</span>
            <strong className="account-active">
              <span />
              Active
            </strong>
          </div>

          <div>
            <span>Role</span>
            <strong>Student</strong>
          </div>

          <div>
            <span>Profile Source</span>
            <strong>Backend</strong>
          </div>

          <div>
            <span>Last Updated</span>
            <strong>N/A</strong>
          </div>
        </div>
      </section>

      <div className="profile-development-note">
        <strong>Integration note</strong>
        <span>
          Profile information will be loaded from the authenticated student's
          backend record. No student information is hardcoded in the frontend.
        </span>
      </div>
    </section>
  );
}

export default Profile;
