from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
    Enrollment,
    Faculty,
    Student,
    TimetableEntry,
)
from app.utils.auth import faculty_required


attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/faculty/attendance",
)


def get_current_faculty():
    user_id = int(get_jwt_identity())

    return Faculty.query.filter_by(
        user_id=user_id
    ).first()


def serialize_session(session):
    if not session:
        return None

    offering = session.offering
    course = offering.course if offering else None

    today_day = (
        session.session_date.strftime("%A")
        if session.session_date
        else datetime.now().strftime("%A")
    )
    timetable_entry = (
        TimetableEntry.query
        .filter(
            TimetableEntry.offering_id == session.offering_id,
            db.func.lower(TimetableEntry.day_of_week) == today_day.lower(),
        )
        .first()
    ) if session.offering_id else None

    if not timetable_entry and session.offering_id:
        timetable_entry = (
            TimetableEntry.query
            .filter_by(offering_id=session.offering_id)
            .order_by(TimetableEntry.timetable_entry_id.asc())
            .first()
        )

    room = (
        (timetable_entry.room if timetable_entry and timetable_entry.room else None)
        or (offering.room if offering else None)
    )

    start_time_val = (
        session.start_time
        or (timetable_entry.start_time if timetable_entry else None)
    )
    end_time_val = (
        session.end_time
        or (timetable_entry.end_time if timetable_entry else None)
    )

    return {
        "session_id": session.session_id,
        "offering_id": session.offering_id,
        "faculty_id": session.faculty_id,
        "session_date": session.session_date.isoformat() if session.session_date else None,
        "start_time": start_time_val.isoformat() if start_time_val else None,
        "end_time": end_time_val.isoformat() if end_time_val else None,
        "status": session.status,
        "room": room,
        "course_code": course.course_code if course else None,
        "course_name": course.course_name if course else None,
        "section": offering.section if offering else None,
    }


# ============================================================
# START ATTENDANCE SESSION
# ============================================================

@attendance_bp.post("/sessions")
@faculty_required
def start_attendance_session():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    data = request.get_json(silent=True) or {}

    offering_id = data.get("offering_id")

    if not offering_id:
        return jsonify({
            "success": False,
            "message": "offering_id is required",
        }), 400

    offering = db.session.get(
        CourseOffering,
        offering_id,
    )

    if not offering:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    if offering.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this course offering",
        }), 403

    # Prevent multiple active sessions for the same faculty member.
    active_session = (
        AttendanceSession.query
        .filter_by(
            faculty_id=faculty.faculty_id,
            status="ACTIVE",
        )
        .order_by(
            AttendanceSession.session_id.desc()
        )
        .first()
    )

    if active_session:
        return jsonify({
            "success": False,
            "message": "An active attendance session already exists",
            "data": serialize_session(active_session),
        }), 409

    local_now = datetime.now()
    today_day = local_now.strftime("%A")

    # Extract faculty assigned session time from the timetable
    timetable_entry_id = data.get("timetable_entry_id")
    timetable_entry = None
    if timetable_entry_id:
        timetable_entry = db.session.get(TimetableEntry, timetable_entry_id)
        if timetable_entry and timetable_entry.offering_id != offering.offering_id:
            timetable_entry = None

    if not timetable_entry:
        timetable_entry = (
            TimetableEntry.query
            .filter(
                TimetableEntry.offering_id == offering.offering_id,
                db.func.lower(TimetableEntry.day_of_week) == today_day.lower(),
            )
            .first()
        )

    if not timetable_entry:
        timetable_entry = (
            TimetableEntry.query
            .filter_by(offering_id=offering.offering_id)
            .order_by(TimetableEntry.timetable_entry_id.asc())
            .first()
        )

    if timetable_entry:
        session_start = timetable_entry.start_time
        session_end = timetable_entry.end_time
    else:
        session_start = local_now.time()
        session_end = (local_now + timedelta(hours=1)).time()

    session = AttendanceSession(
        offering_id=offering.offering_id,
        faculty_id=faculty.faculty_id,
        session_date=local_now.date(),
        start_time=session_start,
        end_time=session_end,
        status="ACTIVE",
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance session started successfully",
        "data": serialize_session(session),
    }), 201


@attendance_bp.get("/sessions")
@faculty_required
def get_attendance_sessions():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    sessions = (
        AttendanceSession.query
        .filter_by(faculty_id=faculty.faculty_id)
        .order_by(AttendanceSession.session_id.desc())
        .all()
    )

    return jsonify({
        "success": True,
        "data": [serialize_session(session) for session in sessions],
    }), 200


# ============================================================
# GET ACTIVE ATTENDANCE SESSION
# ============================================================

