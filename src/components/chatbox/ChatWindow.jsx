// // ChatWindow.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { getBackendURL, getToken } from "../../api/employeeApi";
// import axios from "axios";

// export default function ChatWindow({ conversation, messages, setMessages, users, fetchMessages }) {
//   const [input, setInput] = useState("");
//   const [wsStatus, setWsStatus] = useState("disconnected");
//   const [error, setError] = useState(null);
//   const [replyTo, setReplyTo] = useState(null); // Track the message being replied to
//   const wsRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const messagesContainerRef = useRef(null);
//   const navigate = useNavigate();
//   const reconnectTimeoutRef = useRef(null);
//   const pendingMessages = useRef(new Map());

//   const cleanupWebSocket = () => {
//     if (wsRef.current) {
//       wsRef.current.onopen = null;
//       wsRef.current.onclose = null;
//       wsRef.current.onerror = null;
//       wsRef.current.onmessage = null;
//       if (wsRef.current.readyState === WebSocket.OPEN) {
//         wsRef.current.close(1000, "Normal closure");
//       }
//       wsRef.current = null;
//     }
//     if (reconnectTimeoutRef.current) {
//       clearTimeout(reconnectTimeoutRef.current);
//       reconnectTimeoutRef.current = null;
//     }
//   };

//   const connectWebSocket = () => {
//     cleanupWebSocket();

//     if (!conversation) {
//       console.log("No conversation selected, skipping WebSocket connection");
//       return;
//     }

//     const token = getToken();
//     if (!token) {
//       console.log("No token found, redirecting to login");
//       navigate("/", { replace: true });
//       return;
//     }

//     try {
//       const backendURL = getBackendURL();
//       console.log("Backend URL:", backendURL);
//       const host = backendURL.replace(/^https?:\/\//, "");
//       const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
//       const wsUrl = `${protocol}//${host}/ws/chat/${conversation.id}/?token=${token}`;

//       console.log("Connecting to WebSocket:", wsUrl);

//       const ws = new WebSocket(wsUrl);
//       wsRef.current = ws;

//       ws.onopen = () => {
//         console.log("✅ WebSocket connected");
//         setWsStatus("connected");
//         setError(null);
//       };

//       ws.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           console.log("📨 WebSocket message received:", data);
//           if (data.type === "message") {
//             const serverMessage = data.message;
            
//             // Debug the server message to see if it has reply_to
//             console.log("🔍 Server message reply_to:", serverMessage.reply_to);
//             console.log("🔍 Full server message:", serverMessage);
            
//             const tempId = [...pendingMessages.current.entries()].find(
//               ([, content]) => content === serverMessage.content
//             )?.[0];
            
//             setMessages((prev) => {
//               const filtered = tempId ? prev.filter((msg) => msg.id !== tempId) : prev;
//               if (!filtered.some((msg) => msg.id === serverMessage.id)) {
//                 return [...filtered, serverMessage];
//               }
//               return filtered;
//             });
            
//             if (tempId) {
//               pendingMessages.current.delete(tempId);
//             }
//           } else if (data.type === "error") {
//             setError(data.message);
//           }
//         } catch (err) {
//           console.error("Error parsing WebSocket message:", err);
//           setError("Failed to process incoming message");
//         }
//       };

//       ws.onerror = (error) => {
//         console.error("WebSocket error:", error);
//         setWsStatus("failed");
//         setError("WebSocket connection failed");
//         reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
//       };

//       ws.onclose = (event) => {
//         console.log("WebSocket closed:", event.code, event.reason);
//         setWsStatus("disconnected");
//         if (event.code !== 1000) {
//           reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
//         }
//       };
//     } catch (err) {
//       console.error("Error setting up WebSocket:", err);
//       setError("Failed to setup WebSocket connection");
//       setWsStatus("failed");
//     }
//   };

//   useEffect(() => {
//     const token = getToken();
//     if (!token) {
//       navigate("/", { replace: true });
//       return;
//     }

//     if (!conversation) return;

