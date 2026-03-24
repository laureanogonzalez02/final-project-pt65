import { useState, useEffect, useRef } from 'react';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { useNavigate } from 'react-router-dom';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import '../styles/chat.css';
import {
    MainContainer,
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    Sidebar,
    Search,
    ConversationList,
    Conversation,
    Avatar,
    ConversationHeader
} from '@chatscope/chat-ui-kit-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function Chat() {
    const navigate = useNavigate();
    const { store } = useGlobalReducer();
    const token = store.token;
    const [patients, setPatients] = useState([]);
    const [activePatientId, setActivePatientId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const activePatient = patients.find(p => p.id === activePatientId);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [dismissedSlots, setDismissedSlots] = useState([]);
    const [animationClass, setAnimationClass] = useState("");
    const [showExpired, setShowExpired] = useState(false);

    // Trigger animation when suggestion updates silently
    useEffect(() => {
        if (aiSuggestion && aiSuggestion.detected_procedure) {
            setAnimationClass("pulse-animation");
            const timer = setTimeout(() => setAnimationClass(""), 1500);
            return () => clearTimeout(timer);
        }
    }, [aiSuggestion]);

    // Load patients on mount
    useEffect(() => {
        fetch(`${BACKEND}/api/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setPatients(data))
            .catch(err => console.error("Error cargando pacientes:", err));
    }, [token]);

    // Load messages when active patient changes
    useEffect(() => {
        if (!activePatientId) return;
        setLoading(true);
        fetch(`${BACKEND}/api/messages/${activePatientId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setMessages(data))
            .catch(err => console.error("Error cargando mensajes:", err))
            .finally(() => setLoading(false));
    }, [activePatientId]);

    useEffect(() => {
        if (!activePatientId) return;
        const interval = setInterval(() => {
            fetch(`${BACKEND}/api/messages/${activePatientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => setMessages(data))
                .catch(err => console.error("Error cargando mensajes:", err));
        }, 2000);
        return () => clearInterval(interval);
    }, [activePatientId]);

    const handleSend = async (text) => {
        if (!text.trim()) return;
        const response = await fetch(`${BACKEND}/api/messages/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ patient_id: activePatientId, body: text })
        });
        if (response.ok) {
            const newMsg = await response.json();
            setMessages(prev => [...prev, newMsg]);
        }
    };

    // Call the AI when active patient changes or new messages arrive
    const prevPatientIdRef = useRef(null);

    useEffect(() => {
        if (!activePatientId) {
            setAiSuggestion(null);
            return;
        }

        const isNewPatient = prevPatientIdRef.current !== activePatientId;
        prevPatientIdRef.current = activePatientId;

        if (isNewPatient) {
            setAiLoading(true);
            setAiSuggestion(null);
            setDismissedSlots([]);
            setShowExpired(false);
        }

        fetch(`${BACKEND}/api/ai/chat-suggestion`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ patient_id: activePatientId })
        })
            .then(r => r.json())
            .then(data => {
                setAiSuggestion(data);
                if (data && !data.is_expired) {
                    setShowExpired(false);
                }
            })
            .catch(err => console.error("Error cargando sugerencia AI:", err))
            .finally(() => setAiLoading(false));
    }, [activePatientId, messages.length]);


    return (
        <div className="bg-light p-4 d-flex flex-column" style={{ height: "calc(100vh - 75px)", overflow: "hidden" }}>
            <div className="mb-4" style={{ flexShrink: 0 }}>
                <h4 className="fw-bold mb-0">Mensajes</h4>
                <p className="text-muted small mb-0">Conversaciones recientes con pacientes</p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>
                {/* Columna Izquierda: El Chat */}
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ flex: 1, height: "100%" }}>
                    <div style={{ height: "100%", position: "relative" }}>
                        <MainContainer>
                            {/* Left panel: Patient list */}
                            <Sidebar position="left" scrollable={false}>
                                <Search placeholder="Buscar chats..." />
                                <ConversationList>
                                    {patients.map(p => (
                                        <Conversation
                                            key={p.id}
                                            name={p.full_name}
                                            lastSenderName={p.full_name}
                                            info={p.phone || "Sin teléfono"}
                                            active={p.id === activePatientId}
                                            unreadCnt={p.unread_count || 0}
                                            onClick={() => setActivePatientId(p.id)}
                                        >
                                            <Avatar
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=3a9e6e&color=fff`}
                                                name={p.full_name}
                                            />
                                        </Conversation>
                                    ))}
                                </ConversationList>
                            </Sidebar>

                            {/* Right panel: Messages */}
                            {activePatient ? (
                                <ChatContainer>
                                    <ConversationHeader>
                                        <ConversationHeader.Back />
                                        <Avatar
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activePatient.full_name)}&background=3a9e6e&color=fff`}
                                            name={activePatient.full_name}
                                        />
                                        <ConversationHeader.Content
                                            userName={activePatient.full_name}
                                            info={activePatient.phone || "Sin teléfono"}
                                            onClick={() => navigate(`/patient/${activePatient.id}`)}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </ConversationHeader>

                                    <MessageList loading={loading} typingIndicator={false}>
                                        {messages.map((m, idx) => (
                                            <Message
                                                key={idx}
                                                model={{
                                                    message: m.body,
                                                    sender: m.sender_name,
                                                    direction: m.direction,
                                                    position: "single"
                                                }}
                                            >
                                                {m.direction === "incoming" && (
                                                    <Avatar
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activePatient.full_name)}&background=3a9e6e&color=fff`}
                                                        name={activePatient.full_name}
                                                    />
                                                )}
                                            </Message>
                                        ))}
                                    </MessageList>

                                    <MessageInput
                                        placeholder="Escribe un mensaje aquí..."
                                        onSend={handleSend}
                                        attachButton={false}
                                    />
                                </ChatContainer>
                            ) : (
                                <ChatContainer>
                                    <MessageList>
                                        <MessageList.Content style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#999", fontSize: "1.2em" }}>
                                            Seleccioná una conversación para comenzar.
                                        </MessageList.Content>
                                    </MessageList>
                                </ChatContainer>
                            )}
                        </MainContainer>
                    </div>
                </div>

                {/* right column: AI suggestions panel */}
                {activePatient && (
                    <div className={`card border-0 shadow-sm rounded-4 ${animationClass}`} style={{ width: "320px", overflowY: "auto", backgroundColor: "#fff" }}>
                        <div className="p-3">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                Sugerencia de IA
                            </h6>

                            {aiLoading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border spinner-border-sm text-success" />
                                    <p className="text-muted small mt-2">Analizando mensajes...</p>
                                </div>
                            ) : !aiSuggestion?.detected_procedure ? (
                                <div className="text-center py-4">
                                    <p className="text-muted small">Sin pedido de turno detectado en los mensajes recientes.</p>
                                </div>
                            ) : (aiSuggestion.is_expired && !showExpired) ? (
                                <div className="text-center py-4">
                                    <p className="text-muted small">Sugerencia pausada por inactividad.</p>
                                    <button 
                                        className="btn btn-outline-success btn-sm mt-3"
                                        onClick={() => setShowExpired(true)}
                                    >
                                        Ver última sugerencia
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="badge bg-success mb-3">
                                        {aiSuggestion.detected_procedure.name}
                                    </span>
                                    {aiSuggestion.available_slots
                                        .filter(slot => !dismissedSlots.includes(`${slot.date}-${slot.start_time}`))
                                        .map((slot, i) => (
                                            <div key={i} className="border rounded-3 p-2 mb-2 d-flex justify-content-between align-items-start">
                                                <div>
                                                    <div className="fw-semibold small">
                                                        {new Date(slot.date + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                                                    </div>
                                                    {aiSuggestion.detected_procedure.type === "specialty" && (
                                                        <div className="text-primary small fw-medium mt-1 mb-1">
                                                            {slot.procedure_name}
                                                        </div>
                                                    )}
                                                    <div className="text-muted small">{slot.start_time.slice(0, 5)} hs</div>
                                                    <div className="text-success small">{slot.available_slots} lugar{slot.available_slots !== 1 ? "es" : ""}</div>
                                                </div>
                                                <div className="d-flex flex-column gap-1">
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => navigate("/new-appointment", { state: { slot, patient: activePatient } })}
                                                    >
                                                        Agendar
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() => setDismissedSlots(prev => [...prev, `${slot.date}-${slot.start_time}`])}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
