import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";
import "./Students.css";

function Students() {
  const students = [];

  const columns = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "class", label: "Class" },
  ];

  return (
    <section className="faculty-students">
      <div className="students-heading">
        <div>
          <span className="students-eyebrow">Management</span>

          <h1>My Students</h1>

          <p>
            View students belonging to your assigned classes.
          </p>
        </div>

        <div className="students-status">
          <span className="status-dot" />
          Faculty workspace
        </div>
      </div>

      <div className="students-summary">
        <article className="summary-card">
          <span className="summary-label">Assigned Students</span>

          <strong>{students.length}</strong>

          <small>
            Students across your assigned classes.
          </small>
        </article>
      </div>

      <div className="students-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-eyebrow">Students</span>

            <h2>Assigned Students</h2>
          </div>

          <span className="panel-badge">
            {students.length} students
          </span>
        </div>

        <div className="students-search">
          <label htmlFor="student-search">
            Search students
          </label>

          <input
            id="student-search"
            type="search"
            placeholder="Search by student ID, name, email, or class"
            disabled
          />
        </div>

        <div className="students-content">
          {students.length === 0 ? (
            <PageState
              title="No students available"
              message="Students from assigned classes will be displayed here when student data is available from the backend."
            />
          ) : (
            <DataTable
              columns={columns}
              data={students}
              emptyMessage="No students found."
            />
          )}
        </div>
      </div>

      <div className="students-footer-note">
        <strong>Backend integration pending</strong>
        <span>
          Student records will be loaded from the backend API when the
          required faculty student endpoint is available.
        </span>
      </div>
    </section>
  );
}

export default Students;