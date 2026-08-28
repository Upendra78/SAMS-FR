import DataTable from "../../components/DataTable";
import PageState from "../../components/PageState";

function Classes() {
  const classes = [];

  const columns = [
    { key: "classId", label: "Class ID" },
    { key: "name", label: "Class Name" },
    { key: "department", label: "Department" },
    { key: "semester", label: "Semester" },
  ];

  return (
    <section>
      <h1>Classes</h1>

      <p>
        View classes assigned to the faculty member.
      </p>

      {classes.length === 0 ? (
        <PageState
          title="No classes available"
          message="Assigned classes will be displayed here when class data is available from the backend."
        />
      ) : (
        <DataTable
          columns={columns}
          data={classes}
          emptyMessage="No assigned classes found."
        />
      )}
    </section>
  );
}

export default Classes;