# SAMS-FR Screenshot Register

This register documents all genuine desktop application screenshots captured from the live, running Smart Attendance Management System with Facial Recognition (SAMS-FR) deployment.

**Capture Environment**:
- Operating System: Windows 11
- Viewport Resolution: 1440 × 900 px (Desktop Standard)
- Capture Method: Headless Microsoft Edge browser via automated Playwright execution
- Frontend Server: Vite development server on `http://localhost:5173`
- Backend Server: Flask application server on `http://127.0.0.1:5000`
- Database: Active MySQL instance (`sams_db`) with relational academic data
- Date Captured: 2026-10-31

---

## 1. Authentication Portal

| Filename | Portal | Page Name | Route | Date Captured | Status | Description |
|---|---|---|---|---|---|---|
| `login_page.png` | Auth | Central Login Page | `/auth` | 2026-10-31 | Verified | Default authentication portal landing page with portal switcher and credentials input. |
| `login_role_admin.png` | Auth | Admin Role Selection | `/auth` | 2026-10-31 | Verified | Active Administrator tab selection with custom role-focused styling and inputs. |
| `login_role_faculty.png` | Auth | Faculty Role Selection | `/auth` | 2026-10-31 | Verified | Active Faculty tab selection displaying faculty-targeted authentication card. |
| `login_role_student.png` | Auth | Student Role Selection | `/auth` | 2026-10-31 | Verified | Active Student tab selection displaying student authentication portal view. |

---

## 2. Administrator Portal

| Filename | Portal | Page Name | Route | Date Captured | Status | Description |
|---|---|---|---|---|---|---|
| `admin_dashboard.png` | Admin | System Overview Dashboard | `/admin/dashboard` | 2026-10-31 | Verified | Real-time system statistics, quick stats cards, today's attendance trends, and activity metrics. |
| `admin_student_management.png` | Admin | Student Directory & Management | `/admin/students` | 2026-10-31 | Verified | Full student table with search, semester/section filtering, roll numbers, and enrollment records. |
| `admin_face_registration.png` | Admin | Biometric Face Registration | `/admin/face-registration` | 2026-10-31 | Verified | Multi-view facial profile capture and enrollment interface with face detection indicators. |
| `admin_faculty_management.png` | Admin | Faculty Directory | `/admin/faculty` | 2026-10-31 | Verified | Faculty member management, designations, departments, employee IDs, and account statuses. |
| `admin_department_management.png` | Admin | Department Management | `/admin/departments` | 2026-10-31 | Verified | Academic department records, department codes, course counts, and faculty assignments. |
| `admin_academic_management.png` | Admin | Academic Curriculum & Courses | `/admin/academic-management` | 2026-10-31 | Verified | Course offerings, semester mapping, credit allocations, and academic year configurations. |
| `admin_academic_results.png` | Admin | Academic Results Verification | `/admin/academic-results` | 2026-10-31 | Verified | Institutional academic result moderation, grading scale enforcement, and publish approval workflow. |
| `admin_batch_management.png` | Admin | Batch & Semester Management | `/admin/batches` | 2026-10-31 | Verified | Batch graduation timelines, active academic session ranges, and student group assignments. |
| `admin_timetable_management.png` | Admin | Master Timetable Management | `/admin/timetable` | 2026-10-31 | Verified | Interactive class schedules, room allocations, timeslots, and temporary faculty adjustment controls. |
| `admin_attendance_reports.png` | Admin | Attendance Reports & Analytics | `/admin/attendance-reports` | 2026-10-31 | Verified | Institution-wide attendance statistics, aggregate charts, and multi-format export engines (PDF/Excel/CSV). |
| `admin_activity_logs.png` | Admin | Security & Audit Activity Logs | `/admin/activity-logs` | 2026-10-31 | Verified | Comprehensive immutable audit trail recording logins, attendance punches, and administrative changes. |
| `admin_user_management.png` | Admin | User Accounts & Access Control | `/admin/management` | 2026-10-31 | Verified | System users, role allocations (ADMIN, FACULTY, STUDENT), account activation, and credential reset. |
| `admin_profile.png` | Admin | Administrator Profile | `/admin/profile` | 2026-10-31 | Verified | Authenticated administrator personal information, security preferences, and session details. |
| `admin_settings.png` | Admin | System Settings & Configuration | `/admin/settings` | 2026-10-31 | Verified | Global attendance threshold parameters, liveness detection tolerances, and system configuration. |

---

## 3. Faculty Portal

