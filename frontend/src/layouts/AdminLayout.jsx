import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const navigationItems = [
  { label: "Dashboard", path: "/admin" },
  { label: "Students", path: "/admin/students" },
  { label: "Faculty", path: "/admin/faculty" },
  { label: "Departments", path: "/admin/departments" },
  {
    label: "Academic Management",
    path: "/admin/academic-management",
  },
  {
    label: "Attendance Reports",
    path: "/admin/attendance-reports",
  },
];

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">S</div>

          <div>
            <strong>SAMS-FR</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-navigation" aria-label="Admin navigation">
          <p className="admin-nav-title">Management</p>

          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span>Secure Attendance Management</span>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-header">
          <div>
            <span className="admin-header-label">Administration</span>
            <h1>SAMS-FR</h1>
          </div>

          <div className="admin-user">
            <div className="admin-user-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
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
