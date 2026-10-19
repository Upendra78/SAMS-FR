
from datetime import datetime, time
from io import BytesIO
import re

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity
from openpyxl import load_workbook
from sqlalchemy import func, or_

from app.extensions import db
from app.models import Course, CourseOffering, Faculty, Student, TimetableEntry, User
from app.utils.auth import admin_required

timetable_import_bp = Blueprint(
    "timetable_import",
    __name__,
    url_prefix="/api/timetable/import",
)

SHEET_NAME = "05.10.2026 Updated Time Table"
MAX_FILE_SIZE = 10 * 1024 * 1024

# Time range pattern supporting:
# "09:30 AM - 10:30 AM", "9:30am - 10:30am", "09:30-10:30", "9:30 to 10:30", en-dash and em-dash
TIME_PATTERN_12H = re.compile(
    r"^\s*(\d{1,2}:\d{2}\s*[ap]m)\s*(?:-|–|—|to)\s*(\d{1,2}:\d{2}\s*[ap]m)\s*$",
    re.IGNORECASE,
)
TIME_PATTERN_24H = re.compile(
    r"^\s*(\d{1,2}:\d{2})\s*(?:-|–|—|to)\s*(\d{1,2}:\d{2})\s*$",
    re.IGNORECASE,
)

COURSE_CODE_PATTERN = re.compile(
    r"\b([A-Z]{2,6}[-\s]?\d{3,4}[A-Z]?)\b",
    re.IGNORECASE,
)
ROOM_PATTERN = re.compile(
    r"\b(?:Room|Rm|Lab|Hall)[-\s]*([A-Za-z0-9\-]+)|\b([RL][-\s]*\d{2,4})\b",
    re.IGNORECASE,
)
FACULTY_TITLE_PATTERN = re.compile(
    r"\b(?:Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)",
    re.IGNORECASE,
)

DAY_NORMALIZATION = {
    "MON": "Monday",
    "MONDAY": "Monday",
    "TUE": "Tuesday",
    "TUES": "Tuesday",
    "TUESDAY": "Tuesday",
    "WED": "Wednesday",
    "WEDNESDAY": "Wednesday",
    "THU": "Thursday",
    "THUR": "Thursday",
    "THURS": "Thursday",
    "THURSDAY": "Thursday",
    "THRUSDAY": "Thursday",
    "FRI": "Friday",
    "FRIDAY": "Friday",
    "SAT": "Saturday",
    "SATURDAY": "Saturday",
    "SUN": "Sunday",
    "SUNDAY": "Sunday",
}


def clean(value):
    if value is None:
        return ""
    return str(value).strip()


def normalize_day(value):
    cleaned = clean(value).upper()
    return DAY_NORMALIZATION.get(cleaned, cleaned.capitalize() if cleaned else "")


def parse_time_range(value):
    val_clean = clean(value)
    if not val_clean:
        return None, None

    match_12 = TIME_PATTERN_12H.match(val_clean)
    if match_12:
        try:
            start = datetime.strptime(
                match_12.group(1).replace(" ", "").lower(),
                "%I:%M%p",
            ).strftime("%H:%M")
            end = datetime.strptime(
                match_12.group(2).replace(" ", "").lower(),
                "%I:%M%p",
            ).strftime("%H:%M")
            return start, end
        except ValueError:
            pass

    match_24 = TIME_PATTERN_24H.match(val_clean)
    if match_24:
        try:
            start_parts = [int(p) for p in match_24.group(1).split(":")]
            end_parts = [int(p) for p in match_24.group(2).split(":")]
            start = f"{start_parts[0]:02d}:{start_parts[1]:02d}"
            end = f"{end_parts[0]:02d}:{end_parts[1]:02d}"
            return start, end
        except (ValueError, IndexError):
            pass

    return None, None


def string_to_time(val):
    if isinstance(val, time):
        return val
    parts = str(val).split(":")
    return time(int(parts[0]), int(parts[1]))


