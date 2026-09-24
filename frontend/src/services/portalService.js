import api from "./api";

export async function getFacultyDashboard() {
  const response = await api.get("/faculty/dashboard");
  return response.data;
}

export async function getStudentDashboard() {
  const response = await api.get("/student/dashboard");
  return response.data;
}