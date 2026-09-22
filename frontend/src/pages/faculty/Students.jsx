import { useMemo, useState } from "react";
import "./Students.css";

const students = [];

const EMPTY_METRICS = {
  totalStudents: null,
  activeStudents: null,
  classes: null,
  attendanceRate: null,
};

const classOptions = ["All Classes"];
const departments = ["All"];
const semesters = ["All"];
const statuses = ["All", "Active", "Inactive"];

const formatMetric = (value) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return value;
};

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "S";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
};

function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [department, setDepartment] = useState("All");
  const [semester, setSemester] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.studentId?.toLowerCase().includes(normalizedSearch) ||
        student.fullName?.toLowerCase().includes(normalizedSearch) ||
        student.email?.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClass === "All Classes" ||
        student.className === selectedClass;

      const matchesDepartment =
        department === "All" || student.department === department;

      const matchesSemester =
        semester === "All" || student.semester === semester;

      const matchesStatus =
        status === "All" || student.status === status;

      return (
        matchesSearch &&
        matchesClass &&
        matchesDepartment &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [searchTerm, selectedClass, department, semester, status]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedClass("All Classes");
    setDepartment("All");
    setSemester("All");
    setStatus("All");
  };

  const hasFilters =
    searchTerm ||
    selectedClass !== "All Classes" ||
    department !== "All" ||
    semester !== "All" ||
    status !== "All";

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
  };

  const metrics = [
    {
      label: "Total Students",
      value: formatMetric(EMPTY_METRICS.totalStudents),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
      tone: "blue",
    },
    {
      label: "Active Students",
      value: formatMetric(EMPTY_METRICS.activeStudents),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m8 12 2.5 2.5L16 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      tone: "green",
    },
    {
      label: "Classes",
      value: formatMetric(EMPTY_METRICS.classes),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 4v4M16 4v4M3 10h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
      tone: "purple",
    },
    {
      label: "Attendance Rate",
      value: formatMetric(EMPTY_METRICS.attendanceRate),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 19V5M4 19h17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="m7 15 4-4 3 2 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      tone: "orange",
    },
  ];

  return (
    <div className="faculty-students-page">
      <section className="students-page-header">
        <div>
          <span className="students-eyebrow">FACULTY PORTAL</span>
          <h1>Students</h1>
          <p>
            View students enrolled in your assigned classes and monitor their
            academic and attendance information.
          </p>
        </div>

        <button type="button" className="students-primary-button" disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 5h16v14H4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M8 9h8M8 13h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          View Attendance
        </button>
      </section>

      <section className="students-metrics-grid">
        {metrics.map((metric) => (
          <article className="students-metric-card" key={metric.label}>
            <div className={`students-metric-icon ${metric.tone}`}>
              {metric.icon}
            </div>

            <div className="students-metric-content">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="students-filters-card">
        <div className="students-filter search-filter">
          <label htmlFor="student-search">Search Students</label>
          <div className="students-search-wrapper">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="11"
                cy="11"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="m20 20-4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              id="student-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by student ID, name or email..."
            />
          </div>
        </div>

        <div className="students-filter">
          <label htmlFor="student-class">Class</label>
          <select
            id="student-class"
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
          >
            {classOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="students-filter">
          <label htmlFor="student-department">Department</label>
          <select
            id="student-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          >
            {departments.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="students-filter">
          <label htmlFor="student-semester">Semester</label>
          <select
            id="student-semester"
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
          >
            {semesters.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="students-filter">
          <label htmlFor="student-status">Status</label>
          <select
            id="student-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="students-clear-button"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          <span>↻</span>
          Clear Filters
        </button>
      </section>

      <section className="students-list-section">
        <div className="students-section-heading">
          <div>
            <h2>Students</h2>
            <p>Students enrolled in your assigned classes.</p>
          </div>
        </div>

        <div className="students-table-card">
          {students.length === 0 ? (
            <div className="students-empty-state">
              <div className="students-empty-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M17 8h5M19.5 5.5v5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3>No students available</h3>
              <p>
                Students enrolled in your assigned classes will appear here
                when enrollment data is provided by the backend.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="students-empty-state compact">
              <div className="students-empty-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="m20 20-4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3>No matching students</h3>
              <p>Try changing your search or filters.</p>
            </div>
          ) : (
            <div className="students-table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Class</th>
                    <th>Department</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.studentId}>
                      <td>
                        <div className="student-identity">
                          <div className="student-avatar">
                            {getInitials(student.fullName)}
                          </div>

                          <div>
                            <strong>{student.fullName}</strong>
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>{student.studentId}</td>
                      <td>{student.className || "N/A"}</td>
                      <td>{student.department || "N/A"}</td>
                      <td>{student.attendanceRate || "N/A"}</td>

                      <td>
                        <span
                          className={`student-status ${
                            student.status?.toLowerCase() || "unknown"
                          }`}
                        >
                          {student.status || "N/A"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="student-view-button"
                          onClick={() => handleViewStudent(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="students-list-footer">
          <span>
            Showing {filteredStudents.length} of {students.length} students
          </span>

          <div className="students-pagination">
            <button type="button" disabled>
              ‹ Previous
            </button>
            <button type="button" className="active" disabled>
              1
            </button>
            <button type="button" disabled>
              Next ›
            </button>
          </div>
        </div>
      </section>

      <div className="students-integration-notice">
        <div className="students-notice-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3v18M3 12h18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <strong>Student data integration pending</strong>
          <p>
            Student enrollment, attendance and profile information will be
            loaded from the Flask backend once the API is available.
          </p>
        </div>
      </div>

      {selectedStudent && (
        <div
          className="students-modal-backdrop"
          onMouseDown={closeStudentModal}
        >
          <div
            className="students-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="students-modal-header">
              <div>
                <span className="students-eyebrow">STUDENT PROFILE</span>
                <h2>Student Overview</h2>
              </div>

              <button
                type="button"
                className="students-modal-close"
                onClick={closeStudentModal}
                aria-label="Close student profile"
              >
                ×
              </button>
            </div>

            <div className="student-profile-summary">
              <div className="student-profile-avatar">
                {getInitials(selectedStudent.fullName)}
              </div>

              <div>
                <h3>{selectedStudent.fullName}</h3>
                <p>{selectedStudent.studentId}</p>
                <span>{selectedStudent.email}</span>
              </div>
            </div>

            <div className="student-profile-grid">
              <div>
                <span>Department</span>
                <strong>{selectedStudent.department || "N/A"}</strong>
              </div>

              <div>
                <span>Program</span>
                <strong>{selectedStudent.program || "N/A"}</strong>
              </div>

              <div>
                <span>Semester</span>
                <strong>{selectedStudent.semester || "N/A"}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedStudent.status || "N/A"}</strong>
              </div>
            </div>

            <div className="student-profile-section">
              <h3>Enrolled Classes</h3>
              <div className="student-profile-empty">
                Enrollment details will appear when backend data is available.
              </div>
            </div>

            <div className="student-profile-section">
              <h3>Attendance Summary</h3>
              <div className="student-attendance-summary">
                <div>
                  <span>Overall Attendance</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Present</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Absent</span>
                  <strong>N/A</strong>
                </div>

                <div>
                  <span>Late</span>
                  <strong>N/A</strong>
                </div>
              </div>
            </div>

            <div className="students-modal-footer">
              <button
                type="button"
                className="students-secondary-button"
                onClick={closeStudentModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;