def time_ranges_overlap(start1, end1, start2, end2):
    s1, e1 = string_to_time(start1), string_to_time(end1)
    s2, e2 = string_to_time(start2), string_to_time(end2)
    return max(s1, s2) < min(e1, e2)


def get_workbook_sheet(workbook, requested_sheet=None):
    if requested_sheet and requested_sheet in workbook.sheetnames:
        return workbook[requested_sheet], requested_sheet

    if SHEET_NAME in workbook.sheetnames:
        return workbook[SHEET_NAME], SHEET_NAME

    # Look for any sheet containing 'timetable' or 'time table'
    for name in workbook.sheetnames:
        if "timetable" in name.lower() or "time table" in name.lower():
            return workbook[name], name

    # Fallback to the first sheet
    return workbook[workbook.sheetnames[0]], workbook.sheetnames[0]


def find_timetable_header_row(sheet, max_search_rows=10):
    for r in range(1, min(max_search_rows + 1, sheet.max_row + 1)):
        row_vals = [
            clean(sheet.cell(row=r, column=col).value).upper()
            for col in range(1, min(10, sheet.max_column + 1))
        ]
        if row_vals and row_vals[0] == "DAY":
            # Check for timings or period in the first few columns
            has_period = any(
                p in row_vals for p in ["P.NO.", "P.NO", "PERIOD", "PERIOD NO", "P. NO."]
            )
            has_timings = any(
                "TIMING" in val or "TIME" in val for val in row_vals
            )
            if has_period or has_timings:
                return r
    return 3


def extract_cell_components(raw_cell, courses, faculty_members):
    """
    Extracts course, faculty, and room from raw timetable cell text.
    Uses database-backed entity dictionaries with longest-match priority,
    falling back to regex heuristics.
    """
    text = clean(raw_cell)
    if not text or text.upper() in {"LUNCH BREAK", "BREAK", "RECESS", "FREE", "LIBRARY", "SPORTS"}:
        return None

    extracted_room = None
    extracted_course = None
    extracted_faculty = None
    matched_course_candidates = []
    matched_faculty_candidates = []

    # 1. Extract Room
    room_match = ROOM_PATTERN.search(text)
    if room_match:
        extracted_room = room_match.group(0).strip()

    # 2. Match Course
    # Sort courses by code length descending to ensure BCSE-513L matches before BCSE-513
    courses_by_code_len = sorted(courses, key=lambda c: len(c.course_code), reverse=True)
    for c in courses_by_code_len:
        # Check boundary-aware or delimiter-aware match for code
        code_pattern = re.compile(
            r"(?<![A-Za-z0-9])" + re.escape(c.course_code) + r"(?![A-Za-z0-9])",
            re.IGNORECASE,
        )
        if code_pattern.search(text):
            matched_course_candidates.append(c)

    if not matched_course_candidates:
        # Match by normalized code without dash/space
        text_normalized = re.sub(r"[\s\-_]", "", text).lower()
        for c in courses_by_code_len:
            c_norm = re.sub(r"[\s\-_]", "", c.course_code).lower()
            if c_norm in text_normalized:
                matched_course_candidates.append(c)

    if not matched_course_candidates:
        # Match by course name
        courses_by_name_len = sorted(courses, key=lambda c: len(c.course_name), reverse=True)
        for c in courses_by_name_len:
            if len(c.course_name) >= 4 and c.course_name.lower() in text.lower():
                matched_course_candidates.append(c)

    # If code still not found, check regex heuristic
    if not matched_course_candidates:
        code_match = COURSE_CODE_PATTERN.search(text)
        if code_match and code_match.group(0).upper() not in {"ROOM", "TIME"}:
            raw_code_candidate = code_match.group(0).strip()
            # check if any course matches this candidate
            for c in courses:
                if c.course_code.upper() == raw_code_candidate.upper():
                    matched_course_candidates.append(c)

    if len(matched_course_candidates) == 1:
        extracted_course = matched_course_candidates[0]
    elif len(matched_course_candidates) > 1:
        # Check if one is an exact match for course_code
        exact = [c for c in matched_course_candidates if c.course_code.lower() == text.strip().lower()]
        if len(exact) == 1:
            extracted_course = exact[0]
            matched_course_candidates = [exact[0]]

    # 3. Match Faculty
    # Match by employee_id or user.name
    faculty_by_len = sorted(faculty_members, key=lambda f: len(f.user.name), reverse=True)
    for f in faculty_by_len:
        if f.employee_id.lower() in text.lower():
            matched_faculty_candidates.append(f)
            continue
        # Check name
        f_name = f.user.name.strip()
        f_name_clean = re.sub(r"^(?:Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s*", "", f_name, flags=re.IGNORECASE).strip()
        if f_name.lower() in text.lower() or (len(f_name_clean) >= 4 and f_name_clean.lower() in text.lower()):
            matched_faculty_candidates.append(f)

    if len(matched_faculty_candidates) == 1:
        extracted_faculty = matched_faculty_candidates[0]

    return {
        "raw_cell": text,
        "course": extracted_course,
        "course_candidates": matched_course_candidates,
        "faculty": extracted_faculty,
        "faculty_candidates": matched_faculty_candidates,
        "room": extracted_room,
    }


