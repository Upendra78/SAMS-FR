import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

function Students() {
  const students = [];

  const columns = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
  ];

  return (
    <section>
      <h1>Students</h1>

      <p>
        Manage and view registered students in the SAMS-FR system.
      </p>

      {students.length === 0 ? (
        <PageState
          title="No students available"
          message="Student records will be displayed here when they are provided by the backend."
        />
      ) : (
        <DataTable
          columns={columns}
          data={students}
          emptyMessage="No student records found."
        />
      )}
    </section>
  );
}

export default Students;