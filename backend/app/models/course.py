from app.extensions import db


class Course(db.Model):
    __tablename__ = "courses"

    course_id = db.Column(
        db.Integer,
        primary_key=True,
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.department_id"),
        nullable=False,
    )

    course_code = db.Column(
        db.String(30),
        unique=True,
        nullable=False,
    )

    course_name = db.Column(
        db.String(150),
        nullable=False,
    )

    semester = db.Column(
        db.Integer,
        nullable=False,
    )

    credits = db.Column(
        db.Integer,
        nullable=False,
    )

    department = db.relationship(
        "Department",
        back_populates="courses",
    )

    offerings = db.relationship(
        "CourseOffering",
        back_populates="course",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Course {self.course_code}>"