def parse_workbook_sheet(sheet, sheet_name, header_row):
    headers = [
        clean(sheet.cell(row=header_row, column=col).value)
        for col in range(1, sheet.max_column + 1)
    ]
    if (
        not headers
        or headers[0].upper() != "DAY"
        or len(headers) < 4
    ):
        return None, None, ["The worksheet headers do not match the expected timetable format."]

    # Identify period column, timings column, and group columns
    period_col = 2
    timings_col = 3
    for col_idx, h in enumerate(headers[:5], start=1):
        h_up = h.upper()
        if h_up in {"P.NO.", "P.NO", "PERIOD", "PERIOD NO", "P. NO."}:
            period_col = col_idx
        elif "TIMING" in h_up or "TIME" in h_up:
            timings_col = col_idx

    group_start_col = max(period_col, timings_col) + 1
    groups = [
        {"column": index + 1, "group": header}
        for index, header in enumerate(headers)
        if index + 1 >= group_start_col and header and "LUNCH" not in header.upper()
    ]

    entries = []
    errors = []
    current_day = ""
    period_rows = 0

    for row_number in range(header_row + 1, sheet.max_row + 1):
        day_raw = clean(sheet.cell(row=row_number, column=1).value)
        period_val = clean(sheet.cell(row=row_number, column=period_col).value)
        time_val = clean(sheet.cell(row=row_number, column=timings_col).value)

        if day_raw:
            norm = normalize_day(day_raw)
            if norm:
                current_day = norm

        if not period_val and not time_val:
            continue

        period_rows += 1
        start_time, end_time = parse_time_range(time_val)

        if not current_day:
            errors.append({
                "row": row_number,
                "message": "No day could be determined for this period.",
            })
            continue

        if not start_time or not end_time:
            errors.append({
                "row": row_number,
                "message": "Invalid or unsupported time range format.",
                "value": time_val,
            })
            continue

        if start_time >= end_time:
            errors.append({
                "row": row_number,
                "message": "The period end time must be after its start time.",
                "value": time_val,
            })
            continue

        for group_info in groups:
            cell_val = clean(
                sheet.cell(row=row_number, column=group_info["column"]).value
            )
            if not cell_val or cell_val.upper() in {"LUNCH BREAK", "BREAK", "RECESS"}:
                continue

            entries.append({
                "source_row": row_number,
                "day_of_week": current_day,
                "period": period_val,
                "start_time": start_time,
                "end_time": end_time,
                "class_group": group_info["group"],
                "raw_cell": cell_val,
                "source_sheet": sheet_name,
            })

    return entries, period_rows, errors


