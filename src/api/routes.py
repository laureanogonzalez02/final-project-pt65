"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from sqlalchemy import select
from datetime import datetime, timezone
from flask_jwt_extended import jwt_required, get_jwt_identity

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# PUT para editar INFO del ususario
@api.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):

    changes = []

    def change_register(data, old, new):
        return {
            "field": data,
            "old": old,
            "new": new
        }

    user = db.session.execute(select(User).where(
        User.id == user_id)).scalar_one_or_none()
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Mising data"}), 400

    if "full_name" in data and data["full_name"] != user.full_name:
        old_name = user.full_name
        user.full_name = data["full_name"]
        new_name = user.full_name
        changes.append(change_register("full_name", old_name, new_name))

    if "dni" in data and data["dni"] != user.dni:
        exist_dni = db.session.execute(select(User).where(
            User.dni == data["dni"])).scalar_one_or_none()
        if exist_dni:
            return jsonify({"msg": "dni already exist"}), 400
        old_dni = user.dni
        user.dni = data["dni"]
        new_dni = user.dni
        changes.append(change_register("dni", old_dni, new_dni))

    if "email" in data and data["email"] != user.email:
        email_exist = db.session.execute(select(User).where(
            User.email == data["email"])).scalar_one_or_none()
        if email_exist:
            return jsonify({"msg": "email already exist"}), 400
        old_email = user.email
        user.email = data["email"]
        new_email = user.email
        changes.append(change_register("email", old_email, new_email))

    if "phone" in data and data["phone"] != user.phone:
        old_phone = user.phone
        user.phone = data["phone"]
        new_phone = user.phone
        changes.append(change_register("phone", old_phone, new_phone))

    if "is_active" in data and data["is_active"] != user.is_active:
        old_active = user.is_active
        user.is_active = data["is_active"]
        new_active = user.is_active
        changes.append(change_register("is_active", old_active, new_active))

    if "role" in data and data["role"] != user.role:
        old_role = user.role
        new_role = data["role"]
        user.role = new_role
        changes.append({
            "field": "role",
            "old": old_role,
            "new": new_role
        })

    if not changes:
        return jsonify({"msg": "No changes detected"}), 400

    db.session.commit()

    current_admin = get_jwt_identity()
    date_time = datetime.now(timezone.utc)

    changes_resume = {
        "modified_by": current_admin,
        "user_modified": user.id,
        "changes": changes,
        "date_time": date_time,
    }

    response = {
        "msg": "User updated successfully",
        "audit": changes_resume
    }

    if user.role == "Administrator":
        response["confirmation"] = "The user now has administrator privileges"

    return jsonify(response), 200
   

@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


@api.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    if users is not None:
        users_list = list(map(lambda user: user.serialize(), users))

        return jsonify({"users": users_list}), 200
    return 'not found', 404
