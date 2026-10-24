from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    Enrollment,
    FacultyAdjustment,
    Student,
    TimetableEntry,
)
from app.utils import schedule


def get_active_session(faculty_id):
    return (
        AttendanceSession.query
        .filter_by(faculty_id=faculty_id, status="ACTIVE")
        .order_by(AttendanceSession.session_id.desc())
        .first()
    )


def validate_student_attendance_eligibility(
    session: AttendanceSession,
    student_id: int,
    faculty_id: int = None,
    current_dt: datetime = None,
    check_window: bool = True,
) -> tuple[bool, str, Student | None]:
    """
    Authoritatively validates:
    1. Session exists and is linked to a valid course offering.
    2. Faculty authorization (faculty_id matches session owner or approved substitute).
    3. Session status is ACTIVE and current time is within scheduled window (if check_window=True).
    4. Student exists with an active user account and role 'STUDENT'.
    5. Student has an active enrollment in this specific course offering.
    6. Student's section matches the course offering section.
    7. Student's semester matches the course offering semester.
    8. Student's academic year matches the course offering academic year.
    9. Student's department matches the course department.
    10. Student's batch matches the course batch (when course specifies a batch).

    Returns:
        (is_eligible: bool, message: str, student: Student | None)
    """
    if not session:
        return False, "Attendance session not found", None

    offering = session.offering
    if not offering:
        return False, "Attendance session is not associated with a valid course offering", None

    course = offering.course

    # 1. Faculty authorization check
    if faculty_id is not None and session.faculty_id != faculty_id:
        is_substitute = FacultyAdjustment.query.filter_by(
            substitute_faculty_id=faculty_id,
            status="APPROVED",
        ).join(TimetableEntry).filter(TimetableEntry.offering_id == session.offering_id).first() is not None
        if not is_substitute:
            return False, "Attendance session does not belong to this faculty", None

    # 2. Window and session status check
    if check_window:
        if session.status != "ACTIVE":
            return False, f"Attendance session is {session.status.lower()} (not active)", None

        if current_dt is None:
            current_dt = schedule.get_current_institution_time()

        is_eligible_window, status_str, details = schedule.get_session_schedule_status(session, current_dt=current_dt)
        if status_str == "UPCOMING":
            schedule.reconcile_premature_session(session)
            return False, details.get("message", "Attendance cannot be recorded before scheduled start time"), None
        if status_str == "ENDED":
            schedule.close_expired_session(session)
            return False, "Attendance session has ended", None
        if not is_eligible_window:
            return False, "Current time is outside the scheduled class window", None

    # 3. Student record and active user account check
    student = db.session.get(Student, student_id)
    if not student:
        return False, "Student not found", None

    user = student.user
    if not user or not user.is_active:
        return False, "Student account is inactive or disabled", student

    if user.role != "STUDENT":
        return False, "User account is not a student", student

    # 4. Enrollment check for this exact course offering
    enrollment = Enrollment.query.filter_by(
        student_id=student_id,
        offering_id=session.offering_id,
        status="ACTIVE",
    ).first()
    if not enrollment:
        return False, "Student is not enrolled in this course", student

    # 5. Section match
    if offering.section and student.section:
        if student.section.strip().upper() != offering.section.strip().upper():
            return False, f"Student section ({student.section}) does not match session section ({offering.section})", student

    # 6. Semester match
    if offering.semester is not None and student.semester is not None:
        if student.semester != offering.semester:
            return False, f"Student semester ({student.semester}) does not match session semester ({offering.semester})", student

    # 7. Academic year match
    if offering.academic_year and student.academic_year:
        if student.academic_year.strip().lower() != offering.academic_year.strip().lower():
            return False, f"Student academic year ({student.academic_year}) does not match session academic year ({offering.academic_year})", student

    # 8. Department match
    if course and course.department_id and student.department_id:
        if student.department_id != course.department_id:
            return False, "Student department does not match course department", student

    # 9. Batch match (if specified on course and student)
    if course and course.batch:
        student_batch_name = student.batch.batch_name if student.batch else None
        if student_batch_name and student_batch_name.strip().upper() != course.batch.strip().upper():
            return False, f"Student batch ({student_batch_name}) does not match course batch ({course.batch})", student

    return True, "Student is eligible", student


def mark_face_attendance(
    session_id,
    student_id,
    confidence_score,
    faculty_id=None,
    current_dt=None,
):
    session = db.session.get(AttendanceSession, session_id)

    if not session:
        return None, "Attendance session not found"

    is_eligible, message, student = validate_student_attendance_eligibility(
        session=session,
        student_id=student_id,
        faculty_id=faculty_id,
        current_dt=current_dt,
        check_window=True,
    )

    if not is_eligible:
        return None, message

    try:
        confidence_score = float(confidence_score)
    except (TypeError, ValueError):
        return None, "confidence_score must be numeric"

    if not 0.0 <= confidence_score <= 1.0:
        return None, "confidence_score must be between 0 and 1"

    existing_record = AttendanceRecord.query.filter_by(
        session_id=session_id,
        student_id=student_id,
    ).first()

    if existing_record:
        return existing_record, "Attendance already marked"

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        status="PRESENT",
        marked_at=datetime.now(timezone.utc).replace(tzinfo=None),
        confidence_score=confidence_score,
        recognition_method="FACE",
    )

    db.session.add(record)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()

        existing_record = AttendanceRecord.query.filter_by(
            session_id=session_id,
            student_id=student_id,
        ).first()

        if existing_record:
            return existing_record, "Attendance already marked"

        return None, "Unable to mark attendance"

    return record, "Attendance marked successfully"