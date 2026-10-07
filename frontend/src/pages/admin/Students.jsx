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
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  createAdminStudent,
  getAdminFaceProfiles,
  getAdminStudents,
  getUsers,
} from "../../services/adminService";
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
  const [faceProfiles, setFaceProfiles] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [program, setProgram] = useState("All");
  const [yearSemester, setYearSemester] = useState("All");
  const [status, setStatus] = useState("All");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [showCreateStudent, setShowCreateStudent] =
    useState(false);

  const [createStudentLoading, setCreateStudentLoading] =
    useState(false);

  const [createStudentError, setCreateStudentError] =
    useState("");

  const [createStudentForm, setCreateStudentForm] =
    useState({
      user_id: "",
      enrollment_no: "",
      semester: "",
      section: "",
      academic_year: "",
      department_id: "",
    });

  const fetchStudentData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        studentsResponse,
        faceProfilesResponse,
        usersResponse,
      ] = await Promise.all([
        getAdminStudents(),
        getAdminFaceProfiles(),
        getUsers(),
      ]);

      if (!studentsResponse?.success) {
        throw new Error(
          studentsResponse?.message ||
            "Failed to load students.",
        );
      }

      if (!faceProfilesResponse?.success) {
        throw new Error(
          faceProfilesResponse?.message ||
            "Failed to load face profiles.",
        );
      }

      if (!usersResponse?.success) {
        throw new Error(
          usersResponse?.message ||
            "Failed to load users.",
        );
      }

      const studentData = Array.isArray(
        studentsResponse.data,
      )
        ? studentsResponse.data
        : [];

      const faceProfileData = Array.isArray(
        faceProfilesResponse.data,
      )
        ? faceProfilesResponse.data
        : [];

      const usersData = Array.isArray(
        usersResponse.data,
      )
        ? usersResponse.data
        : [];

      const existingStudentUserIds = new Set(
        studentData
          .map((student) => student?.user_id)
          .filter(
            (userId) =>
              userId !== undefined &&
              userId !== null,
          )
          .map((userId) => String(userId)),
      );

      const availableStudentUsers = usersData
        .filter(
          (user) =>
            String(user?.role || "").toUpperCase() ===
            "STUDENT",
        )
        .filter(
          (user) =>
            !existingStudentUserIds.has(
              String(user?.user_id),
            ),
        );

      setStudents(studentData);
      setFaceProfiles(faceProfileData);
      setStudentUsers(availableStudentUsers);
    } catch (requestError) {
      setStudents([]);
      setFaceProfiles([]);
      setStudentUsers([]);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load student data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      if (!mounted) {
        return;
      }

      await fetchStudentData();
    }

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, []);

  const faceProfilesByStudentId = useMemo(() => {
    const profileMap = new Map();

    faceProfiles.forEach((profile) => {
      if (
        profile?.student_id !== undefined &&
        profile?.student_id !== null
      ) {
        profileMap.set(
          String(profile.student_id),
          profile,
        );
      }
    });

    return profileMap;
  }, [faceProfiles]);

  function getFaceProfileStatus(studentId) {
    const profile = faceProfilesByStudentId.get(
      String(studentId),
    );

    return profile?.is_active === true
      ? "Registered"
      : "Not Registered";
  }

  const metrics = useMemo(
    () => ({
      total: students.length,
      active: null,
      inactive: null,
      departments: new Set(
        students
          .map(
            (student) =>
              student?.department_id,
          )
          .filter(
            (departmentId) =>
              departmentId !== undefined &&
              departmentId !== null,
          ),
      ).size,
    }),
    [students],
  );

  const departments = useMemo(() => {
    const values = students
      .map(
        (student) =>
          student?.department_name,
      )
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [students]);

  const programs = ["All"];

  const yearSemesters = useMemo(() => {
    const values = students
      .map((student) =>
        student?.semester !== undefined &&
        student?.semester !== null
          ? String(student.semester)
          : null,
      )
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [students]);

  const statuses = ["All"];

  const filteredStudents = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const studentId =
        student?.student_id !== undefined &&
        student?.student_id !== null
          ? String(student.student_id)
          : "";

      const name = String(
        student?.name || "",
      );

      const email = String(
        student?.email || "",
      );

      const enrollmentNo = String(
        student?.enrollment_no || "",
      );

      const matchesSearch =
        !search ||
        studentId
          .toLowerCase()
          .includes(search) ||
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        enrollmentNo
          .toLowerCase()
          .includes(search);

      const matchesDepartment =
        department === "All" ||
        student?.department_name ===
          department;

      const matchesProgram =
        program === "All";

      const matchesYearSemester =
        yearSemester === "All" ||
        String(student?.semester) ===
          yearSemester;

      const matchesStatus =
        status === "All";

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

  function handleCreateStudentChange(event) {
    const { name, value } = event.target;

    setCreateStudentForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleOpenCreateStudent() {
    setCreateStudentError("");

    setCreateStudentForm({
      user_id: "",
      enrollment_no: "",
      semester: "",
      section: "",
      academic_year: "",
      department_id: "",
    });

    setShowCreateStudent(true);
  }

  function handleCloseCreateStudent() {
    if (createStudentLoading) {
      return;
    }

    setShowCreateStudent(false);
    setCreateStudentError("");
  }

  async function handleCreateStudent(event) {
    event.preventDefault();

    setCreateStudentError("");

    const requiredFields = [
      "user_id",
      "enrollment_no",
      "semester",
      "section",
      "academic_year",
      "department_id",
    ];

    const hasMissingField = requiredFields.some(
      (field) =>
        String(createStudentForm[field]).trim() === "",
    );

    if (hasMissingField) {
      setCreateStudentError(
        "Please fill in all required fields.",
      );
      return;
    }

    const userId = Number(
      createStudentForm.user_id,
    );

    const departmentId = Number(
      createStudentForm.department_id,
    );

    const semester = Number(
      createStudentForm.semester,
    );

    if (!Number.isInteger(userId) || userId <= 0) {
      setCreateStudentError(
        "Please select a valid Student User.",
      );
      return;
    }

    if (
      !Number.isInteger(departmentId) ||
      departmentId <= 0
    ) {
      setCreateStudentError(
        "Department ID must be a valid positive number.",
      );
      return;
    }

    if (!Number.isInteger(semester) || semester <= 0) {
      setCreateStudentError(
        "Semester must be a valid positive number.",
      );
      return;
    }

    const selectedUser = studentUsers.find(
      (user) =>
        Number(user?.user_id) === userId,
    );

    if (!selectedUser) {
      setCreateStudentError(
        "Please select an available Student User.",
      );
      return;
    }

    const payload = {
      user_id: userId,
      enrollment_no:
        createStudentForm.enrollment_no.trim(),
      semester,
      section:
        createStudentForm.section.trim(),
      academic_year:
        createStudentForm.academic_year.trim(),
      department_id: departmentId,
    };

    try {
      setCreateStudentLoading(true);

      const response = await createAdminStudent(
        payload,
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to create student profile.",
        );
      }

      await fetchStudentData();

      setShowCreateStudent(false);

      setCreateStudentForm({
        user_id: "",
        enrollment_no: "",
        semester: "",
        section: "",
        academic_year: "",
        department_id: "",
      });
    } catch (requestError) {
      setCreateStudentError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to create student profile.",
      );
    } finally {
      setCreateStudentLoading(false);
    }
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
            View and manage student academic
            information.
          </p>
        </div>

        <button
          type="button"
          className="student-primary-button"
          onClick={handleOpenCreateStudent}
        >
          <FontAwesomeIcon icon={faUserGraduate} />
          Add Student
        </button>
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

          <strong>
            {loading ? "..." : metrics.departments}
          </strong>

          <small>
            Based on student records
          </small>
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
              placeholder="Search by student ID, name, email or enrollment number..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
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
              setDepartment(
                event.target.value,
              )
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
              setProgram(
                event.target.value,
              )
            }
          >
            {programs.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <small>
            API integration pending
          </small>
        </div>

        <div className="student-filter-field">
          <label htmlFor="student-year">
            Year / Semester
          </label>

          <select
            id="student-year"
            value={yearSemester}
            onChange={(event) =>
              setYearSemester(
                event.target.value,
              )
            }
          >
            {yearSemesters.map((item) => (
              <option key={item} value={item}>
                {item === "All"
                  ? item
                  : `Semester ${item}`}
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
              setStatus(
                event.target.value,
              )
            }
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <small>
            API integration pending
          </small>
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
                Fetching student records from
                the Admin Students API.
              </p>
            </div>
          ) : error ? (
            <div className="student-empty-state">
              <div className="student-empty-icon student-error-icon">
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                />
              </div>

              <h2>
                Unable to load students
              </h2>

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
                No student records were returned
                by the Admin Students API.
              </p>
            </div>
          ) : (
            <>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Enrollment No.</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Academic Year</th>
                    <th>Face Profile</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.student_id
                        }
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
                                {student.name ||
                                  "N/A"}
                              </strong>

                              <span>
                                ID:{" "}
                                {student.student_id ??
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {student.email || "N/A"}
                        </td>

                        <td>
                          {student.enrollment_no ||
                            "N/A"}
                        </td>

                        <td>
                          <strong>
                            {student.department_name ||
                              "N/A"}
                          </strong>

                          {student.department_code && (
                            <span className="student-table-subtext">
                              {
                                student.department_code
                              }
                            </span>
                          )}
                        </td>

                        <td>
                          {student.semester !==
                          undefined
                            ? `Semester ${student.semester}`
                            : "N/A"}
                        </td>

                        <td>
                          {student.section ||
                            "N/A"}
                        </td>

                        <td>
                          {student.academic_year ||
                            "N/A"}
                        </td>

                        <td>
                          <span
                            className={`student-face-status ${
                              getFaceProfileStatus(
                                student.student_id,
                              ) === "Registered"
                                ? "student-face-status-registered"
                                : "student-face-status-not-registered"
                            }`}
                          >
                            {getFaceProfileStatus(
                              student.student_id,
                            )}
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

        {!loading &&
          !error &&
          students.length > 0 && (
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
            Student records connected
          </strong>

          <span>
            Student records and available Student
            User accounts are loaded from the
            confirmed Admin APIs. Program, status
            and department listing require
            additional backend data.
          </span>
        </div>

        <span className="student-integration-badge">
          Integrated
        </span>
      </div>

      {/* ---------- Create Student Modal ---------- */}

      {showCreateStudent && (
        <div
          className="student-modal-overlay"
          role="presentation"
          onClick={handleCloseCreateStudent}
        >
          <div
            className="student-modal student-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-student-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="student-modal-header">
              <div className="student-modal-profile">
                <div className="student-modal-avatar">
                  <FontAwesomeIcon
                    icon={faUserGraduate}
                  />
                </div>

                <div>
                  <span>Admin Portal</span>

                  <h2 id="create-student-modal-title">
                    Add Student
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={handleCloseCreateStudent}
                disabled={createStudentLoading}
                aria-label="Close create student form"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="student-form-info">
              <FontAwesomeIcon
                icon={faCircleInfo}
              />

              <span>
                Select an existing User account with
                the STUDENT role. Creating the User
                account is handled separately in Users
                Management.
              </span>
            </div>

            <form
              className="student-create-form"
              onSubmit={handleCreateStudent}
            >
              <div className="student-form-grid">
                <div className="student-form-field">
                  <label htmlFor="create-student-user">
                    Student User *
                  </label>

                  <select
                    id="create-student-user"
                    name="user_id"
                    value={
                      createStudentForm.user_id
                    }
                    onChange={
                      handleCreateStudentChange
                    }
                    disabled={
                      createStudentLoading
                    }
                    required
                  >
                    <option value="">
                      Select a Student User
                    </option>

                    {studentUsers.map((user) => (
                      <option
                        key={user.user_id}
                        value={user.user_id}
                      >
                        {user.name} — {user.email}{" "}
                        (User ID: {user.user_id})
                      </option>
                    ))}
                  </select>

                  {studentUsers.length === 0 && (
                    <small>
                      No available STUDENT users.
                      Create a STUDENT account first
                      in Users Management.
                    </small>
                  )}
                </div>

                <div className="student-form-field">
                  <label htmlFor="create-student-enrollment">
                    Enrollment Number *
                  </label>

                  <input
                    id="create-student-enrollment"
                    name="enrollment_no"
                    type="text"
                    value={
                      createStudentForm.enrollment_no
                    }
                    onChange={
                      handleCreateStudentChange
                    }
                    disabled={
                      createStudentLoading
                    }
                    required
                  />
                </div>

                <div className="student-form-field">
                  <label htmlFor="create-student-semester">
                    Semester *
                  </label>

                  <input
                    id="create-student-semester"
                    name="semester"
                    type="number"
                    min="1"
                    value={
                      createStudentForm.semester
                    }
                    onChange={
                      handleCreateStudentChange
                    }
                    disabled={
                      createStudentLoading
                    }
                    required
                  />
                </div>

                <div className="student-form-field">
                  <label htmlFor="create-student-section">
                    Section *
                  </label>

                  <input
                    id="create-student-section"
                    name="section"
                    type="text"
                    value={
                      createStudentForm.section
                    }
                    onChange={
                      handleCreateStudentChange
                    }
                    disabled={
                      createStudentLoading
                    }
                    required
                  />
                </div>

                <div className="student-form-field">
                  <label htmlFor="create-student-academic-year">
                    Academic Year *
                  </label>

                  <input
                    id="create-student-academic-year"
                    name="academic_year"
                    type="text"
                    placeholder="e.g. 2026-27"
                    value={
                      createStudentForm.academic_year
                    }
                    onChange={
                      handleCreateStudentChange
                    }
                    disabled={
                      createStudentLoading
                    }
                    required
                  />
                </div>

                <div className="student-form-field">
                  <label htmlFor="create-student-department">
                    Department ID *
                  </label>

                  <input
                    id="create-student-department"
                    name="department_id"
                    type="number"
                    min="1"
                    value={
                      createStudentForm.department_id
                    }
                    onChange={
                      handleCreateStudentChange
                    }
                    disabled={
                      createStudentLoading
                    }
                    required
                  />

                  <small>
                    Department listing API is not
                    currently available. Enter the
                    confirmed Department ID.
                  </small>
                </div>
              </div>

              {createStudentError && (
                <div
                  className="student-form-error"
                  role="alert"
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                  />

                  <span>
                    {createStudentError}
                  </span>
                </div>
              )}

              <div className="student-modal-footer">
                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={
                    handleCloseCreateStudent
                  }
                  disabled={
                    createStudentLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-primary-button"
                  disabled={
                    createStudentLoading ||
                    studentUsers.length === 0
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      createStudentLoading
                        ? faSpinner
                        : faUserGraduate
                    }
                    spin={
                      createStudentLoading
                    }
                  />

                  {createStudentLoading
                    ? "Creating..."
                    : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="student-details-grid">
              <article className="student-detail-card">
                <span>Student ID</span>

                <strong>
                  {selectedStudent.student_id ??
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>User ID</span>

                <strong>
                  {selectedStudent.user_id ??
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Name</span>

                <strong>
                  {selectedStudent.name ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Email</span>

                <strong>
                  {selectedStudent.email ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Enrollment Number</span>

                <strong>
                  {selectedStudent.enrollment_no ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Department</span>

                <strong>
                  {selectedStudent.department_name ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Department Code</span>

                <strong>
                  {selectedStudent.department_code ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Semester</span>

                <strong>
                  {selectedStudent.semester !==
                  undefined
                    ? `Semester ${selectedStudent.semester}`
                    : "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Section</span>

                <strong>
                  {selectedStudent.section ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Academic Year</span>

                <strong>
                  {selectedStudent.academic_year ||
                    "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Face Profile</span>

                <strong>
                  {getFaceProfileStatus(
                    selectedStudent.student_id,
                  )}
                </strong>
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
                  Program, account status and
                  attendance summary are not
                  provided by the confirmed
                  Admin Students API.
                </p>
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