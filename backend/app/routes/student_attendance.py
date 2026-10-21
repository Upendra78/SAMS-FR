
from collections import defaultdict
from datetime import date
from math import ceil

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
    Enrollment,
    Student,
)
from app.utils.auth import student_required


student_attendance_bp = Blueprint(
    "student_attendance",
    __name__,
    url_prefix="/api/student/attendance",
)


def get_current_student():
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None

    return Student.query.filter_by(user_id=user_id).first()


def parse_date_filter(name):
    """Parse an optional YYYY-MM-DD query parameter."""
    value = request.args.get(name, "").strip()

    if not value:
        return None, None

    try:
        return date.fromisoformat(value), None
    except ValueError:
        return None, (
            jsonify({
                "success": False,
                "message": f"Invalid {name}. Use YYYY-MM-DD.",
            }),
            400,
        )


def parse_positive_int(
    name,
    default=None,
    minimum=1,
    maximum=None,
):
    """Parse an optional positive integer query parameter."""
    value = request.args.get(name)

    if value is None or value.strip() == "":
        return default, None

    try:
        number = int(value)
    except (TypeError, ValueError):
        return None, (
            jsonify({
                "success": False,
                "message": f"{name} must be an integer.",
            }),
            400,
        )

    if number < minimum or (
        maximum is not None and number > maximum
    ):
        message = f"{name} must be at least {minimum}."

        if maximum is not None:
            message = (
                f"{name} must be between {minimum} and {maximum}."
            )

        return None, (
            jsonify({
                "success": False,
                "message": message,
            }),
            400,
        )

    return number, None


def build_history_query(student_id):
    """Build a history query scoped to the authenticated student."""
    query = (
        AttendanceRecord.query
        .filter(AttendanceRecord.student_id == student_id)
        .join(AttendanceSession)
        .join(
            CourseOffering,
            AttendanceSession.offering_id
            == CourseOffering.offering_id,
        )
    )

    course_id, error = parse_positive_int("course_id")
    if error:
        return None, error

    offering_id, error = parse_positive_int("offering_id")
    if error:
        return None, error

    date_from, error = parse_date_filter("date_from")
    if error:
        return None, error

    date_to, error = parse_date_filter("date_to")
    if error:
        return None, error

    if date_from and date_to and date_from > date_to:
        return None, (
            jsonify({
                "success": False,
                "message": "date_from cannot be after date_to.",
            }),
            400,
        )

    status = request.args.get("status", "").strip().upper()

    if status and status not in {"PRESENT", "ABSENT", "LATE"}:
        return None, (
            jsonify({
                "success": False,
                "message": (
                    "Invalid status. Use PRESENT, ABSENT, or LATE."
                ),
            }),
            400,
        )

    if course_id is not None:
        query = query.filter(
            CourseOffering.course_id == course_id
        )

    if offering_id is not None:
        query = query.filter(
            CourseOffering.offering_id == offering_id
        )

    if date_from:
        query = query.filter(
            AttendanceSession.session_date >= date_from
        )

    if date_to:
        query = query.filter(
            AttendanceSession.session_date <= date_to
        )

    if status:
        query = query.filter(
            AttendanceRecord.status == status
        )

    return query, None


def serialize_record(record):
    """Serialize an attendance record for the student API."""
    session = record.session
    offering = session.offering
    course = offering.course

    return {
        "attendance_id": record.attendance_id,
        "session_id": record.session_id,
        "course_id": offering.course_id,
        "offering_id": offering.offering_id,
        "course_code": course.course_code,
        "course_name": course.course_name,
        "section": offering.section,
        "session_date": session.session_date.isoformat(),
        "status": record.status,
        "marked_at": (
            record.marked_at.isoformat()
            if record.marked_at
            else None
        ),
        "recognition_method": record.recognition_method,
    }


@student_attendance_bp.get("/")
@student_attendance_bp.get("/report")
@student_required
def get_my_attendance():
    """Return filtered and paginated attendance history."""
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    page, error = parse_positive_int("page", default=1)
    if error:
        return error

    per_page, error = parse_positive_int(
        "per_page",
        default=20,
        maximum=100,
    )
    if error:
        return error

    query, error = build_history_query(student.student_id)
    if error:
        return error

    total_records = query.count()
    total_pages = (
        ceil(total_records / per_page)
        if total_records
        else 0
    )

    records = (
        query
        .options(
            joinedload(AttendanceRecord.session)
            .joinedload(AttendanceSession.offering)
            .joinedload(CourseOffering.course)
        )
        .order_by(
            AttendanceSession.session_date.desc(),
            AttendanceRecord.marked_at.desc(),
            AttendanceRecord.attendance_id.desc(),
        )
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return jsonify({
        "success": True,
        "page": page,
        "per_page": per_page,
        "total_records": total_records,
        "total_pages": total_pages,
        "data": [
            serialize_record(record)
            for record in records
        ],
    }), 200


@student_attendance_bp.get("/summary")
@student_required
def get_attendance_summary():
    """Return attendance totals for the student's active enrollments."""
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    enrollments = (
        Enrollment.query
        .options(
            joinedload(Enrollment.offering)
            .joinedload(CourseOffering.course)
        )
        .filter_by(
            student_id=student.student_id,
            status="ACTIVE",
        )
        .all()
    )

    offering_ids = [
        enrollment.offering_id
        for enrollment in enrollments
        if enrollment.offering_id
    ]

    offering_sessions_map = defaultdict(list)
    all_closed_session_ids = set()

    if offering_ids:
        all_sessions = (
            AttendanceSession.query
            .filter(
                AttendanceSession.offering_id.in_(offering_ids),
                AttendanceSession.status == "CLOSED",
            )
            .all()
        )

        for session in all_sessions:
            offering_sessions_map[
                session.offering_id
            ].append(session.session_id)

            all_closed_session_ids.add(session.session_id)

    student_present_session_ids = set()

    if all_closed_session_ids:
        present_rows = (
            db.session.query(AttendanceRecord.session_id)
            .filter(
                AttendanceRecord.student_id == student.student_id,
                AttendanceRecord.session_id.in_(
                    all_closed_session_ids
                ),
                AttendanceRecord.status == "PRESENT",
            )
            .all()
        )

        student_present_session_ids = {
            row[0] for row in present_rows
        }

    data = []
    overall_total = 0
    overall_present = 0

    for enrollment in enrollments:
        offering = enrollment.offering

        if not offering:
            continue

        course = offering.course

        if not course:
            continue

        session_ids = offering_sessions_map[
            offering.offering_id
        ]

        total_sessions = len(session_ids)
        present_count = len(
            set(session_ids) & student_present_session_ids
        )

        present_count = min(present_count, total_sessions)
        absent_count = total_sessions - present_count

        percentage = (
            (present_count / total_sessions) * 100
            if total_sessions
            else 0
        )

        overall_total += total_sessions
        overall_present += present_count

        data.append({
            "offering_id": offering.offering_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "semester": offering.semester,
            "section": offering.section,
            "total_sessions": total_sessions,
            "present_sessions": present_count,
            "absent_sessions": absent_count,
            "attendance_percentage": round(percentage, 2),
        })

    overall_absent = overall_total - overall_present

    overall_percentage = (
        (overall_present / overall_total) * 100
        if overall_total
        else 0
    )

    return jsonify({
        "success": True,
        "overall": {
            "total_sessions": overall_total,
            "present_sessions": overall_present,
            "absent_sessions": overall_absent,
            "attendance_percentage": round(
                overall_percentage,
                2,
            ),
        },
        "data": data,
    }), 200
