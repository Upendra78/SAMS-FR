
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCheck,
  faChevronRight,
  faCloudArrowUp,
  faDownload,
  faFileExcel,
  faFileLines,
  faInfoCircle,
  faListCheck,
  faSave,
  faSearch,
  faUserClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import {
  getAdminTimetable,
  previewTimetableImport,
} from "../../services/timetableService";

import "./TimetableManagement.css";

const steps = ["Upload File", "Extract & Preview", "Map & Assign", "Save Data"];
const tabs = ["Timetable", "Courses", "Faculty", "Classrooms"];

const dayOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PREVIEW_ROWS = 100;

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function displayTime(value) {
  if (!value) return "—";

  const [hourText, minuteText] = String(value).split(":");
  const hour = Number(hourText);

  if (Number.isNaN(hour)) return String(value);

  return `${String(hour).padStart(2, "0")}:${String(
    minuteText || "00"
  ).padStart(2, "0")}`;
}

function mapTimetableEntry(item) {
  return {
    id: item.timetable_entry_id,
    offeringId: item.offering_id,
    day: titleCase(item.day_of_week),
    dayKey: String(item.day_of_week || "").toUpperCase(),
    startTime: item.start_time || "",
    endTime: item.end_time || "",
    room: item.room || "Not assigned",
    faculty: item.faculty_name || "Not assigned",
    department: item.department_name || "",
    courseCode: item.course_code || "",
    courseName: item.course_name || "",
    section: item.section || "",
    semester: item.semester ?? "",
    academicYear: item.academic_year || "",
  };
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getMappingStatusLabel(status) {
  const labels = {
    pending: "Awaiting match",
    matched: "Auto-matched",
    unmatched: "Unmatched",
    ambiguous: "Multiple matches",
    conflict: "Conflict",
    selected: "Selected — awaiting validation",
  };

  return labels[status] || "Needs review";
}

function TimetableManagement() {
  const fileInputRef = useRef(null);

  // Import workflow
  const [activeStep, setActiveStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Saved timetable
  const [activeTab, setActiveTab] = useState("Timetable");
  const [entries, setEntries] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState("");

  const [semester, setSemester] = useState("All");
  const [section, setSection] = useState("All");
  const [search, setSearch] = useState("");

  // Mapping review
  const [mapping, setMapping] = useState({});
  const [mappingMessage, setMappingMessage] = useState("");
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingStatusFilter, setMappingStatusFilter] = useState("All");
  const [mappingDepartmentFilter, setMappingDepartmentFilter] = useState("All");
  const [mappingSemesterFilter, setMappingSemesterFilter] = useState("All");
  const [mappingSectionFilter, setMappingSectionFilter] = useState("All");

  // Emergency faculty replacement
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  const [currentFacultySearch, setCurrentFacultySearch] = useState("");
  const [currentFacultyId, setCurrentFacultyId] = useState("");
  const [selectedCurrentFaculty, setSelectedCurrentFaculty] = useState("");

  const [adjustmentTargetId, setAdjustmentTargetId] = useState("");

  const [substituteSearch, setSubstituteSearch] = useState("");
  const [selectedSubstitute, setSelectedSubstitute] = useState("");
  const [adjustmentFacultyId, setAdjustmentFacultyId] = useState("");

  const [adjustmentReason, setAdjustmentReason] = useState(
    "Faculty unavailable"
  );
  const [customAdjustmentReason, setCustomAdjustmentReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [requestApproval, setRequestApproval] = useState(true);
  const [adjustmentMessage, setAdjustmentMessage] = useState("");

  const [notice, setNotice] = useState("");

  const loadTimetable = useCallback(async () => {
    setTimetableLoading(true);
    setTimetableError("");

    try {
      const response = await getAdminTimetable();

      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error("Unexpected timetable response from the server.");
      }

      setEntries(response.data.map(mapTimetableEntry));
    } catch (error) {
      setTimetableError(
        getErrorMessage(error, "Could not load the saved timetable.")
      );
    } finally {
      setTimetableLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadTimetable();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadTimetable]);

  const semesters = useMemo(
    () =>
      [
        ...new Set(
          entries
            .map((entry) => String(entry.semester))
            .filter((value) => value && value !== "undefined")
        ),
      ].sort((a, b) => Number(a) - Number(b)),
    [entries]
  );

  const sections = useMemo(
    () =>
      [
        ...new Set(
          entries
            .filter(
              (entry) =>
                semester === "All" || String(entry.semester) === semester
            )
            .map((entry) => String(entry.section))
            .filter((value) => value && value !== "undefined")
        ),
      ].sort(),
    [entries, semester]
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries
      .filter(
        (entry) =>
          semester === "All" || String(entry.semester) === semester
      )
      .filter(
        (entry) => section === "All" || String(entry.section) === section
      )
      .filter((entry) =>
        [
          entry.day,
          entry.courseCode,
          entry.courseName,
          entry.faculty,
          entry.room,
          entry.section,
          entry.academicYear,
        ].some((value) => String(value).toLowerCase().includes(query))
      )
      .sort((a, b) => {
        const aDay = dayOrder.indexOf(a.dayKey);
        const bDay = dayOrder.indexOf(b.dayKey);

        return (
          (aDay === -1 ? 99 : aDay) - (bDay === -1 ? 99 : bDay) ||
          a.startTime.localeCompare(b.startTime)
        );
      });
  }, [entries, semester, section, search]);

  const distinctCourses = useMemo(() => {
    const courses = new Map();

    entries.forEach((entry) => {
      const key = entry.courseCode || entry.courseName;
      if (key && !courses.has(key)) courses.set(key, entry);
    });

    return [...courses.values()];
  }, [entries]);

  const distinctFaculty = useMemo(
    () =>
      [
        ...new Set(
          entries
            .map((entry) => entry.faculty)
            .filter((name) => name && name !== "Not assigned")
        ),
      ].sort(),
    [entries]
  );

  const distinctRooms = useMemo(
    () =>
      [
        ...new Set(
          entries
            .map((entry) => entry.room)
            .filter((room) => room && room !== "Not assigned")
        ),
      ].sort(),
    [entries]
  );

  // Faculty searches currently use faculty names found in saved timetable data.
  const currentFacultyOptions = useMemo(() => {
    const query = currentFacultySearch.trim().toLowerCase();

    return distinctFaculty.filter((name) =>
      name.toLowerCase().includes(query)
    );
  }, [distinctFaculty, currentFacultySearch]);

  const selectedFacultyEntries = useMemo(
    () =>
      entries.filter((entry) => entry.faculty === selectedCurrentFaculty),
    [entries, selectedCurrentFaculty]
  );

  const selectedAdjustmentEntry = useMemo(
    () =>
      entries.find(
        (entry) => String(entry.id) === String(adjustmentTargetId)
      ) || null,
    [entries, adjustmentTargetId]
  );

  const substituteFacultyOptions = useMemo(() => {
    const query = substituteSearch.trim().toLowerCase();

    return distinctFaculty.filter(
      (name) =>
        name !== selectedCurrentFaculty && name.toLowerCase().includes(query)
    );
  }, [distinctFaculty, selectedCurrentFaculty, substituteSearch]);

  const previewEntries = useMemo(() => preview?.entries || [], [preview]);

  const mappingRows = useMemo(
    () =>
      previewEntries.map((entry, index) => {
        const current = mapping[index] || {};

        return {
          index,
          entry,
          status: current.status || "pending",
          offeringId: current.offeringId || "",
          candidates: current.candidates || [],
          department: entry.department || entry.department_name || "",
          semester: String(entry.semester ?? ""),
          section: entry.section || entry.class_group || "",
          courseCode: entry.course_code || entry.courseCode || "",
          courseName: entry.course_name || entry.courseName || "",
        };
      }),
    [previewEntries, mapping]
  );

  const mappingCounts = useMemo(() => {
    const counts = {
      pending: 0,
      matched: 0,
      unmatched: 0,
      ambiguous: 0,
      conflict: 0,
      needsReview: 0,
    };

    mappingRows.forEach((row) => {
      if (Object.hasOwn(counts, row.status)) counts[row.status] += 1;

      if (
        ["pending", "unmatched", "ambiguous", "conflict"].includes(row.status)
      ) {
        counts.needsReview += 1;
      }
    });

    return counts;
  }, [mappingRows]);

  const mappingFilterOptions = useMemo(
    () => ({
      departments: [
        ...new Set(mappingRows.map((row) => row.department).filter(Boolean)),
      ].sort(),
      semesters: [
        ...new Set(mappingRows.map((row) => row.semester).filter(Boolean)),
      ].sort(),
      sections: [
        ...new Set(mappingRows.map((row) => row.section).filter(Boolean)),
      ].sort(),
    }),
    [mappingRows]
  );

  const filteredMappingRows = useMemo(() => {
    const query = mappingSearch.trim().toLowerCase();

    return mappingRows.filter((row) => {
      const matchesStatus =
        mappingStatusFilter === "All" || row.status === mappingStatusFilter;
      const matchesDepartment =
        mappingDepartmentFilter === "All" ||
        row.department === mappingDepartmentFilter;
      const matchesSemester =
        mappingSemesterFilter === "All" ||
        row.semester === mappingSemesterFilter;
      const matchesSection =
        mappingSectionFilter === "All" ||
        row.section === mappingSectionFilter;

      const matchesSearch = [
        row.courseCode,
        row.courseName,
        row.department,
        row.semester,
        row.section,
        row.entry.day_of_week,
        row.entry.raw_cell,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      return (
        matchesStatus &&
        matchesDepartment &&
        matchesSemester &&
        matchesSection &&
        matchesSearch
      );
    });
  }, [
    mappingRows,
    mappingSearch,
    mappingStatusFilter,
    mappingDepartmentFilter,
    mappingSemesterFilter,
    mappingSectionFilter,
  ]);

  const mappedCount = mappingCounts.matched;

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setPreviewError("");
    setNotice("");
    setMappingMessage("");
    setPreview(null);
    setMapping({});
    setMappingSearch("");
    setMappingStatusFilter("All");
    setMappingDepartmentFilter("All");
    setMappingSemesterFilter("All");
    setMappingSectionFilter("All");

    if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setPreviewError("Only .xlsx Excel files are currently supported.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setPreviewError("The workbook must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setActiveStep(1);
  }

  async function handlePreview() {
    if (!file) {
      setPreviewError("Choose an Excel workbook first.");
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");
    setMappingMessage("");
    setNotice("");

    try {
      const response = await previewTimetableImport(file);

      if (!response?.success || !Array.isArray(response.entries)) {
        throw new Error(response?.message || "Could not preview this workbook.");
      }

      setPreview(response);
      setMapping({});
      setActiveStep(2);
      setNotice(
        "Preview generated successfully. No timetable records have been saved."
      );
    } catch (error) {
      setPreviewError(getErrorMessage(error, "The timetable preview failed."));
    } finally {
      setPreviewLoading(false);
    }
  }

  function downloadPreviewCsv() {
    if (!previewEntries.length) return;

    const columns = [
      "source_row",
      "day_of_week",
      "period",
      "start_time",
      "end_time",
      "class_group",
      "course_code",
      "raw_assignment",
      "status",
      "review_reason",
      "raw_cell",
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const lines = [
      columns.map(escapeCsv).join(","),
      ...previewEntries.map((entry) =>
        columns.map((column) => escapeCsv(entry[column])).join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "timetable-preview.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function goToStep(step) {
    setPreviewError("");
    setMappingMessage("");

    if (step === 1) {
      setActiveStep(1);
      return;
    }

    if (!preview) {
      setPreviewError("Upload a workbook and generate its preview first.");
      return;
    }

    if (step === 2) {
      setActiveStep(2);
      return;
    }

    if (step === 3) {
      if (!previewEntries.length) {
        setPreviewError("No extracted rows are available to map.");
        return;
      }

      setActiveStep(3);
      return;
    }

    if (step === 4 && !hasValidMappings()) {
      setMappingMessage(
        "Please assign a valid Offering ID to every timetable row."
      );
    }
  }

  function hasValidMappings() {
    return (
      mappingRows.length > 0 &&
      mappingRows.every(
        (row) =>
          row.status === "matched" &&
          row.offeringId !== "" &&
          row.offeringId !== null &&
          row.offeringId !== undefined
      )
    );
  }

  function updateMapping(index, updates) {
    setMapping((current) => ({
      ...current,
      [index]: { ...(current[index] || {}), ...updates },
    }));

    setMappingMessage("");
    setNotice("");
  }

  function openAdjustment(entry = null) {
    setAdjustmentOpen(true);

    setCurrentFacultySearch(entry?.faculty || "");
    setCurrentFacultyId("");
    setSelectedCurrentFaculty(entry?.faculty || "");
    setAdjustmentTargetId(entry ? String(entry.id) : "");

    setSubstituteSearch("");
    setSelectedSubstitute("");
    setAdjustmentFacultyId("");

    setAdjustmentReason("Faculty unavailable");
    setCustomAdjustmentReason("");
    setEffectiveDate(new Date().toLocaleDateString("en-CA"));
    setRequestApproval(true);
    setAdjustmentMessage("");
  }

  function cancelAdjustment() {
    setAdjustmentOpen(false);
    setAdjustmentMessage("");
  }

  function submitAdjustment(event) {
    event.preventDefault();

    if (!selectedCurrentFaculty) {
      setAdjustmentMessage("Search for and select the current faculty.");
      return;
    }

    if (!selectedAdjustmentEntry) {
      setAdjustmentMessage("Select the affected class to reassign.");
      return;
    }

    if (selectedAdjustmentEntry.faculty !== selectedCurrentFaculty) {
      setAdjustmentMessage(
        "The selected class does not belong to the selected current faculty."
      );
      return;
    }

    if (!selectedSubstitute) {
      setAdjustmentMessage("Search for and select a substitute faculty member.");
      return;
    }

    if (selectedSubstitute === selectedCurrentFaculty) {
      setAdjustmentMessage(
        "The substitute must be different from the current faculty."
      );
      return;
    }

    if (!effectiveDate) {
      setAdjustmentMessage("Select the effective date.");
      return;
    }

    if (adjustmentReason === "Other" && !customAdjustmentReason.trim()) {
      setAdjustmentMessage("Enter a custom reason for the adjustment.");
      return;
    }

    const reason =
      adjustmentReason === "Other"
        ? customAdjustmentReason.trim()
        : adjustmentReason;

    setAdjustmentMessage(
      `Local validation passed. ${selectedCurrentFaculty} → ${selectedSubstitute}; ` +
        `${selectedAdjustmentEntry.courseCode || selectedAdjustmentEntry.courseName || "Selected course"}; ` +
        `effective ${effectiveDate}; reason: ${reason}. ` +
        `Approval ${requestApproval ? "requested" : "not requested"}. ` +
        "This has NOT been assigned, submitted, or saved because the backend endpoint is not connected."
    );
  }

  function handleSaveStep() {
    if (!hasValidMappings()) {
      setActiveStep(3);
      setMappingMessage(
        "Complete the course-offering IDs for every extracted row before checking save readiness."
      );
      return;
    }

    setNotice(
      "Frontend checks passed. Nothing has been saved. A backend endpoint must validate the offerings, detect schedule conflicts, and persist the import."
    );
  }

  const tabIcons = {
    Timetable: faCalendarDays,
    Courses: faFileLines,
    Faculty: faUsers,
    Classrooms: faListCheck,
  };

  return (
    <section className="timetable-page">
      <div className="timetable-workspace">
        {/* SECTION 1: Upload and import workflow */}
        <header className="timetable-import-heading">
          <div className="timetable-heading-icon">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <div>
            <h2>Upload Timetable File</h2>
            <p>
              Upload an Excel file to extract timetable data and prepare it for
              validation.
            </p>
          </div>
        </header>

        <nav className="timetable-stepper" aria-label="Timetable import steps">
          {steps.map((label, index) => {
            const step = index + 1;
            const completed = step < activeStep;

            return (
              <button
                type="button"
                key={label}
                className={[
                  "timetable-step",
                  activeStep === step ? "is-active" : "",
                  completed ? "is-complete" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => goToStep(step)}
                aria-current={activeStep === step ? "step" : undefined}
              >
                <span className="timetable-step-circle">
                  {completed ? <FontAwesomeIcon icon={faCheck} /> : step}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <section className="timetable-upload-card">
          <div className="timetable-file-summary">
            <div className="timetable-excel-icon">
              <FontAwesomeIcon icon={faFileExcel} />
            </div>

            <div className="timetable-file-copy">
              <strong>{file?.name || "No timetable file selected"}</strong>
              <span>
                {file
                  ? `Excel (.xlsx) · ${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Supported format: .xlsx · Maximum size: 10 MB"}
              </span>
              <span>
                {file
                  ? "File selected and ready for preview."
                  : "Choose the workbook used by your institution."}
              </span>
              {file && (
                <span className="timetable-success-label">
                  <FontAwesomeIcon icon={faCheck} /> File selected
                </span>
              )}
            </div>

            <div className="timetable-upload-actions">
              <input
                ref={fileInputRef}
                className="timetable-hidden-input"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="timetable-outline-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <FontAwesomeIcon icon={faCloudArrowUp} />
                {file ? "Change File" : "Choose File"}
              </button>
              <button
                type="button"
                className="timetable-primary-button"
                onClick={handlePreview}
                disabled={!file || previewLoading}
              >
                <FontAwesomeIcon icon={faFileLines} />
                {previewLoading ? "Generating Preview..." : "Extract & Preview"}
              </button>
            </div>
          </div>

          <div className="timetable-file-information">
            <div className="timetable-information-heading">
              <FontAwesomeIcon icon={faInfoCircle} />
              <strong>File Information</strong>
            </div>
            <div className="timetable-file-metadata">
              <div>
                <span>File Name</span>
                <strong>{file?.name || "—"}</strong>
              </div>
              <div>
                <span>File Type</span>
                <strong>{file ? "Excel (.xlsx)" : "—"}</strong>
              </div>
              <div>
                <span>File Size</span>
                <strong>
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "—"}
                </strong>
              </div>
              <div>
                <span>Preview Status</span>
                <strong>
                  {previewLoading
                    ? "Processing..."
                    : preview
                      ? "Preview ready"
                      : "Not processed"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {previewError && (
          <div className="timetable-alert timetable-alert-error" role="alert">
            <strong>Unable to continue</strong>
            <span>{previewError}</span>
          </div>
        )}

        {notice && (
          <div className="timetable-alert timetable-alert-info" role="status">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>{notice}</span>
          </div>
        )}

        {/* SECTION 2: Saved timetable management */}
        <section className="timetable-management-section">
          <div className="timetable-preview-toolbar">
            <div>
              <h3>Timetable Management</h3>
              <p>View saved timetable entries, courses, faculty, and classrooms.</p>
            </div>
            <button
              type="button"
              className="timetable-outline-button"
              onClick={loadTimetable}
              disabled={timetableLoading}
            >
              {timetableLoading ? "Loading..." : "Refresh Data"}
            </button>
          </div>

          <nav
            className="timetable-tabs"
            aria-label="Timetable management sections"
          >
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? "is-active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                <FontAwesomeIcon icon={tabIcons[tab]} />
                {tab}
              </button>
            ))}
          </nav>

          {timetableError && (
            <div className="timetable-alert timetable-alert-error" role="alert">
              <span>{timetableError}</span>
              <button type="button" onClick={loadTimetable}>
                Retry
              </button>
            </div>
          )}

          {activeTab === "Timetable" && (
            <>
              <div className="timetable-filter-bar">
                <label>
                  <span>Semester</span>
                  <select
                    value={semester}
                    onChange={(event) => {
                      setSemester(event.target.value);
                      setSection("All");
                    }}
                  >
                    <option value="All">All semesters</option>
                    {semesters.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Section</span>
                  <select
                    value={section}
                    onChange={(event) => setSection(event.target.value)}
                  >
                    <option value="All">All sections</option>
                    {sections.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="timetable-filter-search">
                  <span>Search timetable</span>
                  <div className="timetable-search-input">
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Course, faculty, room..."
                    />
                  </div>
                </label>
              </div>

              <div className="timetable-result-summary">
                <span>{filteredEntries.length} matching entries</span>
                <span>{entries.length} total saved entries</span>
              </div>

              <div className="timetable-table-wrapper">
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Period</th>
                      <th>Time</th>
                      <th>Class Group</th>
                      <th>Course Code</th>
                      <th>Extracted Assignment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetableLoading ? (
                      <tr>
                        <td colSpan={7} className="timetable-table-message">
                          Loading saved timetable...
                        </td>
                      </tr>
                    ) : filteredEntries.length ? (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.day}</td>
                          <td>
                            {displayTime(entry.startTime)} –{" "}
                            {displayTime(entry.endTime)}
                          </td>
                          <td>{entry.courseCode || "—"}</td>
                          <td>{entry.courseName || "—"}</td>
                          <td>{entry.faculty}</td>
                          <td>{entry.room}</td>
                          <td>{entry.section || "—"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="timetable-table-message">
                          No saved timetable records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "Courses" && (
            <div className="timetable-table-wrapper">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Academic Year</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableLoading ? (
                    <tr>
                      <td colSpan={6} className="timetable-table-message">
                        Loading saved courses...
                      </td>
                    </tr>
                  ) : distinctCourses.length ? (
                    distinctCourses.map((entry) => (
                      <tr key={entry.courseCode || entry.courseName}>
                        <td>{entry.courseCode || "—"}</td>
                        <td>{entry.courseName || "—"}</td>
                        <td>{entry.department || "—"}</td>
                        <td>{entry.semester || "—"}</td>
                        <td>{entry.section || "—"}</td>
                        <td>{entry.academicYear || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="timetable-table-message">
                        No saved course assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Faculty" && (
            <div className="timetable-table-wrapper">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Assigned Courses</th>
                    <th>Timetable Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableLoading ? (
                    <tr>
                      <td colSpan={3} className="timetable-table-message">
                        Loading faculty...
                      </td>
                    </tr>
                  ) : distinctFaculty.length ? (
                    distinctFaculty.map((name) => {
                      const facultyEntries = entries.filter(
                        (entry) => entry.faculty === name
                      );
                      const courses = new Set(
                        facultyEntries
                          .map((entry) => entry.courseCode || entry.courseName)
                          .filter(Boolean)
                      );

                      return (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{courses.size}</td>
                          <td>{facultyEntries.length}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="timetable-table-message">
                        No saved faculty assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Classrooms" && (
            <div className="timetable-table-wrapper">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Classroom</th>
                    <th>Scheduled Classes</th>
                    <th>Days Used</th>
                    <th>Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableLoading ? (
                    <tr>
                      <td colSpan={4} className="timetable-table-message">
                        Loading classrooms...
                      </td>
                    </tr>
                  ) : distinctRooms.length ? (
                    distinctRooms.map((room) => {
                      const roomEntries = entries.filter(
                        (entry) => entry.room === room
                      );
                      const days = new Set(
                        roomEntries.map((entry) => entry.dayKey)
                      );
                      const courses = new Set(
                        roomEntries
                          .map((entry) => entry.courseCode || entry.courseName)
                          .filter(Boolean)
                      );

                      return (
                        <tr key={room}>
                          <td>{room}</td>
                          <td>{roomEntries.length}</td>
                          <td>{days.size}</td>
                          <td>{courses.size}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="timetable-table-message">
                        No saved classroom assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Import preview, mapping and save-readiness */}
        {activeStep >= 2 && preview && (
          <>
            {activeStep === 2 && (
              <section className="timetable-stage-card timetable-preview-card">
                <div className="timetable-preview-toolbar">
                  <div>
                    <h3>Extracted Timetable Preview</h3>
                    <p>
                      {preview.entry_count ?? previewEntries.length} rows
                      extracted from {preview.source_sheet || "the workbook"}.
                      These rows have not been saved.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="timetable-outline-button"
                    onClick={downloadPreviewCsv}
                    disabled={!previewEntries.length}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    Download Preview
                  </button>
                </div>

                <div className="timetable-result-summary">
                  <span>{previewEntries.length} extracted rows</span>
                  <span>
                    {preview.error_count ?? preview.errors?.length ?? 0} preview
                    errors
                  </span>
                </div>

                <div className="timetable-table-wrapper">
                  <table className="timetable-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Period</th>
                        <th>Time</th>
                        <th>Class Group</th>
                        <th>Extracted Cell</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewEntries.length ? (
                        previewEntries.map((entry, index) => (
                          <tr
                            key={`${entry.source_row}-${entry.class_group}-${index}`}
                          >
                            <td>{titleCase(entry.day_of_week)}</td>
                            <td>{entry.period || "—"}</td>
                            <td>
                              {displayTime(entry.start_time)} – {displayTime(entry.end_time)}
                            </td>
                            <td>{entry.class_group || "—"}</td>
                            <td>{entry.course_code || "Not detected"}</td>
                            <td>{entry.raw_assignment || entry.raw_cell || "—"}</td>
                            <td>{entry.status || "Needs review"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="timetable-table-message">
                            No timetable rows were extracted.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {previewEntries.length > MAX_PREVIEW_ROWS && (
                  <p className="timetable-table-footnote">
                    All {previewEntries.length} extracted rows are included in
                    the CSV download. Consider pagination for large files.
                  </p>
                )}

                {preview.errors?.length > 0 && (
                  <div className="timetable-validation-errors">
                    <h4>Preview validation errors ({preview.errors.length})</h4>
                    {preview.errors.map((item, index) => (
                      <p key={`${item.row}-${index}`}>
                        Row {item.row}: {item.message}
                        {item.value ? ` (${item.value})` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeStep === 3 && (
              <section className="timetable-stage-card">
                <div className="timetable-stage-title">
                  <span className="timetable-stage-number">3</span>
                  <div>
                    <h3>Map & Assign Timetable Data</h3>
                    <p>
                      Review course matches and resolve rows that need attention.
                    </p>
                  </div>
                </div>

                <div className="timetable-alert timetable-alert-info" role="status">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    Automatic matching must be provided by the backend API.
                    Until it is available, rows remain pending and cannot be
                    marked as matched manually.
                  </span>
                </div>

                <div className="timetable-mapping-summary">
                  <div className="timetable-mapping-stat">
                    <span>Extracted rows</span>
                    <strong>{mappingRows.length}</strong>
                  </div>
                  <div className="timetable-mapping-stat">
                    <span>Auto-matched</span>
                    <strong>{mappingCounts.matched}</strong>
                  </div>
                  <div className="timetable-mapping-stat">
                    <span>Needs review</span>
                    <strong>{mappingCounts.needsReview}</strong>
                  </div>
                </div>

                <div className="timetable-mapping-filters">
                  <label>
                    <span>Mapping status</span>
                    <select
                      value={mappingStatusFilter}
                      onChange={(event) =>
                        setMappingStatusFilter(event.target.value)
                      }
                    >
                      <option value="All">All statuses</option>
                      <option value="pending">Awaiting match</option>
                      <option value="matched">Auto-matched</option>
                      <option value="unmatched">Unmatched</option>
                      <option value="ambiguous">Multiple matches</option>
                      <option value="conflict">Conflict</option>
                    </select>
                  </label>

                  <label>
                    <span>Department</span>
                    <select
                      value={mappingDepartmentFilter}
                      onChange={(event) =>
                        setMappingDepartmentFilter(event.target.value)
                      }
                    >
                      <option value="All">All departments</option>
                      {mappingFilterOptions.departments.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Semester</span>
                    <select
                      value={mappingSemesterFilter}
                      onChange={(event) =>
                        setMappingSemesterFilter(event.target.value)
                      }
                    >
                      <option value="All">All semesters</option>
                      {mappingFilterOptions.semesters.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Section</span>
                    <select
                      value={mappingSectionFilter}
                      onChange={(event) =>
                        setMappingSectionFilter(event.target.value)
                      }
                    >
                      <option value="All">All sections</option>
                      {mappingFilterOptions.sections.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Search extracted rows</span>
                    <div className="timetable-search-input">
                      <FontAwesomeIcon icon={faSearch} />
                      <input
                        value={mappingSearch}
                        onChange={(event) => setMappingSearch(event.target.value)}
                        placeholder="Course, department, or extracted text..."
                      />
                    </div>
                  </label>
                </div>

                <div className="timetable-result-summary">
                  <span>{filteredMappingRows.length} rows shown</span>
                  <span>{mappingRows.length} total extracted rows</span>
                </div>

                <div className="timetable-table-wrapper">
                  <table className="timetable-table">
                    <thead>
                      <tr>
                        <th>Source Row</th>
                        <th>Day / Period</th>
                        <th>Course / Class Group</th>
                        <th>Department</th>
                        <th>Mapping Status</th>
                        <th>Course Offering</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMappingRows.map((row) => (
                        <tr key={`${row.entry.source_row}-${row.index}`}>
                          <td>{row.entry.source_row ?? row.index + 1}</td>
                          <td>
                            {titleCase(row.entry.day_of_week)} ·{" "}
                            {row.entry.period || "—"}
                          </td>
                          <td>
                            <strong>
                              {row.courseCode || row.courseName || "Not identified"}
                            </strong>
                            <div>
                              {row.section ||
                                row.entry.class_group ||
                                "Class group not identified"}
                            </div>
                            <small>{row.entry.raw_cell || ""}</small>
                          </td>
                          <td>{row.department || "Not identified"}</td>
                          <td>
                            <span
                              className="timetable-mapping-status"
                              data-status={row.status}
                            >
                              {getMappingStatusLabel(row.status)}
                            </span>
                          </td>
                          <td>
                            {row.candidates.length > 0 ? (
                              <select
                                value={row.offeringId}
                                onChange={(event) => {
                                  const selectedId = event.target.value;
                                  updateMapping(row.index, {
                                    offeringId: selectedId,
                                    status: selectedId ? "matched" : "pending",
                                  });
                                }}
                                aria-label={`Select course offering for row ${row.index + 1}`}
                              >
                                <option value="">Choose matching offering</option>
                                {row.candidates.map((candidate) => {
                                  const id = String(
                                    candidate.offering_id ?? candidate.id
                                  );

                                  return (
                                    <option key={id} value={id}>
                                      {candidate.course_code ||
                                        candidate.course_name ||
                                        "Course"}{" "}
                                      · Semester {candidate.semester ?? "—"} ·
                                      Section {candidate.section || "—"} · ID {id}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <span>Awaiting backend match results</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {filteredMappingRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="timetable-table-message">
                            No rows match the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {mappingMessage && (
                  <div
                    className="timetable-alert timetable-alert-error"
                    role="alert"
                  >
                    {mappingMessage}
                  </div>
                )}
              </section>
            )}

            {activeStep === 4 && (
              <section className="timetable-stage-card">
                <div className="timetable-stage-title">
                  <span className="timetable-stage-number">4</span>
                  <div>
                    <h3>Save Data</h3>
                    <p>Review the mapping and save-readiness checks.</p>
                  </div>
                </div>

                <div className="timetable-result-summary">
                  <span>Extracted rows: {previewEntries.length}</span>
                  <span>Rows with positive offering IDs: {mappedCount}</span>
                </div>

                <div className="timetable-alert timetable-alert-info" role="status">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    Import persistence is not implemented. The backend must
                    validate offerings, faculty, rooms, time ranges, and
                    scheduling conflicts before saving records.
                  </span>
                </div>

                {mappingMessage && (
                  <div className="timetable-alert timetable-alert-error" role="alert">
                    {mappingMessage}
                  </div>
                )}
              </section>
            )}

            <footer className="timetable-wizard-footer">
              <button
                type="button"
                className="timetable-outline-button"
                onClick={() => {
                  setActiveStep((current) => Math.max(1, current - 1));
                  setPreviewError("");
                  setMappingMessage("");
                  setNotice("");
                }}
              >
                Back
              </button>

              {activeStep === 2 && (
                <button
                  type="button"
                  className="timetable-primary-button"
                  disabled={!previewEntries.length}
                  onClick={() => {
                    setMappingMessage("");
                    setNotice("");
                    setActiveStep(3);
                  }}
                >
                  Next: Map & Assign
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              )}

              {activeStep === 3 && (
                <button
                  type="button"
                  className="timetable-primary-button"
                  onClick={() => {
                    if (!hasValidMappings()) {
                      setMappingMessage(
                        "Resolve all unmatched, ambiguous, pending, and conflicting rows before continuing."
                      );
                      return;
                    }
                    goToStep(4);
                    setActiveStep(4);
                  }}
                >
                  Next: Save Data
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              )}

              {activeStep === 4 && (
                <button
                  type="button"
                  className="timetable-primary-button"
                  onClick={handleSaveStep}
                >
                  <FontAwesomeIcon icon={faSave} />
                  Check Save Readiness
                </button>
              )}
            </footer>
          </>
        )}

        {/* SECTION 3: Emergency Faculty Adjustment */}
        <section className="timetable-adjustment-section">
          <div className="timetable-adjustment-heading">
            <div className="timetable-heading-icon timetable-heading-icon-small">
              <FontAwesomeIcon icon={faUserClock} />
            </div>

            <div className="timetable-adjustment-heading-copy">
              <h3>Faculty Adjustment</h3>
              <p>
                Search for an absent faculty member, select the affected class,
                and choose a substitute.
              </p>
            </div>

            <button
              type="button"
              className="timetable-primary-button"
              onClick={() => openAdjustment()}
            >
              <FontAwesomeIcon icon={faUsers} />
              Add Faculty Adjustment
            </button>
          </div>

          {adjustmentOpen && (
            <form
              className="timetable-adjustment-form"
              onSubmit={submitAdjustment}
            >
              <h4>Emergency Faculty Replacement</h4>

              <div className="timetable-adjustment-faculty-grid">
                {/* Absent/current faculty */}
                <div className="timetable-adjustment-box">
                  <h4>Current Assigned Faculty</h4>

                  <label>
                    Search faculty by name
                    <input
                      list="current-faculty-options"
                      value={currentFacultySearch}
                      onChange={(event) => {
                        const value = event.target.value;
                        const exactMatch = distinctFaculty.includes(value);

                        setCurrentFacultySearch(value);
                        setSelectedCurrentFaculty(exactMatch ? value : "");
                        setAdjustmentTargetId("");
                        setAdjustmentMessage("");
                      }}
                      placeholder="Type a faculty name"
                      autoComplete="off"
                      required
                    />
                    <datalist id="current-faculty-options">
                      {currentFacultyOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </label>

                  <label>
                    Faculty ID (if known)
                    <input
                      value={currentFacultyId}
                      onChange={(event) => setCurrentFacultyId(event.target.value)}
                      placeholder="Enter faculty ID"
                    />
                  </label>

                  <label>
                    Select affected class
                    <select
                      value={adjustmentTargetId}
                      onChange={(event) => {
                        setAdjustmentTargetId(event.target.value);
                        setAdjustmentMessage("");
                      }}
                      required
                      disabled={!selectedCurrentFaculty}
                    >
                      <option value="">
                        {selectedCurrentFaculty
                          ? "Select a class to reassign"
                          : "Select a current faculty first"}
                      </option>
                      {selectedFacultyEntries.map((entry) => (
                        <option key={entry.id} value={String(entry.id)}>
                          {entry.day} · {displayTime(entry.startTime)}–
                          {displayTime(entry.endTime)} ·{" "}
                          {entry.courseCode || entry.courseName || "Course"} ·
                          Section {entry.section || "—"}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedAdjustmentEntry && (
                    <div className="timetable-adjustment-detail">
                      <span>Selected assignment</span>
                      <strong>
                        {selectedAdjustmentEntry.day},{" "}
                        {displayTime(selectedAdjustmentEntry.startTime)}–
                        {displayTime(selectedAdjustmentEntry.endTime)}
                      </strong>
                      <strong>
                        {selectedAdjustmentEntry.courseCode ||
                          selectedAdjustmentEntry.courseName ||
                          "Course"}{" "}
                        · {selectedAdjustmentEntry.room}
                      </strong>
                    </div>
                  )}

                  <div className="timetable-adjustment-note">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>
                      The current timetable API does not provide faculty IDs.
                      Entering an ID here does not verify it.
                    </span>
                  </div>
                </div>

                {/* Substitute faculty */}
                <div className="timetable-adjustment-box">
                  <h4>Substitute Faculty</h4>

                  <label>
                    Search substitute by name
                    <input
                      list="substitute-faculty-options"
                      value={substituteSearch}
                      onChange={(event) => {
                        const value = event.target.value;
                        const exactMatch = distinctFaculty.includes(value);

                        setSubstituteSearch(value);
                        setSelectedSubstitute(
                          exactMatch && value !== selectedCurrentFaculty
                            ? value
                            : ""
                        );
                        setAdjustmentMessage("");
                      }}
                      placeholder="Type a substitute name"
                      autoComplete="off"
                      required
                    />
                    <datalist id="substitute-faculty-options">
                      {substituteFacultyOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </label>

                  <label>
                    Faculty ID (if known)
                    <input
                      value={adjustmentFacultyId}
                      onChange={(event) =>
                        setAdjustmentFacultyId(event.target.value)
                      }
                      placeholder="Enter substitute faculty ID"
                    />
                  </label>

                  <div className="timetable-adjustment-note">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>
                      Substitute options are limited to faculty appearing in
                      saved timetable entries. A faculty-directory API is
                      needed to search all faculty by name or ID.
                    </span>
                  </div>
                </div>
              </div>

              <div className="timetable-adjustment-box timetable-adjustment-request-box">
                <h4>Adjustment Request</h4>

                <div className="timetable-adjustment-request-grid">
                  <label>
                    Reason for adjustment
                    <select
                      value={adjustmentReason}
                      onChange={(event) => {
                        setAdjustmentReason(event.target.value);
                        setAdjustmentMessage("");
                      }}
                    >
                      <option value="Faculty unavailable">
                        Faculty unavailable
                      </option>
                      <option value="Schedule conflict">Schedule conflict</option>
                      <option value="Approved leave">Approved leave</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Effective date
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(event) => {
                        setEffectiveDate(event.target.value);
                        setAdjustmentMessage("");
                      }}
                      required
                    />
                  </label>
                </div>

                {adjustmentReason === "Other" && (
                  <label>
                    Custom reason
                    <textarea
                      value={customAdjustmentReason}
                      onChange={(event) => {
                        setCustomAdjustmentReason(event.target.value);
                        setAdjustmentMessage("");
                      }}
                      placeholder="Explain why this replacement is required"
                      required
                    />
                  </label>
                )}

                <label className="timetable-checkbox-field">
                  <input
                    type="checkbox"
                    checked={requestApproval}
                    onChange={(event) =>
                      setRequestApproval(event.target.checked)
                    }
                  />
                  Request approval before changing the assignment
                </label>

                <div className="timetable-adjustment-approval-status">
                  <strong>Approval status</strong>
                  <span>
                    {requestApproval
                      ? "Approval requested — not yet submitted"
                      : "Approval not requested — not yet submitted"}
                  </span>
                </div>

                {adjustmentMessage && (
                  <div
                    className="timetable-alert timetable-alert-info"
                    role="status"
                  >
                    {adjustmentMessage}
                  </div>
                )}

                <div className="timetable-form-actions">
                  <button
                    type="button"
                    className="timetable-outline-button"
                    onClick={cancelAdjustment}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="timetable-primary-button">
                    <FontAwesomeIcon icon={faCheck} />
                    Assign Faculty
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="timetable-adjustment-note">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>
              Assign Faculty currently performs local validation only. Actual
              reassignment requires a backend endpoint to validate faculty
              availability, detect timetable conflicts, apply approval rules,
              and save the change.
            </span>
          </div>
        </section>
      </div>
    </section>
  );
}

export default TimetableManagement;
