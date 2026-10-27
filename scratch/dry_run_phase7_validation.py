import os
import sys

sys.path.insert(0, os.path.abspath("backend"))

from app import create_app, db
from app.models import Course, CourseOffering

def run_dry_run():
    app = create_app()
    with app.app_context():
        print("=== PRE-FLIGHT VALIDATION (DRY RUN) ===")
        
        # 1. Inspect BCSE-634
        bcse634 = Course.query.filter_by(course_code="BCSE-634").all()
        print(f"Found {len(bcse634)} course(s) matching BCSE-634:")
        for c in bcse634:
            print(f"  ID={c.course_id}, Code={c.course_code}, Name={c.course_name}, Sem={c.semester}, Batch={c.batch}")
        assert len(bcse634) == 1, f"Expected exactly 1 course for BCSE-634, found {len(bcse634)}"
        assert bcse634[0].semester == 7, f"Expected semester 7 for BCSE-634, found {bcse634[0].semester}"

        # 2. Inspect Target Courses for Semesters 3, 5, 7
        sem3_courses = Course.query.filter_by(semester=3, is_active=True).order_by(Course.course_id).all()
        sem5_courses = Course.query.filter_by(semester=5, is_active=True).order_by(Course.course_id).all()
        sem7_courses = Course.query.filter_by(semester=7, is_active=True).order_by(Course.course_id).all()

        print(f"\nTarget Courses:")
        print(f"  Semester 3: {len(sem3_courses)} courses (IDs: {[c.course_id for c in sem3_courses]})")
        print(f"  Semester 5: {len(sem5_courses)} courses (IDs: {[c.course_id for c in sem5_courses]})")
        print(f"  Semester 7: {len(sem7_courses)} courses (IDs: {[c.course_id for c in sem7_courses]})")

        assert len(sem3_courses) == 12, f"Expected 12 courses for Sem 3, found {len(sem3_courses)}"
        assert len(sem5_courses) == 13, f"Expected 13 courses for Sem 5, found {len(sem5_courses)}"
        assert len(sem7_courses) == 10, f"Expected 10 courses for Sem 7, found {len(sem7_courses)}"

        all_target_courses = sem3_courses + sem5_courses + sem7_courses
        assert len(all_target_courses) == 35, f"Expected 35 target courses, found {len(all_target_courses)}"

        # 3. Check for any existing offerings in 2026-2027 for these courses and sections
        existing_offerings = CourseOffering.query.filter(
            CourseOffering.academic_year == "2026-2027",
            CourseOffering.semester.in_([3, 5, 7]),
        ).all()
        print(f"\nExisting 2026-2027 offerings for Sem 3, 5, 7: {len(existing_offerings)}")
        assert len(existing_offerings) == 0, f"Expected 0 existing offerings for Sem 3, 5, 7, found {len(existing_offerings)}"

        # Check existing total offerings
        total_before = CourseOffering.query.count()
        print(f"Total offerings before insertion: {total_before}")
        assert total_before == 22, f"Expected exactly 22 offerings (Sem 1) before insertion, found {total_before}"

        print("\nDry-run validation successful! Ready for transactional execution.")

if __name__ == "__main__":
    run_dry_run()
