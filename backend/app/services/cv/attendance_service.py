from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    Enrollment,
)


def get_active_session(faculty_id):
    """
    Return the most recent active attendance session
    belonging to the faculty member.
    """

    return (
        AttendanceSession.query
        .filter_by(
            faculty_id=faculty_id,
            status="ACTIVE",
        )
        .order_by(
            AttendanceSession.session_id.desc()
        )
        .first()
    )


def mark_face_attendance(
    session_id,
    student_id,
    confidence_score,
):
    """
    Mark attendance for a face-recognized student.

    Validates:
    - Attendance session exists
    - Session is active
    - Student is enrolled in the offering
    - Confidence score is valid
    - Duplicate attendance is prevented
    """

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return None, "Attendance session not found"

    if session.status != "ACTIVE":
        return None, "Attendance session is not active"

    enrollment = Enrollment.query.filter_by(
        student_id=student_id,
        offering_id=session.offering_id,
        status="ACTIVE",
    ).first()

    if not enrollment:
        return None, "Student is not enrolled in this course"

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
        confidence_score=confidence_score,
        recognition_method="FACE",
    )

    db.session.add(record)
    db.session.commit()

    return record, "Attendance marked successfully"