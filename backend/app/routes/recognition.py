import base64
import cv2
import numpy as np

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    AttendanceSession,
    FaceProfile,
    Faculty,
    FacultyAdjustment,
    Student,
    TimetableEntry,
)
from app.services.cv.attendance_service import mark_face_attendance
from app.services.face_service import FaceService
from app.utils.auth import faculty_required
from app.utils import schedule


recognition_bp = Blueprint(
    "recognition",
    __name__,
    url_prefix="/api/faculty/recognition",
)

face_service = FaceService()
SIMILARITY_THRESHOLD = 0.50


def get_current_faculty():
    user_id = int(get_jwt_identity())
    return Faculty.query.filter_by(user_id=user_id).first()


def _decode_image(image_input):
    """Decode FileStorage, bytes, or base64 data into an OpenCV BGR image."""
    if image_input is None:
        return None

    if isinstance(image_input, str):
        b64_str = image_input
        if "base64," in b64_str:
            b64_str = b64_str.split("base64,")[1]
        try:
            image_bytes = base64.b64decode(b64_str)
        except Exception:
            return None
    elif hasattr(image_input, "read"):
        image_bytes = image_input.read()
    elif isinstance(image_input, (bytes, bytearray)):
        image_bytes = image_input
    else:
        return None

    if not image_bytes:
        return None

    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(buffer, cv2.IMREAD_COLOR)


@recognition_bp.post("/attendance")
@faculty_required
def process_recognition_attendance():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    json_data = request.get_json(silent=True) or {}
    session_id = request.form.get("session_id") or json_data.get("session_id")
    image_input = (
        request.files.get("image")
        or request.form.get("image")
        or json_data.get("image")
    )

    if not session_id:
        return jsonify({
            "success": False,
            "message": "session_id is required",
        }), 400

    if image_input is None:
        return jsonify({
            "success": False,
            "message": "image is required",
        }), 400

    image = _decode_image(image_input)
    if image is None:
        return jsonify({
            "success": False,
            "message": "Invalid image",
        }), 400

    # Verify that the attendance session belongs to authenticated faculty
    session = db.session.get(AttendanceSession, session_id)
    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    is_owner = (session.faculty_id == faculty.faculty_id)
    is_substitute = FacultyAdjustment.query.filter_by(
        substitute_faculty_id=faculty.faculty_id,
        status="APPROVED",
    ).join(TimetableEntry).filter(TimetableEntry.offering_id == session.offering_id).first() is not None

    if not (is_owner or is_substitute):
        return jsonify({
            "success": False,
            "message": "Access forbidden",
        }), 403

    if session.status != "ACTIVE":
        return jsonify({
            "success": False,
            "message": "Attendance session is not active",
        }), 409

    now = schedule.get_current_institution_time()
    is_eligible, status_str, details = schedule.get_session_schedule_status(session, current_dt=now)

    if status_str == "UPCOMING":
        schedule.reconcile_premature_session(session)
        return jsonify({
            "success": False,
            "message": details.get("message", "Attendance cannot be recorded before scheduled start time"),
        }), 400

    if status_str == "ENDED":
        schedule.close_expired_session(session)
        return jsonify({
            "success": False,
            "message": "Attendance session has ended. New attendance recording is prevented.",
        }), 409

    # Load active face profiles
    face_profiles = FaceProfile.query.filter_by(
        is_active=True,
        model_version="sface_2021dec",
    ).all()

    registered_students = []
    for profile in face_profiles:
        encoding = np.frombuffer(profile.embedding, dtype=np.float32)
        if encoding.shape != (128,) or not np.isfinite(encoding).all():
            continue
        registered_students.append({
            "student_id": profile.student_id,
            "encoding": encoding.reshape(1, 128),
        })

    if not registered_students:
        return jsonify({
            "success": True,
            "status": "no_registered_students",
            "message": "No registered face profiles found in the system",
            "detected_count": 0,
            "recognized_count": 0,
            "recognized": [],
            "data": None,
        }), 200

    # Run face recognition on frame
    try:
        rec_result = face_service.recognize_all_students(
            image,
            registered_students,
            SIMILARITY_THRESHOLD,
        )
    except (cv2.error, ValueError):
        return jsonify({
            "success": False,
            "message": "Face recognition processing error",
            "status": "recognition_failed",
        }), 400

    detected_count = rec_result.get("detected_count", 0)
    matches = rec_result.get("matches", [])

    if detected_count == 0:
        return jsonify({
            "success": True,
            "status": "no_face",
            "message": "No face detected in frame",
            "detected_count": 0,
            "recognized_count": 0,
            "recognized": [],
            "data": None,
        }), 200

    if not matches:
        return jsonify({
            "success": True,
            "status": "not_recognized",
            "message": "Face detected but not recognized as a registered student",
            "detected_count": detected_count,
            "recognized_count": 0,
            "recognized": [],
            "data": None,
        }), 200

    # Process all recognized matches
    recognized_records = []
    for match in matches:
        student_id = match["student_id"]
        confidence_score = match["similarity_score"]

        record, message = mark_face_attendance(
            session_id=session_id,
            student_id=student_id,
            confidence_score=confidence_score,
            faculty_id=faculty.faculty_id,
        )

        student = db.session.get(Student, student_id)
        student_name = student.user.name if (student and student.user) else f"Student #{student_id}"
        enrollment_no = student.enrollment_no if student else "N/A"

        if record:
            recognized_records.append({
                "attendance_id": record.attendance_id,
                "session_id": record.session_id,
                "student_id": record.student_id,
                "name": student_name,
                "student_name": student_name,
                "enrollment_no": enrollment_no,
                "status": record.status,
                "confidence_score": record.confidence_score,
                "recognition_method": record.recognition_method,
                "marked_at": record.marked_at.isoformat() if record.marked_at else None,
                "is_new": (message == "Attendance marked successfully"),
                "is_eligible": True,
                "message": message,
            })
        else:
            current_app.logger.warning(
                "Rejected attendance attempt for student %s in session %s: %s",
                student_id,
                session_id,
                message,
            )
            recognized_records.append({
                "attendance_id": None,
                "session_id": session.session_id,
                "student_id": student_id,
                "name": student_name,
                "student_name": student_name,
                "enrollment_no": enrollment_no,
                "status": "INELIGIBLE",
                "confidence_score": confidence_score,
                "recognition_method": "FACE",
                "marked_at": None,
                "is_new": False,
                "is_eligible": False,
                "message": message,
            })

    primary_record = recognized_records[0] if recognized_records else None
    new_marked_count = sum(1 for r in recognized_records if r.get("is_new"))

    if new_marked_count > 0:
        overall_message = f"Attendance marked for {new_marked_count} student(s)"
    elif recognized_records:
        overall_message = recognized_records[0]["message"]
    else:
        overall_message = "No eligible student marked"

    return jsonify({
        "success": True,
        "status": "recognized",
        "message": overall_message,
        "detected_count": detected_count,
        "recognized_count": len(recognized_records),
        "recognized": recognized_records,
        "data": primary_record,
    }), 200