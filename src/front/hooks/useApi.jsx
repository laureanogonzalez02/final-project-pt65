import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../hooks/useGlobalReducer";

export const useApi = () => {
    const { store, dispatch } = useContext(StoreContext);
    const navigate = useNavigate();

    const apiFetch = async (endpoint, options = {}) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}${endpoint}`;

        if (import.meta.env.DEV) {
            console.log(`API Request: [${options.method || 'GET'}] ${url}`);
        }
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        if (store.token) {
            headers["Authorization"] = `Bearer ${store.token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                dispatch({ type: "logout" });
                navigate("/login");
                return null;
            }

            return response;
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    };

    return apiFetch;
};