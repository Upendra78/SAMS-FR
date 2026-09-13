import { NavLink } from "react-router-dom";
import "./StudentLayout.css";

const navigationItems = [
  { label: "Dashboard", path: "/student" },
  { label: "Profile", path: "/student/profile" },
  { label: "Attendance", path: "/student/attendance" },
  { label: "Attendance History", path: "/student/attendance-history" },
];

function StudentLayout({ children }) {
  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <div className="student-brand">
          <div className="student-brand-mark">S</div>

          <div>
            <h1>SAMS-FR</h1>
            <span>Student Portal</span>
          </div>
        </div>

        <div className="student-sidebar-divider" />

        <nav
          className="student-navigation"
          aria-label="Student navigation"
        >
          <p className="student-navigation-label">Navigation</p>

          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/student"}
              className={({ isActive }) =>
                `student-nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="student-sidebar-footer">
          <span>Smart Attendance Management System</span>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div>
            <span className="student-topbar-eyebrow">
              Student Portal
            </span>

            <h2>Academic Dashboard</h2>
          </div>

          <div className="student-user">
            <div className="student-user-avatar">S</div>

            <div>
              <strong>Student</strong>
              <span>Account active</span>
            </div>
          </div>
        </header>

        <main className="student-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;