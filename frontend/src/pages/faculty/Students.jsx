import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

function Students() {
  const students = [];

  const columns = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "class", label: "Class" },
  ];

  return (
    <section>
      <h1>Students</h1>

      <p>
        View students belonging to the faculty member's assigned classes.
      </p>

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
    </section>
  );
}

export default Students;