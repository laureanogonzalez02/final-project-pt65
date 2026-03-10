import React, { useEffect, useContext, useState, useMemo } from "react"; 
import { StoreContext } from "../hooks/useGlobalReducer";
import "../styles/calendar.css";

export const Calendar = () => {
    const { store, dispatch } = useContext(StoreContext);
    const [viewDate, setViewDate] = useState(new Date(2025, 2, 1));

    const [procedures, setProcedures] = useState([]);
    const [selectedProcedure, setSelectedProcedure] = useState("");

    const [showDayModal, setShowDayModal] = useState(false);
    const [selectedDayNumber, setSelectedDayNumber] = useState(null);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[viewDate.getMonth()];
    const currentYear = viewDate.getFullYear();

    const loadProcedures = async () => {
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${process.env.BACKEND_URL}/api/procedures`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setProcedures(data);
            }
        } catch (err) { console.error("Error cargando procedimientos:", err); }
    };

    const loadData = async () => {
        const token = localStorage.getItem("token");
        const month = viewDate.getMonth() + 1;
        const year = viewDate.getFullYear();

        try {
            const resp = await fetch(`${process.env.BACKEND_URL}/api/appointments?month=${month}&year=${year}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                dispatch({ type: "set_appointments", payload: data });
            }
        } catch (err) { console.error("Error cargando turnos:", err); }
    };

    useEffect(() => {
        loadProcedures();
        loadData();
    }, [viewDate]);

    const filteredAppos = useMemo(() => {
        if (!selectedProcedure) return store.appointments || [];
        return store.appointments.filter(appo => appo.procedure_id === parseInt(selectedProcedure));
    }, [store.appointments, selectedProcedure]);

    const selectedDayAppointments = useMemo(() => {
        if (!selectedDayNumber) return [];
        return filteredAppos.filter(a => new Date(a.start_date_time).getDate() === selectedDayNumber);
    }, [filteredAppos, selectedDayNumber]);

    const updateAppointmentStatus = async (appoId, newStatus) => {
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${process.env.BACKEND_URL}/api/appointments/${appoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (resp.ok) {
                await loadData();
                setShowDayModal(false);
                alert(`Turno ${newStatus === 'cancelled' ? 'cancelado' : 'confirmado'} con éxito.`);
            }
        } catch (err) {
            console.error("Error al actualizar turno:", err);
        }
    };

    const handleDayClick = (dayNumber) => {
        setSelectedDayNumber(dayNumber);
        setShowDayModal(true);
    };

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const renderDays = () => {
        const days = [];
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const monthShort = currentMonthName.substring(0, 3);

        for (let i = 1; i <= daysInMonth; i++) {
            const allDayAppos = filteredAppos.filter(a => new Date(a.start_date_time).getDate() === i);
            const activeAppos = allDayAppos.filter(a => a.status !== "cancelled");

            let colorClass = "day-available";
            if (activeAppos.length >= 8) colorClass = "day-full";
            else if (activeAppos.length >= 1) colorClass = "day-partial";

            days.push(
                <div key={i} className={`calendar-day ${colorClass}`} onClick={() => handleDayClick(i)}>
                    <div className="d-flex justify-content-between align-items-start">
                        <span className="fw-bold x-small">{monthShort} {i}</span>
                        {activeAppos.length > 0 && <span className="appo-count-badge">{activeAppos.length}</span>}
                    </div>
                    <div className="appo-dots mt-auto">
                        {allDayAppos.map(appo => (
                            <div key={appo.id} className={`dot status-${appo.status}`} title={appo.patient_name}></div>
                        ))}
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
                                value={selectedProcedure}
                                onChange={(e) => setSelectedProcedure(e.target.value)}
                            >
                                <option value="">Todos los procedimientos</option>
                                {procedures.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-auto">
                            {selectedProcedure && (
                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setSelectedProcedure("")}>
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>
                        <div className="col text-end">
                            {selectedProcedure ? (
                                <span className="badge bg-primary rounded-pill px-3 py-2">
                                    Filtrando por: {procedures.find(p => p.id == selectedProcedure)?.name}
                                </span>
                            ) : (
                                <span className="badge bg-light text-dark border rounded-pill px-3 py-2 me-2">
                                    Vista General
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h6 className="fw-bold mb-4 ms-1">Active Waitlist</h6>
                            <div className="mb-4">
                                <p className="section-title urgent py-1 px-2 rounded mb-3">URGENT (NEXT 48H)</p>
                                <PatientRow name="Elena Gomez" specialty="Cardiology" />
                                <PatientRow name="Raj Patel" specialty="Dermatology" />
                            </div>
                            <div>
                                <p className="section-title routine py-1 px-2 rounded mb-3">ROUTINE (NEXT 2 WEEKS)</p>
                                <PatientRow name="Adam Cooper" specialty="Dermatology" />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold m-0 text-secondary">Future Availability Forecast</h6>
                                <button className="btn btn-sm btn-dark px-3 rounded-pill">Auto-Match</button>
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
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showDayModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 rounded-4 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Appointments for {currentMonthName} {selectedDayNumber}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDayModal(false)}></button>
                            </div>
                           <div className="modal-body p-4">
                                {selectedDayAppointments.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {selectedDayAppointments.map(appo => (
                                            <div key={appo.id} className="list-group-item d-flex justify-content-between align-items-center py-3 border-light rounded-3 mb-2 bg-light shadow-sm">
                                                <div>
                                                    <h6 className="mb-1 fw-bold">{appo.patient_name}</h6>
                                                    <p className="mb-0 text-muted extra-small">
                                                        <i className="bi bi-clock me-1"></i>
                                                        {new Date(appo.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - <strong>{appo.procedure_name}</strong>
                                                    </p>
                                                    <span className={`badge mt-2 bg-${appo.status === 'confirmed' ? 'success' : appo.status === 'cancelled' ? 'danger' : 'warning'}`}>
                                                        {appo.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    {appo.status !== 'confirmed' && appo.status !== 'cancelled' && (
                                                        <button className="btn btn-success btn-sm rounded-3" onClick={() => updateAppointmentStatus(appo.id, 'confirmed')}>Confirm</button>
                                                    )}
                                                    {appo.status !== 'cancelled' && (
                                                        <button className="btn btn-outline-danger btn-sm rounded-3" onClick={() => updateAppointmentStatus(appo.id, 'cancelled')}>Cancel</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <i className="bi bi-calendar-x display-4 text-muted"></i>
                                        <p className="mt-3 text-muted">No hay turnos para los criterios seleccionados.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PatientRow = ({ name, specialty }) => (
    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 mb-2 border bg-white shadow-sm">
        <div className="d-flex align-items-center gap-2">
            <div className="avatar-circle" style={{width:"30px", height:"30px", backgroundColor:"#eee", borderRadius:"50%"}}></div>
            <div>
                <p className="m-0 fw-bold x-small">{name}</p>
                <p className="m-0 text-muted extra-small">{specialty}</p>
            </div>
        </div>
        <button className="btn btn-sm btn-outline-dark extra-small py-0 px-2">Find Slot</button>
    </div>
);