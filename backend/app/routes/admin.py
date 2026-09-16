from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import User
from app.services.auth_service import create_user
from app.utils.auth import admin_required


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin",
)


@admin_bp.get("/users")
@admin_required
def get_users():
    users = User.query.order_by(User.user_id.asc()).all()

    data = [
        {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }
        for user in users
    ]

    return jsonify({
        "success": True,
        "data": data,
    }), 200


@admin_bp.post("/users")
@admin_required
def create_admin_user():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([name, email, password, role]):
        return jsonify({
            "success": False,
            "message": "Name, email, password and role are required",
        }), 400

    role = role.upper().strip()

    if role not in {"ADMIN", "FACULTY", "STUDENT"}:
        return jsonify({
            "success": False,
            "message": "Invalid role",
        }), 400

    email = email.lower().strip()

    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "message": "Email already exists",
        }), 409

    user = create_user(
        name=name.strip(),
        email=email,
        password=password,
        role=role,
    )

    return jsonify({
        "success": True,
        "message": "User created successfully",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }), 201


@admin_bp.get("/users/<int:user_id>")
@admin_required
def get_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    return jsonify({
        "success": True,
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        },
    }), 200


@admin_bp.patch("/users/<int:user_id>")
@admin_required
def update_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    data = request.get_json(silent=True) or {}

    if "name" in data:
        name = str(data["name"]).strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Name cannot be empty",
            }), 400

        user.name = name

    if "email" in data:
        email = str(data["email"]).lower().strip()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email cannot be empty",
            }), 400

        existing_user = User.query.filter(
            User.email == email,
            User.user_id != user_id,
        ).first()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already exists",
            }), 409

        user.email = email

    if "role" in data:
        role = str(data["role"]).upper().strip()

        if role not in {"ADMIN", "FACULTY", "STUDENT"}:
            return jsonify({
                "success": False,
                "message": "Invalid role",
            }), 400

        user.role = role

    if "password" in data:
        password = str(data["password"])

        if len(password) < 8:
            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters",
            }), 400

        from app.extensions import bcrypt

        user.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User updated successfully",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }), 200


@admin_bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found",
        }), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User deleted successfully",
    }), 200