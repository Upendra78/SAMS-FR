import unittest
from datetime import date, time

from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from sqlalchemy.pool import StaticPool

from app.extensions import bcrypt, db
from app.models import (
    AttendanceRecord,
    AttendanceSession,
    Batch,
    Course,
    CourseOffering,
    Department,
    Enrollment,
    Faculty,
    Student,
    SystemSetting,
    TimetableEntry,
    User,
)
from app.routes.admin import admin_bp
from app.routes.enrollment import enrollment_bp
from app.routes.faculty import faculty_bp
from app.routes.student import student_bp
from app.routes.timetable import timetable_bp
from app.utils.academic_year import (
    canonical_academic_year,
    extract_cohort_start_year,
    format_batch_cohort,
    get_available_academic_sessions,
    get_current_academic_session,
    is_batch_cohort,
    is_single_academic_session,
    resolve_student_academic_info,
    set_current_academic_session,
)


class TestAcademicYearBatchStandardization(unittest.TestCase):
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
        bcrypt.init_app(cls.app)
        JWTManager(cls.app)
        cls.app.register_blueprint(admin_bp)
        cls.app.register_blueprint(student_bp)
        cls.app.register_blueprint(faculty_bp)
        cls.app.register_blueprint(enrollment_bp)
        cls.app.register_blueprint(timetable_bp)

        with cls.app.app_context():
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()

    def setUp(self):
        self.client = self.app.test_client()

        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            db.create_all()

            # Create default admin
            admin = User(name="Admin User", email="admin@test.local", password_hash="pw", role="ADMIN")
            dept = Department(department_name="Computer Science", department_code="CSE")
            batch_2024 = Batch(batch_name="2024-2028")
            db.session.add_all([admin, dept, batch_2024])
            db.session.commit()

            self.admin_id = admin.user_id
            self.dept_id = dept.department_id
            self.batch_id = batch_2024.batch_id

    def admin_headers(self):
        with self.app.app_context():
            token = create_access_token(identity=str(self.admin_id), additional_claims={"role": "ADMIN"})
            return {"Authorization": f"Bearer {token}"}

    def student_headers(self, user_id):
        with self.app.app_context():
            token = create_access_token(identity=str(user_id), additional_claims={"role": "STUDENT"})
            return {"Authorization": f"Bearer {token}"}

    def faculty_headers(self, user_id):
        with self.app.app_context():
            token = create_access_token(identity=str(user_id), additional_claims={"role": "FACULTY"})
            return {"Authorization": f"Bearer {token}"}

    def test_definitions_and_helpers(self):
        """Test canonical academic year and batch cohort utilities."""
        self.assertTrue(is_single_academic_session("2024-2025"))
        self.assertTrue(is_single_academic_session("2026-2027"))
        self.assertTrue(is_single_academic_session("2026 - 2027"))
        self.assertTrue(is_single_academic_session("2026-27"))
        self.assertFalse(is_single_academic_session("2024-2028"))

        self.assertTrue(is_batch_cohort("2024-2028"))
        self.assertTrue(is_batch_cohort("2024"))
        self.assertFalse(is_batch_cohort("2024-2025"))

        self.assertEqual(canonical_academic_year("2026 - 2027"), "2026-2027")
        self.assertEqual(canonical_academic_year("2025-26"), "2025-2026")

        self.assertEqual(format_batch_cohort("2024"), "2024-2028")
        self.assertEqual(format_batch_cohort("2024 - 2028"), "2024-2028")
        self.assertEqual(extract_cohort_start_year("2024-2028"), "2024")
        self.assertEqual(extract_cohort_start_year("2024"), "2024")

    def test_example_student_batch_academic_year_and_semester(self):
        """
        Requirements 1 & 2:
        Student:
        - Admission year: 2024
        - Batch: 2024-2028
        - Current academic year: 2026-2027
        - Current semester: 5

        The application must display:
        - Batch Year: 2024-2028
        - Academic Year: 2026-2027
        - Semester: 5
        """
        with self.app.app_context():
            # Configure current academic session to 2026-2027
            set_current_academic_session("2026-2027")

            user = User(name="John Doe", email="john@test.local", password_hash="pw", role="STUDENT")
            db.session.add(user)
            db.session.commit()

            student = Student(
                user_id=user.user_id,
                department_id=self.dept_id,
                batch_id=self.batch_id,
                enrollment_no="CSE2024001",
                semester=5,
                section="A",
                academic_year="2026-2027",
                admission_date="2024-08-01",
            )
            db.session.add(student)
            db.session.commit()
            student_id = student.student_id
            user_id = user.user_id

        # 1. Admin GET student
        res = self.client.get(f"/api/admin/students/{student_id}", headers=self.admin_headers())
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertEqual(data["batch_year"], "2024-2028")
        self.assertEqual(data["academic_year"], "2026-2027")
        self.assertEqual(data["semester"], 5)
        self.assertEqual(data["admission_year"], "2024")

        # 2. Student GET profile
        res_profile = self.client.get("/api/student/profile", headers=self.student_headers(user_id))
        self.assertEqual(res_profile.status_code, 200)
        p_data = res_profile.get_json()["data"]
        self.assertEqual(p_data["batch_year"], "2024-2028")
        self.assertEqual(p_data["academic_year"], "2026-2027")
        self.assertEqual(p_data["semester"], 5)
        self.assertEqual(p_data["batch"]["batch_name"], "2024-2028")

        # 3. Student GET dashboard
        res_dash = self.client.get("/api/student/dashboard", headers=self.student_headers(user_id))
        self.assertEqual(res_dash.status_code, 200)
        d_data = res_dash.get_json()["data"]
        self.assertEqual(d_data["student"]["batch_year"], "2024-2028")
        self.assertEqual(d_data["student"]["academic_year"], "2026-2027")
        self.assertEqual(d_data["student"]["semester"], 5)

    def test_changing_academic_session_does_not_change_student_batch(self):
        """
        Requirement 3:
        Changing the current academic session does not change the student's batch.
        """
        with self.app.app_context():
            set_current_academic_session("2026-2027")
            user = User(name="Jane Student", email="jane@test.local", password_hash="pw", role="STUDENT")
            db.session.add(user)
            db.session.commit()

            student = Student(
                user_id=user.user_id,
                department_id=self.dept_id,
                batch_id=self.batch_id,
                enrollment_no="CSE2024002",
                semester=5,
                section="B",
                academic_year="2026-2027",
            )
            db.session.add(student)
            db.session.commit()
            student_id = student.student_id

        # Admin changes current academic session to 2027-2028
        res_update = self.client.post(
            "/api/admin/academic-session",
            json={"academic_year": "2027-2028"},
            headers=self.admin_headers(),
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(res_update.get_json()["data"]["current_academic_year"], "2027-2028")

        # Verify student still has batch 2024-2028
        res_student = self.client.get(f"/api/admin/students/{student_id}", headers=self.admin_headers())
        self.assertEqual(res_student.status_code, 200)
        data = res_student.get_json()["data"]
        self.assertEqual(data["batch_year"], "2024-2028")
        self.assertEqual(data["batch_name"], "2024-2028")

    def test_historical_attendance_preserves_original_academic_session(self):
        """
        Requirement 4:
        Historical attendance remains associated with its original academic session.
        """
        with self.app.app_context():
            course = Course(
                department_id=self.dept_id,
                course_code="CSE101",
                course_name="Programming Fundamentals",
                semester=1,
                credits=4,
                batch="2024",
                is_active=True,
            )
            # Course offering in academic year 2024-2025
            offering_hist = CourseOffering(
                course=course,
                academic_year="2024-2025",
                semester=1,
                section="A",
            )
            db.session.add_all([course, offering_hist])
            db.session.commit()

            # Create faculty for attendance session
            fac_user = User(
                name="Prof Hist",
                email="profhist@sams.edu",
                password_hash="hashed_pw",
                role="FACULTY",
                is_active=True,
            )
            db.session.add(fac_user)
            db.session.commit()
            faculty = Faculty(
                user_id=fac_user.user_id,
                department_id=self.dept_id,
                employee_id="FAC001",
                designation="Assistant Professor",
            )
            db.session.add(faculty)
            db.session.commit()

            # Session in 2024-2025
            session = AttendanceSession(
                offering_id=offering_hist.offering_id,
                faculty_id=faculty.faculty_id,
                session_date=date(2024, 10, 15),
                start_time=time(9, 30),
                end_time=time(10, 30),
                status="CLOSED",
            )
            db.session.add(session)
            db.session.commit()

            self.assertEqual(canonical_academic_year(session.offering.academic_year), "2024-2025")

    def test_course_offering_rejects_cohort_range_and_timetable_displays_session(self):
        """
        Requirement 5:
        Course offerings and timetable records display their actual academic session rather
        than student's batch range, and reject multi-year cohort spans.
        """
        with self.app.app_context():
            course = Course(
                department_id=self.dept_id,
                course_code="CSE301",
                course_name="Database Systems",
                semester=5,
                credits=4,
                is_active=True,
            )
            db.session.add(course)
            db.session.commit()
            course_id = course.course_id

        # Attempt to create offering with cohort range 2024-2028 should fail
        res_invalid = self.client.post(
            "/api/admin/course-offerings",
            json={
                "course_id": course_id,
                "academic_year": "2024-2028",
                "semester": 5,
                "section": "A",
            },
            headers=self.admin_headers(),
        )
        self.assertEqual(res_invalid.status_code, 400)
        self.assertIn("1-year academic session", res_invalid.get_json()["message"])

        # Creating offering with valid 1-year academic session succeeds
        res_valid = self.client.post(
            "/api/admin/course-offerings",
            json={
                "course_id": course_id,
                "academic_year": "2026-2027",
                "semester": 5,
                "section": "A",
            },
            headers=self.admin_headers(),
        )
        self.assertEqual(res_valid.status_code, 201)
        offering_id = res_valid.get_json()["data"]["offering_id"]

        # Create timetable entry and verify it displays academic session
        with self.app.app_context():
            entry = TimetableEntry(
                offering_id=offering_id,
                day_of_week="Monday",
                start_time=time(9, 30),
                end_time=time(10, 30),
                room="R101",
            )
            db.session.add(entry)
            db.session.commit()

        res_tt = self.client.get("/api/timetable/admin", headers=self.admin_headers())
        self.assertEqual(res_tt.status_code, 200)
        tt_data = res_tt.get_json()["data"]
        matching_entries = [e for e in tt_data if e["offering_id"] == offering_id]
        self.assertEqual(len(matching_entries), 1)
        self.assertEqual(matching_entries[0]["academic_year"], "2026-2027")

    def test_admin_filter_options_distinguishes_academic_year_from_batch_year(self):
        """
        Requirement 7:
        Filters and reports distinguish academic year (sessions) from batch year.
        """
        res = self.client.get("/api/admin/students/filter-options", headers=self.admin_headers())
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]

        self.assertIn("batches", data)
        self.assertIn("academic_years", data)
        self.assertIn("current_academic_year", data)

        # Batches must contain cohort duration (e.g. 2024-2028)
        batch_names = [b["batch_name"] for b in data["batches"]]
        self.assertIn("2024-2028", batch_names)

        # Academic years must contain 1-year sessions
        for ay in data["academic_years"]:
            self.assertTrue(is_single_academic_session(ay))


if __name__ == "__main__":
    unittest.main()