| Filename | Portal | Page Name | Route | Date Captured | Status | Description |
|---|---|---|---|---|---|---|
| `faculty_dashboard.png` | Faculty | Faculty Dashboard | `/faculty/dashboard` | 2026-10-31 | Verified | Summary cards for active courses, today's schedule, pending reviews, and average class attendance. |
| `faculty_classes.png` | Faculty | Assigned Classes & Offerings | `/faculty/classes` | 2026-10-31 | Verified | Class cards, semester/section details, student strength, and class roster export controls. |
| `faculty_students.png` | Faculty | Student Roster & Academic Status | `/faculty/students` | 2026-10-31 | Verified | Enrolled students per class, individual attendance percentages, and academic warning indicators. |
| `faculty_attendance.png` | Faculty | Attendance Marking & Live Session | `/faculty/attendance` | 2026-10-31 | Verified | Real-time computer vision attendance session launcher, camera stream, and manual attendance override. |
| `faculty_reports.png` | Faculty | Course Attendance Reports | `/faculty/reports` | 2026-10-31 | Verified | Detailed session-wise attendance registers, date filtering, and server-side PDF/Excel/CSV exports. |
| `faculty_assignments_notes.png` | Faculty | Assignments & Notes Management | `/faculty/assignments` | 2026-10-31 | Verified | Coursework management hub: assignment creation, study material uploads, and submission tracking. |
| `faculty_result_upload.png` | Faculty | Academic Result Entry | `/faculty/results` | 2026-10-31 | Verified | Internal assessment marks entry, gradebook evaluation, and submission to admin for publishing. |
| `faculty_profile.png` | Faculty | Faculty Profile | `/faculty/profile` | 2026-10-31 | Verified | Instructor profile, department affiliation, employee identification, and assigned courses. |
| `faculty_settings.png` | Faculty | Account & Class Settings | `/faculty/settings` | 2026-10-31 | Verified | Notification preferences, display modes, and security settings for faculty accounts. |

---

## 4. Student Portal

| Filename | Portal | Page Name | Route | Date Captured | Status | Description |
|---|---|---|---|---|---|---|
| `student_dashboard.png` | Student | Student Dashboard | `/student/dashboard` | 2026-10-31 | Verified | Overall attendance percentage, quick punch status, upcoming schedule, and coursework alerts. |
| `student_daily_punch.png` | Student | Daily Punch / Face Verification | `/student/attendance` | 2026-10-31 | Verified | Automated facial verification portal for student self-marking with active camera integration. |
| `student_attendance_history.png` | Student | Attendance History Log | `/student/attendance-history` | 2026-10-31 | Verified | Chronological record of all past attendance sessions, timestamps, subjects, and statuses. |
| `student_courses.png` | Student | My Classes & Enrolled Subjects | `/student/courses` | 2026-10-31 | Verified | List of active course enrollments, subject codes, faculty details, and syllabus progress. |
| `student_timetable.png` | Student | Weekly Schedule / Timetable | `/student/timetable` | 2026-10-31 | Verified | Weekly timetable grid displaying class periods, subject slots, classroom locations, and faculty. |
| `student_assignments_notes.png` | Student | Assignments & Notes Hub | `/student/assignments` | 2026-10-31 | Verified | Student coursework hub: pending assignments, notes downloads, upcoming deadlines, and results. |
| `student_reports.png` | Student | Subject-wise Attendance Report | `/student/reports` | 2026-10-31 | Verified | Subject-by-subject attendance analysis, required classes to reach 75% threshold, and PDF download. |
| `student_academic_records.png` | Student | Academic Records & Transcripts | `/student/academic-records` | 2026-10-31 | Verified | Formal academic grades, semester GPA, credit evaluations, and official PDF report card export. |
| `student_profile.png` | Student | Student Personal Profile | `/student/profile` | 2026-10-31 | Verified | Personal demographics, roll number, academic year, semester, contact information, and signature. |
| `student_settings.png` | Student | Account & Security Settings | `/student/settings` | 2026-10-31 | Verified | Password change utility, appearance preferences (theme toggles), and notification preferences. |

---

## 5. System Workflows

| Filename | Workflow | Context | Date Captured | Status | Description |
|---|---|---|---|---|---|
| `workflow_admin_add_student_modal.png` | Admin Dialog | Student Registration Modal | 2026-10-31 | Verified | Modal form for enrolling a new student into the centralized system. |
| `workflow_admin_face_registration_view.png` | Admin Biometric | Multi-Face Enrollment Interface | 2026-10-31 | Verified | Admin-supervised facial biometric data acquisition and validation. |
| `workflow_faculty_attendance_session.png` | Faculty Attendance | Live Facial Recognition Session | 2026-10-31 | Verified | Faculty camera session detecting enrolled students and marking attendance. |
| `workflow_faculty_create_assignment_modal.png` | Faculty Coursework | Create Assignment Modal | 2026-10-31 | Verified | Assignment creation modal with class selection, deadlines, allowed submissions, and attachments. |
| `workflow_student_daily_punch_view.png` | Student Biometric | Student Facial Recognition Punch | 2026-10-31 | Verified | Student-side face verification view confirming attendance recording. |

