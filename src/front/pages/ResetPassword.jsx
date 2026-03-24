import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {

    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: token,
                        password: password
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Contraseña actualizada correctamente");

                setTimeout(() => {
                    navigate("/login");
                }, 2000);

            } else {
                setError(data.msg || "Error al cambiar la contraseña");
            }

        } catch (err) {
            console.error(err);
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">

                    <div className="signup-card">

                        <h2 className="text-center mb-4 fw-bold">
                            Nueva contraseña
                        </h2>

                        {message && (
                            <div className="alert alert-success">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            <div className="mb-3">
                                <label className="form-label">
                                    Nueva contraseña
                                </label>

                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Confirmar contraseña
                                </label>

                                <input
                                    type="password"
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-signup w-100 py-2"
                                disabled={loading}
                            >
                                {loading ? "Actualizando..." : "Actualizar contraseña"}
                            </button>

                        </form>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default ResetPassword;