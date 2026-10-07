from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import FaceProfile, Student
from app.utils.auth import admin_required, student_required


face_profile_bp = Blueprint(
    "face_profile",
    __name__,
    url_prefix="/api",
)


def get_current_student():
    user_id = int(get_jwt_identity())

    return Student.query.filter_by(
        user_id=user_id
    ).first()


@face_profile_bp.post("/student/face-profile")
@student_required
def create_face_profile():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    data = request.get_json(silent=True) or {}

    embedding = data.get("embedding")
    model_version = data.get("model_version")

    if not embedding:
        return jsonify({
            "success": False,
            "message": "embedding is required",
        }), 400

    if not model_version:
        return jsonify({
            "success": False,
            "message": "model_version is required",
        }), 400

    if not isinstance(embedding, list):
        return jsonify({
            "success": False,
            "message": "embedding must be a list",
        }), 400

    if not embedding:
        return jsonify({
            "success": False,
            "message": "embedding cannot be empty",
        }), 400

    try:
        embedding_bytes = ",".join(
            str(float(value))
            for value in embedding
        ).encode("utf-8")
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "embedding must contain numeric values",
        }), 400

    existing_profile = FaceProfile.query.filter_by(
        student_id=student.student_id,
        is_active=True,
    ).first()

    if existing_profile:
        existing_profile.embedding = embedding_bytes
        existing_profile.model_version = model_version.strip()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Face profile updated successfully",
            "data": {
                "face_id": existing_profile.face_id,
                "student_id": existing_profile.student_id,
                "model_version": existing_profile.model_version,
                "is_active": existing_profile.is_active,
            },
        }), 200

    face_profile = FaceProfile(
        student_id=student.student_id,
        embedding=embedding_bytes,
        model_version=model_version.strip(),
        is_active=True,
    )

    db.session.add(face_profile)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Face profile created successfully",
        "data": {
            "face_id": face_profile.face_id,
            "student_id": face_profile.student_id,
            "model_version": face_profile.model_version,
            "is_active": face_profile.is_active,
        },
    }), 201


@face_profile_bp.get("/student/face-profile")
@student_required
def get_my_face_profile():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    profile = FaceProfile.query.filter_by(
        student_id=student.student_id,
        is_active=True,
    ).first()

    if not profile:
        return jsonify({
            "success": False,
            "message": "Face profile not found",
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "face_id": profile.face_id,
            "student_id": profile.student_id,
            "model_version": profile.model_version,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat(),
            "is_active": profile.is_active,
        },
    }), 200


@face_profile_bp.delete("/student/face-profile")
@student_required
def deactivate_my_face_profile():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    profile = FaceProfile.query.filter_by(
        student_id=student.student_id,
        is_active=True,
    ).first()

    if not profile:
        return jsonify({
            "success": False,
            "message": "Face profile not found",
        }), 404

    profile.is_active = False

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Face profile deactivated successfully",
    }), 200


@face_profile_bp.get("/admin/face-profiles")
@admin_required
def get_face_profiles():
    profiles = (
        FaceProfile.query
        .order_by(FaceProfile.face_id.asc())
        .all()
    )

    data = [
        {
            "face_id": profile.face_id,
            "student_id": profile.student_id,
            "model_version": profile.model_version,
            "created_at": profile.created_at.isoformat(),
            "updated_at": profile.updated_at.isoformat(),
            "is_active": profile.is_active,
        }
        for profile in profiles
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200