from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import bcrypt, db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
    Department,
    Faculty,
    Student,
    User,
)
from sqlalchemy.exc import IntegrityError
from app.services.auth_service import create_user
from app.utils.auth import admin_required


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin",
)

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

    # -------------------------
    # Role is intentionally NOT
    # accepted here.
    # -------------------------

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Admin profile could not be updated because of a database constraint",
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


@admin_bp.get("/users")
@admin_required
def get_users():
    users = User.query.order_by(User.user_id.asc()).all()

    data = [
        {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }
        for user in users
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200

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
        },
    }), 200

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

    user = student.user

    # -------------------------
    # User fields
    # -------------------------

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
            User.user_id != user.user_id,
        ).first()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already exists",
            }), 409

        user.email = email

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

    # -------------------------
    # Student fields
    # -------------------------

    if "enrollment_no" in data:
        enrollment_no = str(data["enrollment_no"]).strip()

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

    if "section" in data:
        section = str(data["section"]).strip()

        if not section:
            return jsonify({
                "success": False,
                "message": "Section cannot be empty",
            }), 400

        student.section = section

    if "academic_year" in data:
        academic_year = str(data["academic_year"]).strip()

        if not academic_year:
            return jsonify({
                "success": False,
                "message": "Academic year cannot be empty",
            }), 400

        student.academic_year = academic_year

    if "department_id" in data:
        try:
            department_id = int(data["department_id"])
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Department ID must be an integer",
            }), 400

        department = db.session.get(Department, department_id)

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
            "message": "Student could not be updated because of a duplicate or database constraint",
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be updated",
        }), 500

    # Reload relationship after update.
    db.session.refresh(student)

    return jsonify({
        "success": True,
        "message": "Student updated successfully",
        "data": {
            "student_id": student.student_id,
            "user_id": student.user_id,
            "name": user.name,
            "email": user.email,
            "enrollment_no": student.enrollment_no,
            "semester": student.semester,
            "section": student.section,
            "academic_year": student.academic_year,
            "department_id": student.department.department_id,
            "department_name": student.department.department_name,
            "department_code": student.department.department_code,
        },
    }), 200

@admin_bp.post("/students")
@admin_required
def create_student():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).lower().strip()
    password = str(data.get("password", ""))
    enrollment_no = str(data.get("enrollment_no", "")).strip()
    section = str(data.get("section", "")).strip()
    academic_year = str(data.get("academic_year", "")).strip()

    semester = data.get("semester")
    department_id = data.get("department_id")

    # Required field validation
    if not all([
        name,
        email,
        password,
        enrollment_no,
        section,
        academic_year,
        semester is not None,
        department_id is not None,
    ]):
        return jsonify({
            "success": False,
            "message": "Name, email, password, enrollment_no, semester, section, academic_year and department_id are required",
        }), 400

    # Semester validation
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

    # Department ID validation
    try:
        department_id = int(department_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Department ID must be an integer",
        }), 400

    # Password validation
    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters",
        }), 400

    # Duplicate email check
    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "message": "Email already exists",
        }), 409

    # Duplicate enrollment number check
    if Student.query.filter_by(enrollment_no=enrollment_no).first():
        return jsonify({
            "success": False,
            "message": "Enrollment number already exists",
        }), 409

    # Department existence check
    department = db.session.get(Department, department_id)

    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found",
        }), 404

    try:
        # Create User without committing yet.
        user = User(
            name=name,
            email=email,
            password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
            role="STUDENT",
        )

        db.session.add(user)

        # Get generated user_id without committing.
        db.session.flush()

        # Create Student linked to the User.
        student = Student(
            user_id=user.user_id,
            department_id=department.department_id,
            enrollment_no=enrollment_no,
            semester=semester,
            section=section,
            academic_year=academic_year,
        )

        db.session.add(student)

        # One transaction.
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be created because of a duplicate or database constraint",
        }), 409

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Student could not be created",
        }), 500

    return jsonify({
        "success": True,
        "message": "Student created successfully",
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

@admin_bp.delete("/students/<int:student_id>")
@admin_required
def delete_student(student_id):
    student = Student.query.filter_by(student_id=student_id).first()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    # Attendance history must never be deleted accidentally.
    attendance_count = AttendanceRecord.query.filter_by(
        student_id=student.student_id
    ).count()

    if attendance_count > 0:
        return jsonify({
            "success": False,
            "message": "Student cannot be deleted because attendance records exist",
        }), 409

    user = student.user

    try:
        db.session.delete(student)

        if user:
            db.session.delete(user)

        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Student could not be deleted because related records exist",
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Student could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "Student deleted successfully",
        "data": {
            "student_id": student_id,
        },
    }), 200

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
        },
    }), 200

