
import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import Course, CourseOffering, Enrollment, Student
from app.utils.auth import admin_required, student_required


enrollment_bp = Blueprint(
    "enrollment",
    __name__,
    url_prefix="/api",
)


# ---------------------------------------------------------------------------
# Shared helpers for cohort-based group enrollment
# ---------------------------------------------------------------------------

def _parse_group_request(data):
    """Validate the selected department, cohort, semester, and section."""

    if not isinstance(data, dict):
        return None, "A valid JSON object is required"

    try:
        department_id = int(data.get("department_id"))
        semester = int(data.get("semester"))
    except (TypeError, ValueError):
        return None, "department_id and semester must be valid integers"

    cohort = data.get("academic_year")
    section = data.get("section")

    if department_id < 1:
        return None, "department_id must be greater than 0"

    if semester < 1:
        return None, "semester must be greater than 0"

    if not isinstance(cohort, str) or not isinstance(section, str):
        return None, "A cohort and section are required"

    normalized_cohort = re.sub(r"\s+", "", cohort)
    cohort_match = re.fullmatch(r"(\d{4})-(\d{4})", normalized_cohort)

    if not cohort_match:
        return None, (
            "Cohort must use the format YYYY-YYYY, "
            "for example 2026-2030"
        )

    cohort_start_year = cohort_match.group(1)
    normalized_section = section.strip()

    if not normalized_section:
        return None, "Section cannot be empty"

    group = {
        "department_id": department_id,
        "academic_year": normalized_cohort,
        "cohort_start_year": cohort_start_year,
        "semester": semester,
        "section": normalized_section,
    }

    return group, None


def _get_group_enrollment_context(group):
    """
    Find active students and existing offerings for the selected cohort.

    Student.academic_year represents the cohort range, while Course.batch
    represents the cohort start year. CourseOffering.academic_year represents
    the academic session, so it is intentionally not compared to the cohort.
    """

    students = (
        Student.query
        .join(Student.user)
        .filter(
            Student.department_id == group["department_id"],
            Student.semester == group["semester"],
            Student.section == group["section"],
            db.func.replace(Student.academic_year, " ", "")
            == group["academic_year"],
            Student.user.has(is_active=True),
        )
        .order_by(Student.student_id.asc())
        .all()
    )

    offerings = (
        CourseOffering.query
        .join(CourseOffering.course)
        .filter(
            Course.department_id == group["department_id"],
            Course.semester == group["semester"],
            Course.is_active.is_(True),
            Course.batch == group["cohort_start_year"],
            CourseOffering.semester == group["semester"],
            CourseOffering.section == group["section"],
        )
        .order_by(Course.course_code.asc(), CourseOffering.offering_id.asc())
        .all()
    )

    # Identify active courses for the cohort that have no valid offering
    # for the selected semester and section.
    active_courses = (
        Course.query
        .filter(
            Course.department_id == group["department_id"],
            Course.semester == group["semester"],
            Course.is_active.is_(True),
            Course.batch == group["cohort_start_year"],
        )
        .order_by(Course.course_code.asc())
        .all()
    )

    offered_course_ids = {offering.course_id for offering in offerings}

    courses_without_offerings = [
        {
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
        }
        for course in active_courses
        if course.course_id not in offered_course_ids
    ]

    return students, offerings, courses_without_offerings


def _parse_offering_ids(data, required=True):
    """Validate selected offering IDs.

    For preview requests, a missing or empty list means all matching
    offerings. For bulk enrollment, at least one offering is required.
    """
    offering_ids = data.get("offering_ids")

    # Preview mode: no selection means preview all matching offerings.
    if not required and (
        offering_ids is None or offering_ids == []
    ):
        return [], None

    # Bulk enrollment requires at least one selected offering.
    if not isinstance(offering_ids, list) or not offering_ids:
        return None, "Select at least one course offering"

    parsed_ids = []

    for value in offering_ids:
        if isinstance(value, bool):
            return None, "Every offering ID must be a positive integer"

        try:
            offering_id = int(value)
        except (TypeError, ValueError):
            return None, "Every offering ID must be a positive integer"

        if offering_id < 1:
            return None, "Every offering ID must be a positive integer"

        parsed_ids.append(offering_id)

    if len(parsed_ids) != len(set(parsed_ids)):
        return None, "Duplicate offering IDs are not allowed"

    return parsed_ids, None



