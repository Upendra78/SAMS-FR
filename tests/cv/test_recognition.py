from pathlib import Path
import cv2
from backend.app.services.face_service import FaceService

IMAGE_DIR = Path(__file__).parent / "images"
SIMILARITY_THRESHOLD = 0.54

def get_encoding(service, image_path):
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"could not load image: {image_path}")

    height, width = image.shape[:2]
    service.detector.setInputSize((width, height))

    _, faces = service.detector.detect(image)

    if faces is None or len(faces) != 1:
        raise ValueError(
            f"Expected exactly one face in {image_path},"
            f"but found {0 if faces is None else len(faces)}."
        )
    aligned_face = service.extract_face(image,faces[0])
    return service.generate_encoding(aligned_face)

def compare_images(service, image_a, image_b):
    encoding_a = get_encoding(service, image_a)
    encoding_b = get_encoding(service, image_b)

    result = service.compare_encoding(
        encoding_a,
        encoding_b,
    )
    print(f"\nComparison: ")
    print(f"Image A: {image_a.name}")
    print(f"Image B: {image_b.name}")
    print(
        f"Cosine similarity:"
        f"{result['cosine_similarity']: .4f}"
    )
    print(
        f"L2 distance: "
        f"{result['l2_distance']: .4f}"
    )
    return result

def test_student_recognition():
   service = FaceService()
   person_a_1= IMAGE_DIR / "person_a_1.jpg"
   person_a_2 = IMAGE_DIR / "person_a_2.jpeg"
   person_b_1 = IMAGE_DIR / "person_b_1.jpeg"
   person_b_2 = IMAGE_DIR / "person_b_2.jpeg"
   person_c_1 = IMAGE_DIR / "person_c_1.jpeg"
   no_face_path = IMAGE_DIR / "no_face.jpg"
   multiple_faces_path = IMAGE_DIR / "multiple_faces.jpg"

   registered_students = [
       {"student_id": "STU001",
        "encoding": get_encoding(service, person_a_1),
       },
       {
           "student_id": "STU002",
           "encoding": get_encoding(service, person_b_1),
       },
   ]

   print("\n=== RECOGNITION TEST: STUDENT A ===")
   image_a = cv2.imread(str(person_a_2))
   result_a = service.recognize_student(
       image_a,
       registered_students,
       SIMILARITY_THRESHOLD,
   )
   print(result_a)

   print("\n=== RECOGNITION TEST: STUDENT B ===")
   image_b = cv2.imread(str(person_b_2))
   result_b = service.recognize_student(
       image_b,
       registered_students,
       SIMILARITY_THRESHOLD,
   )
   print(result_b)

   print("\n=== RECOGNITION TEST: UNKNOWN STUDENT===")
   image_c = cv2.imread(str(person_c_1))
   result_c = service.recognize_student(
       image_c,
       registered_students,
       SIMILARITY_THRESHOLD,
   )
   print(result_c)

   print("\n === RECOGNITION TEST: NO FACE ===")
   no_face_image = cv2.imread(str(no_face_path))
   result_no_face = service.recognize_student(
       no_face_image,
       registered_students,
       SIMILARITY_THRESHOLD,
   )
   print(result_no_face)

   print("\n === RECOGNITION TEST: MULTIPLE FACES ===")
   multiple_faces_path = cv2.imread(str(multiple_faces_path))
   result_multiple_faces = service.recognize_student(
       multiple_faces_path,
       registered_students,
       SIMILARITY_THRESHOLD,
   )
   print(result_multiple_faces)

   print("\n === RECOGNITION TEST: NO REGISTERED STUDENTS ===")
   result_no_students = service.recognize_student(
       image_a,
       [],
       SIMILARITY_THRESHOLD,
   )
   print(result_no_students)


def test_recognition():
    service = FaceService()

    person_a_1 = IMAGE_DIR / "person_a_1.jpg"
    person_a_2 = IMAGE_DIR / "person_a_2.jpeg"
    person_b_1 = IMAGE_DIR / "person_b_1.jpeg"
    person_b_2 = IMAGE_DIR / "person_b_2.jpeg"
    print("\n=== SAME PERSON A TEST ===")
    compare_images(
        service,
        person_a_1,
        person_a_2,
    )

    print("\n=== SAME PERSON B TEST ===")
    compare_images(
        service,
        person_b_1,
        person_b_2,
    )

    print("\n=== DIFFERENT PERSON TEST 1 ===")
    compare_images(
        service,
        person_a_1,
        person_b_1,
    )

    print("\n=== DIFFERENT PERSON TEST 2 ===")
    compare_images(
        service,
        person_a_1,
        person_b_2,
    )

    print("\n=== DIFFERENT PERSON TEST 3 ===")
    compare_images(
        service,
        person_a_2,
        person_b_1,
    )

    print("\n=== DIFFERENT PERSON TEST 4 ===")
    compare_images(
        service,
        person_a_2,
        person_b_2,
    )
if __name__ == "__main__":
    test_recognition()
    test_student_recognition()
