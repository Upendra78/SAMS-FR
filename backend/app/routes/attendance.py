from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    CourseOffering,
    Enrollment,
    Faculty,
    Student,
    TimetableEntry,
)
from app.services.activity_service import record_activity
from app.utils.auth import faculty_required, faculty_or_admin_required


attendance_bp = Blueprint(
    "attendance",
    __name__,
    url_prefix="/api/faculty/attendance",
)


def get_current_faculty():
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None

    return Faculty.query.filter_by(
        user_id=user_id
    ).first()


def serialize_attendance_record(record):
    if not record:
        return None
    student = record.student
    student_name = student.user.name if (student and student.user) else f"Student #{record.student_id}"
    enrollment_no = student.enrollment_no if student else "N/A"
    return {
        "attendance_id": record.attendance_id,
        "session_id": record.session_id,
        "student_id": record.student_id,
        "student_name": student_name,
        "enrollment_no": enrollment_no,
        "status": record.status,
        "marked_at": record.marked_at.isoformat() if record.marked_at else None,
        "confidence_score": record.confidence_score,
        "recognition_method": record.recognition_method,
    }


def serialize_session(session):
    if not session:
        return None

    offering = session.offering
    course = offering.course if offering else None

    today_day = (
        session.session_date.strftime("%A")
        if session.session_date
        else datetime.now().strftime("%A")
    )
    timetable_entry = (
        TimetableEntry.query
        .filter(
            TimetableEntry.offering_id == session.offering_id,
            db.func.lower(TimetableEntry.day_of_week) == today_day.lower(),
        )
        .first()
    ) if session.offering_id else None

    if not timetable_entry and session.offering_id:
        timetable_entry = (
            TimetableEntry.query
            .filter_by(offering_id=session.offering_id)
            .order_by(TimetableEntry.timetable_entry_id.asc())
            .first()
        )

    room = (
        (timetable_entry.room if timetable_entry and timetable_entry.room else None)
        or (offering.room if offering else None)
    )

    start_time_val = (
        session.start_time
        or (timetable_entry.start_time if timetable_entry else None)
    )
    end_time_val = (
        session.end_time
        or (timetable_entry.end_time if timetable_entry else None)
    )

    return {
        "session_id": session.session_id,
        "offering_id": session.offering_id,
        "faculty_id": session.faculty_id,
        "session_date": session.session_date.isoformat() if session.session_date else None,
        "start_time": start_time_val.isoformat() if start_time_val else None,
        "end_time": end_time_val.isoformat() if end_time_val else None,
        "status": session.status,
        "room": room,
        "course_code": course.course_code if course else None,
        "course_name": course.course_name if course else None,
        "section": offering.section if offering else None,
    }


# ============================================================
# START ATTENDANCE SESSION
# ============================================================

@attendance_bp.post("/sessions")
@faculty_required
def start_attendance_session():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    data = request.get_json(silent=True) or {}

    offering_id = data.get("offering_id")

    if not offering_id:
        return jsonify({
            "success": False,
            "message": "offering_id is required",
        }), 400

    offering = db.session.get(
        CourseOffering,
        offering_id,
    )

    if not offering:
        return jsonify({
            "success": False,
            "message": "Course offering not found",
        }), 404

    if offering.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this course offering",
        }), 403

    # Verify the offering has eligible active enrollments.
    active_enrollments_count = (
        Enrollment.query
        .filter_by(
            offering_id=offering.offering_id,
            status="ACTIVE",
        )
        .count()
    )

    if active_enrollments_count == 0:
        return jsonify({
            "success": False,
            "message": "Cannot start attendance session: No active students are enrolled in this course offering",
        }), 400

    # Prevent multiple active sessions for the same faculty member.
    active_session = (
        AttendanceSession.query
        .filter_by(
            faculty_id=faculty.faculty_id,
            status="ACTIVE",
        )
        .order_by(
            AttendanceSession.session_id.desc()
        )
        .first()
    )

    if active_session:
        return jsonify({
            "success": False,
            "message": "An active attendance session already exists",
            "data": serialize_session(active_session),
        }), 409

    local_now = datetime.now()
    today_day = local_now.strftime("%A")

    # Extract faculty assigned session time from the timetable
    timetable_entry_id = data.get("timetable_entry_id")
    timetable_entry = None
    if timetable_entry_id:
        timetable_entry = db.session.get(TimetableEntry, timetable_entry_id)
        if timetable_entry and timetable_entry.offering_id != offering.offering_id:
            timetable_entry = None

    if not timetable_entry:
        timetable_entry = (
            TimetableEntry.query
            .filter(
                TimetableEntry.offering_id == offering.offering_id,
                db.func.lower(TimetableEntry.day_of_week) == today_day.lower(),
            )
            .first()
        )

    if not timetable_entry:
        timetable_entry = (
            TimetableEntry.query
            .filter_by(offering_id=offering.offering_id)
            .order_by(TimetableEntry.timetable_entry_id.asc())
            .first()
        )

    if timetable_entry:
        session_start = timetable_entry.start_time
        session_end = timetable_entry.end_time
    else:
        session_start = local_now.time()
        session_end = (local_now + timedelta(hours=1)).time()

    session = AttendanceSession(
        offering_id=offering.offering_id,
        faculty_id=faculty.faculty_id,
        session_date=local_now.date(),
        start_time=session_start,
        end_time=session_end,
        status="ACTIVE",
    )

    db.session.add(session)
    db.session.commit()

    record_activity(
        action_type="ATTENDANCE_SESSION_CREATED",
        description=f"Started attendance session for course offering {offering.offering_id}",
        actor_id=faculty.user_id if faculty else None,
        entity_type="AttendanceSession",
        entity_id=str(session.session_id),
    )

    return jsonify({
        "success": True,
        "message": "Attendance session started successfully",
        "data": serialize_session(session),
    }), 201


