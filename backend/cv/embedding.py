from deepface import DeepFace

MODEL_NAME = "Facenet512"
DETECTOR_BACKEND = "retinaface"


def generate_embedding(face_image):
    faces = DeepFace.extract_faces(
        img_path=face_image,
        detector_backend=DETECTOR_BACKEND,
        enforce_detection=True,
        align=False,
    )

    if len(faces) != 1:
        raise ValueError(
            f"Exactly one face must be detected, found {len(faces)}"
        )

    face_crop = faces[0]["face"]

    result = DeepFace.represent(
        img_path=face_crop,
        model_name=MODEL_NAME,
        detector_backend="skip",
        enforce_detection=False,
        align=False,
    )

    if not result:
        raise ValueError("No face embedding was generated")

    embedding = result[0]["embedding"]

    if len(embedding) != 512:
        raise ValueError(
            f"Unexpected embedding dimensions: {len(embedding)}"
        )

    return embedding