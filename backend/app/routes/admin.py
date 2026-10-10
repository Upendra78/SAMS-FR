from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from sqlalchemy.exc import IntegrityError

from app.extensions import bcrypt, db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    Course,
    CourseOffering,
    Department,
    Enrollment,
    Faculty,
    Student,
    User,
)
from app.services.auth_service import create_user
from app.utils.auth import admin_required


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin",
)

# ADMIN DASHBOARD

@admin_bp.get("/dashboard")
@admin_required
def get_admin_dashboard():
    total_students = Student.query.count()
    total_faculty = Faculty.query.count()
    total_courses = Course.query.count()

    total_attendance_records = AttendanceRecord.query.count()

    present_count = AttendanceRecord.query.filter_by(
        status="PRESENT"
    ).count()

    absent_count = AttendanceRecord.query.filter_by(
        status="ABSENT"
    ).count()

    return jsonify({
        "success": True,
        "data": {
            "total_students": total_students,
            "total_faculty": total_faculty,
            "total_courses": total_courses,
            "attendance_summary": {
                "present": present_count,
                "absent": absent_count,
                "total_records": total_attendance_records,
            },
        },
    }), 200

# ADMIN PROFILE

@admin_bp.get("/profile")
@admin_required
def get_admin_profile():
    user_id = get_jwt_identity()

    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "message": "Admin user not found",
        }), 404

    if user.role != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Access forbidden",
        }), 403

    return jsonify({
        "success": True,
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
    }), 200


@admin_bp.patch("/profile")
@admin_required
def update_admin_profile():
    user_id = get_jwt_identity()

    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "message": "Admin user not found",
        }), 404

    if user.role != "ADMIN":
        return jsonify({
            "success": False,
            "message": "Access forbidden",
        }), 403

    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({
            "success": False,
            "message": "No fields provided for update",
        }), 400

    forbidden_fields = {"role", "user_id", "password"}

    if forbidden_fields.intersection(data.keys()):
        return jsonify({
            "success": False,
            "message": "Role, user_id and password cannot be updated through admin profile",
        }), 400

    # -------------------------
    # Name
    # -------------------------

    if "name" in data:
        name = str(data["name"]).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Name cannot be empty",
            }), 400

        user.name = name

    # -------------------------
    # Email
    # -------------------------

    if "email" in data:
        email = str(data["email"]).lower().strip()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email cannot be empty",
            }), 400

        existing_user = User.query.filter(
            User.email == email,
            User.user_id != user.user_id,
        ).first()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already exists",
            }), 409

        user.email = email

    # -------------------------
    # Password
    # -------------------------

    if "password" in data:
        password = str(data["password"])

        if len(password) < 8:
            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters",
            }), 400

        user.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    # Role is intentionally not
    # accepted here.

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Admin profile could not be updated "
                "because of a database constraint"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Admin profile could not be updated",
        }), 500

    db.session.refresh(user)

    return jsonify({
        "success": True,
        "message": "Admin profile updated successfully",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
    }), 200

# ============================================================
# DEPARTMENT MANAGEMENT
# ============================================================

@admin_bp.get("/departments")
@admin_required
def get_departments():
    departments = Department.query.order_by(
        Department.department_id.asc()
    ).all()

    data = [
        {
            "department_id": department.department_id,
            "department_name": department.department_name,
            "department_code": department.department_code,
        }
        for department in departments
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200

# USER MANAGEMENT

@admin_bp.get("/users")
@admin_required
def get_users():
    users = User.query.order_by(
        User.user_id.asc()
    ).all()

    data = [
        {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }
        for user in users
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@admin_bp.post("/users")
@admin_required
def create_admin_user():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([name, email, password, role]):
        return jsonify({
            "success": False,
            "message": (
                "Name, email, password and role are required"
            ),
        }), 400

    role = role.upper().strip()

    if role not in {"ADMIN", "FACULTY", "STUDENT"}:
        return jsonify({
            "success": False,
            "message": "Invalid role",
        }), 400

    email = email.lower().strip()

    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "message": "Email already exists",
        }), 409

    user = create_user(
        name=name.strip(),
        email=email,
        password=password,
        role=role,
    )

    return jsonify({
        "success": True,
        "message": "User created successfully",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    }), 201


