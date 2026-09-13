import { useState } from "react";

import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

import "./AdminManagement.css";

function Students() {
  const [searchTerm, setSearchTerm] = useState("");

  // Temporary frontend demonstration data.
  // Replace with API data when the student endpoint is available.
  const students = [];

  const columns = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
  ];

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();

    return (
      student.studentId?.toLowerCase().includes(search) ||
      student.name?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.department?.toLowerCase().includes(search)
    );
  });

  return (
    <section className="admin-management-page">
      <div className="management-heading">
        <div>
          <span className="management-eyebrow">Management</span>

          <h1>Students</h1>

          <p>
            Manage and view registered students in the SAMS-FR system.
          </p>
        </div>

        <div className="management-count">
          <strong>{students.length}</strong>
          <span>Registered students</span>
        </div>
      </div>

      <div className="management-toolbar">
        <div className="management-search">
          <label htmlFor="student-search">Search students</label>

          <input
            id="student-search"
            type="search"
            placeholder="Search by ID, name, email, or department"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {students.length === 0 ? (
        <PageState
          title="No students available"
          message="Student records will be displayed here when they are provided by the backend."
        />
      ) : filteredStudents.length === 0 ? (
        <PageState
          title="No matching students"
          message="Try adjusting your search terms."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents}
          emptyMessage="No student records found."
        />
      )}

      <div className="management-footer-note">
        <strong>Backend integration pending</strong>

        <span>
          Student records will be loaded from the backend API when the
          required endpoint is available.
        </span>
      </div>
    </section>
  );
}

export default Students;