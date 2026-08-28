import PageState from "../../components/PageState";

function Profile() {
  return (
    <section>
      <h1>Student Profile</h1>

      <p>
        View the student's personal and academic profile information.
      </p>

      <PageState
        title="Profile information not available"
        message="Student profile information will appear here when the backend provides the required data."
      />
    </section>
  );
}

export default Profile;