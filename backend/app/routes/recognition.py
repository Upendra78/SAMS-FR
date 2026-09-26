from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    Enrollment,
    Faculty,
)
from app.utils.auth import faculty_required


recognition_bp = Blueprint(
    "recognition",
    __name__,
    url_prefix="/api/faculty/recognition",
)


def get_current_faculty():
    user_id = int(get_jwt_identity())

    return Faculty.query.filter_by(
        user_id=user_id
    ).first()


@recognition_bp.post("/attendance")
@faculty_required
def process_recognition_attendance():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    data = request.get_json(silent=True) or {}

    session_id = data.get("session_id")
    student_id = data.get("student_id")
    confidence_score = data.get("confidence_score")

    if not session_id or not student_id:
        return jsonify({
            "success": False,
            "message": "session_id and student_id are required",
        }), 400

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

    if confidence_score is None:
        return jsonify({
            "success": False,
            "message": "confidence_score is required",
        }), 400

    try:
        confidence_score = float(confidence_score)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "confidence_score must be numeric",
        }), 400

    if not 0.0 <= confidence_score <= 1.0:
        return jsonify({
            "success": False,
            "message": "confidence_score must be between 0 and 1",
        }), 400

    existing_record = AttendanceRecord.query.filter_by(
        session_id=session_id,
        student_id=student_id,
    ).first()

    if existing_record:
        return jsonify({
            "success": True,
            "message": "Attendance already marked",
            "data": {
                "attendance_id": existing_record.attendance_id,
                "student_id": existing_record.student_id,
                "status": existing_record.status,
                "confidence_score": existing_record.confidence_score,
                "recognition_method": existing_record.recognition_method,
            },
        }), 200

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        status="PRESENT",
        confidence_score=confidence_score,
        recognition_method="FACE",
    )

    db.session.add(record)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Face recognition attendance recorded",
        "data": {
            "attendance_id": record.attendance_id,
            "session_id": record.session_id,
            "student_id": record.student_id,
            "status": record.status,
            "confidence_score": record.confidence_score,
            "recognition_method": record.recognition_method,
            "marked_at": record.marked_at.isoformat(),
        },
    }), 201