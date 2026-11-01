import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = "project_report/assets/screenshots"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def safe_click(page, selector, timeout=3000):
    try:
        el = page.locator(selector).first
        if el.is_visible(timeout=timeout):
            el.click()
            time.sleep(1)
            return True
    except Exception as e:
        print(f"Could not click {selector}: {e}")
    return False

def run_capture():
    ensure_dir(f"{SCREENSHOT_DIR}/login")
    ensure_dir(f"{SCREENSHOT_DIR}/admin")
    ensure_dir(f"{SCREENSHOT_DIR}/faculty")
    ensure_dir(f"{SCREENSHOT_DIR}/student")
    ensure_dir(f"{SCREENSHOT_DIR}/workflows")

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)

        # -------------------------------------------------------------
        # 1. LOGIN PORTAL
        # -------------------------------------------------------------
        print("=== CAPTURING LOGIN PORTAL ===")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.goto(f"{BASE_URL}/auth")
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        page.screenshot(path=f"{SCREENSHOT_DIR}/login/login_page.png")
        print("Saved: login_page.png")

        # Faculty role button
        page.locator("button:has-text('Faculty')").first.click()
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOT_DIR}/login/login_role_faculty.png")
        print("Saved: login_role_faculty.png")

        # Student role button
        page.locator("button:has-text('Student')").first.click()
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOT_DIR}/login/login_role_student.png")
        print("Saved: login_role_student.png")

        # Admin role button
        page.locator("button:has-text('Administrator')").first.click()
        time.sleep(0.5)
        page.screenshot(path=f"{SCREENSHOT_DIR}/login/login_role_admin.png")
        print("Saved: login_role_admin.png")

        context.close()

        # -------------------------------------------------------------
        # 2. ADMIN PORTAL
        # -------------------------------------------------------------
        print("=== CAPTURING ADMIN PORTAL ===")
        admin_context = browser.new_context(viewport={"width": 1440, "height": 900})
        admin_page = admin_context.new_page()

        admin_page.goto(f"{BASE_URL}/auth")
        admin_page.wait_for_load_state("networkidle")
        admin_page.locator("button:has-text('Administrator')").first.click()
        admin_page.fill("input#email", "panditbikesh59@gmail.com")
        admin_page.fill("input#password", "bikesh44")
        admin_page.click("button.login-submit")
        admin_page.wait_for_url("**/admin/**", timeout=10000)
        admin_page.wait_for_load_state("networkidle")
        time.sleep(2)

        admin_routes = [
            ("admin_dashboard.png", f"{BASE_URL}/admin/dashboard"),
            ("admin_student_management.png", f"{BASE_URL}/admin/students"),
            ("admin_face_registration.png", f"{BASE_URL}/admin/face-registration"),
            ("admin_faculty_management.png", f"{BASE_URL}/admin/faculty"),
            ("admin_department_management.png", f"{BASE_URL}/admin/departments"),
            ("admin_academic_management.png", f"{BASE_URL}/admin/academic-management"),
            ("admin_academic_results.png", f"{BASE_URL}/admin/academic-results"),
            ("admin_batch_management.png", f"{BASE_URL}/admin/batches"),
            ("admin_timetable_management.png", f"{BASE_URL}/admin/timetable"),
            ("admin_attendance_reports.png", f"{BASE_URL}/admin/attendance-reports"),
            ("admin_activity_logs.png", f"{BASE_URL}/admin/activity-logs"),
            ("admin_user_management.png", f"{BASE_URL}/admin/management"),
            ("admin_profile.png", f"{BASE_URL}/admin/profile"),
            ("admin_settings.png", f"{BASE_URL}/admin/settings"),
        ]

        for filename, url in admin_routes:
            try:
                admin_page.goto(url)
                admin_page.wait_for_load_state("networkidle")
                time.sleep(2)
                admin_page.screenshot(path=f"{SCREENSHOT_DIR}/admin/{filename}")
                print(f"Saved: admin/{filename}")
            except Exception as e:
                print(f"Error on {url}: {e}")

        # Workflow: Add Student Modal
        try:
            admin_page.goto(f"{BASE_URL}/admin/students")
            admin_page.wait_for_load_state("networkidle")
            time.sleep(1.5)
            # Find Add Student or Add User button
            if safe_click(admin_page, "button:has-text('Add Student')", timeout=3000) or safe_click(admin_page, "button:has-text('New Student')", timeout=2000):
                time.sleep(1)
                admin_page.screenshot(path=f"{SCREENSHOT_DIR}/workflows/workflow_admin_add_student_modal.png")
                print("Saved: workflow_admin_add_student_modal.png")
                # close modal if possible
                safe_click(admin_page, "button[aria-label='Close']", timeout=1000) or safe_click(admin_page, ".modal-close", timeout=1000)
        except Exception as e:
            print("Could not capture add student modal:", e)

        # Workflow: Face Registration Capture view
        try:
            admin_page.goto(f"{BASE_URL}/admin/face-registration")
            admin_page.wait_for_load_state("networkidle")
            time.sleep(2)
            admin_page.screenshot(path=f"{SCREENSHOT_DIR}/workflows/workflow_admin_face_registration_view.png")
            print("Saved: workflow_admin_face_registration_view.png")
        except Exception as e:
            print("Could not capture face reg view:", e)

        admin_context.close()

        # -------------------------------------------------------------
        # 3. FACULTY PORTAL
        # -------------------------------------------------------------
        print("=== CAPTURING FACULTY PORTAL ===")
        fac_context = browser.new_context(viewport={"width": 1440, "height": 900})
        fac_page = fac_context.new_page()

        fac_page.goto(f"{BASE_URL}/auth")
        fac_page.wait_for_load_state("networkidle")
        fac_page.locator("button:has-text('Faculty')").first.click()
        fac_page.fill("input#email", "rajesh.kumar01@example.com")
        fac_page.fill("input#password", "12345678")
        fac_page.click("button.login-submit")
        fac_page.wait_for_url("**/faculty/**", timeout=10000)
        fac_page.wait_for_load_state("networkidle")
        time.sleep(2)

        faculty_routes = [
            ("faculty_dashboard.png", f"{BASE_URL}/faculty/dashboard"),
            ("faculty_classes.png", f"{BASE_URL}/faculty/classes"),
            ("faculty_students.png", f"{BASE_URL}/faculty/students"),
            ("faculty_attendance.png", f"{BASE_URL}/faculty/attendance"),
            ("faculty_reports.png", f"{BASE_URL}/faculty/reports"),
            ("faculty_assignments_notes.png", f"{BASE_URL}/faculty/assignments"),
            ("faculty_result_upload.png", f"{BASE_URL}/faculty/results"),
            ("faculty_profile.png", f"{BASE_URL}/faculty/profile"),
            ("faculty_settings.png", f"{BASE_URL}/faculty/settings"),
        ]

        for filename, url in faculty_routes:
            try:
                fac_page.goto(url)
                fac_page.wait_for_load_state("networkidle")
                time.sleep(2)
                fac_page.screenshot(path=f"{SCREENSHOT_DIR}/faculty/{filename}")
                print(f"Saved: faculty/{filename}")
            except Exception as e:
                print(f"Error on {url}: {e}")

        # Workflow: Create Assignment Modal
        try:
            fac_page.goto(f"{BASE_URL}/faculty/assignments")
            fac_page.wait_for_load_state("networkidle")
            time.sleep(2)
            if safe_click(fac_page, "button:has-text('Create Assignment')", timeout=3000):
                time.sleep(1)
                fac_page.screenshot(path=f"{SCREENSHOT_DIR}/workflows/workflow_faculty_create_assignment_modal.png")
                print("Saved: workflow_faculty_create_assignment_modal.png")
                safe_click(fac_page, "button:has-text('Cancel')", timeout=1000) or safe_click(fac_page, ".close-btn", timeout=1000)
        except Exception as e:
            print("Could not capture create assignment modal:", e)

        # Workflow: Attendance Live Camera / Session view
        try:
            fac_page.goto(f"{BASE_URL}/faculty/attendance")
            fac_page.wait_for_load_state("networkidle")
            time.sleep(2)
            fac_page.screenshot(path=f"{SCREENSHOT_DIR}/workflows/workflow_faculty_attendance_session.png")
            print("Saved: workflow_faculty_attendance_session.png")
        except Exception as e:
            print("Could not capture faculty attendance session:", e)

        fac_context.close()

        # -------------------------------------------------------------
        # 4. STUDENT PORTAL
        # -------------------------------------------------------------
        print("=== CAPTURING STUDENT PORTAL ===")
        stu_context = browser.new_context(viewport={"width": 1440, "height": 900})
        stu_page = stu_context.new_page()

        stu_page.goto(f"{BASE_URL}/auth")
        stu_page.wait_for_load_state("networkidle")
        stu_page.locator("button:has-text('Student')").first.click()
        stu_page.fill("input#email", "priya.mehta02@example.com")
        stu_page.fill("input#password", "12345678")
        stu_page.click("button.login-submit")
        stu_page.wait_for_url("**/student/**", timeout=10000)
        stu_page.wait_for_load_state("networkidle")
        time.sleep(2)

        student_routes = [
            ("student_dashboard.png", f"{BASE_URL}/student/dashboard"),
            ("student_daily_punch.png", f"{BASE_URL}/student/attendance"),
            ("student_attendance_history.png", f"{BASE_URL}/student/attendance-history"),
            ("student_courses.png", f"{BASE_URL}/student/courses"),
            ("student_timetable.png", f"{BASE_URL}/student/timetable"),
            ("student_assignments_notes.png", f"{BASE_URL}/student/assignments"),
            ("student_reports.png", f"{BASE_URL}/student/reports"),
            ("student_academic_records.png", f"{BASE_URL}/student/academic-records"),
            ("student_profile.png", f"{BASE_URL}/student/profile"),
            ("student_settings.png", f"{BASE_URL}/student/settings"),
        ]

        for filename, url in student_routes:
            try:
                stu_page.goto(url)
                stu_page.wait_for_load_state("networkidle")
                time.sleep(2)
                stu_page.screenshot(path=f"{SCREENSHOT_DIR}/student/{filename}")
                print(f"Saved: student/{filename}")
            except Exception as e:
                print(f"Error on {url}: {e}")

        # Workflow: Student Assignment Submit/Detail view
        try:
            stu_page.goto(f"{BASE_URL}/student/assignments")
            stu_page.wait_for_load_state("networkidle")
            time.sleep(2)
            if safe_click(stu_page, "button:has-text('Submit')", timeout=3000) or safe_click(stu_page, "button:has-text('View')", timeout=3000):
                time.sleep(1)
                stu_page.screenshot(path=f"{SCREENSHOT_DIR}/workflows/workflow_student_assignment_modal.png")
                print("Saved: workflow_student_assignment_modal.png")
                safe_click(stu_page, "button:has-text('Cancel')", timeout=1000) or safe_click(stu_page, ".close-btn", timeout=1000)
        except Exception as e:
            print("Could not capture student assignment modal:", e)

        # Workflow: Student Daily Punch Face Detection UI
        try:
            stu_page.goto(f"{BASE_URL}/student/attendance")
            stu_page.wait_for_load_state("networkidle")
            time.sleep(2)
            stu_page.screenshot(path=f"{SCREENSHOT_DIR}/workflows/workflow_student_daily_punch_view.png")
            print("Saved: workflow_student_daily_punch_view.png")
        except Exception as e:
            print("Could not capture student daily punch view:", e)

        stu_context.close()
        browser.close()
        print("=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_capture()

