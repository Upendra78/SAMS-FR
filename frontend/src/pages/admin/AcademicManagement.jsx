
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
  faPenToSquare,
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
  updateAdminCourse,
  deleteAdminCourse,
  getAdminDepartments,
  getAdminCourseOfferings,
  getAdminFaculty,
  getAdminStudents,
  createAdminCourseOffering,
  updateAdminCourseOffering,
  deleteAdminCourseOffering,
} from "../../services/adminService";

import coursesImage from "../../../image/Courses.png";
import activeCoursesImage from "../../../image/ActiveCourses.png";
import offeringsImage from "../../../image/Offerings.png";
import enrollmentsImage from "../../../image/Enrollments.png";

import "./AcademicManagement.css";

const TABS = [
  { id: "courses", label: "Courses", icon: faBook },
  { id: "offerings", label: "Course Offerings", icon: faBookOpen },
  { id: "enrollments", label: "Course Enrollments", icon: faGraduationCap },
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
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [updatingCourseStatusId, setUpdatingCourseStatusId] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseActionError, setCourseActionError] = useState("");
  const [courseActionMessage, setCourseActionMessage] = useState("");
  const [courseForm, setCourseForm] = useState({ ...EMPTY_COURSE_FORM });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [offeringPage, setOfferingPage] = useState(1);
  const OFFERINGS_PAGE_SIZE = 10;
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const ENROLLMENTS_PAGE_SIZE = 10;

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
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    ...EMPTY_ENROLLMENT_FORM,
  });
  const [creatingEnrollment, setCreatingEnrollment] = useState(false);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState(null);
  const [enrollmentActionError, setEnrollmentActionError] = useState("");
  const [enrollmentActionMessage, setEnrollmentActionMessage] = useState("");
  
  const [studentSearch, setStudentSearch] = useState("");
  const [offeringSearch, setOfferingSearch] = useState("");
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
  const loadOfferingData = useCallback(async () => {
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

      setOfferings(offeringResult.data);
      setCourses(courseResult.data);
      setFaculty(facultyResult.data);
    } catch (error) {
      setOfferingsError(
        getErrorMessage(error, "Unable to load course offering data.")
      );
    } finally {
      setOfferingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "offerings") return;

    let cancelled = false;

    async function loadOfferingDataForTab() {
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
        if (!cancelled) {
          setOfferingsLoading(false);
        }
      }
    }

    void loadOfferingDataForTab();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Load enrollment records and the data needed by the enrollment form.
  useEffect(() => {
    if (activeTab !== "enrollments") return;

    let cancelled = false;

    async function loadEnrollments() {
      setEnrollmentsLoading(true);
      setEnrollmentsError("");
      setStudentsLoading(true);
      setStudentsError("");
      setEnrollmentActionError("");
      setEnrollmentActionMessage("");

      try {
        const [enrollmentResult, studentResult, offeringResult] =
          await Promise.allSettled([
            getAdminEnrollments(),
            getAdminStudents(),
            getAdminCourseOfferings(),
          ]);

        if (cancelled) return;

        if (
          enrollmentResult.status === "fulfilled" &&
          enrollmentResult.value?.success &&
          Array.isArray(enrollmentResult.value.data)
        ) {
          setEnrollments(enrollmentResult.value.data);
          setEnrollmentsLoaded(true);
        } else {
          const error =
            enrollmentResult.status === "rejected"
              ? enrollmentResult.reason
              : new Error(
                  enrollmentResult.value?.message ||
                    "Unable to load enrollments."
                );

          setEnrollments([]);
          setEnrollmentsLoaded(true);
          setEnrollmentsError(
            getErrorMessage(error, "Unable to load enrollments.")
          );
        }

        if (
          studentResult.status === "fulfilled" &&
          studentResult.value?.success &&
          Array.isArray(studentResult.value.data)
        ) {
          setStudents(studentResult.value.data);
        } else {
          const error =
            studentResult.status === "rejected"
              ? studentResult.reason
              : new Error(
                  studentResult.value?.message ||
                    "Unable to load students."
                );

          setStudents([]);
          setStudentsError(
            getErrorMessage(error, "Unable to load students.")
          );
        }

        if (
          offeringResult.status === "fulfilled" &&
          offeringResult.value?.success &&
          Array.isArray(offeringResult.value.data)
        ) {
          setOfferings(offeringResult.value.data);
        }
      } catch (error) {
        if (!cancelled) {
          setEnrollmentsError(
            getErrorMessage(error, "Unable to load enrollment data.")
          );
        }
      } finally {
        if (!cancelled) {
          setEnrollmentsLoading(false);
          setStudentsLoading(false);
        }
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

  const handleToggleCourseStatus = async (course) => {
    const courseId = course.course_id;

    if (!courseId || updatingCourseStatusId !== null) return;

    const nextIsActive = !(
      course.is_active === true ||
      course.is_active === 1 ||
      course.status?.toLowerCase() === "active"
    );

    setUpdatingCourseStatusId(courseId);
    setCourseActionError("");
    setCourseActionMessage("");

    try {
      const result = await updateAdminCourse(courseId, {
        is_active: nextIsActive,
      });

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to update course status."
        );
      }

      setCourses((currentCourses) =>
        currentCourses.map((item) =>
          item.course_id === courseId
            ? { ...item, is_active: nextIsActive }
            : item
        )
      );

      setCourseActionMessage(
        `${course.course_code || "Course"} ${
          nextIsActive ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (error) {
      setCourseActionError(
        getErrorMessage(error, "Unable to update course status.")
      );
    } finally {
      setUpdatingCourseStatusId(null);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setAssignmentNotice("");
    setCourseActionError("");
    setCourseActionMessage("");
  };

  // Open the course modal even if department loading fails.
  // The error is displayed inside the modal and the admin can retry.
  const handleOpenCourseModal = async (course = null) => {
    setCourseActionError("");
    setCourseActionMessage("");
    setDepartmentError("");

    setEditingCourseId(course?.course_id ?? null);

    setCourseForm(
      course
        ? {
            course_code: course.course_code || "",
            course_name: course.course_name || "",
            department_id: String(course.department_id ?? ""),
            semester: String(course.semester ?? ""),
            credits: String(course.credits ?? ""),
          }
        : { ...EMPTY_COURSE_FORM }
    );

    setShowCourseModal(true);
    setDepartmentsLoading(true);

    try {
      const result = await getAdminDepartments();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error(
          result?.message || "Unable to load departments."
        );
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

  const handleDeleteCourse = async (course) => {
    if (savingCourse || deletingCourseId !== null) return;

    const courseId = course.course_id;

    if (!courseId) {
      setCourseActionError("Unable to identify the course to delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete course "${course.course_code} — ${course.course_name}"?\n\n` +
        "Courses with existing course offerings cannot be deleted."
    );

    if (!confirmed) return;

    setDeletingCourseId(courseId);
    setCourseActionError("");
    setCourseActionMessage("");

    try {
      const result = await deleteAdminCourse(courseId);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to delete course.");
      }

      setCourses((current) =>
        current.filter((item) => item.course_id !== courseId)
      );

      setCourseActionMessage(
        result.message || "Course deleted successfully."
      );

      // Re-fetch to keep the table synchronized with the backend.
      await loadCourses();
    } catch (error) {
      setCourseActionError(
        getErrorMessage(error, "Unable to delete course.")
      );
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleSaveCourse = async (event) => {
    event.preventDefault();

    const semester = Number(courseForm.semester);
    const credits = Number(courseForm.credits);
    const departmentId = Number(courseForm.department_id);
    const isEditing = editingCourseId !== null;

    const payload = {
      course_code: courseForm.course_code.trim(),
      course_name: courseForm.course_name.trim(),
      department_id: departmentId,
      semester,
      credits,
    };

    if (
      !payload.course_code ||
      !payload.course_name ||
      !Number.isInteger(departmentId) ||
      departmentId <= 0 ||
      !Number.isInteger(semester) ||
      semester < 1 ||
      !Number.isInteger(credits) ||
      credits < 1
    ) {
      setCourseActionError(
        "Complete all course fields with valid values."
      );
      return;
    }

    setSavingCourse(true);
    setCourseActionError("");
    setCourseActionMessage("");

    try {
      const result = isEditing
        ? await updateAdminCourse(editingCourseId, payload)
        : await createAdminCourse(payload);

      if (!result?.success) {
        throw new Error(
          result?.message ||
            (isEditing
              ? "Unable to update course."
              : "Unable to create course.")
        );
      }

      setShowCourseModal(false);
      setEditingCourseId(null);
      setCourseForm({ ...EMPTY_COURSE_FORM });

      setCourseActionMessage(
        result.message ||
          (isEditing
            ? "Course updated successfully."
            : "Course created successfully.")
      );

      await loadCourses();
    } catch (error) {
      setCourseActionError(
        getErrorMessage(
          error,
          isEditing
            ? "Unable to update course."
            : "Unable to create course."
        )
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
    setStudentSearch("");
    setOfferingSearch("");
    setShowEnrollmentModal(true);
  };

  const handleRefreshEnrollments = async () => {
    setEnrollmentsLoading(true);
    setEnrollmentsError("");
    setEnrollmentActionError("");

    try {
      const result = await getAdminEnrollments();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error(result?.message || "Unable to refresh enrollments.");
      }

      setEnrollments(result.data);
      setEnrollmentsLoaded(true);
      setEnrollmentPage(1);
    } catch (error) {
      setEnrollmentsError(
        getErrorMessage(error, "Unable to refresh enrollments.")
      );
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleCreateEnrollment = async (event) => {
    event.preventDefault();

    const studentId = Number(enrollmentForm.studentId);
    const offeringId = Number(enrollmentForm.offeringId);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0 ||
      !students.some((student) => student.student_id === studentId)
    ) {
      setEnrollmentActionError("Select a valid student from the suggestions.");
      return;
    }

    if (
      !Number.isInteger(offeringId) ||
      offeringId <= 0 ||
      !offerings.some((offering) => offering.offering_id === offeringId)
    ) {
      setEnrollmentActionError(
        "Select a valid course offering from the suggestions."
      );
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
        setEnrollmentPage(1);
      }
    } catch (error) {
      setEnrollmentActionError(
        getErrorMessage(error, "Unable to create enrollment.")
      );
    } finally {
      setCreatingEnrollment(false);
    }
  };

  const handleEditEnrollment = (enrollment) => {
    setEnrollmentActionError("");
    setEnrollmentActionMessage("");

    // Open the enrollment form with the selected record.
    setEnrollmentForm({
      student_id: String(enrollment.student_id),
      offering_id: String(enrollment.offering_id),
    });

    setStudentSearch("");
    setOfferingSearch("");
    setShowEnrollmentModal(true);
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
      setEnrollmentPage(1);

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

  const totalCourses = courses.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalCourses / PAGE_SIZE)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCourses = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

    return courses.slice(startIndex, startIndex + PAGE_SIZE);
  }, [courses, safeCurrentPage]);

  const totalOfferingPages = Math.max(
    1,
    Math.ceil(offerings.length / OFFERINGS_PAGE_SIZE)
  );

  const safeOfferingPage = Math.min(
    offeringPage,
    totalOfferingPages
  );

  const paginatedOfferings = useMemo(() => {
    const startIndex =
      (safeOfferingPage - 1) * OFFERINGS_PAGE_SIZE;

    return offerings.slice(
      startIndex,
      startIndex + OFFERINGS_PAGE_SIZE
    );
  }, [offerings, safeOfferingPage]);

  const totalEnrollmentPages = Math.max(
    1,
    Math.ceil(enrollments.length / ENROLLMENTS_PAGE_SIZE)
  );

  const safeEnrollmentPage = Math.min(
    enrollmentPage,
    totalEnrollmentPages
  );

  const paginatedEnrollments = enrollments.slice(
    (safeEnrollmentPage - 1) * ENROLLMENTS_PAGE_SIZE,
    safeEnrollmentPage * ENROLLMENTS_PAGE_SIZE
  );

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
            Add Course Enrollment
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
        <article
          className="academic-summary-card academic-summary-blue"
          onClick={() => handleTabChange("courses")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTabChange("courses");
            }
          }}
        >
          <div className="academic-summary-content">
            <div className="academic-summary-top">
              <div className="academic-summary-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <span className="academic-summary-badge">All Courses</span>
            </div>
            <strong>{metrics.totalCourses}</strong>
            <span>Total Courses</span>
            <span className="academic-summary-link">
              View all courses <span aria-hidden="true">→</span>
            </span>
          </div>
          <img
            className="academic-summary-art"
            src={coursesImage}
            alt=""
            aria-hidden="true"
          />
        </article>

        <article
          className="academic-summary-card academic-summary-green"
          onClick={() => handleTabChange("courses")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTabChange("courses");
            }
          }}
        >
          <div className="academic-summary-content">
            <div className="academic-summary-top">
              <div className="academic-summary-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faCheck} />
              </div>
              <span className="academic-summary-badge">Active</span>
            </div>
            <strong>{metrics.activeCourses}</strong>
            <span>Active Courses</span>
            <span className="academic-summary-link">
              View active courses <span aria-hidden="true">→</span>
            </span>
          </div>
          <img
            className="academic-summary-art"
            src={activeCoursesImage}
            alt=""
            aria-hidden="true"
          />
        </article>

        <article
          className="academic-summary-card academic-summary-purple"
          onClick={() => handleTabChange("offerings")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTabChange("offerings");
            }
          }}
        >
          <div className="academic-summary-content">
            <div className="academic-summary-top">
              <div className="academic-summary-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBookOpen} />
              </div>
              <span className="academic-summary-badge">Schedule</span>
            </div>
            <strong>{metrics.offerings}</strong>
            <span>Course Offerings</span>
            <span className="academic-summary-link">
              Manage offerings <span aria-hidden="true">→</span>
            </span>
          </div>
          <img
            className="academic-summary-art"
            src={offeringsImage}
            alt=""
            aria-hidden="true"
          />
        </article>

        <article
          className="academic-summary-card academic-summary-orange"
          onClick={() => handleTabChange("enrollments")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTabChange("enrollments");
            }
          }}
        >
          <div className="academic-summary-content">
            <div className="academic-summary-top">
              <div className="academic-summary-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
              <span className="academic-summary-badge">Students</span>
            </div>
            <strong>{metrics.enrollments ?? "N/A"}</strong>
            <span>Enrollments</span>
            <span className="academic-summary-link">
              View enrollments <span aria-hidden="true">→</span>
            </span>
          </div>
          <img
            className="academic-summary-art"
            src={enrollmentsImage}
            alt=""
            aria-hidden="true"
          />
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
          <div className="academic-section-header">
            <div className="academic-section-heading">
              <span className="academic-section-eyebrow">
                ACADEMIC MANAGEMENT
              </span>

              <h2>Courses</h2>

              <p>
                Manage course details, departments, credits, and
                academic structure.
              </p>
            </div>

            <button
              type="button"
              className="academic-refresh-button"
              onClick={loadCourses}
              disabled={coursesLoading}
            >
              <FontAwesomeIcon
                icon={faRotate}
                spin={coursesLoading}
              />
              <span>{coursesLoading ? "Refreshing..." : "Refresh"}</span>
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourses.map((course, index) => {
                    const courseId = course.course_id;
                    const isDeleting = deletingCourseId === courseId;
                    const actionsDisabled =
                      savingCourse || deletingCourseId !== null;

                    return (
                      <tr
                        key={
                          courseId ??
                          course.id ??
                          `${course.course_code}-${index}`
                        }
                      >
                        <td>{courseId ?? course.id ?? "—"}</td>
                        <td>
                          <strong>{course.course_code || "—"}</strong>
                        </td>
                        <td>{course.course_name || "—"}</td>
                        <td>
                          {course.department_code ||
                            course.department_name ||
                            course.department_id ||
                            "—"}
                        </td>
                        <td>{course.semester ?? "—"}</td>
                        <td>{course.credits ?? "—"}</td>
                        <td>
                          <button
                            type="button"
                            className={`academic-course-status-toggle ${
                              course.is_active === true ||
                              course.is_active === 1 ||
                              course.status?.toLowerCase() === "active"
                                ? "is-active"
                                : "is-inactive"
                            }`}
                            onClick={() => handleToggleCourseStatus(course)}
                            disabled={
                              savingCourse ||
                              deletingCourseId !== null ||
                              updatingCourseStatusId !== null
                            }
                            aria-label={`Change status of ${course.course_code}`}
                          >
                            {updatingCourseStatusId === course.course_id
                              ? "Updating..."
                              : course.is_active === true ||
                                  course.is_active === 1 ||
                                  course.status?.toLowerCase() === "active"
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </td>
                        <td>
                          <div className="academic-action-group">
                            <button
                              type="button"
                              className="academic-action-button"
                              title="Edit course"
                              aria-label={`Edit ${course.course_name}`}
                              onClick={() => handleOpenCourseModal(course)}
                              disabled={savingCourse || deletingCourseId !== null}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>

                            <button
                              type="button"
                              className="academic-action-button danger"
                              title="Delete course"
                              aria-label={`Delete ${course.course_name}`}
                              onClick={() => handleDeleteCourse(course)}
                              disabled={actionsDisabled}
                            >
                              <FontAwesomeIcon
                                icon={isDeleting ? faSpinner : faTrash}
                                spin={isDeleting}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="academic-pagination">
                <div className="academic-pagination-info">
                  Showing{" "}
                  {totalCourses === 0
                    ? 0
                    : (safeCurrentPage - 1) * PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(safeCurrentPage * PAGE_SIZE, totalCourses)}
                  {" of "}
                  {totalCourses} courses
                </div>

                <div className="academic-pagination-controls">
                  <button
                    type="button"
                    className="academic-page-button"
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={`academic-page-button ${
                          safeCurrentPage === page ? "active" : ""
                        }`}
                        aria-current={
                          safeCurrentPage === page ? "page" : undefined
                        }
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                  <button
                    type="button"
                    className="academic-page-button"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COURSE OFFERINGS */}
      {activeTab === "offerings" && (
        <div className="academic-table-card">
          <div className="academic-section-header">
            <div className="academic-section-heading">
              <span className="academic-section-eyebrow">
                ACADEMIC MANAGEMENT
              </span>

              <h2>Course Offerings</h2>

              <p>
                Assign courses to faculty for an academic year,
                semester, and section.
              </p>
            </div>

            <button
              type="button"
              className="academic-refresh-button"
              onClick={loadOfferingData}
              disabled={offeringsLoading}
            >
              <FontAwesomeIcon
                icon={faRotate}
                spin={offeringsLoading}
              />
              <span>
                {offeringsLoading ? "Refreshing..." : "Refresh"}
              </span>
            </button>
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
                    <th>Enrollments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOfferings.map((offering) => (
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
                      <td>{offering.enrollment_count ?? 0}</td>
                      <td>
                        <div className="academic-action-group">
                          <button
                            type="button"
                            className="academic-action-button"
                            title="Edit offering"
                            aria-label="Edit offering"
                            onClick={() => handleOpenOfferingModal(offering)}
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>

                          <button
                            type="button"
                            className="academic-action-button danger"
                            title="Delete offering"
                            aria-label="Delete offering"
                            disabled={deletingOfferingId === offering.offering_id}
                            onClick={() => handleDeleteOffering(offering)}
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="academic-pagination">
                <div className="academic-pagination-info">
                  Showing{" "}
                  {offerings.length === 0
                    ? 0
                    : (safeOfferingPage - 1) * OFFERINGS_PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(
                    safeOfferingPage * OFFERINGS_PAGE_SIZE,
                    offerings.length
                  )}
                  {" of "}
                  {offerings.length} offerings
                </div>

                <div className="academic-pagination-controls">
                  <button
                    type="button"
                    className="academic-page-button"
                    disabled={safeOfferingPage === 1}
                    onClick={() =>
                      setOfferingPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: totalOfferingPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`academic-page-button ${
                        safeOfferingPage === page ? "active" : ""
                      }`}
                      aria-current={
                        safeOfferingPage === page ? "page" : undefined
                      }
                      onClick={() => setOfferingPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="academic-page-button"
                    disabled={safeOfferingPage === totalOfferingPages}
                    onClick={() =>
                      setOfferingPage((page) =>
                        Math.min(totalOfferingPages, page + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {renderNotice("Course offering updated", offeringActionMessage)}
          {renderNotice("Course offering action failed", offeringActionError, true)}
        </div>
      )}

      {/* ENROLLMENTS */}
      {activeTab === "enrollments" && (
        <div className="academic-table-card">
          <div className="enrollments-section-header">
            <div className="enrollments-section-title">
              <h2>Course Enrollments</h2>
              <p>
                Manage student enrollments, update records, and monitor enrollment status.
              </p>
            </div>

            <button
              type="button"
              className="enrollments-refresh-btn"
              onClick={handleRefreshEnrollments}
              disabled={enrollmentsLoading}
            >
              <span className={enrollmentsLoading ? "refresh-icon spinning" : "refresh-icon"}>
                ↻
              </span>
              {enrollmentsLoading ? "Refreshing..." : "Refresh"}
            </button>
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
          ) : (
            <>
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
                    {paginatedEnrollments.length > 0 ? (
                      paginatedEnrollments.map((enrollment) => (
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
                          <td className="enrollment-actions">
                            <button
                              type="button"
                              className="academic-action-button enrollment-edit-button"
                              title="Edit enrollment"
                              aria-label={`Edit enrollment ${enrollment.enrollment_id}`}
                              onClick={() => handleEditEnrollment(enrollment)}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>

                            <button
                              type="button"
                              className="academic-action-button enrollment-delete-button"
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="academic-no-records">
                          No course enrollments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {enrollments.length > 0 && (
                <div className="academic-pagination">
                  <div className="academic-pagination-info">
                    Showing{" "}
                    {(safeEnrollmentPage - 1) * ENROLLMENTS_PAGE_SIZE + 1}
                    {"–"}
                    {Math.min(
                      safeEnrollmentPage * ENROLLMENTS_PAGE_SIZE,
                      enrollments.length
                    )}{" "}
                    of {enrollments.length} enrollments
                  </div>

                  <div className="academic-pagination-controls">
                    <button
                      type="button"
                      className="academic-page-button"
                      disabled={safeEnrollmentPage === 1}
                      onClick={() =>
                        setEnrollmentPage((page) => Math.max(1, page - 1))
                      }
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalEnrollmentPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={`academic-page-button ${
                          safeEnrollmentPage === page ? "active" : ""
                        }`}
                        aria-current={
                          safeEnrollmentPage === page ? "page" : undefined
                        }
                        onClick={() => setEnrollmentPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="academic-page-button"
                      disabled={safeEnrollmentPage === totalEnrollmentPages}
                      onClick={() =>
                        setEnrollmentPage((page) =>
                          Math.min(totalEnrollmentPages, page + 1)
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {renderNotice("Enrollment created", enrollmentActionMessage)}
          {renderNotice(
            "Enrollment action failed",
            enrollmentActionError,
            true
          )}
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
                <h2 id="course-modal-title">
                  {editingCourseId ? "Edit Course" : "Add Course"}
                </h2>
                <p>Enter the course information below.</p>
              </div>
              <button
                type="button"
                className="academic-modal-close"
                onClick={() => {
                  setShowCourseModal(false);
                  setEditingCourseId(null);
                  setCourseActionError("");
                }}
                disabled={savingCourse}
                aria-label="Close course dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse}>
              {renderNotice(
                editingCourseId ? "Unable to update course" : "Unable to create course",
                courseActionError,
                true
              )}
              {renderNotice(
                editingCourseId ? "Course updated" : "Course created",
                courseActionMessage
              )}

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
                    deletingCourseId !== null ||
                    departmentsLoading ||
                    departments.length === 0
                  }
                >
                  <FontAwesomeIcon
                    icon={savingCourse ? faSpinner : faCheck}
                    spin={savingCourse}
                  />
                  {savingCourse
                    ? "Saving..."
                    : editingCourseId !== null
                      ? "Update Course"
                      : "Create Course"}
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
                <h2 id="enrollment-modal-title">Add Course Enrollment</h2>
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
                    <label htmlFor="enrollment-student-search">Student *</label>
                    <input
                      id="enrollment-student-search"
                      list="enrollment-student-options"
                      value={studentSearch}
                      onChange={(event) => {
                        const search = event.target.value;
                        setStudentSearch(search);

                        const selectedStudent = students.find((student) => {
                          const label =
                            `${student.name} — ${student.enrollment_no || "No enrollment number"} — Sem ${student.semester ?? "N/A"} ${student.section || ""} (ID: ${student.student_id})`;
                          return label === search;
                        });

                        setEnrollmentForm((current) => ({
                          ...current,
                          studentId: selectedStudent
                            ? String(selectedStudent.student_id)
                            : "",
                        }));
                      }}
                      placeholder={
                        studentsLoading
                          ? "Loading students..."
                          : "Search student by name or enrollment number"
                      }
                      autoComplete="off"
                      required
                      disabled={creatingEnrollment || studentsLoading}
                    />
                    <datalist id="enrollment-student-options">
                      {students.map((student) => (
                        <option
                          key={student.student_id}
                          value={`${student.name} — ${student.enrollment_no || "No enrollment number"} — Sem ${student.semester ?? "N/A"} ${student.section || ""} (ID: ${student.student_id})`}
                        />
                      ))}
                    </datalist>
                    {studentsError && (
                      <p className="academic-field-hint" role="alert">
                        {studentsError}
                      </p>
                    )}
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="enrollment-offering-search">Course offering *</label>
                    <input
                      id="enrollment-offering-search"
                      list="enrollment-offering-options"
                      value={offeringSearch}
                      onChange={(event) => {
                        const search = event.target.value;
                        setOfferingSearch(search);

                        const selectedOffering = offerings.find((offering) => {
                          const label =
                            `${offering.course_code} — ${offering.course_name} — ${offering.faculty_name} — ${offering.academic_year} — Sem ${offering.semester} — Section ${offering.section} (ID: ${offering.offering_id})`;
                          return label === search;
                        });

                        setEnrollmentForm((current) => ({
                          ...current,
                          offeringId: selectedOffering
                            ? String(selectedOffering.offering_id)
                            : "",
                        }));
                      }}
                      placeholder="Search course, faculty, semester, or section"
                      autoComplete="off"
                      required
                      disabled={creatingEnrollment || offeringsLoading}
                    />
                    <datalist id="enrollment-offering-options">
                      {offerings.map((offering) => (
                        <option
                          key={offering.offering_id}
                          value={`${offering.course_code} — ${offering.course_name} — ${offering.faculty_name} — ${offering.academic_year} — Sem ${offering.semester} — Section ${offering.section} (ID: ${offering.offering_id})`}
                        />
                      ))}
                    </datalist>
                    {offeringsError && (
                      <p className="academic-field-hint" role="alert">
                        {offeringsError}
                      </p>
                    )}
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
