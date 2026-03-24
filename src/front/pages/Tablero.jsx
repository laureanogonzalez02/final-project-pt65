import { useEffect, useContext, useMemo } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export const Tablero = () => {
    const { store, dispatch } = useContext(StoreContext);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const loadTodayAppointments = async () => {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments?month=${month}&year=${year}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                dispatch({ type: "set_appointments", payload: data });
            }
        } catch (err) { console.error("Error cargando turnos:", err); }
    };

    useEffect(() => {
        loadTodayAppointments();
    }, []);

    const today = new Date();
    const todayNumber = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    const todayAppointments = useMemo(() => {
        return (store.appointments || []).filter(a => {
            const d = new Date(a.start_date_time);
            return d.getDate() === todayNumber &&
                d.getMonth() === todayMonth &&
                d.getFullYear() === todayYear;
        }).sort((a, b) => new Date(a.start_date_time) - new Date(b.start_date_time));
    }, [store.appointments]);

    const stats = useMemo(() => {
        const total = todayAppointments.length;
        const confirmed = todayAppointments.filter(a => a.status === "confirmed").length;
        const cancelled = todayAppointments.filter(a => a.status === "cancelled").length;
        const scheduled = todayAppointments.filter(a => a.status === "scheduled").length;
        return { total, confirmed, cancelled, scheduled };
    }, [todayAppointments]);

    const statusColor = (status) => {
        if (status === "confirmed") return "success";
        if (status === "cancelled") return "danger";
        return "warning";
    };

    const statusLabel = (status) => {
        if (status === "confirmed") return "Confirmado";
        if (status === "cancelled") return "Cancelado";
        return "Programado";
    };

    return (
        <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <div className="mb-4">
                <h4 className="fw-bold mb-0">
                    {dayNames[today.getDay()]}, {todayNumber} de {monthNames[todayMonth]} {todayYear}
                </h4>
                <p className="text-muted small">Bienvenido, {store.user?.full_name?.split(" ")[0]}. Acá está el resumen de hoy.</p>
            </div>

            <div className="row g-3 mb-4">
                {[
                    { label: "Turnos Hoy", value: stats.total, icon: "bi-calendar-check", color: "#2ECC71", bg: "#eafaf1" },
                    { label: "Confirmados", value: stats.confirmed, icon: "bi-check-circle", color: "#2ECC71", bg: "#eafaf1" },
                    { label: "Programados", value: stats.scheduled, icon: "bi-clock", color: "#f39c12", bg: "#fef9e7" },
                    { label: "Cancelados", value: stats.cancelled, icon: "bi-x-circle", color: "#e74c3c", bg: "#fdedec" },
                ].map((stat, idx) => (
                    <div className="col-6 col-md-3" key={idx}>
                        <div className="card border-0 shadow-sm rounded-4 p-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-3 d-flex align-items-center justify-content-center"
                                    style={{ width: 44, height: 44, backgroundColor: stat.bg }}>
                                    <i className={`bi ${stat.icon}`} style={{ color: stat.color, fontSize: "1.2rem" }}></i>
                                </div>
                                <div>
                                    <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>{stat.label}</p>
                                    <h3 className="fw-bold mb-0">{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="fw-bold m-0">
                        <i className="bi bi-list-ul me-2 text-primary"></i>
                        Agenda de Hoy
                    </h6>
                    <button className="btn btn-sm btn-outline-secondary rounded-3"
                        onClick={() => navigate("/calendar")}>
                        Ver calendario completo
                    </button>
                </div>

                {todayAppointments.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="fw-semibold small">Hora</th>
                                    <th className="fw-semibold small">Paciente</th>
                                    <th className="fw-semibold small">Procedimiento</th>
                                    <th className="fw-semibold small">Especialidad</th>
                                    <th className="fw-semibold small">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayAppointments.map(appo => (
                                    <tr key={appo.id}>
                                        <td className="small fw-bold">
                                            {new Date(appo.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                                    style={{ width: 32, height: 32, backgroundColor: "#e0e7ff", fontSize: "0.75rem", color: "#4f46e5" }}>
                                                    {appo.patient_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                </div>
                                                <span className="small fw-semibold">{appo.patient_name}</span>
                                            </div>
                                        </td>
                                        <td className="small text-muted">{appo.procedure_name}</td>
                                        <td className="small text-muted">{appo.specialty_name}</td>
                                        <td>
                                            <span className={`badge bg-${statusColor(appo.status)} rounded-pill px-3`}>
                                                {statusLabel(appo.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-5">
                        <i className="bi bi-calendar-x display-4 text-muted"></i>
                        <p className="mt-3 text-muted">No hay turnos programados para hoy.</p>
                        <button className="btn btn-dark rounded-3 px-4 mt-2"
                            onClick={() => navigate("/new-appointment")}>
                            + Agendar turno
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};