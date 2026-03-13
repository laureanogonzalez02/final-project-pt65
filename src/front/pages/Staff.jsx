import { useContext, useEffect } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";

export const Staff = () => {
    const navigate = useNavigate()
    const { store, dispatch } = useContext(StoreContext);

    const getStaff = async () => {
        const backendURL = import.meta.env.VITE_BACKEND_URL;
        const url = `${backendURL}/api/users`;

        try {
            console.log("Intentando fetch a:", url);
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${store.token}`
                }
            });
            if (!response.ok) throw new Error("Error loading staff");
            const data = await response.json();


            dispatch({
                type: "set_staff_list",
                payload: data.users
            });
        } catch (error) {
            console.error("Error loading staff:", error);
        }
    };

    useEffect(() => {
        getStaff();
    }, []);

    const handleEditClick = (user) => {
        dispatch({
            type: "set_user",
            payload: user
        });
        navigate("/editUser");
    };

    return (
        <div className=" py-4 px-5" >
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-1" style={{ color: "#1e293b" }}>Personal Administrativo</h2>
                    <p className="text-muted">Gestiona tu equipo</p>
                </div>

            </div>

            <div className="row g-3 mb-5">
                {[
                    { label: "Total Personal", value: store.staffList.length, color: "text-dark" },
                    { label: "Disponibles Ahora", value: store.staffList.filter(user => user.is_active).length, color: "text-success" },
                    { label: "Inactivos", value: store.staffList.filter(user => !user.is_active).length, color: "text-warning" },
                    { label: "Turnos Gestionados Hoy", value: "0", color: "text-dark" }
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
                <h5 className="fw-bold mb-4">Equipo Administrativo ({store.staffList.length})</h5>
                <NavLink to="/signup" className="btn btn-primary px-4 py-2 fw-semibold shadow-sm" style={{ backgroundColor: "#2ECC71", border: "none" }}>
                    + Agregar Personal
                </NavLink>
            </div>
            <div className="row g-4">
                {store.staffList.length > 0 ? (
                    store.staffList.map((user) => (

                        <div className="col-12 col-xl-6" key={user.id}>
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <div className="d-flex align-items-start justify-content-between mb-3">
                                    <div className="d-flex gap-3">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary"
                                            style={{ width: "60px", height: "60px", backgroundColor: "#e0e7ff", fontSize: "1.2rem" }}>
                                            {user.full_name ? user.full_name.split(" ").map(user => user[0]).join("") : "Desc."}
                                        </div>
                                        <div>
                                            <div className="d-flex align-items-center gap-2">
                                                <h5 className="fw-bold mb-0">{user.full_name.replace(/_/g, ' ')}</h5>
                                                <span className={`badge rounded-pill fw-medium ${user.is_active ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                                                    {user.is_active ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>
                                            <p className="text-muted small mb-0">{user.role}</p>
                                        </div>
                                    </div>
                                </div>


                                <div className="mb-4" style={{ color: "#64748b", fontSize: "0.95rem" }}>
                                    <div className="mb-2"><i className="fa-regular fa-envelope me-2"></i> {user.email}</div>
                                    <div className="mb-2"><i className="fa-solid fa-phone me-2"></i> {user.phone}</div>
                                    <div><i className="fa-regular fa-id-card me-2"></i> DNI: {user.dni}</div>
                                </div>


                                <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                                    <div className="text-muted small">
                                        <i className="fa-regular fa-calendar me-1"></i> Hoy: 12 turnos
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-outline-secondary btn-sm rounded-3 px-3">
                                            <i className="fa-regular fa-clock me-1"></i> Agenda
                                        </button>

                                        <button className="btn btn-outline-dark btn-sm rounded-3 px-3" onClick={() => handleEditClick(user)}>
                                            <i className="fa-regular fa-pen-to-square me-1"></i> Editar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-5">
                        <p className="text-muted">No hay personal registrado o cargando datos...</p>
                    </div>
                )}
            </div>
        </div>
    );
};