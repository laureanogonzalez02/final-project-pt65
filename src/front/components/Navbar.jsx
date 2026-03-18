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

	return (
		<nav className="navbar">
			<h2 className="nav-title">{currentPath}</h2>
			<div className="nav-right">
				<div className="search-box">
					<i className="bi bi-search"></i>
					<input type="text" placeholder="Buscar..." />
				</div>
				<button className="btn-appointment" onClick={() => navigate("/new-appointment")}>
					+ Nuevo Turno
				</button>
			</div>
		</nav>
	);
};