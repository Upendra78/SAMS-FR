from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

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
        .order_by(
            AttendanceSession.session_date.desc(),
            AttendanceRecord.marked_at.desc(),
        )
        .all()
    )

    data = []

    for record in records:
        session = record.session
        offering = session.offering
        course = offering.course

        data.append({
            "attendance_id": record.attendance_id,
            "session_id": record.session_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "section": offering.section,
            "session_date": session.session_date.isoformat(),
            "status": record.status,
            "marked_at": record.marked_at.isoformat(),
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

        sessions = AttendanceSession.query.filter_by(
            offering_id=offering.offering_id,
            status="CLOSED",
        ).all()

        total_sessions = len(sessions)

        present_count = (
            AttendanceRecord.query
            .join(AttendanceSession)
            .filter(
                AttendanceRecord.student_id == student.student_id,
                AttendanceSession.offering_id == offering.offering_id,
                AttendanceSession.status == "CLOSED",
                AttendanceRecord.status == "PRESENT",
            )
            .count()
        )

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