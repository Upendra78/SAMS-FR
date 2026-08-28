import PageState from "../../components/PageState";
import StatCard from "../../components/StatCard";

function AdminDashboard() {
  const isLoading = false;
  const hasData = false;

  if (isLoading) {
    return (
      <PageState
        title="Loading dashboard"
        message="Dashboard information is being loaded."
      />
    );
  }

  if (!hasData) {
    return (
      <section>
        <h1>Admin Dashboard</h1>

        <p>
          Overview of the SAMS-FR attendance management system.
        </p>

        <div>
          <StatCard
            title="Students"
            value="—"
            description="Student data will be loaded from the backend."
          />

          <StatCard
            title="Faculty"
            value="—"
            description="Faculty data will be loaded from the backend."
          />

          <StatCard
            title="Departments"
            value="—"
            description="Department data will be loaded from the backend."
          />

          <StatCard
            title="Attendance"
            value="—"
            description="Attendance data will be loaded from the backend."
          />
        </div>

        <PageState
          title="No dashboard data available"
          message="Connect the dashboard to the backend API when the required endpoints are available."
        />
      </section>
    );
  }

  return (
    <section>
      <h1>Admin Dashboard</h1>

      <p>
        Overview of the SAMS-FR attendance management system.
      </p>

      <div>
        <StatCard
          title="Students"
          value="—"
          description="Total registered students."
        />

        <StatCard
          title="Faculty"
          value="—"
          description="Total registered faculty members."
        />

        <StatCard
          title="Departments"
          value="—"
          description="Total active departments."
        />

        <StatCard
          title="Attendance"
          value="—"
          description="Attendance overview."
        />
      </div>
    </section>
  );
}

export default AdminDashboard;