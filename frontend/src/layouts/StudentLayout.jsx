import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", path: "/student" },
  { label: "Profile", path: "/student/profile" },
  { label: "Attendance", path: "/student/attendance" },
  { label: "Attendance History", path: "/student/attendance-history" },
];

function StudentLayout({ children }) {
  return (
    <div>
      <header>
        <h1>Student Portal</h1>

        <nav aria-label="Student navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/student"}
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

export default StudentLayout;