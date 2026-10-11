
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  faBook,
  faBookOpen,
  faGraduationCap,
  faChalkboardTeacher,
  faPlus,
  faCheck,
  faCircleExclamation,
  faCircleInfo,
  faXmark,
  faSpinner,
  faTrash,
  faPen,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  createAdminEnrollment,
  deleteAdminEnrollment,
  getAdminEnrollments,
} from "../../services/enrollmentService";

import {
  getAdminCourses,
  createAdminCourse,
  getAdminDepartments,
  getAdminCourseOfferings,
  getAdminFaculty,
  createAdminCourseOffering,
  updateAdminCourseOffering,
  deleteAdminCourseOffering,
} from "../../services/adminService";

import "./AcademicManagement.css";

const TABS = [
  { id: "courses", label: "Courses", icon: faBook },
  { id: "offerings", label: "Course Offerings", icon: faBookOpen },
  { id: "enrollments", label: "Enrollments", icon: faGraduationCap },
  { id: "assignments", label: "Assignments", icon: faChalkboardTeacher },
];

const EMPTY_COURSE_FORM = {
  course_code: "",
  course_name: "",
  department_id: "",
  semester: "",
  credits: "",
};

const EMPTY_OFFERING_FORM = {
  course_id: "",
  faculty_id: "",
  academic_year: "",
  semester: "",
  section: "",
  room: "",
};