def _offering_to_dict(offering):
    course = offering.course

    return {
        "offering_id": offering.offering_id,
        "course_id": course.course_id,
        "course_code": course.course_code,
        "course_name": course.course_name,
        "semester": offering.semester,
        "section": offering.section,
        "academic_year": offering.academic_year,
        "room": offering.room,
    }


def _existing_enrollment_pairs(student_ids, offering_ids):
    """Return existing (student_id, offering_id) pairs for a group."""

    if not student_ids or not offering_ids:
        return set()

    rows = db.session.execute(
        select(
            Enrollment.student_id,
            Enrollment.offering_id,
        ).where(
            Enrollment.student_id.in_(student_ids),
            Enrollment.offering_id.in_(offering_ids),
        )
    ).all()

    return {(row[0], row[1]) for row in rows}


# ---------------------------------------------------------------------------
# Admin: list existing enrollment records
# ---------------------------------------------------------------------------

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
            "enrolled_at": (
                enrollment.enrolled_at.isoformat()
                if enrollment.enrolled_at
                else None
            ),
        }
        for enrollment in enrollments
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


# ---------------------------------------------------------------------------
# Admin: delete an existing enrollment record
# ---------------------------------------------------------------------------

@enrollment_bp.delete("/admin/enrollments/<int:enrollment_id>")
@admin_required
def delete_enrollment(enrollment_id):
    enrollment = db.session.get(Enrollment, enrollment_id)

    if not enrollment:
        return jsonify({
            "success": False,
            "message": "Enrollment not found",
        }), 404

    try:
        db.session.delete(enrollment)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Unable to delete the enrollment",
        }), 500

    return jsonify({
        "success": True,
        "message": "Enrollment removed successfully",
    }), 200


# ---------------------------------------------------------------------------
# Admin: preview cohort enrollment without writing to the database
# ---------------------------------------------------------------------------

@enrollment_bp.post("/admin/enrollments/group-preview")
@admin_required
def preview_group_enrollment():
    data = request.get_json(silent=True)
    group, error = _parse_group_request(data)

    if error:
        return jsonify({
            "success": False,
            "message": error,
        }), 400

    students, available_offerings, _ = (
        _get_group_enrollment_context(group)
    )

    # Retrieve every active course for the selected department,
    # cohort, semester, and section's course group.
    active_courses = (
        Course.query
        .filter(
            Course.department_id == group["department_id"],
            Course.semester == group["semester"],
            Course.is_active.is_(True),
            Course.batch == group["cohort_start_year"],
        )
        .order_by(Course.course_code.asc())
        .all()
    )

    # Index matching offerings by course. Preserve multiple offerings
    # in the response so existing data isn't silently hidden.
    offerings_by_course = {}
    for offering in available_offerings:
        offerings_by_course.setdefault(
            offering.course_id, []
        ).append(offering)

    courses = []
    for course in active_courses:
        matching = offerings_by_course.get(course.course_id, [])

        courses.append({
            "course_id": course.course_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "offerings": [
                _offering_to_dict(offering)
                for offering in matching
            ],
            "offering_id": (
                matching[0].offering_id if matching else None
            ),
            "has_offering": bool(matching),
            "faculty_assigned": any(
                offering.faculty_id is not None
                for offering in matching
            ),
        })

    # Keep support for older clients that pass offering_ids.
    available_by_id = {
        offering.offering_id: offering
        for offering in available_offerings
    }

    requested_ids, error = _parse_offering_ids(
        data, required=False
    )

    if error:
        return jsonify({
            "success": False,
            "message": error,
        }), 400

    if requested_ids:
        invalid_ids = [
            offering_id
            for offering_id in requested_ids
            if offering_id not in available_by_id
        ]

        if invalid_ids:
            return jsonify({
                "success": False,
                "message": (
                    "One or more selected offerings do not belong "
                    "to the selected cohort, semester, and section"
                ),
                "invalid_offering_ids": invalid_ids,
            }), 400

        selected_offerings = [
            available_by_id[offering_id]
            for offering_id in requested_ids
        ]
    else:
        selected_offerings = available_offerings

    student_ids = [
        student.student_id for student in students
    ]
    offering_ids = [
        offering.offering_id
        for offering in selected_offerings
    ]

    existing_pairs = _existing_enrollment_pairs(
        student_ids,
        offering_ids,
    )

    total_pairs = len(student_ids) * len(offering_ids)
    already_enrolled = len(existing_pairs)

    courses_without_offerings = [
        {
            "course_id": course["course_id"],
            "course_code": course["course_code"],
            "course_name": course["course_name"],
        }
        for course in courses
        if not course["has_offering"]
    ]

    return jsonify({
        "success": True,
        "message": "Enrollment preview generated successfully",
        "data": {
            **group,
            "eligible_students": len(students),
            "active_courses": len(active_courses),
            "available_offerings": len(available_offerings),
            "matched_offerings": len(selected_offerings),
            "total_matching_enrollment_pairs": total_pairs,
            "already_enrolled": already_enrolled,
            "to_create": total_pairs - already_enrolled,
            "courses": courses,
            "courses_without_offerings": courses_without_offerings,
            "offerings": [
                _offering_to_dict(offering)
                for offering in selected_offerings
            ],
        },
    }), 200



