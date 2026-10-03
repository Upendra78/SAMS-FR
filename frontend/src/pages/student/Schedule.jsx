import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faClock,
  faLocationDot,
  faUserTie,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import PageState from "../../components/PageState";
import "./Schedule.css";

function Schedule() {
  return (
    <section className="student-schedule">
      {/* Header */}
      <div className="student-schedule-header">
        <div>
          <span className="student-schedule-eyebrow">Academic Timetable</span>
          <h1>My Schedule</h1>
          <p>
            View your weekly class timetable, timings, rooms and course
            information.
          </p>
        </div>

        <div className="student-schedule-semester">
          <span>Current Semester</span>
          <strong>N/A</strong>
          <small>Academic Year: N/A</small>
        </div>
      </div>

      {/* Week Controls */}
      <section className="student-schedule-controls">
        <button type="button" disabled>
          <FontAwesomeIcon icon={faChevronLeft} />
          Previous Week
        </button>

        <div className="student-schedule-week">
          <span>Week of</span>
          <strong>N/A</strong>
        </div>

        <button type="button" disabled>
          Next Week
          <FontAwesomeIcon icon={faChevronRight} />
        </button>

        <button
          type="button"
          className="student-schedule-today"
          disabled
        >
          Today
        </button>
      </section>

      {/* Weekly Timetable */}
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

        <div className="student-schedule-timetable">
          <PageState
            title="No schedule available"
            message="Your class timetable will appear here once schedule information is provided by the academic system."
          />
        </div>
      </section>

      {/* Today's Classes */}
      <section className="student-schedule-panel student-today-panel">
        <div className="student-schedule-panel-header">
          <div>
            <span>Today</span>
            <h2>Today&apos;s Classes</h2>
          </div>

          <div className="student-schedule-panel-icon">
            <FontAwesomeIcon icon={faClock} />
          </div>
        </div>

        <div className="student-schedule-today-empty">
          <PageState
            title="No classes available"
            message="Today's classes will appear here when timetable data is available."
          />
        </div>
      </section>

      {/* Schedule Information */}
      <section className="student-schedule-info">
        <div className="student-schedule-info-icon">
          <FontAwesomeIcon icon={faCircleInfo} />
        </div>

        <div>
          <strong>Schedule information</strong>
          <p>
            Your timetable will be retrieved for the authenticated student
            from the academic system. Schedule information displayed here will
            come from the backend.
          </p>
        </div>
      </section>

      {/* Future class metadata reference */}
      <div className="student-schedule-data-reference">
        <span>
          <FontAwesomeIcon icon={faLocationDot} />
          Room
        </span>
        <span>
          <FontAwesomeIcon icon={faUserTie} />
          Faculty
        </span>
      </div>
    </section>
  );
}

export default Schedule;