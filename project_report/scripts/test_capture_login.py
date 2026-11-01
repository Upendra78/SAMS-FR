from playwright.sync_api import sync_playwright
import time

def test_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("Navigating to auth...")
        page.goto("http://localhost:5173/auth")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        page.screenshot(path="project_report/assets/screenshots/login/login_page.png")
        print("Captured login_page.png")

        # Click Administrator
        page.locator("button:has-text('Administrator')").click()
        time.sleep(0.5)
        page.screenshot(path="project_report/assets/screenshots/login/login_role_admin.png")
        print("Captured login_role_admin.png")

        # Fill credentials
        page.fill("input#email", "panditbikesh59@gmail.com")
        page.fill("input#password", "bikesh44")
        page.click("button.login-submit")

        # Wait for navigation
        page.wait_for_url("**/admin/**", timeout=10000)
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        page.screenshot(path="project_report/assets/screenshots/admin/admin_dashboard.png")
        print("Captured admin_dashboard.png at", page.url)

        browser.close()

if __name__ == "__main__":
    test_login()

