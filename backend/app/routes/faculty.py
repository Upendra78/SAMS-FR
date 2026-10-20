from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db, bcrypt
from app.models import Faculty, CourseOffering, Enrollment, User, Department
from app.utils.auth import faculty_required, faculty_or_admin_required


faculty_bp = Blueprint(
    "faculty",
    __name__,
    url_prefix="/api/faculty",
)


def get_current_faculty():
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None

    return Faculty.query.filter_by(user_id=user_id).first()


def serialize_faculty_profile(faculty):
    return {
        "faculty_id": faculty.faculty_id,
        "user_id": faculty.user_id,
        "name": faculty.user.name,
        "email": faculty.user.email,
        "employee_id": faculty.employee_id,
        "designation": faculty.designation,
        "phone": faculty.phone or "",
        "gender": faculty.gender or "",
        "date_of_birth": faculty.date_of_birth or "",
        "date_of_joining": faculty.date_of_joining or "",
        "employment_status": faculty.employment_status or "Permanent",
        "qualification": faculty.qualification or "",
        "specialization": faculty.specialization or "",
        "office_cabin": faculty.office_cabin or "",
        "address": faculty.address or "",
        "city": faculty.city or "",
        "state": faculty.state or "",
        "pin_code": faculty.pin_code or "",
        "country": faculty.country or "India",
        "account_status": "Active" if getattr(faculty.user, "is_active", True) else "Inactive",
        "department": {
            "department_id": faculty.department.department_id if faculty.department else None,
            "department_name": faculty.department.department_name if faculty.department else "Department",
            "department_code": faculty.department.department_code if faculty.department else "N/A",
        },
    }


@faculty_bp.get("/dashboard")
@faculty_or_admin_required
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
@faculty_or_admin_required
def get_faculty_profile():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found. Please contact administration.",
        }), 404

    return jsonify({
        "success": True,
        "data": serialize_faculty_profile(faculty),
    }), 200


# ============================================================
# UPDATE FACULTY PROFILE
# ============================================================

@faculty_bp.patch("/profile")
@faculty_or_admin_required
def update_faculty_profile():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found. Please contact administration.",
        }), 404

    data = request.get_json(silent=True) or {}

    # Basic User fields
    name = data.get("name")
    email = data.get("email")

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
            User.query
            .filter(
                User.email == email,
                User.user_id != faculty.user_id,
            )
            .first()
        )
        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email is already in use",
            }), 409

        faculty.user.email = email

    # Profile & Academic fields
    if "designation" in data and data["designation"] is not None:
        faculty.designation = str(data["designation"]).strip()

    if "phone" in data:
        faculty.phone = str(data["phone"]).strip() if data["phone"] is not None else None

    if "gender" in data:
        faculty.gender = str(data["gender"]).strip() if data["gender"] is not None else None

    if "date_of_birth" in data:
        faculty.date_of_birth = str(data["date_of_birth"]).strip() if data["date_of_birth"] is not None else None

    if "date_of_joining" in data:
        faculty.date_of_joining = str(data["date_of_joining"]).strip() if data["date_of_joining"] is not None else None

    if "employment_status" in data:
        faculty.employment_status = str(data["employment_status"]).strip() if data["employment_status"] is not None else "Permanent"

    if "qualification" in data:
        faculty.qualification = str(data["qualification"]).strip() if data["qualification"] is not None else None

    if "specialization" in data:
        faculty.specialization = str(data["specialization"]).strip() if data["specialization"] is not None else None

    if "office_cabin" in data:
        faculty.office_cabin = str(data["office_cabin"]).strip() if data["office_cabin"] is not None else None

    # Location & Contact fields
    if "address" in data:
        faculty.address = str(data["address"]).strip() if data["address"] is not None else None

    if "city" in data:
        faculty.city = str(data["city"]).strip() if data["city"] is not None else None

    if "state" in data:
        faculty.state = str(data["state"]).strip() if data["state"] is not None else None

    if "pin_code" in data:
        faculty.pin_code = str(data["pin_code"]).strip() if data["pin_code"] is not None else None

    if "country" in data:
        faculty.country = str(data["country"]).strip() if data["country"] is not None else "India"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Faculty profile updated successfully",
        "data": serialize_faculty_profile(faculty),
    }), 200


# ============================================================
# CHANGE FACULTY PASSWORD
# ============================================================

@faculty_bp.post("/change-password")
@faculty_or_admin_required
def change_faculty_password():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found. Please contact administration.",
        }), 404

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not current_password or not new_password:
        return jsonify({
            "success": False,
            "message": "Current password and new password are required",
        }), 400

    if len(str(new_password)) < 6:
        return jsonify({
            "success": False,
            "message": "New password must be at least 6 characters",
        }), 400

    if confirm_password and str(new_password) != str(confirm_password):
        return jsonify({
            "success": False,
            "message": "New password and confirmation do not match",
        }), 400

    if not bcrypt.check_password_hash(faculty.user.password_hash, str(current_password)):
        return jsonify({
            "success": False,
            "message": "Current password is incorrect",
        }), 400

    faculty.user.password_hash = bcrypt.generate_password_hash(str(new_password)).decode("utf-8")
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password changed successfully",
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
            "message": "Faculty profile not found. Please contact administration.",
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
            "message": "Faculty profile not found. Please contact administration.",
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
            "message": "Faculty profile not found. Please contact administration.",
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