//     fetchMessages(conversation);
//     connectWebSocket();

//     return () => cleanupWebSocket();
//   }, [conversation, navigate]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     if (error) {
//       const timer = setTimeout(() => setError(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error]);

//   useEffect(() => {
//     let interval;
//     if (wsStatus !== "connected" && conversation) {
//       interval = setInterval(() => {
//         fetchMessages(conversation);
//       }, 5000);
//     }
//     return () => clearInterval(interval);
//   }, [wsStatus, conversation, fetchMessages]);

//   const sendMessage = async () => {
//     if (!conversation || !input.trim()) return;

//     const tempId = `temp-${Date.now()}`;
//     const currentUser = localStorage.getItem("username");

//     // Enhanced debug logging
//     console.log("📤 Sending message with reply_to:", replyTo);
//     console.log("📤 Full replyTo object:", JSON.stringify(replyTo, null, 2));

//     const optimisticMessage = {
//       id: tempId,
//       content: input,
//       sender: currentUser,
//       created_at: new Date().toISOString(),
//       read_by: [],
//       conversation: conversation.id,
//       reply_to: replyTo ? replyTo.id : null,
//       // Add this to properly display the reply in the UI immediately
//       replied_message: replyTo ? {
//         id: replyTo.id,
//         content: replyTo.content,
//         sender: typeof replyTo.sender === 'string' ? replyTo.sender : replyTo.sender?.username
//       } : null
//     };

//     setMessages((prev) => [...prev, optimisticMessage]);
//     pendingMessages.current.set(tempId, input);

//     // Debug WebSocket payload
//     const wsPayload = {
//       action: "send_message",
//       content: input,
//       reply_to: replyTo ? replyTo.id : null,
//     };
//     console.log("🔧 WebSocket payload being sent:", wsPayload);

//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       try {
//         wsRef.current.send(JSON.stringify(wsPayload));
//         setInput("");
//         setReplyTo(null); // Clear reply after sending
//         return;
//       } catch (err) {
//         console.error("WebSocket send error:", err);
//       }
//     }

