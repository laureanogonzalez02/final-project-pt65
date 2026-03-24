from flask import jsonify, url_for, current_app
from datetime import datetime, timezone, timedelta
import jwt
import calendar
from datetime import datetime
from api.models import db, Appointment, AISuggestion

class APIException(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)

def generate_sitemap(app):
    links = ['/admin/']
    for rule in app.url_map.iter_rules():
        # Filter out rules we can't navigate to in a browser
        # and rules that require parameters
        if "GET" in rule.methods and has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            if "/admin/" not in url:
                links.append(url)

    links_html = "".join(["<li><a href='" + y + "'>" + y + "</a></li>" for y in links])
    return """
        <div style="text-align: center;">
        <img style="max-height: 80px" src='https://storage.googleapis.com/breathecode/boilerplates/rigo-baby.jpeg' />
        <h1>Rigo welcomes you to your API!!</h1>
        <p>API HOST: <script>document.write('<input style="padding: 5px; width: 300px" type="text" value="'+window.location.href+'" />');</script></p>
        <p>Start working on your project by following the <a href="https://start.4geeksacademy.com/starters/full-stack" target="_blank">Quick Start</a></p>
        <p>Remember to specify a real endpoint path like: </p>
        <ul style="text-align: left;">"""+links_html+"</ul></div>"

def generate_reset_token(user_id):
    payload = {
        "user_id": user_id,
        "type": "password_reset",
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }

    token = jwt.encode(
        payload,
        current_app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return token

def verify_reset_token(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=["HS256"]
        )

        if payload.get("type") != "password_reset":
            return None

        return payload["user_id"]

    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_month_date_range(month = None, year = None):

    now = datetime.now()

    if not month:
        month = now.month
    if not year:
        year = now.year
    
    start_of_month = datetime(year, month, 1)
    last_day_of_month = calendar.monthrange(year, month)[1]
    end_of_month = datetime(year, month, last_day_of_month, 23, 59, 59)
    
    return start_of_month, end_of_month


def check_ai_reschedule_opportunities(cancelled_appo_id):
    cancelled_appointment = Appointment.query.get(cancelled_appo_id)
    if not cancelled_appointment:
        return
        
    candidates = Appointment.query.filter(
        Appointment.procedure_id == cancelled_appointment.procedure_id,
        Appointment.status.in_(["scheduled", "delayed"]),
        Appointment.start_date_time > cancelled_appointment.start_date_time
    ).all()
    
    if not candidates:
        return 
        
    candidates_text = "\n".join([f"- ID:{c.id} | Paciente:{c.patient.full_name} | Fecha:{c.start_date_time}" for c in candidates])
    
    prompt = f"""
    Eres el asistente analítico de ProceTurn.
    Se acaba de cancelar un turno de '{cancelled_appointment.procedure.name}' para el {cancelled_appointment.start_date_time}.
    Revisa esta lista de pacientes con turnos posteriores para el mismo procedimiento:
    {candidates_text}
    
    Sugiere brevemente a quién se podría adelantar el turno y por qué, en una sola oración.
    """
    
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")
        response = model.generate_content(prompt)
        
        if response.text:
            new_suggestion = AISuggestion(
                type="reschedule",
                description=response.text[:255],
                priority="high",
                status="pending",
                appointment_id=cancelled_appo_id
            )
            db.session.add(new_suggestion)
            db.session.commit()
            
    except Exception as e:
        print("Error en IA Trigger:", e)