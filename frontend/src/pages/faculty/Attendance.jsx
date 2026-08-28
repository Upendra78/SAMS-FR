import PageState from "../../components/PageState";

function Attendance() {
  return (
    <section>
      <h1>Attendance</h1>

      <p>
        Start and monitor attendance sessions for assigned classes.
      </p>

      <div>
        <h2>Recognition Workflow</h2>

        <p>
          Attendance recognition will be connected to the backend recognition
          workflow when the required API is available.
        </p>
      </div>

      <PageState
        title="Attendance session not available"
        message="Attendance session controls will appear here when the backend recognition and attendance APIs are ready."
      />
    </section>
  );
}

export default Attendance;