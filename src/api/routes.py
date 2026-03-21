import os
from flask import Flask, request, jsonify, url_for, Blueprint, current_app
from api.models import db, User, Appointment, BlockedSlot, Patient, Specialty, Procedure, ProcedureAvailability, Message, Notification
from api.utils import generate_sitemap, APIException, generate_reset_token, verify_reset_token, get_month_date_range
from flask_mail import Message as mail_message
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import select, extract, or_
from datetime import datetime, timezone, timedelta
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from twilio.rest import Client
import google.generativeai as genai
import json as json_lib

api = Blueprint('api', __name__)
pending_resets = []

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
    deactivated_now = False

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
        changes.append(change_register("full_name", old_name, user.full_name))

    if "dni" in data and data["dni"] != user.dni:
        exist_dni = db.session.execute(select(User).where(
            User.dni == data["dni"])).scalar_one_or_none()
        if exist_dni:
            return jsonify({"msg": "dni already exist"}), 400
        old_dni = user.dni
        user.dni = data["dni"]
        changes.append(change_register("dni", old_dni, user.dni))

    if "email" in data and data["email"] != user.email:
        email_exist = db.session.execute(select(User).where(
            User.email == data["email"])).scalar_one_or_none()
        if email_exist:
            return jsonify({"msg": "email already exist"}), 400
        old_email = user.email
        user.email = data["email"]
        changes.append(change_register("email", old_email, user.email))

    if "phone" in data and data["phone"] != user.phone:
        old_phone = user.phone
        user.phone = data["phone"]
        changes.append(change_register("phone", old_phone, user.phone))

    if "is_active" in data and data["is_active"] != user.is_active:
        old_active = user.is_active
        user.is_active = data["is_active"]
        changes.append(change_register("is_active", old_active, user.is_active))
        if old_active is True and user.is_active is False:
            deactivated_now = True


    if "role" in data and data["role"] != user.role:
        old_role = user.role
        user.role = data["role"]
        changes.append(change_register("role", old_role, user.role))


    if not changes:
        return jsonify({"msg": "No changes detected"}), 400

    db.session.commit()

    if deactivated_now:
        msg = mail_message(
            subject="Aviso: Tu cuenta ha sido deshabilitada",
            sender=current_app.config['MAIL_USERNAME'],
            recipients=[user.email],
            body=f"Hola {user.full_name}, te informamos que tu cuenta ha sido desactivada por un administrador."
        )
        current_app.extensions['mail'].send(msg)

    date_time = datetime.now(timezone.utc)

    changes_resume = {
        "modified_by": {
            "id": admin.id,
            "name": admin.full_name,
            "role": admin.role
        },
        "target_user": {
            "id": user.id,
            "name": user.full_name
        },
        "details": changes,
        "timestamp": date_time.isoformat()
    }

    response = {
        "msg": "User updated successfully",
        "audit": changes_resume
    }

    if user.role == "admin":
        response["confirmation"] = "The user now has administrator privileges"

    return jsonify(response), 200


@api.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)
    if not admin or admin.role != "admin":
        return jsonify({"msg": "Unauthorized"}), 403

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
    user = User.query.filter_by(email=email).first()
    
    if user:
        pending_resets.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M")
        })
        
        admins = User.query.filter_by(role="admin").all()
        for admin in admins:
            notif = Notification(
                user_id=admin.id,
                message=f"Solicitud de recuperación de contraseña para {user.full_name} ({user.email})."
            )
            db.session.add(notif)
        db.session.commit()
    
    return jsonify({"msg": "Solicitud recibida"}), 200

@api.route("/admin/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)
    if not admin or admin.role != "admin":
        return jsonify({"msg": "Unauthorized"}), 403
        
    return jsonify(pending_resets), 200


@api.route("/generate-reset/<int:user_id>", methods=["POST"])
@jwt_required()
def generate_reset(user_id):
    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)

    if not admin or admin.role != "admin":
        return jsonify({"msg": "Solo los administradores pueden aprobar esto"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    token = generate_reset_token(user.id)

    global pending_resets
    pending_resets = [r for r in pending_resets if r['id'] != user_id]

    return jsonify({
        "msg": "Cambio de contraseña aprobado",
        "reset_token": token,
        "reset_url": f"http://localhost:3000/reset-password/{token}"
    }), 200

@api.route("/reject-reset/<int:user_id>", methods=["DELETE"])
@jwt_required()
def reject_reset(user_id):
    current_user = get_jwt_identity()
    admin = db.session.get(User, current_user)

    if not admin or admin.role != "admin":
        return jsonify({"msg": "Solo los administradores pueden rechazar esto"}), 403

    global pending_resets
    pending_resets = [r for r in pending_resets if r['id'] != user_id]

    return jsonify({"msg": "Solicitud rechazada exitosamente"}), 200

@api.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    
    token = data.get("token")
    new_password = data.get("password")

    if not new_password:
        return jsonify({"msg": "La contraseña es requerida"}), 400

    user_id = verify_reset_token(token)

    if not user_id:
        return jsonify({"msg": "El link es inválido o ha expirado"}), 400

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"msg": "Contraseña actualizada correctamente"}), 200

