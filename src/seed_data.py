import os
import random
from datetime import date, time, datetime, timedelta
from api.models import db, Specialty, Procedure, Preparation, Patient, ProcedureAvailability
from app import app 
from sqlalchemy import text

def reset_and_seed():
    with app.app_context():
        print("🧹 Limpiando tablas y reiniciando IDs...")
        try:
            db.session.execute(text("DELETE FROM procedure_availabilities;"))
            db.session.execute(text("DELETE FROM patients;"))
            db.session.execute(text("DELETE FROM procedures;"))
            db.session.execute(text("DELETE FROM specialties;"))
            db.session.execute(text("DELETE FROM preparations;"))
            db.session.commit()

            # --- 1. PREPARACIONES (20) ---
            preps = [Preparation(description=f"Instrucción médica #{i+1}") for i in range(20)]
            db.session.add_all(preps)
            db.session.flush()

            # --- 2. ESPECIALIDADES (20) ---
            specs = [Specialty(name=f"Especialidad {i+1}", description="Área clínica") for i in range(20)]
            db.session.add_all(specs)
            db.session.flush()

            # --- 3. PROCEDIMIENTOS (20) ---
            procs = []
            for i in range(20):
                procs.append(Procedure(
                    name=f"Procedimiento {i+1}",
                    duration_minutes=random.choice([20, 30, 45, 60]),
                    specialty_id=specs[i].id,
                    preparation_id=random.choice(preps).id
                ))
            db.session.add_all(procs)
            db.session.flush()

            # --- 4. DISPONIBILIDAD VARIADA (Diferentes patrones de días) ---
            availabilities = []
            
            # Definimos diferentes "turnos" posibles
            day_patterns = [
                [0, 2, 4],       # Lunes, Miércoles, Viernes
                [1, 3],          # Martes, Jueves
                [0, 1, 2, 3, 4], # Toda la semana (Lunes a Viernes)
                [0, 1, 2],       # Inicio de semana (Lunes a Miércoles)
                [3, 4, 5],       # Fin de semana (Jueves a Sábado)
                [5, 6]           # Solo fines de semana
            ]

            for p in procs:
                # Asignamos un patrón aleatorio a este procedimiento
                selected_days = random.choice(day_patterns)
                
                for day in selected_days:
                    # Generamos 5 bloques horarios empezando a las 08:30
                    current_start = datetime.combine(date.today(), time(8, 30))
                    
                    for _ in range(5):
                        end_dt = current_start + timedelta(minutes=p.duration_minutes)
                        
                        availabilities.append(ProcedureAvailability(
                            procedure_id=p.id,
                            day_of_week=day,
                            start_time=current_start.time(),
                            end_time=end_dt.time(),
                            capacity=2 # <--- LAS 2 MÁQUINAS DISPONIBLES
                        ))
                        # Margen de 15 min entre pacientes para limpiar la máquina
                        current_start = end_dt + timedelta(minutes=15)

            db.session.add_all(availabilities)

            # --- 5. PACIENTES (20) ---
            for i in range(20):
                db.session.add(Patient(
                    full_name=f"Paciente {i+1}",
                    email=f"user{i+1}@gmail.com",
                    dni=f"1{i}.888.999-{random.randint(0,9)}",
                    phone="+56912345678",
                    birth_date=date(1995, 5, 20),
                    is_active=True
                ))
            
            db.session.commit()
            print(f"\n✅ ¡Base de datos lista!")
            print(f"📅 Horarios creados con patrones aleatorios de días.")
            print(f"⚙️ Capacidad máxima de 2 máquinas por bloque horario.")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_and_seed()