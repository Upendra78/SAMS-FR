
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faBuilding,
  faCalendarDays,
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
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

import "./AdminLayout.css";

const managementItems = [
  {
    label: "Users",
    path: "/admin/management",
    icon: faUsers,
    end: true,
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

const academicItems = [
  {
    label: "Courses",
    path: "/admin/academic-management/courses",
    icon: faBookOpen,
  },
  {
    label: "Course Offerings",
    path: "/admin/academic-management/course-offerings",
    icon: faBookOpen,
  },
  {
    label: "Course Enrollments",
    path: "/admin/academic-management/course-enrollments",
    icon: faGraduationCap,
  },
  {
    label: "Batches",
    path: "/admin/batches",
    icon: faSchool,
  },
  {
    label: "Assignments",
    path: "/admin/academic-management/assignments",
    icon: faBookOpen,
  },
];

const timetableItems = [
  {
    label: "Timetable",
    path: "/admin/timetable",
    icon: faCalendarDays,
    end: true,
  },
  {
    label: "Faculty Adjustment",
    path: "/admin/timetable/faculty-adjustment",
    icon: faUsers,
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

function getInitials(name) {
  if (!name) return "AD";
  const cleanName = name
    .replace(/^(dr\.|dr|prof\.|prof|mr\.|mr|mrs\.|mrs|ms\.|ms)\s+/i, "")
    .trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    (user?.email ? user.email.split("@")[0] : "Admin");
  const initials = getInitials(displayName);
  const userRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Administrator";

  const pathname = location.pathname;

  // Determine which navigation groups match the current route.
  const isManagementRoute =
    pathname === "/admin/management" ||
    pathname.startsWith("/admin/faculty") ||
    pathname.startsWith("/admin/students");

  const isAcademicRoute =
    pathname.startsWith("/admin/academic-management") ||
    pathname === "/admin/batches" ||
    pathname === "/admin/assignments";

  const isAttendanceRoute =
    pathname.startsWith("/admin/attendance-reports");

  const isTimetableRoute =
    pathname.startsWith("/admin/timetable");

  // null means follow the current route automatically.
  // true/false means the user has manually toggled the group.
  const [managementManualOpen, setManagementManualOpen] =
    useState(null);

  const [academicManualOpen, setAcademicManualOpen] =
    useState(null);

  const [attendanceManualOpen, setAttendanceManualOpen] =
    useState(null);

  const [timetableManualOpen, setTimetableManualOpen] =
    useState(null);

  const managementOpen =
    managementManualOpen ?? isManagementRoute;

  const academicOpen =
    academicManualOpen ?? isAcademicRoute;

  const attendanceOpen =
    attendanceManualOpen ?? isAttendanceRoute;

  const timetableOpen =
    timetableManualOpen ?? isTimetableRoute;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/auth", { replace: true });
    }
  }

  function handleManagementToggle() {
    setManagementManualOpen((current) =>
      !(current ?? isManagementRoute)
    );
  }

  function handleAcademicToggle() {
    setAcademicManualOpen((current) =>
      !(current ?? isAcademicRoute)
    );
  }

  function handleAttendanceToggle() {
    setAttendanceManualOpen((current) =>
      !(current ?? isAttendanceRoute)
    );
  }

  function handleTimetableToggle() {
    setTimetableManualOpen((current) =>
      !(current ?? isTimetableRoute)
    );
  }

  function getGroupClass(isActive) {
    return [
      "admin-nav-link",
      "admin-nav-group-button",
      isActive ? "parent-active" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function getNavClass({ isActive }) {
    return `admin-nav-link ${isActive ? "active" : ""}`;
  }

  function getSubNavClass({ isActive }) {
    return `admin-subnav-link ${isActive ? "active" : ""}`;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
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

        <nav
          className="admin-navigation"
          aria-label="Admin navigation"
        >
          <div className="admin-nav-list">
            {/* Dashboard */}
            <NavLink
              to="/admin/dashboard"
              end
              className={getNavClass}
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
                className={getGroupClass(isManagementRoute)}
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
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={getSubNavClass}
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
            <NavLink
              to="/admin/departments"
              className={getNavClass}
            >
              <span className="admin-nav-icon">
                <FontAwesomeIcon icon={faBuilding} />
              </span>

              <span className="admin-nav-label">
                Departments
              </span>
            </NavLink>

            {/* Academic Management */}
            <div className="admin-nav-group">
              <button
                type="button"
                className={getGroupClass(isAcademicRoute)}
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
                  {academicItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end
                      className={getSubNavClass}
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

            {/* Timetable Management */}
            <div className="admin-nav-group">
              <button
                type="button"
                className={getGroupClass(isTimetableRoute)}
                onClick={handleTimetableToggle}
                aria-expanded={timetableOpen}
              >
                <span className="admin-nav-icon">
                  <FontAwesomeIcon icon={faCalendarDays} />
                </span>

                <span className="admin-nav-label">
                  Timetable Management
                </span>

                <span className="admin-nav-chevron">
                  <FontAwesomeIcon
                    icon={
                      timetableOpen
                        ? faChevronDown
                        : faChevronRight
                    }
                  />
                </span>
              </button>

              {timetableOpen && (
                <div className="admin-subnav">
                  {timetableItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={getSubNavClass}
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

            {/* Attendance Reports */}
            <div className="admin-nav-group">
              <button
                type="button"
                className={getGroupClass(isAttendanceRoute)}
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
                    end
                    className={getSubNavClass}
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
                end
                className={getNavClass}
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
          <div className="admin-header-actions">
            <div className="admin-user-pill">
              <div className="admin-user-avatar">
                <span>{initials}</span>
              </div>

              <div className="admin-user-info">
                <strong>{displayName}</strong>
                <span>{userRole}</span>
              </div>
            </div>
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
