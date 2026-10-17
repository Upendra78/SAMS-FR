from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Faculty, CourseOffering, Enrollment
from app.utils.auth import faculty_required


faculty_bp = Blueprint(
    "faculty",
    __name__,
    url_prefix="/api/faculty",
)


def get_current_faculty():
    user_id = int(get_jwt_identity())

    return Faculty.query.filter_by(
        user_id=user_id
    ).first()


@faculty_bp.get("/dashboard")
@faculty_required
def faculty_dashboard():
    return jsonify({
        "success": True,
        "message": "Faculty access granted",
        "data": {
            "role": "FACULTY",
        },
    }), 200


# ============================================================
# GET FACULTY PROFILE
# ============================================================

@faculty_bp.get("/profile")
@faculty_required
def get_faculty_profile():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "faculty_id": faculty.faculty_id,
            "user_id": faculty.user_id,
            "name": faculty.user.name,
            "email": faculty.user.email,
            "employee_id": faculty.employee_id,
            "designation": faculty.designation,
            "department": {
                "department_id": faculty.department.department_id,
                "department_name": faculty.department.department_name,
                "department_code": faculty.department.department_code,
            },
        },
    }), 200


# ============================================================
# UPDATE FACULTY PROFILE
# ============================================================

@faculty_bp.patch("/profile")
@faculty_required
def update_faculty_profile():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    designation = data.get("designation")

    if name is not None:
        name = str(name).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Name cannot be empty",
            }), 400

        faculty.user.name = name

    if email is not None:
        email = str(email).strip().lower()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email cannot be empty",
            }), 400

        existing_user = (
            faculty.user.__class__.query
            .filter(
                faculty.user.__class__.email == email,
                faculty.user.__class__.user_id != faculty.user_id,
            )
            .first()
        )

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email is already in use",
            }), 409

        faculty.user.email = email

    if designation is not None:
        designation = str(designation).strip()

        if not designation:
            return jsonify({
                "success": False,
                "message": "Designation cannot be empty",
            }), 400

        faculty.designation = designation

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Faculty profile updated successfully",
        "data": {
            "faculty_id": faculty.faculty_id,
            "user_id": faculty.user_id,
            "name": faculty.user.name,
            "email": faculty.user.email,
            "employee_id": faculty.employee_id,
            "designation": faculty.designation,
            "department": {
                "department_id": faculty.department.department_id,
                "department_name": faculty.department.department_name,
                "department_code": faculty.department.department_code,
            },
        },
    }), 200

# ============================================================
# GET FACULTY COURSES
# ============================================================

@faculty_bp.get("/courses")
@faculty_required
def get_faculty_courses():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    offerings = (
        CourseOffering.query
        .filter_by(faculty_id=faculty.faculty_id)
        .order_by(CourseOffering.offering_id.asc())
        .all()
    )

    data = []

    for offering in offerings:
        data.append({
            "offering_id": offering.offering_id,
            "course_id": offering.course_id,
            "course_code": offering.course.course_code,
            "course_name": offering.course.course_name,
            "credits": offering.course.credits,
            "semester": offering.semester,
            "section": offering.section,
            "academic_year": offering.academic_year,
            "room": offering.room,
        })

    return jsonify({
        "success": True,
        "data": data,
    }), 200


# ============================================================
# GET FACULTY COURSE DETAILS
# ============================================================

@faculty_bp.get("/courses/<int:course_id>")
@faculty_required
def get_faculty_course(course_id):
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    offerings = (
        CourseOffering.query
        .filter_by(
            faculty_id=faculty.faculty_id,
            course_id=course_id,
        )
        .order_by(CourseOffering.offering_id.asc())
        .all()
    )

    if not offerings:
        return jsonify({
            "success": False,
            "message": "Course not found for this faculty",
        }), 404

    course = offerings[0].course
    offering_data = []

    for offering in offerings:
        active_enrollments = (
            Enrollment.query
            .filter_by(
                offering_id=offering.offering_id,
                status="ACTIVE",
            )
            .order_by(Enrollment.student_id.asc())
            .all()
        )

        students = []

        for enrollment in active_enrollments:
            student = enrollment.student

            students.append({
                "student_id": student.student_id,
                "enrollment_no": student.enrollment_no,
                "name": student.user.name,
                "email": student.user.email,
                "semester": student.semester,
                "section": student.section,
                "academic_year": student.academic_year,
                "enrollment_status": enrollment.status,
            })

        offering_data.append({
            "offering_id": offering.offering_id,
            "semester": offering.semester,
            "section": offering.section,
            "academic_year": offering.academic_year,
            "room": offering.room,
            "student_count": len(students),
            "students": students,
        })

    return jsonify({
        "success": True,
        "data": {
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "credits": course.credits,
            "offerings": offering_data,
        },
    }), 200


# ============================================================
# GET FACULTY STUDENTS
# ============================================================

@faculty_bp.get("/students")
@faculty_required
def get_faculty_students():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    offering_id_filter = request.args.get("offering_id", type=int)

    query = (
        Enrollment.query
        .join(CourseOffering, Enrollment.offering_id == CourseOffering.offering_id)
        .filter(CourseOffering.faculty_id == faculty.faculty_id)
    )

    if offering_id_filter:
        query = query.filter(Enrollment.offering_id == offering_id_filter)

    enrollments = query.all()

    students = {}

    for enrollment in enrollments:
        student = enrollment.student
        has_face = any(fp.is_active for fp in student.face_profiles)

        if student.student_id in students:
            if enrollment.offering_id not in students[student.student_id]["offering_ids"]:
                students[student.student_id]["offering_ids"].append(enrollment.offering_id)
            continue

        students[student.student_id] = {
            "student_id": student.student_id,
            "user_id": student.user_id,
            "name": student.user.name,
            "email": student.user.email,
            "enrollment_no": student.enrollment_no,
            "semester": student.semester,
            "section": student.section,
            "academic_year": student.academic_year,
            "offering_id": enrollment.offering_id,
            "offering_ids": [enrollment.offering_id],
            "has_face_profile": has_face,
            "face_registered": has_face,
            "department": {
                "department_id": student.department.department_id,
                "department_name": student.department.department_name,
                "department_code": student.department.department_code,
            },
        }

    return jsonify({
        "success": True,
        "data": list(students.values()),
    }), 200
