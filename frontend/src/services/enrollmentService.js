import api from "./api";

export async function getAdminEnrollments() {
  const response = await api.get(
    "/admin/enrollments",
  );

  return response.data;
}

export async function createAdminEnrollment(
  enrollmentData,
) {
  const response = await api.post(
    "/admin/enrollments",
    enrollmentData,
  );

  return response.data;
}

export async function deleteAdminEnrollment(
  enrollmentId,
) {
  const response = await api.delete(
    `/admin/enrollments/${enrollmentId}`,
  );

  return response.data;
}