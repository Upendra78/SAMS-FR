import { useEffect, useMemo, useState } from "react";

import {
  faBookOpen,
  faCircleExclamation,
  faCircleInfo,
  faMagnifyingGlass,
  faRotateRight,
  faSpinner,
  faUserGraduate,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { getUsers } from "../../services/adminService";

import "./Student.css";

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

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadStudents() {
      try {
        const response = await getUsers();

        if (!mounted) {
          return;
        }

        const users = Array.isArray(response?.data)
          ? response.data
          : [];

        const studentUsers = users
          .filter(
            (user) =>
              String(user?.role || "").toUpperCase() ===
              "STUDENT",
          )
          .map((user) => ({
            studentId:
              user?.user_id !== undefined &&
              user?.user_id !== null
                ? String(user.user_id)
                : "N/A",
            name: user?.name || "N/A",
            email: user?.email || "N/A",
            department: null,
            program: null,
            yearSemester: null,
            status: null,
          }));

        setStudents(studentUsers);
        setError("");
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setStudents([]);

        setError(
          requestError?.response?.data?.message ||
            "Failed to load students.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => ({
      total: students.length,
      active: null,
      inactive: null,
      departments: null,
    }),
    [students],
  );

  const departments = ["All"];
  const programs = ["All"];
  const yearSemesters = ["All"];
  const statuses = ["All"];

  const filteredStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !search ||
        student.studentId
          .toLowerCase()
          .includes(search) ||
        student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search);

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

  function handleClearFilters() {
    setSearchTerm("");
    setDepartment("All");
    setProgram("All");
    setYearSemester("All");
    setStatus("All");
  }

  function handleViewStudent(student) {
    setSelectedStudent(student);
  }

  function handleCloseStudent() {
    setSelectedStudent(null);
  }

  return (
    <section className="student-management-page">
      {/* ---------- Header ---------- */}

      <header className="student-page-header">
        <div>
          <span className="student-eyebrow">
            Admin Portal
          </span>

          <h1>Student Management</h1>

          <p>
            View student accounts and available
            academic information.
          </p>
        </div>
      </header>

      {/* ---------- Summary ---------- */}

      <div className="student-summary-grid">
        <article className="student-summary-card student-summary-blue">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faUserGraduate}
            />
          </div>

          <span>Total Students</span>

          <strong>
            {loading ? "..." : metrics.total}
          </strong>
        </article>

        <article className="student-summary-card student-summary-green">
          <div className="student-summary-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <span>Active</span>

          <strong>N/A</strong>

          <small>API integration pending</small>
        </article>

        <article className="student-summary-card student-summary-red">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faCircleExclamation}
            />
          </div>

          <span>Inactive</span>

          <strong>N/A</strong>

          <small>API integration pending</small>
        </article>

        <article className="student-summary-card student-summary-purple">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faBookOpen}
            />
          </div>

          <span>Departments</span>

          <strong>N/A</strong>

          <small>API integration pending</small>
        </article>
      </div>

      {/* ---------- Filters ---------- */}

      <div className="student-filter-panel">
        <div className="student-search-field">
          <label htmlFor="student-search">
            Search Student
          </label>

          <div className="student-input-with-icon">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              aria-hidden="true"
            />

            <input
              id="student-search"
              type="search"
              placeholder="Search by student ID, name or email..."
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
          <FontAwesomeIcon
            icon={faRotateRight}
          />

          Clear Filters
        </button>
      </div>

      {/* ---------- Student Table ---------- */}

      <div className="student-table-card">
        <div className="student-table-wrapper">
          {loading ? (
            <div className="student-empty-state">
              <div className="student-empty-icon">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                />
              </div>

              <h2>Loading students</h2>

              <p>
                Fetching student accounts from
                the confirmed admin users API.
              </p>
            </div>
          ) : error ? (
            <div className="student-empty-state">
              <div className="student-empty-icon student-error-icon">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                />
              </div>

              <h2>Unable to load students</h2>

              <p>{error}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="student-empty-state">
              <div className="student-empty-icon">
                <FontAwesomeIcon
                  icon={faUserGraduate}
                />
              </div>

              <h2>No students available</h2>

              <p>
                No student accounts were returned
                by the current admin users API.
              </p>
            </div>
          ) : (
            <>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Program</th>
                    <th>Year / Semester</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student.studentId}
                      >
                        <td>
                          <div className="student-identity">
                            <div className="student-avatar">
                              {getInitials(
                                student.name,
                              )}
                            </div>

                            <div>
                              <strong>
                                {student.name}
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  student.studentId
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {student.email}
                        </td>

                        <td>
                          <span className="student-pending-text">
                            API integration pending
                          </span>
                        </td>

                        <td>
                          <span className="student-pending-text">
                            API integration pending
                          </span>
                        </td>

                        <td>
                          <span className="student-pending-text">
                            API integration pending
                          </span>
                        </td>

                        <td>
                          <span className="student-pending-badge">
                            <FontAwesomeIcon
                              icon={faCircleInfo}
                            />

                            API pending
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="student-view-button"
                            onClick={() =>
                              handleViewStudent(
                                student,
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div className="student-empty-state student-search-empty">
                  <div className="student-empty-icon">
                    <FontAwesomeIcon
                      icon={
                        faMagnifyingGlass
                      }
                    />
                  </div>

                  <h2>
                    No matching students
                  </h2>

                  <p>
                    Try adjusting your search
                    terms or filters.
                  </p>

                  <button
                    type="button"
                    className="student-secondary-button"
                    onClick={
                      handleClearFilters
                    }
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && !error && students.length > 0 && (
          <div className="student-pagination">
            <span>
              Showing{" "}
              {filteredStudents.length} of{" "}
              {students.length} students
            </span>

            <div className="student-pagination-controls">
              <button
                type="button"
                disabled
              >
                Previous
              </button>

              <button
                type="button"
                className="student-page-number"
                disabled
              >
                1
              </button>

              <button
                type="button"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Integration Notice ---------- */}

      <div className="student-integration-notice">
        <div className="student-integration-icon">
          <FontAwesomeIcon
            icon={faCircleInfo}
          />
        </div>

        <div>
          <strong>
            Student account listing connected
          </strong>

          <span>
            Name, email, role and user ID are
            loaded from the confirmed admin
            users API. Department, program,
            year/semester, status, student
            profile and face-profile mapping
            require additional backend APIs.
          </span>
        </div>

        <span className="student-integration-badge">
          Partially Integrated
        </span>
      </div>

      {/* ---------- Student Details Modal ---------- */}

      {selectedStudent && (
        <div
          className="student-modal-overlay"
          role="presentation"
          onClick={handleCloseStudent}
        >
          <div
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="student-modal-header">
              <div className="student-modal-profile">
                <div className="student-modal-avatar">
                  {getInitials(
                    selectedStudent.name,
                  )}
                </div>

                <div>
                  <span>
                    Student Account
                  </span>

                  <h2 id="student-modal-title">
                    {selectedStudent.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={handleCloseStudent}
                aria-label="Close student details"
              >
                ×
              </button>
            </div>

            <div className="student-details-grid">
              <article className="student-detail-card">
                <span>Student ID</span>

                <strong>
                  {selectedStudent.studentId}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Name</span>

                <strong>
                  {selectedStudent.name}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Email</span>

                <strong>
                  {selectedStudent.email}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Role</span>

                <strong>STUDENT</strong>
              </article>
            </div>

            <div className="student-pending-section">
              <div className="student-pending-section-icon">
                <FontAwesomeIcon
                  icon={faCircleInfo}
                />
              </div>

              <div>
                <strong>
                  Additional student information
                </strong>

                <p>
                  Department, program,
                  year/semester, student status,
                  attendance summary and face
                  registration details are not
                  available from the currently
                  confirmed Admin Student API.
                </p>

                <span>
                  API integration pending
                </span>
              </div>
            </div>

            <div className="student-modal-footer">
              <button
                type="button"
                className="student-secondary-button"
                onClick={handleCloseStudent}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Student;