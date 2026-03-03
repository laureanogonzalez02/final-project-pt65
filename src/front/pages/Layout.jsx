import { Outlet } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Sidebar } from "../components/Sidebar"
import "../styles/layout.css";

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
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