@api.route('/specialties', methods=['GET'])
@jwt_required()
def specialties():
    specialties = Specialty.query.all()
    return jsonify([specialty.serialize() for specialty in specialties]), 200

@api.route('/procedures', methods=['GET'])
@jwt_required()
def procedures():
    procedures = Procedure.query.all()
    return jsonify([procedure.serialize() for procedure in procedures]), 200

@api.route('/create-appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    body = request.get_json()
        
    if 'dni' not in body or not body['dni']:
        return jsonify({"msg": "El DNI es obligatorio para identificar al paciente"}), 400
    
    patient = Patient.query.filter_by(dni=body['dni']).first()

    if not patient:
        return jsonify({"msg": "No se encontró ningún paciente registrado con este DNI"}), 404

    required_fields = [
        "start_date_time", "end_date_time", 
        "user_id", "specialty_id", "procedure_id", "dni"
    ]
    for field in required_fields:
        if field not in body or not body[field]:
            return jsonify({"msg": f"El campo '{field}' es obligatorio"}), 400

    already_booked = Appointment.query.filter_by(
        patient_id=patient.id,
        start_date_time=body['start_date_time'],
    ).first()

    if already_booked:
        return jsonify({
            "msg": "Este paciente ya tiene un turno agendado en este horario."
        }), 400


    try:
        start_dt = datetime.strptime(body['start_date_time'], "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(body['end_date_time'], "%Y-%m-%d %H:%M:%S")

        availability = ProcedureAvailability.query.filter_by(
            procedure_id=body['procedure_id'],
            day_of_week=start_dt.weekday(),
            start_time=start_dt.time()
        ).first()

        if not availability:
            return jsonify({"msg": "Este bloque horario no está disponible para este procedimiento"}), 400
        
        current_appointments = Appointment.query.filter_by(
            start_date_time=start_dt,
            procedure_id=body['procedure_id']
        ).count()

        if current_appointments >= availability.capacity:
            return jsonify({"msg": f"Agenda llena. Las {availability.capacity} máquinas están ocupadas en este horario."}), 400

        new_appointment = Appointment(
            start_date_time=start_dt,
            end_date_time=end_dt,
            patient_id=patient.id,
            user_id=body['user_id'],
            specialty_id=body['specialty_id'],
            procedure_id=body['procedure_id'],
            notes=body.get('notes', None), 
            status="scheduled",
            confirmed=False
        )

        db.session.add(new_appointment)
        
        admins = User.query.filter_by(role="admin").all()
        for admin in admins:
            notif = Notification(
                user_id=admin.id,
                message=f"Nuevo turno agendado para {patient.full_name} el {start_dt.strftime('%d/%m/%Y %H:%M')}."
            )
            db.session.add(notif)
        
        db.session.commit()

        return jsonify({
            "msg": "Turno creado exitosamente",
            "appointment": new_appointment.serialize()
        }), 201

    except ValueError as e:
        return jsonify({"msg": "Formato de fecha inválido", "error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error interno del servidor", "error": str(e)}), 500


@api.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    start_date, end_date = get_month_date_range(month, year)

    stmt = select(Appointment).where(
        or_(
            (Appointment.start_date_time >= start_date) & (Appointment.start_date_time <= end_date),
            (Appointment.end_date_time >= start_date) & (Appointment.end_date_time <= end_date)
        )
    )

    result = db.session.execute(stmt)
    appointments = result.scalars().all()

    return jsonify([appo.serialize() for appo in appointments]), 200


@api.route('/appointments/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_appointments_by_patient(patient_id):
    appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(Appointment.start_date_time.desc())
    if not appointments:
        return jsonify([]), 200

    return jsonify([app.serialize() for app in appointments]), 200


@api.route('/appointments/<int:appointment_id>', methods=['GET', 'PUT'])
@jwt_required()
def handle_single_appointment(appointment_id):
    appointment = db.session.get(Appointment, appointment_id)

    if not appointment:
        return jsonify({"msg": "Turno no encontrado"}), 404

    if request.method == 'GET':
        data = appointment.serialize()
        data["patient_dni"] = appointment.patient.dni 
        return jsonify(data), 200

    body = request.get_json()
    if not body:
        return jsonify({"msg": "Missing data"}), 400

    try:
        new_status = body.get("status")
        if new_status:
            valid_statuses = ["scheduled", "confirmed", "cancelled", "delayed", "postponed"]
            if new_status not in valid_statuses:
                return jsonify({"msg": f"Estado inválido: {new_status}"}), 400

            appointment.status = new_status

            if new_status == "confirmed":
                appointment.confirmed = True

            if new_status == "cancelled":
                appointment.cancellation_date = datetime.now(timezone.utc)
                appointment.cancellation_reason = body.get("cancellation_reason", None)

        if "start_date_time" in body and "end_date_time" in body:
            appointment.start_date_time = datetime.strptime(body['start_date_time'], "%Y-%m-%d %H:%M:%S")
            appointment.end_date_time = datetime.strptime(body['end_date_time'], "%Y-%m-%d %H:%M:%S")

        if "notes" in body:
            appointment.notes = body["notes"]

        appointment.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        return jsonify({
            "msg": "Turno actualizado con éxito",
            "appointment": appointment.serialize()
        }), 200

    except ValueError as e:
        return jsonify({"msg": "Formato de fecha inválido", "error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al actualizar", "error": str(e)}), 500

@api.route('/appointments/check-delayed', methods=['POST'])
@jwt_required()
def check_delayed_appointments():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=15)

    late_appointments = Appointment.query.filter(
        Appointment.status == "scheduled",
        Appointment.start_date_time <= cutoff
    ).all()

    updated = []
    for appo in late_appointments:
        appo.status = "delayed"
        updated.append(appo.id)

    if updated:
        db.session.commit()

    return jsonify({
        "msg": f"{len(updated)} turnos marcados como demorados",
        "updated_ids": updated
    }), 200


@api.route('/appointments/check-upcoming', methods=['POST'])
@jwt_required()
def check_upcoming_appointments():
    now = datetime.now(timezone.utc)
    in_24h_start = now + timedelta(hours=24)
    in_24h_end = now + timedelta(hours=25)

    upcoming = Appointment.query.filter(
        Appointment.status == "scheduled",
        Appointment.confirmed == False,
        Appointment.start_date_time >= in_24h_start,
        Appointment.start_date_time <= in_24h_end
    ).all()

    return jsonify([appo.serialize() for appo in upcoming]), 200

@api.route("/messages/send", methods=["POST"])
@jwt_required()
def send_message():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    patient_id = data.get("patient_id")
    body = data.get("body")

    if not patient_id or not body:
        return jsonify({"msg": "patient_id y body son requeridos"}), 400

    patient = db.session.get(Patient, patient_id)
    if not patient or not patient.phone:
        return jsonify({"msg": "Paciente no encontrado o no tiene telefono"}), 404

    client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

    twilio_message = client.messages.create(
        body=body,
        from_=os.getenv("TWILIO_WHATSAPP_NUMBER"),
        to=f"whatsapp:{patient.phone}"
    )

    new_message = Message(
        patient_id=int(patient_id),
        user_id=int(current_user_id),
        body=body,
        direction="outgoing",
        twilio_sid=twilio_message.sid,
        read=True
    )

    db.session.add(new_message)
    db.session.commit()
    return jsonify(new_message.serialize()), 201


@api.route("/messages/<int:patient_id>", methods=["GET"])
@jwt_required()
def get_messages(patient_id):
    Message.query.filter_by(patient_id=patient_id, direction="incoming", read=False).update({"read": True})
    db.session.commit()

    messages = Message.query.filter_by(patient_id=patient_id).order_by(Message.created_at.asc()).all()

    return jsonify([message.serialize() for message in messages]), 200


@api.route("/messages/webhook", methods=["POST"])
def receive_message():
    from_number = request.values.get("From", "")
    body = request.values.get("Body", "")
    phone = from_number.replace("whatsapp:", "")

    patient = Patient.query.filter_by(phone=phone).first()
    if not patient:
        return "", 200

    twilio_sid = request.form.get("MessageSid")
    if Message.query.filter_by(twilio_sid=twilio_sid).first():
        return "", 200

    new_message = Message(
        patient_id=patient.id,
        user_id=None,
        body=body,
        direction="incoming",
        twilio_sid=twilio_sid,
        read=False
    )

    db.session.add(new_message)

    admins = User.query.filter_by(role="admin").all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            message=f"Nuevo mensaje de WhatsApp de {patient.full_name}: '{body}'"
        )
        db.session.add(notif)
        
    db.session.commit()
    return "", 200

@api.route('/blocked-slots', methods=['GET'])
@jwt_required()
def get_blocked_slots():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    start_date, end_date = get_month_date_range(month, year)

    stmt = select(BlockedSlot).where(
        or_(
            (BlockedSlot.start_date_time >= start_date) & (BlockedSlot.start_date_time <= end_date),
            (BlockedSlot.end_date_time >= start_date) & (BlockedSlot.end_date_time <= end_date)
        )
    )
    result = db.session.execute(stmt)
    blocked_slots = result.scalars().all()
    return jsonify([slot.serialize() for slot in blocked_slots]), 200

@api.route('/blocked-slots', methods=['POST'])
@jwt_required()
def create_blocked_slot():
    data = request.get_json()
    start = data.get('start_date_time')
    end = data.get('end_date_time')
    reason = data.get('reason')

    if not start or not end:
        return jsonify({"msg": "start_date_time y end_date_time son requeridos"}), 400

    if not reason:
        return jsonify({"msg": "reason es requerido"}), 400

    start_date_time = datetime.fromisoformat(start)
    end_date_time = datetime.fromisoformat(end)
    conflicting = Appointment.query.filter(
        Appointment.start_date_time < end_date_time,
        Appointment.end_date_time > start_date_time
    ).first()

    if conflicting:
        return jsonify({"msg": "Hay turnos programados en este horario"}), 409

    new_block = BlockedSlot(
        start_date_time=start_date_time,
        end_date_time=end_date_time,
        reason=reason,
    )

    db.session.add(new_block)
    db.session.commit()
    return jsonify(new_block.serialize()), 201

@api.route('/blocked-slots/<int:slot_id>', methods=['PUT'])
@jwt_required()
def update_blocked_slot(slot_id):
    slot = db.session.get(BlockedSlot, slot_id)

    if not slot:
        return jsonify({"msg": "Slot no encontrado"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing data"}), 400
    
    new_start = data.get("start_date_time")
    new_end = data.get("end_date_time")
    new_reason = data.get("reason")

    if new_start and new_end:
        new_start_date_time = datetime.fromisoformat(new_start)
        new_end_date_time = datetime.fromisoformat(new_end)
        conflicting = Appointment.query.filter(
            Appointment.start_date_time < new_end_date_time,
            Appointment.end_date_time > new_start_date_time
        ).first()

        if conflicting:
            return jsonify({"msg": "Hay turnos programados en este horario"}), 409

        slot.start_date_time = new_start_date_time
        slot.end_date_time = new_end_date_time

    if new_reason:
        slot.reason = new_reason


    db.session.commit()
    return jsonify(slot.serialize()), 200

@api.route('/blocked-slots/<int:slot_id>', methods=['DELETE'])
@jwt_required()
def delete_blocked_slot(slot_id):
    slot = db.session.get(BlockedSlot, slot_id)
    if not slot:
        return jsonify({"msg": "Slot no encontrado"}), 404
    db.session.delete(slot)
    db.session.commit()
    return jsonify({"msg": "Slot eliminado exitosamente"}), 200


@api.route('/procedure-capacity', methods=['POST'])
@jwt_required()
def get_procedure_capacity():
    body = request.get_json()
    proc_id = body.get("procId")
    selected_date_str = body.get("date") 

    if not proc_id or not selected_date_str:
        return jsonify({"msg": "Missing procId or date"}), 400

    try:
        selected_date = datetime.strptime(selected_date_str, "%Y-%m-%d").date()
        day_of_week = selected_date.weekday() 

        slots = ProcedureAvailability.query.filter_by(
            procedure_id=proc_id, 
            day_of_week=day_of_week
        ).all()

        results = []
        for slot in slots:
            start_dt = datetime.combine(selected_date, slot.start_time)

            booked_count = Appointment.query.filter(
                Appointment.procedure_id == proc_id,
                Appointment.start_date_time == start_dt,
                Appointment.status != "cancelled"
            ).count()

            results.append({
                "slot_id": slot.id,
                "start_time": slot.start_time.strftime("%H:%M:%S"),
                "end_time": slot.end_time.strftime("%H:%M:%S"),
                "available_slots": slot.capacity - booked_count,
                "is_full": booked_count >= slot.capacity
            })

        return jsonify(results), 200

    except Exception as e:
        return jsonify({"msg": "Error consultando capacidad", "error": str(e)}), 500

@api.route('/patients', methods=['GET'])
@jwt_required()
def get_all_patients():
    patients = Patient.query.all()
    
    results = []
    for patient in patients:
        patient_data = patient.serialize()
        count = Appointment.query.filter(
            Appointment.patient_id == patient.id,
            Appointment.status != "cancelled"
        ).count()
        
        patient_data["appointment_count"] = count
        
        results.append(patient_data)

    return jsonify(results), 200

@api.route('/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    current_user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=int(current_user_id)).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify([n.serialize() for n in notifications]), 200

@api.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    current_user_id = get_jwt_identity()
    notification = db.session.get(Notification, notification_id)
    if not notification:
        return jsonify({"msg": "Notificación no encontrada"}), 404
    if str(notification.user_id) != str(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403
    
    notification.is_read = True
    db.session.commit()
    return jsonify({"msg": "Notificación marcada como leída", "notification": notification.serialize()}), 200

@api.route('/patients/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_single_patient(patient_id):
    patient = db.session.get(Patient, patient_id)
    
    if not patient:
        return jsonify({"msg": "Paciente no encontrado"}), 404

    return jsonify(patient.serialize()), 200


@api.route('/patients/<int:patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return jsonify({"msg": "Paciente no encontrado"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing data"}), 400

    if "is_active" in data:
        patient.is_active = data["is_active"]

    db.session.commit()
    return jsonify({"msg": "Paciente actualizado", "patient": patient.serialize()}), 200

@api.route('/ai/chat-suggestion', methods=['POST'])
@jwt_required()
def get_ai_chat_suggestion():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-3-flash-preview")
    data = request.get_json()
    patient_id = data.get("patient_id")
    if not patient_id:
        return jsonify({"msg": "Missing patient_id"}), 400
    
    recent_messages = (
        Message.query.filter_by(patient_id=patient_id, direction="incoming")
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )

    if not recent_messages:
        return jsonify({"detected_procedure": None, "available_slots": []}), 200

    conversation = "\n".join([f"- {m.body}" for m in reversed(recent_messages)])

    all_procedures = Procedure.query.all()
    procedure_list = "\n".join([f"- ID {p.id}: {p.name} (Especialidad ID {p.specialty_id})" for p in all_procedures])

    prompt = (
        "Sos un asistente de un centro médico. Analizá los siguientes mensajes de un paciente "
        "y determiná si está pidiendo turno para algún procedimiento médico.\n\n"
        f"Mensajes del paciente:\n{conversation}\n\n"
        f"Procedimientos disponibles en el sistema:\n{procedure_list}\n\n"
        "Respondé SOLO con este formato JSON, sin markdown:\n"
        '{"procedure_id": 3, "procedure_name": "Tomografía"}\n'
        "Si el paciente no está pidiendo ningún turno, respondé:\n"
        '{"procedure_id": null, "procedure_name": null}'
    )

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else parts[0]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        ai_result = json_lib.loads(raw)
    except Exception:
        return jsonify({"detected_procedure": None, "available_slots": []}), 200

    procedure_id = ai_result.get("procedure_id")
    procedure_name = ai_result.get("procedure_name")

    if not procedure_id:
        return jsonify({"detected_procedure": None, "available_slots": []}), 200
    
    today = datetime.now().date()
    available_slots = []
    
    for days_ahead in range(0, 30):
        check_date = today + timedelta(days=days_ahead)
        day_of_week = check_date.weekday()
        slots = ProcedureAvailability.query.filter_by(
            procedure_id=procedure_id,
            day_of_week=day_of_week
        ).all()
        
        for slot in slots:
            slot_start_dt = datetime.combine(check_date, slot.start_time)
            slot_end_dt = datetime.combine(check_date, slot.end_time)
            
            booked = Appointment.query.filter(
                Appointment.procedure_id == procedure_id,
                Appointment.start_date_time == slot_start_dt,
                Appointment.status != "cancelled"
            ).count()
            
            if booked < slot.capacity:
                procedure = Procedure.query.get(procedure_id)
                available_slots.append({
                    "date": check_date.isoformat(),
                    "start_time": slot.start_time.strftime("%H:%M:%S"),
                    "end_time": slot.end_time.strftime("%H:%M:%S"),
                    "available_slots": slot.capacity - booked,
                    "procedure_id": procedure_id,
                    "specialty_id": procedure.specialty_id if procedure else None
                })

        if len(available_slots) >= 5:
            break       

    return jsonify({"detected_procedure": {"id": procedure_id, "name": procedure_name}, "available_slots": available_slots}), 200

    