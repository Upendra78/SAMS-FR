from pathlib import Path

import cv2


PROJECT_ROOT = Path(__file__).resolve().parents[3]

YU_NET_MODEL = (
    PROJECT_ROOT
    / ".cv-models"
    / "face_detection_yunet_2023mar.onnx"
)

SFACE_MODEL = (
    PROJECT_ROOT
    / ".cv-models"
    / "face_recognition_sface_2021dec.onnx"
)


class FaceService:
    """Computer vision service for face detection and recognition."""

    def __init__(self):
        if not YU_NET_MODEL.exists():
            raise FileNotFoundError(
                f"YuNet model not found: {YU_NET_MODEL}"
            )

        if not SFACE_MODEL.exists():
            raise FileNotFoundError(
                f"SFace model not found: {SFACE_MODEL}"
            )

        self.detector = cv2.FaceDetectorYN.create(
            str(YU_NET_MODEL),
            "",
            (320, 320),
            0.6,
            0.3,
            5000,
        )

        self.recognizer = cv2.FaceRecognizerSF.create(
            str(SFACE_MODEL),
            "",
        )

    def detect_faces(self, image):
        """
        Detect faces in an image.

        Args:
            image: OpenCV BGR image/frame.

        Returns:
            list: Detected face information.
        """
        if image is None or image.size == 0:
            raise ValueError("Invalid or empty image.")

        height, width = image.shape[:2]
        self.detector.setInputSize((width, height))

        _, faces = self.detector.detect(image)

        if faces is None:
            return []

        results = []

        for face in faces:
            results.append(
                {
                    "bbox": face[:4].tolist(),
                    "landmarks": face[4:14].reshape(5, 2).tolist(),
                    "confidence": float(face[14]),
                }
            )

        return results

    def extract_face(self, image, face):
        """
        Align and crop a detected face using SFace.

        Args:
            image: OpenCV BGR image/frame.
            face: Raw YuNet face detection result.

        Returns:
            Aligned face image.
        """
        if image is None or image.size == 0:
            raise ValueError("Invalid or empty image.")

        if face is None:
            raise ValueError("Face detection result is required.")

        return self.recognizer.alignCrop(image, face)

    def generate_encoding(self, aligned_face):
        """
        Generate an SFace feature vector.

        Args:
            aligned_face: Aligned face image.

        Returns:
            numpy.ndarray: 128-dimensional face feature vector.
        """
        if aligned_face is None or aligned_face.size == 0:
            raise ValueError("Invalid or empty aligned face.")

        return self.recognizer.feature(aligned_face)

    def compare_encoding(self, probe_feature, registered_feature):
        """
        Compare two SFace feature vectors.
        Args:
            probe_feature: Feature vector from the face being recognized.
            registered_feature: Stored feature vector for a registered student.
        Returns:
            dict: Similarity and distance results.
        """
        if probe_feature is None or probe_feature.size == 0:
            raise ValueError("Invalid probe feature.")
        if registered_feature is None or registered_feature.size == 0:
            raise ValueError("Invalid registered feature.")
        cosine_similarity = self.recognizer.match(
            probe_feature,
            registered_feature,
            cv2.FaceRecognizerSF_FR_COSINE,
        )
        l2_distance = self.recognizer.match(
            probe_feature,
            registered_feature,
            cv2.FaceRecognizerSF_FR_NORM_L2,
        )
        return {
            "cosine_similarity": float(cosine_similarity),
            "l2_distance": float(l2_distance),
        }

    def recognize_student(
        self,
        image,
        registered_students,
        similarity_threshold,
    ):
        """
        Recognize a student from an image.
        Args:
            image: OpenCV BGR image/frame.
            registered_students: List of registered student dictionaries containing student_id and encoding.
            similarity_threshold: Minimum cosine similarity required for recognition.
        Returns:
            dict: Structured recognition result.
        """
        if image is None or image.size == 0:
            raise ValueError("Invalid or empty image.")
        if not registered_students:
            return {
                "student_id": None,
                "matched": False,
                "similarity_score": None,
                "status": "no_registered_students",
            }
        height, width = image.shape[:2]
        self.detector.setInputSize((width, height))

        _, faces = self.detector.detect(image)

        if faces is None or len(faces) == 0:
            return {
                "student_id": None,
                "matched": False,
                "similarity_score": None,
                "status": "no_face",
            }
        if len(faces) > 1:
            return {
                "student_id": None,
                "matched": False,
                "similarity_score": None,
                "status": "multiple_faces",
            }
        aligned_face = self.extract_face(image, faces[0])
        probe_feature = self.generate_encoding(aligned_face)

        best_student_id = None
        best_similarity = -1.0

        for student in registered_students:
            student_id = student.get("student_id")
            registered_feature = student.get("encoding")

            if student_id is None or registered_feature is None:
                continue
            comparison = self.compare_encoding(
                probe_feature,
                registered_feature,
            )
            similarity = comparison["cosine_similarity"]

            if similarity > best_similarity:
                best_similarity = similarity
                best_student_id = student_id
        if best_student_id is None:
            return {
                "student_id": None,
                "matched": False,
                "similarity_score": None,
                "status": "no_valid_registered_encoding",
            }
        if best_similarity >= similarity_threshold:
            return {
                "student_id": best_student_id,
                "matched": True,
                "similarity_score": best_similarity,
                "status": "recognized",
            }
        return {
            "student_id": None,
            "matched": False,
            "similarity_score": best_similarity,
            "status": "not_recognized",
        }