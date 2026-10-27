import os
import sys

sys.path.insert(0, os.path.abspath("backend"))

from app import create_app
from app.models import User
from flask_jwt_extended import create_access_token

def verify():
    app = create_app()
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    with app.app_context():
        admin = User.query.filter_by(role="ADMIN").first()
        token = create_access_token(identity=str(admin.user_id), additional_claims={"role": "ADMIN"})
        client = app.test_client()
        headers = {"Authorization": f"Bearer {token}"}

        print("=== VERIFYING GROUP PREVIEWS ===")
        for sem, expected_courses in [(3, 12), (5, 13), (7, 10)]:
            # Test without cohort (letting backend derive cohort from 2026-2027 session)
            res = client.post("/api/admin/enrollments/group-preview", headers=headers, json={
                "department_id": 23,
                "academic_year": "2026-2027",
                "semester": sem,
                "section": "A",
            })
            data = res.get_json()
            assert res.status_code == 200, f"Status: {res.status_code}, data: {data}"
            assert data["success"] is True
            courses = data["data"]["courses"]
            students = data["data"]["students"]
            cohort = data["data"]["cohort"]
            print(f"Sem {sem} Sec A (session 2026-2027): derived cohort={cohort}, courses={len(courses)} (expected {expected_courses}), students={len(students)}")
            assert len(courses) == expected_courses, f"Sem {sem}: expected {expected_courses} courses, got {len(courses)}"
            assert len(students) == 10, f"Sem {sem}: expected 10 students, got {len(students)}"

        print("\n=== VERIFYING ENROLLMENT SUMMARY ===")
        res_sum = client.get("/api/admin/enrollments/summary", headers=headers)
        sum_data = res_sum.get_json()
        assert res_sum.status_code == 200
        groups = sum_data["data"]["groups"]
        print(f"Total groups in summary: {len(groups)}")
        for g in groups:
            gid = g["group_id"]
            b = g["batch"]
            c = g.get("cohort")
            s = g["semester"]
            sec = g["section"]
            ay = g["academic_year"]
            cc = g["courses_count"]
            tot = g["total_students"]
            print(f"  Group: {gid}, Batch: {b}, Cohort: {c}, Sem: {s}, Sec: {sec}, AY: {ay}, Courses: {cc}, Students: {tot}")

        print("\nAll API verification assertions passed successfully!")

if __name__ == "__main__":
    verify()
