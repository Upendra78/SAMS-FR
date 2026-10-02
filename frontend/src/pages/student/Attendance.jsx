import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCircleCheck,
  faCircleXmark,
  faChartPie,
  faMagnifyingGlass,
  faRotate,
  faClock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import { getStudentAttendance } from "../../services/attendanceService";
import "./Attendance.css";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getStudentAttendance();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error(result?.message || "Unable to load attendance.");
      }

      setAttendance(result.data);
    } catch (err) {
      console.error("Student attendance error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load attendance.";

      setError(message);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const summary = useMemo(() => {
    const total = attendance.length;

    const present = attendance.filter(
      (record) => record.status?.toUpperCase() === "PRESENT"
    ).length;

    const absent = attendance.filter(
      (record) => record.status?.toUpperCase() === "ABSENT"
    ).length;

    const percentage = total
      ? Math.round((present / total) * 100)
      : 0;

    return {
      total,
      present,
      absent,
      percentage,
    };
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const status = record.status?.toUpperCase() || "";

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const searchableText = [
        record.attendance_id,
        record.session_id,
        record.status,
        record.recognition_method,
        record.marked_at,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(
        search.toLowerCase()
      );

      return matchesStatus && matchesSearch;
    });
  }, [attendance, search, statusFilter]);

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMethod = (value) => {
    if (!value) return "N/A";

    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <section className="student-attendance">
      <header className="student-attendance-header">
        <div>
          <p className="student-attendance-eyebrow">
            ATTENDANCE
          </p>

          <h1>My Attendance</h1>

          <p className="student-attendance-subtitle">
            View your attendance records and attendance percentage.
          </p>
        </div>
      </header>

      {/* Summary */}
      <section className="student-attendance-summary">
        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon blue">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>

          <div>
            <span>Total Records</span>
            <strong>{loading ? "..." : summary.total}</strong>
            <small>Attendance records</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon green">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <div>
            <span>Present</span>
            <strong>{loading ? "..." : summary.present}</strong>
            <small>Classes attended</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon red">
            <FontAwesomeIcon icon={faCircleXmark} />
          </div>

          <div>
            <span>Absent</span>
            <strong>{loading ? "..." : summary.absent}</strong>
            <small>Classes missed</small>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon orange">
            <FontAwesomeIcon icon={faChartPie} />
          </div>

          <div>
            <span>Attendance</span>
            <strong>
              {loading ? "..." : `${summary.percentage}%`}
            </strong>
            <small>Overall attendance</small>
          </div>
        </article>
      </section>

      {/* Filters */}
      <section className="student-attendance-filter-card">
        <div className="student-attendance-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />

          <input
            type="search"
            placeholder="Search attendance records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={loading}
            aria-label="Search attendance"
          />
        </div>

        <label className="student-attendance-filter">
          <span>Status</span>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            disabled={loading}
          >
            <option value="all">All</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>
        </label>

        <button
          type="button"
          className="student-attendance-clear"
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
          }}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faRotate} />
          Clear Filters
        </button>
      </section>

      {/* Error */}
      {error && (
        <section className="student-attendance-error">
          <div>
            <strong>Unable to load attendance</strong>
            <p>{error}</p>
          </div>

          <button type="button" onClick={loadAttendance}>
            <FontAwesomeIcon icon={faRotate} />
            Retry
          </button>
        </section>
      )}

      {/* Loading */}
      {loading ? (
        <section className="student-attendance-state">
          <FontAwesomeIcon icon={faClock} spin />
          <h3>Loading attendance...</h3>
          <p>Please wait while your attendance records are retrieved.</p>
        </section>
      ) : !error && filteredAttendance.length === 0 ? (
        /* Empty */
        <section className="student-attendance-state">
          <FontAwesomeIcon icon={faCalendarCheck} />
          <h3>No attendance records found</h3>
          <p>
            Attendance records will appear here once attendance
            has been recorded.
          </p>
        </section>
      ) : (
        /* Table */
        <section className="student-attendance-table-card">
          <div className="student-attendance-table-header">
            <div>
              <p>ATTENDANCE RECORDS</p>
              <h2>Attendance History</h2>
            </div>

            <span>
              {filteredAttendance.length} Records
            </span>
          </div>

          <div className="student-attendance-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Attendance ID</th>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Confidence</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.map((record) => {
                  const status =
                    record.status?.toUpperCase() || "UNKNOWN";

                  return (
                    <tr key={record.attendance_id}>
                      <td>#{record.attendance_id}</td>

                      <td>
                        #{record.session_id}
                      </td>

                      <td>
                        {formatDate(record.marked_at)}
                      </td>

                      <td>
                        {formatTime(record.marked_at)}
                      </td>

                      <td>
                        <span
                          className={`student-attendance-status ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {formatMethod(record.recognition_method)}
                      </td>

                      <td>
                        {record.confidence_score != null
                          ? `${(
                              Number(record.confidence_score) * 100
                            ).toFixed(1)}%`
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Information */}
      <section className="student-attendance-info">
        <div className="student-attendance-info-icon">
          <FontAwesomeIcon icon={faShieldHalved} />
        </div>

        <div>
          <strong>Attendance information</strong>

          <span>
            Attendance records are retrieved from the backend
            for the authenticated student. Recognition confidence
            is displayed when provided by the attendance system.
          </span>
        </div>
      </section>
    </section>
  );
}

export default Attendance;