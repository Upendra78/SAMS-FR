import unittest
from unittest.mock import MagicMock
import numpy as np
from app.services.face_service import FaceService

class TestFaceEnrollment(unittest.TestCase):
    def setUp(self):
        self.service = FaceService.__new__(FaceService)
        self.image = np.zeros((100,100,3), dtype=np.uint8)
        self.encoding = np.zeros((1,128), dtype= np.float32)

        self.service.detect_faces = MagicMock(return_value=[{"face": "detect"}])
        self.service.extract_face = MagicMock(return_value=self.image)
        self.service.generate_encoding = MagicMock(return_value = self.encoding)

    def test_successful_enrollment(self):
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "enrolled")
        np.testing.assert_array_equal(result["encoding"], self.encoding)

    def test_invalid_image_none(self):
        result = self.service.enroll_student(None)
        self.assertEqual(result["status"], "invalid_image")
        self.assertIsNone(result["encoding"])

    def test_invalid_empty_image(self):
        empty_image = np.array([], dtype=np.uint8)
        result = self.service.enroll_student(empty_image)
        self.assertEqual(result["status"], "invalid_image")
        self.assertIsNone(result["encoding"])

    def test_no_face_detected(self):
        self.service.detect_faces.return_value = []
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"],"no_face")
        self.assertIsNone(result["encoding"])

    def test_multiple_faces_detected(self):
        self.service.detect_faces.return_value = [
            {"face": "one"},
            {"face": "two"},
        ]
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "multiple_faces")
        self.assertIsNone(result["encoding"])

    def test_encoding_failure(self):
        self.service.generate_encoding.side_effect = ValueError("Encoding failed")
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "encoding_failed")
        self.assertIsNone(result["encoding"])

    def test_invalid_encoding_size(self):
        self.service.generate_encoding.return_value = np.zeros(
            (1,64), dtype=np.float32
        )
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "invalid_encoding")
        self.assertIsNone(result["encoding"])

    def test_invalid_encoding_shape(self):
        self.service.generate_encoding.return_value = np.zeros(
            (128,), dtype=np.float32)
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "invalid_encoding")
        self.assertIsNone(result["encoding"])

    def  test_invalid_encoding_dtype(self):
        self.service.generate_encoding.return_value = np.zeros(
            (1,128), dtype = np.float64
        )
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "invalid_encoding")
        self.assertIsNone(result["encoding"])

    def test_encoding_with_non_finite_values(self):
        encoding = np.zeros((1,128), dtype = np.float32)
        encoding[0,0] = np.nan 
        self.service.generate_encoding.return_value = encoding 
        result = self.service.enroll_student(self.image)
        self.assertEqual(result["status"], "invalid_encoding")
        self.assertIsNone(result["encoding"])

if __name__ == "__main__":
    unittest.main()