@admin_bp.get("/users/<int:user_id>")
@admin_required
def get_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
    }), 200


@admin_bp.patch("/users/<int:user_id>")
@admin_required
def update_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    data = request.get_json(silent=True) or {}

    if "is_active" in data:
        is_active = data["is_active"]

        if not isinstance(is_active, bool):
            return jsonify({
                "success": False,
                "message": "is_active must be a boolean",
            }), 400

        user.is_active = is_active

    if "name" in data:
        name = str(data["name"]).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Name cannot be empty",
            }), 400

        user.name = name

    if "email" in data:
        email = str(data["email"]).lower().strip()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email cannot be empty",
            }), 400

        existing_user = User.query.filter(
            User.email == email,
            User.user_id != user_id,
        ).first()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already exists",
            }), 409

        user.email = email

    if "role" in data:
        role = str(data["role"]).upper().strip()

        if role not in {"ADMIN", "FACULTY", "STUDENT"}:
            return jsonify({
                "success": False,
                "message": "Invalid role",
            }), 400

        user.role = role

    if "password" in data:
        password = str(data["password"])

        if len(password) < 8:
            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters",
            }), 400

        user.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "User could not be updated because of a database constraint",
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "User could not be updated",
        }), 500

    return jsonify({
        "success": True,
        "message": "User updated successfully",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "is_active": user.is_active,
        },
    }), 200


@admin_bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    try:
        db.session.delete(user)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "User cannot be deleted because related records exist",
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "User could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "User deleted successfully",
    }), 200
def get_student_attendance_summary(student_id):
    active_enrollments = Enrollment.query.filter_by(
        student_id=student_id,
        status="ACTIVE",
    ).all()

    offering_ids = [
        enrollment.offering_id
        for enrollment in active_enrollments
    ]

    closed_sessions = []

    if offering_ids:
        closed_sessions = AttendanceSession.query.filter(
            AttendanceSession.offering_id.in_(offering_ids),
            AttendanceSession.status == "CLOSED",
        ).all()

    session_ids = [
        session.session_id
        for session in closed_sessions
    ]

    total_sessions = len(session_ids)
    present_sessions = 0

    if session_ids:
        present_sessions = AttendanceRecord.query.filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id.in_(session_ids),
            AttendanceRecord.status == "PRESENT",
        ).count()

    absent_sessions = total_sessions - present_sessions

    attendance_percentage = (
        (present_sessions / total_sessions) * 100
        if total_sessions > 0
        else 0.0
    )

    return {
        "total_sessions": total_sessions,
        "present_sessions": present_sessions,
        "absent_sessions": absent_sessions,
        "attendance_percentage": round(
            attendance_percentage, 2
        ),
    }
# ============================================================
# STUDENT MANAGEMENT
# ============================================================

@admin_bp.get("/students")
@admin_required
def get_students():
    students = (
        Student.query
        .join(Student.user)
        .join(Student.department)
        .order_by(Student.student_id.asc())
        .all()
    )

    data = [
        {
            "student_id": student.student_id,
            "user_id": student.user_id,
            "name": student.user.name,
            "email": student.user.email,
            "enrollment_no": student.enrollment_no,
            "semester": student.semester,
            "section": student.section,
            "academic_year": student.academic_year,
            "department_id": student.department.department_id,
            "department_name": student.department.department_name,
            "department_code": student.department.department_code,
            "attendance_summary": get_student_attendance_summary(
                student.student_id
            ),
        }
        for student in students
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@admin_bp.get("/students/<int:student_id>")
@admin_required
def get_student(student_id):
    student = (
        Student.query
        .join(Student.user)
        .join(Student.department)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
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
            "department_id": student.department.department_id,
            "department_name": student.department.department_name,
            "department_code": student.department.department_code,
            "attendance_summary": get_student_attendance_summary(student.student_id),
        },
    }), 200


