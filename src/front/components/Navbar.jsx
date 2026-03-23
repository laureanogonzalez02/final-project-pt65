import "../styles/navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useEffect, useRef } from "react";
import { StoreContext } from "../hooks/useGlobalReducer";
import { createPortal } from "react-dom";

export const Navbar = () => {
	const { store, dispatch } = useContext(StoreContext);
	const [query, setQuery] = useState("");
	const location = useLocation();
	const navigate = useNavigate();
	const [results, setResults] = useState([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const searchRef = useRef(null);
	const dropdownRef = useRef(null);
	const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

	const [notifications, setNotifications] = useState([]);
	const [showNotifDropdown, setShowNotifDropdown] = useState(false);
	const notifRef = useRef(null);
	const notifDropdownRef = useRef(null);
	const [notifCoords, setNotifCoords] = useState({ top: 0, left: 0, width: 0 });

	const routeNames = {
		"": "Tablero",
		"calendar": "Calendario",
		"patients": "Pacientes",
		"patient": "Ficha de Paciente",
		"staff": "Personal",
		"signup": "Crear Usuario",
		"new-appointment": "Nuevo Turno",
		"edit-appointment": "Editar Turno",
		"editUser": "Editar Personal",
		"messages": "Mensajes"
	};

	const currentPath = routeNames[location.pathname.split("/")[1]] || location.pathname.split("/")[1];

	const getPatients = async () => {
		const backendURL = import.meta.env.VITE_BACKEND_URL;
		const url = `${backendURL}/api/patients`;
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${store.token}`
				}
			});
			if (!response.ok) throw new Error("Error loading patients");
			const data = await response.json();
			dispatch({ type: "set_patients_list", payload: data });
		} catch (error) { console.error("Error loading patients:", error); }
	};

	const fetchNotifications = async () => {
		if (!store.token) return;
		const backendURL = import.meta.env.VITE_BACKEND_URL;
		const url = `${backendURL}/api/notifications`;
		try {
			const response = await fetch(url, {
				headers: { "Authorization": `Bearer ${store.token}` }
			});
			if (response.ok) {
				const data = await response.json();
				setNotifications(data);
			}
		} catch (error) { console.error("Error fetching notifications:", error); }
	};

	const markAsRead = async (id) => {
		const backendURL = import.meta.env.VITE_BACKEND_URL;
		const url = `${backendURL}/api/notifications/${id}/read`;
		try {
			const response = await fetch(url, {
				method: "PUT",
				headers: { "Authorization": `Bearer ${store.token}` }
			});
			if (response.ok) {
				setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
			}
		} catch (error) { console.error("Error marking notification read:", error); }
	};

	useEffect(() => {
		getPatients();
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 3000);
		return () => clearInterval(interval);
	}, [store.token]);

	const updateCoords = () => {
		if (searchRef.current) {
			const rect = searchRef.current.getBoundingClientRect();
			setCoords({
				top: rect.bottom + window.scrollY,
				left: rect.left + window.scrollX,
				width: rect.width
			});
		}
	};

	const updateNotifCoords = () => {
		if (notifRef.current) {
			const rect = notifRef.current.getBoundingClientRect();
			setNotifCoords({
				top: rect.bottom + window.scrollY + 10,
				left: rect.right + window.scrollX - 320,
				width: 320
			});
		}
	};

	useEffect(() => {
		if (showDropdown) {
			updateCoords();
			window.addEventListener("resize", updateCoords);
			window.addEventListener("scroll", updateCoords);
		}
		return () => {
			window.removeEventListener("resize", updateCoords);
			window.removeEventListener("scroll", updateCoords);
		};
	}, [showDropdown]);


	useEffect(() => {
		const handleClickOutside = (e) => {
			const clickedInSearch = searchRef.current && searchRef.current.contains(e.target);
			const clickedInDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);

			if (!clickedInSearch && !clickedInDropdown) {
				setShowDropdown(false);
			}

			const clickedInNotif = notifRef.current && notifRef.current.contains(e.target);
			const clickedInNotifDropdown = notifDropdownRef.current && notifDropdownRef.current.contains(e.target);
			if (!clickedInNotif && !clickedInNotifDropdown) {
				setShowNotifDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		if (showNotifDropdown) {
			updateNotifCoords();
			window.addEventListener("resize", updateNotifCoords);
			window.addEventListener("scroll", updateNotifCoords);
		}
		return () => {
			window.removeEventListener("resize", updateNotifCoords);
			window.removeEventListener("scroll", updateNotifCoords);
		};
	}, [showNotifDropdown]);

	useEffect(() => {
		if (query.trim().length > 1) {
			const filtered = store.patientsList?.filter(p =>
				p.full_name.toLowerCase().includes(query.toLowerCase()) ||
				p.dni.includes(query)
			).slice(0, 5);
			setResults(filtered || []);
			setShowDropdown(true);
		} else { setShowDropdown(false); }
	}, [query, store.patientsList]);

	const handleSelect = (id) => {
		setQuery("");
		setShowDropdown(false);
		navigate(`/patient/${id}`);
	};

	return (
		<nav className="navbar">
			<h2 className="nav-title">{currentPath}</h2>
			<div className="nav-right">
				<div className="search-box" ref={searchRef}>
					<i className="bi bi-search"></i>
					<input
						type="text"
						placeholder="Buscar..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>

					{showDropdown && createPortal(
						<div className="modal-filter-patient" ref={dropdownRef} style={{
							position: "absolute",
							top: `${coords.top + 10}px`,
							left: `${coords.left}px`,
							width: `${coords.width}px`,
							zIndex: 9999999
						}}>
							<div className="p-2 bg-light border-bottom">
								<span className="small text-muted fw-bold ps-2">PACIENTES ENCONTRADOS</span>
							</div>

							<div style={{ maxHeight: "300px", overflowY: "auto" }}>
								{results.length > 0 ? (
									results.map(p => (
										<div
											key={p.id}
											className="d-flex align-items-center gap-3 p-3 border-bottom search-result-item"
											style={{ cursor: "pointer" }}
											onClick={() => handleSelect(p.id)}
										>
											<div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
												style={{ width: 35, height: 35, fontSize: "0.8rem" }}>
												{p.full_name[0]}
											</div>
											<div className="text-start">
												<div className="fw-bold small text-dark">{p.full_name}</div>
												<div className="text-muted" style={{ fontSize: "0.7rem" }}>DNI: {p.dni}</div>
											</div>
										</div>
									))
								) : (
									<div className="p-4 text-center text-muted small">No hay coincidencias.</div>
								)}
							</div>

							<div className="p-2 text-center bg-light border-top">
								<button
									className="btn btn-link btn-sm text-primary fw-bold text-decoration-none"
									onClick={() => { navigate("/patients"); setShowDropdown(false); }}
								>
									Ver todos los pacientes
								</button>
							</div>
						</div>,
						document.body
					)}
				</div>

				<div className="notification-bell position-relative me-3 ms-2" ref={notifRef} style={{ cursor: "pointer" }} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
					<i className="bi bi-bell-fill fs-5 text-secondary"></i>
					{notifications.filter(n => !n.is_read).length > 0 && (
						<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.6rem" }}>
							{notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
						</span>
					)}
				</div>

				{showNotifDropdown && createPortal(
					<div className="modal-filter-patient shadow-sm rounded border" ref={notifDropdownRef} style={{
						position: "absolute",
						top: `${notifCoords.top}px`,
						left: `${notifCoords.left}px`,
						width: `${notifCoords.width}px`,
						zIndex: 9999999,
						backgroundColor: "white",
					}}>
						<div className="p-2 bg-light border-bottom d-flex justify-content-between align-items-center">
							<span className="small fw-bold ps-2 text-dark">Notificaciones</span>
							{notifications.filter(n => !n.is_read).length > 0 && (
								<span className="badge bg-primary rounded-pill">{notifications.filter(n => !n.is_read).length}</span>
							)}
						</div>

						<div style={{ maxHeight: "350px", overflowY: "auto" }}>
							{notifications.length > 0 ? (
								<>
									{notifications.filter(n => !n.is_read).slice(0, 10).map(n => (
										<div
											key={n.id}
											className="d-flex align-items-start gap-2 p-3 border-bottom position-relative bg-white"
											style={{ cursor: n.link ? "pointer" : "default" }}
											onClick={(e) => {
												if (n.link) {
													e.stopPropagation();
													markAsRead(n.id);
													navigate(n.link);
													setShowNotifDropdown(false);
												}
											}}
										>
											<div className="text-secondary mt-1">
												<i className={`bi ${n.link ? 'bi-box-arrow-in-right' : 'bi-info-circle-fill'} text-primary`}></i>
											</div>
											<div className="text-start flex-grow-1">
												<div className="small text-dark pe-3 fw-medium">{n.message}</div>
												<div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
													{new Date(n.created_at).toLocaleString()}
												</div>
											</div>
											<button
												className="btn btn-sm btn-link text-muted p-0 position-absolute top-0 end-0 mt-2 me-2"
												title="Marcar como leída"
												onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
											>
												<i className="bi bi-check-circle"></i>
											</button>
										</div>
									))}

									{notifications.filter(n => n.is_read).length > 0 && notifications.filter(n => !n.is_read).length < 10 && (
										<>
											<div className="p-1 px-3 bg-light border-bottom text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>
												ANTERIORES
											</div>
											{notifications.filter(n => n.is_read).slice(0, 10 - notifications.filter(n => !n.is_read).length).map(n => (
												<div
													key={n.id}
													className="d-flex align-items-start gap-2 p-3 border-bottom position-relative"
													style={{ cursor: n.link ? "pointer" : "default", opacity: 0.6, backgroundColor: "#f8f9fa" }}
													onClick={(e) => {
														if (n.link) {
															e.stopPropagation();
															navigate(n.link);
															setShowNotifDropdown(false);
														}
													}}
												>
													<div className="text-secondary mt-1">
														<i className={`bi ${n.link ? 'bi-box-arrow-in-right' : 'bi-info-circle-fill'} text-secondary`}></i>
													</div>
													<div className="text-start flex-grow-1">
														<div className="small text-secondary pe-3">{n.message}</div>
														<div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
															{new Date(n.created_at).toLocaleString()}
														</div>
													</div>
												</div>
											))}
										</>
									)}
								</>
							) : (
								<div className="p-4 text-center text-muted small">No tienes notificaciones nuevas.</div>
							)}
						</div>
					</div>,
					document.body
				)}

				<button className="btn-appointment" onClick={() => navigate("/new-appointment")}>
					+ Nuevo Turno
				</button>
			</div>
		</nav>
	);
};
