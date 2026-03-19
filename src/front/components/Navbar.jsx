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

	const currentPath = location.pathname === "/"
		? "Dashboard"
		: location.pathname.split("/")[1].charAt(0).toUpperCase() + location.pathname.split("/")[1].slice(1);

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

	useEffect(() => { getPatients(); }, []);

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
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
				<button className="btn-appointment" onClick={() => navigate("/new-appointment")}>
					+ Nuevo Turno
				</button>
			</div>
		</nav>
	);
};