const EMPTY_ENROLLMENT_FORM = {
  studentId: "",
  offeringId: "",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function AcademicManagement() {
  const [activeTab, setActiveTab] = useState("courses");

  // Course data
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState("");

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseActionError, setCourseActionError] = useState("");
  const [courseActionMessage, setCourseActionMessage] = useState("");
  const [courseForm, setCourseForm] = useState({ ...EMPTY_COURSE_FORM });

  // Course offering data
  const [offerings, setOfferings] = useState([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringsError, setOfferingsError] = useState("");
  const [faculty, setFaculty] = useState([]);

  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [editingOfferingId, setEditingOfferingId] = useState(null);
  const [savingOffering, setSavingOffering] = useState(false);
  const [deletingOfferingId, setDeletingOfferingId] = useState(null);
  const [offeringActionError, setOfferingActionError] = useState("");
  const [offeringActionMessage, setOfferingActionMessage] = useState("");
  const [offeringForm, setOfferingForm] = useState({
    ...EMPTY_OFFERING_FORM,
  });

  // Enrollment data
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState("");

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    ...EMPTY_ENROLLMENT_FORM,
  });
  const [creatingEnrollment, setCreatingEnrollment] = useState(false);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState(null);
  const [enrollmentActionError, setEnrollmentActionError] = useState("");
  const [enrollmentActionMessage, setEnrollmentActionMessage] = useState("");

  // Assignment API has not yet been verified.
  const [assignmentNotice, setAssignmentNotice] = useState("");

  // Load courses whenever the Courses tab is opened.
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError("");

    try {
      const result = await getAdminCourses();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error(result?.message || "Unable to load courses.");
      }

      setCourses(result.data);
    } catch (error) {
      setCoursesError(getErrorMessage(error, "Unable to load courses."));
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "courses") return;

    let cancelled = false;

    async function load() {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const result = await getAdminCourses();

        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.message || "Unable to load courses.");
        }

        if (!cancelled) setCourses(result.data);
      } catch (error) {
        if (!cancelled) {
          setCoursesError(
            getErrorMessage(error, "Unable to load courses.")
          );
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Load offerings, courses, and faculty together for the offering screen.
  useEffect(() => {
    if (activeTab !== "offerings") return;

    let cancelled = false;

    async function loadOfferingData() {
      setOfferingsLoading(true);
      setOfferingsError("");
      setOfferingActionError("");
      setOfferingActionMessage("");

      try {
        const [offeringResult, courseResult, facultyResult] =
          await Promise.all([
            getAdminCourseOfferings(),
            getAdminCourses(),
            getAdminFaculty(),
          ]);

        if (!offeringResult?.success || !Array.isArray(offeringResult.data)) {
          throw new Error(
            offeringResult?.message || "Unable to load course offerings."
          );
        }

        if (!courseResult?.success || !Array.isArray(courseResult.data)) {
          throw new Error(courseResult?.message || "Unable to load courses.");
        }

        if (!facultyResult?.success || !Array.isArray(facultyResult.data)) {
          throw new Error(facultyResult?.message || "Unable to load faculty.");
        }

        if (cancelled) return;

        setOfferings(offeringResult.data);
        setCourses(courseResult.data);
        setFaculty(facultyResult.data);
      } catch (error) {
        if (!cancelled) {
          setOfferingsError(
            getErrorMessage(error, "Unable to load course offering data.")
          );
        }
      } finally {
        if (!cancelled) setOfferingsLoading(false);
      }
    }

    loadOfferingData();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Load enrollments when the Enrollments tab is opened.
  useEffect(() => {
    if (activeTab !== "enrollments") return;

    let cancelled = false;

    async function loadEnrollments() {
      setEnrollmentsLoading(true);
      setEnrollmentsError("");
      setEnrollmentActionError("");
      setEnrollmentActionMessage("");

      try {
        const result = await getAdminEnrollments();

        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.message || "Unable to load enrollments.");
        }

        if (!cancelled) {
          setEnrollments(result.data);
          setEnrollmentsLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setEnrollments([]);
          setEnrollmentsLoaded(true);
          setEnrollmentsError(
            getErrorMessage(error, "Unable to load enrollments.")
          );
        }
      } finally {
        if (!cancelled) setEnrollmentsLoading(false);
      }
    }

    loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Summary values are calculated from successfully loaded data.
  const metrics = useMemo(
    () => ({
      totalCourses: courses.length,
      activeCourses: courses.filter(
        (course) =>
          course.is_active === true ||
          course.is_active === 1 ||
          course.status?.toLowerCase() === "active"
      ).length,
      offerings: offerings.length,
      enrollments: enrollmentsLoaded ? enrollments.length : null,
    }),
    [courses, offerings, enrollments, enrollmentsLoaded]
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setAssignmentNotice("");
    setCourseActionError("");
    setCourseActionMessage("");
  };

  // Open the course modal even if department loading fails.
  // The error is displayed inside the modal and the admin can retry.
  const handleOpenCourseModal = async () => {
    setCourseActionError("");
    setCourseActionMessage("");
    setDepartmentError("");
    setCourseForm({ ...EMPTY_COURSE_FORM });
    setShowCourseModal(true);
    setDepartmentsLoading(true);

    try {
      const result = await getAdminDepartments();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error(result?.message || "Unable to load departments.");
      }

      setDepartments(result.data);
    } catch (error) {
      setDepartments([]);
      setDepartmentError(
        getErrorMessage(error, "Unable to load departments.")
      );
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleSaveCourse = async (event) => {
    event.preventDefault();

    const semester = Number(courseForm.semester);
    const credits = Number(courseForm.credits);
    const departmentId = Number(courseForm.department_id);

    if (
      !courseForm.course_code.trim() ||
      !courseForm.course_name.trim() ||
      !Number.isInteger(departmentId) ||
      departmentId <= 0 ||
      !Number.isInteger(semester) ||
      semester < 1 ||
      !Number.isInteger(credits) ||
      credits < 1
    ) {
      setCourseActionError("Complete all course fields with valid values.");
      return;
    }

    setSavingCourse(true);
    setCourseActionError("");
    setCourseActionMessage("");

    try {
      const result = await createAdminCourse({
        course_code: courseForm.course_code.trim(),
        course_name: courseForm.course_name.trim(),
        department_id: departmentId,
        semester,
        credits,
      });

      if (!result?.success) {
        throw new Error(result?.message || "Unable to create course.");
      }

      setCourseActionMessage(result.message || "Course created successfully.");
      setShowCourseModal(false);
      setCourseForm({ ...EMPTY_COURSE_FORM });

      // Refresh the list after successful creation.
      await loadCourses();
    } catch (error) {
      setCourseActionError(
        getErrorMessage(error, "Unable to create course.")
      );
    } finally {
      setSavingCourse(false);
    }
  };

  const handleOpenOfferingModal = (offering = null) => {
    setOfferingActionError("");
    setOfferingActionMessage("");
    setEditingOfferingId(offering?.offering_id ?? null);

    setOfferingForm(
      offering
        ? {
            course_id: String(offering.course_id ?? ""),
            faculty_id: String(offering.faculty_id ?? ""),
            academic_year: offering.academic_year || "",
            semester: String(offering.semester ?? ""),
            section: offering.section || "",
            room: offering.room || "",
          }
        : { ...EMPTY_OFFERING_FORM }
    );

    setShowOfferingModal(true);
  };

  const handleSaveOffering = async (event) => {
    event.preventDefault();

    const payload = {
      course_id: Number(offeringForm.course_id),
      faculty_id: Number(offeringForm.faculty_id),
      academic_year: offeringForm.academic_year.trim(),
      semester: Number(offeringForm.semester),
      section: offeringForm.section.trim(),
      room: offeringForm.room.trim() || null,
    };

    if (
      !Number.isInteger(payload.course_id) ||
      payload.course_id <= 0 ||
      !Number.isInteger(payload.faculty_id) ||
      payload.faculty_id <= 0 ||
      !Number.isInteger(payload.semester) ||
      payload.semester < 1 ||
      !payload.academic_year ||
      !payload.section
    ) {
      setOfferingActionError("Complete all required offering fields.");
      return;
    }

    setSavingOffering(true);
    setOfferingActionError("");
    setOfferingActionMessage("");

    try {
      const result =
        editingOfferingId !== null
          ? await updateAdminCourseOffering(editingOfferingId, payload)
          : await createAdminCourseOffering(payload);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to save course offering.");
      }

      const refreshed = await getAdminCourseOfferings();

      if (!refreshed?.success || !Array.isArray(refreshed.data)) {
        throw new Error(
          "The offering was saved, but the list could not be refreshed."
        );
      }

      setOfferings(refreshed.data);
      setOfferingActionMessage(
        result.message ||
          (editingOfferingId !== null
            ? "Course offering updated successfully."
            : "Course offering created successfully.")
      );
      setShowOfferingModal(false);
      setEditingOfferingId(null);
      setOfferingForm({ ...EMPTY_OFFERING_FORM });
    } catch (error) {
      setOfferingActionError(
        getErrorMessage(error, "Unable to save course offering.")
      );
    } finally {
      setSavingOffering(false);
    }
  };

  const handleDeleteOffering = async (offering) => {
    const confirmed = window.confirm(
      `Delete offering #${offering.offering_id} (${offering.course_code || "course"})?`
    );

    if (!confirmed) return;

    setDeletingOfferingId(offering.offering_id);
    setOfferingActionError("");
    setOfferingActionMessage("");

    try {
      const result = await deleteAdminCourseOffering(offering.offering_id);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to delete course offering.");
      }

      setOfferings((current) =>
        current.filter(
          (item) => item.offering_id !== offering.offering_id
        )
      );

      setOfferingActionMessage(
        result.message || "Course offering deleted successfully."
      );
    } catch (error) {
      setOfferingActionError(
        getErrorMessage(error, "Unable to delete course offering.")
      );
    } finally {
      setDeletingOfferingId(null);
    }
  };

  const handleOpenEnrollmentModal = () => {
    setEnrollmentActionError("");
    setEnrollmentActionMessage("");
    setEnrollmentForm({ ...EMPTY_ENROLLMENT_FORM });
    setShowEnrollmentModal(true);
  };

  const handleCreateEnrollment = async (event) => {
    event.preventDefault();

    const studentId = Number(enrollmentForm.studentId);
    const offeringId = Number(enrollmentForm.offeringId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      setEnrollmentActionError("Enter a valid Student ID.");
      return;
    }

    if (!Number.isInteger(offeringId) || offeringId <= 0) {
      setEnrollmentActionError("Enter a valid Offering ID.");
      return;
    }

    setCreatingEnrollment(true);
    setEnrollmentActionError("");
    setEnrollmentActionMessage("");

    try {
      const result = await createAdminEnrollment({
        student_id: studentId,
        offering_id: offeringId,
      });

      if (!result?.success) {
        throw new Error(result?.message || "Unable to create enrollment.");
      }

      setEnrollmentActionMessage(
        result.message || "Student enrolled successfully."
      );
      setShowEnrollmentModal(false);
      setEnrollmentForm({ ...EMPTY_ENROLLMENT_FORM });

      // Refresh instead of assuming the response contains a complete record.
      const refreshed = await getAdminEnrollments();

      if (refreshed?.success && Array.isArray(refreshed.data)) {
        setEnrollments(refreshed.data);
        setEnrollmentsLoaded(true);
      }
    } catch (error) {
      setEnrollmentActionError(
        getErrorMessage(error, "Unable to create enrollment.")
      );
    } finally {
      setCreatingEnrollment(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm(`Remove enrollment #${enrollmentId}?`)) return;

    setDeletingEnrollmentId(enrollmentId);
    setEnrollmentActionError("");
    setEnrollmentActionMessage("");

    try {
      const result = await deleteAdminEnrollment(enrollmentId);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to remove enrollment.");
      }

      setEnrollments((current) =>
        current.filter(
          (enrollment) => enrollment.enrollment_id !== enrollmentId
        )
      );

      setEnrollmentActionMessage(
        result.message || "Enrollment removed successfully."
      );
    } catch (error) {
      setEnrollmentActionError(
        getErrorMessage(error, "Unable to remove enrollment.")
      );
    } finally {
      setDeletingEnrollmentId(null);
    }
  };

  const renderNotice = (title, message, isError = false) => {
    if (!message) return null;

    return (
      <div
        className="academic-integration-notice"
        role={isError ? "alert" : "status"}
      >
        <div className="academic-integration-icon" aria-hidden="true">
          <FontAwesomeIcon icon={isError ? faCircleExclamation : faCheck} />
        </div>
        <div>
          <strong>{title}</strong>
          <span>{message}</span>
        </div>
      </div>
    );
  };

  return (
    <section className="academic-management-page">
      <header className="academic-page-header">
        <div>
          <span className="academic-eyebrow">Admin Portal</span>
          <h1>Academic Management</h1>
          <p>
            Manage courses, course offerings, enrollments and assignments.
          </p>
        </div>

        {activeTab === "courses" && (
          <button
            type="button"
            className="academic-primary-button"
            onClick={handleOpenCourseModal}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Course
          </button>
        )}

        {activeTab === "offerings" && (
          <button
            type="button"
            className="academic-primary-button"
            onClick={() => handleOpenOfferingModal()}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Offering
          </button>
        )}

        {activeTab === "enrollments" && (
          <button
            type="button"
            className="academic-primary-button"
            onClick={handleOpenEnrollmentModal}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Enrollment
          </button>
        )}

        {activeTab === "assignments" && (
          <button
            type="button"
            className="academic-primary-button"
            onClick={() =>
              setAssignmentNotice(
                "Assignment creation is not connected yet. A verified assignment API and request format are required before this action can save data."
              )
            }
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Assignment
          </button>
        )}
      </header>

      {activeTab === "courses" && (
        <>
          {renderNotice("Course action failed", courseActionError, true)}
          {renderNotice("Course updated", courseActionMessage)}
        </>
      )}

      <div className="academic-summary-grid">
        <article className="academic-summary-card academic-summary-blue">
          <div className="academic-summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faBook} />
          </div>
          <span>Total Courses</span>
          <strong>{metrics.totalCourses}</strong>
        </article>

        <article className="academic-summary-card academic-summary-green">
          <div className="academic-summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <span>Active Courses</span>
          <strong>{metrics.activeCourses}</strong>
        </article>

        <article className="academic-summary-card academic-summary-purple">
          <div className="academic-summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faBookOpen} />
          </div>
          <span>Course Offerings</span>
          <strong>{metrics.offerings}</strong>
        </article>

        <article className="academic-summary-card academic-summary-orange">
          <div className="academic-summary-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faGraduationCap} />
          </div>
          <span>Enrollments</span>
          <strong>{metrics.enrollments ?? "N/A"}</strong>
        </article>
      </div>

      <div className="academic-tabs" role="tablist" aria-label="Academic sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`academic-tab ${
              activeTab === tab.id ? "academic-tab-active" : ""
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* COURSES */}
      {activeTab === "courses" && (
        <div className="academic-table-card">
          <div className="academic-enrollment-toolbar">
            <div>
              <h2>Courses</h2>
              <p>Manage course details and academic structure.</p>
            </div>
            <button
              type="button"
              className="academic-secondary-button"
              onClick={loadCourses}
              disabled={coursesLoading}
            >
              <FontAwesomeIcon icon={coursesLoading ? faSpinner : faRotate} spin={coursesLoading} />
              Refresh
            </button>
          </div>

          {coursesLoading ? (
            <div className="academic-empty-state">
              <div className="academic-empty-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
              <h2>Loading courses</h2>
              <p>Fetching courses from the backend.</p>
            </div>
          ) : coursesError ? (
            <div className="academic-empty-state">
              <div className="academic-empty-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faCircleExclamation} />
              </div>
              <h2>Unable to load courses</h2>
              <p>{coursesError}</p>
              <button
                type="button"
                className="academic-primary-button"
                onClick={loadCourses}
              >
                <FontAwesomeIcon icon={faRotate} />
                Retry
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="academic-empty-state">
              <div className="academic-empty-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBook} />
              </div>
              <h2>No courses yet</h2>
              <p>Create your first course to enable course offerings.</p>
              <button
                type="button"
                className="academic-primary-button"
                onClick={handleOpenCourseModal}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Course
              </button>
            </div>
          ) : (
            <div className="academic-table-wrapper">
              <table className="academic-table">
                <thead>
                  <tr>
                    <th>Course ID</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr
                      key={
                        course.course_id ??
                        course.id ??
                        `${course.course_code}-${index}`
                      }
                    >
                      <td>{course.course_id ?? course.id ?? "—"}</td>
                      <td><strong>{course.course_code || "—"}</strong></td>
                      <td>{course.course_name || "—"}</td>
                      <td>
                        {course.department_code ||
                          course.department_name ||
                          course.department_id ||
                          "—"}
                      </td>
                      <td>{course.semester ?? "—"}</td>
                      <td>{course.credits ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COURSE OFFERINGS */}
      {activeTab === "offerings" && (
        <div className="academic-table-card">
          <div className="academic-enrollment-toolbar">
            <div>
              <h2>Course Offerings</h2>
              <p>Assign courses to faculty for a semester and section.</p>
            </div>
          </div>

          {offeringsLoading ? (
            <div className="academic-empty-state">
              <FontAwesomeIcon icon={faSpinner} spin />
              <h2>Loading course offerings</h2>
            </div>
          ) : offeringsError ? (
            <div className="academic-empty-state">
              <FontAwesomeIcon icon={faCircleExclamation} />
              <h2>Unable to load course offerings</h2>
              <p>{offeringsError}</p>
            </div>
          ) : offerings.length === 0 ? (
            <div className="academic-empty-state">
              <div className="academic-empty-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <h2>No course offerings yet</h2>
              <p>Create an offering to assign a course to faculty.</p>
              <button
                type="button"
                className="academic-primary-button"
                onClick={() => handleOpenOfferingModal()}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Offering
              </button>
            </div>
          ) : (
            <div className="academic-table-wrapper">
              <table className="academic-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Course</th>
                    <th>Faculty</th>
                    <th>Academic Year</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Room</th>
                    <th>Enrollments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((offering) => (
                    <tr key={offering.offering_id}>
                      <td>{offering.offering_id}</td>
                      <td>
                        <strong>{offering.course_code || "—"}</strong>
                        <br />
                        {offering.course_name || "—"}
                      </td>
                      <td>
                        {offering.faculty_name ||
                          `Faculty #${offering.faculty_id}`}
                      </td>
                      <td>{offering.academic_year || "—"}</td>
                      <td>{offering.semester ?? "—"}</td>
                      <td>{offering.section || "—"}</td>
                      <td>{offering.room || "—"}</td>
                      <td>{offering.enrollment_count ?? 0}</td>
                      <td>
                        <button
                          type="button"
                          className="academic-action-button"
                          title="Edit offering"
                          aria-label={`Edit offering ${offering.offering_id}`}
                          onClick={() => handleOpenOfferingModal(offering)}
                          disabled={deletingOfferingId !== null}
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          type="button"
                          className="academic-action-button"
                          title="Delete offering"
                          aria-label={`Delete offering ${offering.offering_id}`}
                          onClick={() => handleDeleteOffering(offering)}
                          disabled={deletingOfferingId === offering.offering_id}
                        >
                          <FontAwesomeIcon
                            icon={
                              deletingOfferingId === offering.offering_id
                                ? faSpinner
                                : faTrash
                            }
                            spin={deletingOfferingId === offering.offering_id}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {renderNotice("Course offering updated", offeringActionMessage)}
          {renderNotice("Course offering action failed", offeringActionError, true)}
        </div>
      )}

      {/* ENROLLMENTS */}
      {activeTab === "enrollments" && (
        <div className="academic-table-card">
          <div className="academic-enrollment-toolbar">
            <div>
              <h2>Enrollments</h2>
              <p>Manage student enrollment records.</p>
            </div>
          </div>

          {enrollmentsLoading ? (
            <div className="academic-empty-state">
              <FontAwesomeIcon icon={faSpinner} spin />
              <h2>Loading enrollments</h2>
            </div>
          ) : enrollmentsError ? (
            <div className="academic-empty-state">
              <FontAwesomeIcon icon={faCircleExclamation} />
              <h2>Unable to load enrollments</h2>
              <p>{enrollmentsError}</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="academic-empty-state">
              <div className="academic-empty-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
              <h2>No enrollments yet</h2>
              <p>Enrollment records will appear here when students are enrolled.</p>
              <button
                type="button"
                className="academic-primary-button"
                onClick={handleOpenEnrollmentModal}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Enrollment
              </button>
            </div>
          ) : (
            <div className="academic-table-wrapper">
              <table className="academic-table">
                <thead>
                  <tr>
                    <th>Enrollment ID</th>
                    <th>Student ID</th>
                    <th>Offering ID</th>
                    <th>Status</th>
                    <th>Enrolled At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.enrollment_id}>
                      <td>{enrollment.enrollment_id}</td>
                      <td>{enrollment.student_id}</td>
                      <td>{enrollment.offering_id}</td>
                      <td>
                        <span
                          className={`academic-status academic-status-${(
                            enrollment.status || "unknown"
                          ).toLowerCase()}`}
                        >
                          {enrollment.status || "N/A"}
                        </span>
                      </td>
                      <td>{formatDate(enrollment.enrolled_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="academic-action-button"
                          title="Remove enrollment"
                          aria-label={`Remove enrollment ${enrollment.enrollment_id}`}
                          disabled={
                            deletingEnrollmentId === enrollment.enrollment_id
                          }
                          onClick={() =>
                            handleDeleteEnrollment(enrollment.enrollment_id)
                          }
                        >
                          <FontAwesomeIcon
                            icon={
                              deletingEnrollmentId === enrollment.enrollment_id
                                ? faSpinner
                                : faTrash
                            }
                            spin={
                              deletingEnrollmentId === enrollment.enrollment_id
                            }
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {renderNotice("Enrollment updated", enrollmentActionMessage)}
          {renderNotice("Enrollment action failed", enrollmentActionError, true)}
        </div>
      )}

      {/* ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="academic-table-card academic-future-tab">
          <div className="academic-empty-state">
            <div className="academic-empty-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faChalkboardTeacher} />
            </div>
            <h2>Assignments are not connected yet</h2>
            <p>
              The Add Assignment button is visible, but saving and listing
              assignments require a verified backend endpoint and request format.
            </p>
          </div>
          {renderNotice("Assignment feature unavailable", assignmentNotice, true)}
        </div>
      )}

      {/* COURSE MODAL */}
      {showCourseModal && (
        <div
          className="academic-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingCourse
            ) {
              setShowCourseModal(false);
            }
          }}
        >
          <div
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-modal-title"
          >
            <div className="academic-modal-header">
              <div>
                <span className="academic-eyebrow">Academic Management</span>
                <h2 id="course-modal-title">Add Course</h2>
                <p>Enter the course information below.</p>
              </div>
              <button
                type="button"
                className="academic-modal-close"
                onClick={() => setShowCourseModal(false)}
                disabled={savingCourse}
                aria-label="Close course dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse}>
              {renderNotice("Unable to create course", courseActionError, true)}
              {renderNotice("Course created", courseActionMessage)}

              <div className="academic-form-section">
                <h3>Course Information</h3>

                <div className="academic-form-grid">
                  <div className="academic-form-field">
                    <label htmlFor="course-code">Course Code *</label>
                    <input
                      id="course-code"
                      name="course_code"
                      value={courseForm.course_code}
                      onChange={(event) =>
                        setCourseForm((current) => ({
                          ...current,
                          course_code: event.target.value,
                        }))
                      }
                      maxLength={30}
                      required
                      disabled={savingCourse}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-name">Course Name *</label>
                    <input
                      id="course-name"
                      name="course_name"
                      value={courseForm.course_name}
                      onChange={(event) =>
                        setCourseForm((current) => ({
                          ...current,
                          course_name: event.target.value,
                        }))
                      }
                      maxLength={150}
                      required
                      disabled={savingCourse}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-department">Department *</label>
                    <select
                      id="course-department"
                      name="department_id"
                      value={courseForm.department_id}
                      onChange={(event) =>
                        setCourseForm((current) => ({
                          ...current,
                          department_id: event.target.value,
                        }))
                      }
                      required
                      disabled={savingCourse || departmentsLoading}
                    >
                      <option value="">
                        {departmentsLoading
                          ? "Loading departments..."
                          : "Select department"}
                      </option>
                      {departments.map((department) => (
                        <option
                          key={department.department_id}
                          value={department.department_id}
                        >
                          {department.department_code} — {department.department_name}
                        </option>
                      ))}
                    </select>
                    {departmentError && (
                      <div className="academic-form-error" role="alert">
                        {departmentError}
                        <button
                          type="button"
                          className="academic-secondary-button"
                          onClick={async () => {
                            setDepartmentError("");
                            setDepartmentsLoading(true);
                            try {
                              const result = await getAdminDepartments();
                              if (
                                !result?.success ||
                                !Array.isArray(result.data)
                              ) {
                                throw new Error(
                                  result?.message ||
                                    "Unable to load departments."
                                );
                              }
                              setDepartments(result.data);
                            } catch (error) {
                              setDepartmentError(
                                getErrorMessage(
                                  error,
                                  "Unable to load departments."
                                )
                              );
                            } finally {
                              setDepartmentsLoading(false);
                            }
                          }}
                          disabled={departmentsLoading}
                        >
                          <FontAwesomeIcon
                            icon={departmentsLoading ? faSpinner : faRotate}
                            spin={departmentsLoading}
                          />
                          Retry
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-semester">Semester *</label>
                    <input
                      id="course-semester"
                      name="semester"
                      type="number"
                      min="1"
                      step="1"
                      value={courseForm.semester}
                      onChange={(event) =>
                        setCourseForm((current) => ({
                          ...current,
                          semester: event.target.value,
                        }))
                      }
                      required
                      disabled={savingCourse}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="course-credits">Credits *</label>
                    <input
                      id="course-credits"
                      name="credits"
                      type="number"
                      min="1"
                      step="1"
                      value={courseForm.credits}
                      onChange={(event) =>
                        setCourseForm((current) => ({
                          ...current,
                          credits: event.target.value,
                        }))
                      }
                      required
                      disabled={savingCourse}
                    />
                  </div>
                </div>
              </div>

              <div className="academic-modal-footer">
                <button
                  type="button"
                  className="academic-secondary-button"
                  onClick={() => setShowCourseModal(false)}
                  disabled={savingCourse}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="academic-primary-button"
                  disabled={
                    savingCourse ||
                    departmentsLoading ||
                    departments.length === 0
                  }
                >
                  <FontAwesomeIcon
                    icon={savingCourse ? faSpinner : faCheck}
                    spin={savingCourse}
                  />
                  {savingCourse ? "Saving..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE OFFERING MODAL */}
      {showOfferingModal && (
        <div
          className="academic-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingOffering
            ) {
              setShowOfferingModal(false);
            }
          }}
        >
          <div
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offering-modal-title"
          >
            <div className="academic-modal-header">
              <div>
                <span className="academic-eyebrow">Academic Management</span>
                <h2 id="offering-modal-title">
                  {editingOfferingId !== null
                    ? "Edit Course Offering"
                    : "Add Course Offering"}
                </h2>
                <p>Enter the course, faculty, and semester details.</p>
              </div>
              <button
                type="button"
                className="academic-modal-close"
                onClick={() => setShowOfferingModal(false)}
                disabled={savingOffering}
                aria-label="Close offering dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveOffering}>
              <div className="academic-form-section">
                <h3>Offering Information</h3>

                <div className="academic-form-grid">
                  <div className="academic-form-field">
                    <label htmlFor="offering-course">Course *</label>
                    <select
                      id="offering-course"
                      value={offeringForm.course_id}
                      onChange={(event) =>
                        setOfferingForm((current) => ({
                          ...current,
                          course_id: event.target.value,
                        }))
                      }
                      required
                      disabled={savingOffering}
                    >
                      <option value="">Select course</option>
                      {courses.map((course) => (
                        <option
                          key={course.course_id}
                          value={course.course_id}
                        >
                          {course.course_code} — {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-faculty">Faculty *</label>
                    <select
                      id="offering-faculty"
                      value={offeringForm.faculty_id}
                      onChange={(event) =>
                        setOfferingForm((current) => ({
                          ...current,
                          faculty_id: event.target.value,
                        }))
                      }
                      required
                      disabled={savingOffering}
                    >
                      <option value="">Select faculty</option>
                      {faculty.map((member) => (
                        <option
                          key={member.faculty_id}
                          value={member.faculty_id}
                        >
                          {member.name ||
                            member.employee_id ||
                            `Faculty #${member.faculty_id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-year">Academic Year *</label>
                    <input
                      id="offering-year"
                      value={offeringForm.academic_year}
                      onChange={(event) =>
                        setOfferingForm((current) => ({
                          ...current,
                          academic_year: event.target.value,
                        }))
                      }
                      placeholder="e.g. 2026-2027"
                      required
                      disabled={savingOffering}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-semester">Semester *</label>
                    <input
                      id="offering-semester"
                      type="number"
                      min="1"
                      step="1"
                      value={offeringForm.semester}
                      onChange={(event) =>
                        setOfferingForm((current) => ({
                          ...current,
                          semester: event.target.value,
                        }))
                      }
                      required
                      disabled={savingOffering}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-section">Section *</label>
                    <input
                      id="offering-section"
                      value={offeringForm.section}
                      onChange={(event) =>
                        setOfferingForm((current) => ({
                          ...current,
                          section: event.target.value,
                        }))
                      }
                      placeholder="e.g. A"
                      required
                      disabled={savingOffering}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-room">Room</label>
                    <input
                      id="offering-room"
                      value={offeringForm.room}
                      onChange={(event) =>
                        setOfferingForm((current) => ({
                          ...current,
                          room: event.target.value,
                        }))
                      }
                      placeholder="e.g. Lab 2"
                      disabled={savingOffering}
                    />
                  </div>
                </div>
              </div>

              {renderNotice("Unable to save offering", offeringActionError, true)}

              <div className="academic-modal-footer">
                <button
                  type="button"
                  className="academic-secondary-button"
                  onClick={() => setShowOfferingModal(false)}
                  disabled={savingOffering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="academic-primary-button"
                  disabled={
                    savingOffering ||
                    courses.length === 0 ||
                    faculty.length === 0
                  }
                >
                  <FontAwesomeIcon
                    icon={savingOffering ? faSpinner : faCheck}
                    spin={savingOffering}
                  />
                  {savingOffering
                    ? "Saving..."
                    : editingOfferingId !== null
                      ? "Save Changes"
                      : "Create Offering"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      {showEnrollmentModal && (
        <div
          className="academic-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !creatingEnrollment
            ) {
              setShowEnrollmentModal(false);
            }
          }}
        >
          <div
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-modal-title"
          >
            <div className="academic-modal-header">
              <div>
                <span className="academic-eyebrow">Academic Management</span>
                <h2 id="enrollment-modal-title">Add Enrollment</h2>
                <p>Enter the student and course offering IDs.</p>
              </div>
              <button
                type="button"
                className="academic-modal-close"
                onClick={() => setShowEnrollmentModal(false)}
                disabled={creatingEnrollment}
                aria-label="Close enrollment dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleCreateEnrollment}>
              <div className="academic-form-section">
                <h3>Enrollment Information</h3>

                <div className="academic-form-grid">
                  <div className="academic-form-field">
                    <label htmlFor="enrollment-student-id">Student ID *</label>
                    <input
                      id="enrollment-student-id"
                      type="number"
                      min="1"
                      step="1"
                      value={enrollmentForm.studentId}
                      onChange={(event) =>
                        setEnrollmentForm((current) => ({
                          ...current,
                          studentId: event.target.value,
                        }))
                      }
                      required
                      disabled={creatingEnrollment}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="enrollment-offering-id">Offering ID *</label>
                    <input
                      id="enrollment-offering-id"
                      type="number"
                      min="1"
                      step="1"
                      value={enrollmentForm.offeringId}
                      onChange={(event) =>
                        setEnrollmentForm((current) => ({
                          ...current,
                          offeringId: event.target.value,
                        }))
                      }
                      required
                      disabled={creatingEnrollment}
                    />
                  </div>
                </div>
              </div>

              <div className="academic-modal-backend-note">
                <span aria-hidden="true">
                  <FontAwesomeIcon icon={faCircleInfo} />
                </span>
                <span>
                  Use valid IDs from your database. The backend verifies whether
                  the student and offering exist.
                </span>
              </div>

              {renderNotice(
                "Enrollment creation failed",
                enrollmentActionError,
                true
              )}

              <div className="academic-modal-footer">
                <button
                  type="button"
                  className="academic-secondary-button"
                  onClick={() => setShowEnrollmentModal(false)}
                  disabled={creatingEnrollment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="academic-primary-button"
                  disabled={creatingEnrollment}
                >
                  <FontAwesomeIcon
                    icon={creatingEnrollment ? faSpinner : faPlus}
                    spin={creatingEnrollment}
                  />
                  {creatingEnrollment ? "Creating..." : "Create Enrollment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AcademicManagement;
