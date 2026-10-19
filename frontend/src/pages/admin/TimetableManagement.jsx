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
  faCheckCircle,
  faChevronRight,
  faCloudArrowUp,
  faDownload,
  faFileExcel,
  faFileLines,
  faFilter,
  faInfoCircle,
  faLayerGroup,
  faListCheck,
  faRotateRight,
  faSave,
  faSearch,
  faShieldHalved,
  faTriangleExclamation,
  faUserClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import {
  getAdminTimetable,
  getImportAcademicYears,
  getImportWorkbookSheets,
  analyzeTimetableImport,
  commitTimetableImport,
} from "../../services/timetableService";

import "./TimetableManagement.css";

const steps = [
  "Upload & Year",
  "Extract & Preview",
  "Map & Resolve",
  "Review & Commit",
  "Import Summary",
];

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
    warning: "Matched with warning",
    unmatched: "Unmatched",
    ambiguous: "Multiple matches",
    conflict: "Conflict",
    duplicate: "Duplicate",
    selected: "Selected",
  };

  return labels[status] || "Needs review";
}

function TimetableManagement() {
  const fileInputRef = useRef(null);

  // Import workflow state
  const [activeStep, setActiveStep] = useState(1);
  const [file, setFile] = useState(null);
  const [academicYears, setAcademicYears] = useState(["2026-27", "2024-28"]);
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [customAcademicYear, setCustomAcademicYear] = useState("");
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  // Analysis result from backend
  const [analysisResult, setAnalysisResult] = useState(null);
  const [entryOverrides, setEntryOverrides] = useState({});
  const [selectedRows, setSelectedRows] = useState({});
  const [importMode, setImportMode] = useState("add_missing");
  const [confirmCommit, setConfirmCommit] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [commitError, setCommitError] = useState("");
  const [notice, setNotice] = useState("");

  // Saved timetable state
  const [activeTab, setActiveTab] = useState("Timetable");
  const [entries, setEntries] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState("");

  const [semester, setSemester] = useState("All");
  const [section, setSection] = useState("All");
  const [search, setSearch] = useState("");

  // Step 3 mapping filters
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingStatusFilter, setMappingStatusFilter] = useState("All");
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
  const [adjustmentReason, setAdjustmentReason] = useState("Faculty unavailable");
  const [customAdjustmentReason, setCustomAdjustmentReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [requestApproval, setRequestApproval] = useState(true);
  const [adjustmentMessage, setAdjustmentMessage] = useState("");

  const effectiveAcademicYear =
    academicYear === "CUSTOM" ? customAcademicYear.trim() : academicYear;

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

  useEffect(() => {
    async function loadYears() {
      try {
        const res = await getImportAcademicYears();
        if (res?.success && Array.isArray(res.academic_years)) {
          setAcademicYears(res.academic_years);
          if (res.default) setAcademicYear(res.default);
        }
      } catch (err) {
        console.debug("Could not load academic years:", err?.message);
      }
    }
    void loadYears();
  }, []);

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

  const currentFacultyOptions = useMemo(() => {
    const query = currentFacultySearch.trim().toLowerCase();

    return distinctFaculty.filter((name) =>
      name.toLowerCase().includes(query)
    );
  }, [distinctFaculty, currentFacultySearch]);

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

  // Merge analysis entries with admin overrides and selections
  const processedRows = useMemo(() => {
    if (!analysisResult?.entries) return [];

    return analysisResult.entries.map((item) => {
      const override = entryOverrides[item.index] || {};
      const courseId =
        override.course_id !== undefined ? override.course_id : item.course_id;
      const facultyId =
        override.faculty_id !== undefined ? override.faculty_id : item.faculty_id;
      const room = override.room !== undefined ? override.room : item.room;
      const sectionVal =
        override.section !== undefined ? override.section : item.section;
      const semesterVal =
        override.semester !== undefined ? override.semester : item.semester;

      const courseObj = (analysisResult.available_courses || []).find(
        (c) => c.course_id === Number(courseId)
      );
      const facultyObj = (analysisResult.available_faculty || []).find(
        (f) => f.faculty_id === Number(facultyId)
      );

      let effectiveStatus = item.status;
      if (override.course_id) {
        effectiveStatus = "matched";
      }

      return {
        ...item,
        course_id: courseId,
        course_code: courseObj ? courseObj.course_code : item.course_code,
        course_name: courseObj ? courseObj.course_name : item.course_name,
        semester: courseObj ? courseObj.semester : semesterVal,
        faculty_id: facultyId,
        faculty_name: facultyObj ? facultyObj.name : item.faculty_name,
        room: room,
        section: sectionVal,
        status: effectiveStatus,
        isSelected: selectedRows[item.index] !== false,
      };
    });
  }, [analysisResult, entryOverrides, selectedRows]);

  const mappingCounts = useMemo(() => {
    const counts = {
      total: processedRows.length,
      matched: 0,
      warning: 0,
      ambiguous: 0,
      unmatched: 0,
      conflict: 0,
      duplicate: 0,
      selected: 0,
    };

    processedRows.forEach((row) => {
      if (Object.hasOwn(counts, row.status)) counts[row.status] += 1;
      if (row.isSelected) counts.selected += 1;
    });

    return counts;
  }, [processedRows]);

  const mappingFilterOptions = useMemo(
    () => ({
      semesters: [
        ...new Set(processedRows.map((row) => String(row.semester)).filter(Boolean)),
      ].sort((a, b) => Number(a) - Number(b)),
      sections: [
        ...new Set(processedRows.map((row) => String(row.section)).filter(Boolean)),
      ].sort(),
    }),
    [processedRows]
  );

  const filteredProcessedRows = useMemo(() => {
    const query = mappingSearch.trim().toLowerCase();

    return processedRows.filter((row) => {
      const matchesStatus =
        mappingStatusFilter === "All" || row.status === mappingStatusFilter;
      const matchesSemester =
        mappingSemesterFilter === "All" ||
        String(row.semester) === mappingSemesterFilter;
      const matchesSection =
        mappingSectionFilter === "All" ||
        String(row.section) === mappingSectionFilter;

      const matchesSearch = [
        row.course_code,
        row.course_name,
        row.faculty_name,
        row.room,
        row.section,
        row.day_of_week,
        row.raw_cell,
      ].some((val) => String(val || "").toLowerCase().includes(query));

      return matchesStatus && matchesSemester && matchesSection && matchesSearch;
    });
  }, [
    processedRows,
    mappingSearch,
    mappingStatusFilter,
    mappingSemesterFilter,
    mappingSectionFilter,
  ]);

  async function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setPreviewError("");
    setNotice("");
    setAnalysisResult(null);
    setEntryOverrides({});
    setSelectedRows({});
    setCommitResult(null);
    setCommitError("");
    setAvailableSheets([]);
    setSelectedSheet("");

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

    try {
      const sheetsRes = await getImportWorkbookSheets(selectedFile);
      if (sheetsRes?.success && Array.isArray(sheetsRes.sheets)) {
        setAvailableSheets(sheetsRes.sheets);
        if (sheetsRes.recommended) {
          setSelectedSheet(sheetsRes.recommended);
        } else if (sheetsRes.sheets.length > 0) {
          setSelectedSheet(sheetsRes.sheets[0]);
        }
      }
    } catch {
      // Sheet auto-discovery will handle fallback gracefully
    }
  }

  async function handleAnalyze() {
    if (!file) {
      setPreviewError("Choose an Excel workbook first.");
      return;
    }

    if (!effectiveAcademicYear) {
      setPreviewError("Please select or enter a valid academic year.");
      return;
    }

    setPreviewLoading(true);
    setPreviewError("");
    setNotice("");
    setCommitResult(null);
    setCommitError("");

    try {
      const res = await analyzeTimetableImport(
        file,
        effectiveAcademicYear,
        selectedSheet
      );
      if (!res?.success || !Array.isArray(res.entries)) {
        throw new Error(res?.message || "Could not analyze this timetable workbook.");
      }

      setAnalysisResult(res);
      setEntryOverrides({});

      // Pre-select rows that are matched or have warnings
      const initialSelection = {};
      res.entries.forEach((item) => {
        initialSelection[item.index] =
          item.status !== "conflict" && item.status !== "duplicate";
      });
      setSelectedRows(initialSelection);

      setActiveStep(2);
      setNotice(
        `Parsed ${res.total_rows} entries from sheet "${res.source_sheet}". Review the extracted data and mappings below.`
      );
    } catch (error) {
      setPreviewError(getErrorMessage(error, "Timetable analysis failed."));
    } finally {
      setPreviewLoading(false);
    }
  }

  function downloadPreviewCsv() {
    if (!processedRows.length) return;

    const columns = [
      "source_row",
      "day_of_week",
      "period",
      "start_time",
      "end_time",
      "class_group",
      "course_code",
      "course_name",
      "faculty_name",
      "room",
      "status",
      "raw_cell",
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const lines = [
      columns.map(escapeCsv).join(","),
      ...processedRows.map((entry) =>
        columns.map((column) => escapeCsv(entry[column])).join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `timetable-preview-${effectiveAcademicYear}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function toggleRowSelection(index) {
    setSelectedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function toggleSelectAll(select) {
    const updated = {};
    processedRows.forEach((r) => {
      updated[r.index] = select;
    });
    setSelectedRows(updated);
  }

  function updateEntryOverride(index, updates) {
    setEntryOverrides((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        ...updates,
      },
    }));
  }

  async function handleCommitImport() {
    const selectedEntries = processedRows.filter(
      (r) => r.isSelected && r.course_id
    );

    if (!selectedEntries.length) {
      setCommitError("Select at least one valid row with an assigned course to import.");
      return;
    }

    setCommitLoading(true);
    setCommitError("");

    const payload = {
      academic_year: effectiveAcademicYear,
      import_mode: importMode,
      entries: selectedEntries.map((r) => ({
        course_id: r.course_id,
        faculty_id: r.faculty_id || null,
        semester: r.semester || 1,
        section: r.section || "A",
        room: r.room || null,
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
      })),
    };

    try {
      const res = await commitTimetableImport(payload);
      if (!res?.success) {
        throw new Error(res?.message || "Import failed on the server.");
      }

      setCommitResult(res.data);
      setActiveStep(5);
      setNotice(res.message);
      void loadTimetable();
    } catch (err) {
      setCommitError(getErrorMessage(err, "Failed to commit timetable import."));
    } finally {
      setCommitLoading(false);
    }
  }

  function resetWizard() {
    setActiveStep(1);
    setFile(null);
    setAnalysisResult(null);
    setEntryOverrides({});
    setSelectedRows({});
    setCommitResult(null);
    setCommitError("");
    setPreviewError("");
    setNotice("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function goToStep(targetStep) {
    if (targetStep === 1) {
      setActiveStep(1);
      return;
    }

    if (!analysisResult) {
      setPreviewError("Upload a workbook and run analysis first.");
      return;
    }

    if (targetStep <= 4 || (targetStep === 5 && commitResult)) {
      setActiveStep(targetStep);
    }
  }

  // Emergency Faculty Replacement handlers
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
      `Validation passed. Reassignment proposed: ${selectedCurrentFaculty} → ${selectedSubstitute} for ` +
        `${selectedAdjustmentEntry.courseCode || selectedAdjustmentEntry.courseName}; ` +
        `effective ${effectiveDate}; reason: ${reason}.`
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
        {/* SECTION 1: Upload and Import Workflow */}
        <header className="timetable-import-heading">
          <div className="timetable-heading-icon">
            <FontAwesomeIcon icon={faFileLines} />
          </div>
          <div>
            <h2>Timetable Management & Excel Import</h2>
            <p>
              Upload, parse, match database entities, review conflicts, and commit academic timetables.
            </p>
          </div>
        </header>

        <nav
          className="timetable-stepper"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
          aria-label="Timetable import steps"
        >
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

        {/* STEP 1: Upload & Academic Year */}
        {activeStep === 1 && (
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
                    ? "File ready for analysis."
                    : "Choose the master timetable workbook to import."}
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
                  onClick={handleAnalyze}
                  disabled={!file || previewLoading || !effectiveAcademicYear}
                >
                  <FontAwesomeIcon icon={faFileLines} />
                  {previewLoading ? "Analyzing Workbook..." : "Extract & Analyze"}
                </button>
              </div>
            </div>

            <div className="timetable-file-information">
              <div className="timetable-information-heading">
                <FontAwesomeIcon icon={faInfoCircle} />
                <strong>Import Settings & Metadata</strong>
              </div>

              <div className="timetable-import-controls-row">
                <div className="timetable-control-group">
                  <label htmlFor="academic-year-select">Academic Year</label>
                  <select
                    id="academic-year-select"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  >
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Academic Year</option>
                  </select>
                </div>

                {academicYear === "CUSTOM" && (
                  <div className="timetable-control-group">
                    <label htmlFor="custom-year-input">Enter Year (e.g. 2027-28)</label>
                    <input
                      id="custom-year-input"
                      type="text"
                      placeholder="e.g. 2027-28"
                      value={customAcademicYear}
                      onChange={(e) => setCustomAcademicYear(e.target.value)}
                    />
                  </div>
                )}

                {availableSheets.length > 0 && (
                  <div className="timetable-control-group">
                    <label htmlFor="sheet-select">Worksheet</label>
                    <select
                      id="sheet-select"
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                    >
                      {availableSheets.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="timetable-file-metadata" style={{ marginTop: 14 }}>
                <div>
                  <span>File Name</span>
                  <strong>{file?.name || "—"}</strong>
                </div>
                <div>
                  <span>Academic Year</span>
                  <strong>{effectiveAcademicYear || "—"}</strong>
                </div>
                <div>
                  <span>Target Sheet</span>
                  <strong>{selectedSheet || "Auto-detect"}</strong>
                </div>
                <div>
                  <span>Analysis Status</span>
                  <strong>
                    {previewLoading
                      ? "Processing..."
                      : analysisResult
                        ? "Ready for review"
                        : "Not analyzed"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {previewError && (
          <div className="timetable-alert timetable-alert-error" role="alert">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>{previewError}</span>
          </div>
        )}

        {notice && (
          <div className="timetable-alert timetable-alert-info" role="status">
            <FontAwesomeIcon icon={faInfoCircle} />
            <span>{notice}</span>
          </div>
        )}

        {/* STEP 2: Extract & Preview */}
        {activeStep === 2 && analysisResult && (
          <section className="timetable-stage-card timetable-preview-card">
            <div className="timetable-preview-toolbar">
              <div>
                <h3>Extracted Timetable Preview</h3>
                <p>
                  Found {analysisResult.total_rows} periods in sheet &quot;
                  {analysisResult.source_sheet}&quot; for academic year{" "}
                  <strong>{effectiveAcademicYear}</strong>. No database records have been written yet.
                </p>
              </div>
              <button
                type="button"
                className="timetable-outline-button"
                onClick={downloadPreviewCsv}
                disabled={!processedRows.length}
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Preview CSV
              </button>
            </div>

            <div className="timetable-review-stats">
              <div className="timetable-review-stat-box">
                <span>Total Periods</span>
                <strong>{mappingCounts.total}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Auto-Matched</span>
                <strong style={{ color: "#0b7d3b" }}>{mappingCounts.matched}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Warnings</span>
                <strong style={{ color: "#a46c03" }}>{mappingCounts.warning}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Ambiguous</span>
                <strong style={{ color: "#6929c4" }}>{mappingCounts.ambiguous}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Conflicts</span>
                <strong style={{ color: "#b81414" }}>{mappingCounts.conflict}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Existing Duplicates</span>
                <strong style={{ color: "#52637a" }}>{mappingCounts.duplicate}</strong>
              </div>
            </div>

            <div className="timetable-table-wrapper" style={{ marginTop: 14 }}>
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Period</th>
                    <th>Time</th>
                    <th>Class Group</th>
                    <th>Course</th>
                    <th>Faculty</th>
                    <th>Room</th>
                    <th>Extracted Raw Cell</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.slice(0, MAX_PREVIEW_ROWS).map((row) => (
                    <tr key={`${row.source_row}-${row.index}`}>
                      <td>{titleCase(row.day_of_week)}</td>
                      <td>{row.period || "—"}</td>
                      <td>
                        {displayTime(row.start_time)} – {displayTime(row.end_time)}
                      </td>
                      <td>{row.class_group}</td>
                      <td>
                        <strong>{row.course_code || "—"}</strong>
                        {row.course_name ? ` · ${row.course_name}` : ""}
                      </td>
                      <td>{row.faculty_name || "—"}</td>
                      <td>{row.room || "—"}</td>
                      <td>
                        <small>{row.raw_cell}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {processedRows.length > MAX_PREVIEW_ROWS && (
              <p className="timetable-table-footnote">
                Showing first {MAX_PREVIEW_ROWS} of {processedRows.length} extracted entries. Download the CSV for the full export.
              </p>
            )}
          </section>
        )}

        {/* STEP 3: Map & Resolve */}
        {activeStep === 3 && analysisResult && (
          <section className="timetable-stage-card">
            <div className="timetable-preview-toolbar">
              <div>
                <h3>Map & Resolve Timetable Entities</h3>
                <p>
                  Review matched courses, assign ambiguous faculty or courses, and verify section assignments.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="timetable-outline-button"
                  onClick={() => toggleSelectAll(true)}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="timetable-outline-button"
                  onClick={() => toggleSelectAll(false)}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="timetable-filter-bar">
              <label>
                <span>Mapping Status</span>
                <select
                  value={mappingStatusFilter}
                  onChange={(e) => setMappingStatusFilter(e.target.value)}
                >
                  <option value="All">All statuses ({processedRows.length})</option>
                  <option value="matched">Auto-matched ({mappingCounts.matched})</option>
                  <option value="warning">With warnings ({mappingCounts.warning})</option>
                  <option value="ambiguous">Ambiguous ({mappingCounts.ambiguous})</option>
                  <option value="conflict">Conflicts ({mappingCounts.conflict})</option>
                  <option value="duplicate">Duplicates ({mappingCounts.duplicate})</option>
                  <option value="unmatched">Unmatched ({mappingCounts.unmatched})</option>
                </select>
              </label>

              <label>
                <span>Semester</span>
                <select
                  value={mappingSemesterFilter}
                  onChange={(e) => setMappingSemesterFilter(e.target.value)}
                >
                  <option value="All">All semesters</option>
                  {mappingFilterOptions.semesters.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Section / Group</span>
                <select
                  value={mappingSectionFilter}
                  onChange={(e) => setMappingSectionFilter(e.target.value)}
                >
                  <option value="All">All sections</option>
                  {mappingFilterOptions.sections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </label>

              <label className="timetable-filter-search">
                <span>Search entries</span>
                <div className="timetable-search-input">
                  <FontAwesomeIcon icon={faSearch} />
                  <input
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                    placeholder="Search by course, faculty, room..."
                  />
                </div>
              </label>
            </div>

            <div className="timetable-result-summary" style={{ marginTop: 10 }}>
              <span>
                {filteredProcessedRows.length} entries shown · {mappingCounts.selected} selected for import
              </span>
            </div>

            <div className="timetable-table-wrapper" style={{ marginTop: 10 }}>
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>Import</th>
                    <th>Day / Time</th>
                    <th>Section</th>
                    <th>Course Assignment</th>
                    <th>Faculty Assignment</th>
                    <th>Room</th>
                    <th>Offering Action</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcessedRows.map((row) => (
                    <tr key={`${row.source_row}-${row.index}`}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={row.isSelected}
                          onChange={() => toggleRowSelection(row.index)}
                          aria-label={`Select row ${row.index + 1}`}
                        />
                      </td>
                      <td>
                        <strong>{titleCase(row.day_of_week)}</strong>
                        <div>
                          {displayTime(row.start_time)} – {displayTime(row.end_time)}
                        </div>
                        <small>{row.period ? `Period ${row.period}` : ""}</small>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.section}
                          onChange={(e) =>
                            updateEntryOverride(row.index, { section: e.target.value })
                          }
                          style={{ width: 80, padding: "4px 6px" }}
                        />
                      </td>
                      <td>
                        {row.course_candidates?.length > 1 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <select
                              value={row.course_id || ""}
                              onChange={(e) =>
                                updateEntryOverride(row.index, {
                                  course_id: Number(e.target.value) || null,
                                })
                              }
                              style={{ borderColor: "#6929c4" }}
                            >
                              <option value="">Select matching course...</option>
                              {row.course_candidates.map((c) => (
                                <option key={c.course_id} value={c.course_id}>
                                  {c.course_code} - {c.course_name}
                                </option>
                              ))}
                            </select>
                            <small style={{ color: "#6929c4" }}>
                              Multiple potential matches detected
                            </small>
                          </div>
                        ) : (
                          <select
                            value={row.course_id || ""}
                            onChange={(e) =>
                              updateEntryOverride(row.index, {
                                course_id: Number(e.target.value) || null,
                              })
                            }
                          >
                            <option value="">Select course...</option>
                            {(analysisResult.available_courses || []).map((c) => (
                              <option key={c.course_id} value={c.course_id}>
                                {c.course_code} - {c.course_name} (Sem {c.semester})
                              </option>
                            ))}
                          </select>
                        )}
                        <div style={{ marginTop: 2 }}>
                          <small style={{ color: "#6681a6" }}>
                            Raw: {row.raw_cell}
                          </small>
                        </div>
                      </td>
                      <td>
                        {row.faculty_candidates?.length > 1 ? (
                          <select
                            value={row.faculty_id || ""}
                            onChange={(e) =>
                              updateEntryOverride(row.index, {
                                faculty_id: Number(e.target.value) || null,
                              })
                            }
                            style={{ borderColor: "#6929c4" }}
                          >
                            <option value="">Select faculty member...</option>
                            {row.faculty_candidates.map((f) => (
                              <option key={f.faculty_id} value={f.faculty_id}>
                                {f.name} ({f.employee_id})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={row.faculty_id || ""}
                            onChange={(e) =>
                              updateEntryOverride(row.index, {
                                faculty_id: Number(e.target.value) || null,
                              })
                            }
                          >
                            <option value="">Not assigned</option>
                            {(analysisResult.available_faculty || []).map((f) => (
                              <option key={f.faculty_id} value={f.faculty_id}>
                                {f.name} ({f.employee_id})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.room}
                          onChange={(e) =>
                            updateEntryOverride(row.index, { room: e.target.value })
                          }
                          placeholder="e.g. Room-302"
                          style={{ width: 90, padding: "4px 6px" }}
                        />
                      </td>
                      <td>
                        {row.offering_id ? (
                          <span className="timetable-offering-badge is-reuse">
                            Reuses Offering #{row.offering_id}
                          </span>
                        ) : (
                          <span className="timetable-offering-badge is-create">
                            Will Create Offering
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className="timetable-status-tag"
                          data-status={row.status}
                        >
                          {getMappingStatusLabel(row.status)}
                        </span>
                        {row.conflicts?.map((msg, i) => (
                          <div key={i} className="timetable-row-message is-conflict">
                            <FontAwesomeIcon icon={faTriangleExclamation} /> {msg}
                          </div>
                        ))}
                        {row.warnings?.map((msg, i) => (
                          <div key={i} className="timetable-row-message is-warning">
                            {msg}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* STEP 4: Review & Commit */}
        {activeStep === 4 && analysisResult && (
          <section className="timetable-stage-card">
            <div className="timetable-review-card">
              <div className="timetable-preview-toolbar">
                <div>
                  <h3>Import Review & Commit Plan</h3>
                  <p>
                    Target Academic Year: <strong>{effectiveAcademicYear}</strong>.
                    Review the planned changes before writing to the database.
                  </p>
                </div>
              </div>

              <div className="timetable-review-stats">
                <div className="timetable-review-stat-box">
                  <span>Selected for Import</span>
                  <strong style={{ color: "#005fb8" }}>{mappingCounts.selected}</strong>
                </div>
                <div className="timetable-review-stat-box">
                  <span>Entries to Create</span>
                  <strong style={{ color: "#0b7d3b" }}>
                    {processedRows.filter((r) => r.isSelected && r.course_id && r.status !== "duplicate").length}
                  </strong>
                </div>
                <div className="timetable-review-stat-box">
                  <span>Duplicates to Skip</span>
                  <strong style={{ color: "#52637a" }}>{mappingCounts.duplicate}</strong>
                </div>
                <div className="timetable-review-stat-box">
                  <span>Detected Conflicts</span>
                  <strong style={{ color: "#b81414" }}>{mappingCounts.conflict}</strong>
                </div>
              </div>

              <div className="timetable-mode-section">
                <strong>Select Import Mode</strong>

                <label
                  className={`timetable-mode-option ${importMode === "add_missing" ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="add_missing"
                    checked={importMode === "add_missing"}
                    onChange={(e) => setImportMode(e.target.value)}
                  />
                  <div className="timetable-mode-option-text">
                    <strong>Add Missing Entries Only (Recommended)</strong>
                    <span>
                      Safely creates new timetable entries and offerings. Any entry that already exists is skipped without creating duplicate records.
                    </span>
                  </div>
                </label>

                <label
                  className={`timetable-mode-option ${importMode === "update_matched" ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="update_matched"
                    checked={importMode === "update_matched"}
                    onChange={(e) => setImportMode(e.target.value)}
                  />
                  <div className="timetable-mode-option-text">
                    <strong>Update Matched Entries</strong>
                    <span>
                      Updates classroom and timings for existing entries that match the same course offering and day.
                    </span>
                  </div>
                </label>

                <label
                  className={`timetable-mode-option ${importMode === "review_conflicts" ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="review_conflicts"
                    checked={importMode === "review_conflicts"}
                    onChange={(e) => setImportMode(e.target.value)}
                  />
                  <div className="timetable-mode-option-text">
                    <strong>Strict Validation</strong>
                    <span>
                      Skips any entries with unresolved warnings or scheduling conflicts.
                    </span>
                  </div>
                </label>
              </div>

              {commitError && (
                <div className="timetable-alert timetable-alert-error" role="alert">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  <span>{commitError}</span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <input
                  type="checkbox"
                  id="confirm-import-check"
                  checked={confirmCommit}
                  onChange={(e) => setConfirmCommit(e.target.checked)}
                />
                <label htmlFor="confirm-import-check" style={{ fontSize: 12, color: "#16345f", cursor: "pointer" }}>
                  I have reviewed the entity mappings and confirm importing{" "}
                  <strong>{mappingCounts.selected}</strong> entries into academic year{" "}
                  <strong>{effectiveAcademicYear}</strong>.
                </label>
              </div>
            </div>
          </section>
        )}

        {/* STEP 5: Import Results Summary */}
        {activeStep === 5 && commitResult && (
          <section className="timetable-stage-card">
            <div className="timetable-result-banner">
              <div className="timetable-result-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="timetable-result-copy">
                <h3>Timetable Import Successfully Committed!</h3>
                <p>
                  Database transaction committed for Academic Year{" "}
                  <strong>{commitResult.academic_year}</strong>.
                </p>
              </div>
            </div>

            <div className="timetable-review-stats" style={{ marginTop: 14 }}>
              <div className="timetable-review-stat-box">
                <span>Timetable Entries Created</span>
                <strong style={{ color: "#0b7d3b" }}>{commitResult.created_entries}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Offerings Created</span>
                <strong style={{ color: "#005fb8" }}>{commitResult.created_offerings}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Entries Updated</span>
                <strong style={{ color: "#a46c03" }}>{commitResult.updated_entries}</strong>
              </div>
              <div className="timetable-review-stat-box">
                <span>Duplicates Skipped</span>
                <strong style={{ color: "#52637a" }}>{commitResult.skipped_entries}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                type="button"
                className="timetable-primary-button"
                onClick={() => {
                  setActiveTab("Timetable");
                  void loadTimetable();
                }}
              >
                <FontAwesomeIcon icon={faCalendarDays} />
                View Saved Timetable
              </button>
              <button
                type="button"
                className="timetable-outline-button"
                onClick={resetWizard}
              >
                <FontAwesomeIcon icon={faRotateRight} />
                Import Another Timetable
              </button>
            </div>
          </section>
        )}

        {/* Wizard Navigation Footer */}
        {activeStep > 1 && activeStep < 5 && (
          <footer className="timetable-wizard-footer">
            <button
              type="button"
              className="timetable-outline-button"
              onClick={() => setActiveStep((curr) => Math.max(1, curr - 1))}
            >
              Back
            </button>

            {activeStep === 2 && (
              <button
                type="button"
                className="timetable-primary-button"
                onClick={() => setActiveStep(3)}
              >
                Next: Map & Resolve
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}

            {activeStep === 3 && (
              <button
                type="button"
                className="timetable-primary-button"
                onClick={() => setActiveStep(4)}
              >
                Next: Review & Commit
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}

            {activeStep === 4 && (
              <button
                type="button"
                className="timetable-primary-button"
                disabled={!confirmCommit || commitLoading || mappingCounts.selected === 0}
                onClick={handleCommitImport}
              >
                <FontAwesomeIcon icon={faSave} />
                {commitLoading ? "Committing Transaction..." : "Confirm & Commit Timetable"}
              </button>
            )}
          </footer>
        )}

        {/* SECTION 2: Saved Timetable Management */}
        <section className="timetable-management-section">
          <div className="timetable-preview-toolbar">
            <div>
              <h3>Saved Timetable Database Records</h3>
              <p>View active timetable entries, courses, faculty, and classrooms.</p>
            </div>
            <button
              type="button"
              className="timetable-outline-button"
              onClick={loadTimetable}
              disabled={timetableLoading}
            >
              <FontAwesomeIcon icon={faRotateRight} />
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
                        Semester {value}
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
                <span>{entries.length} total saved entries in database</span>
              </div>

              <div className="timetable-table-wrapper">
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Period</th>
                      <th>Time</th>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Faculty</th>
                      <th>Classroom</th>
                      <th>Section</th>
                      <th>Academic Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetableLoading ? (
                      <tr>
                        <td colSpan={8} className="timetable-table-message">
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
                          <td>{entry.academicYear || "—"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="timetable-table-message">
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
                      const assignedCourses = new Set(
                        facultyEntries
                          .map((entry) => entry.courseCode || entry.courseName)
                          .filter(Boolean)
                      );

                      return (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{assignedCourses.size}</td>
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
                      const coursesSet = new Set(
                        roomEntries
                          .map((entry) => entry.courseCode || entry.courseName)
                          .filter(Boolean)
                      );

                      return (
                        <tr key={room}>
                          <td>{room}</td>
                          <td>{roomEntries.length}</td>
                          <td>{days.size}</td>
                          <td>{coursesSet.size}</td>
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
                      disabled={!selectedCurrentFaculty}
                      required
                    >
                      <option value="">
                        {selectedCurrentFaculty
                          ? "Select an affected class"
                          : "Choose current faculty first"}
                      </option>
                      {entries
                        .filter((e) => e.faculty === selectedCurrentFaculty)
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.day} · {displayTime(entry.startTime)}–{displayTime(entry.endTime)} ·{" "}
                            {entry.courseCode} ({entry.section || "No section"}) · {entry.room}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <div className="timetable-adjustment-box">
                  <h4>Substitute Faculty</h4>

                  <label>
                    Search substitute faculty
                    <input
                      list="substitute-faculty-options"
                      value={substituteSearch}
                      onChange={(event) => {
                        const value = event.target.value;
                        const exactMatch = distinctFaculty.includes(value);

                        setSubstituteSearch(value);
                        setSelectedSubstitute(exactMatch ? value : "");
                        setAdjustmentMessage("");
                      }}
                      placeholder="Type substitute faculty name"
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
                    Substitute Faculty ID (if known)
                    <input
                      value={adjustmentFacultyId}
                      onChange={(event) => setAdjustmentFacultyId(event.target.value)}
                      placeholder="Enter faculty ID"
                    />
                  </label>
                </div>
              </div>

              <div className="timetable-adjustment-box timetable-adjustment-request-box">
                <h4>Adjustment Details</h4>

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
                      <option value="Faculty unavailable">Faculty unavailable</option>
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
                    onChange={(event) => setRequestApproval(event.target.checked)}
                  />
                  Request approval before changing the assignment
                </label>

                {adjustmentMessage && (
                  <div className="timetable-alert timetable-alert-info" role="status">
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
              Emergency Faculty Adjustment reassigns faculty for temporary absences while preserving original timetable records.
            </span>
          </div>
        </section>
      </div>
    </section>
  );
}

export default TimetableManagement;
