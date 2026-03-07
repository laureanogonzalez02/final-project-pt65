import { useState } from "react";
import "../styles/signup.css";
import useGlobalReducer from "../hooks/useGlobalReducer";
import ConfirmModal from "../components/ConfirmModal";

const Signup = () => {
    const { store } = useGlobalReducer();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "",
        dni: "",
        full_name: "",
        phone: ""
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });

    const handleChange = (e) => {
        if (alert.show) setAlert({ show: false, msg: "", type: "" });
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const confirmSubmit = async () => {
        setLoading(true);
        setAlert({ show: false, msg: "", type: "" });
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`,
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                setAlert({ show: true, msg: "Usuario creado exitosamente", type: "success" });
                setFormData({
                    email: "",
                    password: "",
                    role: "",
                    dni: "",
                    full_name: "",
                    phone: ""
                });

            } else {
                if (data.msg === "User already exists") {
                    setAlert({ show: true, msg: "El correo electrónico ya está registrado.", type: "danger" });
                } else if (data.msg === "DNI already exists") {
                    setAlert({ show: true, msg: "El DNI ya está registrado en el sistema.", type: "danger" });
                } else if (data.msg === "All fields are required") {
                    setAlert({ show: true, msg: "Todos los campos son obligatorios.", type: "warning" });
                } else {
                    setAlert({ show: true, msg: data.msg || "Error al registrar", type: "danger" });
                }
            }
        } catch (error) {
            setAlert({ show: true, msg: "Error de conexión con el servidor.", type: "warning" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.role === "admin") {
            return;
        }
        confirmSubmit();
    };




    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="signup-card">
                        <h2 className="text-center mb-4 fw-bold">Crear Usuario</h2>
                        <form onSubmit={handleSubmit}>
                            {alert.show && (
                                <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                                    <i className="fa-solid fa-circle-exclamation me-2"></i>
                                    {alert.msg}
                                    <button type="button" className="btn-close" onClick={() => setAlert({ ...alert, show: false })} aria-label="Close"></button>
                                </div>
                            )}
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" name="email"
                                    value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Contraseña</label>
                                <input type="password" className="form-control" name="password"
                                    value={formData.password} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Rol</label>
                                <select className="form-select" name="role" value={formData.role}
                                    onChange={handleChange} required>
                                    <option value="">Seleccionar rol</option>
                                    <option value="admin">Administrador</option>
                                    <option value="user">Usuario</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">DNI</label>
                                <input type="text" className="form-control" name="dni"
                                    value={formData.dni} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Nombre Completo</label>
                                <input type="text" className="form-control" name="full_name"
                                    value={formData.full_name} onChange={handleChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Teléfono</label>
                                <input type="text" className="form-control" name="phone"
                                    value={formData.phone} onChange={handleChange} required />
                            </div>
                            <button
                                type={formData.role === "admin" ? "button" : "submit"}
                                className="btn btn-signup w-100 py-2"
                                disabled={loading}
                                data-bs-toggle={formData.role === "admin" ? "modal" : undefined}
                                data-bs-target={formData.role === "admin" ? "#confirmAdminModal" : undefined}
                            >
                                {loading ? "Creando..." : "Crear Usuario"}
                            </button>
                        </form>

                    </div>
                </div>
            </div>
            <ConfirmModal
                id="confirmAdminModal"
                title="Confirmar Creación de Admin"
                message="¿Estás seguro de crear este usuario como administrador?"
                warning="Los administradores tienen acceso total al sistema."
                onConfirm={confirmSubmit}
            />
        </div>
    );
};

export default Signup;
