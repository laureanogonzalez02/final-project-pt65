import { useState, useEffect } from "react";
import useGlobalReducer from "./useGlobalReducer";

const useMedicalData = () => {
    const { store } = useGlobalReducer();
    const [specialties, setSpecialties] = useState([]);
    const [procedures, setProcedures] = useState([]);
    const [loadingMedicalData, setLoadingMedicalData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const url = import.meta.env.VITE_BACKEND_URL;

                const [specRes, procRes] = await Promise.all([
                    fetch(import.meta.env.VITE_BACKEND_URL + "/api/specialties", {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${store.token}`,
                        }
                    }),
                    fetch(import.meta.env.VITE_BACKEND_URL + "/api/procedures", {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${store.token}`,
                        }
                    }),
                ]);

                if (specRes.ok && procRes.ok) {
                    setSpecialties(await specRes.json());
                    setProcedures(await procRes.json());
                }
            } catch (error) {
                console.error("Error cargando datos médicos:", error);
            } finally {
                setLoadingMedicalData(false);
            }
        };

        fetchData();
    }, []);

    return { specialties, procedures, loadingMedicalData };
};

export default useMedicalData;