@attendance_bp.get("/sessions/active")
@faculty_required
def get_active_attendance_session():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = (
        AttendanceSession.query
        .filter_by(
            faculty_id=faculty.faculty_id,
            status="ACTIVE",
        )
        .order_by(
            AttendanceSession.session_id.desc()
        )
        .first()
    )

    if not session:
        return jsonify({
            "success": True,
            "message": "No active attendance session",
            "data": None,
        }), 200

    return jsonify({
        "success": True,
        "data": serialize_session(session),
    }), 200


# ============================================================
# CLOSE ATTENDANCE SESSION
# ============================================================

@attendance_bp.post("/sessions/<int:session_id>/close")
@faculty_required
def close_attendance_session(session_id):
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    if session.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this session",
        }), 403

    if session.status != "ACTIVE":
        return jsonify({
            "success": False,
            "message": "Attendance session is already closed",
        }), 409

    # Find all actively enrolled students for this course offering.
    active_enrollments = Enrollment.query.filter_by(
        offering_id=session.offering_id,
        status="ACTIVE",
    ).all()

    # Find students whose attendance has already been recorded.
    existing_records = AttendanceRecord.query.filter_by(
        session_id=session.session_id,
    ).all()

    recorded_student_ids = {
        record.student_id for record in existing_records
    }

    local_now = datetime.now()

    # Automatically mark students without an attendance record as ABSENT.
    for enrollment in active_enrollments:
        if enrollment.student_id not in recorded_student_ids:
            absent_record = AttendanceRecord(
                session_id=session.session_id,
                student_id=enrollment.student_id,
                status="ABSENT",
                marked_at=datetime.now(timezone.utc).replace(tzinfo=None),
                recognition_method="SYSTEM",
            )
            db.session.add(absent_record)

    # Close the session and save all absence records together.
    if not session.end_time:
        session.end_time = local_now.time()
    session.status = "CLOSED"

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify({
        "success": True,
        "message": "Attendance session closed successfully",
        "data": serialize_session(session),
    }), 200


# ============================================================
# MARK ATTENDANCE RECORD
# ============================================================

@attendance_bp.post("/sessions/<int:session_id>/records")
@faculty_required
def mark_attendance(session_id):
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    if session.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this session",
        }), 403

    if session.status != "ACTIVE":
        return jsonify({
            "success": False,
            "message": "Attendance session is not active",
        }), 409

    data = request.get_json(silent=True) or {}

    student_id = data.get("student_id")
    confidence_score = data.get("confidence_score")
    recognition_method = data.get(
        "recognition_method",
        "FACE",
    )

    if not student_id:
        return jsonify({
            "success": False,
            "message": "student_id is required",
        }), 400

    student = db.session.get(
        Student,
        student_id,
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    enrollment = Enrollment.query.filter_by(
        student_id=student_id,
        offering_id=session.offering_id,
        status="ACTIVE",
    ).first()

    if not enrollment:
        return jsonify({
            "success": False,
            "message": "Student is not enrolled in this course",
        }), 403

    existing_record = AttendanceRecord.query.filter_by(
        session_id=session_id,
        student_id=student_id,
    ).first()

    if existing_record:
        return jsonify({
            "success": False,
            "message": "Attendance already marked for this student",
        }), 409

    if confidence_score is not None:
        try:
            confidence_score = float(confidence_score)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "confidence_score must be a number",
            }), 400

        if not 0.0 <= confidence_score <= 1.0:
            return jsonify({
                "success": False,
                "message": "confidence_score must be between 0 and 1",
            }), 400

    recognition_method = str(
        recognition_method
    ).upper().strip()

    if recognition_method not in {"FACE", "MANUAL", "SYSTEM"}:
        return jsonify({
            "success": False,
            "message": "Invalid recognition_method",
        }), 400

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        status="PRESENT",
        marked_at=datetime.now(timezone.utc).replace(tzinfo=None),
        confidence_score=confidence_score,
        recognition_method=recognition_method,
    )

    db.session.add(record)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance marked successfully",
        "data": {
            "attendance_id": record.attendance_id,
            "session_id": record.session_id,
            "student_id": record.student_id,
            "status": record.status,
            "marked_at": record.marked_at.isoformat(),
            "confidence_score": record.confidence_score,
            "recognition_method": record.recognition_method,
        },
    }), 201


# ============================================================
# GET SESSION ATTENDANCE RECORDS
# ============================================================

@attendance_bp.get("/sessions/<int:session_id>/records")
@faculty_required
def get_session_attendance(session_id):
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    if session.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this session",
        }), 403

    records = (
        AttendanceRecord.query
        .filter_by(session_id=session_id)
        .order_by(AttendanceRecord.marked_at.asc())
        .all()
    )

    data = [
        {
            "attendance_id": record.attendance_id,
            "student_id": record.student_id,
            "status": record.status,
            "marked_at": record.marked_at.isoformat(),
            "confidence_score": record.confidence_score,
            "recognition_method": record.recognition_method,
        }
        for record in records
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200