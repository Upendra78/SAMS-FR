
import unittest
from datetime import date, time

from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from sqlalchemy.pool import StaticPool

from app.extensions import db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    Course,
    CourseOffering,
    Department,
    Enrollment,
    Faculty,
    Student,
    User,
)
from app.routes.student_attendance import student_attendance_bp


class TestStudentAttendanceSummary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = Flask(__name__)
        cls.app.config.update(
            TESTING=True,
            SECRET_KEY="test-secret",
            JWT_SECRET_KEY="test-jwt-secret-key-32-bytes-long",
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            SQLALCHEMY_ENGINE_OPTIONS={
                "poolclass": StaticPool,
                "connect_args": {"check_same_thread": False},
            },
            JWT_TOKEN_LOCATION=["headers"],
        )

        db.init_app(cls.app)
        JWTManager(cls.app)
        cls.app.register_blueprint(student_attendance_bp)

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()

    def setUp(self):
        self.client = self.app.test_client()

        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.create_all()

            department = Department(
                department_name="Computer Science",
                department_code="CSE",
            )
            db.session.add(department)
            db.session.flush()

            faculty_user = User(
                name="Test Faculty",
                email="faculty-summary@test.local",
                password_hash="test-password",
                role="FACULTY",
            )
            student_user = User(
                name="Test Student",
                email="student-summary@test.local",
                password_hash="test-password",
                role="STUDENT",
            )
            db.session.add_all([faculty_user, student_user])
            db.session.flush()

            faculty = Faculty(
                user_id=faculty_user.user_id,
                department_id=department.department_id,
                employee_id="FAC-SUMMARY-001",
                designation="Lecturer",
            )
            student = Student(
                user_id=student_user.user_id,
                department_id=department.department_id,
                enrollment_no="STU-SUMMARY-001",
                semester=6,
                section="A",
                academic_year="2026-27",
            )
            db.session.add_all([faculty, student])
            db.session.flush()

            course = Course(
                department_id=department.department_id,
                course_code="SUM-101",
                course_name="Summary Test",
                semester=6,
                credits=3,
            )
            db.session.add(course)
            db.session.flush()

            offering = CourseOffering(
                course_id=course.course_id,
                faculty_id=faculty.faculty_id,
                academic_year="2026-27",
                semester=6,
                section="A",
                room="SUMMARY-ROOM",
            )
            db.session.add(offering)
            db.session.flush()

            db.session.add(
                Enrollment(
                    student_id=student.student_id,
                    offering_id=offering.offering_id,
                    status="ACTIVE",
                )
            )

            closed_present = AttendanceSession(
                offering_id=offering.offering_id,
                faculty_id=faculty.faculty_id,
                session_date=date(2026, 10, 7),
                start_time=time(9, 0),
                end_time=time(10, 0),
                status="CLOSED",
            )
            closed_absent = AttendanceSession(
                offering_id=offering.offering_id,
                faculty_id=faculty.faculty_id,
                session_date=date(2026, 10, 8),
                start_time=time(9, 0),
                end_time=time(10, 0),
                status="CLOSED",
            )
            active_session = AttendanceSession(
                offering_id=offering.offering_id,
                faculty_id=faculty.faculty_id,
                session_date=date(2026, 10, 9),
                start_time=time(9, 0),
                status="ACTIVE",
            )
            db.session.add_all([
                closed_present,
                closed_absent,
                active_session,
            ])
            db.session.flush()

            # One PRESENT record in a closed session.
            db.session.add(
                AttendanceRecord(
                    session_id=closed_present.session_id,
                    student_id=student.student_id,
                    status="PRESENT",
                    recognition_method="FACE",
                )
            )

            # This record must not affect the closed-session summary.
            db.session.add(
                AttendanceRecord(
                    session_id=active_session.session_id,
                    student_id=student.student_id,
                    status="PRESENT",
                    recognition_method="FACE",
                )
            )

            db.session.commit()

            self.student_user_id = student_user.user_id
            self.offering_id = offering.offering_id

    def tearDown(self):
        with self.app.app_context():
            db.session.rollback()
            db.session.remove()

    def _headers(self):
        with self.app.app_context():
            token = create_access_token(
                identity=str(self.student_user_id),
                additional_claims={"role": "STUDENT"},
            )

        return {"Authorization": f"Bearer {token}"}

    def test_active_session_present_record_is_excluded(self):
        response = self.client.get(
            "/api/student/attendance/summary",
            headers=self._headers(),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["success"])

        summary = next(
            item for item in payload["data"]
            if item["offering_id"] == self.offering_id
        )

        self.assertEqual(summary["total_sessions"], 2)
        self.assertEqual(summary["present_sessions"], 1)
        self.assertEqual(summary["absent_sessions"], 1)
        self.assertEqual(summary["attendance_percentage"], 50.0)


if __name__ == "__main__":
    unittest.main()
