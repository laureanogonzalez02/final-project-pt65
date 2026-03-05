import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useState, useRef, useEffect, useContext } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import "../styles/sidebar.css";

const svgProfile =
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="icon icon-tabler icons-tabler-outline icon-tabler-user-circle"
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0" />
        <path d="M9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
    </svg>
const svgSettings =
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="icon icon-tabler icons-tabler-outline icon-tabler-adjustments"
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M4 10a2 2 0 1 0 4 0 2 2 0 0 0-4 0M6 4v4M6 12v8M10 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0M12 4v10M12 18v2M16 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0M18 4v1M18 9v11" />
    </svg>
const svgLogout =
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="icon icon-tabler icons-tabler-outline icon-tabler-logout"
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
        <path d="M9 12h12l-3-3M18 15l3-3" />
    </svg>


export const Sidebar = () => {
    const { store, dispatch } = useContext(StoreContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownMenuRef = useRef(null);
    const capitalizeName = (name) => {
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (setIsOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">DS</div>
                <span className="logo-text">DocSpot AI</span>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/" className="sidebar-nav-item">
                    <h1> Dashboard </h1>
                </NavLink>
                <NavLink to="/calendar" className="sidebar-nav-item">
                    <h1> Calendar </h1>
                </NavLink>
                <NavLink to="/patients" className="sidebar-nav-item">
                    <h1> Patients </h1>
                </NavLink>
                <NavLink to="/messages" className="sidebar-nav-item">
                    <h1> Messages </h1>
                </NavLink>
                <NavLink to="/staff" className="sidebar-nav-item">
                    <h1> Staff </h1>
                </NavLink>
            </nav>
            <div className="profile-container">
                {isOpen && (
                    <div className="dropdown-menu-up" ref={dropdownMenuRef}>
                        <ul>
                            <li> {svgProfile} Ver Perfil</li>
                            <li> {svgSettings} Configuración</li>
                            <li className="logout" onClick={handleLogout}>{svgLogout} Cerrar Sesión</li>
                        </ul>
                    </div>
                )}
                <div className="user-profile" onClick={() => setIsOpen(!isOpen)} >
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="User" />
                    <div className="user-info">
                        <span className="user-name">{capitalizeName(store.user?.full_name)}</span>
                        <span className="user-role">{store.user?.role}</span>
                    </div>
                </div>
            </div>

        </aside>
    );
};