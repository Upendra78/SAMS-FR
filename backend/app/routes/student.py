from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from app.models import Student, Enrollment
from app.utils.auth import student_required


student_bp = Blueprint(
    "student",
    __name__,
    url_prefix="/api/student",
)


def get_current_student():
    user_id = int(get_jwt_identity())

    return Student.query.filter_by(
        user_id=user_id
    ).first()


# ============================================================
# STUDENT DASHBOARD
# ============================================================

@student_bp.get("/dashboard")
@student_required
def student_dashboard():
    return jsonify({
        "success": True,
        "message": "Student access granted",
        "data": {
            "role": "STUDENT",
        },
    }), 200


# ============================================================
# STUDENT PROFILE
# ============================================================

@student_bp.get("/profile")
@student_required
def get_student_profile():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "student_id": student.student_id,
            "user_id": student.user_id,
            "name": student.user.name,
            "email": student.user.email,
            "enrollment_no": student.enrollment_no,
            "semester": student.semester,
            "section": student.section,
            "academic_year": student.academic_year,
            "department": {
                "department_id": student.department.department_id,
                "department_name": student.department.department_name,
                "department_code": student.department.department_code,
            },
        },
    }), 200


# ============================================================
# STUDENT COURSES
# ============================================================

@student_bp.get("/courses")
@student_required
def get_student_courses():
    student = get_current_student()

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
            "credits": course.credits,
            "semester": offering.semester,
            "section": offering.section,
            "academic_year": offering.academic_year,
            "room": offering.room,
            "faculty": {
                "faculty_id": offering.faculty.faculty_id,
                "name": offering.faculty.user.name,
                "employee_id": offering.faculty.employee_id,
                "designation": offering.faculty.designation,
            },
        })

    return jsonify({
        "success": True,
        "data": data,
    }), 200