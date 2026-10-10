import { useEffect, useState } from "react";

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
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  createAdminEnrollment,
  deleteAdminEnrollment,
  getAdminEnrollments,
} from "../../services/enrollmentService";
import {
  getAdminCourses,
  getAdminCourseOfferings,
  getAdminFaculty,
  createAdminCourseOffering,
  updateAdminCourseOffering,
  deleteAdminCourseOffering,
} from "../../services/adminService";

import "./AcademicManagement.css";

const EMPTY_METRICS = {
  totalCourses: null,
  activeCourses: null,
  offerings: null,
  enrollments: null,
};

const TABS = [
  {
    id: "courses",
    label: "Courses",
    icon: faBook,
  },
  {
    id: "offerings",
    label: "Course Offerings",
    icon: faBookOpen,
  },
  {
    id: "enrollments",
    label: "Enrollments",
    icon: faGraduationCap,
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: faChalkboardTeacher,
  },
];

function formatMetric(value) {
  return value === null || value === undefined
    ? "N/A"
    : value;
}

function formatEnrollmentDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function AcademicManagement() {
  const [activeTab, setActiveTab] = useState("courses");

  const [offerings, setOfferings] = useState([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [offeringsError, setOfferingsError] = useState("");
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [offeringActionError, setOfferingActionError] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] =
    useState(false);
  const [enrollmentsLoaded, setEnrollmentsLoaded] =
    useState(false);
  const [enrollmentsError, setEnrollmentsError] =
    useState("");

  const [showEnrollmentModal, setShowEnrollmentModal] =
    useState(false);

  const [enrollmentForm, setEnrollmentForm] = useState({
    studentId: "",
    offeringId: "",
  });

  const [creatingEnrollment, setCreatingEnrollment] =
    useState(false);

  const [deletingEnrollmentId, setDeletingEnrollmentId] =
    useState(null);

  const [enrollmentActionError, setEnrollmentActionError] =
    useState("");

  const [enrollmentActionMessage, setEnrollmentActionMessage] =
    useState("");

  const [offeringActionMessage, setOfferingActionMessage] = useState("");

  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [editingOfferingId, setEditingOfferingId] = useState(null);
  const [savingOffering, setSavingOffering] = useState(false);
  const [deletingOfferingId, setDeletingOfferingId] = useState(null);

  const EMPTY_OFFERING_FORM = {
    course_id: "",
    faculty_id: "",
    academic_year: "",
    semester: "",
    section: "",
    room: "",
  };

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

        if (cancelled) return;

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
        if (!cancelled) {
          setOfferingsError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load course offering data."
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

  const [offeringForm, setOfferingForm] = useState(EMPTY_OFFERING_FORM);  

  useEffect(() => {
    if (activeTab !== "enrollments") {
      return;
    }

    async function loadEnrollments() {
      setEnrollmentsLoading(true);
      setEnrollmentsError("");
      setEnrollmentActionError("");
      setEnrollmentActionMessage("");

      try {
        const result = await getAdminEnrollments();

        if (
          result?.success &&
          Array.isArray(result.data)
        ) {
          setEnrollments(result.data);
          setEnrollmentsLoaded(true);
        } else {
          setEnrollments([]);
          setEnrollmentsLoaded(true);

          setEnrollmentsError(
            result?.message ||
              "Unable to load enrollments.",
          );
        }
      } catch (error) {
        setEnrollments([]);
        setEnrollmentsLoaded(true);

        setEnrollmentsError(
          error?.response?.data?.message ||
            "Unable to load enrollments.",
        );
      } finally {
        setEnrollmentsLoading(false);
      }
    }

    loadEnrollments();
  }, [activeTab]);

  const metrics = {
    ...EMPTY_METRICS,
    enrollments: enrollmentsLoaded
      ? enrollments.length
      : null,
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    setEnrollmentActionError("");
    setEnrollmentActionMessage("");
  };

  const handleEnrollmentFormChange = (event) => {
    const { name, value } = event.target;

    setEnrollmentForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleOpenEnrollmentModal = () => {
    setEnrollmentActionError("");
    setEnrollmentActionMessage("");

    setEnrollmentForm({
      studentId: "",
      offeringId: "",
    });

    setShowEnrollmentModal(true);
  };

  const handleCloseEnrollmentModal = () => {
    if (creatingEnrollment) {
      return;
    }

    setShowEnrollmentModal(false);

    setEnrollmentForm({
      studentId: "",
      offeringId: "",
    });
  };

  const handleCreateEnrollment = async (event) => {
    event.preventDefault();

    const studentId = Number(
      enrollmentForm.studentId,
    );

    const offeringId = Number(
      enrollmentForm.offeringId,
    );

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      setEnrollmentActionError(
        "Enter a valid Student ID.",
      );
      return;
    }

    if (
      !Number.isInteger(offeringId) ||
      offeringId <= 0
    ) {
      setEnrollmentActionError(
        "Enter a valid Offering ID.",
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
        setEnrollmentActionError(
          result?.message ||
            "Unable to create enrollment.",
        );
        return;
      }

      if (result.data) {
        setEnrollments((current) => [
          ...current,
          result.data,
        ]);

        setEnrollmentsLoaded(true);
      }

      setEnrollmentActionMessage(
        result.message ||
          "Student enrolled successfully.",
      );

      setEnrollmentForm({
        studentId: "",
        offeringId: "",
      });

      setShowEnrollmentModal(false);
    } catch (error) {
      setEnrollmentActionError(
        error?.response?.data?.message ||
          "Unable to create enrollment.",
      );
    } finally {
      setCreatingEnrollment(false);
    }
  };

  const handleDeleteEnrollment = async (
    enrollmentId,
  ) => {
    const confirmed = window.confirm(
      `Remove enrollment #${enrollmentId}?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingEnrollmentId(enrollmentId);
    setEnrollmentActionError("");
    setEnrollmentActionMessage("");

    try {
      const result =
        await deleteAdminEnrollment(
          enrollmentId,
        );

      if (!result?.success) {
        setEnrollmentActionError(
          result?.message ||
            "Unable to remove enrollment.",
        );
        return;
      }

      setEnrollments((current) =>
        current.filter(
          (enrollment) =>
            enrollment.enrollment_id !==
            enrollmentId,
        ),
      );

      setEnrollmentActionMessage(
        result.message ||
          "Enrollment removed successfully.",
      );
    } catch (error) {
      setEnrollmentActionError(
        error?.response?.data?.message ||
          "Unable to remove enrollment.",
      );
    } finally {
      setDeletingEnrollmentId(null);
    }
  };

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case "offerings":
        return {
          title: "No course offerings available",
          description:
            "Course offering records will appear here when the required backend API is available.",
          icon: faBookOpen,
        };

      case "enrollments":
        return {
          title: "No enrollments available",
          description:
            "No enrollment records are currently available from the Admin enrollment API.",
          icon: faGraduationCap,
        };

      case "assignments":
        return {
          title:
            "No faculty assignments available",
          description:
            "Faculty assignment records will appear here when the required backend API is available.",
          icon: faChalkboardTeacher,
        };

      default:
        return {
          title: "No courses available",
          description:
            "Course records will appear here when the required course management API is available.",
          icon: faBook,
        };
    }
  };

  const openOfferingModal = (offering = null) => {
    setOfferingActionError("");
    setOfferingActionMessage("");
    setEditingOfferingId(offering?.offering_id ?? null);

    setOfferingForm(
      offering
        ? {
            course_id: String(offering.course_id),
            faculty_id: String(offering.faculty_id),
            academic_year: offering.academic_year || "",
            semester: String(offering.semester),
            section: offering.section || "",
            room: offering.room || "",
          }
        : { ...EMPTY_OFFERING_FORM }
    );

    setShowOfferingModal(true);
  };

  const handleOfferingFormChange = (event) => {
    const { name, value } = event.target;

    setOfferingForm((current) => ({
      ...current,
      [name]: value,
    }));
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
      setOfferingActionError("Complete all required fields with valid values.");
      return;
    }

    setSavingOffering(true);
    setOfferingActionError("");
    setOfferingActionMessage("");

    try {
      let result;

      if (editingOfferingId !== null) {
        result = await updateAdminCourseOffering(editingOfferingId, payload);
      } else {
        result = await createAdminCourseOffering(payload);
      }

      if (!result?.success) {
        throw new Error(result?.message || "Unable to save course offering.");
      }

      const refreshed = await getAdminCourseOfferings();

      if (!refreshed?.success || !Array.isArray(refreshed.data)) {
        throw new Error("Saved successfully, but refreshing the offering list failed.");
      }

      setOfferings(refreshed.data);
      setShowOfferingModal(false);
      setOfferingForm({ ...EMPTY_OFFERING_FORM });
      setEditingOfferingId(null);
      setOfferingActionMessage(
        result.message ||
          (editingOfferingId !== null
            ? "Course offering updated successfully."
            : "Course offering created successfully.")
      );
    } catch (error) {
      setOfferingActionError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save course offering."
      );
    } finally {
      setSavingOffering(false);
    }
  };

  const handleDeleteOffering = async (offering) => {
    const confirmed = window.confirm(
      `Delete offering #${offering.offering_id} (${offering.course_code})? Offerings with enrollments or attendance sessions cannot be deleted.`
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
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete course offering."
      );
    } finally {
      setDeletingOfferingId(null);
    }
  };

  const emptyState = getEmptyStateContent();

  return (
    <section className="academic-management-page">
      <header className="academic-page-header">
        <div>
          <span className="academic-eyebrow">
            Admin Portal
          </span>

          <h1>Academic Management</h1>

          <p>
            Manage courses, course offerings,
            enrollments and academic assignments.
          </p>
        </div>

        {activeTab === "enrollments" && (
          <button
            type="button"
            className="academic-primary-button"
            onClick={
              handleOpenEnrollmentModal
            }
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Enrollment
          </button>
        )}
      </header>

      <div className="academic-summary-grid">
        <article className="academic-summary-card academic-summary-blue">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            <FontAwesomeIcon icon={faBook} />
          </div>

          <span>Total Courses</span>

          <strong>
            {formatMetric(
              metrics.totalCourses,
            )}
          </strong>
        </article>

        <article className="academic-summary-card academic-summary-green">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            <FontAwesomeIcon icon={faCheck} />
          </div>

          <span>Active Courses</span>

          <strong>
            {formatMetric(
              metrics.activeCourses,
            )}
          </strong>
        </article>

        <article className="academic-summary-card academic-summary-purple">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            <FontAwesomeIcon icon={faBookOpen} />
          </div>

          <span>Course Offerings</span>

          <strong>
            {formatMetric(metrics.offerings)}
          </strong>
        </article>

        <article className="academic-summary-card academic-summary-orange">
          <div
            className="academic-summary-icon"
            aria-hidden="true"
          >
            <FontAwesomeIcon
              icon={faGraduationCap}
            />
          </div>

          <span>Enrollments</span>

          <strong>
            {formatMetric(
              metrics.enrollments,
            )}
          </strong>
        </article>
      </div>

      <div
        className="academic-tabs"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={
              activeTab === tab.id
            }
            className={`academic-tab ${
              activeTab === tab.id
                ? "academic-tab-active"
                : ""
            }`}
            onClick={() =>
              handleTabChange(tab.id)
            }
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "enrollments" ? (
        <>
          <div className="academic-enrollment-toolbar">
            <div>
              <h2>Enrollments</h2>

              <p>
                Manage student enrollment
                records.
              </p>
            </div>

            <button
              type="button"
              className="academic-primary-button"
              onClick={
                handleOpenEnrollmentModal
              }
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Enrollment
            </button>
          </div>

          <div className="academic-table-card">
            <div className="academic-table-wrapper">
              {enrollmentsLoading && (
                <div className="academic-empty-state">
                  <div
                    className="academic-empty-icon"
                    aria-hidden="true"
                  >
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                    />
                  </div>

                  <h2>
                    Loading enrollments
                  </h2>

                  <p>
                    Fetching enrollment
                    records from the Flask
                    backend.
                  </p>
                </div>
              )}

              {!enrollmentsLoading &&
                enrollmentsError && (
                  <div className="academic-empty-state">
                    <div
                      className="academic-empty-icon"
                      aria-hidden="true"
                    >
                      <FontAwesomeIcon
                        icon={
                          faCircleExclamation
                        }
                      />
                    </div>

                    <h2>
                      Unable to load
                      enrollments
                    </h2>

                    <p>
                      {enrollmentsError}
                    </p>
                  </div>
                )}

              {!enrollmentsLoading &&
                !enrollmentsError &&
                enrollments.length > 0 && (
                  <table className="academic-table">
                    <thead>
                      <tr>
                        <th>
                          Enrollment ID
                        </th>

                        <th>
                          Student ID
                        </th>

                        <th>
                          Offering ID
                        </th>

                        <th>Status</th>

                        <th>
                          Enrolled At
                        </th>

                        <th>
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {enrollments.map(
                        (enrollment) => (
                          <tr
                            key={
                              enrollment.enrollment_id
                            }
                          >
                            <td>
                              {
                                enrollment.enrollment_id
                              }
                            </td>

                            <td>
                              {
                                enrollment.student_id
                              }
                            </td>

                            <td>
                              {
                                enrollment.offering_id
                              }
                            </td>

                            <td>
                              <span
                                className={`academic-status academic-status-${enrollment.status?.toLowerCase()}`}
                              >
                                <FontAwesomeIcon
                                  icon={
                                    faCheck
                                  }
                                />{" "}
                                {enrollment.status ||
                                  "N/A"}
                              </span>
                            </td>

                            <td>
                              {formatEnrollmentDate(
                                enrollment.enrolled_at,
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="academic-action-button"
                                onClick={() =>
                                  handleDeleteEnrollment(
                                    enrollment.enrollment_id,
                                  )
                                }
                                disabled={
                                  deletingEnrollmentId ===
                                  enrollment.enrollment_id
                                }
                                aria-label={`Remove enrollment ${enrollment.enrollment_id}`}
                                title="Remove enrollment"
                              >
                                <FontAwesomeIcon
                                  icon={
                                    deletingEnrollmentId ===
                                    enrollment.enrollment_id
                                      ? faSpinner
                                      : faTrash
                                  }
                                  spin={
                                    deletingEnrollmentId ===
                                    enrollment.enrollment_id
                                  }
                                />
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}

              {!enrollmentsLoading &&
                !enrollmentsError &&
                enrollments.length ===
                  0 && (
                  <div className="academic-empty-state">
                    <div
                      className="academic-empty-icon"
                      aria-hidden="true"
                    >
                      <FontAwesomeIcon
                        icon={
                          emptyState.icon
                        }
                      />
                    </div>

                    <h2>
                      {emptyState.title}
                    </h2>

                    <p>
                      {
                        emptyState.description
                      }
                    </p>
                  </div>
                )}
            </div>

            {enrollmentActionMessage && (
              <div className="academic-integration-notice">
                <div
                  className="academic-integration-icon"
                  aria-hidden="true"
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                  />
                </div>

                <div>
                  <strong>
                    Enrollment updated
                  </strong>

                  <span>
                    {
                      enrollmentActionMessage
                    }
                  </span>
                </div>
              </div>
            )}

            {enrollmentActionError && (
              <div className="academic-integration-notice">
                <div
                  className="academic-integration-icon"
                  aria-hidden="true"
                >
                  <FontAwesomeIcon
                    icon={
                      faCircleExclamation
                    }
                  />
                </div>

                <div>
                  <strong>
                    Enrollment action failed
                  </strong>

                  <span>
                    {enrollmentActionError}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : activeTab === "offerings" ? (
        <div className="academic-table-card">
          <div className="academic-enrollment-toolbar">
            <div>
              <h2>Course Offerings</h2>
              <p>Assign courses to faculty for a semester and section.</p>
            </div>

            <button
              type="button"
              className="academic-primary-button"
              onClick={() => openOfferingModal()}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Offering
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
              <button
                type="button"
                className="academic-secondary-button"
                onClick={() => setActiveTab("courses")}
              >
                Back
              </button>
            </div>
          ) : offerings.length === 0 ? (
            <div className="academic-empty-state">
              <FontAwesomeIcon icon={faBookOpen} />
              <h2>No course offerings yet</h2>
              <p>Create an offering to assign a course to faculty.</p>
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
                        <strong>{offering.course_code}</strong>
                        <br />
                        {offering.course_name}
                      </td>
                      <td>{offering.faculty_name || `Faculty #${offering.faculty_id}`}</td>
                      <td>{offering.academic_year}</td>
                      <td>{offering.semester}</td>
                      <td>{offering.section}</td>
                      <td>{offering.room || "—"}</td>
                      <td>{offering.enrollment_count ?? 0}</td>
                      <td>
                        <button
                          type="button"
                          className="academic-action-button"
                          title="Edit offering"
                          aria-label={`Edit offering ${offering.offering_id}`}
                          onClick={() => openOfferingModal(offering)}
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

          {offeringActionMessage && (
            <div className="academic-integration-notice">
              <div>
                <strong>Course offering updated</strong>
                <span>{offeringActionMessage}</span>
              </div>
            </div>
          )}

          {offeringActionError && (
            <div className="academic-integration-notice">
              <div>
                <strong>Course offering action failed</strong>
                <span>{offeringActionError}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="academic-table-card academic-future-tab">
          <div className="academic-empty-state">
            <div className="academic-empty-icon" aria-hidden="true">
              <FontAwesomeIcon icon={emptyState.icon} />
            </div>
            <h2>{emptyState.title}</h2>
            <p>{emptyState.description}</p>
          </div>
        </div>
      )}

      {showOfferingModal && (
        <div
          className="academic-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingOffering) {
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
                      name="course_id"
                      value={offeringForm.course_id}
                      onChange={handleOfferingFormChange}
                      required
                      disabled={savingOffering}
                    >
                      <option value="">Select course</option>
                      {courses.map((course) => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_code} — {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-faculty">Faculty *</label>
                    <select
                      id="offering-faculty"
                      name="faculty_id"
                      value={offeringForm.faculty_id}
                      onChange={handleOfferingFormChange}
                      required
                      disabled={savingOffering}
                    >
                      <option value="">Select faculty</option>
                      {faculty.map((member) => (
                        <option key={member.faculty_id} value={member.faculty_id}>
                          {member.name || member.employee_id || `Faculty #${member.faculty_id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-year">Academic Year *</label>
                    <input
                      id="offering-year"
                      name="academic_year"
                      value={offeringForm.academic_year}
                      onChange={handleOfferingFormChange}
                      placeholder="e.g. 2026-2027"
                      required
                      disabled={savingOffering}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-semester">Semester *</label>
                    <input
                      id="offering-semester"
                      name="semester"
                      type="number"
                      min="1"
                      step="1"
                      value={offeringForm.semester}
                      onChange={handleOfferingFormChange}
                      required
                      disabled={savingOffering}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-section">Section *</label>
                    <input
                      id="offering-section"
                      name="section"
                      value={offeringForm.section}
                      onChange={handleOfferingFormChange}
                      placeholder="e.g. A"
                      required
                      disabled={savingOffering}
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="offering-room">Room</label>
                    <input
                      id="offering-room"
                      name="room"
                      value={offeringForm.room}
                      onChange={handleOfferingFormChange}
                      placeholder="e.g. Lab 2"
                      disabled={savingOffering}
                    />
                  </div>
                </div>
              </div>

              {offeringActionError && (
                <div className="academic-integration-notice">
                  <div>
                    <strong>Unable to save offering</strong>
                    <span>{offeringActionError}</span>
                  </div>
                </div>
              )}

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
                  disabled={savingOffering || courses.length === 0 || faculty.length === 0}
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

      {showEnrollmentModal && (
        <div
          className="academic-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseEnrollmentModal();
            }
          }}
        >
          <div
            className="academic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-enrollment-title"
          >
            <div className="academic-modal-header">
              <div>
                <span className="academic-eyebrow">
                  Academic Management
                </span>

                <h2 id="add-enrollment-title">
                  Add Enrollment
                </h2>

                <p>
                  Enter the confirmed
                  student and course
                  offering IDs.
                </p>
              </div>

              <button
                type="button"
                className="academic-modal-close"
                onClick={
                  handleCloseEnrollmentModal
                }
                disabled={
                  creatingEnrollment
                }
                aria-label="Close add enrollment dialog"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateEnrollment
              }
            >
              <div className="academic-form-section">
                <h3>
                  Enrollment Information
                </h3>

                <div className="academic-form-grid">
                  <div className="academic-form-field">
                    <label htmlFor="enrollment-student-id">
                      Student ID
                    </label>

                    <input
                      id="enrollment-student-id"
                      name="studentId"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        enrollmentForm.studentId
                      }
                      onChange={
                        handleEnrollmentFormChange
                      }
                      placeholder="Enter student ID"
                      required
                      disabled={
                        creatingEnrollment
                      }
                    />
                  </div>

                  <div className="academic-form-field">
                    <label htmlFor="enrollment-offering-id">
                      Offering ID
                    </label>

                    <input
                      id="enrollment-offering-id"
                      name="offeringId"
                      type="number"
                      min="1"
                      step="1"
                      value={
                        enrollmentForm.offeringId
                      }
                      onChange={
                        handleEnrollmentFormChange
                      }
                      placeholder="Enter offering ID"
                      required
                      disabled={
                        creatingEnrollment
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="academic-modal-backend-note">
                <span aria-hidden="true">
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                  />
                </span>

                <span>
                  Student and
                  course-offering IDs
                  are used directly
                  because no Admin
                  lookup APIs are
                  currently available.
                </span>
              </div>

              {enrollmentActionError && (
                <div className="academic-integration-notice">
                  <div
                    className="academic-integration-icon"
                    aria-hidden="true"
                  >
                    <FontAwesomeIcon
                      icon={
                        faCircleExclamation
                      }
                    />
                  </div>

                  <div>
                    <strong>
                      Enrollment creation failed
                    </strong>

                    <span>
                      {
                        enrollmentActionError
                      }
                    </span>
                  </div>
                </div>
              )}

              <div className="academic-modal-footer">
                <button
                  type="button"
                  className="academic-secondary-button"
                  onClick={
                    handleCloseEnrollmentModal
                  }
                  disabled={
                    creatingEnrollment
                  }
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                  />
                  Cancel
                </button>

                <button
                  type="submit"
                  className="academic-primary-button"
                  disabled={
                    creatingEnrollment
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      creatingEnrollment
                        ? faSpinner
                        : faPlus
                    }
                    spin={
                      creatingEnrollment
                    }
                  />

                  {creatingEnrollment
                    ? "Creating..."
                    : "Create Enrollment"}
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