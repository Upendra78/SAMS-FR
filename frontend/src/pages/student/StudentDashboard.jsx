import PageState from "../../components/PageState";

function StudentDashboard() {
  return (
    <section>
      <h1>Student Dashboard</h1>

      <p>
        Overview of the student's attendance and academic information.
      </p>

      <div>
        <h2>Attendance Overview</h2>

        <p>
          Attendance summary and academic information will appear here when
          backend data is available.
        </p>
      </div>

      <PageState
        title="Dashboard data not available yet"
        message="Student dashboard information will appear here after the backend APIs are connected."
      />
    </section>
  );
}

export default StudentDashboard;