from datetime import datetime

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
            "data": {
                "session_id": active_session.session_id,
                "offering_id": active_session.offering_id,
                "session_date": active_session.session_date.isoformat(),
                "start_time": active_session.start_time.isoformat(),
                "status": active_session.status,
            },
        }), 409

    now = datetime.utcnow()

    session = AttendanceSession(
        offering_id=offering.offering_id,
        faculty_id=faculty.faculty_id,
        session_date=now.date(),
        start_time=now.time(),
        status="ACTIVE",
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance session started successfully",
        "data": {
            "session_id": session.session_id,
            "offering_id": session.offering_id,
            "faculty_id": session.faculty_id,
            "session_date": session.session_date.isoformat(),
            "start_time": session.start_time.isoformat(),
            "end_time": None,
            "status": session.status,
        },
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

    data = [
        {
            "session_id": session.session_id,
            "offering_id": session.offering_id,
            "faculty_id": session.faculty_id,
            "session_date": session.session_date.isoformat(),
            "start_time": session.start_time.isoformat(),
            "end_time": (
                session.end_time.isoformat()
                if session.end_time
                else None
            ),
            "status": session.status,
        }
        for session in sessions
    ]

    return jsonify({
        "success": True,
        "data": data,
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
        "data": {
            "session_id": session.session_id,
            "offering_id": session.offering_id,
            "faculty_id": session.faculty_id,
            "session_date": session.session_date.isoformat(),
            "start_time": session.start_time.isoformat(),
            "end_time": (
                session.end_time.isoformat()
                if session.end_time
                else None
            ),
            "status": session.status,
        },
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

    session.end_time = datetime.utcnow().time()
    session.status = "CLOSED"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance session closed successfully",
        "data": {
            "session_id": session.session_id,
            "offering_id": session.offering_id,
            "faculty_id": session.faculty_id,
            "session_date": session.session_date.isoformat(),
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat(),
            "status": session.status,
        },
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

    if recognition_method not in {"FACE", "MANUAL"}:
        return jsonify({
            "success": False,
            "message": "Invalid recognition_method",
        }), 400

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        status="PRESENT",
        marked_at=datetime.utcnow(),
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