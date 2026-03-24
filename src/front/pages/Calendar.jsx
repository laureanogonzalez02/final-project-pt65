import { useEffect, useContext, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../hooks/useGlobalReducer";
import ConfirmModal from "../components/ConfirmModal";
import useMedicalData from "../hooks/useMedicalData";
import "../styles/calendar.css";

export const Calendar = () => {
    const { store, dispatch } = useContext(StoreContext);
    const navigate = useNavigate();
    const [viewDate, setViewDate] = useState(new Date());

    const [expandedPanel, setExpandedPanel] = useState(false);

    const { specialties } = useMedicalData();
    const [selectedSpecialty, setSelectedSpecialty] = useState("");

    const [selectedDayNumber, setSelectedDayNumber] = useState(new Date().getDate());

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthName = monthNames[viewDate.getMonth()];
    const currentYear = viewDate.getFullYear();

    const [blockedSlots, setBlockedSlots] = useState([]);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [slotForm, setSlotForm] = useState({
        start_date_time: "",
        end_date_time: "",
        reason: ""
    });

    const [editingSlot, setEditingSlot] = useState(null);
    const [calendarAlert, setCalendarAlert] = useState({ show: false, msg: "", type: "" });
    const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState(null);

    const [cancellingAppo, setCancellingAppo] = useState(null);
    const [cancelReason, setCancelReason] = useState("");

    const loadData = async () => {
        const token = localStorage.getItem("token");
        const month = viewDate.getMonth() + 1;
        const year = viewDate.getFullYear();

        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments?month=${month}&year=${year}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                dispatch({ type: "set_appointments", payload: data });
            }
        } catch (err) { console.error("Error cargando turnos:", err); }

        try {
            const resp2 = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/blocked-slots?month=${month}&year=${year}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp2.ok) {
                const data2 = await resp2.json();
                setBlockedSlots(data2);
            }
        } catch (err) { console.error("Error cargando slots bloqueados:", err); }
    };

    useEffect(() => {
        loadData();
    }, [viewDate]);

    const filteredAppos = useMemo(() => {
        if (!selectedSpecialty) return store.appointments || [];
        return store.appointments.filter(appo => appo.specialty_id === parseInt(selectedSpecialty));
    }, [store.appointments, selectedSpecialty]);

    const selectedDayAppointments = useMemo(() => {
        if (!selectedDayNumber) return [];
        return filteredAppos.filter(a => new Date(a.start_date_time).getDate() === selectedDayNumber);
    }, [filteredAppos, selectedDayNumber]);

    const selectedDayBlockedSlots = useMemo(() => {
        if (!selectedDayNumber) return [];
        return blockedSlots.filter(slot => {
            const slotStart = new Date(slot.start_date_time);
            const slotEnd = new Date(slot.end_date_time);
            const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), selectedDayNumber);
            return currentDay >= slotStart && currentDay <= slotEnd;
        });
    }, [blockedSlots, selectedDayNumber]);

    const updateAppointmentStatus = async (appoId, newStatus, reason = null) => {
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${appoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    cancellation_reason: reason
                })
            });

            if (resp.ok) {
                await loadData();
                setCancellingAppo(null);
                setCancelReason("");
                setCalendarAlert({ show: true, msg: `Turno ${newStatus === 'cancelled' ? 'cancelado' : 'confirmado'} con éxito.`, type: "success" });
            }
        } catch (err) {
            console.error("Error al actualizar turno:", err);
            setCalendarAlert({ show: true, msg: "Error al actualizar el turno.", type: "danger" });
        }
    };

    const confirmSlotAction = async () => {
        const isEditing = editingSlot !== null;
        const token = localStorage.getItem("token");
        const url = isEditing ? `${import.meta.env.VITE_BACKEND_URL}/api/blocked-slots/${editingSlot.id}` : `${import.meta.env.VITE_BACKEND_URL}/api/blocked-slots`;
        const method = isEditing ? "PUT" : "POST";
        try {
            const resp = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(slotForm)
            });
            if (resp.ok) {
                setShowSlotModal(false);
                setSlotForm({ start_date_time: "", end_date_time: "", reason: "" });
                setEditingSlot(null);
                setCalendarAlert({ show: true, msg: isEditing ? "Fechas actualizadas con éxito." : "Fechas bloqueadas con éxito.", type: "success" });
                await loadData();
            } else {
                const error = await resp.json();
                setCalendarAlert({ show: true, msg: error.msg || "Error al procesar el bloqueo.", type: "danger" });
            }
        } catch (err) {
            console.error("Error al procesar el bloqueo:", err);
            setCalendarAlert({ show: true, msg: "Error de conexión.", type: "danger" });
        }
    }

    const confirmDeleteSlot = async () => {
        if (!pendingDeleteSlotId) return;
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/blocked-slots/${pendingDeleteSlotId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                setCalendarAlert({ show: true, msg: "Bloqueo eliminado con éxito.", type: "success" });
                await loadData();
            } else {
                const error = await resp.json();
                setCalendarAlert({ show: true, msg: error.msg || "Error al eliminar el bloqueo.", type: "danger" });
            }
        } catch (err) {
            console.error("Error al eliminar el bloqueo:", err);
            setCalendarAlert({ show: true, msg: "Error de conexión.", type: "danger" });
        }
        setPendingDeleteSlotId(null);
    }

    const handleDayClick = (dayNumber) => {
        setSelectedDayNumber(dayNumber);
    };

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const renderDays = () => {
        const days = [];
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const monthShort = currentMonthName.substring(0, 3);

        for (let day = 1; day <= daysInMonth; day++) {
            const allDayAppos = filteredAppos.filter(a => new Date(a.start_date_time).getDate() === day);
            const activeAppos = allDayAppos.filter(a => a.status !== "cancelled");

            const isBlocked = blockedSlots.some(slot => {
                const slotStart = new Date(slot.start_date_time);
                const slotEnd = new Date(slot.end_date_time);
                const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                return currentDay >= slotStart && currentDay <= slotEnd;
            });

            let colorClass = "day-available";
            if (isBlocked) colorClass = "day-blocked";
            else if (activeAppos.length >= 8) colorClass = "day-full";
            else if (activeAppos.length >= 1) colorClass = "day-partial";

            days.push(
                <div key={day} className={`calendar-day ${colorClass}`} onClick={() => handleDayClick(day)}>
                    <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold x-small">{monthShort} {day}</span>
                        {activeAppos.length > 0 && <span className="appo-count-badge">{activeAppos.length}</span>}
                    </div>
                    <div className="appo-dots mt-auto">
                        {allDayAppos.slice(0, 10).map(appo => (
                            <div key={appo.id} className={`dot status-${appo.status}`} title={appo.patient_name}></div>
                        ))}
                        {allDayAppos.length > 10 && (
                            <span style={{ fontSize: "9px", fontWeight: 700, opacity: 0.7 }}>+{allDayAppos.length - 10}</span>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="bg-light min-vh-100 p-4">
            <div className="container-fluid">
                <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <span className="fw-bold text-secondary me-3"><i className="bi bi-funnel"></i> Filtros Globales:</span>
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-select form-select-sm border-light bg-light"
                                value={selectedSpecialty}
                                onChange={(e) => setSelectedSpecialty(e.target.value)}
                            >
                                <option value="">Todas las especialidades</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-auto">
                            {selectedSpecialty && (
                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setSelectedSpecialty("")}>
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>
                        <div className="col text-end d-flex align-items-center justify-content-end gap-2">
                            {selectedSpecialty ? (
                                <>
                                    <i className="bi bi-funnel-fill text-primary"></i>
                                    <span className="badge bg-primary rounded-pill px-3 py-2">
                                        Filtrando: {specialties.find(s => s.id == selectedSpecialty)?.name}
                                    </span>
                                </>
                            ) : (
                                <span className="badge bg-light text-dark border rounded-pill px-3 py-2">
                                    <i className="bi bi-funnel me-1"></i>Sin filtros activos
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`row g-4 justify-content-center ${expandedPanel ? "flex-column" : ""}`}>
                    <div className={selectedDayNumber ? (expandedPanel ? "col-12" : "col-lg-4") : "d-none"}>
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            {selectedDayNumber ? (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h6 className="fw-bold m-0">
                                            <i className="bi bi-calendar-day me-2 text-primary"></i>
                                            {selectedDayNumber} de {currentMonthName}
                                        </h6>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-dark rounded-3 px-2"
                                                onClick={() => {
                                                    const formattedDate = `${currentYear}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayNumber).padStart(2, '0')}`;
                                                    navigate(`/new-appointment?date=${formattedDate}`);
                                                }}>
                                                + Nuevo turno
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-secondary rounded-3"
                                                title={expandedPanel ? "Reducir vista" : "Ampliar vista"}
                                                onClick={() => setExpandedPanel(!expandedPanel)}>
                                                <i className={`bi ${expandedPanel ? "bi-arrows-angle-contract" : "bi-arrows-angle-expand"}`}></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-dark rounded-3"
                                                onClick={() => { setSelectedDayNumber(null); setExpandedPanel(false); }}>
                                                <i className="bi bi-x-lg"></i>
                                            </button>
                                        </div>
                                    </div>

                                    {selectedSpecialty && (
                                        <div className="mb-3">
                                            <span className="badge bg-primary rounded-pill px-3 py-1 extra-small">
                                                <i className="bi bi-funnel-fill me-1"></i>
                                                Filtrando: {specialties.find(s => s.id == selectedSpecialty)?.name}
                                            </span>
                                        </div>
                                    )}

                                    <div style={{ overflowY: "auto", maxHeight: expandedPanel ? "70vh" : "500px" }}>
                                        {selectedDayAppointments.length > 0 ? (
                                            selectedDayAppointments.map(appo => (
                                                <div key={appo.id} className="border rounded-3 p-3 mb-2 bg-white shadow-sm">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <p
                                                                className="fw-bold mb-1"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => navigate(`/patient/${appo.patient_id}`)}>
                                                                {appo.patient_name}
                                                            </p>
                                                            <p className="text-muted extra-small mb-1">
                                                                <i className="bi bi-clock me-1"></i>
                                                                {new Date(appo.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            <p className="text-muted extra-small mb-1">
                                                                <i className="bi bi-clipboard-pulse me-1"></i>
                                                                {appo.specialty_name} — {appo.procedure_name}
                                                            </p>
                                                        </div>
                                                        <div className="d-flex flex-column align-items-end gap-2">
                                                            <span className={`badge bg-${{
                                                            confirmed: 'success',
                                                            cancelled: 'danger',
                                                            delayed: 'dark',
                                                            scheduled: 'warning',
                                                            postponed: 'info'
                                                            }[appo.status] || 'dark'}`}>
                                                                {{
                                                                confirmed: 'Confirmado',
                                                                cancelled: 'Cancelado',
                                                                delayed: 'Demorado',
                                                                scheduled: 'Programado',
                                                                postponed: 'Pospuesto'
                                                                }[appo.status] || appo.status}
                                                            </span>
                                                            {appo.status !== "cancelled" && (
                                                                <div className="dropdown" style={{ marginTop: "10px" }}>
                                                                    <button className="btn btn-outline-dark btn-sm rounded-3 px-2 dropdown-toggle"
                                                                        style={{ fontSize: "0.8rem" }}
                                                                        data-bs-toggle="dropdown">
                                                                        Acciones
                                                                    </button>
                                                                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                                                                        <li>
                                                                            <button className="dropdown-item small"
                                                                                disabled={appo.status !== "scheduled" && appo.status !== "delayed"}
                                                                                onClick={() => updateAppointmentStatus(appo.id, "confirmed")}>
                                                                                <i className="bi bi-check-circle me-2 text-success"></i>Confirmar
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button className="dropdown-item small"
                                                                                disabled={appo.status !== "scheduled" && appo.status !== "confirmed" && appo.status !== "postponed"}
                                                                                onClick={() => updateAppointmentStatus(appo.id, "delayed")}>
                                                                                <i className="bi bi-clock-history me-2 text-warning"></i>Demora
                                                                            </button>
                                                                        </li>
                                                                        <li><hr className="dropdown-divider" /></li>
                                                                        <li>
                                                                            <button className="dropdown-item small"
                                                                                onClick={() => navigate(`/edit-appointment/${appo.id}`)}>
                                                                                <i className="fa-regular fa-pen-to-square me-2"></i>Editar
                                                                            </button>
                                                                        </li>
                                                                        <li>
                                                                            <button className="dropdown-item small text-danger"
                                                                                onClick={() => setCancellingAppo(appo)}>
                                                                                <i className="bi bi-x-circle me-2 text-danger"></i>Cancelar
                                                                            </button>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-5">
                                                <i className="bi bi-calendar-x display-4 text-muted"></i>
                                                <p className="mt-3 text-muted small">No hay turnos para esta fecha.</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedDayBlockedSlots.length > 0 && (
                                        <div className="mt-3 pt-3 border-top">
                                            <p className="fw-bold small mb-2">
                                                <i className="bi bi-slash-circle me-2 text-danger"></i>
                                                Bloqueos activos este día
                                            </p>
                                            {selectedDayBlockedSlots.map(slot => (
                                                <div key={slot.id} className="border rounded-3 p-2 mb-2 bg-white shadow-sm">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <p className="small fw-bold text-danger mb-1">
                                                                <i className="bi bi-lock-fill me-1"></i>
                                                                {slot.reason || "Sin motivo especificado"}
                                                            </p>
                                                            <p className="extra-small text-muted mb-0">
                                                                <i className="bi bi-calendar-range me-1"></i>
                                                                {new Date(slot.start_date_time).toLocaleDateString()} — {new Date(slot.end_date_time).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger px-2 py-0"
                                                            onClick={() => {
                                                                setPendingDeleteSlotId(slot.id);
                                                                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmDeleteSlotModal'));
                                                                modal.show();
                                                            }}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                    <div className={selectedDayNumber ? (expandedPanel ? "col-12" : "col-lg-8") : "col-12"}>
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold m-0 text-secondary">Pronóstico de Disponibilidad Próxima</h6>
                                <button className="btn btn-sm btn-dark px-3 rounded-pill">Asignación Automática</button>
                                <button className="btn btn-sm btn-danger px-3 rounded-pill" onClick={() => setShowSlotModal(true)}>Bloquear fechas</button>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-4 bg-white border rounded-3 p-2 shadow-sm w-fit-content" style={{ width: "fit-content" }}>
                                <button onClick={handlePrevMonth} className="btn btn-sm btn-link text-dark p-0">
                                    <i className="bi bi-chevron-left fw-bold"></i>
                                </button>
                                <h5 className="fw-bold m-0 px-2" style={{ minWidth: "160px", textAlign: "center", fontSize: "1.1rem" }}>
                                    {currentMonthName} {currentYear}
                                </h5>
                                <button onClick={handleNextMonth} className="btn btn-sm btn-link text-dark p-0">
                                    <i className="bi bi-chevron-right fw-bold"></i>
                                </button>
                            </div>

                            <div className="calendar-weekdays mb-2 text-center">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                    <div key={d} className="fw-bold text-muted x-small">{d}</div>
                                ))}
                            </div>

                            <div className="calendar-main-grid">
                                {renderDays()}
                            </div>

                            <div className="mt-4 pt-3 border-top d-flex flex-wrap gap-4 x-small text-muted align-items-center">
                                <div className="d-flex align-items-center gap-2"><div className="legend-box day-available"></div> Disponible </div>
                                <div className="d-flex align-items-center gap-2"><div className="legend-box day-partial"></div> Parcialmente ocupado</div>
                                <div className="d-flex align-items-center gap-2"><div className="legend-box day-full"></div> Completo</div>
                                <div className="d-flex align-items-center gap-2"><div className="legend-box day-blocked"></div> Bloqueado</div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showSlotModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">{editingSlot ? "Editar Fechas" : "Bloquear Fechas"}</h5>
                                <button type="button" className="btn-close" onClick={() => { setShowSlotModal(false); setEditingSlot(null); }}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Fecha de inicio</label>
                                    <input type="date" className="form-control"
                                        value={slotForm.start_date_time.split('T')[0]}
                                        onChange={e => setSlotForm({ ...slotForm, start_date_time: e.target.value + "T00:00:00" })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Fecha de fin</label>
                                    <input type="date" className="form-control"
                                        value={slotForm.end_date_time.split('T')[0]}
                                        onChange={e => setSlotForm({ ...slotForm, end_date_time: e.target.value + "T23:59:59" })} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Motivo</label>
                                    <input type="text" className="form-control" placeholder="Ej: Mantenimiento, Feriado..."
                                        value={slotForm.reason}
                                        onChange={e => setSlotForm({ ...slotForm, reason: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-outline-secondary" onClick={() => { setShowSlotModal(false); setEditingSlot(null); }}>Cancelar</button>
                                <button className="btn btn-danger" onClick={() => {
                                    setShowSlotModal(false);
                                    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('confirmSlotModal'));
                                    modal.show();
                                }}>{editingSlot ? "Confirmar cambios" : "Confirmar bloqueo"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {cancellingAppo && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold text-danger">
                                    <i className="bi bi-x-circle me-2"></i>Cancelar Turno
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setCancellingAppo(null)}>
                                </button>
                            </div>
                            <div className="modal-body px-4">
                                <p className="mb-1">
                                    ¿Confirmas la cancelación del turno de <strong>{cancellingAppo.patient_name}</strong>?
                                </p>
                                <p className="text-muted extra-small mb-3">
                                    <i className="bi bi-clock me-1"></i>
                                    {new Date(cancellingAppo.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {cancellingAppo.procedure_name}
                                </p>
                                <div className="mb-2">
                                    <label className="form-label fw-semibold">
                                        Motivo de cancelación <span className="text-muted fw-normal">(opcional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ej: Solicitud del paciente, reprogramación..."
                                        value={cancelReason}
                                        onChange={e => setCancelReason(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button
                                    className="btn btn-light fw-bold"
                                    onClick={() => setCancellingAppo(null)}>
                                    No, volver
                                </button>
                                <button
                                    className="btn btn-danger fw-bold px-4"
                                    onClick={() => updateAppointmentStatus(cancellingAppo.id, 'cancelled', cancelReason || null)}>
                                    Sí, cancelar turno
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {calendarAlert.show && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4" style={{ zIndex: 1060, minWidth: "350px" }}>
                    <div className={`alert alert-${calendarAlert.type} alert-dismissible fade show shadow-lg rounded-3`} role="alert">
                        <i className={`bi ${calendarAlert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                        {calendarAlert.msg}
                        <button type="button" className="btn-close" onClick={() => setCalendarAlert({ ...calendarAlert, show: false })}></button>
                    </div>
                </div>
            )}

            <ConfirmModal
                id="confirmSlotModal"
                title={editingSlot ? "Confirmar edición" : "Confirmar bloqueo"}
                message={editingSlot ? "¿Confirmar los cambios en las fechas bloqueadas?" : "¿Estás seguro de bloquear estas fechas?"}
                warning={editingSlot ? null : "Las fechas seleccionadas quedarán bloqueadas para nuevos turnos."}
                onConfirm={confirmSlotAction}
            />

            <ConfirmModal
                id="confirmDeleteSlotModal"
                title="Eliminar bloqueo"
                message="¿Estás seguro de eliminar este bloqueo?"
                warning="Se desbloquearán todas las fechas del rango."
                onConfirm={confirmDeleteSlot}
            />

        </div>
    );
};

