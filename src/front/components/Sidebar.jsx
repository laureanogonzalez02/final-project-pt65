import React from "react";
import { NavLink, Link } from "react-router-dom";
import "../styles/sidebar.css";

export const Sidebar = () => {
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
            </nav>
            <div className="user-profile">
                <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="User" />
                <div className="user-info">
                    <span className="user-name">Administrador</span>
                    <span className="user-role">Admin Profile</span>
                </div>

            </div>
        </aside>
    );
};