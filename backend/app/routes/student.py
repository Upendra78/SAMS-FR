from flask import Blueprint, jsonify

from app.utils.auth import student_required


student_bp = Blueprint(
    "student",
    __name__,
    url_prefix="/api/student",
)


@student_bp.get("/dashboard")
@student_required
def student_dashboard():
    return jsonify({
        "success": True,
        "message": "Student access granted",
        "data": {
            "role": "STUDENT",
        },
    }), 200