@admin_bp.post("/students")
@admin_required
def create_student():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    enrollment_no = str(
        data.get("enrollment_no", "")
    ).strip()
    section = str(
        data.get("section", "")
    ).strip()
    academic_year = str(
        data.get("academic_year", "")
    ).strip()

    semester = data.get("semester")
    department_id = data.get("department_id")

    # -------------------------
    # Required fields
    # -------------------------

    if (
        user_id is None
        or not enrollment_no
        or not section
        or not academic_year
        or semester is None
        or department_id is None
    ):
        return jsonify({
            "success": False,
            "message": (
                "user_id, enrollment_no, semester, section, "
                "academic_year and department_id are required"
            ),
        }), 400

    # -------------------------
    # User ID validation
    # -------------------------

    try:
        user_id = int(user_id)

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "User ID must be an integer",
        }), 400

    # -------------------------
    # Semester validation
    # -------------------------

    try:
        semester = int(semester)

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Semester must be an integer",
        }), 400

    if semester < 1:
        return jsonify({
            "success": False,
            "message": "Semester must be greater than 0",
        }), 400

    # -------------------------
    # Department ID validation
    # -------------------------

    try:
        department_id = int(department_id)

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Department ID must be an integer",
        }), 400

    # -------------------------
    # Existing User validation
    # -------------------------

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    if user.role != "STUDENT":
        return jsonify({
            "success": False,
            "message": "User role must be STUDENT",
        }), 400

    # -------------------------
    # Existing Student profile
    # -------------------------

    existing_student_profile = Student.query.filter_by(
        user_id=user_id
    ).first()

    if existing_student_profile:
        return jsonify({
            "success": False,
            "message": "Student profile already exists for this user",
        }), 409

    # -------------------------
    # Duplicate enrollment
    # -------------------------

    existing_student = Student.query.filter_by(
        enrollment_no=enrollment_no
    ).first()

    if existing_student:
        return jsonify({
            "success": False,
            "message": "Enrollment number already exists",
        }), 409

    # -------------------------
    # Department
    # -------------------------

    department = db.session.get(
        Department,
        department_id,
    )

    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found",
        }), 404

    # -------------------------
    # Create Student profile
    # -------------------------

    student = Student(
        user_id=user.user_id,
        department_id=department.department_id,
        enrollment_no=enrollment_no,
        semester=semester,
        section=section,
        academic_year=academic_year,
    )

    try:
        db.session.add(student)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Student could not be created because "
                "of a duplicate or database constraint"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be created",
        }), 500

    db.session.refresh(student)

    return jsonify({
        "success": True,
        "message": "Student profile created successfully",
        "data": {
            "student_id": student.student_id,
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "enrollment_no": student.enrollment_no,
            "semester": student.semester,
            "section": student.section,
            "academic_year": student.academic_year,
            "department_id": department.department_id,
            "department_name": department.department_name,
            "department_code": department.department_code,
        },
    }), 201


@admin_bp.patch("/students/<int:student_id>")
@admin_required
def update_student(student_id):
    student = (
        Student.query
        .join(Student.user)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({
            "success": False,
            "message": "No fields provided for update",
        }), 400

    # -------------------------
    # User fields are forbidden
    # -------------------------

    forbidden_fields = {
        "name",
        "email",
        "password",
        "role",
        "user_id",
    }

    supplied_forbidden_fields = (
        forbidden_fields.intersection(data.keys())
    )

    if supplied_forbidden_fields:
        return jsonify({
            "success": False,
            "message": (
                "User fields cannot be updated through the "
                "student profile API. Use /api/admin/users/<user_id>"
            ),
            "fields": sorted(supplied_forbidden_fields),
        }), 400

    # -------------------------
    # Enrollment number
    # -------------------------

    if "enrollment_no" in data:
        enrollment_no = str(
            data["enrollment_no"]
        ).strip()

        if not enrollment_no:
            return jsonify({
                "success": False,
                "message": "Enrollment number cannot be empty",
            }), 400

        existing_student = Student.query.filter(
            Student.enrollment_no == enrollment_no,
            Student.student_id != student_id,
        ).first()

        if existing_student:
            return jsonify({
                "success": False,
                "message": "Enrollment number already exists",
            }), 409

        student.enrollment_no = enrollment_no

    # -------------------------
    # Semester
    # -------------------------

    if "semester" in data:
        try:
            semester = int(data["semester"])

        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Semester must be an integer",
            }), 400

        if semester < 1:
            return jsonify({
                "success": False,
                "message": "Semester must be greater than 0",
            }), 400

        student.semester = semester

    # -------------------------
    # Section
    # -------------------------

    if "section" in data:
        section = str(
            data["section"]
        ).strip()

        if not section:
            return jsonify({
                "success": False,
                "message": "Section cannot be empty",
            }), 400

        student.section = section

    # -------------------------
    # Academic year
    # -------------------------

    if "academic_year" in data:
        academic_year = str(
            data["academic_year"]
        ).strip()

        if not academic_year:
            return jsonify({
                "success": False,
                "message": "Academic year cannot be empty",
            }), 400

        student.academic_year = academic_year

    # -------------------------
    # Department
    # -------------------------

    if "department_id" in data:
        try:
            department_id = int(
                data["department_id"]
            )

        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Department ID must be an integer",
            }), 400

        department = db.session.get(
            Department,
            department_id,
        )

        if not department:
            return jsonify({
                "success": False,
                "message": "Department not found",
            }), 404

        student.department_id = department.department_id

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Student could not be updated because "
                "of a duplicate or database constraint"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be updated",
        }), 500

    db.session.refresh(student)

    return jsonify({
        "success": True,
        "message": "Student updated successfully",
        "data": {
            "student_id": student.student_id,
            "user_id": student.user_id,
            "name": student.user.name,
            "email": student.user.email,
            "enrollment_no": student.enrollment_no,
            "semester": student.semester,
            "section": student.section,
            "academic_year": student.academic_year,
            "department_id": student.department.department_id,
            "department_name": student.department.department_name,
            "department_code": student.department.department_code,
        },
    }), 200


