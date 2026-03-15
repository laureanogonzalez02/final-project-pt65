import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useMedicalData from "../hooks/useMedicalData";
import ConfirmModal from "./ConfirmModal";

const NewAppointment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { specialties, procedures } = useMedicalData();
    const { store } = useGlobalReducer();
    const [searchParams] = useSearchParams();
    const dateFormUrl = searchParams.get("date");
    const dniFormUrl = searchParams.get("dni");

    const initialFormState = {
        date: dateFormUrl || "",
        start_date_time: "",
        end_date_time: "",
        dni: dniFormUrl || "",
        user_id: store.user?.id || "",
        specialty_id: "",
        procedure_id: "",
        notes: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [capacity, setCapacity] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [originalAppointment, setOriginalAppointment] = useState(null);

    useEffect(() => {
        if (isEditMode) fetchAppo();
    }, [id]);

    useEffect(() => {
        if (!isEditMode) {
            setFormData(initialFormState);
            if (setOriginalAppointment) setOriginalAppointment(null);
            setCapacity(0);
        }
    }, [isEditMode]);

    useEffect(() => {
        if (formData.procedure_id) {
            if (formData.date) {
                fetchCapacityProcedures(formData.procedure_id, formData.date);
            } else {
                setCapacity(0);
            }
        }
        else {
            setCapacity(0);
        }
    }, [formData.date, formData.procedure_id, formData.specialty_id]);

    const fetchAppo = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${id}`, {
                headers: { "Authorization": `Bearer ${store.token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                const dateOnly = data.start_date_time.substring(0, 10);
                const timePart = data.start_date_time.split(/[ T]/)[1];
                setOriginalAppointment({
                    date: dateOnly,
                    time: timePart ? timePart.substring(0, 5) : ""
                });
                setFormData({
                    ...data,
                    date: dateOnly,
                    start_date_time: "",
                    end_date_time: "",
                    dni: data.patient_dni
                });
            }
        } catch (error) { console.error("Error fetching appo", error); }
        finally { setLoading(false); }
    };

    const fetchCapacityProcedures = async (procId, date) => {
        if (!procId || !date) return;
        setLoading(true);
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/procedure-capacity`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                },
                body: JSON.stringify({ procId: procId, date: date })
            });
            if (resp.ok) {
                const data = await resp.json();
                setCapacity(data);
            }
        } catch (error) { console.error("Error fetching capacity", error); }
        finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (alert.show) setAlert({ show: false, msg: "", type: "" });
        setFormData({ ...formData, [name]: value });
        if (name === "date") setFormData(prev => ({ ...prev, start_date_time: "", end_date_time: "" }));
    };

    const getAvailableSlotsForDate = () => {
        if (!formData.date || !capacity || capacity.length === 0) return [];
        return capacity;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ show: false, msg: "", type: "" });

        const payload = {
            ...formData,
            start_date_time: `${formData.date} ${formData.start_date_time}`,
            end_date_time: `${formData.date} ${formData.end_date_time}`,
            status: isEditMode ? "postponed" : "scheduled"
        };

        const url = isEditMode
            ? `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${id}`
            : `${import.meta.env.VITE_BACKEND_URL}/api/create-appointments`;

        const method = isEditMode ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setAlert({
                    show: true,
                    msg: isEditMode ? "Turno reprogramado con éxito" : "Turno programado con éxito",
                    type: "success"
                });
                if (isEditMode) {
                    setTimeout(() => navigate("/"), 1500);
                } else {
                    setFormData(initialFormState);
                }
            } else {
                setAlert({ show: true, msg: data.msg || "Error al crear la Turno", type: "danger" });
            }
        } catch (error) {
            setAlert({ show: true, msg: "Error de conexión con el servidor.", type: "warning" });
        } finally {
            setLoading(false);
        }
    };
    const handleProcess = (e) => {
        e.preventDefault();
        if (!isEditMode) handleSubmit(e);
    }
    const slotsToShow = getAvailableSlotsForDate();

    return (
        <div className="container py-5">
            <ConfirmModal
                id="confirmEditModal"
                title="Confirmar Reprogramación"
                message={
                    <>¿Confirmas el cambio de horario para el paciente con DNI <strong>{formData.dni}</strong>?</>
                }
                warning={
                    <>
                        Nuevo horario: <strong>{formData.date}</strong> a las
                        <strong> {formData.start_date_time?.substring(0, 5)} hs</strong>
                    </>
                }
                onConfirm={(e) => {
                    handleSubmit(e);
                }}
            />



            <div className="signup-card shadow-sm p-4 bg-white rounded mx-auto" style={{ maxWidth: "600px" }}>
                <h2 className="text-center mb-4 fw-bold">{isEditMode ? "Reprogramar Turno" : "Agendar Turno"}</h2>
                {isEditMode && originalAppointment && (
                    <div className="text-center mb-4">
                        <span className="badge rounded-pill bg-light text-dark border px-3 py-2">
                            <i className="bi bi-info-circle me-2 text-primary"></i>
                            Cambiando turno actual del: <strong>{originalAppointment.date}</strong> a las <strong>{originalAppointment.time} hs</strong>
                        </span>
                    </div>
                )}
                {alert.show && (
                    <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                        {alert.msg}
                        <button type="button" className="btn-close" onClick={() => setAlert({ ...alert, show: false })}></button>
                    </div>
                )}

                <form onSubmit={handleProcess}>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Especialidad</label>
                            <select className="form-select" name="specialty_id" onChange={handleChange} value={formData.specialty_id} disabled={isEditMode} required>
                                <option value="">Seleccione...</option>
                                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Procedimiento</label>
                            <select className="form-select" name="procedure_id" onChange={handleChange} disabled={!formData.specialty_id || isEditMode} value={formData.procedure_id} required>
                                <option value="">Seleccione...</option>
                                {procedures.filter(p => p.specialty_id == formData.specialty_id).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Seleccione Fecha</label>
                        <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange}
                            min={new Date().toISOString().split("T")[0]} required />
                    </div>

                    {formData.date && formData.procedure_id && (
                        <div className="mb-4">
                            <label className="form-label fw-bold">Horarios Disponibles:</label>
                            <div className="d-flex flex-wrap gap-2">
                                {slotsToShow.length > 0 ? slotsToShow.map(slot => (
                                    <button key={slot.slot_id} type="button"
                                        disabled={slot.is_full}
                                        style={slot.is_full ? { backgroundColor: '#ca4949', borderColor: '#E57373', color: 'white' } : {}}
                                        className={`btn ${!slot.is_full && formData.start_date_time === slot.start_time
                                            ? 'btn-primary'
                                            : 'btn-outline-primary'
                                            } ${slot.is_full ? 'opacity-75' : ''}`}
                                        onClick={() => setFormData({ ...formData, start_date_time: slot.start_time, end_date_time: slot.end_time })}>
                                        {slot.start_time.slice(0, 5)}
                                        <small className="ms-1" style={{ fontSize: "0.6rem" }}>
                                            ({slot.is_full ? "0" : `${slot.available_slots}`})
                                        </small>
                                    </button>
                                )) : <div className="alert alert-light border w-100 p-2 small text-muted"> {loading ? "Cargando..." : "No hay atención este día."}</div>}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label fw-bold">DNI del Paciente</label>
                        <input type="text" className="form-control" name="dni" value={formData.dni} onChange={handleChange} readOnly={isEditMode || dniFormUrl} required />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success w-100 py-2 fw-bold"
                        disabled={loading || !formData.start_date_time}
                        data-bs-toggle={isEditMode ? "modal" : ""}
                        data-bs-target={isEditMode ? "#confirmEditModal" : ""}
                        style={{ backgroundColor: "#2ECC71", border: "none" }}
                    >
                        {loading ? "Procesando..." : isEditMode ? "Confirmar Cambios" : "Confirmar Cita"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewAppointment;