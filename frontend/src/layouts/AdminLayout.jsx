import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBuilding,
  faChartColumn,
  faChartLine,
  faChalkboardUser,
  faGear,
  faRightFromBracket,
  faSchool,
  faUser,
  faUsers,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";

import "./AdminLayout.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: faChartLine,
  },
  {
    label: "Students",
    path: "/admin/students",
    icon: faUsers,
  },
  {
    label: "Faculty",
    path: "/admin/faculty",
    icon: faChalkboardUser,
  },
  {
    label: "Admin Management",
    path: "/admin/management",
    icon: faUserShield,
  },
  {
    label: "Departments",
    path: "/admin/departments",
    icon: faBuilding,
  },
  {
    label: "Academic Management",
    path: "/admin/academic-management",
    icon: faBookOpen,
  },
  {
    label: "Attendance Reports",
    path: "/admin/attendance-reports",
    icon: faChartColumn,
  },
];

const systemItems = [
  {
    label: "Profile",
    path: "/admin/profile",
    icon: faUser,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: faGear,
  },
];

function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="admin-sidebar-top">
          <div className="admin-brand">
            <div className="admin-brand-mark">
              <FontAwesomeIcon icon={faSchool} />
            </div>

            <div className="admin-brand-content">
              <strong>SAMS-FR</strong>
              <span>Admin Portal</span>
            </div>
          </div>

          <div className="admin-sidebar-divider" />
        </div>

        {/* Navigation */}
        <nav className="admin-navigation" aria-label="Admin navigation">
          <p className="admin-nav-title">Management</p>

          <div className="admin-nav-list">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>

                <span className="admin-nav-label">{item.label}</span>

                <span className="admin-nav-arrow">
                  <FontAwesomeIcon icon={faChartLine} />
                </span>
              </NavLink>
            ))}
          </div>

          <p className="admin-nav-title admin-nav-title-system">
            System
          </p>

          <div className="admin-nav-list">
            {systemItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>

                <span className="admin-nav-label">{item.label}</span>
              </NavLink>
            ))}

            {/* Logout */}
            <button
              type="button"
              className="admin-nav-link admin-logout-button"
              onClick={handleLogout}
            >
              <span className="admin-nav-icon admin-logout-icon">
                <FontAwesomeIcon icon={faRightFromBracket} />
              </span>

              <span className="admin-nav-label">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-header-brand">
            <span className="admin-header-label">Administration</span>
            <h1>SAMS-FR</h1>
          </div>

          <button
            type="button"
            className="admin-user"
            onClick={handleLogout}
            title="Logout"
          >
            <div className="admin-user-avatar">
              <FontAwesomeIcon icon={faUser} />
            </div>

            <div className="admin-user-info">
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>

            <FontAwesomeIcon
              className="admin-user-chevron"
              icon={faRightFromBracket}
            />
          </button>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;