import { useState } from "react";

const ForgotPassword = () => {

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/forgot-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Si el email existe, se enviará un enlace para recuperar la contraseña.");
            } else {
                setError(data.msg || "Error al procesar la solicitud.");
            }

        } catch (err) {
            console.error(err);
            setError("Error de conexión con el servidor.");
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
                            Recuperar contraseña
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
                                    Ingrese su email
                                </label>

                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-signup w-100 py-2"
                                disabled={loading}
                            >
                                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                            </button>

                        </form>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;