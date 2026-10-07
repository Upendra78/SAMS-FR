import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBookOpen,
  faBuilding,
  faChartColumn,
  faChartLine,
  faChevronDown,
  faChevronRight,
  faChalkboardUser,
  faGear,
  faGraduationCap,
  faRightFromBracket,
  faSchool,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";

import "./AdminLayout.css";

const managementItems = [
  {
    label: "Users",
    path: "/admin/management",
    icon: faUsers,
  },
  {
    label: "Faculty",
    path: "/admin/faculty",
    icon: faChalkboardUser,
  },
  {
    label: "Students",
    path: "/admin/students",
    icon: faGraduationCap,
  },
];

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: faChartLine,
  },
  {
    label: "Departments",
    path: "/admin/departments",
    icon: faBuilding,
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
  const location = useLocation();

  const isManagementRoute =
    location.pathname === "/admin/management" ||
    location.pathname.startsWith("/admin/faculty") ||
    location.pathname.startsWith("/admin/students");

  const isAcademicRoute =
    location.pathname.startsWith("/admin/academic-management");

  const isAttendanceRoute =
    location.pathname.startsWith("/admin/attendance-reports");

  const [managementOpen, setManagementOpen] =
    useState(isManagementRoute);

  const [academicOpen, setAcademicOpen] =
    useState(isAcademicRoute);

  const [attendanceOpen, setAttendanceOpen] =
    useState(isAttendanceRoute);

  async function handleLogout() {
    await logout();
    navigate("/auth", { replace: true });
  }

  function handleManagementToggle() {
    setManagementOpen((current) => !current);
  }

  function handleAcademicToggle() {
    setAcademicOpen((current) => !current);
  }

  function handleAttendanceToggle() {
    setAttendanceOpen((current) => !current);
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
        </div>

        {/* Navigation */}
        <nav
          className="admin-navigation"
          aria-label="Admin navigation"
        >
          <div className="admin-nav-list">
            {/* Dashboard */}
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin-nav-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="admin-nav-icon">
                <FontAwesomeIcon icon={faChartLine} />
              </span>

              <span className="admin-nav-label">
                Dashboard
              </span>
            </NavLink>

            {/* Admin Management */}
            <div className="admin-nav-group">
              <button
                type="button"
                className={`admin-nav-link admin-nav-group-button ${
                  isManagementRoute ? "parent-active" : ""
                }`}
                onClick={handleManagementToggle}
                aria-expanded={managementOpen}
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </span>

                <span className="admin-nav-label">
                  Admin Management
                </span>

                <span className="admin-nav-chevron">
                  <FontAwesomeIcon
                    icon={
                      managementOpen
                        ? faChevronDown
                        : faChevronRight
                    }
                  />
                </span>
              </button>

              {managementOpen && (
                <div className="admin-subnav">
                  {managementItems.map((item) => (
                    <NavLink
                      key={`${item.label}-${item.path}`}
                      to={item.path}
                      end={item.path === "/admin/management"}
                      className={({ isActive }) =>
                        `admin-subnav-link ${
                          isActive ? "active" : ""
                        }`
                      }
                    >
                      <span className="admin-subnav-icon">
                        <FontAwesomeIcon icon={item.icon} />
                      </span>

                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Departments */}
            {navigationItems
              .filter((item) => item.label === "Departments")
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `admin-nav-link ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <span className="admin-nav-icon">
                    <FontAwesomeIcon icon={item.icon} />
                  </span>

                  <span className="admin-nav-label">
                    {item.label}
                  </span>
                </NavLink>
              ))}

            {/* Academic Management */}
            <div className="admin-nav-group">
              <button
                type="button"
                className={`admin-nav-link admin-nav-group-button ${
                  isAcademicRoute ? "parent-active" : ""
                }`}
                onClick={handleAcademicToggle}
                aria-expanded={academicOpen}
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>

                <span className="admin-nav-label">
                  Academic Management
                </span>

                <span className="admin-nav-chevron">
                  <FontAwesomeIcon
                    icon={
                      academicOpen
                        ? faChevronDown
                        : faChevronRight
                    }
                  />
                </span>
              </button>

              {academicOpen && (
                <div className="admin-subnav">
                  <NavLink
                    to="/admin/academic-management"
                    className={({ isActive }) =>
                      `admin-subnav-link ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="admin-subnav-icon">
                      <FontAwesomeIcon icon={faBookOpen} />
                    </span>

                    <span>Academic Management</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Attendance Reports */}
            <div className="admin-nav-group">
              <button
                type="button"
                className={`admin-nav-link admin-nav-group-button ${
                  isAttendanceRoute ? "parent-active" : ""
                }`}
                onClick={handleAttendanceToggle}
                aria-expanded={attendanceOpen}
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={faChartColumn} />
                </span>

                <span className="admin-nav-label">
                  Attendance Reports
                </span>

                <span className="admin-nav-chevron">
                  <FontAwesomeIcon
                    icon={
                      attendanceOpen
                        ? faChevronDown
                        : faChevronRight
                    }
                  />
                </span>
              </button>

              {attendanceOpen && (
                <div className="admin-subnav">
                  <NavLink
                    to="/admin/attendance-reports"
                    className={({ isActive }) =>
                      `admin-subnav-link ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="admin-subnav-icon">
                      <FontAwesomeIcon icon={faChartColumn} />
                    </span>

                    <span>Attendance Reports</span>
                  </NavLink>
                </div>
              )}
            </div>
          </div>

          {/* System */}
          <p className="admin-nav-title admin-nav-title-system">
            SYSTEM
          </p>

          <div className="admin-nav-list">
            {systemItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `admin-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>

                <span className="admin-nav-label">
                  {item.label}
                </span>
              </NavLink>
            ))}

            <button
              type="button"
              className="admin-nav-link admin-logout-button"
              onClick={handleLogout}
            >
              <span className="admin-nav-icon admin-logout-icon">
                <FontAwesomeIcon icon={faRightFromBracket} />
              </span>

              <span className="admin-nav-label">
                Logout
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-header-brand">
            <span className="admin-header-label">
              Administration
            </span>

            <h1>SAMS-FR</h1>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-notification-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <FontAwesomeIcon icon={faBell} />
            </button>

            <div className="admin-header-divider" />

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
                <strong>Admin</strong>
                <span>Administrator</span>
              </div>

              <FontAwesomeIcon
                className="admin-user-chevron"
                icon={faChevronDown}
              />
            </button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;