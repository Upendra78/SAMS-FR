import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faClipboardCheck,
  faBookOpen,
  faCalendarDays,
  faFileLines,
  faUser,
  faGear,
  faRightFromBracket,
  faBars,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import "./StudentLayout.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/student",
    icon: faChartLine,
    end: true,
  },
  {
    label: "Attendance",
    path: "/student/attendance",
    icon: faClipboardCheck,
  },
  {
    label: "My Courses",
    path: "/student/courses",
    icon: faBookOpen,
  },
  {
    label: "Schedule",
    path: "/student/schedule",
    icon: faCalendarDays,
  },
  {
    label: "Reports",
    path: "/student/reports",
    icon: faFileLines,
  },
];

const systemItems = [
  {
    label: "Profile",
    path: "/student/profile",
    icon: faUser,
  },
  {
    label: "Settings",
    path: "/student/settings",
    icon: faGear,
  },
];

function StudentLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    // Authentication/logout integration will be connected
    // when the backend authentication contract is finalized.
    navigate("/login");
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div className="student-layout">
      {mobileOpen && (
        <button
          type="button"
          className="student-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`student-sidebar ${
          mobileOpen ? "student-sidebar-open" : ""
        }`}
      >
        <div className="student-brand">
          <div className="student-brand-icon">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>

          <div className="student-brand-text">
            <span className="student-brand-name">SAMS-FR</span>
            <span className="student-brand-role">Student Portal</span>
          </div>
        </div>

        <nav className="student-navigation">
          <div className="student-navigation-section">
            <span className="student-navigation-title">MAIN</span>

            <div className="student-navigation-list">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `student-nav-link ${
                      isActive ? "student-nav-link-active" : ""
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="student-navigation-section student-system-section">
            <span className="student-navigation-title">SYSTEM</span>

            <div className="student-navigation-list">
              {systemItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `student-nav-link ${
                      isActive ? "student-nav-link-active" : ""
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="student-sidebar-footer">
          <button
            type="button"
            className="student-logout-button"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div className="student-topbar-left">
            <button
              type="button"
              className="student-mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div className="student-page-context">
              <span className="student-context-label">
                STUDENT PORTAL
              </span>
              <span className="student-context-title">
                Academic Dashboard
              </span>
            </div>
          </div>

          <button
            type="button"
            className="student-profile-summary"
            onClick={() => navigate("/student/profile")}
          >
            <span className="student-avatar">ST</span>

            <span className="student-profile-text">
              <strong>Student</strong>
              <small>Student Account</small>
            </span>
          </button>
        </header>

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;