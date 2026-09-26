from app.models import FaceProfile, Student
from app.services.cv.face_service import (
    deserialize_embedding,
    cosine_similarity,
)


def find_matching_student(
    query_embedding,
    threshold=0.60,
):
    """
    Find the student whose stored face embedding
    has the highest cosine similarity with the
    query embedding.
    """

    profiles = FaceProfile.query.filter_by(
        is_active=True
    ).all()

    best_student = None
    best_score = 0.0

    for profile in profiles:
        stored_embedding = deserialize_embedding(
            profile.embedding
        )

        score = cosine_similarity(
            query_embedding,
            stored_embedding,
        )

        if score > best_score:
            best_score = score
            best_student = profile.student

    if (
        best_student is None
        or best_score < threshold
    ):
        return None, best_score

    return best_student, best_score