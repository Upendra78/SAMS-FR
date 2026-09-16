from app.extensions import db


class Student(db.Model):
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id"),
        unique=True,
        nullable=False,
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.department_id"),
        nullable=False,
    )

    enrollment_no = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
    )

    semester = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(20), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)

    user = db.relationship(
        "User",
        back_populates="student_profile",
    )

    department = db.relationship(
        "Department",
        back_populates="students",
    )

    face_profiles = db.relationship(
        "FaceProfile",
        back_populates="student",
        cascade="all, delete-orphan",
    )

    enrollments = db.relationship(
        "Enrollment",
        back_populates="student",
        cascade="all, delete-orphan",
    )

    attendance_records = db.relationship(
        "AttendanceRecord",
        back_populates="student",
    )

    def __repr__(self):
        return f"<Student {self.enrollment_no}>"