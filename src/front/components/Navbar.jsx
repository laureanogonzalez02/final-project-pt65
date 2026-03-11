import React from "react";
import { useLocation } from "react-router-dom";
import "../styles/navbar.css";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
	const location = useLocation();
	const navigate = useNavigate()
	const isCalendarView = location.pathname === "/calendar";
	const currentPath = location.pathname === "/"
		? "Dashboard"
		: location.pathname.split("/")[1].charAt(0).toUpperCase() + location.pathname.split("/")[1].slice(1);

	if (isCalendarView) {
		return (
			<nav className="navbar navbar-calendar-style border-bottom bg-white px-4 py-2">
				<div className="container-fluid d-flex justify-content-between align-items-center">
					<h5 className="m-0 fw-bold text-dark">AI Demand & Waitlist Control Center</h5>
					<div className="d-flex align-items-center gap-3">
						<div className="search-box-pill d-none d-md-flex align-items-center px-3 py-1">
							<i className="bi bi-search text-muted me-2" style={{ fontSize: "0.9rem" }}></i>
							<input type="text" placeholder="Search appointments, patients..." className="search-input-clean" />
						</div>
						<div className="position-relative mx-2 cursor-pointer">
							<i className="bi bi-bell fs-5 text-secondary"></i>
							<span className="notification-dot"></span>
						</div>
						<button className="btn btn-dark rounded-3 px-4 fw-bold btn-new-appo">
							<i className="bi"></i>
							+ New Appointment
						</button>
					</div>
				</div>
			</nav>
		);
	}

	return (
		<nav className="navbar">
			<h2 className="nav-title">{currentPath}</h2>
			<div className="nav-right">
				<div className="search-box">
					<i className="bi bi-search"></i>
					<input type="text" placeholder="Search..." />
				</div>
				<button className="btn-appointment" onClick={() => navigate("/new-appointment")}>
					+ New Appointment
				</button>
			</div>
		</nav>
	);
};