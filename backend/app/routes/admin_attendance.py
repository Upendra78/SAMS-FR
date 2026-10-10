from datetime import date

from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
)
from app.utils.auth import admin_required


admin_attendance_bp = Blueprint(
    "admin_attendance",
    __name__,
    url_prefix="/api/admin/attendance",
)


@admin_attendance_bp.get("/sessions")
@admin_required
def get_attendance_sessions():
    status = request.args.get("status")
    offering_id = request.args.get("offering_id", type=int)
    faculty_id = request.args.get("faculty_id", type=int)
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

    query = AttendanceSession.query

    if status:
        if status not in {"ACTIVE", "CLOSED"}:
            return jsonify({
                "success": False,
                "message": "status must be ACTIVE or CLOSED",
            }), 400

        query = query.filter(
            AttendanceSession.status == status
        )

    if offering_id is not None:
        query = query.filter(
            AttendanceSession.offering_id == offering_id
        )

    if faculty_id is not None:
        query = query.filter(
            AttendanceSession.faculty_id == faculty_id
        )

    if from_date:
        query = query.filter(
            AttendanceSession.session_date >= from_date
        )

    if to_date:
        query = query.filter(
            AttendanceSession.session_date <= to_date
        )

    sessions = (
        query
        .order_by(
            AttendanceSession.session_date.desc(),
            AttendanceSession.session_id.desc(),
        )
        .all()
    )

    data = []

    for session in sessions:
        offering = session.offering

        data.append({
            "session_id": session.session_id,
            "offering_id": session.offering_id,
            "faculty_id": session.faculty_id,
            "session_date": session.session_date.isoformat(),
            "start_time": session.start_time.isoformat(),
            "end_time": (
                session.end_time.isoformat()
                if session.end_time
                else None
            ),
            "status": session.status,
            "created_at": session.created_at.isoformat(),
            "course": {
                "course_id": offering.course.course_id,
                "course_code": offering.course.course_code,
                "course_name": offering.course.course_name,
            },
            "offering": {
                "academic_year": offering.academic_year,
                "semester": offering.semester,
                "section": offering.section,
                "room": offering.room,
            },
            "attendance_count": len(
                session.attendance_records
            ),
        })

    return jsonify({
        "success": True,
        "count": len(data),
        "filters": {
            "status": status,
            "offering_id": offering_id,
            "faculty_id": faculty_id,
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
        "data": data,
    }), 200


@admin_attendance_bp.get("/sessions/<int:session_id>")
@admin_required
def get_attendance_session(session_id):
    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    offering = session.offering

    return jsonify({
        "success": True,
        "data": {
            "session_id": session.session_id,
            "offering_id": session.offering_id,
            "faculty_id": session.faculty_id,
            "session_date": session.session_date.isoformat(),
            "start_time": session.start_time.isoformat(),
            "end_time": (
                session.end_time.isoformat()
                if session.end_time
                else None
            ),
            "status": session.status,
            "created_at": session.created_at.isoformat(),
            "course": {
                "course_id": offering.course.course_id,
                "course_code": offering.course.course_code,
                "course_name": offering.course.course_name,
            },
            "offering": {
                "academic_year": offering.academic_year,
                "semester": offering.semester,
                "section": offering.section,
                "room": offering.room,
            },
            "attendance_count": len(
                session.attendance_records
            ),
        },
    }), 200


@admin_attendance_bp.get(
    "/sessions/<int:session_id>/records"
)
@admin_required
def get_attendance_records(session_id):
    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    records = (
        AttendanceRecord.query
        .filter_by(session_id=session_id)
        .order_by(AttendanceRecord.marked_at.asc())
        .all()
    )

    data = []

    for record in records:
        student = record.student

        data.append({
            "attendance_id": record.attendance_id,
            "student_id": record.student_id,
            "student": {
                "student_id": student.student_id,
                "name": student.user.name,
                "enrollment_no": student.enrollment_no,
            },
            "status": record.status,
            "marked_at": record.marked_at.isoformat(),
            "confidence_score": record.confidence_score,
            "recognition_method": record.recognition_method,
        })

    return jsonify({
        "success": True,
        "session_id": session_id,
        "count": len(data),
        "data": data,
    }), 200

