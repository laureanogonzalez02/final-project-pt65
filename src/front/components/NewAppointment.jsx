import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate, useLocation } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useMedicalData from "../hooks/useMedicalData";
import ConfirmModal from "./ConfirmModal";
import "../styles/newAppointment.css";

const NewAppointment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { specialties, procedures } = useMedicalData();
    const { store } = useGlobalReducer();
    const [searchParams] = useSearchParams();
    const { state } = useLocation();
    const dateFormUrl = searchParams.get("date") || state?.slot?.date || "";
    const dniFormUrl = searchParams.get("dni") || state?.patient?.dni || "";
    const procedureIdFromUrl = searchParams.get("procedure_id") || state?.slot?.procedure_id || "";
    const specialtyIdFromUrl = searchParams.get("specialty_id") || state?.slot?.specialty_id || "";

    const initialFormState = {
        date: dateFormUrl || "",
        start_date_time: state?.slot?.start_time || "",
        end_date_time: state?.slot?.end_time || "",
        dni: dniFormUrl || "",
        user_id: store.user?.id || "",
        specialty_id: specialtyIdFromUrl || "",
        procedure_id: procedureIdFromUrl || "",
        notes: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [capacity, setCapacity] = useState(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [originalAppointment, setOriginalAppointment] = useState(null);
    const [patientsList, setPatientsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        const getPatients = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients`, {
                    headers: { "Authorization": `Bearer ${store.token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setPatientsList(data);

                    if (dniFormUrl) {
                        const found = data.find(p => p.dni === dniFormUrl);
                        if (found) setSelectedPatient(found);
                    }
                }
            } catch (error) { console.error("Error cargando pacientes", error); }
        };
        getPatients();
    }, []);

    const filteredPatients = patientsList.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm)
    );


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
        <div className="d-flex w-100 new-appointment-wrapper">

            <ConfirmModal
                id="confirmEditModal"
                title="Confirmar Reprogramación"
                message={<>¿Confirmas el cambio de horario para el paciente con DNI <strong>{formData.dni}</strong>?</>}
                warning={<>Nuevo horario: <strong>{formData.date}</strong> a las <strong>{formData.start_date_time?.substring(0, 5)} hs</strong></>}
                onConfirm={(e) => { handleSubmit(e); }}
            />

            {/* COLUMNA IZQUIERDA: BUSCADOR DE PACIENTES */}
            <div className="d-none d-lg-flex flex-column bg-white shadow-sm flex-shrink-0 overflow-hidden sticky-top ms-5 mt-4 patient-panel">
                <div className="p-4 border-bottom">
                    <h6 className="fw-bold mb-1">Pacientes</h6>
                    <p className="text-muted small mb-3">Seleccioná uno para precargar los datos</p>
                    <div className="input-group shadow-sm rounded-3 overflow-hidden">
                        <span className="input-group-text bg-light border-0 px-3">
                            <i className="bi bi-search text-muted small"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control bg-light border-0 shadow-none py-2 small"
                            placeholder="Buscar por nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow-1 overflow-auto p-2">
                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                        <div
                            key={p.id}
                            className={`d-flex align-items-center gap-3 p-3 mb-1 rounded-3 patient-item ${selectedPatient?.id === p.id ? 'selected' : 'bg-light'}`}
                            onClick={() => {
                                setSelectedPatient(p);
                                setFormData(prev => ({ ...prev, dni: p.dni }));
                            }}
                        >
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0 text-white small patient-avatar">
                                {p.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-truncate">
                                <div className="fw-semibold small text-truncate">{p.full_name}</div>
                                <div className="text-muted small patient-dni-text">DNI: {p.dni}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-muted small py-5">No se encontraron pacientes.</div>
                    )}
                </div>
            </div>

            {/* COLUMNA DERECHA: FORMULARIO */}
            <div className="flex-grow-1 overflow-auto pt-4 pb-4 pe-4 ps-5 ms-5 form-column">
                <div className="form-column-inner">
                    <h4 className="fw-bold mb-1">{isEditMode ? "Reprogramar Turno" : "Crear Nuevo Turno"}</h4>
                    <p className="text-muted small mb-4">{isEditMode ? "Seleccioná el nuevo horario para el paciente." : "Complete los campos obligatorios para crear el turno."}</p>

                    {isEditMode && originalAppointment && (
                        <div className="alert alert-info border-0 rounded-3 small mb-4 d-flex align-items-center gap-2">
                            <i className="bi bi-info-circle-fill"></i>
                            Cambiando turno del <strong>{originalAppointment.date}</strong> a las <strong>{originalAppointment.time} hs</strong>
                        </div>
                    )}
                    {alert.show && (
                        <div className={`alert alert-${alert.type} alert-dismissible fade show rounded-3 small`} role="alert">
                            {alert.msg}
                            <button type="button" className="btn-close" onClick={() => setAlert({ ...alert, show: false })}></button>
                        </div>
                    )}

                    <form onSubmit={handleProcess}>
                        {/* BLOQUE 1: DATOS DEL PACIENTE */}
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-person-vcard text-primary"></i>
                                Datos del Paciente
                            </h6>
                            {selectedPatient ? (
                                <div className="d-flex align-items-center gap-3 p-3 rounded-3 patient-info-box">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0 patient-avatar-lg">
                                        {selectedPatient.full_name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark">{selectedPatient.full_name}</div>
                                        <div className="text-muted small">DNI: {selectedPatient.dni}</div>
                                    </div>
                                    {!isEditMode && !dniFormUrl && (
                                        <button type="button" className="btn btn-sm btn-link text-danger ms-auto p-0" onClick={() => { setSelectedPatient(null); setFormData(prev => ({ ...prev, dni: "" })); }}>
                                            <i className="bi bi-x-circle"></i>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted p-3 border rounded-3 small patient-placeholder">
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Seleccioná un paciente de la lista o escribe su DNI abajo
                                </div>
                            )}
                            <div className="mt-3">
                                <label className="form-label fw-semibold small">DNI <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="dni"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    readOnly={isEditMode || dniFormUrl || !!selectedPatient}
                                    placeholder="Ej: 35123456"
                                    required
                                />
                            </div>
                        </div>

                        {/* BLOQUE 2: DETALLES DEL TURNO */}
                        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-calendar2-check text-success"></i>
                                Detalles del Turno
                            </h6>
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold small">Especialidad <span className="text-danger">*</span></label>
                                    <select className="form-select" name="specialty_id" onChange={handleChange} value={formData.specialty_id} disabled={isEditMode} required>
                                        <option value="">Seleccione...</option>
                                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold small">Procedimiento <span className="text-danger">*</span></label>
                                    <select className="form-select" name="procedure_id" onChange={handleChange} disabled={!formData.specialty_id || isEditMode} value={formData.procedure_id} required>
                                        <option value="">Seleccione...</option>
                                        {procedures.filter(p => p.specialty_id == formData.specialty_id).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-semibold small">Fecha <span className="text-danger">*</span></label>
                                <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange}
                                    min={new Date().toISOString().split("T")[0]} required />
                            </div>
                            {formData.date && formData.procedure_id && (
                                <div>
                                    <label className="form-label fw-semibold small">Horarios Disponibles</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {slotsToShow.length > 0 ? slotsToShow.map(slot => (
                                            <button key={slot.slot_id} type="button"
                                                disabled={slot.is_full}
                                                style={slot.is_full ? undefined : {}}
                                                className={`btn btn-sm rounded-3 ${slot.is_full ? 'slot-full opacity-75' : ''} ${!slot.is_full && formData.start_date_time === slot.start_time ? 'btn-primary' : (!slot.is_full ? 'btn-outline-secondary' : '')}`}
                                                onClick={() => setFormData({ ...formData, start_date_time: slot.start_time, end_date_time: slot.end_time })}>
                                                {slot.start_time.slice(0, 5)}
                                                <small className="ms-1 slot-capacity">({slot.is_full ? "0" : slot.available_slots})</small>
                                            </button>
                                        )) : (
                                            <div className="alert alert-light border w-100 p-2 small text-muted mb-0">
                                                {loading ? "Cargando..." : "No hay atención disponible para este día."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOTONES */}
                        <div className="d-flex gap-3 justify-content-end">
                            <button type="button" className="btn btn-outline-secondary rounded-3 px-4" onClick={() => navigate(-1)}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-success px-5 fw-bold rounded-3 btn-save-appointment"
                                disabled={loading || !formData.start_date_time || (!selectedPatient && !formData.dni)}
                                data-bs-toggle={isEditMode ? "modal" : ""}
                                data-bs-target={isEditMode ? "#confirmEditModal" : ""}
                            >
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</> : isEditMode ? "Confirmar Cambios" : "Guardar Turno"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewAppointment;
