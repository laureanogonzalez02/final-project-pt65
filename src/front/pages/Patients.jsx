import { useContext, useEffect, useState } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import "../styles/patients.css";

export const Patients = () => {
    const { store, dispatch } = useContext(StoreContext);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const getPatients = async () => {
        const backendURL = import.meta.env.VITE_BACKEND_URL;
        const url = `${backendURL}/api/patients`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                }
            });
            if (!response.ok) throw new Error("Error loading patients");
            const data = await response.json();

            dispatch({
                type: "set_patients_list",
                payload: data
            });
        } catch (error) {
            console.error("Error loading patients:", error);
        }
    };

    useEffect(() => {
        getPatients();
    }, []);

    const filteredPatients = (store.patientsList || []).filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.dni.includes(searchTerm)
    );

    return (
        <div className="py-4 px-5">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: "#1e293b" }}>Gestión de Pacientes</h2>
                    <p className="text-muted">Administra la base de datos de tu clínica</p>
                </div>

                <div className="input-group" style={{ maxWidth: "400px" }}>
                    <span className="input-group-text bg-white border-end-0 rounded-start-4">
                        <i className="fa-solid fa-magnifying-glass text-muted"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control border-start-0 rounded-end-4 py-2"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="row g-3 mb-5">
                {[
                    { label: "Total Pacientes", value: store.patientsList?.length || 0, color: "text-dark" },
                    { label: "Pacientes Activos", value: store.patientsList?.filter(p => p.is_active).length || 0, color: "text-success" },
                    { label: "Pacientes Inactivos", value: store.patientsList?.filter(p => !p.is_active).length || 0, color: "text-danger" },
                    { label: "Turnos Programados", value: store.patientsList?.reduce((acc, patient) => acc + patient.appointment_count, 0) || 0, color: "text-warning" }
                ].map((stat, idx) => (
                    <div className="col-12 col-md-3" key={idx}>
                        <div className="card border-0 shadow-sm p-3 rounded-4">
                            <span className="text-muted small fw-medium">{stat.label}</span>
                            <h2 className={`fw-bold mb-0 ${stat.color}`}>{stat.value}</h2>
                        </div>
                    </div>
                ))}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold">Listado de Pacientes ({filteredPatients.length})</h5>
            </div>

            <div className="row g-4">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <div className="col-12 col-xl-6" key={patient.id} onClick={() => navigate(`/patient/${patient.id}`)}>
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 patient-card-hover">
                                <div className="d-flex align-items-start justify-content-between mb-3">
                                    <div className="d-flex gap-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-success"
                                            style={{ width: "60px", height: "60px", backgroundColor: "#dcfce7", fontSize: "1.2rem" }}>
                                            {patient.full_name ? patient.full_name[0] : "P"}
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-2">
                                                <h5 className="fw-bold mb-0">{patient.full_name}</h5>
                                                <span className={`badge rounded-pill fw-medium ${patient.is_active ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                                                    {patient.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>
                                            <p className="text-muted small mb-0">DNI: {patient.dni}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4" style={{ color: "#64748b", fontSize: "0.95rem" }}>
                                    <div className="mb-2"><i className="fa-regular fa-envelope me-2"></i> {patient.email}</div>
                                    <div className="mb-2"><i className="fa-solid fa-phone me-2"></i> {patient.phone}</div>
                                    <div><i className="fa-solid fa-cake-candles me-2"></i> Nacimiento: {patient.birth_date}</div>
                                </div>

                                <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                                    <div className="text-muted small">
                                        <i className="fa-solid fa-notes-medical me-1"></i> {patient.appointment_count} Turnos Programados
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-outline-dark btn-sm rounded-3 px-3" onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/new-appointment?dni=${patient.dni}`);
                                        }}
                                        >
                                            <i className="fa-regular fa-pen-to-square me-1"></i> Asignar Turno
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-5">
                        <i className="fa-solid fa-user-slash fa-3x text-muted mb-3"></i>
                        <p className="text-muted">No se encontraron pacientes que coincidan con "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};