import os
from api.models import db, Specialty, Procedure, Preparation, Patient
from app import app 
from sqlalchemy import text
from datetime import date
import random

def reset_and_seed():
    with app.app_context():
        print("🧹 Limpiando todas las tablas (Preparations, Specialties, Procedures, Patients)...")
        
        try:
            db.session.execute(text("TRUNCATE TABLE patients, procedures, specialties, preparations RESTART IDENTITY CASCADE;"))
            db.session.commit()
            print("✨ Base de datos reiniciada y limpia.")

            # --- 1. GENERAR 20 PREPARACIONES ---
            prep_descriptions = [
                "Fasting for 8 hours", "Avoid caffeine 24h before", "Drink 1L of water", 
                "Clean skin, no makeup", "Wear comfortable clothes", "Bring previous X-rays",
                "No exercise 12h before", "Stop anticoagulants", "Apply local anesthetic",
                "Empty bladder", "Full bladder for ultrasound", "No jewelry",
                "Bring a companion", "Rest for 2h after", "Take medication with water",
                "Shave the area", "No perfumes", "Signed consent form",
                "Blood pressure check", "Temperature log"
            ]
            preps = [Preparation(description=d) for d in prep_descriptions]
            db.session.add_all(preps)
            db.session.flush()

            # --- 2. GENERAR 20 ESPECIALIDADES ---
            specialty_list = [
                ("Cardiology", "Heart health"), ("Dermatology", "Skin care"), 
                ("Pediatrics", "Children care"), ("Neurology", "Brain/Nerves"),
                ("Oncology", "Cancer treatment"), ("Gastroenterology", "Digestive system"),
                ("Ophthalmology", "Eye health"), ("Orthopedics", "Bones/Joints"),
                ("Psychiatry", "Mental health"), ("Urology", "Urinary tract"),
                ("Endocrinology", "Hormones"), ("Gynecology", "Women health"),
                ("Otolaryngology", "Ear, Nose, Throat"), ("Rheumatology", "Joint diseases"),
                ("Nephrology", "Kidney health"), ("Hematology", "Blood health"),
                ("Pulmonology", "Lung health"), ("Dentistry", "Dental health"),
                ("Nutrition", "Dietary health"), ("Physiotherapy", "Physical rehab")
            ]
            specs = [Specialty(name=n, description=d) for n, d in specialty_list]
            db.session.add_all(specs)
            db.session.flush()

            # --- 3. GENERAR 20 PROCEDIMIENTOS ---
            proc_names = [
                "EKG", "Skin Biopsy", "Child Checkup", "EEG", "Chemotherapy", 
                "Endoscopy", "Eye Exam", "X-Ray", "Therapy Session", "Ultrasound",
                "Glucose Test", "Pap Smear", "Hearing Test", "Joint Injection",
                "Dialysis", "Blood Transfusion", "Lung Capacity", "Cavity Filling",
                "Body Scan", "Muscle Rehab"
            ]
            procs = []
            for i in range(20):
                procs.append(Procedure(
                    name=proc_names[i],
                    duration_minutes=random.choice([15, 30, 45, 60, 90]),
                    specialty_id=specs[i].id,
                    preparation_id=random.choice(preps).id if random.random() > 0.3 else None
                ))
            db.session.add_all(procs)
            db.session.flush()

           # --- 4. GENERAR 20 PACIENTES  ---
            names = ["Juan", "Maria", "Pedro", "Ana", "Luis", "Carla", "Diego", "Sofia", "Jorge", "Lucia"]
            lastnames = ["Perez", "Garcia", "Lopez", "Martinez", "Rodriguez", "Soto", "Vega", "Muñoz"]
            genders = ["Male", "Female", "Other", "Prefer not to say"]
            
            patients = []
            for i in range(20):
                fn = random.choice(names) + " " + random.choice(lastnames)
                random_birth_date = date(
                    random.randint(1960, 2015), 
                    random.randint(1, 12), 
                    random.randint(1, 28)
                )
                
                patients.append(Patient(
                    full_name=fn,
                    email=f"patient{i+1}@example.com",
                    phone=f"+569{random.randint(11111111, 99999999)}",
                    dni=f"{random.randint(10, 25)}.{random.randint(100, 999)}.{random.randint(100, 999)}-K",
                    birth_date=random_birth_date, 
                    gender=random.choice(genders),
                    address=f"Calle Falsa {random.randint(100, 9999)}, Santiago",
                    is_active=True
                ))
            db.session.add_all(patients)
            db.session.commit()
            print(f"\n✅ ¡Éxito! Se han creado:")
            print(f"- 20 Preparations\n- 20 Specialties\n- 20 Procedures\n- 20 Patients")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al resetear: {e}")

if __name__ == "__main__":
    reset_and_seed()