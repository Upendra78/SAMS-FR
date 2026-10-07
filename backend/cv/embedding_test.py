from cv.embedding import generate_embedding


image_path = r"..\tests\cv\images\multiple_faces.jpg"

embedding = generate_embedding(
    image_path
)

print(
    "Embedding generated successfully"
)

print(
    "Embedding dimensions:",
    len(embedding)
)