@admin_bp.post("/faculty")
@admin_required
def create_faculty():
    data = request.get_json(silent=True) or {}

    required_fields = [
        "name",
        "email",
        "password",
        "employee_id",
        "designation",
        "department_id",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or str(data[field]).strip() == ""
    ]

    if missing_fields:
        return jsonify({
            "success": False,
            "message": f"Missing required fields: {', '.join(missing_fields)}",
        }), 400

    name = str(data["name"]).strip()
    email = str(data["email"]).lower().strip()
    password = str(data["password"])
    employee_id = str(data["employee_id"]).strip()
    designation = str(data["designation"]).strip()

    try:
        department_id = int(data["department_id"])
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Department ID must be an integer",
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters",
        }), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            "success": False,
            "message": "Email already exists",
        }), 409

    existing_faculty = Faculty.query.filter_by(
        employee_id=employee_id
    ).first()

    if existing_faculty:
        return jsonify({
            "success": False,
            "message": "Employee ID already exists",
        }), 409

    department = db.session.get(Department, department_id)

    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found",
        }), 404

    try:
        user = User(
            name=name,
            email=email,
            password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
            role="FACULTY",
        )

        db.session.add(user)
        db.session.flush()

        faculty = Faculty(
            user_id=user.user_id,
            department_id=department.department_id,
            employee_id=employee_id,
            designation=designation,
        )

        db.session.add(faculty)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Faculty could not be created because of a duplicate or database constraint",
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Faculty could not be created",
        }), 500

    return jsonify({
        "success": True,
        "message": "Faculty created successfully",
        "data": {
            "faculty_id": faculty.faculty_id,
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
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

    user = faculty.user

    # -------------------------
    # User fields
    # -------------------------

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
            User.user_id != user.user_id,
        ).first()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already exists",
            }), 409

        user.email = email

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

    # -------------------------
    # Faculty fields
    # -------------------------

    if "employee_id" in data:
        employee_id = str(data["employee_id"]).strip()

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

    if "designation" in data:
        designation = str(data["designation"]).strip()

        if not designation:
            return jsonify({
                "success": False,
                "message": "Designation cannot be empty",
            }), 400

        faculty.designation = designation

    if "department_id" in data:
        try:
            department_id = int(data["department_id"])
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Department ID must be an integer",
            }), 400

        department = db.session.get(Department, department_id)

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
            "message": "Faculty could not be updated because of a duplicate or database constraint",
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
            "name": user.name,
            "email": user.email,
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
    faculty = Faculty.query.filter_by(faculty_id=faculty_id).first()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty not found",
        }), 404

    # Do not delete faculty if they are assigned to any course offering.
    course_offering_count = CourseOffering.query.filter_by(
        faculty_id=faculty.faculty_id
    ).count()

    if course_offering_count > 0:
        return jsonify({
            "success": False,
            "message": "Faculty cannot be deleted because course offerings exist",
        }), 409

    # Do not delete faculty if they have attendance sessions.
    attendance_session_count = AttendanceSession.query.filter_by(
        faculty_id=faculty.faculty_id
    ).count()

    if attendance_session_count > 0:
        return jsonify({
            "success": False,
            "message": "Faculty cannot be deleted because attendance sessions exist",
        }), 409

    user = faculty.user

    # Safety check: the linked User should not also have a Student profile.
    if user and user.student_profile:
        return jsonify({
            "success": False,
            "message": "Faculty cannot be deleted because the linked user has a student profile",
        }), 409

    try:
        db.session.delete(faculty)

        if user:
            db.session.delete(user)

        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Faculty could not be deleted because related records exist",
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Faculty could not be deleted",
        }), 500

    return jsonify({
        "success": True,
        "message": "Faculty deleted successfully",
        "data": {
            "faculty_id": faculty_id,
        },
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
            "message": "Name, email, password and role are required",
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

        from app.extensions import bcrypt

        user.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User updated successfully",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
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

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User deleted successfully",
    }), 200
