
import api from "./api";

export async function getAdminTimetable() {
  const response = await api.get("/timetable/admin");
  return response.data;
}

export async function getImportAcademicYears() {
  const response = await api.get("/timetable/import/academic-years");
  return response.data;
}

export async function getImportWorkbookSheets(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/timetable/import/sheets", formData);
  return response.data;
}

export async function previewTimetableImport(file, sheetName = "") {
  const formData = new FormData();
  formData.append("file", file);
  if (sheetName) {
    formData.append("sheet_name", sheetName);
  }

  const response = await api.post("/timetable/import/preview", formData);
  return response.data;
}

export async function analyzeTimetableImport(file, academicYear, sheetName = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("academic_year", academicYear);
  if (sheetName) {
    formData.append("sheet_name", sheetName);
  }

  const response = await api.post("/timetable/import/analyze", formData);
  return response.data;
}

export async function commitTimetableImport(payload) {
  const response = await api.post("/timetable/import/commit", payload);
  return response.data;
}
