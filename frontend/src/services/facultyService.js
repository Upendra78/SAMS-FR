import api from "./api";

export async function getFacultyProfile() {
  const response = await api.get("/faculty/profile");

  return response.data;
}

export async function updateFacultyProfile(profileData) {
  const response = await api.patch(
    "/faculty/profile",
    profileData
  );

  return response.data;
}

export async function changeFacultyPassword(passwordData) {
  const response = await api.post(
    "/faculty/change-password",
    passwordData
  );

  return response.data;
}

export async function getFacultyClassesSummary(params = {}) {
  const response = await api.get("/faculty/classes/summary", { params });

  return response.data;
}

export async function getFacultyCourses(params = {}) {
  const response = await api.get("/faculty/courses", { params });

  return response.data;
}

export async function getFacultyCourseDetails(courseId) {
  const response = await api.get(
    `/faculty/courses/${courseId}`
  );

  return response.data;
}

export async function getFacultyStudents(params = {}) {
  const response = await api.get("/faculty/students", { params });

  return response.data;
}

export async function getFacultyAttendanceSessions(params = {}) {
  const response = await api.get(
    "/faculty/attendance/sessions",
    { params }
  );

  return response.data;
}

export async function getActiveFacultyAttendanceSession(params = {}) {
  const response = await api.get(
    "/faculty/attendance/sessions/active",
    { params }
  );

  return response.data;
}

export async function startFacultyAttendanceSession(
  offeringIdOrPayload,
  timetableEntryId = null
) {
  const payload =
    typeof offeringIdOrPayload === "object" && offeringIdOrPayload !== null
      ? { ...offeringIdOrPayload }
      : {
          offering_id: offeringIdOrPayload,
          ...(timetableEntryId ? { timetable_entry_id: timetableEntryId } : {}),
        };

  const response = await api.post(
    "/faculty/attendance/sessions",
    payload
  );

  return response.data;
}


export async function closeFacultyAttendanceSession(
  sessionId
) {
  const response = await api.post(
    `/faculty/attendance/sessions/${sessionId}/close`
  );

  return response.data;
}

export async function getFacultyAttendanceRecords(
  sessionId
) {
  const response = await api.get(
    `/faculty/attendance/sessions/${sessionId}/records`
  );

  return response.data;
}

export async function recognizeFacultyAttendance(
  sessionId,
  imageBlob
) {
  const formData = new FormData();

  formData.append(
    "session_id",
    String(sessionId)
  );

  formData.append(
    "image",
    imageBlob,
    "attendance-frame.jpg"
  );

  const response = await api.post(
    "/faculty/recognition/attendance",
    formData
  );

  return response.data;
}

export async function getFacultyTimetable(params = {}) {
  const response = await api.get("/timetable/faculty", { params });

  return response.data;
}

export async function getFacultyAttendanceOverview(params = {}) {
  const response = await api.get("/faculty/attendance/overview", { params });

  return response.data;
}

export async function getSystemHealth() {
  const response = await api.get("/db-health");

  return response.data;
}