@attendance_bp.get("/sessions")
@faculty_required
def get_attendance_sessions():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    offering_id = request.args.get("offering_id", type=int)
    status_filter = request.args.get("status")
    session_date = request.args.get("date") or request.args.get("session_date")

    query = AttendanceSession.query.filter_by(faculty_id=faculty.faculty_id)

    if offering_id:
        query = query.filter(AttendanceSession.offering_id == offering_id)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(AttendanceSession.status == status_filter.upper())
    if session_date:
        query = query.filter(AttendanceSession.session_date == session_date)

    query = query.order_by(
        AttendanceSession.session_date.desc(),
        AttendanceSession.session_id.desc(),
    )

    page = request.args.get("page", type=int)
    per_page = request.args.get("per_page", type=int)

    if page is not None and per_page is not None:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            "success": True,
            "data": [serialize_session(s) for s in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "per_page": pagination.per_page,
            "pages": pagination.pages,
        }), 200

    sessions = query.all()

    return jsonify({
        "success": True,
        "data": [serialize_session(session) for session in sessions],
    }), 200


# ============================================================
# GET FACULTY ATTENDANCE OVERVIEW
# ============================================================

@attendance_bp.get("/overview")
@faculty_required
def get_attendance_overview():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    local_now = datetime.now()
    today_date = local_now.date()

    # 1. Today's sessions count for this faculty
    today_sessions_count = (
        AttendanceSession.query
        .filter(
            AttendanceSession.faculty_id == faculty.faculty_id,
            AttendanceSession.session_date == today_date,
        )
        .count()
    )

    # 2. Active session check
    active_session = (
        AttendanceSession.query
        .filter_by(
            faculty_id=faculty.faculty_id,
            status="ACTIVE",
        )
        .order_by(AttendanceSession.session_id.desc())
        .first()
    )

    # 3. Contextual target session for attendance stats
    session_id_param = request.args.get("session_id", type=int)
    target_session = None

    if session_id_param:
        target_session = (
            AttendanceSession.query
            .filter_by(
                session_id=session_id_param,
                faculty_id=faculty.faculty_id,
            )
            .first()
        )
        if not target_session:
            return jsonify({
                "success": False,
                "message": "Session not found or not authorized for this faculty",
            }), 404
    else:
        # Default context: active session, or most recent session, or None
        target_session = (
            active_session
            or AttendanceSession.query
            .filter_by(faculty_id=faculty.faculty_id)
            .order_by(
                AttendanceSession.session_date.desc(),
                AttendanceSession.session_id.desc(),
            )
            .first()
        )

    # 4. Compute statistics for target session
    if target_session:
        enrolled_count = (
            Enrollment.query
            .filter_by(
                offering_id=target_session.offering_id,
                status="ACTIVE",
            )
            .count()
        )

        present_count = (
            AttendanceRecord.query
            .filter(
                AttendanceRecord.session_id == target_session.session_id,
                AttendanceRecord.status.in_(["PRESENT", "LATE"]),
            )
            .count()
        )

        if target_session.status == "CLOSED":
            absent_count = (
                AttendanceRecord.query
                .filter_by(
                    session_id=target_session.session_id,
                    status="ABSENT",
                )
                .count()
            )
        else:
            absent_count = max(0, enrolled_count - present_count)

        total_recorded = (
            AttendanceRecord.query
            .filter_by(session_id=target_session.session_id)
            .count()
        )

        attendance_rate = (
            round((present_count / enrolled_count) * 100, 1)
            if enrolled_count > 0
            else None
        )
    else:
        enrolled_count = 0
        present_count = 0
        absent_count = 0
        total_recorded = 0
        attendance_rate = None

    return jsonify({
        "success": True,
        "data": {
            "today_sessions": today_sessions_count,
            "active_sessions": 1 if active_session else 0,
            "has_active_session": bool(active_session),
            "active_session": serialize_session(active_session) if active_session else None,
            "selected_session": serialize_session(target_session) if target_session else None,
            "students_present": present_count,
            "students_absent": absent_count,
            "total_enrolled": enrolled_count,
            "total_recorded": total_recorded,
            "attendance_rate": attendance_rate,
        },
    }), 200


