import os
import time
import base64
from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename

from app.extensions import db, bcrypt
from app.models import (
    Student,
    Enrollment,
    AttendanceRecord,
    User,
    Department,
    Batch,
)
from app.utils.auth import student_required, student_or_admin_required


student_bp = Blueprint(
    "student",
    __name__,
    url_prefix="/api/student",
)

# Upload directory configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "students")
PHOTOS_DIR = os.path.join(UPLOAD_DIR, "photos")
SIGNATURES_DIR = os.path.join(UPLOAD_DIR, "signatures")

os.makedirs(PHOTOS_DIR, exist_ok=True)
os.makedirs(SIGNATURES_DIR, exist_ok=True)

MAX_IMAGE_SIZE_BYTES = 50 * 1024  # 50 KB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def is_allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[-1].lower() in ALLOWED_EXTENSIONS


def get_current_student():
    user_id = int(get_jwt_identity())

    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        user = db.session.get(User, user_id)
        if user and user.role in ("STUDENT", "ADMIN"):
            dept = Department.query.first()
            dept_id = dept.department_id if dept else 1
            student = Student(
                user_id=user_id,
                department_id=dept_id,
                enrollment_no=f"STU-{user_id:04d}",
                semester=1,
                section="A",
                academic_year="2024-2025",
                country="India",
            )
            db.session.add(student)
            db.session.commit()

    return student


def serialize_student_profile(student):
    records = AttendanceRecord.query.filter_by(student_id=student.student_id).all()
    total_records = len(records)
    present_records = sum(1 for r in records if r.status == "PRESENT")
    attendance_rate = (
        round((present_records / total_records * 100), 1)
        if total_records > 0
        else 100.0
    )

    enrollments_count = Enrollment.query.filter_by(
        student_id=student.student_id, status="ACTIVE"
    ).count()

    return {
        "student_id": student.student_id,
        "user_id": student.user_id,
        "name": student.user.name,
        "email": student.user.email,
        "phone": student.phone or getattr(student.user, "phone", "") or "",
        "enrollment_no": student.enrollment_no,
        "semester": student.semester,
        "section": student.section,
        "academic_year": student.academic_year,
        "photo_url": student.photo_url or "",
        "signature_url": student.signature_url or "",
        "father_name": student.father_name or "",
        "mother_name": student.mother_name or "",
        "guardian_phone": student.guardian_phone or "",
        "blood_group": student.blood_group or "",
        "gender": student.gender or "",
        "date_of_birth": student.date_of_birth or "",
        "address": student.address or "",
        "city": student.city or "",
        "state": student.state or "",
        "pin_code": student.pin_code or "",
        "country": student.country or "India",
        "emergency_contact_name": student.emergency_contact_name or "",
        "emergency_contact_phone": student.emergency_contact_phone or "",
        "admission_date": student.admission_date or "",
        "account_status": (
            "Active" if getattr(student.user, "is_active", True) else "Inactive"
        ),
        "department": {
            "department_id": (
                student.department.department_id if student.department else None
            ),
            "department_name": (
                student.department.department_name
                if student.department
                else "Department"
            ),
            "department_code": (
                student.department.department_code if student.department else "N/A"
            ),
        },
        "batch": {
            "batch_id": student.batch.batch_id if student.batch else None,
            "batch_name": student.batch.batch_name if student.batch else "",
        },
        "stats": {
            "total_enrolled_courses": enrollments_count,
            "total_attendance_records": total_records,
            "present_count": present_records,
            "attendance_percentage": attendance_rate,
        },
    }


# ============================================================
# STUDENT DASHBOARD
# ============================================================

@student_bp.get("/dashboard")
@student_or_admin_required
def student_dashboard():
    return jsonify({
        "success": True,
        "message": "Student access granted",
        "data": {
            "role": "STUDENT",
        },
    }), 200


# ============================================================
# GET STUDENT PROFILE
# ============================================================

@student_bp.get("/profile")
@student_or_admin_required
def get_student_profile():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    return jsonify({
        "success": True,
        "data": serialize_student_profile(student),
    }), 200


# ============================================================
# UPDATE STUDENT PROFILE
# ============================================================

