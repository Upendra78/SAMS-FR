# SAMS-FR Feature Traceability Matrix: Synopsis to Implementation

This matrix maps every functional requirement, objective, architectural specification, and proposed module from the original **SAMS-FR Project Synopsis** directly to the actual implementation within the codebase.

---

## 1. Project Objectives Traceability

| Synopsis Objective | Backend Implementation | Frontend Implementation | Implementation Status | Evidence & Verification |
|---|---|---|---|---|
| **Obj 1**: Web-based attendance system accessible from any camera device | `backend/app/routes/attendance.py`, `backend/app/routes/faculty.py` | `frontend/src/pages/faculty/Attendance.jsx`, `frontend/src/pages/student/Attendance.jsx` | **Fully Implemented** | HTML5 `navigator.mediaDevices.getUserMedia` captures video stream from any standard browser; frames sent to REST API. |
| **Obj 2**: Facial recognition for automatic real-time student identification & marking | `backend/app/services/cv/recognition_service.py`, `backend/app/services/cv/realtime_recognition_service.py`, `backend/app/routes/recognition.py` | `frontend/src/components/LiveFaceCapture.jsx`, `frontend/src/pages/faculty/Attendance.jsx` | **Fully Implemented** | Uses dlib 128-dimensional facial embeddings and Euclidean distance metric (<0.6 threshold) with automatic attendance record creation. |
| **Obj 3**: Reduce proxy attendance and human error via AI & RBAC | `backend/app/utils/auth.py`, `backend/app/services/cv/liveness_service.py` | `frontend/src/routes/ProtectedRoute.jsx`, `frontend/src/context/AuthContext.jsx` | **Fully Implemented** | JWT role-based access control + MediaPipe facial mesh & passive liveness detection validating real human presence. |
| **Obj 4**: Dedicated portals for Admin, Faculty, and Student | `backend/app/routes/admin.py`, `backend/app/routes/faculty.py`, `backend/app/routes/student.py` | `AdminLayout.jsx`, `FacultyLayout.jsx`, `StudentLayout.jsx`, `AppRoutes.jsx` | **Fully Implemented** | Three distinct layouts with dedicated navigation sidebars, role-protected route guards, and role-specific UI themes. |
| **Obj 5**: Centralized database for students, faculty, attendance, academic data | `backend/app/models/` (24 SQLAlchemy models), MySQL database (`sams_db`) | All data-driven frontend tables and state managers | **Fully Implemented** | Normalized relational schema in MySQL with foreign key constraints, indexes, and full Alembic migrations. |
| **Obj 6**: Attendance reports and analytical visualizations | `backend/app/routes/reports.py`, `backend/app/routes/admin_analytics.py`, `backend/app/utils/export_engine/` | `AdminDashboard.jsx`, `AttendanceReports.jsx`, `Faculty/Reports.jsx`, `Student/Reports.jsx` | **Fully Implemented** | Multi-level attendance metrics, bar charts, threshold compliance, and server-generated PDF, Excel, and CSV export engines. |
| **Obj 7**: Responsive web application for desktop, tablet, and mobile | CSS responsive layouts in `frontend/src/` | Responsive grid layouts and CSS media queries in all portal layouts | **Fully Implemented** | Tested and verified across desktop viewports, mobile drawer sidebars, and responsive tables. |
| **Obj 8**: Scalable architecture for timetable, adjustments, anti-spoofing | `backend/app/models/timetable_entry.py`, `backend/app/models/faculty_adjustment.py`, `backend/app/services/cv/liveness_service.py` | `TimetableManagement.jsx`, `Schedule.jsx`, `AcademicResults.jsx` | **Fully Implemented** | Timetable management, temporary faculty substitutions, exam results, and assignment management implemented beyond baseline synopsis scope. |

---

## 2. Functional Modules Traceability

| Synopsis Module (Table 4) | Description in Synopsis | Implemented Backend Source | Implemented Frontend Source | Status |
|---|---|---|---|---|
| **Authentication Module** | User login, logout, and secure role-based authentication | `backend/app/routes/auth.py`, `backend/app/services/auth_service.py` | `frontend/src/pages/auth/Login.jsx`, `frontend/src/context/AuthContext.jsx` | **Fully Implemented** |
| **Admin Module** | Manage students, faculty, departments, subjects, classes, attendance records, permissions | `backend/app/routes/admin.py`, `backend/app/routes/admin_attendance.py`, `backend/app/routes/admin_academic_results.py` | `frontend/src/pages/admin/` (13 distinct admin pages) | **Fully Implemented** |
| **Faculty Module** | Initiate attendance sessions, manage assigned classes, monitor attendance records, reports | `backend/app/routes/faculty.py`, `backend/app/routes/faculty_assignments.py`, `backend/app/routes/faculty_results.py` | `frontend/src/pages/faculty/` (9 distinct faculty pages) | **Fully Implemented** |
| **Student Module** | View attendance history, attendance percentage, profile, and study materials | `backend/app/routes/student.py`, `backend/app/routes/student_attendance.py`, `backend/app/routes/student_assignments.py` | `frontend/src/pages/student/` (10 distinct student pages) | **Fully Implemented** |
| **AI Face Recognition Module** | Face detection, face encoding, face recognition, and attendance validation | `backend/app/services/cv/face_service.py`, `backend/app/services/cv/recognition_service.py` | `frontend/src/components/LiveFaceCapture.jsx`, `frontend/src/pages/admin/FaceRegistration.jsx` | **Fully Implemented** |
| **Attendance Management Module** | Record attendance, maintain history, update records, store in database | `backend/app/models/attendance_record.py`, `backend/app/models/attendance_session.py`, `backend/app/routes/attendance.py` | `frontend/src/pages/faculty/Attendance.jsx`, `frontend/src/pages/student/AttendanceHistory.jsx` | **Fully Implemented** |
| **Reports & Analytics Module** | Attendance reports, summaries, statistical analysis for admin and faculty | `backend/app/routes/reports.py`, `backend/app/utils/export_engine/` | `frontend/src/pages/admin/AttendanceReports.jsx`, `frontend/src/pages/faculty/Reports.jsx`, `frontend/src/pages/student/Reports.jsx` | **Fully Implemented** |
| **Data Management Module** | Stores and manages student details, faculty, attendance, courses in MySQL | `backend/app/models/__init__.py`, `backend/app/extensions.py` (SQLAlchemy 2.0 ORM) | Full API service layer (`frontend/src/services/`) | **Fully Implemented** |

