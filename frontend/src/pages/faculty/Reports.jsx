import PageState from "../../components/PageState";

function Reports() {
  return (
    <section>
      <h1>Reports</h1>

      <p>
        View attendance reports for classes assigned to the faculty member.
      </p>

      <PageState
        title="No reports available"
        message="Attendance reports will appear here when report data is available from the backend."
      />
    </section>
  );
}

export default Reports;