@student_bp.patch("/profile")
@student_or_admin_required
def update_student_profile():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    data = request.get_json(silent=True) or {}

    # Basic identity
    name = data.get("name")
    if name is not None:
        name = str(name).strip()
        if not name:
            return jsonify({
                "success": False,
                "message": "Name cannot be empty",
            }), 400
        student.user.name = name

    # Phone (sync to both student & user)
    if "phone" in data:
        phone_val = str(data["phone"]).strip() if data["phone"] is not None else None
        student.phone = phone_val
        student.user.phone = phone_val

    # Family & Guardian details
    if "father_name" in data:
        student.father_name = str(data["father_name"]).strip() if data["father_name"] is not None else None

    if "mother_name" in data:
        student.mother_name = str(data["mother_name"]).strip() if data["mother_name"] is not None else None

    if "guardian_phone" in data:
        student.guardian_phone = str(data["guardian_phone"]).strip() if data["guardian_phone"] is not None else None

    # Personal characteristics
    if "blood_group" in data:
        student.blood_group = str(data["blood_group"]).strip().upper() if data["blood_group"] is not None else None

    if "gender" in data:
        student.gender = str(data["gender"]).strip() if data["gender"] is not None else None

    if "date_of_birth" in data:
        student.date_of_birth = str(data["date_of_birth"]).strip() if data["date_of_birth"] is not None else None

    # Address & Location
    if "address" in data:
        student.address = str(data["address"]).strip() if data["address"] is not None else None

    if "city" in data:
        student.city = str(data["city"]).strip() if data["city"] is not None else None

    if "state" in data:
        student.state = str(data["state"]).strip() if data["state"] is not None else None

    if "pin_code" in data:
        student.pin_code = str(data["pin_code"]).strip() if data["pin_code"] is not None else None

    if "country" in data:
        student.country = str(data["country"]).strip() if data["country"] is not None else "India"

    # Emergency Contact
    if "emergency_contact_name" in data:
        student.emergency_contact_name = str(data["emergency_contact_name"]).strip() if data["emergency_contact_name"] is not None else None

    if "emergency_contact_phone" in data:
        student.emergency_contact_phone = str(data["emergency_contact_phone"]).strip() if data["emergency_contact_phone"] is not None else None

    # Direct photo or signature URL updates (if uploaded separately)
    if "photo_url" in data and data["photo_url"]:
        student.photo_url = str(data["photo_url"]).strip()

    if "signature_url" in data and data["signature_url"]:
        student.signature_url = str(data["signature_url"]).strip()

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student profile updated successfully",
        "data": serialize_student_profile(student),
    }), 200


# ============================================================
# UPLOAD PASSPORT-SIZE PHOTO (< 50 KB STRICT)
# ============================================================

@student_bp.post("/upload-photo")
@student_or_admin_required
def upload_student_photo():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    file_bytes = None
    ext = "jpg"

    # Option A: Multipart/form-data upload
    if "file" in request.files or "photo" in request.files:
        uploaded_file = request.files.get("file") or request.files.get("photo")
        if not uploaded_file or not uploaded_file.filename:
            return jsonify({
                "success": False,
                "message": "No file was selected for upload",
            }), 400

        filename = secure_filename(uploaded_file.filename)
        if not is_allowed_file(filename):
            return jsonify({
                "success": False,
                "message": f"Unsupported file type. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            }), 400

        ext = filename.rsplit(".", 1)[-1].lower()
        file_bytes = uploaded_file.read()

    # Option B: Base64 JSON data_url
    else:
        json_data = request.get_json(silent=True) or {}
        data_url = json_data.get("image") or json_data.get("data_url") or json_data.get("photo")
        if data_url and isinstance(data_url, str) and "base64," in data_url:
            header, encoded = data_url.split("base64,", 1)
            try:
                file_bytes = base64.b64decode(encoded)
                if "png" in header:
                    ext = "png"
                elif "webp" in header:
                    ext = "webp"
                else:
                    ext = "jpg"
            except Exception:
                return jsonify({
                    "success": False,
                    "message": "Invalid base64 image data",
                }), 400
        else:
            return jsonify({
                "success": False,
                "message": "Upload a photo file or base64 image data",
            }), 400

    # STRICT SIZE VALIDATION (< 50 KB)
    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        size_kb = len(file_bytes) / 1024
        return jsonify({
            "success": False,
            "message": f"Passport-size photo must be strictly less than 50 KB. (Selected file: {size_kb:.1f} KB)",
        }), 400

    # Save to disk
    save_filename = f"student_photo_{student.student_id}_{int(time.time())}.{ext}"
    filepath = os.path.join(PHOTOS_DIR, save_filename)

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    # Update database
    photo_url = f"/api/student/uploads/photos/{save_filename}"
    student.photo_url = photo_url
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Passport-size photo uploaded successfully",
        "photo_url": photo_url,
        "file_size_kb": round(len(file_bytes) / 1024, 2),
    }), 200