# ---------------------------------------------------------------------------
# Admin: enroll the selected group in selected offerings atomically
# ---------------------------------------------------------------------------

@enrollment_bp.post("/admin/enrollments/group-bulk")
@admin_required
def bulk_enroll_group():
    data = request.get_json(silent=True)
    group, error = _parse_group_request(data)

    if error:
        return jsonify({
            "success": False,
            "message": error,
        }), 400

    students, _, _ = _get_group_enrollment_context(group)

    # Only active courses belonging to the selected cohort and group.
    courses = (
        Course.query
        .filter(
            Course.department_id == group["department_id"],
            Course.semester == group["semester"],
            Course.is_active.is_(True),
            Course.batch == group["cohort_start_year"],
        )
        .order_by(Course.course_code.asc())
        .all()
    )

    if not courses:
        return jsonify({
            "success": False,
            "message": "No active courses were found for this group.",
        }), 400

    if not students:
        return jsonify({
            "success": False,
            "message": "No eligible active students were found.",
            "data": {
                **group,
                "eligible_students": 0,
                "matched_offerings": 0,
                "created_offerings": 0,
                "created": 0,
                "already_enrolled": 0,
            },
        }), 200

    student_ids = [student.student_id for student in students]
    created_offerings = []
    matched_offerings = []

    # New offerings use the existing academic-session convention.
    start_year = int(group["cohort_start_year"])
    session = f"{start_year} -{start_year + 1}"

    try:
        for course in courses:
            existing = (
                CourseOffering.query
                .filter(
                    CourseOffering.course_id == course.course_id,
                    CourseOffering.semester == group["semester"],
                    CourseOffering.section == group["section"],
                )
                .order_by(CourseOffering.offering_id.asc())
                .first()
            )

            if existing:
                # Reuse the existing offering without changing its
                # academic session, room, or faculty assignment.
                offering = existing
            else:
                offering = CourseOffering(
                    course_id=course.course_id,
                    faculty_id=None,
                    academic_year=session,
                    semester=group["semester"],
                    section=group["section"],
                    room=None,
                )
                db.session.add(offering)
                db.session.flush()
                created_offerings.append(offering)

            matched_offerings.append(offering)

        offering_ids = [
            offering.offering_id for offering in matched_offerings
        ]

        existing_pairs = _existing_enrollment_pairs(
            student_ids,
            offering_ids,
        )

        rows = [
            {
                "student_id": student_id,
                "offering_id": offering_id,
                "status": "ACTIVE",
            }
            for student_id in student_ids
            for offering_id in offering_ids
            if (student_id, offering_id) not in existing_pairs
        ]

        if rows:
            db.session.execute(db.insert(Enrollment), rows)

        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": (
                "A database conflict occurred. "
                "The bulk enrollment transaction was rolled back."
            ),
        }), 409

    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": (
                "Bulk enrollment failed. "
                "The transaction was rolled back."
            ),
        }), 500

    return jsonify({
        "success": True,
        "message": "Group bulk enrollment completed successfully.",
        "data": {
            **group,
            "eligible_students": len(student_ids),
            "matched_offerings": len(matched_offerings),
            "created_offerings": len(created_offerings),
            "created": len(rows),
            "already_enrolled": len(existing_pairs),
            "offering_ids": offering_ids,
        },
    }), 201 if rows or created_offerings else 200



# ---------------------------------------------------------------------------
# Student: list courses for the logged-in student
# ---------------------------------------------------------------------------

@enrollment_bp.get("/student/courses")
@student_required
def get_student_courses():
    user_id = int(get_jwt_identity())

    student = Student.query.filter_by(user_id=user_id).first()

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