@timetable_import_bp.get("/academic-years")
@admin_required
def get_available_academic_years():
    """
    Returns available academic years from course_offerings, students, and system calendar.
    """
    db_offering_years = [
        r[0] for r in db.session.query(CourseOffering.academic_year).distinct().all() if r[0]
    ]
    db_student_years = [
        r[0] for r in db.session.query(Student.academic_year).distinct().all() if r[0]
    ]

    current_year = datetime.now().year
    generated_years = [
        f"{current_year}-{str(current_year + 1)[-2:]}",
        f"{current_year - 1}-{str(current_year)[-2:]}",
        f"{current_year}-{current_year + 4}",
    ]

    all_years = sorted(
        list(set(db_offering_years + db_student_years + generated_years)),
        reverse=True,
    )

    default_year = db_offering_years[0] if db_offering_years else generated_years[0]

    return jsonify({
        "success": True,
        "academic_years": all_years,
        "default": default_year,
    }), 200


@timetable_import_bp.post("/sheets")
@admin_required
def get_workbook_sheets():
    """
    Returns the sheet names of an uploaded Excel file to allow admin sheet selection.
    """
    uploaded = request.files.get("file")
    if not uploaded or not uploaded.filename:
        return jsonify({"success": False, "message": "No file uploaded."}), 400

    if not uploaded.filename.lower().endswith(".xlsx"):
        return jsonify({"success": False, "message": "Only .xlsx files are supported."}), 400

    file_bytes = uploaded.read(MAX_FILE_SIZE + 1)
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"success": False, "message": "The workbook must be 10MB or smaller."}), 413

    try:
        workbook = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
        sheets = workbook.sheetnames
        _, recommended = get_workbook_sheet(workbook)
        workbook.close()
        return jsonify({
            "success": True,
            "sheets": sheets,
            "recommended": recommended,
        }), 200
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": "Could not read sheets from this workbook.",
            "error": str(exc),
        }), 400


@timetable_import_bp.post("/preview")
@admin_required
def preview_timetable_import():
    """
    Backward-compatible preview endpoint that returns extracted raw timetable rows.
    """
    uploaded = request.files.get("file")
    if not uploaded or not uploaded.filename:
        return jsonify({
            "success": False,
            "message": "Upload an Excel workbook using the 'file' field",
        }), 400
    if not uploaded.filename.lower().endswith(".xlsx"):
        return jsonify({
            "success": False,
            "message": "Only .xlsx files are supported.",
        }), 400
    file_bytes = uploaded.read(MAX_FILE_SIZE + 1)
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({
            "success": False,
            "message": "The workbook must be 10MB or smaller.",
        }), 413
    try:
        workbook = load_workbook(
            BytesIO(file_bytes),
            read_only=True,
            data_only=True,
        )
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": "The uploaded file is not a readable Excel workbook.",
            "error_type": type(exc).__name__,
        }), 400

    try:
        requested_sheet = request.form.get("sheet_name")
        sheet, sheet_name = get_workbook_sheet(workbook, requested_sheet)

        if not sheet:
            return jsonify({
                "success": False,
                "message": f"Required worksheet not found: {SHEET_NAME}",
                "available_sheets": workbook.sheetnames,
            }), 422

        header_row = find_timetable_header_row(sheet)
        entries, period_rows, errors = parse_workbook_sheet(sheet, sheet_name, header_row)

        if entries is None:
            return jsonify({
                "success": False,
                "message": "The worksheet headers do not match the expected timetable format.",
                "available_sheets": workbook.sheetnames,
            }), 422

        return jsonify({
            "success": True,
            "message": "Preview generated. No timetable records were saved.",
            "source_sheet": sheet_name,
            "available_sheets": workbook.sheetnames,
            "period_rows_examined": period_rows,
            "entry_count": len(entries),
            "error_count": len(errors),
            "entries": entries,
            "errors": errors,
            "warnings": [
                "Course, faculty and room details remain in raw_cell until their parsing and database matching rules are verified.",
                "Merged-class assignments must be reviewed before confirming an import.",
            ],
        }), 200
    finally:
        workbook.close()


