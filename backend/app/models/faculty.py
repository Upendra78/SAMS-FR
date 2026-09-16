from app.extensions import db


class Faculty(db.Model):
    __tablename__ = "faculty"

    faculty_id = db.Column(db.Integer, primary_key=True)

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

    employee_id = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
    )

    designation = db.Column(
        db.String(100),
        nullable=False,
    )

    user = db.relationship(
        "User",
        back_populates="faculty_profile",
    )

    department = db.relationship(
        "Department",
        back_populates="faculty",
    )

    course_offerings = db.relationship(
        "CourseOffering",
        back_populates="faculty",
    )

    attendance_sessions = db.relationship(
        "AttendanceSession",
        back_populates="faculty",
    )

    def __repr__(self):
        return f"<Faculty {self.employee_id}>"