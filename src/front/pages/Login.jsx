import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalContext from "../hooks/useGlobalReducer";


const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [dni, setDni] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState("");
    const { dispatch } = useGlobalContext();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const body = { email, password }
        if (isAdmin) body.dni = dni;

        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (response.ok) {
                dispatch({ type: "login", payload: { token: data.access_token, user: data.user } });
                navigate("/");
            } else {
                setError(data.msg || "Error al iniciar sesión");
            }
        } catch (error) {
            console.error("Error:", error);
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="signup-card">
                            <h2 className="text-center mb-4 fw-bold">Iniciar Sesión</h2>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-control"
                                        value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Contraseña</label>
                                    <input type="password" className="form-control"
                                        value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                                <div className="form-check mb-3">
                                    <input type="checkbox" className="form-check-input" id="adminCheck"
                                        checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                                    <label className="form-check-label" htmlFor="adminCheck">
                                        Soy administrador
                                    </label>
                                </div>
                                {isAdmin && (
                                    <div className="mb-3">
                                        <label className="form-label">DNI</label>
                                        <input type="text" className="form-control"
                                            value={dni} onChange={(e) => setDni(e.target.value)} required />
                                    </div>
                                )}
                                <button type="submit" className="btn btn-signup w-100 py-2" disabled={loading}>
                                    {loading ? "Ingresando..." : "Ingresar"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

export default Login;