import { useState } from "react";
import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";
import "./Classes.css";

function Classes() {
  // Temporary frontend demonstration data.
  // Replace with API data when the faculty classes endpoint is available.
  const classes = [];

  const [searchTerm, setSearchTerm] = useState("");

  const columns = [
    { key: "classId", label: "Class ID" },
    { key: "name", label: "Class Name" },
    { key: "department", label: "Department" },
    { key: "semester", label: "Semester" },
  ];

  const filteredClasses = classes.filter((classItem) => {
    const searchValue = searchTerm.toLowerCase().trim();

    if (!searchValue) {
      return true;
    }

    return [
      classItem.classId,
      classItem.name,
      classItem.department,
      classItem.semester,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  });

  return (
    <section className="faculty-classes">
      <div className="classes-heading">
        <div>
          <span className="classes-eyebrow">Management</span>

          <h1>My Classes</h1>

          <p>
            View and manage classes assigned to you as a faculty member.
          </p>
        </div>

        <div className="classes-status">
          <span className="status-dot" />
          <span>Faculty workspace</span>
        </div>
      </div>

      <div className="classes-summary">
        <div className="summary-card">
          <span className="summary-label">Assigned Classes</span>
          <strong>{classes.length}</strong>
          <small>Classes currently assigned to you.</small>
        </div>
      </div>

      <section className="classes-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Classes</span>
            <h2>Assigned Classes</h2>
          </div>

          <span className="panel-badge">
            {classes.length} {classes.length === 1 ? "class" : "classes"}
          </span>
        </div>

        <div className="classes-search">
          <label htmlFor="class-search">Search classes</label>

          <input
            id="class-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by class ID, name, department, or semester"
          />
        </div>

        <div className="classes-content">
          {classes.length === 0 ? (
            <PageState
              title="No classes available"
              message="Assigned classes will be displayed here when class data is available from the backend."
            />
          ) : filteredClasses.length === 0 ? (
            <PageState
              title="No matching classes"
              message="Try changing your search term to find an assigned class."
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredClasses}
              emptyMessage="No assigned classes found."
            />
          )}
        </div>
      </section>

      <div className="classes-footer-note">
        <strong>Backend integration pending</strong>

        <span>
          Assigned class records will be loaded from the backend API when
          the required faculty class endpoint is available.
        </span>
      </div>
    </section>
  );
}

export default Classes;