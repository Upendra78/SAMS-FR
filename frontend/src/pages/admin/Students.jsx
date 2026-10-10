import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  faBookOpen,
  faCamera,
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
  getAdminStudents,
  getUsers,
  getAdminDepartments,
} from "../../services/adminService";

import {
  enrollStudentFace,
  getFaceRegistrationStatus,
} from "../../services/faceService";

import LiveFaceCapture from "../../components/LiveFaceCapture";

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

const faceErrorMessages = {
  invalid_image:
    "The captured image is invalid. Please capture another image.",

  no_face:
    "No face was detected. Please position the student clearly inside the camera frame.",

  multiple_faces:
    "Multiple faces were detected. Make sure exactly one face is visible.",

  encoding_failed:
    "Face processing failed. Please capture the face again.",

  invalid_encoding:
    "The generated face data was invalid. Please try again.",
};

function Student() {
  // =========================================================
  // STUDENT DATA
  // =========================================================

  const [students, setStudents] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // =========================================================
  // FACE REGISTRATION STATUS
  // =========================================================

  const [faceStatuses, setFaceStatuses] =
    useState({});

  // =========================================================
  // GENERAL UI STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");
  const [department, setDepartment] = useState("All");
  const [program, setProgram] = useState("All");
  const [yearSemester, setYearSemester] =
    useState("All");
  const [status, setStatus] = useState("All");

  // =========================================================
  // STUDENT DETAILS MODAL
  // =========================================================

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  // =========================================================
  // CREATE STUDENT MODAL
  // =========================================================

  const [showCreateStudent, setShowCreateStudent] =
    useState(false);

  const [
    createStudentLoading,
    setCreateStudentLoading,
  ] = useState(false);

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

  // =========================================================
  // FACE ENROLLMENT MODAL
  // =========================================================

  const [showFaceEnrollment, setShowFaceEnrollment] =
    useState(false);

  const [
    faceEnrollmentStudent,
    setFaceEnrollmentStudent,
  ] = useState(null);

  const [
    faceEnrollmentLoading,
    setFaceEnrollmentLoading,
  ] = useState(false);

  const [
    faceEnrollmentError,
    setFaceEnrollmentError,
  ] = useState("");

  const [
    faceEnrollmentSuccess,
    setFaceEnrollmentSuccess,
  ] = useState("");

  const [faceCaptureBlob, setFaceCaptureBlob] =
    useState(null);

  // =========================================================
  // FETCH FACE STATUS FOR ALL STUDENTS
  // =========================================================

  const fetchFaceStatuses = useCallback(
    async (studentList) => {
      if (
        !Array.isArray(studentList) ||
        studentList.length === 0
      ) {
        setFaceStatuses({});
        return;
      }

      const statusEntries = await Promise.all(
        studentList.map(async (student) => {
          const studentId = student?.student_id;

          if (
            studentId === undefined ||
            studentId === null
          ) {
            return null;
          }

          try {
            const response =
              await getFaceRegistrationStatus(
                studentId,
              );

            if (!response?.success) {
              return [
                String(studentId),
                {
                  registered: false,
                  status: "unknown",
                  model_version: null,
                },
              ];
            }

            return [
              String(studentId),
              response.data ?? {
                registered: false,
                status: "unknown",
                model_version: null,
              },
            ];
          } catch {
            return [
              String(studentId),
              {
                registered: false,
                status: "unknown",
                model_version: null,
              },
            ];
          }
        }),
      );

      const validEntries =
        statusEntries.filter(Boolean);

      setFaceStatuses(
        Object.fromEntries(validEntries),
      );
    },
    [],
  );

  // =========================================================
  // FETCH STUDENT + USER DATA
  // =========================================================

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        studentsResponse,
        usersResponse,
      ] = await Promise.all([
        getAdminStudents(),
        getUsers(),
      ]);

      if (!studentsResponse?.success) {
        throw new Error(
          studentsResponse?.message ||
            "Failed to load students.",
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
      setStudentUsers(availableStudentUsers);

      await fetchFaceStatuses(studentData);
    } catch (requestError) {
      setStudents([]);
      setStudentUsers([]);
      setFaceStatuses({});

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load student data.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchFaceStatuses]);

  // =========================================================
  // INITIAL DATA LOAD
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      if (cancelled) {
        return;
      }

      await fetchStudentData();
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [fetchStudentData]);

  useEffect(() => {
    let cancelled = false;

    const fetchDepartments = async () => {
      setDepartmentsLoading(true);

      try {
        const response = await getAdminDepartments();

        if (response?.success && Array.isArray(response.data)) {
          if (!cancelled) {
            setDepartmentOptions(response.data);
          }
        } else {
          throw new Error(
            response?.message || "Failed to load departments."
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch departments:", error);
        }
      } finally {
        if (!cancelled) {
          setDepartmentsLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // FACE STATUS HELPER
  // =========================================================

  function getFaceProfileStatus(studentId) {
    const faceStatus =
      faceStatuses[String(studentId)];

    if (!faceStatus) {
      return "Loading...";
    }

    if (faceStatus.status === "unknown") {
      return "Unavailable";
    }

    return faceStatus.registered
      ? "Registered"
      : "Not Registered";
  }

  // =========================================================
  // SUMMARY METRICS
  // =========================================================

  const metrics = useMemo(() => {
    const knownFaceStatuses = students
      .map((student) => {
        const studentId = student?.student_id;

        if (studentId == null) {
          return null;
        }

        const faceStatus =
          faceStatuses[String(studentId)];

        if (
          !faceStatus ||
          faceStatus.status === "unknown"
        ) {
          return null;
        }

        return faceStatus.registered === true;
      })
      .filter((status) => status !== null);

    return {
      total: students.length,
      faceRegistered: knownFaceStatuses.filter(
        (registered) => registered === true,
      ).length,
      faceNotRegistered: knownFaceStatuses.filter(
        (registered) => registered === false,
      ).length,
      faceStatusPending:
        students.length - knownFaceStatuses.length,
      departments: new Set(
        students
          .map((student) => student?.department_id)
          .filter(
            (departmentId) =>
              departmentId !== undefined &&
              departmentId !== null,
          ),
      ).size,
    };
  }, [students, faceStatuses]);

  // =========================================================
  // FILTER OPTIONS
  // =========================================================

  const departments = useMemo(
    () => [
      "All",
      ...departmentOptions.map((item) => item.department_name),
    ],
    [departmentOptions]
  );

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

  const statuses = [
    "All",
    "Registered",
    "Not Registered",
    "Pending",
  ];

  // =========================================================
  // FILTERED STUDENTS
  // =========================================================

  const filteredStudents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

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
        name
          .toLowerCase()
          .includes(search) ||
        email
          .toLowerCase()
          .includes(search) ||
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

      const faceStatus = faceStatuses[String(student?.student_id)];

      const matchesStatus =
        status === "All" ||
        (status === "Registered" &&
          faceStatus?.status !== "unknown" &&
          faceStatus?.registered === true) ||
        (status === "Not Registered" &&
          faceStatus?.status !== "unknown" &&
          faceStatus?.registered === false) ||
        (status === "Pending" &&
          (!faceStatus || faceStatus.status === "unknown"));

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
    faceStatuses,
    searchTerm,
    department,
    program,
    yearSemester,
    status,
  ]);

  // =========================================================
  // FILTER HANDLERS
  // =========================================================

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

  // =========================================================
  // CREATE STUDENT HANDLERS
  // =========================================================

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

    const hasMissingField =
      requiredFields.some(
        (field) =>
          String(
            createStudentForm[field],
          ).trim() === "",
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

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
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

    if (
      !Number.isInteger(semester) ||
      semester <= 0
    ) {
      setCreateStudentError(
        "Semester must be a valid positive number.",
      );
      return;
    }

    const selectedUser =
      studentUsers.find(
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

      const response =
        await createAdminStudent(payload);

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

  // =========================================================
  // STUDENT DETAILS HANDLERS
  // =========================================================

  function handleViewStudent(student) {
    setSelectedStudent(student);
  }

  function handleCloseStudent() {
    setSelectedStudent(null);
  }

  // =========================================================
  // FACE ENROLLMENT HANDLERS
  // =========================================================

  function handleOpenFaceEnrollment(student) {
    setFaceEnrollmentStudent(student);
    setFaceCaptureBlob(null);
    setFaceEnrollmentError("");
    setFaceEnrollmentSuccess("");
    setShowFaceEnrollment(true);
  }

  function handleCloseFaceEnrollment() {
    if (faceEnrollmentLoading) {
      return;
    }

    setShowFaceEnrollment(false);
    setFaceEnrollmentStudent(null);
    setFaceCaptureBlob(null);
    setFaceEnrollmentError("");
    setFaceEnrollmentSuccess("");
  }

  // =========================================================
  // RECEIVE CAPTURED FACE FROM LIVE CAMERA
  // =========================================================

  function handleFaceCapture(blob) {
    setFaceEnrollmentError("");
    setFaceEnrollmentSuccess("");

    if (!blob) {
      setFaceCaptureBlob(null);

      setFaceEnrollmentError(
        "Unable to capture the student's face.",
      );

      return;
    }

    setFaceCaptureBlob(blob);
  }

  // =========================================================
  // ENROLL CAPTURED FACE
  // =========================================================

  async function handleEnrollFace(event) {
    event.preventDefault();

    setFaceEnrollmentError("");
    setFaceEnrollmentSuccess("");

    if (!faceEnrollmentStudent?.student_id) {
      setFaceEnrollmentError(
        "Student information is missing.",
      );

      return;
    }

    if (!faceCaptureBlob) {
      setFaceEnrollmentError(
        "Please capture the student's face using the camera.",
      );

      return;
    }

    try {
      setFaceEnrollmentLoading(true);

      const response = await enrollStudentFace(
        faceEnrollmentStudent.student_id,
        faceCaptureBlob,
      );

      if (!response?.success) {
        const backendStatus =
          response?.status;

        throw new Error(
          faceErrorMessages[backendStatus] ||
            response?.message ||
            "Face enrollment failed.",
        );
      }

      setFaceEnrollmentSuccess(
        response?.message ||
          "Face enrolled successfully.",
      );

      await fetchFaceStatuses([
        faceEnrollmentStudent,
      ]);
    } catch (requestError) {
      const backendStatus =
        requestError?.response?.data?.status ||
        requestError?.status;

      setFaceEnrollmentError(
        faceErrorMessages[backendStatus] ||
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Face enrollment failed.",
      );
    } finally {
      setFaceEnrollmentLoading(false);
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <section className="student-management-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

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
          onClick={
            handleOpenCreateStudent
          }
        >
          <FontAwesomeIcon
            icon={faUserGraduate}
          />
          Add Student
        </button>
      </header>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="student-summary-grid">
        <article className="student-summary-card student-summary-blue">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faUserGraduate}
            />
          </div>

          <span>Total Students</span>

          <strong>
            {loading
              ? "..."
              : metrics.total}
          </strong>
        </article>

        <article className="student-summary-card student-summary-green">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faUsers}
            />
          </div>

          <span>Face Registered</span>

          <strong>
            {loading
              ? "..."
              : metrics.faceRegistered}
          </strong>

          <small>
            Students with registered face profiles
          </small>
        </article>

        <article className="student-summary-card student-summary-red">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faCircleExclamation}
            />
          </div>

          <span>Face Not Registered</span>

          <strong>
            {loading
              ? "..."
              : metrics.faceNotRegistered}
          </strong>

          <small>
            Students without registered face profiles
          </small>
        </article>

        <article className="student-summary-card student-summary-purple">
          <div className="student-summary-icon">
            <FontAwesomeIcon
              icon={faBookOpen}
            />
          </div>

          <span>Departments</span>

          <strong>
            {loading
              ? "..."
              : metrics.departments}
          </strong>

          <small>
            Based on student records
          </small>
        </article>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

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
              <option
                key={item}
                value={item}
              >
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
              <option
                key={item}
                value={item}
              >
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
            {yearSemesters.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "All"
                    ? item
                    : `Semester ${item}`}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="student-filter-field">
          <label htmlFor="student-status">
            Face Registration
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
              <option
                key={item}
                value={item}
              >
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

      {/* =====================================================
          STUDENT TABLE
      ====================================================== */}

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

              <h2>
                Loading students
              </h2>

              <p>
                Fetching student records
                from the Admin Students
                API.
              </p>
            </div>
          ) : error ? (
            <div className="student-empty-state">
              <div className="student-empty-icon student-error-icon">
                <FontAwesomeIcon
                  icon={
                    faCircleExclamation
                  }
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

              <h2>
                No students available
              </h2>

              <p>
                No student records were
                returned by the Admin
                Students API.
              </p>
            </div>
          ) : (
            <>
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>
                      Enrollment No.
                    </th>
                    <th>
                      Department
                    </th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>
                      Academic Year
                    </th>
                    <th>
                      Face Profile
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => {
                      const faceStatus =
                        getFaceProfileStatus(
                          student.student_id,
                        );

                      const isRegistered =
                        faceStatus ===
                        "Registered";

                      return (
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
                            {student.email ||
                              "N/A"}
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
                                isRegistered
                                  ? "student-face-status-registered"
                                  : "student-face-status-not-registered"
                              }`}
                            >
                              {faceStatus}
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
                      );
                    },
                  )}
                </tbody>
              </table>

              {filteredStudents.length ===
                0 && (
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
                    Try adjusting your
                    search terms or
                    filters.
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
                {
                  filteredStudents.length
                }{" "}
                of {students.length}{" "}
                students
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

      {/* =====================================================
          INTEGRATION NOTICE
      ====================================================== */}

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
            Program, status Pending,
            from backend data.
          </span>
        </div>

        <span className="student-integration-badge">
          Integrated
        </span>
      </div>

      {/* =====================================================
          CREATE STUDENT MODAL
      ====================================================== */}

      {showCreateStudent && (
        <div
          className="student-modal-overlay"
          role="presentation"
          onClick={
            handleCloseCreateStudent
          }
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
                    icon={
                      faUserGraduate
                    }
                  />
                </div>

                <div>
                  <span>
                    Admin Portal
                  </span>

                  <h2 id="create-student-modal-title">
                    Add Student
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="student-modal-close"
                onClick={
                  handleCloseCreateStudent
                }
                disabled={
                  createStudentLoading
                }
                aria-label="Close create student form"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>
            </div>

            <div className="student-form-info">
              <FontAwesomeIcon
                icon={faCircleInfo}
              />

              <span>
                Select an existing User
                account with the STUDENT
                role. Creating the User
                account is handled
                separately in Users
                Management.
              </span>
            </div>

            <form
              className="student-create-form"
              onSubmit={
                handleCreateStudent
              }
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

                    {studentUsers.map(
                      (user) => (
                        <option
                          key={
                            user.user_id
                          }
                          value={
                            user.user_id
                          }
                        >
                          {user.name} —{" "}
                          {user.email} (User
                          ID:{" "}
                          {
                            user.user_id
                          }
                          )
                        </option>
                      ),
                    )}
                  </select>

                  {studentUsers.length ===
                    0 && (
                    <small>
                      No available
                      STUDENT users.
                      Create a STUDENT
                      account first in
                      Users Management.
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
                    Department *
                  </label>

                  <select
                    id="create-student-department"
                    name="department_id"
                    value={createStudentForm.department_id}
                    onChange={handleCreateStudentChange}
                    disabled={createStudentLoading || departmentsLoading}
                    required
                  >
                    <option value="">
                      {departmentsLoading
                        ? "Loading departments..."
                        : "Select a Department"}
                    </option>

                    {departmentOptions.map((item) => (
                      <option
                        key={item.department_id}
                        value={item.department_id}
                      >
                        {item.department_name}
                        {item.department_code
                          ? ` (${item.department_code})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {!departmentsLoading && departmentOptions.length === 0 && (
                    <small>
                      No departments are available. Check the admin departments API.
                    </small>
                  )}
                </div>
              </div>

              {createStudentError && (
                <div
                  className="student-form-error"
                  role="alert"
                >
                  <FontAwesomeIcon
                    icon={
                      faCircleExclamation
                    }
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
                    studentUsers.length ===
                      0
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

      {/* =====================================================
          STUDENT DETAILS MODAL
      ====================================================== */}

      {selectedStudent && (
        <div
          className="student-modal-overlay"
          role="presentation"
          onClick={
            handleCloseStudent
          }
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
                onClick={
                  handleCloseStudent
                }
                aria-label="Close student details"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>
            </div>

            <div className="student-details-grid">
              <article className="student-detail-card">
                <span>
                  Student ID
                </span>

                <strong>
                  {
                    selectedStudent.student_id ??
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>User ID</span>

                <strong>
                  {
                    selectedStudent.user_id ??
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Name</span>

                <strong>
                  {
                    selectedStudent.name ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>Email</span>

                <strong>
                  {
                    selectedStudent.email ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Enrollment Number
                </span>

                <strong>
                  {
                    selectedStudent.enrollment_no ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Department
                </span>

                <strong>
                  {
                    selectedStudent.department_name ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Department Code
                </span>

                <strong>
                  {
                    selectedStudent.department_code ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Semester
                </span>

                <strong>
                  {selectedStudent.semester !==
                  undefined
                    ? `Semester ${selectedStudent.semester}`
                    : "N/A"}
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Section
                </span>

                <strong>
                  {
                    selectedStudent.section ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Academic Year
                </span>

                <strong>
                  {
                    selectedStudent.academic_year ||
                    "N/A"
                  }
                </strong>
              </article>

              <article className="student-detail-card">
                <span>
                  Face Profile
                </span>

                <strong>
                  {getFaceProfileStatus(
                    selectedStudent.student_id,
                  )}
                </strong>
              </article>
            </div>

            <div className="student-face-management-section">
              <div className="student-face-management-header">
                <div>
                  <strong>
                    Face Recognition
                  </strong>

                  <span>
                    Register the student
                    using the live camera.
                  </span>
                </div>

                <span
                  className={`student-face-status ${
                    getFaceProfileStatus(
                      selectedStudent.student_id,
                    ) ===
                    "Registered"
                      ? "student-face-status-registered"
                      : "student-face-status-not-registered"
                  }`}
                >
                  {getFaceProfileStatus(
                    selectedStudent.student_id,
                  )}
                </span>
              </div>

              <div className="student-face-management-content">
                <div className="student-face-management-icon">
                  <FontAwesomeIcon
                    icon={faCamera}
                  />
                </div>

                <div>
                  <strong>
                    {getFaceProfileStatus(
                      selectedStudent.student_id,
                    ) ===
                    "Registered"
                      ? "Face profile is registered"
                      : "No face profile registered"}
                  </strong>

                  <p>
                    {getFaceProfileStatus(
                      selectedStudent.student_id,
                    ) ===
                    "Registered"
                      ? "You can replace the existing face profile using the live camera."
                      : "Register the student's face using the live camera to enable face recognition attendance."}
                  </p>
                </div>

                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() =>
                    handleOpenFaceEnrollment(
                      selectedStudent,
                    )
                  }
                >
                  <FontAwesomeIcon
                    icon={faCamera}
                  />

                  {getFaceProfileStatus(
                    selectedStudent.student_id,
                  ) ===
                  "Registered"
                    ? "Replace Face"
                    : "Register Face"}
                </button>
              </div>
            </div>

            <div className="student-pending-section">
              <div className="student-pending-section-icon">
                <FontAwesomeIcon icon={faCircleInfo} />
              </div>

              <div>
                <strong>Attendance Summary</strong>

                <p>
                  Total Sessions:{" "}
                  {selectedStudent.attendance_summary?.total_sessions ?? 0}
                </p>

                <p>
                  Present Sessions:{" "}
                  {selectedStudent.attendance_summary?.present_sessions ?? 0}
                </p>

                <p>
                  Absent Sessions:{" "}
                  {selectedStudent.attendance_summary?.absent_sessions ?? 0}
                </p>

                <p>
                  Attendance Percentage:{" "}
                  {selectedStudent.attendance_summary?.attendance_percentage ?? 0}%
                </p>
              </div>
            </div>

            <div className="student-modal-footer">
              <button
                type="button"
                className="student-secondary-button"
                onClick={
                  handleCloseStudent
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          LIVE FACE ENROLLMENT MODAL
      ====================================================== */}

      {showFaceEnrollment &&
        faceEnrollmentStudent && (
          <div
            className="student-modal-overlay"
            role="presentation"
            onClick={handleCloseFaceEnrollment}
          >
            <div
              className="student-modal student-face-enrollment-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="face-enrollment-modal-title"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="student-modal-header">
                <div className="student-modal-profile">
                  <div className="student-modal-avatar">
                    <FontAwesomeIcon
                      icon={faCamera}
                    />
                  </div>

                  <div>
                    <span>
                      Face Recognition
                    </span>

                    <h2 id="face-enrollment-modal-title">
                      {getFaceProfileStatus(
                        faceEnrollmentStudent.student_id,
                      ) === "Registered"
                        ? "Replace Face"
                        : "Register Face"}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  className="student-modal-close"
                  onClick={
                    handleCloseFaceEnrollment
                  }
                  disabled={
                    faceEnrollmentLoading
                  }
                  aria-label="Close face enrollment"
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                  />
                </button>
              </div>

              <div className="student-form-info">
                <FontAwesomeIcon
                  icon={faCircleInfo}
                />

                <span>
                  Registering face for{" "}
                  <strong>
                    {faceEnrollmentStudent.name}
                  </strong>{" "}
                  — Student ID{" "}
                  <strong>
                    {
                      faceEnrollmentStudent.student_id
                    }
                  </strong>
                  .
                </span>
              </div>

              <form
                className="student-create-form"
                onSubmit={handleEnrollFace}
              >
                <div className="student-live-camera-section">
                  <div className="student-live-camera-header">
                    <div>
                      <strong>
                        Live Camera
                      </strong>

                      <span>
                        Position exactly one face
                        inside the camera frame.
                      </span>
                    </div>
                  </div>

                  <LiveFaceCapture
                    onCapture={
                      handleFaceCapture
                    }
                    disabled={
                      faceEnrollmentLoading
                    }
                  />
                </div>

                {faceEnrollmentError && (
                  <div
                    className="student-form-error"
                    role="alert"
                  >
                    <FontAwesomeIcon
                      icon={
                        faCircleExclamation
                      }
                    />

                    <span>
                      {faceEnrollmentError}
                    </span>
                  </div>
                )}

                {faceEnrollmentSuccess && (
                  <div
                    className="student-form-success"
                    role="status"
                  >
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                    />

                    <span>
                      {faceEnrollmentSuccess}
                    </span>
                  </div>
                )}

                <div className="student-face-guidelines">
                  <strong>
                    Face registration requirements
                  </strong>

                  <ul>
                    <li>
                      Use the live camera to capture
                      the student's face.
                    </li>

                    <li>
                      Keep exactly one face inside
                      the camera frame.
                    </li>

                    <li>
                      Face the camera directly.
                    </li>

                    <li>
                      Avoid heavy blur, darkness or
                      face obstruction.
                    </li>

                    <li>
                      The backend will validate and
                      process the captured face.
                    </li>
                  </ul>
                </div>

                <div className="student-modal-footer">
                  <button
                    type="button"
                    className="student-secondary-button"
                    onClick={
                      handleCloseFaceEnrollment
                    }
                    disabled={
                      faceEnrollmentLoading
                    }
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    className="student-primary-button"
                    disabled={
                      faceEnrollmentLoading ||
                      !faceCaptureBlob
                    }
                  >
                    <FontAwesomeIcon
                      icon={
                        faceEnrollmentLoading
                          ? faSpinner
                          : faCamera
                      }
                      spin={
                        faceEnrollmentLoading
                      }
                    />

                    {faceEnrollmentLoading
                      ? "Registering..."
                      : "Register Face"}
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