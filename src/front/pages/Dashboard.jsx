import { useEffect, useContext, useMemo, useState } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
    const { store, dispatch } = useContext(StoreContext);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [notifications, setNotifications] = useState([]);
    const [generatedLink, setGeneratedLink] = useState("");
    const [toasts, setToasts] = useState([]);

    const loadResetRequests = async () => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notifications`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setNotifications(data);
            }
        } catch (err) { console.error("Error cargando notificaciones:", err); }
    };

    const approveReset = async (userId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/generate-reset/${userId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setGeneratedLink(data.reset_url);
                setNotifications(prev => prev.filter(n => n.id !== userId));

                const modalElement = document.getElementById('linkModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        } catch (err) { console.error("Error:", err); }
    };

    const rejectReset = async (userId) => {
        if (window.confirm("¿Está seguro de rechazar este cambio de contraseña?")) {
            try {
                const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reject-reset/${userId}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (resp.ok) {
                    setNotifications(prev => prev.filter(n => n.id !== userId));
                }
            } catch (err) { console.error("Error rechazando la solicitud:", err); }
        }
    };


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
                mostrarNotificaciones(data, "scheduled");
            }
        } catch (err) { console.error("Error cargando turnos:", err); }
    };

    const checkDelayed = async () => {
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/check-delayed`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            await loadTodayAppointments();
        } catch (err) {
            console.error("Error checking delayed:", err);
        }
    };

    const checkUpcoming = async () => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/check-upcoming`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                mostrarNotificaciones(data, "upcoming");
            }
        } catch (err) { console.error("Error:", err); }
    };

    useEffect(() => {
        checkDelayed();
        checkUpcoming();
        const interval = setInterval(() => {
            checkDelayed();
            checkUpcoming();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (appoId, newStatus) => {
        try {
            const resp = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${appoId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );
            if (resp.ok) {
                await loadTodayAppointments();
            }
        } catch (err) {
            console.error("Error actualizando turno:", err);
        }
    };

    useEffect(() => {
        loadTodayAppointments();
        loadResetRequests()
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
        const total = todayAppointments.filter(a => a.status !== "cancelled").length;
        const confirmed = todayAppointments.filter(a => a.status === "confirmed").length;
        const cancelled = todayAppointments.filter(a => a.status === "cancelled").length;
        const scheduled = todayAppointments.filter(a => a.status === "scheduled").length;
        const delayed = todayAppointments.filter(a => a.status === "delayed").length;
        return { total, confirmed, cancelled, scheduled, delayed };
    }, [todayAppointments]);

    const statusColor = (status) => {
        if (status === "confirmed") return "success";
        if (status === "cancelled") return "danger";
        if (status === "delayed") return "dark";
        if (status === "scheduled") return "warning";
        if (status === "postponed") return "info";
        return "secondary";
    };

    const statusLabel = (status) => {
        if (status === "confirmed") return "Confirmado";
        if (status === "cancelled") return "Cancelado";
        if (status === "delayed") return "Demorado";
        if (status === "scheduled") return "Programado";
        if (status === "postponed") return "Pospuesto";
        return status;
    };

    const mostrarNotificaciones = (turnos, tipo = "scheduled") => {
        const yaNotificados = JSON.parse(localStorage.getItem("notificados") || "[]");

        const sinConfirmar = turnos.filter(
            t => (tipo === "scheduled" ? t.status === "scheduled" : t.status === "scheduled")
                && !yaNotificados.includes(t.id)
        );

        if (sinConfirmar.length === 0) return;

        localStorage.setItem("notificados", JSON.stringify([
            ...yaNotificados,
            ...sinConfirmar.map(t => t.id)
        ]));

        setToasts(prev => [...prev, ...sinConfirmar.map(t => ({ ...t, tipo }))]);

        setTimeout(() => setToasts([]), 6000);
    };

    return (
        <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            {notifications.map((n) => (
                <div key={n.id} className="alert alert-primary border-0 shadow-sm rounded-4 d-flex justify-content-between align-items-center p-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                            <i className="bi bi-shield-lock"></i>
                        </div>
                        <div>
                            <p className="mb-0 fw-bold">Solicitud de nueva contraseña</p>
                            <small className="text-muted">{n.full_name} ({n.email})</small>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-danger btn-sm rounded-3 px-3 fw-bold" onClick={() => rejectReset(n.id)}>
                            Rechazar
                        </button>
                        <button className="btn btn-primary btn-sm rounded-3 px-3 fw-bold" onClick={() => approveReset(n.id)}>
                            Aprobar y generar link
                        </button>
                    </div>
                </div>
            ))}
            <div className="modal fade" id="linkModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg rounded-4">
                        <div className="modal-header bg-light border-0 py-3">
                            <h5 className="modal-title fw-bold m-0">Link de Recuperación</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body p-4 text-center">
                            <p className="text-muted small">Copia el siguiente enlace y envíaselo al usuario. <br /><strong>Expira en 5 minutos.</strong></p>
                            <div className="input-group mb-3">
                                <input type="text" className="form-control bg-light border-0 font-monospace small" value={generatedLink} readOnly />
                                <button className="btn btn-primary" onClick={() => {
                                    navigator.clipboard.writeText(generatedLink);
                                    alert("¡Copiado!");
                                }}>
                                    <i className="bi bi-clipboard"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                    { label: "Demorados", value: stats.delayed, icon: "bi-exclamation-circle", color: "#1a1a1a", bg: "#f1f3f5" },
                    { label: "Cancelados", value: stats.cancelled, icon: "bi-x-circle", color: "#e74c3c", bg: "#fdedec" },
                ].map((stat, idx) => (
                    <div className="col" key={idx}>
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
                                    <th className="fw-semibold small text-center">Acciones</th>
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
                                                <span
                                                    className="small fw-semibold"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => navigate(`/patient/${appo.patient_id}`)}>
                                                    {appo.patient_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="small text-muted">{appo.procedure_name}</td>
                                        <td className="small text-muted">{appo.specialty_name}</td>
                                        <td>
                                            <span className={`badge bg-${statusColor(appo.status)} rounded-pill px-3`}>
                                                {statusLabel(appo.status)}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="dropdown">
                                                <button
                                                    className="btn btn-outline-dark btn-sm rounded-3 px-3 dropdown-toggle"
                                                    data-bs-toggle="dropdown"
                                                    disabled={appo.status === "cancelled"}>
                                                    Acciones
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                                                    <li>
                                                        <button
                                                            className="dropdown-item small"
                                                            disabled={appo.status !== "scheduled" && appo.status !== "delayed"}
                                                            onClick={() => updateStatus(appo.id, "confirmed")}>
                                                            <i className="bi bi-check-circle me-2 text-success"></i>
                                                            Confirmar turno
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            className="dropdown-item small"
                                                            disabled={appo.status !== "scheduled" && appo.status !== "confirmed" && appo.status !== "postponed"}
                                                            onClick={() => updateStatus(appo.id, "delayed")}>
                                                            <i className="bi bi-clock-history me-2 text-warning"></i>
                                                            Marcar demora
                                                        </button>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <button
                                                            className="dropdown-item small"
                                                            disabled={appo.status === "cancelled" || appo.status === "confirmed"}
                                                            onClick={() => navigate(`/edit-appointment/${appo.id}`)}>
                                                            <i className="fa-regular fa-pen-to-square me-2"></i>
                                                            Editar
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            className="dropdown-item small text-danger"
                                                            disabled={appo.status === "cancelled" || appo.status === "confirmed"}
                                                            onClick={() => updateStatus(appo.id, "cancelled")}>
                                                            <i className="bi bi-x-circle me-2 text-danger"></i>
                                                            Cancelar turno
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
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
            <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
                {toasts.map(t => (
                    <div key={t.id} className="toast show mb-2 shadow rounded-4 border-0">
                        <div className={`toast-header border-0 ${t.tipo === "upcoming" ? "bg-info" : "bg-warning"}`}>
                            <i className={`bi ${t.tipo === "upcoming" ? "bi-bell-fill" : "bi-exclamation-triangle-fill"} me-2`}></i>
                            <strong className="me-auto">
                                {t.tipo === "upcoming" ? "Turno mañana sin confirmar" : "Turno sin confirmar"}
                            </strong>
                            <button className="btn-close" onClick={() => setToasts([])}></button>
                        </div>
                        <div className="toast-body bg-white">
                            <p className="fw-bold mb-1">{t.patient_name}</p>
                            <p className="small text-muted mb-1">
                                <i className="bi bi-clock me-1"></i>
                                {new Date(t.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                            </p>
                            <span className={`badge ${t.tipo === "upcoming" ? "bg-info" : "bg-warning text-dark"}`}>
                                {t.tipo === "upcoming" ? "Recordatorio 24hs" : "Sin confirmar"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
