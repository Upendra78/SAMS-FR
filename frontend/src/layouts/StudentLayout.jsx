import { useState, useEffect } from "react";
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
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import useAuth from "../hooks/useAuth";
import { getStudentProfile } from "../services/studentService";
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

function getInitials(name) {
  if (!name) return "ST";
  const clean = name
    .replace(/^(dr\.|dr|mr\.|mr|ms\.|ms|mrs\.|mrs|prof\.|prof)\s+/i, "")
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StudentLayout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const loggedInUser = auth?.user;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    getStudentProfile()
      .then((res) => {
        if (active && res?.success && res.data) {
          setProfile(res.data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const displayName = profile?.name || loggedInUser?.name || "Student";
  const enrollmentNo = profile?.enrollment_no || loggedInUser?.enrollment_no || "CS2023001";
  const initials = getInitials(displayName);

  const handleLogout = () => {
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
          </div>

          <div className="student-topbar-right">

            {/* Student Profile Pill */}
            <button
              type="button"
              className="student-profile-summary"
              onClick={() => navigate("/student/profile")}
              aria-label={`View profile for ${displayName}`}
            >
              <span className="student-avatar">{initials}</span>

              <span className="student-profile-text">
                <strong>{displayName}</strong>
                <small>Student • {enrollmentNo}</small>
              </span>

              <FontAwesomeIcon icon={faChevronDown} className="student-profile-chevron" />
            </button>
          </div>
        </header>

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;