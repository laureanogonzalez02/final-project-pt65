import { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StoreContext } from "../hooks/useGlobalReducer";

export const PatientProfile = () => {
    const { id } = useParams();
    const { store } = useContext(StoreContext);
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const statusTranslations = {
        scheduled: "Programado",
        confirmed: "Confirmado",
        cancelled: "Cancelado",
        postponed: "Pospuesto",
        delayed: "Demorado"
    };


    useEffect(() => {
        const fetchPatientData = async () => {
            try {

                const pResp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients/${id}`, {
                    headers: { "Authorization": `Bearer ${store.token}` }
                });

                const aResp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/patient/${id}`, {
                    headers: { "Authorization": `Bearer ${store.token}` }
                });

                if (pResp.ok && aResp.ok) {
                    setPatient(await pResp.json());
                    setAppointments(await aResp.json());
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchPatientData();
    }, [id]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            const appoDate = new Date(a.start_date_time);
            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate && appoDate < startDate) return false;

            if (endDate) {
                const adjustedEnd = new Date(endDate);
                adjustedEnd.setDate(adjustedEnd.getDate() + 1);
                if (appoDate > adjustedEnd) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.start_date_time) - new Date(a.start_date_time));
    }, [appointments, dateRange]);

    const stats = useMemo(() => {
        return {
            total: filteredAppointments.filter(a => a.status === "scheduled" || a.status === "postponed").length,
            completed: filteredAppointments.filter(a => a.status === "confirmed").length,
            cancelled: filteredAppointments.filter(a => a.status === "cancelled").length,
            postponed: filteredAppointments.filter(a => a.status === "postponed").length
        };
    }, [filteredAppointments]);

    const statusColor = (s) => {
        if (s === "confirmed") return "success";
        if (s === "cancelled") return "danger";
        if (s === "postponed") return "info";
        if (s === "delayed") return "dark";
        if (s === "scheduled") return "warning";
        return "secondary";
    };

    if (loading) return <div className="p-5 text-center">Cargando ficha del paciente...</div>;

    return (
        <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <div className="mb-4">
                <button className="btn btn-sm btn-light border shadow-sm" onClick={() => navigate("/patients")}>
                    <i className="bi bi-arrow-left me-2"></i>Volver a Pacientes
                </button>
            </div>

            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold shadow"
                            style={{ width: 80, height: 80, fontSize: "2rem" }}>
                            {patient?.full_name?.split(" ").map(n => n[0]).join("")}
                        </div>
                        <h4 className="fw-bold mb-1 text-dark">{patient?.full_name}</h4>
                        <p className="text-muted small mb-3">DNI: {patient?.dni}</p>
                        <hr className="my-4 opacity-50" />

                        <div className="text-start">
                            <p className="small mb-2">
                                <i className="bi bi-envelope me-2 text-primary"></i>
                                <a
                                    href={`https://mail.google.com/mail/?view=cm&to=${patient?.email}`}
                                    target="_blank"
                                    style={{ color: "inherit", textDecoration: "none" }}>
                                    {patient?.email}
                                </a>
                            </p>
                            <p className="small mb-2">
                                <i className="bi bi-telephone me-2 text-primary"></i>
                                <strong>Teléfono:</strong> <a
                                    href={`https://wa.me/${patient?.phone?.replace(/\D/g, '')}`}
                                    target="_blank"
                                    onClick={e => e.stopPropagation()}
                                    style={{ color: "inherit", textDecoration: "none" }}>
                                    {patient?.phone}
                                </a>
                            </p>
                            <p className="small mb-0">
                                <i className="bi bi-cake2 me-2 text-primary"></i>
                                <strong>F. Nacimiento:</strong> {patient?.birth_date ? (
                                    <>
                                        {new Date(patient.birth_date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                                        <span className="text-muted ms-1">
                                            ({Math.floor((new Date() - new Date(patient.birth_date)) / (1000 * 60 * 60 * 24 * 365.25))} años)
                                        </span>
                                    </>
                                ) : 'No registrada'}
                            </p>
                            <button
                                className={`btn btn-sm mt-3 w-100 ${patient?.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                                onClick={async () => {
                                    const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients/${patient.id}`, {
                                        method: "PUT",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${store.token}`
                                        },
                                        body: JSON.stringify({ is_active: !patient.is_active })
                                    });
                                    if (resp.ok) setPatient({ ...patient, is_active: !patient.is_active });
                                }}>
                                {patient?.is_active ? "Desactivar paciente" : "Activar paciente"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="col-md-8">
                    <div className="row g-3 mb-4">
                        {[
                            { label: "Programados + Pospuestos ", value: stats.total, color: "primary", bg: "#eef2ff" },
                            { label: "Confirmados", value: stats.completed, color: "success", bg: "#f0fdf4" },
                            { label: "Cancelados", value: stats.cancelled, color: "danger", bg: "#fef2f2" },
                            { label: "Pospuestos", value: stats.postponed, color: "info", bg: "#f0f9ff" }
                        ].map((s, idx) => (
                            <div className="col-6 col-lg-3" key={idx}>
                                <div className="card border-0 shadow-sm rounded-4 p-3 h-100" style={{ backgroundColor: s.bg }}>
                                    <p className="text-muted small mb-1">{s.label}</p>
                                    <h3 className={`fw-bold mb-0 text-${s.color}`}>{s.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h4 className="fw-bold m-0 text-center mt-5 mb-4" style={{ color: "#1e293b", letterSpacing: "0.5px" }}>
                        <i className="bi bi-clock-history me-2 text-primary"></i>
                        Historial de Turnos
                    </h4>

                    <div className="card border-0 shadow-sm rounded-4 p-4">

                        <div className="d-flex flex-column flex-lg-row align-items-center mb-5 gap-3">

                            <button
                                className="btn btn-success rounded-pill px-3 py-2 shadow-sm fw-bold d-flex align-items-center gap-2 me-lg-auto mb-3 mb-lg-0"
                                onClick={() => navigate(`/new-appointment?dni=${patient?.dni}`)}
                                style={{ backgroundColor: "#2ecc71", border: "none", whiteSpace: "nowrap" }}
                            >
                                <i className="bi bi-calendar-plus-fill"></i>
                                <span>Agendar Turno</span>
                            </button>

                            <div className="d-flex align-items-center gap-3 bg-light p-2 rounded-pill border shadow-sm w-100 w-lg-auto" style={{ minWidth: "450px" }}>
                                <span className="small text-muted fw-bold ps-4 text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Rango:</span>
                                <input
                                    type="date"
                                    className="form-control form-control-sm border-0 bg-transparent fw-bold"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <span className="text-muted small fw-bold">al</span>
                                <input
                                    type="date"
                                    className="form-control form-control-sm border-0 bg-transparent fw-bold"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />

                                {(dateRange.start || dateRange.end) && (
                                    <>
                                        <div className="vr mx-2" style={{ height: "20px" }}></div>
                                        <button
                                            className="btn btn-sm text-danger border-0 pe-4"
                                            onClick={() => setDateRange({ start: "", end: "" })}
                                            title="Limpiar filtros"
                                        >
                                            <i className="bi bi-x-circle-fill"></i>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light small">
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Especialidad</th>
                                        <th>Procedimiento</th>
                                        <th>Estado</th>
                                        <th className="text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.length > 0 ? (
                                        filteredAppointments.map(appo => (
                                            <tr key={appo.id}>
                                                <td className="small">
                                                    <div className="fw-bold">{new Date(appo.start_date_time).toLocaleDateString()}</div>
                                                    <div className="text-muted">{new Date(appo.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs</div>
                                                </td>
                                                <td className="small">{appo.specialty_name}</td>
                                                <td className="small">{appo.procedure_name}</td>
                                                <td>
                                                    <span className={`badge bg-${statusColor(appo.status)} rounded-pill px-3`} style={{ fontSize: "0.7rem" }}>
                                                        {statusTranslations[appo.status] || appo.status}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button className="btn btn-sm btn-light border rounded-3 px-3 shadow-xs"
                                                        onClick={() => navigate(`/edit-appointment/${appo.id}`)}>
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5 text-muted">
                                                <i className="bi bi-search d-block fs-2 mb-2"></i>
                                                No se encontraron turnos en este periodo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
