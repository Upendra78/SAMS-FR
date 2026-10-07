import cv2
import numpy as np

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Faculty, AttendanceSession, FaceProfile
from app.services.cv.attendance_service import mark_face_attendance
from app.services.face_service import FaceService
from app.utils.auth import faculty_required


recognition_bp = Blueprint(
    "recognition",
    __name__,
    url_prefix="/api/faculty/recognition",
)

face_service = FaceService()
SIMILARITY_THRESHOLD = 0.54

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

    session_id = request.form.get("session_id")
    image_file = request.files.get("image")
    if not session_id:
        return jsonify({
            "success": False,
            "message": "session_id is required",
        }), 400
    if image_file is None:
        return jsonify({
            "success": False,
            "message": "image is required",
        }),400
    image_bytes = image_file.read()
    if not image_bytes:
        return jsonify({
            "success": False,
            "message": "Invalid image",
        }),400
    image_buffer = np.frombuffer(
        image_bytes,
        dtype = np.uint8,
    )
    image = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR,)
    if image is None:
        return jsonify({
            "success":False,
            "message": "Invalid image",
        }),400

    # Verify that the attendance session belongs
    # to the authenticated faculty member.
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
            "message": "Access forbidden",
        }), 403

    face_profiles = FaceProfile.query.filter_by(
        is_active = True,
        model_version = "sface_2021dec",
    ).all()
    registered_students = []
    for profile in face_profiles:
        encoding = np.frombuffer(
            profile.embedding,
            dtype = np.float32,
        )
        if(
            encoding.shape !=(128,)
            or not np.isfinite(encoding).all()
        ):
            continue
        registered_students.append({
            "student_id": profile.student_id,
            "encoding": encoding.reshape(1,128),
        })
    try:
        recognition_result = face_service.recognize_student(
            image,
            registered_students,

            SIMILARITY_THRESHOLD,
        )
    except(cv2.error, ValueError):
        return jsonify({
            "success": False,
            "message": "Face recognition failed",
            "status": "recognition_failed",
        }),400
    if recognition_result["status"] != "recognized":
        return jsonify({
            "success": False,
            "message": "Face not recognized",
            "status": recognition_result["status"],
            "data": {
                "student_id": recognition_result["student_id"],
                "similarity_score": recognition_result["similarity_score"],
            },
        }),200
    student_id = recognition_result["student_id"]
    confidence_score = recognition_result["similarity_score"]
        

    record, message = mark_face_attendance(
        session_id=session_id,
        student_id=student_id,
        confidence_score=confidence_score,
        faculty_id=faculty.faculty_id,
    )

    if record is None:
        if message == "Attendance session not found":
            status_code = 404
        elif message == "Attendance session does not belong to this faculty":
            status_code = 403
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