
from app.utils.auth import admin_required
from app.models import User
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
)

from app.services.auth_service import authenticate_user
from flask_jwt_extended import verify_jwt_in_request


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required",
        }), 400

    user = authenticate_user(email, password)

    if not user:
        return jsonify({
            "success": False,
            "message": "Invalid email or password",
        }), 401

    access_token = create_access_token(
        identity=str(user.user_id),
        additional_claims={
            "role": user.role,
        },
    )

    response = jsonify({
        "success": True,
        "message": "Login successful",
        "data": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    })

    set_access_cookies(response, access_token)

    return response, 200


@auth_bp.post("/logout")
def logout():
    response = jsonify({
        "success": True,
        "message": "Logout successful",
    })

    unset_jwt_cookies(response)

    return response, 200




@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

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
        },
    }), 200


@auth_bp.get("/admin-test")
@admin_required
def admin_test():
    return jsonify({
        "success": True,
        "message": "Admin access granted",
    }), 200


@auth_bp.get("/protected-test")
@jwt_required()
def protected_test():
    return jsonify({
        "success": True,
        "message": "Authenticated access granted",
    }), 200