# ============================================================
# UPLOAD SIGNATURE (< 50 KB STRICT)
# ============================================================

@student_bp.post("/upload-signature")
@student_or_admin_required
def upload_student_signature():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    file_bytes = None
    ext = "png"

    # Option A: Multipart/form-data upload
    if "file" in request.files or "signature" in request.files:
        uploaded_file = request.files.get("file") or request.files.get("signature")
        if not uploaded_file or not uploaded_file.filename:
            return jsonify({
                "success": False,
                "message": "No signature file was selected for upload",
            }), 400

        filename = secure_filename(uploaded_file.filename)
        if not is_allowed_file(filename):
            return jsonify({
                "success": False,
                "message": f"Unsupported file type. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            }), 400

        ext = filename.rsplit(".", 1)[-1].lower()
        file_bytes = uploaded_file.read()

    # Option B: Base64 JSON data_url
    else:
        json_data = request.get_json(silent=True) or {}
        data_url = json_data.get("signature") or json_data.get("data_url") or json_data.get("image")
        if data_url and isinstance(data_url, str) and "base64," in data_url:
            header, encoded = data_url.split("base64,", 1)
            try:
                file_bytes = base64.b64decode(encoded)
                if "png" in header:
                    ext = "png"
                elif "webp" in header:
                    ext = "webp"
                else:
                    ext = "jpg"
            except Exception:
                return jsonify({
                    "success": False,
                    "message": "Invalid base64 signature data",
                }), 400
        else:
            return jsonify({
                "success": False,
                "message": "Upload a signature file or base64 signature data",
            }), 400

    # STRICT SIZE VALIDATION (< 50 KB)
    if len(file_bytes) > MAX_IMAGE_SIZE_BYTES:
        size_kb = len(file_bytes) / 1024
        return jsonify({
            "success": False,
            "message": f"Signature must be strictly less than 50 KB. (Selected file: {size_kb:.1f} KB)",
        }), 400

    # Save to disk
    save_filename = f"student_sig_{student.student_id}_{int(time.time())}.{ext}"
    filepath = os.path.join(SIGNATURES_DIR, save_filename)

    with open(filepath, "wb") as f:
        f.write(file_bytes)

    # Update database
    signature_url = f"/api/student/uploads/signatures/{save_filename}"
    student.signature_url = signature_url
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Signature uploaded successfully",
        "signature_url": signature_url,
        "file_size_kb": round(len(file_bytes) / 1024, 2),
    }), 200


# ============================================================
# SERVE STUDENT UPLOADS
# ============================================================

@student_bp.get("/uploads/<folder>/<filename>")
def serve_student_upload(folder, filename):
    safe_filename = secure_filename(filename)
    if folder == "photos":
        return send_from_directory(PHOTOS_DIR, safe_filename)
    elif folder == "signatures":
        return send_from_directory(SIGNATURES_DIR, safe_filename)
    else:
        return jsonify({
            "success": False,
            "message": "Invalid upload category",
        }), 404


# ============================================================
# CHANGE STUDENT PASSWORD
# ============================================================

@student_bp.post("/change-password")
@student_or_admin_required
def change_student_password():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
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
            "message": "New password and confirm password do not match",
        }), 400

    if not bcrypt.check_password_hash(student.user.password_hash, str(current_password)):
        return jsonify({
            "success": False,
            "message": "Current password is incorrect",
        }), 400

    student.user.password_hash = bcrypt.generate_password_hash(str(new_password)).decode("utf-8")
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password changed successfully",
    }), 200


# ============================================================
# STUDENT COURSES
# ============================================================

@student_bp.get("/courses")
@student_or_admin_required
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
            "faculty": (
                {
                    "faculty_id": offering.faculty.faculty_id,
                    "name": (
                        offering.faculty.user.name
                        if offering.faculty.user
                        else None
                    ),
                    "employee_id": offering.faculty.employee_id,
                    "designation": offering.faculty.designation,
                }
                if offering.faculty
                else None
            ),
        })

    return jsonify({
        "success": True,
        "data": data,
    }), 200