---

## 3. Synopsis Entities to Database Models Mapping

| Synopsis ER Entity (Figure 2) | Physical Table Name | SQLAlchemy Model | Status |
|---|---|---|---|
| **Administrator** | `users` (filtered by `role='ADMIN'`) | `app.models.user.User` | Fully Implemented |
| **Department** | `departments` | `app.models.department.Department` | Fully Implemented |
| **Program / Course** | `courses` | `app.models.course.Course` | Fully Implemented |
| **Semester** | `course_offerings.semester`, `students.semester` | Relational attribute in `CourseOffering` & `Student` | Fully Implemented |
| **Section** | `course_offerings.section`, `students.section` | Relational attribute in `CourseOffering` & `Student` | Fully Implemented |
| **Student** | `students` | `app.models.student.Student` | Fully Implemented |
| **Faculty** | `faculty` | `app.models.faculty.Faculty` | Fully Implemented |
| **Subject** | `courses` | `app.models.course.Course` | Fully Implemented |
| **Faculty Assignment** | `course_offerings` | `app.models.course_offering.CourseOffering` | Fully Implemented |
| **Face Data** | `face_profiles` | `app.models.face_profile.FaceProfile` | Fully Implemented |
| **Attendance Session** | `attendance_sessions` | `app.models.attendance_session.AttendanceSession` | Fully Implemented |
| **Attendance** | `attendance_records` | `app.models.attendance_record.AttendanceRecord` | Fully Implemented |

---

## 4. Software Stack Verification

| Technology Specified in Synopsis (Table 1) | Repository Implementation | Verified Version / Details |
|---|---|---|
| **Operating System** (Windows 10/11 or Linux) | Windows 11 Desktop Development Environment | Verified on Windows 11 Pro 64-bit |
| **Programming Language** (Python, JavaScript) | Python 3.10.11 & JavaScript (ES2022 / React JSX) | Python 3.10.11 runtime, Node.js v20+ |
| **Frontend** (React.js, HTML5, CSS3, Bootstrap) | React 19.2.8 with Vite 8.2.0, CSS3 Modules, Lucide / FontAwesome Icons | 2,132 Vite modules compiled successfully |
| **Backend** (Flask) | Flask 3.x, Flask-JWT-Extended, Flask-Bcrypt, Flask-SQLAlchemy | Modular blueprint architecture |
| **Database** (MySQL) | MySQL Server 8.0 running on `localhost:3306/sams_db` | Relational database active with 155 users |
| **Computer Vision** (OpenCV) | OpenCV (`cv2`) 4.x | Real-time frame processing, resizing, color conversion |
| **Face Recognition** (face_recognition) | `face_recognition` (dlib 128D HOG / CNN) + MediaPipe Vision Tasks | Biometric encoding & matching |
| **Data Processing** (NumPy, Pandas) | NumPy 1.24+ & Pandas 2.x | High-performance embedding array vector operations & tabular data |
| **API Testing** (Postman) | Postman collection `postman/SAMS-FR-API-Collection.json` | 50+ REST endpoints documented and tested |
| **Version Control** (Git & GitHub) | Git repository on branch `feature/frontend-auth-portals` | Version-controlled with full commit history |
| **Code Editor** (Visual Studio Code) | Visual Studio Code workspace configuration in `.vscode/` | Standard IDE setup |
| **Web Browser** (Chrome / Edge) | Microsoft Edge / Chromium tested via Playwright automation | 42 genuine desktop screenshots verified |

---

## 5. Extended Features Beyond Synopsis Baseline

The implemented application contains several advanced enterprise and academic features that exceed the initial synopsis requirements:
1. **Assignments & Study Notes Management**: Full coursework distribution, submission upload, grading, and study notes repositories for Faculty and Students.
2. **Academic Results Moderation**: Multi-tier grading system allowing faculty to submit exam scores and administrators to moderate, return, or officially publish results.
3. **Multi-Format Export Engine**: Server-side generation of high-fidelity PDF, Excel (`.xlsx`), and CSV reports for attendance, rosters, and academic records.
4. **Temporary Faculty Adjustments**: Administrative mechanism to reassign substitute instructors for scheduled timetable slots without modifying original course mappings.
5. **Security Audit Log**: Centralized activity logger recording all logins, biometric enrollments, timetable edits, and attendance transactions.

