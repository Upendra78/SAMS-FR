import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

function Departments() {
  const departments = [];

  const columns = [
    { key: "departmentId", label: "Department ID" },
    { key: "name", label: "Department Name" },
    { key: "code", label: "Code" },
  ];

  return (
    <section>
      <h1>Departments</h1>

      <p>
        Manage and view departments registered in the SAMS-FR system.
      </p>

      {departments.length === 0 ? (
        <PageState
          title="No departments available"
          message="Department records will be displayed here when they are provided by the backend."
        />
      ) : (
        <DataTable
          columns={columns}
          data={departments}
          emptyMessage="No department records found."
        />
      )}
    </section>
  );
}

export default Departments;