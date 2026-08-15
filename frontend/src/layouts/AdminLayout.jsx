import { NavLink } from "react-router-dom";

function AdminLayout({ children }) {
  return (
    <div>
      <header>
        <h1>Admin Portal</h1>

        <nav>
          <NavLink to="/admin">Dashboard</NavLink>{" "}
          <NavLink to="/admin/students">Students</NavLink>{" "}
          <NavLink to="/admin/faculty">Faculty</NavLink>{" "}
          <NavLink to="/admin/departments">Departments</NavLink>{" "}
          <NavLink to="/admin/attendance-reports">
            Attendance Reports
          </NavLink>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default AdminLayout;