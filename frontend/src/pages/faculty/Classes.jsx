
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  getFacultyCourses,
  getFacultyCourseDetails,
} from "../../services/facultyService";

import "./Classes.css";

const TABS = ["All Classes", "Today", "Upcoming", "Completed"];

function initials(value) {
  return (
    String(value || "CL")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CL"
  );
}

function display(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

function Pending({ compact = false }) {
  return (
    <span className={`fc-pending${compact ? " fc-pending-compact" : ""}`}>
      API integration pending
    </span>
  );
}

function Icon({ name, className = "" }) {
  const paths = {
    classes: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    students: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.4-3.1 2.3-5 5.5-5s5.1 1.9 5.5 5M16 11a3 3 0 1 0 0-6M16 14c2.5.4 4 2.1 4.5 5" />
      </>
    ),
    attendance: (
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="m8 12 2.2 2.2L16 8.5" />
      </>
    ),
    upcoming: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    report: (
      <>
        <path d="M5 20V10M12 20V4M19 20v-7M3 20.5h18" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 6v13a2.5 2.5 0 0 1 2.5-2.5H20" />
      </>
    ),
    room: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 21v-5h6v5M9 7h.01M15 7h.01M9 11h.01M15 11h.01" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
  };

  return (
    <svg
      className={`fc-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.book}
    </svg>
  );
}

function MetricCard({ icon, tone, label, value, description, pending = false }) {
  return (
    <article className="fc-metric-card">
      <div className={`fc-metric-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div className="fc-metric-content">
        <span className="fc-metric-label">{label}</span>
        <strong className={pending ? "fc-metric-pending" : ""}>
          {pending ? <Pending compact /> : value}
        </strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function Classes() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [countsReady, setCountsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("All");
  const [academicYear, setAcademicYear] = useState("All");
  const [activeTab, setActiveTab] = useState("All Classes");

  const [selectedClass, setSelectedClass] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [retryCount, setRetryCount] = useState(0);



  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setLoadError("");
      setCountsReady(false);
      setStudentCounts({});
      setClasses([]);

      try {
        const result = await getFacultyCourses();

        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error(result?.message || "Unable to load assigned classes.");
        }

        if (!active) return;

        const offerings = result.data;
        setClasses(offerings);
        setLoading(false);

        const courseIds = [
          ...new Set(
            offerings
              .map((item) => item.course_id)
              .filter((id) => id !== null && id !== undefined),
          ),
        ];

        const detailResults = await Promise.allSettled(
          courseIds.map((id) => getFacultyCourseDetails(id)),
        );

        if (!active) return;

        const counts = {};
        const failedCourses = new Set();

        detailResults.forEach((entry, index) => {
          const courseId = courseIds[index];

          if (
            entry.status !== "fulfilled" ||
            !entry.value?.success ||
            !entry.value?.data
          ) {
            failedCourses.add(String(courseId));
            return;
          }

          const courseOfferings = Array.isArray(entry.value.data.offerings)
            ? entry.value.data.offerings
            : [];

          courseOfferings.forEach((offering) => {
            if (
              offering.offering_id !== null &&
              offering.offering_id !== undefined &&
              Number.isFinite(Number(offering.student_count))
            ) {
              counts[String(offering.offering_id)] = Number(
                offering.student_count,
              );
            }
          });
        });

        offerings.forEach((offering) => {
          const key = String(offering.offering_id);
          if (
            !failedCourses.has(String(offering.course_id)) &&
            !(key in counts)
          ) {
            counts[key] = null;
          }
        });

        setStudentCounts(counts);
        setCountsReady(true);
      } catch (error) {
        if (!active) return;

        setClasses([]);
        setLoadError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load assigned classes.",
        );
        setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [retryCount]);

  const semesters = useMemo(
    () => [
      "All",
      ...new Set(
        classes
          .map((item) => item.semester)
          .filter((value) => value !== null && value !== undefined && value !== "")
          .map(String),
      ),
    ],
    [classes],
  );

  const academicYears = useMemo(
    () => [
      "All",
      ...new Set(classes.map((item) => item.academic_year).filter(Boolean).map(String)),
    ],
    [classes],
  );

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classes.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.course_code,
          item.course_name,
          item.section,
          item.semester,
          item.academic_year,
          item.room,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

      const matchesSemester =
        semester === "All" || String(item.semester) === semester;

      const matchesYear =
        academicYear === "All" || String(item.academic_year) === academicYear;

      // Date and completion status are not returned by the current API.
      const matchesTab = activeTab === "All Classes";

      return matchesSearch && matchesSemester && matchesYear && matchesTab;
    });
  }, [classes, search, semester, academicYear, activeTab]);

  const distinctCourseCount = useMemo(
    () => new Set(classes.map((item) => item.course_id).filter((id) => id != null)).size,
    [classes],
  );

  const totalStudents = useMemo(() => {
    if (!countsReady || classes.length === 0) return null;

    const keys = classes.map((item) => String(item.offering_id));

    if (keys.some((key) => studentCounts[key] === null || !(key in studentCounts))) {
      return null;
    }

    return keys.reduce((total, key) => total + studentCounts[key], 0);
  }, [classes, studentCounts, countsReady]);

  const filtersActive =
    Boolean(search.trim()) ||
    semester !== "All" ||
    academicYear !== "All" ||
    activeTab !== "All Classes";

  function clearFilters() {
    setSearch("");
    setSemester("All");
    setAcademicYear("All");
    setActiveTab("All Classes");
  }

  async function viewClass(courseId) {
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedClass(null);

    try {
      const result = await getFacultyCourseDetails(courseId);

      if (!result?.success || !result.data) {
        throw new Error(result?.message || "Unable to load class details.");
      }

      setSelectedClass(result.data);
    } catch (error) {
      setDetailsError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load class details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setSelectedClass(null);
    setDetailsError("");
  }

  return (
    <section className="faculty-classes-page fc-dashboard">
      <header className="fc-page-heading">
        <div>
          <span className="fc-eyebrow">FACULTY WORKSPACE</span>
          <h1>My Classes</h1>
          <p>Review your assigned courses and access class rosters from one place.</p>
        </div>
        <div className="fc-heading-status">
          <span className="fc-status-dot" />
          Faculty portal
        </div>
      </header>

      <div className="fc-metrics-grid">
        <MetricCard
          icon="classes"
          tone="fc-blue"
          label="Assigned Courses"
          value={loading ? "…" : loadError ? "—" : distinctCourseCount}
          description="Distinct courses assigned to you"
        />
        <MetricCard
          icon="students"
          tone="fc-purple"
          label="Enrolled Students"
          value={totalStudents === null ? null : totalStudents}
          description="Total enrolments across offerings"
          pending={totalStudents === null}
        />
        <MetricCard
          icon="attendance"
          tone="fc-green"
          label="Attendance Today"
          pending
          description="Today's attendance summary"
        />
        <MetricCard
          icon="upcoming"
          tone="fc-orange"
          label="Upcoming Sessions"
          pending
          description="Based on the class timetable"
        />
      </div>

      <div className="fc-dashboard-layout">
        <div className="fc-main-column">
          <section className="fc-panel fc-classes-panel">
            <div className="fc-panel-heading">
              <div>
                <h2>Assigned Classes</h2>
                <p>Courses and offerings returned by your faculty account</p>
              </div>
              <span className="fc-count-pill">
                {loading
                  ? "Loading…"
                  : loadError
                    ? "Unavailable"
                    : `${filteredClasses.length} shown`}
              </span>
            </div>

            <div className="fc-tabs" role="tablist" aria-label="Class filters">
              {TABS.map((tab) => {
                const pendingTab = tab !== "All Classes";

                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-disabled={pendingTab}
                    className={`fc-tab${activeTab === tab ? " active" : ""}${pendingTab ? " fc-tab-disabled" : ""}`}
                    onClick={() => {
                      if (!pendingTab) setActiveTab(tab);
                    }}
                    title={pendingTab ? "API integration pending" : undefined}
                  >
                    {tab}
                    {pendingTab && <span className="fc-tab-pending">Pending</span>}
                  </button>
                );
              })}
            </div>

            <div className="fc-table-toolbar">
              <label className="fc-search-box">
                <Icon name="search" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search course, code, section…"
                  aria-label="Search classes"
                />
              </label>

              <label className="fc-select-wrap">
                <span>Semester</span>
                <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                  {semesters.map((value) => (
                    <option key={value} value={value}>
                      {value === "All" ? "All semesters" : `Semester ${value}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fc-select-wrap">
                <span>Academic year</span>
                <select
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                >
                  {academicYears.map((value) => (
                    <option key={value} value={value}>
                      {value === "All" ? "All academic years" : value}
                    </option>
                  ))}
                </select>
              </label>

              {filtersActive && (
                <button className="fc-clear-button" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="fc-state-panel" role="status">
                <span className="fc-spinner" />
                <strong>Loading your classes…</strong>
                <p>Fetching assigned courses from the faculty API.</p>
              </div>
            ) : loadError ? (
              <div className="fc-state-panel fc-error-state">
                <strong>Unable to load classes</strong>
                <p>{loadError}</p>
                <button
                  type="button"
                  className="fc-button-primary"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  Retry
                </button>
              </div>
            ) : classes.length === 0 ? (
              <div className="fc-state-panel">
                <div className="fc-state-icon"><Icon name="book" /></div>
                <strong>No classes assigned yet</strong>
                <p>The faculty API returned no assigned course offerings.</p>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="fc-state-panel">
                <strong>No matching classes</strong>
                <p>Try another search or adjust your filters.</p>
                <button type="button" className="fc-button-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="fc-table-scroll">
                <table className="fc-classes-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Semester</th>
                      <th>Room</th>
                      <th>Students</th>
                      <th>Schedule</th>
                      <th>Attendance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((item) => {
                      const countKey = String(item.offering_id);
                      const countAvailable =
                        countsReady &&
                        countKey in studentCounts &&
                        studentCounts[countKey] !== null;

                      return (
                        <tr key={item.offering_id ?? `${item.course_id}-${item.section}`}>
                          <td>
                            <div className="fc-course-cell">
                              <span className="fc-course-avatar">
                                {initials(item.course_code || item.course_name)}
                              </span>
                              <span>
                                <strong>{display(item.course_code)}</strong>
                                <small title={display(item.course_name)}>
                                  {display(item.course_name)}
                                </small>
                              </span>
                            </div>
                          </td>
                          <td><span className="fc-section-badge">{display(item.section)}</span></td>
                          <td>{display(item.semester)}</td>
                          <td>
                            {item.room ? (
                              <span className="fc-room-cell">
                                <Icon name="room" />
                                {display(item.room)}
                              </span>
                            ) : (
                              <Pending compact />
                            )}
                          </td>
                          <td>
                            {countAvailable ? (
                              <span className="fc-student-count">{studentCounts[countKey]}</span>
                            ) : (
                              <Pending compact />
                            )}
                          </td>
                          <td><Pending compact /></td>
                          <td><Pending compact /></td>
                          <td>
                            <button
                              type="button"
                              className="fc-view-button"
                              onClick={() => viewClass(item.course_id)}
                              disabled={detailsLoading}
                            >
                              View details
                              <Icon name="arrow" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <footer className="fc-table-footer">
              <span>
                {loading || loadError
                  ? "Class records unavailable"
                  : `Showing ${filteredClasses.length} of ${classes.length} offerings`}
              </span>
              <span>Schedule and attendance: API integration pending.</span>
            </footer>
          </section>

          <div className="fc-integration-note">
            <span className="fc-note-symbol">i</span>
            <div>
              <strong>Connected to live faculty data</strong>
              <p>
                Assigned courses, offering details and available student rosters come
                from the backend. Timetable, session summaries and attendance
                percentages display as API integration pending until supported data is available.
              </p>
            </div>
          </div>
        </div>

        <aside className="fc-right-column">
          <section className="fc-panel fc-quick-panel">
            <div className="fc-panel-heading">
              <div>
                <h2>Quick Actions</h2>
                <p>Common faculty tasks</p>
              </div>
            </div>

            <button
              type="button"
              className="fc-action-row"
              disabled
              title="API integration pending"
            >
              <span className="fc-action-icon fc-blue"><Icon name="attendance" /></span>
              <span>
                <strong>Start Attendance</strong>
                <small><Pending compact /></small>
              </span>
              <Icon name="arrow" className="fc-action-arrow" />
            </button>

            <button
              type="button"
              className="fc-action-row"
              onClick={() => navigate("/faculty/students")}
            >
              <span className="fc-action-icon fc-purple"><Icon name="students" /></span>
              <span>
                <strong>View Students</strong>
                <small>Open faculty student list</small>
              </span>
              <Icon name="arrow" className="fc-action-arrow" />
            </button>

            <button
              type="button"
              className="fc-action-row"
              onClick={() => navigate("/faculty/reports")}
            >
              <span className="fc-action-icon fc-green"><Icon name="report" /></span>
              <span>
                <strong>Open Reports</strong>
                <small>Go to the reports page</small>
              </span>
              <Icon name="arrow" className="fc-action-arrow" />
            </button>
          </section>

          <section className="fc-panel fc-schedule-panel">
            <div className="fc-panel-heading">
              <div>
                <h2>Today&apos;s Schedule</h2>
                <p>Your classes for today</p>
              </div>
              <span className="fc-calendar-icon"><Icon name="upcoming" /></span>
            </div>
            <div className="fc-schedule-pending">
              <Icon name="upcoming" />
              <Pending compact />
              <p>The current faculty API does not provide class days or start/end times.</p>
            </div>
          </section>

          <section className="fc-help-panel">
            <div className="fc-help-icon">?</div>
            <div>
              <h3>Need help?</h3>
              <p>Contact your administrator for assistance with class assignments and attendance access.</p>
            </div>
          </section>
        </aside>
      </div>

      {detailsError && (
        <div className="fc-inline-message" role="alert">
          <span>{detailsError}</span>
          <button
            type="button"
            onClick={() => setDetailsError("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {detailsLoading && (
        <div className="fc-modal-overlay">
          <div className="fc-modal-loading" role="status">
            <span className="fc-spinner" />
            <strong>Loading class details…</strong>
          </div>
        </div>
      )}

      {selectedClass && (
        <div
          className="fc-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            className="fc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fc-modal-title"
          >
            <header className="fc-modal-header">
              <div>
                <span className="fc-eyebrow">CLASS DETAILS</span>
                <h2 id="fc-modal-title">{display(selectedClass.course_name)}</h2>
                <p>{display(selectedClass.course_code)}</p>
              </div>
              <button
                type="button"
                className="fc-modal-close"
                onClick={closeDetails}
                aria-label="Close details"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </header>

            <div className="fc-modal-summary">
              <div><span>Course ID</span><strong>{display(selectedClass.course_id)}</strong></div>
              <div><span>Credits</span><strong>{display(selectedClass.credits)}</strong></div>
              <div>
                <span>Offerings</span>
                <strong>{selectedClass.offerings?.length ?? 0}</strong>
              </div>
            </div>

            <section className="fc-modal-section">
              <h3>Offerings &amp; Students</h3>

              {Array.isArray(selectedClass.offerings) && selectedClass.offerings.length > 0 ? (
                selectedClass.offerings.map((offering) => {
                  const students = Array.isArray(offering.students)
                    ? offering.students
                    : [];

                  return (
                    <article className="fc-offering-card" key={offering.offering_id}>
                      <div className="fc-offering-heading">
                        <div>
                          <strong>Offering #{display(offering.offering_id)}</strong>
                          <p>
                            Semester {display(offering.semester)} · Section {display(offering.section)}
                            {" · "}{display(offering.academic_year)} · Room {display(offering.room)}
                          </p>
                        </div>
                        <span className="fc-count-pill">
                          {offering.student_count === null || offering.student_count === undefined
                            ? <Pending compact />
                            : `${offering.student_count} students`}
                        </span>
                      </div>

                      {students.length > 0 ? (
                        <div className="fc-student-list">
                          {students.map((student) => (
                            <div className="fc-student-row" key={student.student_id}>
                              <span className="fc-student-avatar">{initials(student.name)}</span>
                              <span className="fc-student-name">
                                <strong>{display(student.name)}</strong>
                                <small>{display(student.enrollment_no)}</small>
                              </span>
                              <span className="fc-student-email">{display(student.email)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="fc-modal-empty">
                          {Array.isArray(offering.students)
                            ? "No active students are enrolled in this offering."
                            : "API integration pending"}
                        </p>
                      )}
                    </article>
                  );
                })
              ) : (
                <p className="fc-modal-empty">
                  No offering details were returned for this course.
                </p>
              )}
            </section>

            <section className="fc-modal-section">
              <h3>Schedule</h3>
              <p className="fc-modal-empty">
                API integration pending — class days and start/end times are not included
                in the current course-details response.
              </p>
            </section>

            <footer className="fc-modal-footer">
              <button
                type="button"
                className="fc-button-secondary"
                onClick={closeDetails}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

export default Classes;
