from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError


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

@enrollment_bp.post("/admin/enrollments/bulk")
@admin_required
def bulk_enroll_students():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON object is required",
        }), 400

    offering_id = data.get("offering_id")

    try:
        offering_id = int(offering_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "offering_id must be a valid integer",
        }), 400

    if offering_id < 1:
        return jsonify({
            "success": False,
            "message": "offering_id must be greater than 0",
        }), 400

    offering = db.session.get(CourseOffering, offering_id)

    if not offering:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    # Find active students eligible for this offering.
    eligible_students = (
        Student.query
        .join(Student.user)
        .filter(
            Student.department_id == offering.course.department_id,
            Student.semester == offering.semester,
            Student.section == offering.section,
            db.func.replace(Student.academic_year, " ", "")
            == db.func.replace(offering.academic_year, " ", ""),
            Student.user.has(is_active=True),
        )
        .order_by(Student.student_id.asc())
        .all()
    )

    if not eligible_students:
        return jsonify({
            "success": True,
            "message": "No eligible students were found",
            "data": {
                "offering_id": offering.offering_id,
                "eligible_students": 0,
                "created": 0,
                "already_enrolled": 0,
            },
        }), 200

    student_ids = [
        student.student_id
        for student in eligible_students
    ]

    # Identify existing enrollments before inserting.
    existing_student_ids = set(
        db.session.scalars(
            select(Enrollment.student_id).where(
                Enrollment.offering_id == offering_id,
                Enrollment.student_id.in_(student_ids),
            )
        ).all()
    )

    new_student_ids = [
        student_id
        for student_id in student_ids
        if student_id not in existing_student_ids
    ]

    if not new_student_ids:
        return jsonify({
            "success": True,
            "message": "All eligible students are already enrolled",
            "data": {
                "offering_id": offering.offering_id,
                "eligible_students": len(student_ids),
                "created": 0,
                "already_enrolled": len(existing_student_ids),
            },
        }), 200

    enrollment_rows = [
        {
            "student_id": student_id,
            "offering_id": offering_id,
            "status": "ACTIVE",
        }
        for student_id in new_student_ids
    ]

    try:
        # Insert many records without creating one ORM object per row.
        db.session.execute(
            db.insert(Enrollment),
            enrollment_rows,
        )
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Bulk enrollment conflicted with a database constraint. "
                "No changes from this transaction were committed."
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Bulk enrollment failed",
        }), 500

    return jsonify({
        "success": True,
        "message": "Bulk enrollment completed successfully",
        "data": {
            "offering_id": offering.offering_id,
            "eligible_students": len(student_ids),
            "created": len(new_student_ids),
            "already_enrolled": len(existing_student_ids),
        },
    }), 201

@enrollment_bp.get("/student/courses")
@student_required
def get_student_courses():
    user_id = int(get_jwt_identity())

    student = Student.query.filter_by(
        user_id=user_id
    ).first()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    enrollments = (
        Enrollment.query
        .filter_by(
            student_id=student.student_id,
            status="ACTIVE",
        )
        .all()
    )

    data = []

    for enrollment in enrollments:
        offering = enrollment.offering
        course = offering.course

        data.append({
            "enrollment_id": enrollment.enrollment_id,
            "offering_id": offering.offering_id,
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "semester": offering.semester,
            "section": offering.section,
            "academic_year": offering.academic_year,
            "room": offering.room,
        })

    return jsonify({
        "success": True,
        "data": data,
    }), 200