@timetable_import_bp.post("/analyze")
@admin_required
def analyze_timetable_import():
    """
    Performs complete parsing, entity matching against MySQL database,
    and conflict & duplicate detection.
    """
    uploaded = request.files.get("file")
    if not uploaded or not uploaded.filename:
        return jsonify({"success": False, "message": "Upload an Excel workbook using the 'file' field"}), 400

    if not uploaded.filename.lower().endswith(".xlsx"):
        return jsonify({"success": False, "message": "Only .xlsx files are supported."}), 400

    academic_year = clean(request.form.get("academic_year"))
    if not academic_year:
        return jsonify({"success": False, "message": "Academic year is required."}), 400

    requested_sheet = clean(request.form.get("sheet_name"))

    file_bytes = uploaded.read(MAX_FILE_SIZE + 1)
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"success": False, "message": "The workbook must be 10MB or smaller."}), 413

    try:
        workbook = load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": "The uploaded file is not a readable Excel workbook.",
            "error_type": type(exc).__name__,
        }), 400

    try:
        sheet, sheet_name = get_workbook_sheet(workbook, requested_sheet)
        if not sheet:
            return jsonify({
                "success": False,
                "message": "No valid timetable worksheet found in workbook.",
                "available_sheets": workbook.sheetnames,
            }), 422

        header_row = find_timetable_header_row(sheet)
        raw_entries, period_rows, parse_errors = parse_workbook_sheet(sheet, sheet_name, header_row)
        if raw_entries is None:
            return jsonify({
                "success": False,
                "message": "The worksheet headers do not match the expected timetable format.",
                "available_sheets": workbook.sheetnames,
            }), 422
    finally:
        workbook.close()

    # Pre-fetch existing database entities for high-performance matching
    courses = Course.query.all()
    faculty_members = Faculty.query.join(User).all()

    existing_offerings = CourseOffering.query.filter_by(academic_year=academic_year).all()
    offering_map = {
        (o.course_id, o.semester, o.section): o
        for o in existing_offerings
    }

    existing_entries = (
        TimetableEntry.query
        .join(CourseOffering)
        .filter(CourseOffering.academic_year == academic_year)
        .all()
    )

    analyzed_rows = []
    status_counts = {
        "valid": 0,
        "matched": 0,
        "warning": 0,
        "ambiguous": 0,
        "unmatched": 0,
        "conflict": 0,
        "duplicate": 0,
    }

    # Tracking intra-batch scheduling to detect overlaps within the uploaded workbook itself
    batch_faculty_schedule = []
    batch_room_schedule = []
    batch_section_schedule = []

    for idx, raw_item in enumerate(raw_entries):
        cell_components = extract_cell_components(
            raw_item["raw_cell"],
            courses,
            faculty_members,
        )

        matched_course = cell_components["course"] if cell_components else None
        course_candidates = cell_components["course_candidates"] if cell_components else []
        matched_faculty = cell_components["faculty"] if cell_components else None
        faculty_candidates = cell_components["faculty_candidates"] if cell_components else []
        detected_room = cell_components["room"] if cell_components else None

        class_group = raw_item["class_group"]
        day_of_week = raw_item["day_of_week"]
        start_time = raw_item["start_time"]
        end_time = raw_item["end_time"]

        semester = matched_course.semester if matched_course else None
        section = class_group

        status = "matched"
        warnings = []
        conflicts = []
        offering_id = None
        offering_action = "reuse"

        # Check Course Resolution
        if not matched_course:
            if course_candidates:
                status = "ambiguous"
                warnings.append(f"Found {len(course_candidates)} potential course matches.")
            else:
                status = "unmatched"
                warnings.append("Could not identify course from cell text.")
        else:
            # Check Course Offering
            lookup_key = (matched_course.course_id, semester, section)
            existing_off = offering_map.get(lookup_key)
            if existing_off:
                offering_id = existing_off.offering_id
                offering_action = "reuse"
                if not matched_faculty and existing_off.faculty:
                    matched_faculty = existing_off.faculty
            else:
                offering_action = "create"
                warnings.append("Will create a new course offering for this section.")

        # Check Faculty Resolution
        if not matched_faculty and faculty_candidates:
            if status != "unmatched":
                status = "ambiguous"
            warnings.append(f"Multiple faculty candidates matched: {', '.join(f.user.name for f in faculty_candidates)}.")
        elif not matched_faculty:
            warnings.append("No faculty member identified.")

        if not detected_room:
            warnings.append("No classroom or laboratory specified.")

        # Duplicate Check: Check against DB entries
        is_duplicate = False
        if offering_id:
            for te in existing_entries:
                if (
                    te.offering_id == offering_id
                    and te.day_of_week.lower() == day_of_week.lower()
                    and te.start_time.strftime("%H:%M") == start_time
                    and te.end_time.strftime("%H:%M") == end_time
                ):
                    is_duplicate = True
                    status = "duplicate"
                    warnings.append("Identical timetable entry already exists in the database.")
                    break

        # Conflict Check 1: Faculty overlap against DB and intra-batch
        fac_id = matched_faculty.faculty_id if matched_faculty else None
        if fac_id and not is_duplicate:
            # DB check
            for te in existing_entries:
                if (
                    te.offering.faculty_id == fac_id
                    and te.day_of_week.lower() == day_of_week.lower()
                    and time_ranges_overlap(start_time, end_time, te.start_time.strftime("%H:%M"), te.end_time.strftime("%H:%M"))
                ):
                    status = "conflict"
                    conflicts.append(
                        f"Faculty {matched_faculty.user.name} already has {te.offering.course.course_code} on {day_of_week} ({te.start_time.strftime('%H:%M')}–{te.end_time.strftime('%H:%M')})."
                    )

            # Intra-batch check
            for item in batch_faculty_schedule:
                if (
                    item["faculty_id"] == fac_id
                    and item["day_of_week"].lower() == day_of_week.lower()
                    and time_ranges_overlap(start_time, end_time, item["start_time"], item["end_time"])
                ):
                    status = "conflict"
                    conflicts.append(
                        f"Faculty {matched_faculty.user.name} is scheduled for multiple classes at the same time in this workbook."
                    )

        # Conflict Check 2: Room overlap against DB and intra-batch
        if detected_room and not is_duplicate:
            for te in existing_entries:
                te_room = te.room or te.offering.room
                if (
                    te_room
                    and te_room.lower() == detected_room.lower()
                    and te.day_of_week.lower() == day_of_week.lower()
                    and time_ranges_overlap(start_time, end_time, te.start_time.strftime("%H:%M"), te.end_time.strftime("%H:%M"))
                ):
                    status = "conflict"
                    conflicts.append(
                        f"Room {detected_room} is already booked on {day_of_week} ({te.start_time.strftime('%H:%M')}–{te.end_time.strftime('%H:%M')})."
                    )

            for item in batch_room_schedule:
                if (
                    item["room"].lower() == detected_room.lower()
                    and item["day_of_week"].lower() == day_of_week.lower()
                    and time_ranges_overlap(start_time, end_time, item["start_time"], item["end_time"])
                ):
                    status = "conflict"
                    conflicts.append(
                        f"Room {detected_room} is assigned to multiple classes at the same time in this workbook."
                    )

        # Conflict Check 3: Section/Group overlap
        if not is_duplicate:
            for item in batch_section_schedule:
                if (
                    item["section"].lower() == section.lower()
                    and item["day_of_week"].lower() == day_of_week.lower()
                    and time_ranges_overlap(start_time, end_time, item["start_time"], item["end_time"])
                ):
                    status = "conflict"
                    conflicts.append(
                        f"Class group {section} has multiple classes scheduled at the same time in this workbook."
                    )

        # Register in batch schedule
        if fac_id:
            batch_faculty_schedule.append({
                "faculty_id": fac_id,
                "day_of_week": day_of_week,
                "start_time": start_time,
                "end_time": end_time,
            })
        if detected_room:
            batch_room_schedule.append({
                "room": detected_room,
                "day_of_week": day_of_week,
                "start_time": start_time,
                "end_time": end_time,
            })
        batch_section_schedule.append({
            "section": section,
            "day_of_week": day_of_week,
            "start_time": start_time,
            "end_time": end_time,
        })

        if status == "matched" and warnings:
            status = "warning"

        if status in {"matched", "warning"}:
            status_counts["valid"] += 1
        status_counts[status] += 1

        analyzed_rows.append({
            "index": idx,
            "source_row": raw_item["source_row"],
            "day_of_week": day_of_week,
            "period": raw_item["period"],
            "start_time": start_time,
            "end_time": end_time,
            "class_group": class_group,
            "raw_cell": raw_item["raw_cell"],
            "course_id": matched_course.course_id if matched_course else None,
            "course_code": matched_course.course_code if matched_course else "",
            "course_name": matched_course.course_name if matched_course else "",
            "semester": semester,
            "section": section,
            "faculty_id": matched_faculty.faculty_id if matched_faculty else None,
            "faculty_name": matched_faculty.user.name if matched_faculty else "",
            "room": detected_room or "",
            "status": status,
            "offering_id": offering_id,
            "offering_action": offering_action,
            "warnings": warnings,
            "conflicts": conflicts,
            "course_candidates": [
                {
                    "course_id": c.course_id,
                    "course_code": c.course_code,
                    "course_name": c.course_name,
                    "semester": c.semester,
                }
                for c in course_candidates
            ],
            "faculty_candidates": [
                {
                    "faculty_id": f.faculty_id,
                    "name": f.user.name,
                    "employee_id": f.employee_id,
                }
                for f in faculty_candidates
            ],
        })

    return jsonify({
        "success": True,
        "academic_year": academic_year,
        "source_sheet": sheet_name,
        "available_sheets": [sheet_name],
        "total_rows": len(analyzed_rows),
        "counts": status_counts,
        "entries": analyzed_rows,
        "parse_errors": parse_errors,
        "available_courses": [
            {
                "course_id": c.course_id,
                "course_code": c.course_code,
                "course_name": c.course_name,
                "semester": c.semester,
            }
            for c in courses
        ],
        "available_faculty": [
            {
                "faculty_id": f.faculty_id,
                "name": f.user.name,
                "employee_id": f.employee_id,
            }
            for f in faculty_members
        ],
    }), 200


