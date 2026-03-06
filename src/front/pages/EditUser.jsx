import React, { useState, useContext, useEffect } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";

export const EditUser = () => {
    const { store, dispatch } = useContext(StoreContext);
    const navigate = useNavigate();
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        dni: "",
        role: "",
        is_active: true
    });

    const is_deactivating = store.singleUser?.is_active && !formData.is_active;

    useEffect(() => {
        if (store.singleUser) {
            setFormData({
                full_name: store.singleUser.full_name || "",
                email: store.singleUser.email || "",
                phone: store.singleUser.phone || "",
                dni: store.singleUser.dni || "",
                role: store.singleUser.role || "",
                is_active: store.singleUser.is_active
            });
        } else {
            navigate("/staff");
        }
    }, [store.singleUser, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (alert.show) setAlert({ show: false, msg: "", type: "" });
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const confirmUpdate = async () => {
        let backendURL = import.meta.env.VITE_BACKEND_URL;
        if (backendURL.endsWith('/')) backendURL = backendURL.slice(0, -1);
        const url = `${backendURL}/api/users/${store.singleUser.id}`;
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log("%c ¡ACTUALIZACIÓN EXITOSA! ", "background: #222; color: #bada55; font-size: 1.2rem");
                
                let successMessage = "Usuario actualizado correctamente.";
                if (!formData.is_active) {
                    successMessage = "Usuario desactivado. Aviso: La sesión del usuario ha sido invalidada.";
                }

                setAlert({ show: true, msg: successMessage, type: "success" });

                setTimeout(() => {
                    dispatch({ type: "set_user", payload: null });
                    navigate("/staff");
                }, 2000);

            } else {
                let errorMessage = "Ocurrió un error al actualizar.";

                if (data.msg === "email already exist") {
                    errorMessage = "Error: El correo electrónico ya está registrado por otro usuario.";
                } else if (data.msg === "dni already exist") {
                    errorMessage = "Error: El DNI ya está registrado en el sistema.";
                } else if (data.msg === "No changes detected") {
                    errorMessage = "No se detectaron cambios para actualizar.";
                } else if (response.status === 403 || data.msg === "Account disabled") {
                    errorMessage = "Aviso de Seguridad: Intento de acceso o modificación de una cuenta deshabilitada denegado.";
                }

                setAlert({
                    show: true,
                    msg: errorMessage,
                    type: "danger"
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                msg: "Error de conexión con el servidor.",
                type: "warning"
            });
        }
    };

    return (
        <div className="container py-5">
            <div className="card shadow border-0 rounded-4 p-4 mx-auto" style={{ maxWidth: "600px" }}>
                <h2 className="fw-bold mb-4">Editar Personal</h2>
                
                {alert.show && (
                    <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                        <i className="fa-solid fa-circle-exclamation me-2"></i>
                        {alert.msg}
                        <button type="button" className="btn-close" onClick={() => setAlert({ ...alert, show: false })} aria-label="Close"></button>
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Nombre Completo</label>
                        <input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Email</label>
                        <input type="email" className={`form-control ${alert.msg.includes('correo') ? 'is-invalid' : ''}`} name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Teléfono</label>
                            <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">DNI</label>
                            <input type="text" className={`form-control ${alert.msg.includes('DNI') ? 'is-invalid' : ''}`} name="dni" value={formData.dni} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label fw-bold">Rol</label>
                        <select className="form-select" name="role" value={formData.role} onChange={handleChange}>
                            <option value="usuario">Usuario</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div className="form-check form-switch mb-4">
                        <input className="form-check-input" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} id="activeSwitch" />
                        <label className="form-check-label fw-bold" htmlFor="activeSwitch">Usuario Activo</label>
                    </div>

                    <div className="d-flex gap-2">
                        <button 
                            type="button" 
                            className="btn btn-dark w-100 py-2 fw-bold" 
                            data-bs-toggle="modal" 
                            data-bs-target="#confirmEditModal"
                        >
                            Guardar Cambios
                        </button>
                        <button type="button" className="btn btn-light w-100 py-2 fw-bold" onClick={() => navigate("/staff")}>Cancelar</button>
                    </div>
                </form>
            </div>

            <div className="modal fade" id="confirmEditModal" tabIndex="-1" aria-labelledby="confirmEditModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content rounded-4 shadow border-0">
                        <div className="modal-header border-0">
                            <h5 className="modal-title fw-bold" id="confirmEditModalLabel">Confirmar Cambios</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body py-3">
                            <p>¿Estás seguro de que deseas actualizar la información de <strong>{formData.full_name}</strong>?</p>
                            
                            {is_deactivating && (
                                <div className="alert alert-danger small border-0 mt-3">
                                    <i className="fa-solid fa-user-slash me-2"></i>
                                    <strong>¿Está seguro que desea hacerlo?</strong> Al desactivar al usuario, su sesión será cerrada inmediatamente y no podrá acceder al sistema.
                                </div>
                            )}

                            {formData.role === "admin" && !is_deactivating && (
                                <div className="alert alert-warning small border-0 mt-3">
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                    <strong>Atención:</strong> Estás otorgando privilegios de Administrador.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-light fw-bold" data-bs-dismiss="modal">No, Cancelar</button>
                            <button 
                                type="button" 
                                className="btn btn-dark fw-bold px-4" 
                                data-bs-dismiss="modal" 
                                onClick={confirmUpdate}
                            >
                                Sí, Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};