@admin_bp.delete("/students/<int:student_id>")
@admin_required
def delete_student(student_id):
    student = Student.query.filter_by(
        student_id=student_id
    ).first()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    # -------------------------
    # Attendance safety check
    # -------------------------

    attendance_count = AttendanceRecord.query.filter_by(
        student_id=student.student_id
    ).count()

    if attendance_count > 0:
        return jsonify({
            "success": False,
            "message": (
                "Student cannot be deleted because "
                "attendance records exist"
            ),
        }), 409

    try:
        # Delete ONLY the Student profile.
        # The linked User account remains.
        db.session.delete(student)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Student could not be deleted because "
                "related records exist"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "Student profile deleted successfully",
        "data": {
            "student_id": student_id,
        },
    }), 200

# COURSE MANAGEMENT


@admin_bp.get("/courses")
@admin_required
def get_courses():
    courses = Course.query.order_by(
        Course.course_id.asc()
    ).all()

    data = [
        {
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "department_id": course.department.department_id,
            "department_name": course.department.department_name,
            "department_code": course.department.department_code,
            "semester": course.semester,
            "credits": course.credits,
        }
        for course in courses
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@admin_bp.get("/courses/<int:course_id>")
@admin_required
def get_course(course_id):
    course = db.session.get(Course, course_id)

    if not course:
        return jsonify({
            "success": False,
            "message": "Course not found",
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "department_id": course.department.department_id,
            "department_name": course.department.department_name,
            "department_code": course.department.department_code,
            "semester": course.semester,
            "credits": course.credits,
        },
    }), 200


@admin_bp.post("/courses")
@admin_required
def create_course():
    data = request.get_json(silent=True) or {}

    course_code = str(data.get("course_code") or "").strip()
    course_name = str(data.get("course_name") or "").strip()
    department_id = data.get("department_id")
    semester = data.get("semester")
    credits = data.get("credits")

    if (
        not course_code
        or not course_name
        or department_id is None
        or semester is None
        or credits is None
    ):
        return jsonify({
            "success": False,
            "message": (
                "course_code, course_name, department_id, "
                "semester and credits are required"
            ),
        }), 400

    try:
        department_id = int(department_id)
        semester = int(semester)
        credits = int(credits)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": (
                "department_id, semester and credits "
                "must be integers"
            ),
        }), 400

    if department_id < 1:
        return jsonify({
            "success": False,
            "message": "Department ID must be greater than 0",
        }), 400

    if semester < 1:
        return jsonify({
            "success": False,
            "message": "Semester must be greater than 0",
        }), 400

    if credits < 1:
        return jsonify({
            "success": False,
            "message": "Credits must be greater than 0",
        }), 400

    if len(course_code) > 30:
        return jsonify({
            "success": False,
            "message": "Course code cannot exceed 30 characters",
        }), 400

    if len(course_name) > 150:
        return jsonify({
            "success": False,
            "message": "Course name cannot exceed 150 characters",
        }), 400

    department = db.session.get(Department, department_id)

    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found",
        }), 404

    existing_course = Course.query.filter_by(
        course_code=course_code
    ).first()

    if existing_course:
        return jsonify({
            "success": False,
            "message": "Course code already exists",
        }), 409

    course = Course(
        course_code=course_code,
        course_name=course_name,
        department_id=department_id,
        semester=semester,
        credits=credits,
    )

    try:
        db.session.add(course)
        db.session.commit()
        db.session.refresh(course)

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course could not be created due to a conflict",
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course could not be created",
        }), 500

    return jsonify({
        "success": True,
        "message": "Course created successfully",
        "data": {
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "department_id": course.department.department_id,
            "department_name": course.department.department_name,
            "department_code": course.department.department_code,
            "semester": course.semester,
            "credits": course.credits,
        },
    }), 201