//     try {
//       const token = getToken();
//       const response = await axios.post(
//         ${getBackendURL()}/api/chat/messages/,
//         {
//           conversation: conversation.id,
//           content: input,
//           reply_to: replyTo ? replyTo.id : null,
//         },
//         { headers: { Authorization: Token ${token} } }
//       );
//       setMessages((prev) =>
//         prev.filter((m) => m.id !== tempId).concat(response.data)
//       );
//       pendingMessages.current.delete(tempId);
//       setInput("");
//       setReplyTo(null); // Clear reply after sending
//     } catch (err) {
//       console.error("Error sending message via HTTP:", err);
//       setError("Failed to send message");
//       setMessages((prev) =>
//         prev.map((m) =>
//           m.id === tempId ? { ...m, failed: true, error: "Failed to send" } : m
//         )
//       );
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const handleReply = (message) => {
//     console.log("🔗 Setting reply to message:", message);
//     setReplyTo(message); // Set the message to reply to
//   };

//   const isMyMessage = (message) => {
//     const currentUsername = localStorage.getItem("username")?.trim().toLowerCase();
//     const sender = typeof message.sender === "string" ? message.sender : message.sender?.username;
//     return sender?.trim().toLowerCase() === currentUsername;
//   };

//   // Debug effect to see messages structure
//   useEffect(() => {
//     console.log("💬 Current messages:", messages);
//     messages.forEach((msg, index) => {
//       if (msg.reply_to) {
//         console.log🔍 Message ${index} has reply_to:`, {
//           id: msg.id,
//           content: msg.content,
//           reply_to: msg.reply_to,
//           replied_message: msg.replied_message,
//           hasReplyTo: !!msg.reply_to,
//           repliedTo: msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null
//         });
//       }
//     });
//   }, [messages]);

//   return (
//     <div
//       style={{
//         flex: 1,
//         display: "flex",
//         flexDirection: "column",
//         background: "linear-gradient(135deg, #ffffff 0%, #f9fbfc 100%)",
//         boxShadow: "0 0 20px rgba(0,0,0,0.05)",
//         height: "100%",
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           padding: "1rem",
//           borderBottom: "1px solid #e5e7eb",
//           background: "white",
//           display: "flex",
//           alignItems: "center",
//           gap: "1rem",
//           flexShrink: 0,
//         }}
//       >
//         <h2
//           style={{
//             fontSize: "1.1rem",
//             fontWeight: "600",
//             color: "#1e293b",
//             background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//             WebkitBackgroundClip: "text",
//             WebkitTextFillColor: "transparent",
//             margin: 0,
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             whiteSpace: "nowrap",
//           }}
//         >
//           {conversation?.is_group
//             ? [Group] ${conversation?.title}
//             : conversation?.title || "Select a conversation"}
//         </h2>
//         <div
//           style={{
//             fontSize: "0.875rem",
//             color: wsStatus === "connected" ? "#22c55e" : "#ef4444",
//             flexShrink: 0,
//             display: "flex",
//             alignItems: "center",
//             gap: "0.25rem",
//           }}
//         >
//           <div
//             style={{
//               width: "8px",
//               height: "8px",
//               borderRadius: "50%",
//               backgroundColor:
//                 wsStatus === "connected" ? "#22c55e" : "#ef4444",
//             }}
//           ></div>
//           {wsStatus === "connected" ? "Connected" : "Disconnected"}
//         </div>
//       </div>

//       <div
//         ref={messagesContainerRef}
//         style={{
//           flex: 1,
//           overflowY: "auto",
//           padding: "1rem",
//           background: "#f9fafb",
//           minHeight: 0,
//         }}
//       >
//         {messages.length === 0 ? (
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               height: "100%",
//               color: "#6b7280",
//               fontSize: "0.875rem",
//               textAlign: "center",
//               padding: "2rem",
//             }}
//           >
//             {conversation
//               ? "No messages yet. Start a conversation!"
//               : "Select a conversation to start chatting"}
//           </div>
//         ) : (
//           <>
//             {messages.map((message) => {
//               const myMessage = isMyMessage(message);
//               const senderName =
//                 typeof message.sender === "string"
//                   ? message.sender
//                   : message.sender?.username || "Unknown";
//               const repliedTo = message.reply_to
//                 ? messages.find((m) => m.id === message.reply_to)
//                 : null;

//               return (
//                 <div
//                   key={message.id}
//                   style={{
//                     display: "flex",
//                     justifyContent: myMessage ? "flex-end" : "flex-start",
//                     marginBottom: "1rem",
//                     alignItems: "flex-start",
//                   }}
//                 >
//                   <div
//                     style={{
//                       maxWidth: "min(70%, 400px)",
//                       background: myMessage
//                         ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
//                         : "#ffffff",
//                       color: myMessage ? "white" : "#1e293b",
//                       padding: "0.75rem 1rem",
//                       borderRadius: myMessage
//                         ? "16px 16px 4px 16px"
//                         : "16px 16px 16px 4px",
//                       boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                       position: "relative",
//                       transition: "all 0.2s ease",
//                       wordBreak: "break-word",
//                       border: myMessage ? "none" : "1px solid #e5e7eb",
//                     }}
//                   >
//                     {/* Reply context - IMPROVED VERSION */}
//                     {message.reply_to && (
//                       <div
//                         style={{
//                           background: myMessage ? "rgba(255,255,255,0.2)" : "#f1f5f9",
//                           color: myMessage ? "rgba(255,255,255,0.9)" : "#1e293b",
//                           padding: "0.5rem",
//                           borderRadius: "8px",
//                           marginBottom: "0.5rem",
//                           fontSize: "0.75rem",
//                           borderLeft: 3px solid ${myMessage ? "rgba(255,255,255,0.5)" : "#667eea"},
//                         }}
//                       >
//                         {/* Check for replied_message first (optimistic), then fall back to finding in messages */}
//                         {message.replied_message ? (
//                           <>
//                             <strong>
//                               Replying to {message.replied_message.sender}:
//                             </strong>
//                             <div style={{ marginTop: "0.25rem", fontStyle: "italic", opacity: 0.9 }}>
//                               {message.replied_message.content}
//                             </div>
//                           </>
//                         ) : repliedTo ? (
//                           <>
//                             <strong>
//                               Replying to {typeof repliedTo.sender === 'string' 
//                                 ? repliedTo.sender 
//                                 : repliedTo.sender?.username || 'Unknown'
//                               }:
//                             </strong>
//                             <div style={{ marginTop: "0.25rem", fontStyle: "italic", opacity: 0.9 }}>
//                               {repliedTo.content}
//                             </div>
//                           </>
//                         ) : (
//                           <span style={{ opacity: 0.8 }}>
//                             Replying to a message...
//                           </span>
//                         )}
//                       </div>
//                     )}

//                     {/* Sender name - show for others' messages or in group chats */}
//                     {(!myMessage || (conversation?.is_group && !myMessage)) && (
//                       <div
//                         style={{
//                           fontSize: "0.75rem",
//                           fontWeight: "600",
//                           marginBottom: "0.25rem",
//                           color: myMessage ? "rgba(255,255,255,0.9)" : "#667eea",
//                         }}
//                       >
//                         {senderName}
//                       </div>
//                     )}

//                     {/* Message content */}
//                     <div
//                       style={{
//                         fontSize: "0.875rem",
//                         lineHeight: "1.4",
//                         marginBottom: "0.25rem",
//                       }}
//                     >
//                       {message.content}
//                     </div>

//                     {/* Message status and time */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         fontSize: "0.7rem",
//                         opacity: 0.7,
//                         gap: "0.5rem",
//                       }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: "0.25rem",
//                         }}
//                       >
//                         {message.failed && (
//                           <span
//                             style={{
//                               fontSize: "0.7rem",
//                               color: myMessage ? "#ff6b6b" : "#dc2626",
//                             }}
//                           >
//                             ❌
//                           </span>
//                         )}
//                         {myMessage && !message.failed && (
//                           <span
//                             style={{
//                               fontSize: "0.7rem",
//                               color: "rgba(255,255,255,0.😎",
//                             }}
//                           >
//                             ✓
//                           </span>
//                         )}
//                       </div>
//                       <div>
//                         {new Date(message.created_at).toLocaleTimeString([], {
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </div>
//                     </div>

//                     {/* Reply button */}
//                     {!myMessage && (
//                       <button
//                         onClick={() => handleReply(message)}
//                         style={{
//                           position: "absolute",
//                           top: "0.5rem",
//                           right: "0.5rem",
//                           background: "none",
//                           border: "none",
//                           color: myMessage ? "rgba(255,255,255,0.7)" : "#667eea",
//                           fontSize: "0.75rem",
//                           cursor: "pointer",
//                           padding: "0",
//                           opacity: 0.7,
//                           transition: "opacity 0.2s ease",
//                         }}
//                         onMouseEnter={(e) => {
//                           e.target.style.opacity = "1";
//                         }}
//                         onMouseLeave={(e) => {
//                           e.target.style.opacity = "0.7";
//                         }}
//                       >
//                         Reply
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//             <div ref={messagesEndRef} />
//           </>
//         )}
//       </div>

//       <div
//         style={{
//           padding: "1rem",
//           borderTop: "1px solid #e5e7eb",
//           background: "white",
//           flexShrink: 0,
//         }}
//       >
//         <div
//           style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
//         >
//           <div style={{ flex: 1, position: "relative" }}>
//             {/* Reply preview */}
//             {replyTo && (
//               <div
//                 style={{
//                   background: "#f1f5f9",
//                   color: "#1e293b",
//                   padding: "0.5rem",
//                   borderRadius: "8px",
//                   marginBottom: "0.5rem",
//                   fontSize: "0.75rem",
//                   borderLeft: "3px solid #667eea",
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "flex-start",
//                 }}
//               >
//                 <div>
//                   <strong>
//                     Replying to {typeof replyTo.sender === 'string' 
//                       ? replyTo.sender 
//                       : replyTo.sender?.username || 'Unknown'
//                     }:{" "}
//                   </strong>
//                   <div style={{ marginTop: "0.25rem", fontStyle: "italic" }}>
//                     {replyTo.content}
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setReplyTo(null)}
//                   style={{
//                     background: "none",
//                     border: "none",
//                     color: "#ef4444",
//                     fontSize: "1rem",
//                     cursor: "pointer",
//                     marginLeft: "0.5rem",
//                     padding: "0",
//                     width: "20px",
//                     height: "20px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                   title="Cancel reply"
//                 >
//                   ×
//                 </button>
//               </div>
//             )}
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder={
//                 !conversation
//                   ? "Select a conversation to start messaging..."
//                   : wsStatus !== "connected"
//                     ? "Type your message... (Real-time connection unavailable)"
//                     : replyTo
//                       ? "Type your reply..."
//                       : "Type your message..."
//               }
//               rows="1"
//               disabled={!conversation}
//               style={{
//                 width: "100%",
//                 border: "1px solid #d1d5db",
//                 borderRadius: "12px",
//                 padding: "0.75rem",
//                 paddingRight: "3rem",
//                 fontSize: "0.875rem",
//                 outline: "none",
//                 resize: "none",
//                 minHeight: "44px",
//                 maxHeight: "120px",
//                 transition: "all 0.2s ease",
//                 background: !conversation
//                   ? "#f3f4f6"
//                   : wsStatus !== "connected"
//                     ? "#fef3c7"
//                     : "white",
//                 color: !conversation ? "#9ca3af" : "inherit",
//                 fontFamily: "inherit",
//               }}
//               onFocus={(e) => {
//                 if (conversation) {
//                   e.target.style.borderColor = "#667eea";
//                   e.target.style.boxShadow =
//                     "0 0 0 3px rgba(102, 126, 234, 0.1)";
//                 }
//               }}
//               onBlur={(e) => {
//                 e.target.style.borderColor = "#d1d5db";
//                 e.target.style.boxShadow = "none";
//               }}
//             />
//             {input.length > 0 && (
//               <div
//                 style={{
//                   position: "absolute",
//                   right: "0.75rem",
//                   bottom: "0.75rem",
//                   fontSize: "0.75rem",
//                   color: "#6b7280",
//                   background: "rgba(255,255,255,0.9)",
//                   padding: "0.25rem 0.5rem",
//                   borderRadius: "8px",
//                 }}
//               >
//                 {input.length}/1000
//               </div>
//             )}
//           </div>
//           <button
//             onClick={sendMessage}
//             disabled={!input.trim() || !conversation}
//             style={{
//               background: !input.trim() || !conversation
//                 ? "#9ca3af"
//                 : wsStatus !== "connected"
//                   ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
//                   : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//               color: "white",
//               border: "none",
//               borderRadius: "12px",
//               padding: "0.75rem 1.5rem",
//               fontSize: "0.875rem",
//               fontWeight: "500",
//               cursor: !input.trim() || !conversation
//                 ? "not-allowed"
//                 : "pointer",
//               transition: "all 0.2s ease",
//               flexShrink: 0,
//               height: "44px",
//               display: "flex",
//               alignItems: "center",
//               gap: "0.5rem",
//             }}
//             onMouseEnter={(e) => {
//               if (input.trim() && conversation) {
//                 e.target.style.transform = "translateY(-1px)";
//                 e.target.style.boxShadow =
//                   "0 4px 12px rgba(102, 126, 234, 0.4)";
//               }
//             }}
//             onMouseLeave={(e) => {
//               if (input.trim() && conversation) {
//                 e.target.style.transform = "translateY(0)";
//                 e.target.style.boxShadow = "none";
//               }
//             }}
//           >
//             {wsStatus !== "connected" ? "🔄 Send" : replyTo ? "↩️ Reply" : "📤 Send"}
//           </button>
//         </div>

//         {wsStatus !== "connected" && (
//           <div
//             style={{
//               fontSize: "0.75rem",
//               color: "#d97706",
//               marginTop: "0.5rem",
//               textAlign: "center",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: "0.25rem",
//             }}
//           >
//             ⚠️ Using fallback mode - messages may be delayed
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




// ChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendURL, getToken } from "../../api/employeeApi";
import axios from "axios";

export default function ChatWindow({ conversation, messages, setMessages, users, fetchMessages }) {
  const [input, setInput] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // Track the message being replied to
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const reconnectTimeoutRef = useRef(null);
  const pendingMessages = useRef(new Map());

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Normal closure");
      }
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connectWebSocket = () => {
    cleanupWebSocket();

    if (!conversation) {
      console.log("No conversation selected, skipping WebSocket connection");
      return;
    }

    const token = getToken();
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/", { replace: true });
      return;
    }

    try {
      const backendURL = getBackendURL();
      console.log("Backend URL:", backendURL);
      const host = backendURL.replace(/^https?:\/\//, "");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${host}/ws/chat/${conversation.id}/?token=${token}`;

      console.log("Connecting to WebSocket:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setWsStatus("connected");
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📨 WebSocket message received:", data);
          if (data.type === "message") {
            const serverMessage = data.message;
            
            // Debug the server message to see if it has reply_to
            console.log("🔍 Server message reply_to:", serverMessage.reply_to);
            console.log("🔍 Full server message:", serverMessage);
            
            const tempId = [...pendingMessages.current.entries()].find(
              ([, content]) => content === serverMessage.content
            )?.[0];
            
            setMessages((prev) => {
              const filtered = tempId ? prev.filter((msg) => msg.id !== tempId) : prev;
              if (!filtered.some((msg) => msg.id === serverMessage.id)) {
                return [...filtered, serverMessage];
              }
              return filtered;
            });
            
            if (tempId) {
              pendingMessages.current.delete(tempId);
            }
          } else if (data.type === "error") {
            setError(data.message);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
          setError("Failed to process incoming message");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsStatus("failed");
        setError("WebSocket connection failed");
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setWsStatus("disconnected");
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };
    } catch (err) {
      console.error("Error setting up WebSocket:", err);
      setError("Failed to setup WebSocket connection");
      setWsStatus("failed");
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    if (!conversation) return;

    fetchMessages(conversation);
    connectWebSocket();

    return () => cleanupWebSocket();
  }, [conversation, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    let interval;
    if (wsStatus !== "connected" && conversation) {
      interval = setInterval(() => {
        fetchMessages(conversation);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [wsStatus, conversation, fetchMessages]);

  const sendMessage = async () => {
    if (!conversation || !input.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const currentUser = localStorage.getItem("username");

    // Enhanced debug logging
    console.log("📤 Sending message with reply_to:", replyTo);
    console.log("📤 Full replyTo object:", JSON.stringify(replyTo, null, 2));

    const optimisticMessage = {
      id: tempId,
      content: input,
      sender: currentUser,
      created_at: new Date().toISOString(),
      read_by: [],
      conversation: conversation.id,
      reply_to: replyTo ? replyTo.id : null,
      // Add this to properly display the reply in the UI immediately
      replied_message: replyTo ? {
        id: replyTo.id,
        content: replyTo.content,
        sender: typeof replyTo.sender === 'string' ? replyTo.sender : replyTo.sender?.username
      } : null
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    pendingMessages.current.set(tempId, input);

    // Debug WebSocket payload
    const wsPayload = {
      action: "send_message",
      content: input,
      reply_to: replyTo ? replyTo.id : null,
    };
    console.log("🔧 WebSocket payload being sent:", wsPayload);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(wsPayload));
        setInput("");
        setReplyTo(null); // Clear reply after sending
        return;
      } catch (err) {
        console.error("WebSocket send error:", err);
      }
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${getBackendURL()}/api/chat/messages/`,
        {
          conversation: conversation.id,
          content: input,
          reply_to: replyTo ? replyTo.id : null,
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId).concat(response.data)
      );
      pendingMessages.current.delete(tempId);
      setInput("");
      setReplyTo(null); // Clear reply after sending
    } catch (err) {
      console.error("Error sending message via HTTP:", err);
      setError("Failed to send message");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, failed: true, error: "Failed to send" } : m
        )
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReply = (message) => {
    console.log("🔗 Setting reply to message:", message);
    setReplyTo(message); // Set the message to reply to
  };

  const isMyMessage = (message) => {
    const currentUsername = localStorage.getItem("username")?.trim().toLowerCase();
    const sender = typeof message.sender === "string" ? message.sender : message.sender?.username;
    return sender?.trim().toLowerCase() === currentUsername;
  };

  // Debug effect to see messages structure
  useEffect(() => {
    console.log("💬 Current messages:", messages);
    messages.forEach((msg, index) => {
      if (msg.reply_to) {
        console.log(`🔍 Message ${index} has reply_to:`, {
          id: msg.id,
          content: msg.content,
          reply_to: msg.reply_to,
          replied_message: msg.replied_message,
          hasReplyTo: !!msg.reply_to,
          repliedTo: msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null
        });
      }
    });
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #ffffff 0%, #f9fbfc 100%)",
        boxShadow: "0 0 20px rgba(0,0,0,0.05)",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid #e5e7eb",
          background: "white",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#1e293b",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {conversation?.is_group
            ? `[Group] ${conversation?.title}`
            : conversation?.title || "Select a conversation"}
        </h2>
        <div
          style={{
            fontSize: "0.875rem",
            color: wsStatus === "connected" ? "#22c55e" : "#ef4444",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor:
                wsStatus === "connected" ? "#22c55e" : "#ef4444",
            }}
          ></div>
          {wsStatus === "connected" ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          background: "#f9fafb",
          minHeight: 0,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "#6b7280",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            {conversation
              ? "No messages yet. Start a conversation!"
              : "Select a conversation to start chatting"}
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const myMessage = isMyMessage(message);
              const senderName =
                typeof message.sender === "string"
                  ? message.sender
                  : message.sender?.username || "Unknown";
              const repliedTo = message.reply_to
                ? messages.find((m) => m.id === message.reply_to)
                : null;

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: myMessage ? "flex-end" : "flex-start",
                    marginBottom: "1rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "min(70%, 400px)",
                      background: myMessage
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "#ffffff",
                      color: myMessage ? "white" : "#1e293b",
                      padding: "0.75rem 1rem",
                      borderRadius: myMessage
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      position: "relative",
                      transition: "all 0.2s ease",
                      wordBreak: "break-word",
                      border: myMessage ? "none" : "1px solid #e5e7eb",
                    }}
                  >
                    {/* Reply context - IMPROVED VERSION */}
                    {message.reply_to && (
                      <div
                        style={{
                          background: myMessage ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                          color: myMessage ? "rgba(255,255,255,0.9)" : "#1e293b",
                          padding: "0.5rem",
                          borderRadius: "8px",
                          marginBottom: "0.5rem",
                          fontSize: "0.75rem",
                          borderLeft: `3px solid ${myMessage ? "rgba(255,255,255,0.5)" : "#667eea"}`,
                        }}
                      >
                        {/* Check for replied_message first (optimistic), then fall back to finding in messages */}
                        {message.replied_message ? (
                          <>
                            <strong>
                              Replying to {message.replied_message.sender}:
                            </strong>
                            <div style={{ marginTop: "0.25rem", fontStyle: "italic", opacity: 0.9 }}>
                              {message.replied_message.content}
                            </div>
                          </>
                        ) : repliedTo ? (
                          <>
                            <strong>
                              Replying to {typeof repliedTo.sender === 'string' 
                                ? repliedTo.sender 
                                : repliedTo.sender?.username || 'Unknown'
                              }:
                            </strong>
                            <div style={{ marginTop: "0.25rem", fontStyle: "italic", opacity: 0.9 }}>
                              {repliedTo.content}
                            </div>
                          </>
                        ) : (
                          <span style={{ opacity: 0.8 }}>
                            Replying to a message...
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sender name - show for others' messages or in group chats */}
                    {(!myMessage || (conversation?.is_group && !myMessage)) && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          marginBottom: "0.25rem",
                          color: myMessage ? "rgba(255,255,255,0.9)" : "#667eea",
                        }}
                      >
                        {senderName}
                      </div>
                    )}

                    {/* Message content */}
                    <div
                      style={{
                        fontSize: "0.875rem",
                        lineHeight: "1.4",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {message.content}
                    </div>

                    {/* Message status and time */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.7rem",
                        opacity: 0.7,
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        {message.failed && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: myMessage ? "#ff6b6b" : "#dc2626",
                            }}
                          >
                            ❌
                          </span>
                        )}
                        {myMessage && !message.failed && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "rgba(255,255,255,0.8)",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Reply button */}
                    {!myMessage && (
                      <button
                        onClick={() => handleReply(message)}
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          background: "none",
                          border: "none",
                          color: myMessage ? "rgba(255,255,255,0.7)" : "#667eea",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          padding: "0",
                          opacity: 0.7,
                          transition: "opacity 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.opacity = "0.7";
                        }}
                      >
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid #e5e7eb",
          background: "white",
          flexShrink: 0,
        }}
      >
        <div
          style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            {/* Reply preview */}
            {replyTo && (
              <div
                style={{
                  background: "#f1f5f9",
                  color: "#1e293b",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  marginBottom: "0.5rem",
                  fontSize: "0.75rem",
                  borderLeft: "3px solid #667eea",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <strong>
                    Replying to {typeof replyTo.sender === 'string' 
                      ? replyTo.sender 
                      : replyTo.sender?.username || 'Unknown'
                    }:{" "}
                  </strong>
                  <div style={{ marginTop: "0.25rem", fontStyle: "italic" }}>
                    {replyTo.content}
                  </div>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "1rem",
                    cursor: "pointer",
                    marginLeft: "0.5rem",
                    padding: "0",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Cancel reply"
                >
                  ×
                </button>
              </div>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !conversation
                  ? "Select a conversation to start messaging..."
                  : wsStatus !== "connected"
                    ? "Type your message... (Real-time connection unavailable)"
                    : replyTo
                      ? "Type your reply..."
                      : "Type your message..."
              }
              rows="1"
              disabled={!conversation}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "12px",
                padding: "0.75rem",
                paddingRight: "3rem",
                fontSize: "0.875rem",
                outline: "none",
                resize: "none",
                minHeight: "44px",
                maxHeight: "120px",
                transition: "all 0.2s ease",
                background: !conversation
                  ? "#f3f4f6"
                  : wsStatus !== "connected"
                    ? "#fef3c7"
                    : "white",
                color: !conversation ? "#9ca3af" : "inherit",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                if (conversation) {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}
            />
            {input.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  bottom: "0.75rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  background: "rgba(255,255,255,0.9)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "8px",
                }}
              >
                {input.length}/1000
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !conversation}
            style={{
              background: !input.trim() || !conversation
                ? "#9ca3af"
                : wsStatus !== "connected"
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: !input.trim() || !conversation
                ? "not-allowed"
                : "pointer",
              transition: "all 0.2s ease",
              flexShrink: 0,
              height: "44px",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              if (input.trim() && conversation) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (input.trim() && conversation) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {wsStatus !== "connected" ? "🔄 Send" : replyTo ? "↩️ Reply" : "📤 Send"}
          </button>
        </div>

        {wsStatus !== "connected" && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#d97706",
              marginTop: "0.5rem",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
            }}
          >
            ⚠️ Using fallback mode - messages may be delayed
          </div>
        )}
      </div>
    </div>
  );
}