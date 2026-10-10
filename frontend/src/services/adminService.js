import api from "./api";

// ==================== ADMIN DASHBOARD ====================

export async function getAdminDashboard() {
  const response = await api.get("/admin/dashboard");
  return response.data;
}

// ==================== USERS ====================

export async function getUsers() {
  const response = await api.get("/admin/users");
  return response.data;
}

export async function getUser(userId) {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
}

export async function createUser(userData) {
  const response = await api.post("/admin/users", userData);
  return response.data;
}

export async function updateUser(userId, userData) {
  const response = await api.patch(
    `/admin/users/${userId}`,
    userData,
  );
  return response.data;
}

export async function deleteUser(userId) {
  const response = await api.delete(
    `/admin/users/${userId}`,
  );
  return response.data;
}

// ==================== STUDENTS ====================

export async function getAdminStudents() {
  const response = await api.get("/admin/students");
  return response.data;
}

export async function getAdminStudent(studentId) {
  const response = await api.get(
    `/admin/students/${studentId}`,
  );
  return response.data;
}

export async function createAdminStudent(studentData) {
  const response = await api.post(
    "/admin/students",
    studentData,
  );
  return response.data;
}

export async function updateAdminStudent(
  studentId,
  studentData,
) {
  const response = await api.patch(
    `/admin/students/${studentId}`,
    studentData,
  );
  return response.data;
}

export async function deleteAdminStudent(studentId) {
  const response = await api.delete(
    `/admin/students/${studentId}`,
  );
  return response.data;
}

// ==================== FACULTY ====================

export async function getAdminFaculty() {
  const response = await api.get("/admin/faculty");
  return response.data;
}

export async function getAdminFacultyById(facultyId) {
  const response = await api.get(
    `/admin/faculty/${facultyId}`,
  );
  return response.data;
}

export async function createAdminFaculty(facultyData) {
  const response = await api.post(
    "/admin/faculty",
    facultyData,
  );
  return response.data;
}

export async function updateAdminFaculty(
  facultyId,
  facultyData,
) {
  const response = await api.patch(
    `/admin/faculty/${facultyId}`,
    facultyData,
  );
  return response.data;
}

export async function deleteAdminFaculty(facultyId) {
  const response = await api.delete(
    `/admin/faculty/${facultyId}`,
  );
  return response.data;
}

// ==================== ADMIN PROFILE ====================

export async function getAdminProfile() {
  const response = await api.get("/admin/profile");
  return response.data;
}

export async function updateAdminProfile(profileData) {
  const response = await api.patch(
    "/admin/profile",
    profileData,
  );
  return response.data;
}

// ==================== FACE PROFILES ====================

export async function getAdminFaceProfiles() {
  const response = await api.get("/admin/face-profiles");
  return response.data;
}

// ==================== ADMIN ATTENDANCE REPORTS ====================

export async function getAdminAttendanceSessions(params = {}) {
  const response = await api.get(
    "/admin/attendance/sessions",
    {
      params,
    },
  );

  return response.data;
}

export async function getAdminAttendanceSession(sessionId) {
  const response = await api.get(
    `/admin/attendance/sessions/${sessionId}`,
  );

  return response.data;
}

export async function getAdminAttendanceRecords(sessionId) {
  const response = await api.get(
    `/admin/attendance/sessions/${sessionId}/records`,
  );

  return response.data;
}

export async function getAdminAttendanceAnalytics(params = {}) {
  const response = await api.get(
    "/admin/attendance/analytics",
    {
      params,
    },
  );

  return response.data;
}


export async function getAdminDepartments() {
  const response = await api.get("/admin/departments");
  return response.data;
}


 // ==================== COURSE OFFERINGS ====================

export async function getAdminCourses() {
  const response = await api.get("/admin/courses");
  return response.data;
}

export async function getAdminCourseOfferings() {
  const response = await api.get("/admin/course-offerings");
  return response.data;
}

export async function createAdminCourseOffering(offeringData) {
  const response = await api.post(
    "/admin/course-offerings",
    offeringData,
  );
  return response.data;
}

export async function updateAdminCourseOffering(
  offeringId,
  offeringData,
) {
  const response = await api.patch(
    `/admin/course-offerings/${offeringId}`,
    offeringData,
  );
  return response.data;
}

export async function deleteAdminCourseOffering(offeringId) {
  const response = await api.delete(
    `/admin/course-offerings/${offeringId}`,
  );
  return response.data;
}

