import os
import sys

sys.path.insert(0, os.path.abspath("backend"))

from app import create_app, db
from app.models import Course, CourseOffering
from collections import Counter

BACKUP_PATH = r"C:\Users\pandi\MySQL_Backups\sams_db_backup_phase7_20261027_164737.sql"

def execute_updates():
    print("=== SAMS-FR PHASE 7 DATABASE UPDATE EXECUTION ===")
    
    # Step 0: Verify backup
    if not os.path.exists(BACKUP_PATH):
        raise FileNotFoundError(f"Backup file not found at: {BACKUP_PATH}")
    backup_size = os.path.getsize(BACKUP_PATH)
    if backup_size < 100000:
        raise ValueError(f"Backup file appears incomplete: size = {backup_size} bytes")
    print(f"[OK] Backup verified: {BACKUP_PATH} ({backup_size:,} bytes)")

    app = create_app()
    with app.app_context():
        # Pre-execution counts
        total_courses_before = Course.query.count()
        total_offerings_before = CourseOffering.query.count()
        print(f"Pre-check: Total courses = {total_courses_before}, Total offerings = {total_offerings_before}")

        assert total_offerings_before == 22, f"Expected 22 offerings before insertion, found {total_offerings_before}"

        # Target courses
        sem3_courses = Course.query.filter_by(semester=3, is_active=True).order_by(Course.course_id).all()
        sem5_courses = Course.query.filter_by(semester=5, is_active=True).order_by(Course.course_id).all()
        sem7_courses = Course.query.filter_by(semester=7, is_active=True).order_by(Course.course_id).all()

        assert len(sem3_courses) == 12, f"Expected 12 Sem 3 courses, found {len(sem3_courses)}"
        assert len(sem5_courses) == 13, f"Expected 13 Sem 5 courses, found {len(sem5_courses)}"
        assert len(sem7_courses) == 10, f"Expected 10 Sem 7 courses, found {len(sem7_courses)}"

        target_courses = sem3_courses + sem5_courses + sem7_courses
        assert len(target_courses) == 35, f"Expected 35 courses, found {len(target_courses)}"

        try:
            # 1. Update Course 85 (BCSE-634) batch to '2023'
            course_bcse = Course.query.filter_by(course_id=85, course_code="BCSE-634").first()
            if not course_bcse:
                raise ValueError("Course ID 85 (BCSE-634) not found")
            print(f"Before update: Course {course_bcse.course_id} ({course_bcse.course_code}) batch = '{course_bcse.batch}'")
            course_bcse.batch = "2023"
            db.session.flush()
            print(f"After update: Course {course_bcse.course_id} ({course_bcse.course_code}) batch = '{course_bcse.batch}'")

            # 2. Insert 70 course offerings
            new_offerings = []
            for c in target_courses:
                for section in ["A", "B"]:
                    # Check for duplicate
                    dup = CourseOffering.query.filter_by(
                        course_id=c.course_id,
                        academic_year="2026-2027",
                        semester=c.semester,
                        section=section,
                    ).first()
                    if dup:
                        raise ValueError(f"Duplicate offering detected: Course {c.course_id}, Sem {c.semester}, Sec {section}")

                    offering = CourseOffering(
                        course_id=c.course_id,
                        faculty_id=None,
                        academic_year="2026-2027",
                        semester=c.semester,
                        section=section,
                        room=None,
                    )
                    new_offerings.append(offering)

            assert len(new_offerings) == 70, f"Expected 70 offerings to add, got {len(new_offerings)}"
            db.session.add_all(new_offerings)
            db.session.flush()

            # Verify post-flush state before commit
            total_offerings_after = CourseOffering.query.count()
            print(f"Total offerings in session: {total_offerings_after}")
            assert total_offerings_after == 92, f"Expected 92 offerings, found {total_offerings_after}"

            # Commit the transaction
            db.session.commit()
            print("[SUCCESS] Transaction committed successfully!")

        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Transaction rolled back due to error: {e}")
            raise

        # Post-execution detailed verification
        offerings_all = CourseOffering.query.all()
        by_sem = Counter(o.semester for o in offerings_all)
        by_sec = Counter(o.section for o in offerings_all)
        by_ay = Counter(o.academic_year for o in offerings_all)

        print("\n=== POST-EXECUTION VERIFICATION ===")
        print(f"Total Course Offerings: {len(offerings_all)} (expected 92)")
        print(f"By Semester: {dict(sorted(by_sem.items()))}")
        print(f"By Section: {dict(sorted(by_sec.items()))}")
        print(f"By Academic Year: {dict(sorted(by_ay.items()))}")

        # Check Sem 3 breakdown
        sem3_off = [o for o in offerings_all if o.semester == 3]
        print(f"Sem 3 offerings: {len(sem3_off)} (12 Sec A, 12 Sec B)")
        assert len([o for o in sem3_off if o.section == 'A']) == 12
        assert len([o for o in sem3_off if o.section == 'B']) == 12

        # Check Sem 5 breakdown
        sem5_off = [o for o in offerings_all if o.semester == 5]
        print(f"Sem 5 offerings: {len(sem5_off)} (13 Sec A, 13 Sec B)")
        assert len([o for o in sem5_off if o.section == 'A']) == 13
        assert len([o for o in sem5_off if o.section == 'B']) == 13

        # Check Sem 7 breakdown
        sem7_off = [o for o in offerings_all if o.semester == 7]
        print(f"Sem 7 offerings: {len(sem7_off)} (10 Sec A, 10 Sec B)")
        assert len([o for o in sem7_off if o.section == 'A']) == 10
        assert len([o for o in sem7_off if o.section == 'B']) == 10

        print("\nAll database updates and verification checks completed with 100% success!")

if __name__ == "__main__":
    execute_updates()
