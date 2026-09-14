import PageState from "../../components/PageState";

import "./AcademicManagement.css";

const academicSections = [
  {
    title: "Academic Sessions",
    description:
      "Manage academic years and sessions used by the attendance system.",
    status: "Backend integration pending",
  },
  {
    title: "Courses",
    description:
      "Manage courses and programs offered by the institution.",
    status: "Backend integration pending",
  },
  {
    title: "Subjects",
    description:
      "Manage subjects associated with courses and academic sessions.",
    status: "Backend integration pending",
  },
  {
    title: "Classes",
    description:
      "Manage class groups and their academic assignments.",
    status: "Backend integration pending",
  },
];

function AcademicManagement() {
  return (
    <section className="academic-management-page">
      <div className="academic-heading">
        <div>
          <span className="academic-eyebrow">Administration</span>

          <h1>Academic Management</h1>

          <p>
            Manage the academic structure used by the SAMS-FR
            attendance management system.
          </p>
        </div>
      </div>

      <div className="academic-grid">
        {academicSections.map((section) => (
          <article
            className="academic-card"
            key={section.title}
          >
            <div className="academic-card-icon">
              --
            </div>

            <div className="academic-card-content">
              <h2>{section.title}</h2>

              <p>{section.description}</p>

              <span className="academic-card-status">
                {section.status}
              </span>
            </div>
          </article>
        ))}
      </div>

      <PageState
        title="Academic management is ready for integration"
        message="Courses, classes, subjects, and academic sessions will be connected when the required backend APIs are available."
      />

      <div className="academic-footer-note">
        <strong>Frontend structure ready</strong>

        <span>
          The academic management interface is prepared for backend
          integration without assuming unavailable API endpoints.
        </span>
      </div>
    </section>
  );
}

export default AcademicManagement;