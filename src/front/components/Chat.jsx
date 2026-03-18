import { useState } from 'react';
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

export default function Chat() {
    // 1. Fake data (Using the API later)
    const [chats, setChats] = useState([
        {
            id: 1,
            name: "Elena Gomez",
            avatar: "https://ui-avatars.com/api/?name=Elena+Gomez&background=random",
            lastSenderName: "Elena Gomez",
            info: "Ayer, 10:30 AM",
            messages: [
                { text: "Hola doctor, quería confirmar mi turno del jueves.", sender: "Elena", direction: "incoming", position: "single" },
                { text: "Hola Elena, el turno está confirmado. ¡Nos vemos el jueves!", sender: "yo", direction: "outgoing", position: "single" }
            ],
            unread: 0
        },
        {
            id: 2,
            name: "Adam Cooper",
            avatar: "https://ui-avatars.com/api/?name=Adam+Cooper&background=random",
            lastSenderName: "yo",
            info: "Hace 2 horas",
            messages: [
                { text: "Recuerde traer los estudios pre-quirúrgicos.", sender: "yo", direction: "outgoing", position: "single" },
                { text: "Entendido, gracias doctor.", sender: "Adam", direction: "incoming", position: "single" }
            ],
            unread: 1
        },
        {
            id: 3,
            name: "Raj Patel",
            avatar: "https://ui-avatars.com/api/?name=Raj+Patel&background=random",
            lastSenderName: "Raj Patel",
            info: "Lunes",
            messages: [
                { text: "Doctor, ¿puedo tomar ibuprofeno para el dolor?", sender: "Raj", direction: "incoming", position: "last" }
            ],
            unread: 3
        }
    ]);

    const [activeChatId, setActiveChatId] = useState(1);
    const activeChat = chats.find(c => c.id === activeChatId);
    const [inputValue, setInputValue] = useState("");

    // 2. Handle send message
    const handleSend = (text) => {
        if (!text.trim()) return;


        const newMessage = {
            text: text,
            sender: "yo",
            direction: "outgoing",
            position: "single"
        };

        setChats(prevChats => prevChats.map(c => {
            if (c.id === activeChatId) {
                return { ...c, messages: [...c.messages, newMessage] };
            }
            return c;
        }));
        setInputValue("");
    };

    return (
        <div className="bg-light min-vh-100 p-4">
            
            <div className="mb-4">
                <h4 className="fw-bold mb-0">Mensajes</h4>
                <p className="text-muted small mb-0">Conversaciones recientes con pacientes</p>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
                <div style={{ height: "100%", position: "relative" }}>
                    <MainContainer>
                        {/* Left Panel: Chat List */}
                        <Sidebar position="left" scrollable={false}>
                            <Search placeholder="Buscar chats..." />
                            <ConversationList>
                                {chats.map(c => (
                                    <Conversation
                                        key={c.id}
                                        name={c.name}
                                        lastSenderName={c.lastSenderName}
                                        info={c.messages[c.messages.length - 1]?.text}
                                        active={c.id === activeChatId}
                                        unreadCnt={c.unread}
                                        onClick={() => setActiveChatId(c.id)}
                                    >
                                        <Avatar src={c.avatar} name={c.name} />
                                    </Conversation>
                                ))}
                            </ConversationList>
                        </Sidebar>

                        {/* Right Panel: Active Chat */}
                        {activeChat ? (
                            <ChatContainer>
                                <ConversationHeader>
                                    <ConversationHeader.Back />
                                    <Avatar src={activeChat.avatar} name={activeChat.name} />
                                    <ConversationHeader.Content userName={activeChat.name} info={activeChat.info} />
                                </ConversationHeader>

                                <MessageList typingIndicator={false}>
                                    {activeChat.messages.map((m, idx) => (
                                        <Message
                                            key={idx}
                                            model={{
                                                message: m.text,
                                                sender: m.sender,
                                                direction: m.direction,
                                                position: m.position
                                            }}
                                        >
                                            {m.direction === "incoming" && <Avatar src={activeChat.avatar} name={activeChat.name} />}
                                        </Message>
                                    ))}
                                </MessageList>

                                <MessageInput
                                    placeholder="Escribe un mensaje aquí..."
                                    value={inputValue}
                                    onChange={val => setInputValue(val)}
                                    onSend={() => handleSend(inputValue)}
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
        </div>
    );
};
