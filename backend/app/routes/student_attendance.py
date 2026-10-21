from flask import Blueprint, jsonify
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
    user_id = int(get_jwt_identity())

    return Student.query.filter_by(
        user_id=user_id
    ).first()


@student_attendance_bp.get("/")
@student_required
def get_my_attendance():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    records = (
        AttendanceRecord.query
        .filter_by(student_id=student.student_id)
        .join(AttendanceSession)
        .options(
            joinedload(AttendanceRecord.session)
            .joinedload(AttendanceSession.offering)
            .joinedload(CourseOffering.course)
        )
        .order_by(
            AttendanceSession.session_date.desc(),
            AttendanceRecord.marked_at.desc(),
        )
        .all()
    )

    data = []

    for record in records:
        session = record.session
        offering = session.offering if session else None
        course = offering.course if offering else None

        data.append({
            "attendance_id": record.attendance_id,
            "session_id": record.session_id,
            "course_code": course.course_code if course else "",
            "course_name": course.course_name if course else "",
            "section": offering.section if offering else "",
            "session_date": session.session_date.isoformat() if session else "",
            "status": record.status,
            "marked_at": record.marked_at.isoformat() if record.marked_at else "",
            "recognition_method": record.recognition_method,
        })

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@student_attendance_bp.get("/summary")
@student_required
def get_attendance_summary():
    student = get_current_student()

    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    enrollments = (
        Enrollment.query
        .options(
            joinedload(Enrollment.offering).joinedload(CourseOffering.course)
        )
        .filter_by(
            student_id=student.student_id,
            status="ACTIVE",
        )
        .all()
    )

    offering_ids = [e.offering_id for e in enrollments if e.offering_id]

    from collections import defaultdict
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
        for s in all_sessions:
            offering_sessions_map[s.offering_id].append(s.session_id)
            all_closed_session_ids.add(s.session_id)

    student_present_session_ids = set()
    if all_closed_session_ids:
        pres_rows = (
            db.session.query(AttendanceRecord.session_id)
            .filter(
                AttendanceRecord.student_id == student.student_id,
                AttendanceRecord.session_id.in_(all_closed_session_ids),
                AttendanceRecord.status == "PRESENT",
            )
            .all()
        )
        student_present_session_ids = {r[0] for r in pres_rows}

    data = []

    for enrollment in enrollments:
        offering = enrollment.offering
        if not offering:
            continue
        course = offering.course
        if not course:
            continue

        session_ids = offering_sessions_map[offering.offering_id]
        total_sessions = len(session_ids)
        present_count = len(set(session_ids) & student_present_session_ids)

        attendance_percentage = (
            (present_count / total_sessions) * 100
            if total_sessions > 0
            else 0
        )

        data.append({
            "offering_id": offering.offering_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "semester": offering.semester,
            "section": offering.section,
            "total_sessions": total_sessions,
            "present_sessions": present_count,
            "absent_sessions": total_sessions - present_count,
            "attendance_percentage": round(
                attendance_percentage,
                2,
            ),
        })

    return jsonify({
        "success": True,
        "data": data,
    }), 200