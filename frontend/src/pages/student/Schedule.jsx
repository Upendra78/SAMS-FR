import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faClock,
  faLocationDot,
  faUserTie,
  faCircleInfo,
  faSpinner,
  faTriangleExclamation,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import PageState from "../../components/PageState";
import { getStudentTimetable } from "../../services/timetableService";
import { getStudentProfile } from "../../services/studentService";
import "./Schedule.css";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTimeDisplay(timeStr) {
  if (!timeStr) return "--:--";
  const match = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  const hours = Number(match[1]);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function getWeekDateRange() {
  const now = new Date();
  const currentDay = now.getDay();
  // Distance to Monday (if Sunday (0), distance is -6)
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMonday);

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${fmt(monday)} - ${fmt(saturday)}, ${monday.getFullYear()}`;
}

function Schedule() {
  const [timetable, setTimetable] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");
  const [reloadKey, setReloadKey] = useState(0);

  const todayName = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
      new Date()
    );
  }, []);

  const weekRange = useMemo(() => getWeekDateRange(), []);

  useEffect(() => {
    let ignore = false;

    async function loadSchedule() {
      try {
        const [timetableRes, profileRes] = await Promise.allSettled([
          getStudentTimetable(),
          getStudentProfile(),
        ]);

        if (ignore) return;

        if (timetableRes.status === "fulfilled" && timetableRes.value?.success) {
          setTimetable(
            Array.isArray(timetableRes.value.data) ? timetableRes.value.data : []
          );
        } else {
          const errMsg =
            timetableRes.status === "rejected"
              ? timetableRes.reason?.response?.data?.message ||
                timetableRes.reason?.message
              : timetableRes.value?.message;
          throw new Error(errMsg || "Failed to load class timetable.");
        }

        if (profileRes.status === "fulfilled" && profileRes.value?.success) {
          setProfile(profileRes.value.data || null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load your schedule. Please try again later."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setReloadKey((prev) => prev + 1);
  };

  // Group timetable entries by weekday
  const groupedTimetable = useMemo(() => {
    const map = {};
    DAYS_OF_WEEK.forEach((d) => {
      map[d] = [];
    });

    timetable.forEach((entry) => {
      const day = entry.day_of_week;
      // Match day case-insensitively
      const matchedDay = DAYS_OF_WEEK.find(
        (d) => d.toLowerCase() === String(day).toLowerCase()
      );
      if (matchedDay) {
        map[matchedDay].push(entry);
      }
    });

    // Sort each day's entries by start time
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) =>
        String(a.start_time || "").localeCompare(String(b.start_time || ""))
      );
    });

    return map;
  }, [timetable]);

  // Today's classes
  const todayClasses = useMemo(() => {
    return groupedTimetable[todayName] || [];
  }, [groupedTimetable, todayName]);

  // Filtered days for weekly timetable view
  const displayDays = useMemo(() => {
    if (selectedDay !== "All") {
      return [selectedDay];
    }
    return DAYS_OF_WEEK;
  }, [selectedDay]);

  const hasAnyClasses = timetable.length > 0;

  return (
    <section className="student-schedule">
      {/* Header */}
      <div className="student-schedule-header">
        <div>
          <span className="student-schedule-eyebrow">Academic Timetable</span>
          <h1>My Schedule</h1>
          <p>
            View your weekly class timetable, timings, rooms, and assigned faculty.
          </p>
        </div>

        <div className="student-schedule-semester">
          <span>Current Semester</span>
          <strong>
            {profile?.semester ? `Semester ${profile.semester}` : "N/A"}
          </strong>
          <small>
            Academic Year: {profile?.academic_year || "N/A"}
          </small>
        </div>
      </div>

      {/* Week & Day Filter Controls */}
      <section className="student-schedule-controls" aria-label="Schedule controls">
        <div className="student-schedule-week">
          <span>Current Week</span>
          <strong>{weekRange}</strong>
        </div>

        <div className="student-schedule-day-filters" role="group" aria-label="Day filter">
          <button
            type="button"
            className={selectedDay === "All" ? "active" : ""}
            onClick={() => setSelectedDay("All")}
          >
            All Days
          </button>
          {DAYS_OF_WEEK.map((day) => {
            const isToday = day === todayName;
            const count = groupedTimetable[day]?.length || 0;
            return (
              <button
                key={day}
                type="button"
                className={`${selectedDay === day ? "active" : ""} ${
                  isToday ? "is-today" : ""
                }`}
                onClick={() => setSelectedDay(day)}
              >
                {day.slice(0, 3)}
                {count > 0 && <span className="day-count-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="student-schedule-today"
          onClick={() => setSelectedDay(todayName)}
        >
          <FontAwesomeIcon icon={faCalendarDays} />
          Today ({todayName.slice(0, 3)})
        </button>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="student-schedule-loading">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading your academic timetable...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="student-schedule-error" role="alert">
          <FontAwesomeIcon icon={faTriangleExclamation} className="error-icon" />
          <div>
            <strong>Unable to load timetable</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="retry-btn"
            onClick={handleRetry}
          >
            <FontAwesomeIcon icon={faRotateRight} /> Retry
          </button>
        </div>
      )}

      {/* Main Content when loaded */}
      {!loading && !error && (
        <>
          {/* Today's Classes Panel */}
          <section className="student-schedule-panel student-today-panel">
            <div className="student-schedule-panel-header">
              <div>
                <span>Today</span>
                <h2>Today&apos;s Classes — {todayName}</h2>
              </div>

              <div className="student-schedule-panel-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
            </div>

            {todayClasses.length === 0 ? (
              <div className="student-schedule-today-empty">
                <PageState
                  title="No classes scheduled for today"
                  message={`You have no class sessions scheduled on ${todayName}. Enjoy your day or review upcoming coursework.`}
                />
              </div>
            ) : (
              <div className="student-classes-grid">
                {todayClasses.map((item) => (
                  <article key={item.timetable_entry_id} className="student-class-card today-card">
                    <div className="class-card-time">
                      <FontAwesomeIcon icon={faClock} />
                      <span>
                        {formatTimeDisplay(item.start_time)} - {formatTimeDisplay(item.end_time)}
                      </span>
                    </div>

                    <div className="class-card-main">
                      <span className="class-card-code">{item.course_code}</span>
                      <h3 className="class-card-name">{item.course_name}</h3>
                    </div>

                    <div className="class-card-meta">
                      <span className="meta-item room-item">
                        <FontAwesomeIcon icon={faLocationDot} />
                        {item.room || "Room TBA"}
                      </span>
                      <span className="meta-item faculty-item">
                        <FontAwesomeIcon icon={faUserTie} />
                        {item.effective_faculty_name || item.faculty_name || "Faculty TBA"}
                      </span>
                      {item.section && (
                        <span className="meta-item section-item">
                          Sec {item.section}
                        </span>
                      )}
                    </div>

                    {item.active_adjustment && (
                      <div className="class-card-adjustment-tag">
                        <span>Substitute Faculty Assigned</span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Weekly Timetable Panel */}
          <section className="student-schedule-panel">
            <div className="student-schedule-panel-header">
              <div>
                <span>Weekly Timetable</span>
                <h2>Class Schedule</h2>
              </div>

              <div className="student-schedule-panel-icon">
                <FontAwesomeIcon icon={faCalendarDays} />
              </div>
            </div>

            {!hasAnyClasses ? (
              <div className="student-schedule-timetable">
                <PageState
                  title="No schedule available"
                  message="No timetable slots found for your active course enrollments. Please ensure you are enrolled in courses with assigned schedules."
                />
              </div>
            ) : (
              <div className="student-weekly-timetable-view">
                {displayDays.map((day) => {
                  const dayEntries = groupedTimetable[day] || [];
                  const isCurrentDay = day === todayName;

                  return (
                    <div
                      key={day}
                      className={`student-day-row ${
                        isCurrentDay ? "current-day-row" : ""
                      }`}
                    >
                      <div className="student-day-label">
                        <strong>{day}</strong>
                        {isCurrentDay && <span className="today-chip">Today</span>}
                        <small>{dayEntries.length} {dayEntries.length === 1 ? "class" : "classes"}</small>
                      </div>

                      <div className="student-day-cards">
                        {dayEntries.length === 0 ? (
                          <div className="student-day-empty">
                            <span>No classes scheduled</span>
                          </div>
                        ) : (
                          dayEntries.map((item) => (
                            <article
                              key={item.timetable_entry_id}
                              className="student-class-card"
                            >
                              <div className="class-card-time">
                                <FontAwesomeIcon icon={faClock} />
                                <span>
                                  {formatTimeDisplay(item.start_time)} -{" "}
                                  {formatTimeDisplay(item.end_time)}
                                </span>
                              </div>

                              <div className="class-card-main">
                                <span className="class-card-code">
                                  {item.course_code}
                                </span>
                                <h3 className="class-card-name">
                                  {item.course_name}
                                </h3>
                              </div>

                              <div className="class-card-meta">
                                <span className="meta-item room-item">
                                  <FontAwesomeIcon icon={faLocationDot} />
                                  {item.room || "Room TBA"}
                                </span>
                                <span className="meta-item faculty-item">
                                  <FontAwesomeIcon icon={faUserTie} />
                                  {item.effective_faculty_name ||
                                    item.faculty_name ||
                                    "Faculty TBA"}
                                </span>
                                {item.section && (
                                  <span className="meta-item section-item">
                                    Sec {item.section}
                                  </span>
                                )}
                              </div>

                              {item.active_adjustment && (
                                <div className="class-card-adjustment-tag">
                                  <span>Substitute: {item.effective_faculty_name}</span>
                                </div>
                              )}
                            </article>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Schedule Information Footer */}
          <section className="student-schedule-info">
            <div className="student-schedule-info-icon">
              <FontAwesomeIcon icon={faCircleInfo} />
            </div>

            <div>
              <strong>Timetable synchronization</strong>
              <p>
                This schedule is automatically synchronized with your enrolled courses and
                official academic timetable slots. For adjustments or room inquiries, contact your
                department coordinator.
              </p>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default Schedule;