@admin_bp.patch("/courses/<int:course_id>")
@admin_required
def update_course(course_id):
    course = db.session.get(Course, course_id)

    if not course:
        return jsonify({
            "success": False,
            "message": "Course not found",
        }), 404

    data = request.get_json(silent=True) or {}

    allowed_fields = {
        "course_code",
        "course_name",
        "department_id",
        "semester",
        "credits",
    }

    if not data or not set(data.keys()).issubset(allowed_fields):
        return jsonify({
            "success": False,
            "message": "Provide valid course fields to update",
        }), 400

    if "course_code" in data:
        course_code = str(data.get("course_code") or "").strip()

        if not course_code:
            return jsonify({
                "success": False,
                "message": "Course code cannot be empty",
            }), 400

        if len(course_code) > 30:
            return jsonify({
                "success": False,
                "message": "Course code cannot exceed 30 characters",
            }), 400

        duplicate = Course.query.filter(
            Course.course_code == course_code,
            Course.course_id != course_id,
        ).first()

        if duplicate:
            return jsonify({
                "success": False,
                "message": "Course code already exists",
            }), 409

        course.course_code = course_code

    if "course_name" in data:
        course_name = str(data.get("course_name") or "").strip()

        if not course_name:
            return jsonify({
                "success": False,
                "message": "Course name cannot be empty",
            }), 400

        if len(course_name) > 150:
            return jsonify({
                "success": False,
                "message": "Course name cannot exceed 150 characters",
            }), 400

        course.course_name = course_name

    if "department_id" in data:
        try:
            department_id = int(data["department_id"])
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Department ID must be an integer",
            }), 400

        if department_id < 1:
            return jsonify({
                "success": False,
                "message": "Department ID must be greater than 0",
            }), 400

        department = db.session.get(Department, department_id)

        if not department:
            return jsonify({
                "success": False,
                "message": "Department not found",
            }), 404

        course.department_id = department_id

    for field in ("semester", "credits"):
        if field in data:
            try:
                value = int(data[field])
            except (TypeError, ValueError):
                return jsonify({
                    "success": False,
                    "message": f"{field} must be an integer",
                }), 400

            if value < 1:
                return jsonify({
                    "success": False,
                    "message": f"{field} must be greater than 0",
                }), 400

            setattr(course, field, value)

    try:
        db.session.commit()
        db.session.refresh(course)

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course could not be updated due to a conflict",
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course could not be updated",
        }), 500

    return jsonify({
        "success": True,
        "message": "Course updated successfully",
        "data": {
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "department_id": course.department.department_id,
            "department_name": course.department.department_name,
            "department_code": course.department.department_code,
            "semester": course.semester,
            "credits": course.credits,
        },
    }), 200


@admin_bp.delete("/courses/<int:course_id>")
@admin_required
def delete_course(course_id):
    course = db.session.get(Course, course_id)

    if not course:
        return jsonify({
            "success": False,
            "message": "Course not found",
        }), 404

    offering_count = CourseOffering.query.filter_by(
        course_id=course_id
    ).count()

    if offering_count > 0:
        return jsonify({
            "success": False,
            "message": (
                "Course cannot be deleted because "
                "course offerings exist"
            ),
        }), 409

    try:
        db.session.delete(course)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": (
                "Course cannot be deleted because "
                "related records exist"
            ),
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "Course deleted successfully",
    }), 200


# ============================================================
# COURSE OFFERING MANAGEMENT
# ============================================================

