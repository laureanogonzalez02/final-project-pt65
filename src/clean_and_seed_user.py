import os
import random
from datetime import date, time, datetime, timedelta
from api.models import db, Specialty, Procedure, Preparation, Patient, ProcedureAvailability, Appointment, User, Message
from app import app 
from sqlalchemy import text
from werkzeug.security import generate_password_hash

def clean_and_seed():
    with app.app_context():
        print("Limpiando base de datos selectivamente...")
        try:
            # 1. Eliminar Appointments y Disponibilidades (para poder borrar Procedimientos)
            print("Eliminando turnos y disponibilidades...")
            Appointment.query.delete()
            ProcedureAvailability.query.delete()
            
            # 2. Eliminar pacientes que NO sean Laureano Gonzalez, y sus mensajes
            print("Eliminando pacientes extra (conservando a Laureano Gonzalez) y sus mensajes...")
            patients = Patient.query.all()
            for p in patients:
                if "laureano" not in p.full_name.lower():
                    Message.query.filter_by(patient_id=p.id).delete()
                    db.session.delete(p)
            db.session.flush()

            # 3. Eliminar Procedimientos y Especialidades
            print("Eliminando procedimientos y especialidades viejas...")
            Procedure.query.delete()
            Specialty.query.delete()
            db.session.flush()

            print("Sembrando nuevos datos...")

            # --- NUEVOS PACIENTES (5) ---
            print("Creando 5 pacientes nuevos...")
            new_patients = []
            for i in range(5):
                # Generador de teléfono tipo +54911...
                phone = f"+54911{random.randint(10000000, 99999999)}"
                p = Patient(
                    full_name=f"Paciente Prueba {i+1}",
                    email=f"paciente.prueba{i+1}@ejemplo.com",
                    dni=f"{random.randint(20,50)}.{random.randint(100,999)}.{random.randint(100,999)}",
                    phone=phone,
                    birth_date=date(random.randint(1974, 2004), random.randint(1, 12), random.randint(1, 28)),
                    is_active=True
                )
                new_patients.append(p)
                db.session.add(p)
            db.session.flush()

            # --- NUEVAS ESPECIALIDADES (3) Y PROCEDIMIENTOS (3 C/U) ---
            print("Creando 3 especialidades con 3 procedimientos cada una...")
            specialties_data = [
                "Cardiología",
                "Dermatología",
                "Odontología"
            ]
            
            procedures_data = {
                "Cardiología": ["Electrocardiograma", "Ecocardiograma", "Holter 24hs"],
                "Dermatología": ["Consulta General", "Dermatoscopía", "Tratamiento Acné"],
                "Odontología": ["Limpieza Dental", "Extracción", "Tratamiento de Conducto"]
            }

            created_specs = []
            for spec_name in specialties_data:
                s = Specialty(name=spec_name, description=f"Atención en {spec_name}")
                db.session.add(s)
                created_specs.append(s)
            db.session.flush()

            created_procs = []
            for s in created_specs:
                procs_for_spec = procedures_data[s.name]
                for p_name in procs_for_spec:
                    p = Procedure(
                        name=p_name,
                        duration_minutes=30,
                        specialty_id=s.id
                    )
                    created_procs.append(p)
                    db.session.add(p)
            db.session.flush()

            # --- DISPONIBILIDAD (SLOTS) ---
            print("Creando disponibilidad para los nuevos procedimientos...")
            day_patterns = [[0, 2, 4], [1, 3, 5], [0, 1, 2, 3, 4]]
            availabilities = []
            for p in created_procs:
                selected_days = random.choice(day_patterns)
                for day in selected_days:
                    start_dt = datetime.combine(date.today(), time(9, 0)) # turno desde las 9am
                    for _ in range(6):
                        end_dt = start_dt + timedelta(minutes=p.duration_minutes)
                        availabilities.append(ProcedureAvailability(
                            procedure_id=p.id, day_of_week=day,
                            start_time=start_dt.time(), end_time=end_dt.time(),
                            capacity=random.randint(1, 3)
                        ))
                        start_dt = end_dt + timedelta(minutes=15)
            db.session.add_all(availabilities)
            db.session.commit()

            print(f"¡Limpieza y seeding completados con éxito!")

        except Exception as e:
            db.session.rollback()
            print(f" Error durante el seed: {e}")

if __name__ == "__main__":
    clean_and_seed()
