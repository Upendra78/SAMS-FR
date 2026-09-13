import { useState } from "react";

import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

import "./AdminManagement.css";

function Faculty() {
  const [searchTerm, setSearchTerm] = useState("");

  // Temporary frontend demonstration data.
  // Replace with API data when the faculty endpoint is available.
  const faculty = [];

  const columns = [
    { key: "facultyId", label: "Faculty ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
  ];

  const filteredFaculty = faculty.filter((member) => {
    const search = searchTerm.toLowerCase();

    return (
      member.facultyId?.toLowerCase().includes(search) ||
      member.name?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search) ||
      member.department?.toLowerCase().includes(search)
    );
  });

  return (
    <section className="admin-management-page">
      <div className="management-heading">
        <div>
          <span className="management-eyebrow">Management</span>

          <h1>Faculty</h1>

          <p>
            Manage and view registered faculty members in the SAMS-FR
            system.
          </p>
        </div>

        <div className="management-count">
          <strong>{faculty.length}</strong>

          <span>Registered faculty</span>
        </div>
      </div>

      <div className="management-toolbar">
        <div className="management-search">
          <label htmlFor="faculty-search">Search faculty</label>

          <input
            id="faculty-search"
            type="search"
            placeholder="Search by ID, name, email, or department"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {faculty.length === 0 ? (
        <PageState
          title="No faculty available"
          message="Faculty records will be displayed here when they are provided by the backend."
        />
      ) : filteredFaculty.length === 0 ? (
        <PageState
          title="No matching faculty"
          message="Try adjusting your search terms."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredFaculty}
          emptyMessage="No faculty records found."
        />
      )}

      <div className="management-footer-note">
        <strong>Backend integration pending</strong>

        <span>
          Faculty records will be loaded from the backend API when the
          required endpoint is available.
        </span>
      </div>
    </section>
  );
}

export default Faculty;