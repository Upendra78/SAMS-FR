import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Filter,
  PieChart,
  RotateCcw,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import {
  exportAdminAttendanceCsv,
  getAdminAttendanceDashboard,
  getAdminAttendanceFilterOptions,
  getAdminAttendanceRecordDetail,
  getAdminAttendanceRecordsList,
} from "../../services/adminService";

import attendanceBannerImg from "../../../image/attendance_banner.jpg";
import kpiPresentImg from "../../../image/admin_quickstat_students.jpg";
import kpiAbsentImg from "../../../image/admin_quickstat_absent.jpg";
import kpiClassesImg from "../../../image/admin_quickstat_courses.jpg";
import kpiRateImg from "../../../image/admin_quickstat_records.jpg";

import "./AttendanceReports.css";

// =========================================================================
// HELPER FORMATTERS
// =========================================================================
function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString();
}

function formatPercent(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return "0.0%";
  return `${Number(num).toFixed(1)}%`;
}

// =========================================================================
// SVG CHART: ATTENDANCE TREND (Area + Spline Line Chart)
// =========================================================================
function AttendanceTrendChart({ trend = [] }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!trend || trend.length === 0) {
    return (
      <div className="attendance-chart-empty-state">
        <p>No attendance trend data available</p>
      </div>
    );
  }

  const width = 480;
  const height = 190;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const step = trend.length > 1 ? chartW / (trend.length - 1) : chartW / 2;
  const coords = trend.map((p, i) => {
    const x = padLeft + i * step;
    const rateClamped = Math.max(0, Math.min(100, p.rate || 0));
    const y = padTop + chartH - (rateClamped / 100) * chartH;
    return { x, y, ...p };
  });

  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cx = (p0.x + p1.x) / 2;
    pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const lastX = coords[coords.length - 1].x;
  const firstX = coords[0].x;
  const bottomY = padTop + chartH;
  const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  const yTicks = [100, 75, 50, 25, 0];

  return (
    <div className="attendance-trend-chart-body">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Gridlines and labels */}
        {yTicks.map((tick) => {
          const y = padTop + chartH - (tick / 100) * chartH;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="inherit"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaD && <path d={areaD} fill="url(#trendGradient)" />}

        {/* Main Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points & X-Labels */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hoveredPoint === i ? 6 : 4}
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
              style={{ cursor: "pointer", transition: "r 0.15s ease" }}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            <text
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10.5"
              fill="#64748b"
              fontWeight="500"
              fontFamily="inherit"
            >
              {c.label || c.date}
            </text>
          </g>
        ))}
      </svg>

      {/* Interactive Tooltip */}
      {hoveredPoint !== null && coords[hoveredPoint] && (
        <div
          className="attendance-chart-tooltip"
          style={{
            left: `${(coords[hoveredPoint].x / width) * 100}%`,
            top: `${(coords[hoveredPoint].y / height) * 100}%`,
          }}
        >
          <strong>{coords[hoveredPoint].label}</strong>: {coords[hoveredPoint].rate.toFixed(1)}%
          <br />
          <span>
            {coords[hoveredPoint].present} of {coords[hoveredPoint].total} students
          </span>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// SVG CHART: ATTENDANCE BY COURSE (Donut Chart)
// =========================================================================
function AttendanceCourseDonut({ courses = [], totalClasses = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!courses || courses.length === 0) {
    return (
      <div className="attendance-chart-empty-state">
        <p>No course attendance data available</p>
      </div>
    );
  }

  const radius = 50;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const sumValues = courses.reduce((acc, c) => acc + (c.classes || c.total || 1), 0) || 1;

  const { slices } = courses.reduce(
    (acc, c, idx) => {
      const val = c.classes || c.total || 1;
      const strokeDasharray = (val / sumValues) * circumference;
      const currentOffset = acc.offset;
      return {
        slices: [
          ...acc.slices,
          {
            ...c,
            idx,
            dashArray: `${strokeDasharray} ${circumference - strokeDasharray}`,
            dashOffset: -currentOffset,
          },
        ],
        offset: currentOffset + strokeDasharray,
      };
    },
    { slices: [], offset: 0 }
  );

  return (
    <div className="attendance-course-donut-body">
      <div className="attendance-donut-svg-wrap">
        <svg
          viewBox="0 0 140 140"
          style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}
        >
          {slices.map((slice) => (
            <circle
              key={slice.idx}
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke={slice.color || "#2563eb"}
              strokeWidth={hoveredIdx === slice.idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={slice.dashArray}
              strokeDashoffset={slice.dashOffset}
              style={{
                cursor: "pointer",
                transition: "stroke-width 0.18s ease",
              }}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        <div className="attendance-donut-center-text">
          <div className="attendance-donut-number">
            {formatNumber(totalClasses)}
          </div>
          <div className="attendance-donut-label">Total Classes</div>
        </div>
      </div>

      <div className="attendance-course-legend-list">
        {courses.map((item, idx) => (
          <div
            key={item.course_id || idx}
            className="attendance-course-legend-item"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              backgroundColor: hoveredIdx === idx ? "#f1f5f9" : "transparent",
            }}
          >
            <div className="attendance-course-legend-left">
              <span
                className="attendance-course-color-dot"
                style={{ backgroundColor: item.color }}
              />
              <span className="attendance-course-name" title={item.course_name}>
                {item.course_name}
              </span>
            </div>
            <span className="attendance-course-pct">
              {item.rate !== undefined ? `${item.rate.toFixed(1)}%` : "0.0%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// SVG CHART: ATTENDANCE BY SECTION (Bar Chart)
// =========================================================================
function AttendanceSectionBarChart({ sections = [] }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!sections || sections.length === 0) {
    return (
      <div className="attendance-chart-empty-state">
        <p>No section attendance data available</p>
      </div>
    );
  }

  const width = 320;
  const height = 210;
  const padLeft = 40;
  const padRight = 15;
  const padTop = 22;
  const padBottom = 26;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const yTicks = [100, 75, 50, 25, 0];
  const barCount = Math.max(sections.length, 1);
  const slotW = chartW / barCount;
  const barW = Math.min(32, slotW * 0.58);

  return (
    <div className="attendance-section-bar-body">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Y-Ticks */}
        {yTicks.map((tick) => {
          const y = padTop + chartH - (tick / 100) * chartH;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="inherit"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Section Bars */}
        {sections.map((sec, i) => {
          const slotX = padLeft + i * slotW;
          const barX = slotX + (slotW - barW) / 2;
          const rateVal = Math.max(0, Math.min(100, sec.rate || 0));
          const barHeight = (rateVal / 100) * chartH;
          const barY = padTop + chartH - barHeight;

          return (
            <g
              key={sec.section || i}
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: "pointer" }}
            >
              <text
                x={barX + barW / 2}
                y={barY - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#334155"
                fontWeight="600"
                fontFamily="inherit"
              >
                {rateVal.toFixed(1)}%
              </text>

              <rect
                x={barX}
                y={barY}
                width={barW}
                height={barHeight}
                rx="4"
                ry="4"
                fill={sec.color || "#2563eb"}
                opacity={hoveredBar === i ? 0.85 : 1}
                style={{ transition: "all 0.15s ease" }}
              />

              <text
                x={barX + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="11"
                fill="#475569"
                fontWeight="600"
                fontFamily="inherit"
              >
                {sec.section}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// =========================================================================
// MAIN ATTENDANCE REPORTS COMPONENT
// =========================================================================
function AttendanceReports() {
  // Filter states (clean initial states with no hardcoded fake filters)
  const [academicYear, setAcademicYear] = useState("All");
  const [semester, setSemester] = useState("All");
  const [section, setSection] = useState("All");
  const [courseId, setCourseId] = useState("All");
  const [facultyId, setFacultyId] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState("Last 4 Weeks");

  // Dynamic filter options directly from backend API
  const [filterOptions, setFilterOptions] = useState({
    academic_years: [],
    semesters: [],
    sections: [],
    courses: [],
    faculty: [],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Real Dashboard data directly from backend (initialized with 0s, NO fake mockup numbers)
  const [dashboardData, setDashboardData] = useState({
    kpi: {
      total_present: 0,
      total_absent: 0,
      total_classes: 0,
      attendance_rate: 0,
      present_rate: 0,
      absent_rate: 0,
      present_trend: null,
      absent_trend: null,
      classes_trend: null,
      rate_trend: null,
    },
    trend: [],
    by_course: [],
    by_section: [],
  });

  // Real Records Table Data directly from backend
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 5;

  // View modal state
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Loading & exporting states
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // 1. Fetch Filter Options on mount directly from backend
  useEffect(() => {
    let ignore = false;

    async function loadFilterOptions() {
      try {
        const res = await getAdminAttendanceFilterOptions();
        if (ignore) return;
        if (res && res.success) {
          setFilterOptions({
            academic_years: res.academic_years || [],
            semesters: res.semesters || [],
            sections: res.sections || [],
            courses: res.courses || [],
            faculty: res.faculty || [],
          });
          if (res.academic_years && res.academic_years.length > 0) {
            setAcademicYear(res.academic_years[0]);
          }
          if (res.date_range?.from_date && res.date_range?.to_date) {
            setFromDate(res.date_range.from_date);
            setToDate(res.date_range.to_date);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.warn("Could not load dynamic filter options from backend", err);
        }
      }
    }

    loadFilterOptions();

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Fetch Dashboard & Records Data directly from backend
  useEffect(() => {
    let ignore = false;

    async function loadAttendanceData() {
      try {
        const queryParams = {
          academic_year: academicYear !== "All" ? academicYear : undefined,
          semester: semester !== "All" ? semester : undefined,
          section: section !== "All" ? section : undefined,
          course_id: courseId !== "All" ? courseId : undefined,
          faculty_id: facultyId !== "All" ? facultyId : undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          period: period,
        };

        const [dashRes, recRes] = await Promise.all([
          getAdminAttendanceDashboard(queryParams),
          getAdminAttendanceRecordsList({
            ...queryParams,
            page,
            per_page: perPage,
          }),
        ]);

        if (ignore) return;

        if (dashRes && dashRes.success) {
          setDashboardData(dashRes);
        }

        if (recRes && recRes.success) {
          setRecords(recRes.data || []);
          setTotalRecords(recRes.total_records || 0);
          setTotalPages(recRes.total_pages || 1);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load attendance data", err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadAttendanceData();

    return () => {
      ignore = true;
    };
  }, [
    academicYear,
    semester,
    section,
    courseId,
    facultyId,
    fromDate,
    toDate,
    period,
    page,
    fetchTrigger,
  ]);

  const handleApplyFilters = () => {
    setLoading(true);
    setPage(1);
    setFetchTrigger((prev) => prev + 1);
    setShowDatePicker(false);
  };

  const handleResetFilters = () => {
    setLoading(true);
    setAcademicYear(filterOptions.academic_years[0] || "All");
    setSemester("All");
    setSection("All");
    setCourseId("All");
    setFacultyId("All");
    setFromDate("");
    setToDate("");
    setPage(1);
    setFetchTrigger((prev) => prev + 1);
    setShowDatePicker(false);
  };

  // Download real CSV report from backend API
  const handleDownloadReport = async () => {
    try {
      setExporting(true);
      const queryParams = {
        academic_year: academicYear !== "All" ? academicYear : undefined,
        semester: semester !== "All" ? semester : undefined,
        section: section !== "All" ? section : undefined,
        course_id: courseId !== "All" ? courseId : undefined,
        faculty_id: facultyId !== "All" ? facultyId : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const blobData = await exportAdminAttendanceCsv(queryParams);
      const blob = new Blob([blobData], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Attendance_Report_${academicYear || "All"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export attendance report from backend.");
    } finally {
      setExporting(false);
    }
  };

  // View real record details from backend API in modal
  const handleViewRecord = async (record) => {
    setSelectedRecord(record);
    try {
      const res = await getAdminAttendanceRecordDetail(record.attendance_id);
      if (res && res.success) {
        setSelectedRecord(res.data);
      }
    } catch (err) {
      console.warn("Could not load single record detail from backend", err);
    }
  };

  // Date range display text
  const dateRangeDisplay = useMemo(() => {
    if (!fromDate && !toDate) return "Select Date Range";
    try {
      const f = fromDate
        ? new Date(fromDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Start";
      const t = toDate
        ? new Date(toDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "End";
      return `${f} - ${t}`;
    } catch {
      return `${fromDate} - ${toDate}`;
    }
  }, [fromDate, toDate]);

  const totalAttendanceMarks = (dashboardData.kpi?.total_present || 0) + (dashboardData.kpi?.total_absent || 0);

  return (
    <div className="attendance-page-container">
      {/* ================================================================= */}
      {/* 1. TOP BANNER CARD                                                */}
      {/* ================================================================= */}
      <section className="attendance-banner-card">
        <div className="attendance-banner-left">
          <div className="attendance-banner-icon-box">
            <ClipboardCheck size={22} strokeWidth={2.2} />
          </div>
          <div className="attendance-banner-text">
            <h1>Attendance Reports</h1>
            <p>View attendance statistics, generate reports, and analyze student performance.</p>
          </div>
        </div>

        <div className="attendance-banner-image-wrap">
          <img
            src={attendanceBannerImg || "/image/attendance_banner.jpg"}
            alt="Attendance reports workspace"
            className="attendance-banner-bg-img"
          />
          <div className="attendance-banner-image-gradient" />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. FILTER BAR                                                     */}
      {/* ================================================================= */}
      <section className="attendance-filter-card">
        {/* Academic Year */}
        <div className="attendance-filter-group">
          <label className="attendance-filter-label" htmlFor="academic-year-select">
            Academic Year
          </label>
          <div className="attendance-select-wrapper">
            <select
              id="academic-year-select"
              className="attendance-filter-select"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option value="All">All Years</option>
              {filterOptions.academic_years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="attendance-select-chevron" size={14} />
          </div>
        </div>

        {/* Semester */}
        <div className="attendance-filter-group">
          <label className="attendance-filter-label" htmlFor="semester-select">
            Semester
          </label>
          <div className="attendance-select-wrapper">
            <select
              id="semester-select"
              className="attendance-filter-select"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="All">All Semesters</option>
              {filterOptions.semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <ChevronDown className="attendance-select-chevron" size={14} />
          </div>
        </div>

        {/* Section */}
        <div className="attendance-filter-group">
          <label className="attendance-filter-label" htmlFor="section-select">
            Section
          </label>
          <div className="attendance-select-wrapper">
            <select
              id="section-select"
              className="attendance-filter-select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option value="All">All Sections</option>
              {filterOptions.sections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
            <ChevronDown className="attendance-select-chevron" size={14} />
          </div>
        </div>

        {/* Course */}
        <div className="attendance-filter-group">
          <label className="attendance-filter-label" htmlFor="course-select">
            Course
          </label>
          <div className="attendance-select-wrapper">
            <select
              id="course-select"
              className="attendance-filter-select"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="All">All Courses</option>
              {filterOptions.courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code ? `${c.course_code} - ${c.course_name}` : c.course_name}
                </option>
              ))}
            </select>
            <ChevronDown className="attendance-select-chevron" size={14} />
          </div>
        </div>

        {/* Faculty */}
        <div className="attendance-filter-group">
          <label className="attendance-filter-label" htmlFor="faculty-select">
            Faculty
          </label>
          <div className="attendance-select-wrapper">
            <select
              id="faculty-select"
              className="attendance-filter-select"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
            >
              <option value="All">All Faculty</option>
              {filterOptions.faculty.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.name}
                </option>
              ))}
            </select>
            <ChevronDown className="attendance-select-chevron" size={14} />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="attendance-filter-group date-group" style={{ position: "relative" }}>
          <label className="attendance-filter-label">Date Range</label>
          <button
            type="button"
            className="attendance-date-range-btn"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar size={14} className="attendance-date-icon" />
            <span className="attendance-date-text">{dateRangeDisplay}</span>
          </button>

          {showDatePicker && (
            <div className="attendance-daterange-picker-box">
              <div className="attendance-date-input-field">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="attendance-date-input-field">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="attendance-btn-apply"
                style={{ height: "30px", marginTop: "4px" }}
                onClick={() => setShowDatePicker(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="attendance-filter-actions">
          <button
            type="button"
            className="attendance-btn-apply"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            <Filter size={14} />
            Apply Filters
          </button>
          <button
            type="button"
            className="attendance-btn-reset"
            onClick={handleResetFilters}
            disabled={loading}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. KPI STAT CARDS (4 CARDS)                                       */}
      {/* ================================================================= */}
      <section className="attendance-kpi-grid">
        {/* Card 1: Total Present */}
        <div
          className="attendance-kpi-card kpi-card-present"
          style={{
            backgroundImage: `url("${kpiPresentImg || "/image/admin_quickstat_students.jpg"}")`,
          }}
        >
          <div className="attendance-kpi-left-icon present-icon">
            <Check size={22} strokeWidth={2.8} />
          </div>
          <div className="attendance-kpi-content">
            <span className="attendance-kpi-title">Total Present</span>
            <div className="attendance-kpi-value-row">
              <span className="attendance-kpi-value">
                {formatNumber(dashboardData.kpi?.total_present)}
              </span>
              {dashboardData.kpi?.present_trend && (
                <span className="attendance-kpi-trend positive">
                  ↑ {dashboardData.kpi.present_trend}
                </span>
              )}
            </div>
            <span className="attendance-kpi-subtitle">
              {totalAttendanceMarks > 0
                ? `${formatPercent(dashboardData.kpi?.present_rate)} of total`
                : "No attendance recorded"}
            </span>
          </div>
        </div>

        {/* Card 2: Total Absent */}
        <div
          className="attendance-kpi-card kpi-card-absent"
          style={{
            backgroundImage: `url("${kpiAbsentImg || "/image/admin_quickstat_absent.jpg"}")`,
          }}
        >
          <div className="attendance-kpi-left-icon absent-icon">
            <X size={22} strokeWidth={2.8} />
          </div>
          <div className="attendance-kpi-content">
            <span className="attendance-kpi-title">Total Absent</span>
            <div className="attendance-kpi-value-row">
              <span className="attendance-kpi-value">
                {formatNumber(dashboardData.kpi?.total_absent)}
              </span>
              {dashboardData.kpi?.absent_trend && (
                <span className="attendance-kpi-trend negative">
                  ↑ {dashboardData.kpi.absent_trend}
                </span>
              )}
            </div>
            <span className="attendance-kpi-subtitle">
              {totalAttendanceMarks > 0
                ? `${formatPercent(dashboardData.kpi?.absent_rate)} of total`
                : "No attendance recorded"}
            </span>
          </div>
        </div>

        {/* Card 3: Total Classes */}
        <div
          className="attendance-kpi-card kpi-card-classes"
          style={{
            backgroundImage: `url("${kpiClassesImg || "/image/admin_quickstat_courses.jpg"}")`,
          }}
        >
          <div className="attendance-kpi-left-icon classes-icon">
            <Calendar size={22} strokeWidth={2.4} />
          </div>
          <div className="attendance-kpi-content">
            <span className="attendance-kpi-title">Total Classes</span>
            <div className="attendance-kpi-value-row">
              <span className="attendance-kpi-value">
                {formatNumber(dashboardData.kpi?.total_classes)}
              </span>
              {dashboardData.kpi?.classes_trend && (
                <span className="attendance-kpi-trend positive">
                  ↑ {dashboardData.kpi.classes_trend}
                </span>
              )}
            </div>
            <span className="attendance-kpi-subtitle">Scheduled classes</span>
          </div>
        </div>

        {/* Card 4: Attendance Rate */}
        <div
          className="attendance-kpi-card kpi-card-rate"
          style={{
            backgroundImage: `url("${kpiRateImg || "/image/admin_quickstat_records.jpg"}")`,
          }}
        >
          <div className="attendance-kpi-left-icon rate-icon">
            <Target size={22} strokeWidth={2.4} />
          </div>
          <div className="attendance-kpi-content">
            <span className="attendance-kpi-title">Attendance Rate</span>
            <div className="attendance-kpi-value-row">
              <span className="attendance-kpi-value">
                {formatPercent(dashboardData.kpi?.attendance_rate)}
              </span>
              {dashboardData.kpi?.rate_trend && (
                <span className="attendance-kpi-trend positive">
                  ↑ {dashboardData.kpi.rate_trend}
                </span>
              )}
            </div>
            <span className="attendance-kpi-subtitle">Overall attendance</span>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. CHARTS ROW (3 CHARTS)                                          */}
      {/* ================================================================= */}
      <section className="attendance-charts-grid">
        {/* Chart 1: Attendance Trend */}
        <div className="attendance-chart-card">
          <div className="attendance-chart-header">
            <div className="attendance-chart-title-wrap">
              <TrendingUp className="attendance-chart-header-icon" size={17} />
              <h2 className="attendance-chart-title">Attendance Trend</h2>
            </div>
            <select
              className="attendance-period-select"
              value={period}
              onChange={(e) => {
                setLoading(true);
                setPeriod(e.target.value);
              }}
            >
              <option value="Last 4 Weeks">Last 4 Weeks</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Semester">This Semester</option>
            </select>
          </div>

          <AttendanceTrendChart trend={dashboardData.trend} />

          {dashboardData.trend && dashboardData.trend.length > 0 && (
            <div className="attendance-chart-legend-bottom">
              <span className="attendance-legend-dot" />
              <span>Attendance Rate</span>
            </div>
          )}
        </div>

        {/* Chart 2: Attendance by Course */}
        <div className="attendance-chart-card">
          <div className="attendance-chart-header">
            <div className="attendance-chart-title-wrap">
              <PieChart className="attendance-chart-header-icon" size={17} />
              <h2 className="attendance-chart-title">Attendance by Course</h2>
            </div>
          </div>

          <AttendanceCourseDonut
            courses={dashboardData.by_course}
            totalClasses={dashboardData.kpi?.total_classes}
          />
        </div>

        {/* Chart 3: Attendance by Section */}
        <div className="attendance-chart-card">
          <div className="attendance-chart-header">
            <div className="attendance-chart-title-wrap">
              <Users className="attendance-chart-header-icon" size={17} />
              <h2 className="attendance-chart-title">Attendance by Section</h2>
            </div>
          </div>

          <AttendanceSectionBarChart sections={dashboardData.by_section} />
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. RECENT ATTENDANCE RECORDS TABLE                                */}
      {/* ================================================================= */}
      <section className="attendance-table-card">
        <div className="attendance-table-header-row">
          <div className="attendance-table-title-wrap">
            <Calendar className="attendance-table-icon" size={18} />
            <h2 className="attendance-table-title">Recent Attendance Records</h2>
          </div>

          <button
            type="button"
            className="attendance-btn-download"
            onClick={handleDownloadReport}
            disabled={exporting || totalRecords === 0}
          >
            <Download size={14} />
            {exporting ? "Downloading..." : "Download Report"}
          </button>
        </div>

        <div className="attendance-table-responsive">
          <table className="attendance-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Roll No.</th>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Section</th>
                <th>Status</th>
                <th>Marked At</th>
                <th>Method</th>
                <th>Confidence Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center", padding: "34px", color: "#64748b" }}>
                    {loading ? "Loading attendance records from backend..." : "No attendance records recorded yet."}
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const isPresent = rec.status === "Present";
                  return (
                    <tr key={rec.attendance_id}>
                      <td>{rec.date}</td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>
                        {rec.student_name}
                      </td>
                      <td>{rec.roll_no}</td>
                      <td>{rec.course_code}</td>
                      <td>{rec.course_name}</td>
                      <td>{rec.section}</td>
                      <td>
                        <span
                          className={`attendance-status-badge ${
                            isPresent ? "present" : "absent"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td>{rec.marked_at}</td>
                      <td>{rec.method}</td>
                      <td>{rec.confidence_score}</td>
                      <td>
                        <button
                          type="button"
                          className="attendance-btn-view"
                          onClick={() => handleViewRecord(rec)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with real pagination */}
        <div className="attendance-table-footer">
          <span>
            {totalRecords > 0
              ? `Showing ${(page - 1) * perPage + 1} to ${Math.min(page * perPage, totalRecords)} of ${formatNumber(totalRecords)} records`
              : "Showing 0 records"}
          </span>

          {totalRecords > 0 && (
            <div className="attendance-pagination">
              <button
                type="button"
                className="attendance-page-btn"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`attendance-page-btn ${page === pageNum ? "active" : ""}`}
                    onClick={() => {
                      setLoading(true);
                      setPage(pageNum);
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span style={{ padding: "0 4px" }}>...</span>
                  <button
                    type="button"
                    className={`attendance-page-btn ${page === totalPages ? "active" : ""}`}
                    onClick={() => {
                      setLoading(true);
                      setPage(totalPages);
                    }}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                className="attendance-page-btn"
                disabled={page >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. VIEW RECORD DETAIL MODAL                                       */}
      {/* ================================================================= */}
      {selectedRecord && (
        <div
          className="attendance-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="attendance-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="attendance-modal-header">
              <h3>Attendance Record Details</h3>
              <button
                type="button"
                className="attendance-modal-close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="attendance-modal-body">
              <div className="attendance-modal-grid">
                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Student Name</span>
                  <span className="attendance-modal-value">
                    {selectedRecord.student?.name || selectedRecord.student_name}
                  </span>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Roll Number</span>
                  <span className="attendance-modal-value">
                    {selectedRecord.student?.enrollment_no || selectedRecord.roll_no}
                  </span>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Course</span>
                  <span className="attendance-modal-value">
                    {selectedRecord.course?.course_name || selectedRecord.course_name} (
                    {selectedRecord.course?.course_code || selectedRecord.course_code})
                  </span>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Section & Semester</span>
                  <span className="attendance-modal-value">
                    Section {selectedRecord.student?.section || selectedRecord.section || "N/A"} • Semester{" "}
                    {selectedRecord.student?.semester || selectedRecord.session?.semester || "N/A"}
                  </span>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Status</span>
                  <div>
                    <span
                      className={`attendance-status-badge ${
                        (selectedRecord.status || "").toLowerCase() === "present"
                          ? "present"
                          : "absent"
                      }`}
                    >
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Marked At</span>
                  <span className="attendance-modal-value">
                    {selectedRecord.marked_at || "-"}
                  </span>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Verification Method</span>
                  <span className="attendance-modal-value">
                    {selectedRecord.recognition_method === "FACE" ||
                    selectedRecord.method === "Face Recognition"
                      ? "Face Recognition"
                      : selectedRecord.method || "Manual"}
                  </span>
                </div>

                <div className="attendance-modal-item">
                  <span className="attendance-modal-label">Confidence Score</span>
                  <span className="attendance-modal-value">
                    {selectedRecord.confidence_score
                      ? typeof selectedRecord.confidence_score === "number"
                        ? `${selectedRecord.confidence_score.toFixed(1)}%`
                        : selectedRecord.confidence_score
                      : "-"}
                  </span>
                </div>

                {selectedRecord.session && (
                  <>
                    <div className="attendance-modal-item">
                      <span className="attendance-modal-label">Session Date</span>
                      <span className="attendance-modal-value">
                        {selectedRecord.session.date}
                      </span>
                    </div>

                    <div className="attendance-modal-item">
                      <span className="attendance-modal-label">Faculty</span>
                      <span className="attendance-modal-value">
                        {selectedRecord.faculty?.name || "Assigned Faculty"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="attendance-modal-footer">
              <button
                type="button"
                className="attendance-btn-apply"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceReports;