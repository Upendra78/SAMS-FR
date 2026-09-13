import { NavLink } from "react-router-dom";
import "./FacultyLayout.css";

const navigationItems = [
  { label: "Dashboard", path: "/faculty" },
  { label: "Classes", path: "/faculty/classes" },
  { label: "Students", path: "/faculty/students" },
  { label: "Attendance", path: "/faculty/attendance" },
  { label: "Reports", path: "/faculty/reports" },
];

function FacultyLayout({ children }) {
  return (
    <div className="faculty-layout">
      <aside className="faculty-sidebar">
        <div className="faculty-brand">
          <div className="faculty-brand-mark">S</div>

          <div>
            <h1>SAMS-FR</h1>
            <span>Faculty Portal</span>
          </div>
        </div>

        <div className="faculty-sidebar-divider" />

        <nav
          className="faculty-navigation"
          aria-label="Faculty navigation"
        >
          <span className="faculty-navigation-label">Management</span>

          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/faculty"}
              className={({ isActive }) =>
                `faculty-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="faculty-sidebar-footer">
          Secure Attendance Management
        </div>
      </aside>

      <div className="faculty-main">
        <header className="faculty-topbar">
          <div>
            <span className="faculty-topbar-eyebrow">
              Faculty Workspace
            </span>
            <h2>SAMS-FR</h2>
          </div>

          <div className="faculty-user">
            <div className="faculty-user-avatar">F</div>

            <div>
              <strong>Faculty Member</strong>
              <span>Faculty</span>
            </div>
          </div>
        </header>

        <main className="faculty-content">{children}</main>
      </div>
    </div>
  );
}

export default FacultyLayout;