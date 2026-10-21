from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
    Enrollment,
    Faculty,
    Student,
)
from app.utils.auth import faculty_required
from app.utils.academic_year import canonical_academic_year, format_batch_cohort

MINIMUM_ATTENDANCE_PERCENTAGE = 75.0

reports_bp = Blueprint(
    "reports",
    __name__,
    url_prefix="/api/faculty/attendance/reports",
)


def get_current_faculty():
    user_id = int(get_jwt_identity())

    return Faculty.query.filter_by(
        user_id=user_id
    ).first()


@reports_bp.get("")
@faculty_required
def get_attendance_report():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    offering_id = request.args.get("offering_id", type=int)
    from_date_raw = request.args.get("from_date")
    to_date_raw = request.args.get("to_date")

    from_date = None
    to_date = None

    if from_date_raw:
        try:
            from_date = date.fromisoformat(from_date_raw)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "from_date must be in YYYY-MM-DD format",
            }), 400

    if to_date_raw:
        try:
            to_date = date.fromisoformat(to_date_raw)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "to_date must be in YYYY-MM-DD format",
            }), 400

    if from_date and to_date and from_date > to_date:
        return jsonify({
            "success": False,
            "message": "from_date cannot be later than to_date",
        }), 400

    offering_query = CourseOffering.query.filter_by(
        faculty_id=faculty.faculty_id
    )

    if offering_id is not None:
        offering_query = offering_query.filter_by(
            offering_id=offering_id
        )

    from collections import defaultdict
    from sqlalchemy.orm import joinedload
    from app.extensions import db

    offerings = (
        offering_query
        .options(joinedload(CourseOffering.course))
        .order_by(CourseOffering.offering_id.asc())
        .all()
    )

    if offering_id is not None and not offerings:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    report = []

    for offering in offerings:
        session_query = AttendanceSession.query.filter(
            AttendanceSession.offering_id == offering.offering_id,
            AttendanceSession.status == "CLOSED",
        )

        if from_date:
            session_query = session_query.filter(
                AttendanceSession.session_date >= from_date
            )

        if to_date:
            session_query = session_query.filter(
                AttendanceSession.session_date <= to_date
            )

        sessions = (
            session_query
            .order_by(AttendanceSession.session_date.asc())
            .all()
        )

        session_ids = [
            session.session_id
            for session in sessions
        ]

        total_sessions = len(session_ids)

        enrollments = (
            Enrollment.query
            .options(
                joinedload(Enrollment.student).joinedload(Student.user)
            )
            .filter_by(
                offering_id=offering.offering_id,
                status="ACTIVE",
            )
            .order_by(Enrollment.student_id.asc())
            .all()
        )

        counts_map = defaultdict(lambda: {"PRESENT": 0, "ABSENT": 0})
        if session_ids:
            record_counts = (
                db.session.query(
                    AttendanceRecord.student_id,
                    AttendanceRecord.status,
                    db.func.count(AttendanceRecord.attendance_id)
                )
                .filter(
                    AttendanceRecord.session_id.in_(session_ids),
                )
                .group_by(AttendanceRecord.student_id, AttendanceRecord.status)
                .all()
            )
            for s_id, st, cnt in record_counts:
                counts_map[s_id][st] = cnt

        students = []

        for enrollment in enrollments:
            student = enrollment.student

            present_count = counts_map[student.student_id]["PRESENT"]
            absent_count = counts_map[student.student_id]["ABSENT"]

            attendance_percentage = (
                (present_count / total_sessions) * 100
                if total_sessions > 0
                else 0
            )

            students.append({
                "student_id": student.student_id,
                "enrollment_no": student.enrollment_no,
                "student_name": student.user.name,
                "email": student.user.email,
                "batch_year": format_batch_cohort(student.batch.batch_name if student.batch else student.academic_year),
                "total_sessions": total_sessions,
                "present_sessions": present_count,
                "absent_sessions": absent_count,
                "attendance_percentage": round(
                    attendance_percentage,
                    2,
                ),
                "is_low_attendance": (
                    total_sessions > 0
                    and attendance_percentage
                    < MINIMUM_ATTENDANCE_PERCENTAGE
                ),
            })

        report.append({
            "offering_id": offering.offering_id,
            "course_id": offering.course_id,
            "course_code": offering.course.course_code if offering.course else "",
            "course_name": offering.course.course_name if offering.course else "",
            "semester": offering.semester,
            "section": offering.section,
            "academic_year": canonical_academic_year(offering.academic_year),
            "room": offering.room,
            "total_sessions": total_sessions,
            "minimum_attendance_percentage": (
                MINIMUM_ATTENDANCE_PERCENTAGE
            ),
            "students": students,
        })

    return jsonify({
        "success": True,
        "filters": {
            "offering_id": offering_id,
            "from_date": (
                from_date.isoformat()
                if from_date
                else None
            ),
            "to_date": (
                to_date.isoformat()
                if to_date
                else None
            ),
        },
        "data": report,
    }), 200
