import time

import cv2
import pyttsx3

from cv.config import CAMERA_INDEX, FACE_MATCH_THRESHOLD
from cv.embedding import generate_embedding
from cv.recognizer import FaceRecognizer

from app import create_app
from app.services.cv.recognition_service import find_matching_student
from app.services.cv.attendance_service import (
    get_active_session,
    mark_face_attendance,
)


# Development faculty.
# This will eventually come from the authenticated faculty session.
FACULTY_ID = 1

# Run face recognition every 1.5 seconds.
RECOGNITION_INTERVAL = 1.5

# Prevent repeated voice messages.
VOICE_COOLDOWN = 5


# Initialize speech engine once.
speech_engine = pyttsx3.init()

speech_engine.setProperty(
    "rate",
    165,
)

speech_engine.setProperty(
    "volume",
    1.0,
)


def speak(message):
    """
    Speak a message through the system speaker.
    """

    speech_engine.say(message)
    speech_engine.runAndWait()


def main():
    # Create Flask application.
    app = create_app()

    # Create OpenCV face detector.
    recognizer = FaceRecognizer()

    # Find the current active attendance session.
    with app.app_context():
        active_session = get_active_session(
            FACULTY_ID
        )

    if not active_session:
        print("No active attendance session found.")
        return

    session_id = active_session.session_id

    print("========================================")
    print("SAMS-FR LIVE ATTENDANCE")
    print("========================================")
    print(f"Faculty ID : {FACULTY_ID}")
    print(f"Session ID : {session_id}")
    print("Press Q to quit")
    print("========================================")

    # Open webcam.
    camera = cv2.VideoCapture(
        CAMERA_INDEX
    )

    if not camera.isOpened():
        raise RuntimeError(
            "Unable to open camera"
        )

    # Recognition state.
    last_recognition_time = 0
    last_voice_time = 0
    last_voice_message = None

    last_student_id = None
    last_confidence = 0.0
    last_message = "Waiting for face..."

    try:
        while True:

            # Read camera frame.
            success, frame = camera.read()

            if not success:
                print(
                    "Unable to read camera frame"
                )
                break

            # Detect faces.
            faces = recognizer.detect_faces(
                frame
            )

            current_time = time.time()

            # Only perform expensive face recognition
            # every RECOGNITION_INTERVAL seconds.
            if (
                len(faces) > 0
                and
                current_time - last_recognition_time
                >= RECOGNITION_INTERVAL
            ):

                last_recognition_time = (
                    current_time
                )

                # Select largest detected face.
                x, y, w, h = max(
                    faces,
                    key=lambda face:
                    face[2] * face[3],
                )

                # Crop face from camera frame.
                face_image = frame[
                    y:y + h,
                    x:x + w
                ]

                try:

                    # Generate Facenet512 embedding.
                    embedding = (
                        generate_embedding(
                            face_image
                        )
                    )

                    # Find matching student.
                    with app.app_context():

                        student_id, confidence = (
                            find_matching_student(
                                embedding,
                                threshold=(
                                    FACE_MATCH_THRESHOLD
                                ),
                            )
                        )

                        if student_id is not None:

                            # Face recognized.
                            last_student_id = (
                                student_id
                            )

                            last_confidence = (
                                confidence
                            )

                            # Mark attendance.
                            record, message = (
                                mark_face_attendance(
                                    session_id=(
                                        session_id
                                    ),
                                    student_id=(
                                        student_id
                                    ),
                                    confidence_score=(
                                        confidence
                                    ),
                                )
                            )

                            last_message = (
                                message
                            )

                            print(
                                f"Student="
                                f"{student_id} "
                                f"confidence="
                                f"{confidence:.3f} "
                                f"message="
                                f"{message}"
                            )

                            # Determine voice message.
                            if (
                                message
                                == "Attendance marked successfully"
                            ):
                                voice_message = (
                                    "Your face is verified. "
                                    "Attendance marked successfully."
                                )

                            elif (
                                message
                                == "Attendance already marked"
                            ):
                                voice_message = (
                                    "Your face is verified. "
                                    "Attendance already marked."
                                )

                            else:
                                voice_message = (
                                    "Your face is verified."
                                )

                            # Prevent repeated speech.
                            if (
                                current_time
                                - last_voice_time
                                >= VOICE_COOLDOWN
                                or
                                last_voice_message
                                != voice_message
                            ):

                                speak(
                                    voice_message
                                )

                                last_voice_time = (
                                    current_time
                                )

                                last_voice_message = (
                                    voice_message
                                )

                        else:

                            # Face detected but not registered.
                            last_student_id = None

                            last_confidence = (
                                confidence
                            )

                            last_message = (
                                "Not registered"
                            )

                            print(
                                "Unknown face "
                                f"confidence="
                                f"{confidence:.3f}"
                            )

                            voice_message = (
                                "Your face is not registered."
                            )

                            if (
                                current_time
                                - last_voice_time
                                >= VOICE_COOLDOWN
                                or
                                last_voice_message
                                != voice_message
                            ):

                                speak(
                                    voice_message
                                )

                                last_voice_time = (
                                    current_time
                                )

                                last_voice_message = (
                                    voice_message
                                )

                except Exception as error:

                    last_student_id = None

                    last_message = (
                        "Recognition error"
                    )

                    print(
                        "Recognition error:",
                        error,
                    )

            # Draw rectangles around all detected faces.
            for (
                x,
                y,
                w,
                h
            ) in faces:

                cv2.rectangle(
                    frame,
                    (x, y),
                    (x + w, y + h),
                    (0, 255, 0),
                    2,
                )

            # Determine text shown on screen.
            if last_student_id is not None:

                display_text = (
                    f"Student "
                    f"{last_student_id} "
                    f"{last_confidence:.3f}"
                )

            else:

                display_text = (
                    last_message
                )

            # Display recognition status.
            cv2.putText(
                frame,
                display_text,
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )

            # Display session information.
            cv2.putText(
                frame,
                f"Session: {session_id}",
                (20, 75),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )

            # Display quit instruction.
            cv2.putText(
                frame,
                "Press Q to quit",
                (20, 105),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )

            # Show camera window.
            cv2.imshow(
                "SAMS-FR Live Attendance",
                frame,
            )

            # Read keyboard input.
            key = (
                cv2.waitKey(1)
                & 0xFF
            )

            if key == ord("q"):
                break

    finally:

        # Release webcam.
        camera.release()

        # Close OpenCV windows.
        cv2.destroyAllWindows()

        # Stop speech engine.
        speech_engine.stop()


if __name__ == "__main__":
    main()