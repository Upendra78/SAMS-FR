
from io import BytesIO
import re

from flask import Blueprint, jsonify, request
from openpyxl import load_workbook
from app.utils.auth import admin_required

timetable_import_bp = Blueprint(
    "timetable_import",
    __name__,
    url_prefix = "/api/timetable/import",
)
SHEET_NAME = "05.10.2026 Updated Time Table"
MAX_FILE_SIZE = 10 * 1024 * 1024
TIME_PATTERN = re.compile(
    r"^\s*(\d{1,2}:\d{2}\s*[ap]m)\s*-\s*"
    r"(\d{1,2}:\d{2}\s*[ap]m)\s*$",
    re.IGNORECASE,
)

def clean(value):
    if value is None:
        return ""
    return str(value).strip()

def parse_time_range(value):
    match = TIME_PATTERN.match(clean(value))
    if not match:
        return None, None

    from datetime import datetime
    try:
        start = datetime.strptime(
            match.group(1).replace(" ", "").lower(),
            "%I:%M%p",
        ).strftime("%H:%M")
        end = datetime.strptime(
            match.group(2).replace(" ", "").lower(),
            "%I:%M%p",
        ).strftime("%H:%M")
        return start, end
    except ValueError:
        return None, None
    
COURSE_CODE_PATTERN = re.compile(
    r"(?<![A-Z0-9])"
    r"([A-Z]{2,10}\s*-\s*[A-Z0-9]+L?)"
    r"(?=\s|$|[.,(]|Dr\.|Mr\.|Ms\.)",
    re.IGNORECASE,
)



def parse_assignment_lines(raw_cell):
    """Split a timetable cell into separate, unverified assignments."""
    assignments = []

    for line in clean(raw_cell).splitlines():
        line = line.strip()

        if not line or line.upper() == "LUNCH BREAK":
            continue

        # Separate a faculty title attached directly to a course code.
        search_line = re.sub(
            r"(?i)(?<=\d)(?=Dr\.|Mr\.|Ms\.)",
            " ",
            line,
        )

        # Find every course-code candidate in the line.
        matches = list(COURSE_CODE_PATTERN.finditer(search_line))

        if not matches:
            assignments.append({
                "raw_assignment": line,
                "course_code": None,
                "status": "needs_review",
                "review_reason": "No course code detected",
            })
            continue

        for index, match in enumerate(matches):
            course_code = re.sub(
                r"\s+", "", match.group(1).upper()
            )

            start = match.start()
            end = (
                matches[index + 1].start()
                if index + 1 < len(matches)
                else len(search_line)
            )

            assignment_text = search_line[start:end].strip()

            assignments.append({
                "raw_assignment": assignment_text,
                "course_code": course_code,
                "status": "needs_review",
                "review_reason": (
                    "Course, faculty, and room mappings are not yet verified"
                ),
            })

    return assignments


    

@timetable_import_bp.post("/preview")
@admin_required
def preview_timetable_import():
    uploaded = request.files.get("file")
    if not uploaded or not uploaded.filename:
        return jsonify({
            "success": False,
            "message": "Upload an Excel workbook using the 'file' field",
        }),400
    if not uploaded.filename.lower().endswith(".xlsx"):
        return jsonify({
            "success": False,
            "message": "Only .xlsx files are supported.",
        }),400
    file_bytes = uploaded.read(MAX_FILE_SIZE +1)
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({
            "success": False,
            "message": "The workbook must be 10MB or smaller.",
        }),413
    try:
        workbook = load_workbook(
            BytesIO(file_bytes),
            read_only=True,
            data_only= True,
        )
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "The uploaded file is not a readable Excel workbook.",
            "error_type": type(exc).__name__,
        }),400
    try:
        if SHEET_NAME not in workbook.sheetnames:
            return jsonify({
                "success": False,
                "message": f"Required worksheet not found: {SHEET_NAME}",
                "available_sheets": workbook.sheetnames,
            }),422
        sheet = workbook[SHEET_NAME]
        header_row =3
        header_values = next(
            sheet.iter_rows(
                min_row=header_row,
                max_row=header_row,
                values_only=True,
            ),
            (),
        )

        headers = [clean(value) for value in header_values]
        if (
            not headers
            or headers[0].upper()!= "DAY"
            or len(headers)<5
            or headers[1].upper() not in {"P.NO.", "P.NO", "PERIOD"}
            or headers[2].upper() != "TIMINGS"
        ):
            return jsonify({
                "success": False,
                "message":"The worksheet headers do not match the expected timetable format.",
                "headers": headers[:10],
            }),422
        groups = [
            {"column": index+1, "group": header}
            for index, header in enumerate(headers)
            if index >=4 and header
        ]
        entries = []
        errors = []
        current_day = ""
        period_rows = 0

        for row_number, row_values in enumerate(
            sheet.iter_rows(
                min_row=header_row + 1,
                values_only=True,
            ),
            start=header_row + 1,
        ):
            day_value = clean(row_values[0] if len(row_values) > 0 else "")
            period_value = clean(row_values[1] if len(row_values) > 1 else "")
            time_value = clean(row_values[2] if len(row_values) > 2 else "")

            if day_value:
                current_day = day_value.upper()

            if not period_value and not time_value:
                continue

            period_rows += 1
            start_time, end_time = parse_time_range(time_value)

            if not current_day:
                errors.append({
                    "row": row_number,
                    "message": "No day could be determined for this period.",
                })
                continue

            if not start_time or not end_time:
                errors.append({
                    "row": row_number,
                    "message": "Invalid or unsupported time range.",
                    "value": time_value,
                })
                continue

            if start_time >= end_time:
                errors.append({
                    "row": row_number,
                    "message": "The period end time must be after its start time.",
                    "value": time_value,
                })
                continue

            for group_info in groups:
                column_index = group_info["column"] - 1
                cell_value = clean(
                    row_values[column_index]
                    if column_index < len(row_values)
                    else ""
                )

                if not cell_value or cell_value.upper() == "LUNCH BREAK":
                    continue

                for assignment in parse_assignment_lines(cell_value):
                    entries.append({
                        "source_row": row_number,
                        "day_of_week": current_day,
                        "period": period_value,
                        "start_time": start_time,
                        "end_time": end_time,
                        "class_group": group_info["group"],
                        "raw_cell": cell_value,
                        "source_sheet": SHEET_NAME,
                        "raw_assignment": assignment["raw_assignment"],
                        "course_code": assignment["course_code"],
                        "status": assignment["status"],
                        "review_reason": assignment["review_reason"],
                    })

        return jsonify({
            "success": True,
            "message": "Preview generated. No timetable records were saved.",
            "source_sheet": SHEET_NAME,
            "period_rows_examined": period_rows,
            "entry_count": len(entries),
            "error_count": len(errors),
            "entries": entries,
            "errors": errors,
            "warnings": [
                    "Course, faculty and room details remain in raw_cell until their parsing and database matching rules are verified.",
                    "Merged-class assignments must be reviewed before confirming an import.",
            ],
        }),200
    finally:
        workbook.close()