# ============================================================
# GET ACTIVE ATTENDANCE SESSION
# ============================================================

@attendance_bp.get("/sessions/active")
@faculty_required
def get_active_attendance_session():
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = (
        AttendanceSession.query
        .filter_by(
            faculty_id=faculty.faculty_id,
            status="ACTIVE",
        )
        .order_by(
            AttendanceSession.session_id.desc()
        )
        .first()
    )

    if not session:
        return jsonify({
            "success": True,
            "message": "No active attendance session",
            "data": None,
        }), 200

    return jsonify({
        "success": True,
        "data": serialize_session(session),
    }), 200


# ============================================================
# CLOSE ATTENDANCE SESSION
# ============================================================

@attendance_bp.post("/sessions/<int:session_id>/close")
@faculty_required
def close_attendance_session(session_id):
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    if session.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this session",
        }), 403

    if session.status != "ACTIVE":
        return jsonify({
            "success": False,
            "message": "Attendance session is already closed",
        }), 409

    # Find all actively enrolled students for this course offering.
    active_enrollments = Enrollment.query.filter_by(
        offering_id=session.offering_id,
        status="ACTIVE",
    ).all()

    # Find students whose attendance has already been recorded.
    existing_records = AttendanceRecord.query.filter_by(
        session_id=session.session_id,
    ).all()

    recorded_student_ids = {
        record.student_id for record in existing_records
    }

    local_now = datetime.now()

    # Automatically mark students without an attendance record as ABSENT.
    for enrollment in active_enrollments:
        if enrollment.student_id not in recorded_student_ids:
            absent_record = AttendanceRecord(
                session_id=session.session_id,
                student_id=enrollment.student_id,
                status="ABSENT",
                marked_at=datetime.now(timezone.utc).replace(tzinfo=None),
                recognition_method="SYSTEM",
            )
            db.session.add(absent_record)

    # Close the session and save all absence records together.
    if not session.end_time:
        session.end_time = local_now.time()
    session.status = "CLOSED"

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify({
        "success": True,
        "message": "Attendance session closed successfully",
        "data": serialize_session(session),
    }), 200


# ============================================================
# MARK ATTENDANCE RECORD / MANUAL CORRECTION
# ============================================================

