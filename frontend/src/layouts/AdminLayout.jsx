import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", path: "/admin" },
  { label: "Students", path: "/admin/students" },
  { label: "Faculty", path: "/admin/faculty" },
  { label: "Departments", path: "/admin/departments" },
  { label: "Attendance Reports", path: "/admin/attendance-reports" },
];

function AdminLayout({ children }) {
  return (
    <div>
      <header>
        <h1>Admin Portal</h1>

        <nav aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default AdminLayout;