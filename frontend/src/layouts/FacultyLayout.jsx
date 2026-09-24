import { NavLink, Outlet } from "react-router-dom";
import "./FacultyLayout.css";


const navigationItems = [
  {
    label: "Dashboard",
    path: "/faculty",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />
      </svg>
    ),
  },
  {
    label: "Classes",
    path: "/faculty/classes",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm0 0V19a2.5 2.5 0 0 1 2.5-2.5H20" />
      </svg>
    ),
  },
  {
    label: "Students",
    path: "/faculty/students",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.4-3.1 2.3-5 5.5-5s5.1 1.9 5.5 5" />
        <path d="M15 6.5a3 3 0 0 1 0 5.8M16.5 14c2.2.5 3.5 2.1 4 5" />
      </svg>
    ),
  },
  {
    label: "Attendance",
    path: "/faculty/attendance",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="m8 12 2.2 2.2L16 8.5M8 7.5h.01M8 17h.01" />
      </svg>
    ),
  },
  {
    label: "Reports",
    path: "/faculty/reports",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20V10M12 20V4M19 20v-7" />
        <path d="M3 20.5h18" />
      </svg>
    ),
  },
];

const systemItems = [
  {
    label: "Profile",
    path: "/faculty/profile",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" />
      </svg>
    ),
  },
  {
    label: "Settings",
    path: "/faculty/settings",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H4a1.8 1.8 0 0 1 0-3h.2a1.8 1.8 0 0 0 .9-3L5 5.9a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9V2.4a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3h-.2a1.8 1.8 0 0 0-1.2 3Z" />
      </svg>
    ),
  },
];

function FacultyNavigationItem({ item }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/faculty"}
      className={({ isActive }) =>
        `faculty-nav-link ${isActive ? "active" : ""}`
      }
    >
      <span className="faculty-nav-icon">{item.icon}</span>

      <span className="faculty-nav-text">{item.label}</span>

      <span className="faculty-nav-active-indicator" />
    </NavLink>
  );
}

function FacultyLayout() {
  return (
    <div className="faculty-layout">
      <aside className="faculty-sidebar">
        {/* Brand */}
        <div className="faculty-brand">
          <div className="faculty-brand-mark">S</div>

          <div className="faculty-brand-copy">
            <h1>SAMS-FR</h1>
            <span>Faculty Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="faculty-navigation"
          aria-label="Faculty navigation"
        >
          <div className="faculty-navigation-section">
            <span className="faculty-navigation-label">
              Management
            </span>

            <div className="faculty-navigation-list">
              {navigationItems.map((item) => (
                <FacultyNavigationItem
                  key={item.path}
                  item={item}
                />
              ))}
            </div>
          </div>

          <div className="faculty-navigation-section faculty-system-section">
            <span className="faculty-navigation-label">
              System
            </span>

            <div className="faculty-navigation-list">
              {systemItems.map((item) => (
                <FacultyNavigationItem
                  key={item.path}
                  item={item}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="faculty-sidebar-footer">
          <div className="faculty-footer-divider" />

          <div className="faculty-security">
            <span className="faculty-security-dot" />

            <div>
              <strong>Secure Workspace</strong>
              <span>Attendance Management</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="faculty-main">
        {/* Topbar */}
        <header className="faculty-topbar">
          <div className="faculty-topbar-left">
            <span className="faculty-topbar-eyebrow">
              Faculty Workspace
            </span>

            <h2>SAMS-FR</h2>
          </div>

          <div className="faculty-topbar-right">
            <div className="faculty-user">
              <div className="faculty-user-avatar">F</div>

              <div className="faculty-user-info">
                <strong>Faculty Member</strong>
                <span>Faculty</span>
              </div>

              <span
                className="faculty-user-chevron"
                aria-hidden="true"
              >
                ›
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="faculty-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default FacultyLayout;