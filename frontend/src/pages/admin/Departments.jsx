import { useState } from "react";

import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

import "./AdminManagement.css";

function Departments() {
  const [searchTerm, setSearchTerm] = useState("");

  // Temporary frontend demonstration data.
  // Replace with API data when the department endpoint is available.
  const departments = [];

  const columns = [
    { key: "departmentId", label: "Department ID" },
    { key: "name", label: "Department Name" },
    { key: "code", label: "Code" },
  ];

  const filteredDepartments = departments.filter((department) => {
    const search = searchTerm.toLowerCase();

    return (
      department.departmentId?.toLowerCase().includes(search) ||
      department.name?.toLowerCase().includes(search) ||
      department.code?.toLowerCase().includes(search)
    );
  });

  return (
    <section className="admin-management-page">
      <div className="management-heading">
        <div>
          <span className="management-eyebrow">Management</span>

          <h1>Departments</h1>

          <p>
            Manage and view departments registered in the SAMS-FR system.
          </p>
        </div>

        <div className="management-count">
          <strong>{departments.length}</strong>

          <span>Active departments</span>
        </div>
      </div>

      <div className="management-toolbar">
        <div className="management-search">
          <label htmlFor="department-search">
            Search departments
          </label>

          <input
            id="department-search"
            type="search"
            placeholder="Search by department ID, name, or code"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {departments.length === 0 ? (
        <PageState
          title="No departments available"
          message="Department records will be displayed here when they are provided by the backend."
        />
      ) : filteredDepartments.length === 0 ? (
        <PageState
          title="No matching departments"
          message="Try adjusting your search terms."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredDepartments}
          emptyMessage="No department records found."
        />
      )}

      <div className="management-footer-note">
        <strong>Backend integration pending</strong>

        <span>
          Department records will be loaded from the backend API when
          the required endpoint is available.
        </span>
      </div>
    </section>
  );
}

export default Departments;