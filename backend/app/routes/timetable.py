from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    CourseOffering,
    Enrollment,
    Faculty,
    FacultyAdjustment,
    Student,
    TimetableEntry,
)
from app.utils.auth import admin_required, faculty_required, student_required

timetable_bp = Blueprint(
    "timetable",
    __name__,
    url_prefix="/api/timetable",
)


def serialize_entry(entry):
    offering = entry.offering
    course = offering.course if offering else None
    faculty = offering.faculty if offering else None

    # Check for latest approved faculty adjustment
    latest_adjustment = (
        FacultyAdjustment.query.filter_by(
            timetable_entry_id=entry.timetable_entry_id,
            status="APPROVED",
        )
        .order_by(FacultyAdjustment.effective_date.desc(), FacultyAdjustment.created_at.desc())
        .first()
    )

    adjustment_data = latest_adjustment.to_dict() if latest_adjustment else None

    return {
        "timetable_entry_id": entry.timetable_entry_id,
        "day_of_week": entry.day_of_week,
        "start_time": entry.start_time.strftime("%H:%M") if entry.start_time else "",
        "end_time": entry.end_time.strftime("%H:%M") if entry.end_time else "",
        "room": entry.room or (offering.room if offering else "Not assigned"),
        "faculty_id": faculty.faculty_id if faculty else None,
        "faculty_name": (
            faculty.user.name
            if faculty and faculty.user
            else "Not assigned"
        ),
        "department_name": (
            faculty.department.department_name
            if faculty and faculty.department
            else ""
        ),
        "course_code": course.course_code if course else "",
        "course_name": course.course_name if course else "",
        "section": offering.section if offering else "",
        "semester": offering.semester if offering else None,
        "academic_year": offering.academic_year if offering else "",
        "offering_id": offering.offering_id if offering else None,
        "active_adjustment": adjustment_data,
        "effective_faculty_name": (
            adjustment_data["substitute_faculty_name"]
            if adjustment_data
            else (faculty.user.name if faculty and faculty.user else "Not assigned")
        ),
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
    faculty = Faculty.query.filter_by(user_id=user_id).first()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    offering_id = request.args.get("offering_id", type=int)

    substitute_entry_ids = [
        adj.timetable_entry_id
        for adj in FacultyAdjustment.query.filter_by(
            substitute_faculty_id=faculty.faculty_id,
            status="APPROVED",
        ).all()
    ]

    query = (
        TimetableEntry.query
        .join(CourseOffering)
        .filter(
            db.or_(
                CourseOffering.faculty_id == faculty.faculty_id,
                TimetableEntry.timetable_entry_id.in_(substitute_entry_ids),
            ) if substitute_entry_ids else (CourseOffering.faculty_id == faculty.faculty_id)
        )
    )

    if offering_id is not None:
        query = query.filter(TimetableEntry.offering_id == offering_id)

    entries = (
        query
        .order_by(
            TimetableEntry.day_of_week,
            TimetableEntry.start_time,
        )
        .all()
    )
    return success_response(entries)


@timetable_bp.get("/student")
@student_required
def get_student_timetable():
    user_id = int(get_jwt_identity())
    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        return jsonify({
            "success": False,
            "message": "Student profile not found",
        }), 404

    offering_ids = [
        enrollment.offering_id
        for enrollment in Enrollment.query.filter_by(
            student_id=student.student_id,
            status="ACTIVE",
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


# =========================================================
# FACULTY ADJUSTMENT ENDPOINTS
# =========================================================

@timetable_bp.get("/adjustments")
@admin_required
def get_faculty_adjustments():
    """
    Returns faculty adjustments audit history.
    """
    entry_id = request.args.get("timetable_entry_id", type=int)
    status = request.args.get("status")

    query = FacultyAdjustment.query

    if entry_id:
        query = query.filter_by(timetable_entry_id=entry_id)
    if status:
        query = query.filter_by(status=status.upper())

    adjustments = query.order_by(FacultyAdjustment.created_at.desc()).all()

    return jsonify({
        "success": True,
        "count": len(adjustments),
        "data": [adj.to_dict() for adj in adjustments],
    }), 200


@timetable_bp.post("/adjustments")
@admin_required
def create_faculty_adjustment():
    """
    Creates an emergency faculty adjustment for a specific timetable class
    without destroying the original course offering or timetable assignment.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "JSON payload required."}), 400

    timetable_entry_id = data.get("timetable_entry_id")
    substitute_faculty_id = data.get("substitute_faculty_id")
    effective_date_str = data.get("effective_date")
    reason = str(data.get("reason") or "").strip()
    request_approval = bool(data.get("request_approval", False))

    if not timetable_entry_id:
        return jsonify({"success": False, "message": "A specific timetable class must be selected."}), 400

    entry = db.session.get(TimetableEntry, timetable_entry_id)
    if not entry:
        return jsonify({"success": False, "message": "Selected timetable entry not found."}), 404

    offering = entry.offering
    if not offering:
        return jsonify({"success": False, "message": "Course offering for entry not found."}), 404

    original_faculty_id = offering.faculty_id
    if not original_faculty_id:
        return jsonify({
            "success": False,
            "message": "The selected class does not have an original faculty assigned to replace.",
        }), 400

    if not substitute_faculty_id:
        return jsonify({"success": False, "message": "Please choose a valid substitute faculty member."}), 400

    if int(substitute_faculty_id) == int(original_faculty_id):
        return jsonify({
            "success": False,
            "message": "The substitute faculty must be different from the currently assigned faculty.",
        }), 400

    substitute_faculty = db.session.get(Faculty, substitute_faculty_id)
    if not substitute_faculty:
        return jsonify({"success": False, "message": "Substitute faculty record not found."}), 404

    if not reason:
        return jsonify({"success": False, "message": "Reason for faculty adjustment is required."}), 400

    if not effective_date_str:
        return jsonify({"success": False, "message": "Effective date is required."}), 400

    try:
        effective_date = datetime.strptime(effective_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Conflict check 1: Substitute faculty's regular timetable overlap
    substitute_entries = (
        TimetableEntry.query
        .join(CourseOffering)
        .filter(
            CourseOffering.faculty_id == substitute_faculty_id,
            TimetableEntry.day_of_week == entry.day_of_week,
            TimetableEntry.timetable_entry_id != entry.timetable_entry_id,
        )
        .all()
    )
    for se in substitute_entries:
        if max(entry.start_time, se.start_time) < min(entry.end_time, se.end_time):
            course_label = se.offering.course.course_code if se.offering and se.offering.course else "another class"
            return jsonify({
                "success": False,
                "message": (
                    f"Substitute faculty {substitute_faculty.user.name} already has a scheduled class "
                    f"({course_label}) on {entry.day_of_week} ({se.start_time.strftime('%H:%M')}–{se.end_time.strftime('%H:%M')})."
                ),
            }), 409

    # Conflict check 2: Substitute faculty's other active adjustments on the same date and overlapping time
    other_adjustments = (
        FacultyAdjustment.query
        .filter(
            FacultyAdjustment.substitute_faculty_id == substitute_faculty_id,
            FacultyAdjustment.effective_date == effective_date,
            FacultyAdjustment.status == "APPROVED",
            FacultyAdjustment.timetable_entry_id != entry.timetable_entry_id,
        )
        .all()
    )
    for adj in other_adjustments:
        other_entry = adj.timetable_entry
        if other_entry and other_entry.day_of_week == entry.day_of_week:
            if max(entry.start_time, other_entry.start_time) < min(entry.end_time, other_entry.end_time):
                return jsonify({
                    "success": False,
                    "message": (
                        f"Substitute faculty {substitute_faculty.user.name} is already substituting for another class "
                        f"on {effective_date_str} at this time ({other_entry.start_time.strftime('%H:%M')}–{other_entry.end_time.strftime('%H:%M')})."
                    ),
                }), 409

    admin_user_id = int(get_jwt_identity())
    adjustment_status = "PENDING" if request_approval else "APPROVED"

    adjustment = FacultyAdjustment(
        timetable_entry_id=entry.timetable_entry_id,
        original_faculty_id=original_faculty_id,
        substitute_faculty_id=substitute_faculty_id,
        adjusted_by_user_id=admin_user_id,
        effective_date=effective_date,
        reason=reason,
        status=adjustment_status,
        created_at=datetime.utcnow(),
    )

    db.session.add(adjustment)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": (
            f"Faculty adjustment successfully recorded for {substitute_faculty.user.name}. "
            f"Original assignment preserved in audit log."
        ),
        "data": adjustment.to_dict(),
    }), 201


@timetable_bp.post("/adjustments/<int:adjustment_id>/cancel")
@admin_required
def cancel_faculty_adjustment(adjustment_id):
    """
    Cancels an active or pending faculty adjustment.
    """
    adjustment = db.session.get(FacultyAdjustment, adjustment_id)
    if not adjustment:
        return jsonify({"success": False, "message": "Adjustment record not found."}), 404

    adjustment.status = "CANCELLED"
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Faculty adjustment has been cancelled. Timetable reverted to original assignment.",
        "data": adjustment.to_dict(),
    }), 200