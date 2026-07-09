"""
face_engine.py
----------------
Handles all face detection + embedding logic using the `face_recognition`
library (built on top of dlib). Each face found in an image is converted
into a 128-dimensional vector ("embedding"). Two faces are considered the
"same person" if the Euclidean distance between their embeddings is small
(usually < 0.6).
"""

import face_recognition
import numpy as np
from typing import List, Tuple


def _load_image(image_path: str) -> np.ndarray:
    try:
        return face_recognition.load_image_file(image_path)
    except Exception as exc:
        raise ValueError("Could not read image file.") from exc


def get_face_embeddings(image_path: str) -> List[Tuple[np.ndarray, Tuple[int, int, int, int]]]:
    """
    Detects every face in an image and returns a list of
    (128-d embedding, bounding_box) tuples.

    bounding_box is (top, right, bottom, left) — useful later if you want
    to draw boxes on the frontend or crop thumbnails.

    We encode one face location at a time because face_recognition can skip
    locations it fails to encode; a blind zip() would desync FAISS vectors
    from metadata.
    """
    image = _load_image(image_path)

    # model="hog" is fast (CPU-only). Use model="cnn" for higher accuracy
    # if you have a GPU available.
    face_locations = face_recognition.face_locations(image, model="hog")

    results: List[Tuple[np.ndarray, Tuple[int, int, int, int]]] = []
    for location in face_locations:
        encodings = face_recognition.face_encodings(image, known_face_locations=[location])
        if encodings:
            results.append((encodings[0], location))

    return results


def get_single_embedding(image_path: str) -> np.ndarray:
    """
    Used for the selfie the attendee uploads. We require exactly one clear
    face. Raises ValueError with a user-safe message otherwise.
    """
    image = _load_image(image_path)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        raise ValueError("No face detected in the selfie. Please upload a clearer photo.")

    if len(encodings) > 1:
        raise ValueError(
            "Multiple faces detected in the selfie. "
            "Please upload a photo showing only your face."
        )

    return encodings[0]