@admin_bp.get("/course-offerings")
@admin_required
def get_course_offerings():
    offerings = (
        CourseOffering.query
        .order_by(CourseOffering.offering_id.asc())
        .all()
    )

    data = [
        {
            "offering_id": offering.offering_id,
            "course_id": offering.course_id,
            "course_code": offering.course.course_code,
            "course_name": offering.course.course_name,
            "faculty_id": offering.faculty_id,
            "faculty_name": offering.faculty.user.name,
            "academic_year": offering.academic_year,
            "semester": offering.semester,
            "section": offering.section,
            "room": offering.room,
            "enrollment_count": len(offering.enrollments),
            "attendance_session_count": len(
                offering.attendance_sessions
            ),
        }
        for offering in offerings
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@admin_bp.post("/course-offerings")
@admin_required
def create_course_offering():
    data = request.get_json(silent=True) or {}

    try:
        course_id = int(data.get("course_id"))
        faculty_id = int(data.get("faculty_id"))
        semester = int(data.get("semester"))
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": (
                "Valid course_id, faculty_id and semester are required"
            ),
        }), 400

    academic_year = str(
        data.get("academic_year") or ""
    ).strip()
    section = str(data.get("section") or "").strip()
    room = str(data.get("room") or "").strip() or None

    if not academic_year or not section or semester < 1:
        return jsonify({
            "success": False,
            "message": (
                "Academic year, section and a valid semester are required"
            ),
        }), 400

    course = db.session.get(Course, course_id)
    faculty = db.session.get(Faculty, faculty_id)

    if not course:
        return jsonify({
            "success": False,
            "message": "Course not found",
        }), 404

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty not found",
        }), 404

    offering = CourseOffering(
        course_id=course_id,
        faculty_id=faculty_id,
        academic_year=academic_year,
        semester=semester,
        section=section,
        room=room,
    )

    try:
        db.session.add(offering)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course offering could not be created due to a data conflict",
        }), 409
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course offering could not be created",
        }), 500

    return jsonify({
        "success": True,
        "message": "Course offering created successfully",
        "data": {
            "offering_id": offering.offering_id,
        },
    }), 201


@admin_bp.patch("/course-offerings/<int:offering_id>")
@admin_required
def update_course_offering(offering_id):
    offering = db.session.get(CourseOffering, offering_id)

    if not offering:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({
            "success": False,
            "message": "No fields provided for update",
        }), 400

    if "course_id" in data:
        try:
            course_id = int(data["course_id"])
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Invalid course_id",
            }), 400

        if not db.session.get(Course, course_id):
            return jsonify({
                "success": False,
                "message": "Course not found",
            }), 404

        offering.course_id = course_id

    if "faculty_id" in data:
        try:
            faculty_id = int(data["faculty_id"])
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Invalid faculty_id",
            }), 400

        if not db.session.get(Faculty, faculty_id):
            return jsonify({
                "success": False,
                "message": "Faculty not found",
            }), 404

        offering.faculty_id = faculty_id

    if "semester" in data:
        try:
            semester = int(data["semester"])
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Invalid semester",
            }), 400

        if semester < 1:
            return jsonify({
                "success": False,
                "message": "Semester must be at least 1",
            }), 400

        offering.semester = semester

    if "academic_year" in data:
        academic_year = str(data["academic_year"] or "").strip()
        if not academic_year:
            return jsonify({
                "success": False,
                "message": "Academic year cannot be empty",
            }), 400
        offering.academic_year = academic_year

    if "section" in data:
        section = str(data["section"] or "").strip()
        if not section:
            return jsonify({
                "success": False,
                "message": "Section cannot be empty",
            }), 400
        offering.section = section

    if "room" in data:
        offering.room = str(data["room"] or "").strip() or None

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course offering could not be updated due to a data conflict",
        }), 409
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course offering could not be updated",
        }), 500

    return jsonify({
        "success": True,
        "message": "Course offering updated successfully",
    }), 200


