from flask import Blueprint, jsonify, request


from app.extensions import db
from app.models import Enrollment, Student, CourseOffering
from app.utils.auth import admin_required

enrollment_bp = Blueprint(
    "enrollment",
    __name__,
    url_prefix="/api",
)


@enrollment_bp.post("/admin/enrollments")
@admin_required
def create_enrollment():
    data = request.get_json(silent=True) or {}

    student_id = data.get("student_id")
    offering_id = data.get("offering_id")

    if not student_id or not offering_id:
        return jsonify({
            "success": False,
            "message": "student_id and offering_id are required",
        }), 400

    student = db.session.get(Student, student_id)

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    offering = db.session.get(
        CourseOffering,
        offering_id,
    )

    if not offering:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    existing = Enrollment.query.filter_by(
        student_id=student_id,
        offering_id=offering_id,
    ).first()

    if existing:
        return jsonify({
            "success": False,
            "message": "Student is already enrolled in this course",
        }), 409

    enrollment = Enrollment(
        student_id=student_id,
        offering_id=offering_id,
        status="ACTIVE",
    )

    db.session.add(enrollment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student enrolled successfully",
        "data": {
            "enrollment_id": enrollment.enrollment_id,
            "student_id": enrollment.student_id,
            "offering_id": enrollment.offering_id,
            "status": enrollment.status,
            "enrolled_at": enrollment.enrolled_at.isoformat(),
        },
    }), 201


@enrollment_bp.get("/admin/enrollments")
@admin_required
def get_enrollments():
    enrollments = (
        Enrollment.query
        .order_by(Enrollment.enrollment_id.asc())
        .all()
    )

    data = [
        {
            "enrollment_id": enrollment.enrollment_id,
            "student_id": enrollment.student_id,
            "offering_id": enrollment.offering_id,
            "status": enrollment.status,
            "enrolled_at": enrollment.enrolled_at.isoformat(),
        }
        for enrollment in enrollments
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@enrollment_bp.delete("/admin/enrollments/<int:enrollment_id>")
@admin_required
def delete_enrollment(enrollment_id):
    enrollment = db.session.get(
        Enrollment,
        enrollment_id,
    )

    if not enrollment:
        return jsonify({
            "success": False,
            "message": "Enrollment not found",
        }), 404

    db.session.delete(enrollment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Enrollment removed successfully",
    }), 200
