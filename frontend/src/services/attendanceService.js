import api from "./api";

export async function getStudentAttendance() {
  const response = await api.get("/attendance/student");
  return response.data;
}

const attendanceService = {
  getStudentAttendance,
};

export default attendanceService;