import { useState } from "react";
import "../styles/signup.css";
import useGlobalReducer from "../hooks/useGlobalReducer";
import useMedicalData from "../hooks/useMedicalData";

const NewAppointment = () => {
    const { specialties, procedures, loadingMedicalData } = useMedicalData();
    const { store } = useGlobalReducer();

    const initialFormState = {
        start_date_time: "",
        end_date_time: "",
        dni: "",
        user_id: store.user?.id || "",
        specialty_id: "",
        procedure_id: "",
        notes: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });

    const handleChange = (e) => {
        if (alert.show) setAlert({ show: false, msg: "", type: "" });
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAlert({ show: false, msg: "", type: "" });

        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/create-appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setAlert({ show: true, msg: "Cita programada con éxito", type: "success" });
                setFormData(initialFormState);
            } else {
                setAlert({ show: true, msg: data.msg || "Error al crear la cita", type: "danger" });
            }
        } catch (error) {
            setAlert({ show: true, msg: "Error de conexión con el servidor.", type: "warning" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="signup-card shadow-sm p-4 bg-white rounded">
                        <h2 className="text-center mb-4 fw-bold">Crear Turno</h2>
                        <form onSubmit={handleSubmit}>
                            {alert.show && (
                                <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                                    {alert.msg}
                                    <button type="button" className="btn-close" onClick={() => setAlert({ ...alert, show: false })}></button>
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Inicio</label>
                                    <input type="datetime-local" className="form-control" name="start_date_time"
                                        value={formData.start_date_time} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Fin</label>
                                    <input type="datetime-local" className="form-control" name="end_date_time"
                                        value={formData.end_date_time} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">DNI del Paciente</label>
                                <input type="text" className="form-control" name="dni"
                                    value={formData.dni} onChange={handleChange} placeholder="Ej: 12345678X" required />
                            </div>

                            <div className="row">
                                <div className="mb-3">
                                    <label className="form-label">Especialidad</label>
                                    <select
                                        className="form-select"
                                        name="specialty_id"
                                        value={formData.specialty_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{loadingMedicalData ? "Cargando..." : "Seleccione especialidad"}</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>{spec.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Procedimiento</label>
                                    <select
                                        className="form-select"
                                        name="procedure_id"
                                        value={formData.procedure_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">{loadingMedicalData ? "Cargando..." : "Seleccione procedimiento"}</option>
                                        {procedures
                                            .filter(proc => !formData.specialty_id || proc.specialty_id == formData.specialty_id)
                                            .map(proc => (
                                                <option key={proc.id} value={proc.id}>{proc.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Notas / Observaciones</label>
                                <textarea className="form-control" name="notes" rows="3"
                                    value={formData.notes} onChange={handleChange}></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}
                                style={{ backgroundColor: "#2ECC71", border: "none" }}>
                                {loading ? "Procesando..." : "Agendar Cita"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewAppointment;