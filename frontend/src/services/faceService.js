import api from "./api";

export async function getFaceRegistrationStatus(studentId) {
  if (!studentId) {
    throw new Error("Student ID is required to check face registration status.");
  }

  const response = await api.get(
    `/face/status/${encodeURIComponent(studentId)}`
  );

  return response.data;
}



export async function enrollStudentFace(studentId, imageBlob) {
  if (!studentId) {
    throw new Error("Student ID is required for face enrollment.");
  }

  if (!imageBlob) {
    throw new Error("Face image is required for enrollment.");
  }

  const formData = new FormData();

  formData.append("student_id", String(studentId));
  formData.append("image", imageBlob, "face-capture.jpg");

  try {
    const response = await api.post("/face/enroll", formData);
    return response.data;
  } catch (error) {
    console.error("Face enrollment request failed:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      contentType: error.config?.headers?.["Content-Type"],
    });

    throw error;
  }
}