@admin_bp.delete("/course-offerings/<int:offering_id>")
@admin_required
def delete_course_offering(offering_id):
    offering = db.session.get(CourseOffering, offering_id)

    if not offering:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    enrollment_count = Enrollment.query.filter_by(
        offering_id=offering_id
    ).count()

    attendance_session_count = AttendanceSession.query.filter_by(
        offering_id=offering_id
    ).count()

    if enrollment_count or attendance_session_count:
        return jsonify({
            "success": False,
            "message": (
                "Course offering cannot be deleted because it has "
                "enrollments or attendance sessions"
            ),
        }), 409

    try:
        db.session.delete(offering)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": (
                "Course offering cannot be deleted because related records exist"
            ),
        }), 409
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Course offering could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "Course offering deleted successfully",
    }), 200


# ============================================================
# FACULTY MANAGEMENT
# ============================================================

@admin_bp.get("/faculty")
@admin_required
def get_faculty():
    faculty_members = (
        Faculty.query
        .join(Faculty.user)
        .join(Faculty.department)
        .order_by(Faculty.faculty_id.asc())
        .all()
    )

    data = [
        {
            "faculty_id": faculty.faculty_id,
            "user_id": faculty.user_id,
            "name": faculty.user.name,
            "email": faculty.user.email,
            "employee_id": faculty.employee_id,
            "designation": faculty.designation,
            "department_id": faculty.department.department_id,
            "department_name": faculty.department.department_name,
            "department_code": faculty.department.department_code,
            "is_active": faculty.user.is_active,
        }
        for faculty in faculty_members
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@admin_bp.get("/faculty/<int:faculty_id>")
@admin_required
def get_faculty_by_id(faculty_id):
    faculty = (
        Faculty.query
        .join(Faculty.user)
        .join(Faculty.department)
        .filter(Faculty.faculty_id == faculty_id)
        .first()
    )

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty not found",
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
            "department_id": faculty.department.department_id,
            "department_name": faculty.department.department_name,
            "department_code": faculty.department.department_code,
            "is_active": faculty.user.is_active,
        },
    }), 200


@admin_bp.post("/faculty")
@admin_required
def create_faculty():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    employee_id = str(
        data.get("employee_id", "")
    ).strip()
    designation = str(
        data.get("designation", "")
    ).strip()
    department_id = data.get("department_id")

    # -------------------------
    # Required fields
    # -------------------------

    if (
        user_id is None
        or not employee_id
        or not designation
        or department_id is None
    ):
        return jsonify({
            "success": False,
            "message": (
                "user_id, employee_id, designation and "
                "department_id are required"
            ),
        }), 400

    # -------------------------
    # User ID validation
    # -------------------------

    try:
        user_id = int(user_id)

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "User ID must be an integer",
        }), 400

    # -------------------------
    # Department ID validation
    # -------------------------

    try:
        department_id = int(department_id)

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Department ID must be an integer",
        }), 400

    # -------------------------
    # Existing User validation
    # -------------------------

    user = db.session.get(
        User,
        user_id,
    )

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    if user.role != "FACULTY":
        return jsonify({
            "success": False,
            "message": "User role must be FACULTY",
        }), 400

    # -------------------------
    # Existing Faculty profile
    # -------------------------

    existing_faculty_profile = Faculty.query.filter_by(
        user_id=user_id
    ).first()

    if existing_faculty_profile:
        return jsonify({
            "success": False,
            "message": "Faculty profile already exists for this user",
        }), 409

    # -------------------------
    # Duplicate employee ID
    # -------------------------

    existing_faculty = Faculty.query.filter_by(
        employee_id=employee_id
    ).first()

    if existing_faculty:
        return jsonify({
            "success": False,
            "message": "Employee ID already exists",
        }), 409

    # -------------------------
    # Department
    # -------------------------

    department = db.session.get(
        Department,
        department_id,
    )

    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found",
        }), 404

    # -------------------------
    # Create Faculty profile
    # -------------------------

    faculty = Faculty(
        user_id=user.user_id,
        department_id=department.department_id,
        employee_id=employee_id,
        designation=designation,
    )

    try:
        db.session.add(faculty)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Faculty could not be created because "
                "of a duplicate or database constraint"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Faculty could not be created",
        }), 500

    db.session.refresh(faculty)

    return jsonify({
        "success": True,
        "message": "Faculty profile created successfully",
        "data": {
            "faculty_id": faculty.faculty_id,
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "employee_id": faculty.employee_id,
            "designation": faculty.designation,
            "department_id": department.department_id,
            "department_name": department.department_name,
            "department_code": department.department_code,
        },
    }), 201


