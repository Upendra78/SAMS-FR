from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
    Enrollment,
    Faculty,
)
from app.utils.auth import faculty_required


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

    offerings = (
        offering_query
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
            .filter_by(
                offering_id=offering.offering_id,
                status="ACTIVE",
            )
            .order_by(Enrollment.student_id.asc())
            .all()
        )

        students = []

        for enrollment in enrollments:
            student = enrollment.student

            present_count = 0
            absent_count = 0

            if session_ids:
                present_count = (
                    AttendanceRecord.query
                    .filter(
                        AttendanceRecord.student_id
                        == student.student_id,
                        AttendanceRecord.session_id.in_(
                            session_ids
                        ),
                        AttendanceRecord.status == "PRESENT",
                    )
                    .count()
                )

                absent_count = (
                    AttendanceRecord.query
                    .filter(
                        AttendanceRecord.student_id
                        == student.student_id,
                        AttendanceRecord.session_id.in_(
                            session_ids
                        ),
                        AttendanceRecord.status == "ABSENT",
                    )
                    .count()
                )

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
                "total_sessions": total_sessions,
                "present_sessions": present_count,
                "absent_sessions": absent_count,
                "attendance_percentage": round(
                    attendance_percentage,
                    2,
                ),
            })

        report.append({
            "offering_id": offering.offering_id,
            "course_id": offering.course_id,
            "course_code": offering.course.course_code,
            "course_name": offering.course.course_name,
            "semester": offering.semester,
            "section": offering.section,
            "academic_year": offering.academic_year,
            "room": offering.room,
            "total_sessions": total_sessions,
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
