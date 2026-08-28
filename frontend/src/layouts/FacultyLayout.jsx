import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", path: "/faculty" },
  { label: "Classes", path: "/faculty/classes" },
  { label: "Students", path: "/faculty/students" },
  { label: "Attendance", path: "/faculty/attendance" },
  { label: "Reports", path: "/faculty/reports" },
];

function FacultyLayout({ children }) {
  return (
    <div>
      <header>
        <h1>Faculty Portal</h1>

        <nav aria-label="Faculty navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/faculty"}
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

export default FacultyLayout;