"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from flask_jwt_extended import create_access_token
from sqlalchemy import select

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)
# creando el PUT para editar la INFO del ususario
@api.route('/users/<int:user_id>', methods=['PUT'])
def update_user_info(user_id):
    user = db.session.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        return jsonify({"msg":"User not found"}), 404
    data = request.get_json()
    

@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

@api.route('/signup', methods=['POST'])
def signup():

    data = request.get_json()

    email = data.get('email', None)
    password = data.get('password', None)
    role = data.get('role', None)
    dni = data.get('dni', None)
    full_name = data.get('full_name', None)
    phone = data.get('phone', None)

    if not email or not password or not role:
        return jsonify({"msg": "Missing email or password or role"}), 400

    password_hash = generate_password_hash(password)

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"msg": "User already exists"}), 409


    new_user = User(email=email, 
                    password_hash=password_hash, 
                    role=role, 
                    dni=dni, 
                    full_name=full_name, 
                    phone=phone, 
                    status=True,
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
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Invalid credentials"}), 401

    if user.role == "admin":
        dni = data.get('dni')
        if not dni or dni != user.dni:
            return jsonify({"msg": "Invalid DNI"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token, user=user.serialize()), 200

@api.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    if users is not None:
        users_list = list(map(lambda user: user.serialize(),users))

        return jsonify({"users": users_list}), 200
    return 'not found', 404
