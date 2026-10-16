
import api from "./api";

export async function getAdminTimetable() {
  const response = await api.get("/timetable/admin");
  return response.data;
}

export async function previewTimetableImport(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/timetable/import/preview",
    formData
  );

  return response.data;
}
