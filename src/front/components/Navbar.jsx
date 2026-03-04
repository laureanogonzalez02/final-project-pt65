import React from "react";
import "../styles/navbar.css";

export const Navbar = () => {
	return (
		<nav className="navbar">
			<h2 className="nav-title">Dashboard</h2>
			<div className="nav-right">
				<div className="search-box">
					<i className="bi bi-search"></i>
					<input type="text" placeholder="Search..." />
				</div>
				<button className="btn-appointment">+ New Appointment</button>
			</div>
		</nav>
	);
};