import io
import unittest
from unittest.mock import patch

import cv2
import numpy as np
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from sqlalchemy.pool import StaticPool

from app.extensions import db
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
from app.routes.recognition import recognition_bp


class TestFaceRecognitionAPI(unittest.TestCase):

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
                "connect_args": {
                    "check_same_thread": False,
                },
            },
            JWT_TOKEN_LOCATION=["headers"],
        )

        db.init_app(cls.app)
        JWTManager(cls.app)

        cls.app.register_blueprint(recognition_bp)

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
            self.department = Department(
                department_name="Computer Science",
                department_code="CSE",
            )
            db.session.add(self.department)
            db.session.flush()

            self.faculty_user = User(
                name="Test Faculty",
                email="faculty@test.local",
                password_hash="test-password",
                role="FACULTY",
            )
            db.session.add(self.faculty_user)
            db.session.flush()

            self.faculty = Faculty(
                user_id=self.faculty_user.user_id,
                department_id=self.department.department_id,
                employee_id="FAC001",
                designation="Assistant Professor",
            )
            db.session.add(self.faculty)
            db.session.flush()

            self.student_user = User(
                name="Test Student",
                email="student@test.local",
                password_hash="test-password",
                role="STUDENT",
            )
            db.session.add(self.student_user)
            db.session.flush()

            self.student = Student(
                user_id=self.student_user.user_id,
                department_id=self.department.department_id,
                enrollment_no="STU001",
                semester=6,
                section="A",
                academic_year="2026-27",
            )
            db.session.add(self.student)
            db.session.flush()

            self.course = Course(
                department_id=self.department.department_id,
                course_code="CSE601",
                course_name="Computer Vision",
                semester=6,
                credits=4,
            )
            db.session.add(self.course)
            db.session.flush()

            self.offering = CourseOffering(
                course_id=self.course.course_id,
                faculty_id=self.faculty.faculty_id,
                academic_year="2026-27",
                semester=6,
                section="A",
            )
            db.session.add(self.offering)
            db.session.flush()

            self.enrollment = Enrollment(
                student_id=self.student.student_id,
                offering_id=self.offering.offering_id,
                status="ACTIVE",
                )
            db.session.add(self.enrollment)
            db.session.flush()

            self.session = AttendanceSession(
                offering_id=self.offering.offering_id,
                faculty_id=self.faculty.faculty_id,
                session_date=__import__("datetime").date.today(),
                start_time=__import__("datetime").datetime.now().time(),
                status="ACTIVE",
            )
            db.session.add(self.session)
            db.session.flush()

            self.face_profile = FaceProfile(
                student_id=self.student.student_id,
                embedding=np.ones(
                    (1, 128),
                    dtype=np.float32,
                ).tobytes(),
                model_version="sface_2021dec",
                is_active=True,
            )
            db.session.add(self.face_profile)

            db.session.commit()

            self.session_id = self.session.session_id
            self.student_id = self.student.student_id
            self.faculty_id = self.faculty.faculty_id
            self.department_id = self.department.department_id

    def tearDown(self):
        with self.app.app_context():
            AttendanceRecord.query.delete()
            AttendanceSession.query.delete()
            FaceProfile.query.delete()
            Enrollment.query.delete()
            CourseOffering.query.delete()
            Course.query.delete()
            Faculty.query.delete()
            Student.query.delete()
            User.query.delete()
            Department.query.delete()
            db.session.commit()

    def _faculty_headers(self):
        with self.app.app_context():
            token = create_access_token(
                identity=str(self.faculty.user_id),
                additional_claims={"role": "FACULTY"},
            )

        return {
            "Authorization": f"Bearer {token}",
        }

    def _image_file(self):
        image = np.zeros(
            (100, 100, 3),
            dtype=np.uint8,
        )

        success, encoded = cv2.imencode(
            ".jpg",
            image,
        )

        self.assertTrue(success)

        return (
            io.BytesIO(encoded.tobytes()),
            "frame.jpg",
        )

    @patch("app.routes.recognition.face_service.recognize_student")
    def test_recognized_face_marks_attendance(
        self,
        mock_recognize,
    ):
        mock_recognize.return_value = {
            "student_id": self.student_id,
            "matched": True,
            "similarity_score": 0.6955,
            "status": "recognized",
        }

        response = self.client.post(
            "/api/faculty/recognition/attendance",
            headers=self._faculty_headers(),
            data={
                "session_id": str(self.session_id),
                "image": self._image_file(),
            },
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 201)

        body = response.get_json()

        self.assertTrue(body["success"])
        self.assertEqual(
            body["data"]["student_id"],
            self.student_id,
        )
        self.assertEqual(
            body["data"]["recognition_method"],
            "FACE",
        )
        self.assertAlmostEqual(
            body["data"]["confidence_score"],
            0.6955,
            places=4,
        )

        mock_recognize.assert_called_once()

        with self.app.app_context():
            record = AttendanceRecord.query.filter_by(
                session_id=self.session_id,
                student_id=self.student_id,
            ).first()

            self.assertIsNotNone(record)
            self.assertEqual(record.status, "PRESENT")
            self.assertEqual(
                record.recognition_method,
                "FACE",
            )

    @patch("app.routes.recognition.face_service.recognize_student")
    def test_no_face_does_not_mark_attendance(
        self,
        mock_recognize,
    ):
        mock_recognize.return_value = {
            "student_id": None,
            "matched": False,
            "similarity_score": None,
            "status": "no_face",
        }
        response = self.client.post(
            "/api/faculty/recognition/attendance",
            headers = self._faculty_headers(),
            data = {
                "session_id": str(self.session_id),
                "image": self._image_file(),
            },
            content_type = "multipart/form-data",
        )

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual(body["status"], "no_face")
        self.assertIsNone(body["data"]["student_id"])
        self.assertIsNone(body["data"]["similarity_score"])

        mock_recognize.assert_called_once()

        with self.app.app_context():
            record = AttendanceRecord.query.filter_by(
                session_id = self.session_id,
            ).first()
            self.assertIsNone(record)

    @patch("app.routes.recognition.face_service.recognize_student")
    def test_multiple_faces_does_not_mark_attendance(
        self,
        mock_recognize,
    ):
        mock_recognize.return_value = {
            "student_id": None,
            "matched": False,
            "similarity_score":None,
            "status": "multiple_faces",
        }

        response = self.client.post(
            "/api/faculty/recognition/attendance",
            headers = self._faculty_headers(),
            data ={
                "session_id":str(self.session_id),
                "image": self._image_file(),
            },
            content_type = "multipart/form-data",
        )
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual(body["status"], "multiple_faces")
        self.assertIsNone(body["data"]["student_id"])
        self.assertIsNone(body["data"] ["similarity_score"])

        mock_recognize.assert_called_once()

        with self.app.app_context():
            record = AttendanceRecord.query.filter_by(
                session_id = self.session_id,
            ).first()
            self.assertIsNone(record)

    @patch("app.routes.recognition.face_service.recognize_student")
    def test_not_recognized_does_not_mark_attendance(self, mock_recognize,):
        mock_recognize.return_value={
            "student_id": None,
            "matched": False,
            "similarity_score":0.31,
            "status": "not_recognized",
        }
        response = self.client.post(
            "/api/faculty/recognition/attendance",
            headers = self._faculty_headers(),
            data={
                "session_id":str(self.session_id),
                "image":self._image_file(),

            },
            content_type = "multipart/form-data",
        )
        self.assertEqual(response.status_code,200)

        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual(body["status"], "not_recognized")
        self.assertIsNone(body["data"]["student_id"])
        self.assertAlmostEqual(body["data"]["similarity_score"], 0.31, places = 2)
        mock_recognize.assert_called_once()
        with self.app.app_context():
            record = AttendanceRecord.query.filter_by(
                session_id = self.session_id,
            ).first()
            self.assertIsNone(record)

    def test_faculty_cannot_use_another_facultys_session(self):
        with self.app.app_context():
            other_faculty_user = User(
                name = "Other Faculty",
                email = "other.faculty@test.local",
                password_hash = "test_password",
                role ="FACULTY",
            )
            db.session.add(other_faculty_user)
            db.session.flush()
            other_faculty = Faculty(
                user_id = other_faculty_user.user_id,
                department_id = self.department_id,
                employee_id = "FAC002",
                designation = "Assistant Professor",
            )
            db.session.add(other_faculty)
            db.session.flush()

            db.session.commit()

            other_faculty_user_id = other_faculty.user_id
        with self.app.app_context():
            token = create_access_token(
                identity = str(other_faculty_user_id),
                additional_claims={"role": "FACULTY"},
            )
        response = self.client.post(
            "/api/faculty/recognition/attendance",
            headers = {"Authorization":f"Bearer {token}",},
            data = {
                "session_id": str(self.session_id),
                "image": self._image_file(),
            },
            content_type = "multipart/form-data",
        )
        self.assertEqual(response.status_code,403)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual(body["message"], "Access forbidden")

        with self.app.app_context():
            record = AttendanceRecord.query.filter_by(
                session_id = self.session_id,
            ).first()
            self.assertIsNone(record)



if __name__ == "__main__":
    unittest.main()