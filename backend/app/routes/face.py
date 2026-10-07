import cv2
import numpy as np

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import FaceProfile, Student
from app.services.face_service import FaceService
from app.utils.auth import admin_required


face_bp = Blueprint(
    "face",
    __name__,
    url_prefix="/api/face",
)


face_service = FaceService()

FACE_MODEL_VERSION = "sface_2021dec"


def _decode_image(file_storage):
    """Decode an uploaded image into an OpenCV BGR image."""
    if file_storage is None:
        return None

    image_bytes = file_storage.read()

    if not image_bytes:
        return None

    buffer = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    return cv2.imdecode(
        buffer,
        cv2.IMREAD_COLOR,
    )


@face_bp.post("/enroll")
@admin_required
def enroll_face():
    """Enroll or replace a student's face profile."""

    student_id = request.form.get("student_id")

    if not student_id:
        return jsonify({
            "success": False,
            "message": "student_id is required",
        }), 400

    try:
        student_id = int(student_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "student_id must be an integer",
        }), 400

    student = db.session.get(Student, student_id)

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    image_file = request.files.get("image")

    if image_file is None:
        return jsonify({
            "success": False,
            "message": "image is required",
        }), 400

    image = _decode_image(image_file)

    if image is None:
        return jsonify({
            "success": False,
            "message": "Invalid image",
        }), 400

    result = face_service.enroll_student(image)

    if result["status"] != "enrolled":
        status_messages = {
            "invalid_image": "Invalid image",
            "no_face": "No face detected",
            "multiple_faces": (
                "Multiple faces detected; exactly one face is required"
            ),
            "encoding_failed": "Face encoding failed",
            "invalid_encoding": "Generated face encoding is invalid",
        }

        return jsonify({
            "success": False,
            "message": status_messages.get(
                result["status"],
                "Face enrollment failed",
            ),
            "status": result["status"],
        }), 400

    encoding = result["encoding"]

    if encoding is None:
        return jsonify({
            "success": False,
            "message": "Face encoding was not generated",
        }), 400

    embedding_bytes = encoding.astype(
        np.float32
    ).tobytes()

    face_profile = FaceProfile.query.filter_by(
        student_id=student_id,
        is_active=True,
    ).first()

    if face_profile:
        face_profile.embedding = embedding_bytes
        face_profile.model_version = FACE_MODEL_VERSION
    else:
        face_profile = FaceProfile(
            student_id=student_id,
            embedding=embedding_bytes,
            model_version=FACE_MODEL_VERSION,
            is_active=True,
        )

        db.session.add(face_profile)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Face enrolled successfully",
        "data": {
            "student_id": student.student_id,
            "face_id": face_profile.face_id,
            "model_version": face_profile.model_version,
            "status": "enrolled",
        },
    }), 201

@face_bp.get("/status/<int:student_id>")
@admin_required
def face_registration_status(student_id):
    """Return the active face registration status for a studnet."""
    student = db.session.get(Student, student_id)

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }),404

    face_profile = FaceProfile.query.filter_by(
        student_id  = student_id,
        is_active = True,
    ).first()
    if face_profile:
        return jsonify({
            "success": True,
            "data":{
                "student_id": student.student_id,
                "registered": True,
                "status": "registered",
                "model_version": face_profile.model_version,
            },

        }),200
    return jsonify({
        "sucess": True,
        "data": {
            "student_id": student.student_id,
            "registered": False,
            "status": "not_registered",
            "model_version": None,
        },
    }), 200