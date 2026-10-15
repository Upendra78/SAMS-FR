from flask import Flask
from flask_cors import CORS

from app.models import (
    User,
    Department,
    Student,
    Faculty,
    Course,
    CourseOffering,
    Enrollment,
    FaceProfile,
    AttendanceSession,
    AttendanceRecord,
)
from app.config import Config
from app.extensions import bcrypt, db, jwt, migrate
from app.routes import health_bp
from app.routes.auth import auth_bp
from app.routes.admin import admin_bp
from app.routes.faculty import faculty_bp
from app.routes.student import student_bp
from app.routes.face import face_bp
from app.routes.enrollment import enrollment_bp
from app.routes.attendance import attendance_bp
from app.routes.student_attendance import student_attendance_bp
from app.routes.face_profile import face_profile_bp
from app.routes.recognition import recognition_bp
from app.routes.reports import reports_bp
from app.routes.analytics import analytics_bp
from app.routes.admin_attendance import admin_attendance_bp
from app.routes.admin_analytics import admin_analytics_bp
from app.routes.timetable import timetable_bp
from app.routes.timetable_import import timetable_import_bp

def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Initialize CORS
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=True,
    )

    # Register routes
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(faculty_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(face_bp)
    app.register_blueprint(enrollment_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(student_attendance_bp)
    app.register_blueprint(face_profile_bp)
    app.register_blueprint(recognition_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_attendance_bp)
    app.register_blueprint(admin_analytics_bp)
    app.register_blueprint(timetable_bp)
    app.register_blueprint(timetable_import_bp)

    return app
