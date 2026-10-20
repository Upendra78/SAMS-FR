import pytest
from flask_jwt_extended import create_access_token, get_csrf_token

from app import create_app, db
from app.models import User, Student, Faculty, Course, CourseOffering, AttendanceSession, AttendanceRecord


@pytest.fixture
def app():
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def get_auth_headers(client, user_id, role):
    token = create_access_token(
        identity=str(user_id),
        additional_claims={"role": role},
    )
    csrf = get_csrf_token(token)
    client.set_cookie("access_token_cookie", token)
    client.set_cookie("csrf_access_token", csrf)
    return {"X-CSRF-TOKEN": csrf}


def test_admin_attendance_endpoints_access_control(app, client):
    with app.app_context():
        # 1. Unauthenticated request must return 401
        res = client.get("/api/admin/attendance/dashboard")
        assert res.status_code == 401

        # 2. Student role must return 403
        student_user = User.query.filter_by(role="STUDENT").first()
        if student_user:
            headers = get_auth_headers(client, student_user.user_id, "STUDENT")
            res = client.get("/api/admin/attendance/dashboard", headers=headers)
            assert res.status_code == 403

        # 3. Faculty role must return 403
        faculty_user = User.query.filter_by(role="FACULTY").first()
        if faculty_user:
            headers = get_auth_headers(client, faculty_user.user_id, "FACULTY")
            res = client.get("/api/admin/attendance/dashboard", headers=headers)
            assert res.status_code == 403


def test_admin_attendance_reports_workflow(app, client):
    with app.app_context():
        admin_user = User.query.filter_by(role="ADMIN").first()
        if not admin_user:
            pytest.skip("No admin user found in database")

        headers = get_auth_headers(client, admin_user.user_id, "ADMIN")

        # 1. Test Filter Options
        res = client.get("/api/admin/attendance/filter-options", headers=headers)
        assert res.status_code == 200
        res_json = res.get_json()
        assert res_json.get("success") is True
        assert "academic_years" in res_json
        assert "semesters" in res_json
        assert "sections" in res_json
        assert "courses" in res_json
        assert "faculty" in res_json
        assert "date_range" in res_json

        # 2. Test Dashboard KPI & Chart Aggregations
        res_dash = client.get("/api/admin/attendance/dashboard", headers=headers)
        assert res_dash.status_code == 200
        dash_data = res_dash.get_json()
        assert dash_data.get("success") is True
        assert "kpi" in dash_data
        assert "total_present" in dash_data["kpi"]
        assert "total_absent" in dash_data["kpi"]
        assert "total_classes" in dash_data["kpi"]
        assert "attendance_rate" in dash_data["kpi"]
        assert "trend" in dash_data
        assert "by_course" in dash_data
        assert "by_section" in dash_data

        # 3. Test Attendance Records List with Pagination
        res_rec = client.get("/api/admin/attendance/records?page=1&per_page=10", headers=headers)
        assert res_rec.status_code == 200
        rec_data = res_rec.get_json()
        assert rec_data.get("success") is True
        assert "data" in rec_data
        assert "total_records" in rec_data
        assert "total_pages" in rec_data
        assert rec_data["page"] == 1

        # 4. Test Single Record Detail (404 on invalid id)
        res_detail_404 = client.get("/api/admin/attendance/records/999999", headers=headers)
        assert res_detail_404.status_code == 404

        # 5. Test Export CSV
        res_export = client.get("/api/admin/attendance/export", headers=headers)
        assert res_export.status_code == 200
        assert "text/csv" in res_export.content_type
        assert "attendance_report" in res_export.headers.get("Content-Disposition", "")
