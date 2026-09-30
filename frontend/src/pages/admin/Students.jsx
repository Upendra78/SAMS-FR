import { useEffect, useMemo, useState } from "react";

import { getUsers } from "../../services/adminService";

import "./Student.css";

const EMPTY_METRICS = {
  total: null,
  active: null,
  inactive: null,
  departments: null,
};

function formatMetric(value) {
  return value === null || value === undefined ? "N/A" : value;
}

function getInitials(name) {
  if (!name) {
    return "ST";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Student() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [program, setProgram] = useState("All");
  const [yearSemester, setYearSemester] = useState("All");
  const [status, setStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    fullName: "",
    email: "",
    department: "",
    program: "",
    yearSemester: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getUsers();

        if (!mounted) {
          return;
        }

        const users = response?.data ?? [];

        const studentUsers = users
          .filter((user) => user.role === "STUDENT")
          .map((user) => ({
            studentId: String(user.user_id),
            name: user.name,
            email: user.email,

            // These fields are not provided by the current
            // /api/admin/users backend contract.
            department: null,
            program: null,
            yearSemester: null,
            status: null,
          }));

        setStudents(studentUsers);
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setStudents([]);

        setError(
          requestError?.response?.data?.message ||
            "Failed to load students."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * The current backend only provides basic user information.
   * Therefore these academic/status metrics remain unavailable
   * until the backend exposes student profile data.
   */
  const metrics = EMPTY_METRICS;

  /*
   * The current backend does not provide these academic fields,
   * so only "All" is currently a valid filter option.
   */
  const departments = ["All"];
  const programs = ["All"];
  const yearSemesters = ["All"];
  const statuses = ["All"];

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !search ||
        student.studentId?.toLowerCase().includes(search) ||
        student.name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search);

      const matchesDepartment =
        department === "All" ||
        student.department === department;

      const matchesProgram =
        program === "All" ||
        student.program === program;

      const matchesYearSemester =
        yearSemester === "All" ||
        student.yearSemester === yearSemester;

      const matchesStatus =
        status === "All" ||
        student.status === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesProgram &&
        matchesYearSemester &&
        matchesStatus
      );
    });
  }, [
    students,
    searchTerm,
    department,
    program,
    yearSemester,
    status,
  ]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    department !== "All" ||
    program !== "All" ||
    yearSemester !== "All" ||
    status !== "All";

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartment("All");
    setProgram("All");
    setYearSemester("All");
    setStatus("All");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddStudent = (event) => {
    event.preventDefault();
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);

    setFormData({
      studentId: "",
      fullName: "",
      email: "",
      department: "",
      program: "",
      yearSemester: "",
    });
  };

  return (
    <section className="student-management-page">
      <header className="student-page-header">
        <div>
          <span className="student-eyebrow">
            Admin Portal
          </span>

          <h1>Student Management</h1>

          <p>
            Manage student profiles, academic information,
            enrollment and attendance access.
          </p>
        </div>

        <button
          type="button"
          className="student-primary-button"
          onClick={() => setShowAddModal(true)}
          disabled
          title="Student management API is not available yet"
        >
          <span aria-hidden="true">+</span>
          Add Student
        </button>
      </header>

      <div className="student-summary-grid">
        <article className="student-summary-card student-summary-blue">
          <div
            className="student-summary-icon"
            aria-hidden="true"
          >
            <span>♟</span>
          </div>

          <span>Total Students</span>

          <strong>{formatMetric(metrics.total)}</strong>
        </article>

        <article className="student-summary-card student-summary-green">
          <div
            className="student-summary-icon"
            aria-hidden="true"
          >
            <span>✓</span>
          </div>

          <span>Active</span>

          <strong>{formatMetric(metrics.active)}</strong>
        </article>

        <article className="student-summary-card student-summary-red">
          <div
            className="student-summary-icon"
            aria-hidden="true"
          >
            <span>−</span>
          </div>

          <span>Inactive</span>

          <strong>{formatMetric(metrics.inactive)}</strong>
        </article>

        <article className="student-summary-card student-summary-purple">
          <div
            className="student-summary-icon"
            aria-hidden="true"
          >
            <span>▪</span>
          </div>

          <span>Departments</span>

          <strong>
            {formatMetric(metrics.departments)}
          </strong>
        </article>
      </div>

      <div className="student-filter-panel">
        <div className="student-search-field">
          <label htmlFor="student-search">
            Search Student
          </label>

          <div className="student-input-with-icon">
            <span aria-hidden="true">⌕</span>

            <input
              id="student-search"
              type="search"
              placeholder="Search by Student ID, name or email..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>
        </div>

        <div className="student-filter-field">
          <label htmlFor="student-department">
            Department
          </label>

          <select
            id="student-department"
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="student-filter-field">
          <label htmlFor="student-program">
            Program
          </label>

          <select
            id="student-program"
            value={program}
            onChange={(event) =>
              setProgram(event.target.value)
            }
          >
            {programs.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="student-filter-field">
          <label htmlFor="student-year">
            Year / Semester
          </label>

          <select
            id="student-year"
            value={yearSemester}
            onChange={(event) =>
              setYearSemester(event.target.value)
            }
          >
            {yearSemesters.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="student-filter-field">
          <label htmlFor="student-status">
            Status
          </label>

          <select
            id="student-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="student-clear-button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          ↻ Clear Filters
        </button>
      </div>

      <div className="student-table-card">
        <div className="student-table-wrapper">
          {loading ? (
            <div className="student-empty-state">
              <div
                className="student-empty-icon"
                aria-hidden="true"
              >
                ⟳
              </div>

              <h2>Loading students</h2>

              <p>
                Fetching student accounts from the backend.
              </p>
            </div>
          ) : error ? (
            <div className="student-empty-state student-search-empty">
              <div
                className="student-empty-icon"
                aria-hidden="true"
              >
                !
              </div>

              <h2>Unable to load students</h2>

              <p>{error}</p>
            </div>
          ) : (
            <>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Program</th>
                    <th>Email</th>
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
                            {getInitials(student.name)}
                          </div>

                          <div>
                            <strong>{student.name}</strong>
                            <span>{student.studentId}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {student.department || "N/A"}
                      </td>

                      <td>
                        {student.program || "N/A"}
                      </td>

                      <td>{student.email || "N/A"}</td>

                      <td>
                        {student.status ? (
                          <span
                            className={`student-status student-status-${student.status.toLowerCase()}`}
                          >
                            ● {student.status}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="student-action-button"
                          aria-label={`Actions for ${student.name}`}
                          disabled
                          title="Student management API is not available yet"
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {students.length === 0 ? (
                <div className="student-empty-state">
                  <div
                    className="student-empty-icon"
                    aria-hidden="true"
                  >
                    ♟
                  </div>

                  <h2>No students available</h2>

                  <p>
                    No student accounts were returned by the
                    current admin users API.
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="student-empty-state student-search-empty">
                  <div
                    className="student-empty-icon"
                    aria-hidden="true"
                  >
                    ⌕
                  </div>

                  <h2>No matching students</h2>

                  <p>
                    Try adjusting your search terms or filters.
                  </p>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="student-pagination">
          <span>
            Showing {filteredStudents.length} of{" "}
            {students.length} students
          </span>

          <div className="student-pagination-controls">
            <button type="button" disabled>
              ‹ Previous
            </button>

            <button
              type="button"
              className="student-page-number"
              disabled
            >
              1
            </button>

            <button type="button" disabled>
              Next ›
            </button>
          </div>
        </div>
      </div>

      <div className="student-integration-notice">
        <div
          className="student-integration-icon"
          aria-hidden="true"
        >
          i
        </div>

        <div>
          <strong>
            Student account listing connected
          </strong>

          <span>
            Student accounts are loaded from the admin users
            API. Department, program, year/semester, status and
            student profile management require additional
            backend APIs.
          </span>
        </div>

        <span className="student-integration-badge">
          Partially Integrated
        </span>
      </div>

      {showAddModal && (
        <div
          className="student-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseAddModal();
            }
          }}
        >
          <div
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
          >
            <div className="student-modal-header">
              <div>
                <span className="student-eyebrow">
                  Student Management
                </span>

                <h2 id="add-student-title">
                  Add Student
                </h2>

                <p>
                  Student creation will be enabled when the
                  required backend API is available.
                </p>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={handleCloseAddModal}
                aria-label="Close add student dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div className="student-form-section">
                <h3>Student Information</h3>

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label htmlFor="student-id">
                      Student ID
                    </label>

                    <input
                      id="student-id"
                      name="studentId"
                      type="text"
                      value={formData.studentId}
                      onChange={handleFormChange}
                      placeholder="Enter student ID"
                      disabled
                    />
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="student-full-name">
                      Full Name
                    </label>

                    <input
                      id="student-full-name"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Enter full name"
                      disabled
                    />
                  </div>

                  <div className="student-form-field student-form-full">
                    <label htmlFor="student-email">
                      Email
                    </label>

                    <input
                      id="student-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="Enter email address"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="student-form-section">
                <h3>Academic Information</h3>

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label htmlFor="student-department-modal">
                      Department
                    </label>

                    <select
                      id="student-department-modal"
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                      disabled
                    >
                      <option value="">
                        Student API unavailable
                      </option>
                    </select>
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="student-program-modal">
                      Program
                    </label>

                    <select
                      id="student-program-modal"
                      name="program"
                      value={formData.program}
                      onChange={handleFormChange}
                      disabled
                    >
                      <option value="">
                        Student API unavailable
                      </option>
                    </select>
                  </div>

                  <div className="student-form-field">
                    <label htmlFor="student-year-modal">
                      Year / Semester
                    </label>

                    <select
                      id="student-year-modal"
                      name="yearSemester"
                      value={formData.yearSemester}
                      onChange={handleFormChange}
                      disabled
                    >
                      <option value="">
                        Student API unavailable
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="student-modal-footer">
                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={handleCloseAddModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-primary-button"
                  disabled
                  title="Student management API is not available yet"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Student;