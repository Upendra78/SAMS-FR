from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from app.models import(
    CourseOffering,
    Enrollment,
    Faculty,
    Student,
    TimetableEntry,
)
from app.utils.auth import admin_required, faculty_required, student_required

timetable_bp = Blueprint(
    "timetable",
    __name__,
    url_prefix = "/api/timetable",
)

def serialize_entry(entry):
    offering = entry.offering
    course = offering.course
    faculty = offering.faculty
    return {
       "timetable_entry_id": entry.timetable_entry_id,
        "day_of_week": entry.day_of_week,
        "start_time": entry.start_time.strftime("%H:%M"),
        "end_time": entry.end_time.strftime("%H:%M"),
        "room": entry.room or offering.room,
        "faculty_name": faculty.user.name,
        "department_name": (
            faculty.department.department_name
            if faculty.department
            else None
        ),
        "course_code": course.course_code,
        "course_name": course.course_name,
        "section": offering.section,
        "semester": offering.semester,
        "academic_year": offering.academic_year,
        "offering_id": offering.offering_id,
    }

def success_response(entries):
    return jsonify({
        "success": True,
        "count": len(entries),
        "data": [serialize_entry(entry) for entry in entries],
    }), 200

@timetable_bp.get("/admin")
@admin_required
def get_admin_timetable():
    entries = (
        TimetableEntry.query
        .join(CourseOffering)
        .order_by(
            TimetableEntry.day_of_week,
            TimetableEntry.start_time,
        )
        .all()
    )
    return success_response(entries)

@timetable_bp.get("/faculty")
@faculty_required
def get_faculty_timetable():
    user_id = int(get_jwt_identity())
    faculty = Faculty.query.filter_by(user_id = user_id).first()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404
    entries = (
        TimetableEntry.query
        .join(CourseOffering)
        .filter(CourseOffering.faculty_id == faculty.faculty_id)
        .order_by(
            TimetableEntry.day_of_week,
            TimetableEntry.start_time,
        )
        .all()
    )
    return success_response(entries)

@timetable_bp.get("/student")
@student_required
def get_studetn_timetable():
    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }),404
    offering_ids = [
        enrollment.offering_id
        for enrollment in Enrollment.query.filter_by(
            student_id = student.student_id,
            status = "ACTIVE",
        ).all()
    ]
    if not offering_ids:
        return success_response([])
    entries = (
        TimetableEntry.query
        .filter(TimetableEntry.offering_id.in_(offering_ids))
        .order_by(
            TimetableEntry.day_of_week,
            TimetableEntry.start_time,
        )
        .all()
    )
    return success_response(entries)