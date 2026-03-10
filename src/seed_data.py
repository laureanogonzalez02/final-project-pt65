import os
from api.models import db, Specialty, Procedure, Preparation
from app import app 
from sqlalchemy import text

def reset_and_seed():
    with app.app_context():
        print("🧹 Limpiando tablas de especialidades y procedimientos...")
        
        try:
            # Borramos los datos de las 3 tablas relacionadas y reiniciamos los IDs (Restart Identity)
            # Usamos CASCADE porque los procedimientos dependen de especialidades y preparaciones
            db.session.execute(text("TRUNCATE TABLE procedures, specialties, preparations RESTART IDENTITY CASCADE;"))
            db.session.commit()
            print("✨ Tablas limpias y contadores de ID reiniciados.")

            # --- AHORA CARGAMOS LOS DATOS DE NUEVO ---
            
            # 1. Preparaciones
            p1 = Preparation(description="Ayuno total de 8 horas.")
            p2 = Preparation(description="Zona limpia, sin cremas ni maquillaje.")
            p3 = Preparation(description="Traer ropa cómoda y calzado deportivo.")
            db.session.add_all([p1, p2, p3])
            db.session.flush()

            # 2. Especialidades
            s1 = Specialty(name="Dermatología", description="Cuidado de la piel.")
            s2 = Specialty(name="Cardiología", description="Salud del corazón.")
            s3 = Specialty(name="Pediatría", description="Atención infantil.")
            db.session.add_all([s1, s2, s3])
            db.session.flush()

            # 3. Procedimientos (Ahora sí, con IDs limpios empezando desde 1)
            proc1 = Procedure(name="Limpieza Facial", duration_minutes=45, specialty_id=s1.id, preparation_id=p2.id)
            proc2 = Procedure(name="Electrocardiograma", duration_minutes=20, specialty_id=s2.id, preparation_id=None)
            proc3 = Procedure(name="Prueba de Esfuerzo", duration_minutes=60, specialty_id=s2.id, preparation_id=p3.id)
            proc4 = Procedure(name="Control Niño Sano", duration_minutes=30, specialty_id=s3.id, preparation_id=None)
            
            db.session.add_all([proc1, proc2, proc3, proc4])
            db.session.commit()
            
            print("\n✅ ¡Datos de prueba cargados desde cero exitosamente!")
            print("Ahora puedes usar ID 1, 2, 3... con total seguridad.")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al resetear: {e}")

if __name__ == "__main__":
    reset_and_seed()