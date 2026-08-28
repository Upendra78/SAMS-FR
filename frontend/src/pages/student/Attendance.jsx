import PageState from "../../components/PageState";

function Attendance() {
  return (
    <section>
      <h1>Student Attendance</h1>

      <p>
        View the student's current attendance information.
      </p>

      <PageState
        title="Attendance data not available"
        message="Current attendance information will appear here when attendance data is available from the backend."
      />
    </section>
  );
}

export default Attendance;