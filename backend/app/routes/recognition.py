from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import Faculty
from app.services.cv.attendance_service import mark_face_attendance
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

    if confidence_score is None:
        return jsonify({
            "success": False,
            "message": "confidence_score is required",
        }), 400

    record, message = mark_face_attendance(
        session_id=session_id,
        student_id=student_id,
        confidence_score=confidence_score,
    )

    if record is None:
        if message == "Attendance session not found":
            status_code = 404
        elif message == "Attendance session is not active":
            status_code = 409
        elif message == "Student is not enrolled in this course":
            status_code = 403
        elif "confidence_score" in message:
            status_code = 400
        else:
            status_code = 400

        return jsonify({
            "success": False,
            "message": message,
        }), status_code

    return jsonify({
        "success": True,
        "message": message,
        "data": {
            "attendance_id": record.attendance_id,
            "session_id": record.session_id,
            "student_id": record.student_id,
            "status": record.status,
            "confidence_score": record.confidence_score,
            "recognition_method": record.recognition_method,
            "marked_at": record.marked_at.isoformat(),
        },
    }), 201 if message == "Attendance marked successfully" else 200