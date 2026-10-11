
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "./FacultyLayout.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/faculty",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Classes",
    path: "/faculty/classes",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h6" />
      </svg>
    ),
  },
  {
    label: "Students",
    path: "/faculty/students",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.4-3.4 2.3-5 5.5-5s5.1 1.6 5.5 5" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8M17 15c2.1.6 3.3 2.2 3.5 5" />
      </svg>
    ),
  },
  {
    label: "Attendance",
    path: "/faculty/attendance",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4 8.5h16M8 13l2.2 2.2L16 10" />
      </svg>
    ),
  },
  {
    label: "Reports",
    path: "/faculty/reports",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V11M10 20V5M16 20v-7M22 20H2" />
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
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H6a1.8 1.8 0 0 1 0-3h.2a1.8 1.8 0 0 0 .9-3L7 5.9a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3h-.2a1.8 1.8 0 0 0-1.2 1Z" />
      </svg>
    ),
  },
];

function getDisplayName(user) {
  if (!user || typeof user !== "object") return "Faculty Member";

  const fullName =
    user.full_name ||
    user.fullName ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    [user.firstName, user.lastName].filter(Boolean).join(" ");

  return typeof fullName === "string" && fullName.trim()
    ? fullName.trim()
    : "Faculty Member";
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "F";
}

function FacultyNavigationItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/faculty"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `faculty-nav-link${isActive ? " active" : ""}`
      }
    >
      <span className="faculty-nav-icon">{item.icon}</span>
      <span className="faculty-nav-text">{item.label}</span>
      <span className="faculty-nav-active-indicator" aria-hidden="true" />
    </NavLink>
  );
}

function FacultyLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const user = auth?.user;
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const currentItem = [...navigationItems, ...systemItems]
    .filter(
      (item) =>
        item.path === "/faculty"
          ? location.pathname === "/faculty" ||
            location.pathname === "/faculty/dashboard"
          : location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await auth.logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Faculty logout failed:", error);
      setLoggingOut(false);
    }
  }

  function closeMobileNavigation() {
    setMobileNavigationOpen(false);
  }

  return (
    <div className="faculty-layout">
      {mobileNavigationOpen && (
        <button
          type="button"
          className="faculty-mobile-backdrop"
          aria-label="Close navigation"
          onClick={closeMobileNavigation}
        />
      )}

      <aside
        className={`faculty-sidebar${mobileNavigationOpen ? " faculty-sidebar-open" : ""}`}
        aria-label="Faculty sidebar"
      >
        <NavLink
          to="/faculty"
          className="faculty-brand"
          aria-label="SAMS-FR Faculty Dashboard"
          onClick={closeMobileNavigation}
        >
          <span className="faculty-brand-mark" aria-hidden="true">
            S
          </span>

          <span className="faculty-brand-copy">
            <strong>SAMS-FR</strong>
            <span>Faculty Portal</span>
          </span>
        </NavLink>

        <nav className="faculty-navigation" aria-label="Faculty navigation">
          <section className="faculty-navigation-section">
            <h2 className="faculty-navigation-label">Workspace</h2>

            <div className="faculty-navigation-list">
              {navigationItems.map((item) => (
                <FacultyNavigationItem
                  key={item.path}
                  item={item}
                  onNavigate={closeMobileNavigation}
                />
              ))}
            </div>
          </section>

          <section className="faculty-navigation-section faculty-system-section">
            <h2 className="faculty-navigation-label">Account</h2>

            <div className="faculty-navigation-list">
              {systemItems.map((item) => (
                <FacultyNavigationItem
                  key={item.path}
                  item={item}
                  onNavigate={closeMobileNavigation}
                />
              ))}
            </div>
          </section>
        </nav>

        <div className="faculty-sidebar-support">
          <span className="faculty-support-mark" aria-hidden="true">
            ?
          </span>
          <div>
            <strong>Need assistance?</strong>
            <span>Contact your administrator.</span>
          </div>
        </div>

        <div className="faculty-sidebar-footer">
          <button
            type="button"
            className="faculty-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H3" />
              <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
            </svg>
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      <div className="faculty-main">
        <header className="faculty-topbar">
          <div className="faculty-topbar-heading">
            <button
              type="button"
              className="faculty-mobile-menu-button"
              aria-label={mobileNavigationOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavigationOpen}
              onClick={() => setMobileNavigationOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {mobileNavigationOpen ? (
                  <path d="m6 6 12 12M18 6 6 18" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div className="faculty-topbar-left">
              <span className="faculty-topbar-eyebrow">
                Faculty Workspace
              </span>
              <h1>{currentItem?.label || "Faculty Portal"}</h1>
            </div>
          </div>

          <div className="faculty-topbar-right">
            <div className="faculty-topbar-divider" aria-hidden="true" />

            <NavLink
              to="/faculty/profile"
              className="faculty-user"
              aria-label={`View profile for ${displayName}`}
            >
              <span className="faculty-user-avatar" aria-hidden="true">
                {initials}
              </span>

              <span className="faculty-user-info">
                <strong>{displayName}</strong>
                <span>Faculty</span>
              </span>

              <span className="faculty-user-chevron" aria-hidden="true">
                ›
              </span>
            </NavLink>
          </div>
        </header>

        <main className="faculty-content" id="faculty-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default FacultyLayout;
