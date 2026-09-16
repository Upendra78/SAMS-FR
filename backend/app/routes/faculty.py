from flask import Blueprint, jsonify

from app.utils.auth import faculty_required


faculty_bp = Blueprint(
    "faculty",
    __name__,
    url_prefix="/api/faculty",
)


@faculty_bp.get("/dashboard")
@faculty_required
def faculty_dashboard():
    return jsonify({
        "success": True,
        "message": "Faculty access granted",
        "data": {
            "role": "FACULTY",
        },
    }), 200