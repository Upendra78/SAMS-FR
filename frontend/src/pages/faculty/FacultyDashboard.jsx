import PageState from "../../components/PageState";
import StatCard from "../../components/StatCard";

function FacultyDashboard() {
  const hasData = false;

  return (
    <section>
      <h1>Faculty Dashboard</h1>

      <p>
        Overview of classes, students, attendance, and reports.
      </p>

      {!hasData ? (
        <>
          <div>
            <StatCard
              title="Classes"
              value="—"
              description="Assigned classes will be displayed here."
            />

            <StatCard
              title="Students"
              value="—"
              description="Students from assigned classes."
            />

            <StatCard
              title="Today's Attendance"
              value="—"
              description="Today's attendance summary."
            />

            <StatCard
              title="Reports"
              value="—"
              description="Available attendance reports."
            />
          </div>

          <PageState
            title="No faculty dashboard data available"
            message="Dashboard information will be displayed when the required backend services are available."
          />
        </>
      ) : (
        <div>
          <p>Faculty dashboard data is available.</p>
        </div>
      )}
    </section>
  );
}

export default FacultyDashboard;