import PageState from "../../components/PageState";

function AttendanceHistory() {
  return (
    <section>
      <h1>Attendance History</h1>

      <p>
        View historical attendance records.
      </p>

      <PageState
        title="No attendance history available"
        message="Attendance history will appear here when historical attendance data is provided by the backend."
      />
    </section>
  );
}

export default AttendanceHistory;