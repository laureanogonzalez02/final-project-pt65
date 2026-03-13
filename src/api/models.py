from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, DateTime, Date, Time, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime, date, time
db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    dni: Mapped[str] = mapped_column(String(25), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active: Mapped[bool] = mapped_column(
        Boolean(), default=True, nullable=False)
    login_attempts = db.Column(db.Integer, default=0)
    is_locked = db.Column(db.Boolean, default=False)

    def serialize(self):
        return {
            "id": self.id,
            "role": self.role,
            "full_name": self.full_name,
            "dni": self.dni,
            "email": self.email,
            "phone": self.phone,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Patient(db.Model):
    __tablename__ = "patients"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    dni: Mapped[str] = mapped_column(String(25), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=True)
    address: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "dni": self.dni,
            "phone": self.phone,
            "email": self.email,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "gender": self.gender,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active
        }


class Specialty(db.Model):
    __tablename__ = "specialties"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }
    

class Preparation(db.Model):
    __tablename__ = "preparations"
    id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "description": self.description
        }

class Procedure(db.Model):
    __tablename__ = "procedures"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    preparation_id: Mapped[int] = mapped_column(ForeignKey("preparations.id"), nullable=True)
    specialty_id: Mapped[int] = mapped_column(ForeignKey("specialties.id"), nullable=False)
    specialty = relationship("Specialty")
    preparation = relationship("Preparation")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "duration_minutes": self.duration_minutes,
            "description": self.description,
            "preparation_id": self.preparation_id,
            "preparation_name": self.preparation.description if self.preparation else None, 
            "specialty_id": self.specialty_id,
            "specialty_name": self.specialty.name if self.specialty else None
        }
    

class Appointment(db.Model):
    __tablename__ = "appointments"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    start_date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="scheduled")
    confirmed: Mapped[bool] = mapped_column(Boolean(), default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)   
    cancellation_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    cancellation_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False) 
    specialty_id: Mapped[int] = mapped_column(ForeignKey("specialties.id"), nullable=False)
    procedure_id: Mapped[int] = mapped_column(ForeignKey("procedures.id"), nullable=False)   

    user = relationship("User")
    patient = relationship("Patient")
    procedure = relationship("Procedure")
    specialty = relationship("Specialty")

    def serialize(self):
        return {
            "id": self.id,
            "start_date_time": self.start_date_time.isoformat(),
            "end_date_time": self.end_date_time.isoformat(),
            "status": self.status,
            "confirmed": self.confirmed,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else "Desconocido",
            "patient_dni": self.patient.dni if self.patient else None,
            "staff_id": self.user_id,
            "staff_name": self.user.full_name if self.user else "No asignado",
            "specialty_id": self.specialty_id,
            "specialty_name": self.specialty.name if self.specialty else None,
            "procedure_id": self.procedure_id,
            "procedure_name": self.procedure.name if self.procedure else "Sin procedimiento",
            "notes": self.notes,
            "cancellation_reason": self.cancellation_reason,
            "cancellation_date": self.cancellation_date.isoformat() if self.cancellation_date else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    

class ProcedureAvailability(db.Model):
    __tablename__ = "procedure_availabilities"
    id: Mapped[int] = mapped_column(primary_key=True)
    procedure_id: Mapped[int] = mapped_column(ForeignKey("procedures.id"), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False) 
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    procedure = relationship("Procedure")

    def serialize(self):
        return {
            "id": self.id,
            "procedure_id": self.procedure_id,
            "capacity": self.capacity,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M:%S"),
            "end_time": self.end_time.strftime("%H:%M:%S")
        }

class BlockedSlot(db.Model):
    __tablename__ = "blocked_slots"
    id: Mapped[int] = mapped_column(primary_key=True)
    start_date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def serialize(self):
        return {
            "id": self.id,
            "start_date_time": self.start_date_time.isoformat(),
            "end_date_time": self.end_date_time.isoformat(),
            "reason": self.reason,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }