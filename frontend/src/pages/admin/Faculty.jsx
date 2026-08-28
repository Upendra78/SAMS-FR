import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

function Faculty() {
  const faculty = [];

  const columns = [
    { key: "facultyId", label: "Faculty ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
  ];

  return (
    <section>
      <h1>Faculty</h1>

      <p>
        Manage and view registered faculty members in the SAMS-FR system.
      </p>

      {faculty.length === 0 ? (
        <PageState
          title="No faculty available"
          message="Faculty records will be displayed here when they are provided by the backend."
        />
      ) : (
        <DataTable
          columns={columns}
          data={faculty}
          emptyMessage="No faculty records found."
        />
      )}
    </section>
  );
}

export default Faculty;