@timetable_import_bp.post("/commit")
@admin_required
def commit_timetable_import():
    """
    Persists valid and admin-resolved timetable entries and course offerings
    within an atomic SQLAlchemy transaction.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "JSON payload required."}), 400

    academic_year = clean(data.get("academic_year"))
    if not academic_year:
        return jsonify({"success": False, "message": "Academic year is required."}), 400

    import_mode = clean(data.get("import_mode")) or "add_missing"
    entries_to_import = data.get("entries") or []

    if not isinstance(entries_to_import, list) or not entries_to_import:
        return jsonify({"success": False, "message": "No entries provided to import."}), 400

    admin_user_id = int(get_jwt_identity())
    admin_user = db.session.get(User, admin_user_id)
    admin_name = admin_user.name if admin_user else f"User {admin_user_id}"

    created_offerings_count = 0
    created_entries_count = 0
    updated_entries_count = 0
    skipped_entries_count = 0
    errors = []

    # Cache courses and faculty
    courses_cache = {c.course_id: c for c in Course.query.all()}
    faculty_cache = {f.faculty_id: f for f in Faculty.query.all()}

    # Begin atomic transaction
    try:
        # Step 1: Pre-load offerings for this academic year
        existing_offerings = CourseOffering.query.filter_by(academic_year=academic_year).all()
        offering_lookup = {
            (o.course_id, o.semester, o.section): o
            for o in existing_offerings
        }

        # Step 2: In replace_scope mode, remove existing timetable entries for the affected offerings
        if import_mode == "replace_scope":
            target_course_ids = {
                e.get("course_id") for e in entries_to_import if e.get("course_id")
            }
            scoped_offerings = [
                o for o in existing_offerings if o.course_id in target_course_ids
            ]
            for off in scoped_offerings:
                TimetableEntry.query.filter_by(offering_id=off.offering_id).delete()

        # Step 3: Process entries
        for row_idx, item in enumerate(entries_to_import):
            course_id = item.get("course_id")
            if not course_id or course_id not in courses_cache:
                errors.append(f"Row {row_idx + 1}: Valid course is required.")
                continue

            course = courses_cache[course_id]
            faculty_id = item.get("faculty_id") or None
            if faculty_id and faculty_id not in faculty_cache:
                faculty_id = None

            semester = item.get("semester") or course.semester or 1
            section = clean(item.get("section") or item.get("class_group") or "A")
            room = clean(item.get("room")) or None
            day_of_week = normalize_day(item.get("day_of_week"))
            start_time_str = clean(item.get("start_time"))
            end_time_str = clean(item.get("end_time"))

            if not day_of_week or not start_time_str or not end_time_str:
                errors.append(f"Row {row_idx + 1}: Day of week, start time, and end time are required.")
                continue

            start_t = string_to_time(start_time_str)
            end_t = string_to_time(end_time_str)

            if start_t >= end_t:
                errors.append(f"Row {row_idx + 1}: Start time must precede end time.")
                continue

            # Resolve or create CourseOffering
            offering_key = (course_id, semester, section)
            offering = offering_lookup.get(offering_key)

            if not offering:
                offering = CourseOffering(
                    course_id=course_id,
                    faculty_id=faculty_id,
                    academic_year=academic_year,
                    semester=semester,
                    section=section,
                    room=room,
                )
                db.session.add(offering)
                db.session.flush()  # assign offering_id
                offering_lookup[offering_key] = offering
                created_offerings_count += 1
            else:
                # Update faculty or room on offering if newly provided and previously null
                if faculty_id and not offering.faculty_id:
                    offering.faculty_id = faculty_id
                if room and not offering.room:
                    offering.room = room

            # Resolve or create TimetableEntry
            existing_entry = TimetableEntry.query.filter_by(
                offering_id=offering.offering_id,
                day_of_week=day_of_week,
                start_time=start_t,
                end_time=end_t,
            ).first()

            if existing_entry:
                if import_mode == "update_matched":
                    if room:
                        existing_entry.room = room
                    updated_entries_count += 1
                else:
                    skipped_entries_count += 1
                continue

            # Create new entry
            new_entry = TimetableEntry(
                offering_id=offering.offering_id,
                day_of_week=day_of_week,
                start_time=start_t,
                end_time=end_t,
                room=room or offering.room,
            )
            db.session.add(new_entry)
            created_entries_count += 1

        db.session.commit()

        current_app.logger.info(
            f"Timetable import completed by {admin_name} (ID: {admin_user_id}) for {academic_year}: "
            f"{created_entries_count} created, {updated_entries_count} updated, "
            f"{skipped_entries_count} skipped, {created_offerings_count} offerings created."
        )

        return jsonify({
            "success": True,
            "message": (
                f"Timetable imported successfully for {academic_year}. "
                f"{created_entries_count} entries created, {updated_entries_count} updated, "
                f"{skipped_entries_count} skipped."
            ),
            "data": {
                "academic_year": academic_year,
                "import_mode": import_mode,
                "created_entries": created_entries_count,
                "updated_entries": updated_entries_count,
                "skipped_entries": skipped_entries_count,
                "created_offerings": created_offerings_count,
                "errors": errors,
            },
        }), 200

    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception(f"Timetable import failed for {academic_year}: {str(exc)}")
        return jsonify({
            "success": False,
            "message": "The timetable import could not be completed. All changes have been rolled back.",
            "error": str(exc),
        }), 500
