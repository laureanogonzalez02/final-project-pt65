
import click
from api.models import db, User, Procedure, ProcedureAvailability
from datetime import time

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):
    
    """ 
    This is an example command "insert-test-users" that you can run from the command line
    by typing: $ flask insert-test-users 5
    Note: 5 is the number of users to add
    """
    @app.cli.command("insert-test-users") # name of our command
    @click.argument("count") # argument of out command
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.password = "123456"
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        procedures = Procedure.query.all()
        if not procedures:
            print("No hay procedimientos en la base de datos. Crea especialidades y procedimientos primero.")
            return

        # Franja horaria: mañana y tarde
        time_slots = [
            (time(8, 0), time(8, 30)),
            (time(8, 30), time(9, 0)),
            (time(9, 0), time(9, 30)),
            (time(9, 30), time(10, 0)),
            (time(10, 0), time(10, 30)),
            (time(10, 30), time(11, 0)),
            (time(11, 0), time(11, 30)),
            (time(11, 30), time(12, 0)),
            (time(12, 0), time(12, 30)),
            (time(14, 0), time(14, 30)),
            (time(14, 30), time(15, 0)),
            (time(15, 0), time(15, 30)),
            (time(15, 30), time(16, 0)),
            (time(16, 0), time(16, 30)),
            (time(16, 30), time(17, 0)),
            (time(17, 0), time(17, 30)),
            (time(17, 30), time(18, 0)),
            (time(18, 0), time(18, 30)),
        ]

        count = 0
        for proc in procedures:
            for day in range(7):  # 0=Lunes ... 6=Domingo
                # Verificar si ya existe disponibilidad para este procedimiento en este dia
                existing = ProcedureAvailability.query.filter_by(
                    procedure_id=proc.id,
                    day_of_week=day
                ).first()
                if existing:
                    print(f"  Ya existe disponibilidad para '{proc.name}' el dia {day}, saltando...")
                    continue

                for start, end in time_slots:
                    avail = ProcedureAvailability(
                        procedure_id=proc.id,
                        day_of_week=day,
                        start_time=start,
                        end_time=end,
                        capacity=18
                    )
                    db.session.add(avail)
                    count += 1

            print(f"  Procedimiento '{proc.name}' (ID={proc.id}) - disponibilidad creada para 7 dias")

        db.session.commit()
        print(f"\nListo! Se crearon {count} registros de disponibilidad horaria.")