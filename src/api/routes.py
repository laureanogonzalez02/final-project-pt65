"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, Blueprint, current_app
from api.models import db, User, Patient, Specialty, Procedure, Appointment
from api.utils import generate_sitemap, APIException, generate_reset_token, verify_reset_token
from flask_mail import Message
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select
from datetime import datetime, timezone, timedelta
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# No escribir codigo aca, escribir abajo


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


@api.route('/signup', methods=['POST'])
@jwt_required()
def signup():
    current_user = get_jwt_identity() 
    admin = db.session.get(User, current_user)
    if not admin or admin.role != "admin":
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.get_json()

    email = data.get('email', None)
    password = data.get('password', None)
    role = data.get('role', None)
    dni = data.get('dni', None)
    full_name = data.get('full_name', None)
    phone = data.get('phone', None)

    if not email or not password or not role or not dni or not full_name or not phone:
        return jsonify({"msg": "All fields are required"}), 400

    password_hash = generate_password_hash(password)

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"msg": "User already exists"}), 409
    existing_dni = User.query.filter_by(dni=dni).first()
    if existing_dni:
        return jsonify({"msg": "DNI already exists"}), 409


    new_user = User(email=email,
                    password_hash=password_hash,
                    role=role,
                    dni=dni,
                    full_name=full_name,
                    phone=phone,
                    is_active=True)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "User created successfully"}), 201


@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', None)
    password = data.get('password', None)

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()
    if user and user.is_locked:
        return jsonify({"msg": "Account locked. Contact support to unlock."}), 401
    if not user or not check_password_hash(user.password_hash, password):
        if user and user.role == "admin":
            user.login_attempts = (user.login_attempts or 0) + 1
            if user.login_attempts >= 3:
                user.is_locked = True
            db.session.commit()       
        return jsonify({"msg": "Invalid credentials"}), 401
    if user.role == "admin":
        dni = data.get('dni')
        if not dni or dni != user.dni:
            user.login_attempts = (user.login_attempts or 0) + 1
            if user.login_attempts >= 3:
                user.is_locked = True
            db.session.commit()      
            return jsonify({"msg": "Invalid DNI"}), 401

    access_token = create_access_token(identity=str(user.id))
    user.login_attempts = 0
    db.session.commit()
    return jsonify(access_token=access_token, user=user.serialize()), 200

# Admin only endpoint - get all users
@api.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)
    if not admin or admin.role != "admin":
       return jsonify({"msg": "Unauthorized"}), 403

    users = User.query.all()
    if users is not None:
        users_list = list(map(lambda user: user.serialize(), users))

        return jsonify({"users": users_list}), 200
    return 'not found', 404

# Admin only endpoint - get a user
@api.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_info(user_id):
    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)
    if not admin or admin.role != "admin":
        return jsonify({"msg": "Unauthorized"}), 403
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "msg": "Usuario encontrado",
        "user": user.serialize()
    }), 200

# Admin only endpoint - update a user
@api.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):

    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)
    if not admin or admin.role != "admin":
        return jsonify({"msg": "Unauthorized"}), 403

    changes = []
    was_deactivated = False

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
        return jsonify({"msg": "Missing data"}), 400

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

    if was_deactivated:
        msg = Message

    current_admin = get_jwt_identity()
    date_time = datetime.now(timezone.utc)

    changes_resume = {
        "modified_by": current_admin,
        "user_modified": user.id,
        "changes": changes,
        "date_time": date_time.isoformat(),
    }

    response = {
        "msg": "User updated successfully",
        "audit": changes_resume
    }

    if user.role == "admin":
        response["confirmation"] = "The user now has administrator privileges"

    return jsonify(response), 200


@api.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):

    user = db.session.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    if not user:
        return jsonify({"msg": "User not found"}), 404

    try:
        db.session.delete(user)
        db.session.commit()

        return jsonify({"msg": f"User with ID {user_id} has been deleted"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error deleting user", "error": str(e)}), 500

@api.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"msg": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if user:
        token = generate_reset_token(user.id)

        reset_link = f"http://localhost:5173/reset-password/{token}"

        msg = Message(
            subject="Password Reset Request",
            recipients=[user.email]
        )

        msg.body = f"""
Para recuperar tu contraseña hacé click en el siguiente enlace:

{reset_link}

Este enlace expira en 15 minutos.
"""

        current_app.extensions['mail'].send(msg)

    return jsonify({
        "msg": "If that email exists, a recovery link has been sent."
    }), 200


@api.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()

    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({
            "msg": "Token and new password are required"
        }), 400

    user_id = verify_reset_token(token)

    if not user_id:
        return jsonify({
            "msg": "Invalid or expired token"
        }), 400

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({
        "msg": "Password has been reset successfully"
    }), 200


@api.route('/appointments', methods=['POST'])
@jwt_required() 
def create_appointment():
    body = request.get_json()

    required_fields = [
        "start_date_time", "end_date_time", "patient_id", 
        "user_id", "specialty_id", "procedure_id"
    ]
    for field in required_fields:
        if field not in body or not body[field]:
            return jsonify({"msg": f"El campo {field} es obligatorio"}), 400

    try:
        start_dt = datetime.fromisoformat(body['start_date_time'])
        end_dt = datetime.fromisoformat(body['end_date_time'])

        new_appointment = Appointment(
            start_date_time=start_dt,
            end_date_time=end_dt,
            patient_id=body['patient_id'],
            user_id=body['user_id'],
            specialty_id=body['specialty_id'],
            procedure_id=body['procedure_id'],
            notes=body['procedure_id'], 
            status="scheduled",
            confirmed=False
        )

        db.session.add(new_appointment)
        db.session.commit()

        return jsonify({
            "msg": "Turno creado exitosamente",
            "appointment": new_appointment.serialize()
        }), 201

    except ValueError as e:
        return jsonify({"msg": "Formato de fecha inválido", "error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error en el servidor", "error": str(e)}), 500