@admin_bp.patch("/faculty/<int:faculty_id>")
@admin_required
def update_faculty(faculty_id):
    faculty = (
        Faculty.query
        .join(Faculty.user)
        .filter(Faculty.faculty_id == faculty_id)
        .first()
    )

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty not found",
        }), 404

    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({
            "success": False,
            "message": "No fields provided for update",
        }), 400

    # -------------------------
    # User fields are forbidden
    # -------------------------

    forbidden_fields = {
        "name",
        "email",
        "password",
        "role",
        "user_id",
    }

    supplied_forbidden_fields = (
        forbidden_fields.intersection(data.keys())
    )

    if supplied_forbidden_fields:
        return jsonify({
            "success": False,
            "message": (
                "User fields cannot be updated through the "
                "faculty profile API. Use /api/admin/users/<user_id>"
            ),
            "fields": sorted(supplied_forbidden_fields),
        }), 400

    # -------------------------
    # Employee ID
    # -------------------------

    if "employee_id" in data:
        employee_id = str(
            data["employee_id"]
        ).strip()

        if not employee_id:
            return jsonify({
                "success": False,
                "message": "Employee ID cannot be empty",
            }), 400

        existing_faculty = Faculty.query.filter(
            Faculty.employee_id == employee_id,
            Faculty.faculty_id != faculty_id,
        ).first()

        if existing_faculty:
            return jsonify({
                "success": False,
                "message": "Employee ID already exists",
            }), 409

        faculty.employee_id = employee_id

    # -------------------------
    # Designation
    # -------------------------

    if "designation" in data:
        designation = str(
            data["designation"]
        ).strip()

        if not designation:
            return jsonify({
                "success": False,
                "message": "Designation cannot be empty",
            }), 400

        faculty.designation = designation

    # -------------------------
    # Department
    # -------------------------

    if "department_id" in data:
        try:
            department_id = int(
                data["department_id"]
            )

        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Department ID must be an integer",
            }), 400

        department = db.session.get(
            Department,
            department_id,
        )

        if not department:
            return jsonify({
                "success": False,
                "message": "Department not found",
            }), 404

        faculty.department_id = department.department_id

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Faculty could not be updated because "
                "of a duplicate or database constraint"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Faculty could not be updated",
        }), 500

    db.session.refresh(faculty)

    return jsonify({
        "success": True,
        "message": "Faculty updated successfully",
        "data": {
            "faculty_id": faculty.faculty_id,
            "user_id": faculty.user_id,
            "name": faculty.user.name,
            "email": faculty.user.email,
            "employee_id": faculty.employee_id,
            "designation": faculty.designation,
            "department_id": faculty.department.department_id,
            "department_name": faculty.department.department_name,
            "department_code": faculty.department.department_code,
        },
    }), 200


@admin_bp.delete("/faculty/<int:faculty_id>")
@admin_required
def delete_faculty(faculty_id):
    faculty = Faculty.query.filter_by(
        faculty_id=faculty_id
    ).first()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty not found",
        }), 404

    # -------------------------
    # Course offering safety
    # -------------------------

    course_offering_count = CourseOffering.query.filter_by(
        faculty_id=faculty.faculty_id
    ).count()

    if course_offering_count > 0:
        return jsonify({
            "success": False,
            "message": (
                "Faculty cannot be deleted because "
                "course offerings exist"
            ),
        }), 409

    # -------------------------
    # Attendance session safety
    # -------------------------

    attendance_session_count = AttendanceSession.query.filter_by(
        faculty_id=faculty.faculty_id
    ).count()

    if attendance_session_count > 0:
        return jsonify({
            "success": False,
            "message": (
                "Faculty cannot be deleted because "
                "attendance sessions exist"
            ),
        }), 409

    # -------------------------
    # Linked User safety
    # -------------------------

    user = faculty.user

    if user and user.student_profile:
        return jsonify({
            "success": False,
            "message": (
                "Faculty cannot be deleted because "
                "the linked user has a student profile"
            ),
        }), 409

    try:
        # Delete ONLY the Faculty profile.
        # The linked User account remains.
        db.session.delete(faculty)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": (
                "Faculty could not be deleted because "
                "related records exist"
            ),
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Faculty could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "Faculty profile deleted successfully",
        "data": {
            "faculty_id": faculty_id,
        },
    }), 200
