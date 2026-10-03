from deepface import DeepFace


MODEL_NAME = "Facenet512"


def generate_embedding(face_image):
    """
    Generate a face embedding from a cropped face image.
    """

    result = DeepFace.represent(
        img_path=face_image,
        model_name=MODEL_NAME,
        enforce_detection=True,
    )

    if not result:
        raise ValueError(
            "No face embedding was generated"
        )

    return result[0]["embedding"]