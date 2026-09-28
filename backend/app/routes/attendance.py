from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
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