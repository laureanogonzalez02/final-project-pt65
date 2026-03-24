import os
import random
from datetime import date, time, datetime, timedelta
from api.models import db, Specialty, Procedure, Preparation, Patient, ProcedureAvailability, Appointment, User
from app import app 
from sqlalchemy import text
from werkzeug.security import generate_password_hash

def reset_and_seed():
    with app.app_context():
        print("🧹 Limpiando base de datos...")
        try:
            # Orden de limpieza estricto
            db.session.execute(text("TRUNCATE TABLE appointments, procedure_availabilities, patients, procedures, specialties, preparations RESTART IDENTITY CASCADE;"))
            db.session.commit()

            # --- 0. USUARIO ADMIN ---
            user = User.query.filter_by(email="admin@ticketflow.com").first()
            if not user:
                user = User(
                    full_name="Admin TicketFlow", 
                    email="admin@ticketflow.com", 
                    password_hash=generate_password_hash("123456"), 
                    role="admin", 
                    dni="0-0", 
                    phone="+000000000", # <--- AGREGA ESTO (Obligatorio en tu DB)
                    is_active=True
                )
                db.session.add(user)
                db.session.flush()

            # --- 1. ESPECIALIDADES Y PROCEDIMIENTOS (1:2) ---
            specs = [Specialty(name=f"Especialidad {i+1}", description="Área clínica") for i in range(10)]
            db.session.add_all(specs)
            db.session.flush()

            procs = []
            for s in specs:
                for j in range(1, 3):
                    p = Procedure(name=f"Procedimiento {s.name.split()[-1]}.{j}", 
                                  duration_minutes=30, specialty_id=s.id)
                    procs.append(p)
            db.session.add_all(procs)
            db.session.flush()

            # --- 2. DISPONIBILIDAD (SLOTS) ---
            # 0=Lunes, 6=Domingo. Incluimos patrones con 6.
            day_patterns = [[0, 2, 4, 6], [1, 3, 5, 6], [0, 1, 2, 3, 4, 5, 6]]
            availabilities = []
            
            print("📅 Creando slots de disponibilidad (incluyendo Domingos)...")
            for p in procs:
                selected_days = random.choice(day_patterns)
                for day in selected_days:
                    # Creamos 5 bloques desde las 08:00
                    start_dt = datetime.combine(date.today(), time(8, 0))
                    for _ in range(5):
                        end_dt = start_dt + timedelta(minutes=p.duration_minutes)
                        availabilities.append(ProcedureAvailability(
                            procedure_id=p.id, day_of_week=day,
                            start_time=start_dt.time(), end_time=end_dt.time(),
                            capacity=2 # 2 máquinas
                        ))
                        start_dt = end_dt + timedelta(minutes=15)
            db.session.add_all(availabilities)
            db.session.flush()

            # --- 3. PACIENTES (20) ---
            print("👥 Creando pacientes con datos obligatorios...")
            patients = []
            for i in range(20):
                p = Patient(
                    full_name=f"Paciente {i+1}",
                    email=f"paciente{i+1}@test.com",
                    # DNI aleatorio y único
                    dni=f"{random.randint(10,25)}.{random.randint(100,999)}.{random.randint(100,999)}-{random.randint(0,9)}",
                    # Teléfono (por si acaso también es obligatorio)
                    phone=f"+569{random.randint(11111111, 99999999)}",
                    # FECHA DE NACIMIENTO (Obligatoria según el error)
                    birth_date=date(random.randint(1960, 2010), random.randint(1, 12), random.randint(1, 28)),
                    is_active=True
                )
                patients.append(p)
                db.session.add(p)
            db.session.flush()

            # --- 4. TURNOS OCUPADOS (Para probar tu Dashboard y UI) ---
            print("📝 Agendando algunos turnos iniciales...")
            today_date = date.today()
            for i in range(10): # Creamos 10 turnos para hoy/mañana
                target_proc = random.choice(procs)
                # Buscamos una disponibilidad para ese procedimiento
                avail = next(a for a in availabilities if a.procedure_id == target_proc.id)
                
                new_appo = Appointment(
                    start_date_time=datetime.combine(today_date, avail.start_time),
                    end_date_time=datetime.combine(today_date, avail.end_time),
                    status="scheduled",
                    patient_id=random.choice(patients).id,
                    user_id=user.id,
                    specialty_id=target_proc.specialty_id,
                    procedure_id=target_proc.id
                )
                db.session.add(new_appo)

            db.session.commit()
            print(f"✅ ¡Seed completado con éxito!")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_and_seed()