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
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  createAdminEnrollment,
  deleteAdminEnrollment,
  getAdminEnrollments,
} from "../../services/enrollmentService";

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
      ) : (
        <div className="academic-table-card academic-future-tab">
          <div className="academic-empty-state">
            <div
              className="academic-empty-icon"
              aria-hidden="true"
            >
              <FontAwesomeIcon
                icon={emptyState.icon}
              />
            </div>

            <h2>{emptyState.title}</h2>

            <p>
              {emptyState.description}
            </p>
          </div>
        </div>
      )}

      <div className="academic-integration-notice">
        <div
          className="academic-integration-icon"
          aria-hidden="true"
        >
          <FontAwesomeIcon
            icon={faCircleInfo}
          />
        </div>

        <div>
          <strong>
            Academic management integration
          </strong>

          <span>
            Enrollment listing, creation and
            removal are connected to the
            confirmed Flask APIs. Course,
            offering and faculty-assignment
            management remain pending their
            respective backend APIs.
          </span>
        </div>

        <span className="academic-integration-badge">
          Partial Integration
        </span>
      </div>

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