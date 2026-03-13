import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../hooks/useGlobalReducer";
import { Outlet } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Sidebar } from "../components/Sidebar"
import { isTokenExpired } from "../utils";
import "../styles/layout.css";

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const navigate = useNavigate();
    const { dispatch } = useContext(StoreContext);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token && isTokenExpired(token)) {
            console.warn("Token detectado como expirado al cargar Layout.");
            dispatch({ type: "logout" });
            navigate("/login");
        }
    }, [navigate, dispatch]);
    return (
        <ScrollToTop>
            <div className="app-wrapper">
                <Sidebar />
                <div className="main-content">
                    <Navbar />
                    <div className="page-body">
                        <Outlet />
                    </div>
                </div>
            </div>
        </ScrollToTop>
    );
};