@attendance_bp.post("/sessions/<int:session_id>/records")
@faculty_or_admin_required
def mark_attendance(session_id):
    claims = get_jwt()
    user_role = claims.get("role")

    if user_role == "FACULTY":
        return jsonify({
            "success": False,
            "message": "Manual attendance marking by faculty is disabled. Attendance must be recorded via face recognition.",
        }), 403

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    data = request.get_json(silent=True) or {}

    student_id = data.get("student_id")
    status_val = str(data.get("status", "PRESENT")).upper().strip()
    confidence_score = data.get("confidence_score")
    recognition_method = str(data.get("recognition_method", "MANUAL")).upper().strip()
    allow_update = data.get("allow_update", True)

    if not student_id:
        return jsonify({
            "success": False,
            "message": "student_id is required",
        }), 400

    if status_val not in {"PRESENT", "ABSENT", "LATE"}:
        return jsonify({
            "success": False,
            "message": "Invalid status. Must be PRESENT, ABSENT, or LATE",
        }), 400

    if recognition_method not in {"FACE", "MANUAL", "SYSTEM"}:
        return jsonify({
            "success": False,
            "message": "Invalid recognition_method",
        }), 400

    # Face capture requires active session; manual correction is permitted on active or closed sessions
    if recognition_method == "FACE" and session.status != "ACTIVE":
        return jsonify({
            "success": False,
            "message": "Attendance session is not active",
        }), 409

    student = db.session.get(
        Student,
        student_id,
    )

    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    enrollment = Enrollment.query.filter_by(
        student_id=student_id,
        offering_id=session.offering_id,
        status="ACTIVE",
    ).first()

    if not enrollment:
        return jsonify({
            "success": False,
            "message": "Student is not enrolled in this course",
        }), 403

    existing_record = AttendanceRecord.query.filter_by(
        session_id=session_id,
        student_id=student_id,
    ).first()

    if existing_record:
        if not allow_update:
            return jsonify({
                "success": False,
                "message": "Attendance already marked for this student",
            }), 409

        existing_record.status = status_val
        existing_record.recognition_method = recognition_method
        existing_record.marked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        if confidence_score is not None:
            try:
                existing_record.confidence_score = float(confidence_score)
            except (TypeError, ValueError):
                pass
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Attendance record updated successfully",
            "data": serialize_attendance_record(existing_record),
        }), 200

    if confidence_score is not None:
        try:
            confidence_score = float(confidence_score)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "confidence_score must be a number",
            }), 400

        if not 0.0 <= confidence_score <= 1.0:
            return jsonify({
                "success": False,
                "message": "confidence_score must be between 0 and 1",
            }), 400

    record = AttendanceRecord(
        session_id=session_id,
        student_id=student_id,
        status=status_val,
        marked_at=datetime.now(timezone.utc).replace(tzinfo=None),
        confidence_score=confidence_score,
        recognition_method=recognition_method,
    )

    db.session.add(record)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance marked successfully",
        "data": serialize_attendance_record(record),
    }), 201


# ============================================================
# UPDATE / CORRECT ATTENDANCE RECORD (PATCH)
# ============================================================

@attendance_bp.patch("/sessions/<int:session_id>/records/<int:student_id>")
@faculty_or_admin_required
def update_attendance_record(session_id, student_id):
    claims = get_jwt()
    user_role = claims.get("role")

    if user_role == "FACULTY":
        return jsonify({
            "success": False,
            "message": "Manual attendance marking by faculty is disabled. Attendance must be recorded via face recognition.",
        }), 403

    session = db.session.get(AttendanceSession, session_id)
    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    student = db.session.get(Student, student_id)
    if not student:
        return jsonify({
            "success": False,
            "message": "Student not found",
        }), 404

    enrollment = Enrollment.query.filter_by(
        student_id=student_id,
        offering_id=session.offering_id,
        status="ACTIVE",
    ).first()

    if not enrollment:
        return jsonify({
            "success": False,
            "message": "Student is not enrolled in this course",
        }), 403

    data = request.get_json(silent=True) or {}
    status_val = str(data.get("status", "PRESENT")).upper().strip()
    if status_val not in {"PRESENT", "ABSENT", "LATE"}:
        return jsonify({
            "success": False,
            "message": "Invalid status. Must be PRESENT, ABSENT, or LATE",
        }), 400

    recognition_method = str(data.get("recognition_method", "MANUAL")).upper().strip()
    if recognition_method not in {"FACE", "MANUAL", "SYSTEM"}:
        recognition_method = "MANUAL"

    record = AttendanceRecord.query.filter_by(
        session_id=session_id,
        student_id=student_id,
    ).first()

    if not record:
        record = AttendanceRecord(
            session_id=session_id,
            student_id=student_id,
            status=status_val,
            marked_at=datetime.now(timezone.utc).replace(tzinfo=None),
            confidence_score=None,
            recognition_method=recognition_method,
        )
        db.session.add(record)
    else:
        record.status = status_val
        record.recognition_method = recognition_method
        record.marked_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Attendance record updated successfully",
        "data": serialize_attendance_record(record),
    }), 200


# ============================================================
# GET SESSION ATTENDANCE RECORDS
# ============================================================

@attendance_bp.get("/sessions/<int:session_id>/records")
@faculty_required
def get_session_attendance(session_id):
    faculty = get_current_faculty()

    if not faculty:
        return jsonify({
            "success": False,
            "message": "Faculty profile not found",
        }), 404

    session = db.session.get(
        AttendanceSession,
        session_id,
    )

    if not session:
        return jsonify({
            "success": False,
            "message": "Attendance session not found",
        }), 404

    if session.faculty_id != faculty.faculty_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized for this session",
        }), 403

    records = (
        AttendanceRecord.query
        .filter_by(session_id=session_id)
        .order_by(AttendanceRecord.marked_at.asc())
        .all()
    )

    data = [serialize_attendance_record(record) for record in records]

    return jsonify({
        "success": True,
        "data": data,
    }), 200