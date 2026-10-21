
import api from "./api";

export async function getStudentAttendance(params = {}) {
  const response = await api.get("/student/attendance/", {
    params,
  });

  return response.data;
}

export async function getStudentAttendanceSummary() {
  const response = await api.get("/student/attendance/summary");
  return response.data;
}

export async function getStudentCourses() {
  const response = await api.get("/student/courses");
  return response.data;
}
