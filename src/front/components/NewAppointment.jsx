import { useState } from "react";
import "../styles/signup.css";
import useGlobalReducer from "../hooks/useGlobalReducer";

const NewAppointment = () => {
    const { store } = useGlobalReducer();
    const [formData, setFormData] = useState({
        start_date_time: "",
        end_date_time: "",
        patient_id: "",
        user_id: store.user ? store.user.id : "",
        specialty_id: "",
        procedure_id: "",
        notes: ""
    });
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
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/appointments", {
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
                setFormData({
                    start_date_time: "", end_date_time: "", patient_id: "",
                    user_id: "", specialty_id: "", procedure_id: "", notes: ""
                });
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
                                <label className="form-label">ID del Paciente</label>
                                <input type="number" className="form-control" name="patient_id"
                                    value={formData.patient_id} onChange={handleChange} placeholder="Ej: 1" required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">ID del Especialista</label>
                                <input type="number" className="form-control" name="user_id"
                                    value={formData.user_id} onChange={handleChange} required />
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Especialidad (ID)</label>
                                    <input type="number" className="form-control" name="specialty_id"
                                        value={formData.specialty_id} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Procedimiento (ID)</label>
                                    <input type="number" className="form-control" name="procedure_id"
                                        value={formData.procedure_id} onChange={handleChange} required />
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