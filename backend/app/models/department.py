from app.extensions import db


class Department(db.Model):
    __tablename__ = "departments"

    department_id = db.Column(db.Integer, primary_key=True)
    department_name = db.Column(db.String(100), nullable=False)
    department_code = db.Column(
        db.String(20),
        unique=True,
        nullable=False,
    )

    students = db.relationship(
        "Student",
        back_populates="department",
        lazy=True,
    )

    faculty = db.relationship(
        "Faculty",
        back_populates="department",
        lazy=True,
    )

    courses = db.relationship(
        "Course",
        back_populates="department",
        lazy=True,
    )

    def __repr__(self):
        return f"<Department {self.department_code}>"