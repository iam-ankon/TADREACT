// components/ChatInterface.jsx
import React, { useState, useEffect, useRef } from "react";
import { chatService } from "../../api/chatHistory";

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token ? "Present" : "Missing");

    if (!token) {
      setAuthError(true);
      setIsCheckingAuth(false);
      return;
    }

    await fetchConversations();
    setIsCheckingAuth(false);
  };

  const fetchConversations = async () => {
    try {
      console.log("Fetching conversations...");
      const data = await chatService.getConversations();
      console.log("Fetched conversations:", data);
      setConversations(Array.isArray(data) ? data : []);
      setAuthError(false);
      setApiError(null);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setConversations([]);
      if (error.response?.status === 401) {
        setAuthError(true);
      } else {
        setApiError(error.response?.data || error.message);
      }
    }
  };

  const createNewConversation = async () => {
    try {
      setApiError(null);
      const data = await chatService.createConversation();
      setCurrentConversation(data);
      setMessages([]);
      fetchConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
      setApiError(error.response?.data || error.message);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      setApiError(null);
      // Try to get conversation details first
      const conversationData =
        await chatService.getConversation(conversationId);

      // If conversation has messages directly
      if (conversationData && conversationData.messages) {
        setMessages(
          Array.isArray(conversationData.messages)
            ? conversationData.messages
            : [],
        );
      } else {
        // Otherwise fetch messages separately
        const messagesData =
          await chatService.getConversationMessages(conversationId);
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      }

      setCurrentConversation({ id: conversationId, ...conversationData });
    } catch (error) {
      console.error("Error loading conversation:", error);
      setMessages([]);
      setApiError(error.response?.data || error.message);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      created_at: new Date().toISOString(),
      id: Date.now(), // Temporary ID for display
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setApiError(null);

    try {
      // ALWAYS use sendMessage for AI conversations
      // Pass conversation ID if we have one
      const response = await chatService.sendMessage(
        inputMessage,
        currentConversation?.id, // Will be null for new conversations
      );

      console.log("Message response:", response);

      const assistantMessage = {
        role: "assistant",
        content: response.message || response.content || "Response received",
        created_at: new Date().toISOString(),
        id: Date.now() + 1,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If this was a new conversation, set the conversation ID from response
      if (!currentConversation && response.conversation_id) {
        setCurrentConversation({
          id: response.conversation_id,
          title: inputMessage.substring(0, 30) + "...",
        });
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error("Error sending message:", error);

      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (error.response) {
        console.error("Server error details:", error.response.data);
        errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          errorMessage;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
          created_at: new Date().toISOString(),
          isError: true,
          id: Date.now() + 1,
        },
      ]);

      setApiError(error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      fetchConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setApiError(error.response?.data || error.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLoginRedirect = () => {
    localStorage.setItem("redirectAfterLogin", window.location.pathname);
    window.location.href = "/login";
  };

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      width: "100%",
      backgroundColor: "#ffffff",
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    sidebar: {
      width: "260px",
      backgroundColor: "#f9fafb",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
    },
    mainChat: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      position: "relative",
    },
    newChatBtn: {
      margin: "16px",
      padding: "10px 16px",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      color: "#1f2937",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "background-color 0.2s",
      outline: "none",
    },
    conversationsList: {
      flex: 1,
      overflowY: "auto",
      padding: "8px",
    },
    conversationItem: {
      padding: "12px",
      margin: "4px 0",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#4b5563",
      transition: "background-color 0.2s",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    conversationItemActive: {
      backgroundColor: "#f3f4f6",
      color: "#111827",
      fontWeight: "500",
    },
    conversationTitle: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    deleteBtn: {
      opacity: 0,
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      padding: "0 4px",
      color: "#9ca3af",
      transition: "opacity 0.2s",
    },
    noConversations: {
      padding: "16px",
      textAlign: "center",
      color: "#9ca3af",
      fontSize: "14px",
    },
    messagesContainer: {
      flex: 1,
      overflowY: "auto",
      padding: "24px 32px",
    },
    message: {
      display: "flex",
      gap: "16px",
      marginBottom: "24px",
      animation: "fadeIn 0.3s ease-in-out",
    },
    messageUser: {
      justifyContent: "flex-start",
    },
    messageAssistant: {
      justifyContent: "flex-start",
    },
    avatar: {
      width: "36px",
      height: "36px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      flexShrink: 0,
    },
    avatarUser: {
      backgroundColor: "#f3f4f6",
    },
    avatarAssistant: {
      backgroundColor: "#f0f9ff",
    },
    messageContent: {
      flex: 1,
      maxWidth: "calc(100% - 52px)",
    },
    messageHeader: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "4px",
    },
    senderName: {
      fontSize: "15px",
      fontWeight: "600",
      color: "#111827",
    },
    messageTime: {
      fontSize: "12px",
      color: "#9ca3af",
    },
    messageText: {
      fontSize: "15px",
      lineHeight: "1.6",
      color: "#1f2937",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    inputContainer: {
      padding: "24px 32px",
      borderTop: "1px solid #e5e7eb",
      backgroundColor: "#ffffff",
    },
    inputWrapper: {
      display: "flex",
      gap: "12px",
      alignItems: "flex-end",
      maxWidth: "900px",
      margin: "0 auto",
      width: "100%",
    },
    textarea: {
      flex: 1,
      padding: "12px 16px",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "15px",
      lineHeight: "1.5",
      resize: "none",
      outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
      fontFamily: "inherit",
      backgroundColor: "#ffffff",
      color: "#1f2937",
      maxHeight: "200px",
      overflowY: "auto",
    },
    sendButton: {
      padding: "12px 24px",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      height: "fit-content",
      whiteSpace: "nowrap",
    },
    sendButtonDisabled: {
      backgroundColor: "#e5e7eb",
      cursor: "not-allowed",
      color: "#9ca3af",
    },
    typingIndicator: {
      display: "flex",
      gap: "4px",
      padding: "8px 0",
    },
    typingDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: "#9ca3af",
      animation: "typing 1.4s infinite ease-in-out",
    },
    errorMessage: {
      color: "#ef4444",
      backgroundColor: "#fef2f2",
      padding: "12px",
      borderRadius: "8px",
    },
    apiError: {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "14px",
      border: "1px solid #fecaca",
      zIndex: 20,
      maxWidth: "80%",
      wordBreak: "break-word",
    },
    authError: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      textAlign: "center",
      padding: "32px",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      zIndex: 10,
    },
    authErrorTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#111827",
      marginBottom: "12px",
    },
    authErrorText: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "24px",
    },
    loginButton: {
      padding: "10px 20px",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    loadingContainer: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      textAlign: "center",
      color: "#6b7280",
    },
  };

  // Add keyframes for animations
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }
      
      .conversation-item:hover {
        background-color: #f3f4f6;
      }
      
      .conversation-item:hover .delete-btn {
        opacity: 1;
      }
      
      .new-chat-btn:hover {
        background-color: #f9fafb;
        border-color: #d1d5db;
      }
      
      textarea:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      button:not(:disabled):hover {
        background-color: #2563eb;
      }
      
      .delete-btn:hover {
        color: #ef4444;
      }
      
      .send-button:disabled:hover {
        background-color: #e5e7eb;
      }
      
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  if (isCheckingAuth) {
    return (
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <button style={styles.newChatBtn} disabled>
            <span>+</span> New Chat
          </button>
        </div>
        <div style={styles.mainChat}>
          <div style={styles.loadingContainer}>Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <button style={styles.newChatBtn} disabled>
            <span>+</span> New Chat
          </button>
        </div>
        <div style={styles.mainChat}>
          <div style={styles.authError}>
            <h2 style={styles.authErrorTitle}>Authentication Required</h2>
            <p style={styles.authErrorText}>
              Please log in to continue using the chat.
              <br />
              <small>
                Token: {localStorage.getItem("token") ? "Present" : "Missing"}
              </small>
            </p>
            <button style={styles.loginButton} onClick={handleLoginRedirect}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const conversationList = Array.isArray(conversations) ? conversations : [];

  return (
    <div style={styles.container}>
      {apiError && (
        <div style={styles.apiError}>
          <strong>API Error:</strong> {JSON.stringify(apiError)}
        </div>
      )}

      <div style={styles.sidebar}>
        <button
          onClick={createNewConversation}
          style={styles.newChatBtn}
          className="new-chat-btn"
        >
          <span>+</span> New Chat
        </button>
        <div style={styles.conversationsList}>
          {conversationList.length > 0 ? (
            conversationList.map((conv) => (
              <div
                key={conv?.id || Math.random()}
                style={{
                  ...styles.conversationItem,
                  ...(currentConversation?.id === conv?.id
                    ? styles.conversationItemActive
                    : {}),
                }}
                className="conversation-item"
              >
                <span
                  style={styles.conversationTitle}
                  onClick={() => conv?.id && loadConversation(conv.id)}
                >
                  {conv?.title || "New Conversation"}
                </span>
                <button
                  className="delete-btn"
                  style={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      conv?.id &&
                      window.confirm("Delete this conversation?")
                    ) {
                      deleteConversation(conv.id);
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div style={styles.noConversations}>No conversations yet</div>
          )}
        </div>
      </div>

      <div style={styles.mainChat}>
        <div style={styles.messagesContainer}>
          {Array.isArray(messages) &&
            messages.map((message, index) => (
              <div
                key={index}
                style={{
                  ...styles.message,
                  ...(message?.role === "user"
                    ? styles.messageUser
                    : styles.messageAssistant),
                }}
              >
                <div
                  style={{
                    ...styles.avatar,
                    ...(message?.role === "user"
                      ? styles.avatarUser
                      : styles.avatarAssistant),
                  }}
                >
                  {message?.role === "user" ? "👤" : "🤖"}
                </div>
                <div style={styles.messageContent}>
                  <div style={styles.messageHeader}>
                    <span style={styles.senderName}>
                      {message?.role === "user" ? "You" : "AI Assistant"}
                    </span>
                    <span style={styles.messageTime}>
                      {message?.created_at
                        ? new Date(message.created_at).toLocaleTimeString()
                        : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      ...styles.messageText,
                      ...(message?.isError ? styles.errorMessage : {}),
                    }}
                  >
                    {message?.content || ""}
                  </div>
                </div>
              </div>
            ))}

          {isLoading && (
            <div style={{ ...styles.message, ...styles.messageAssistant }}>
              <div style={{ ...styles.avatar, ...styles.avatarAssistant }}>
                🤖
              </div>
              <div style={styles.messageContent}>
                <div style={styles.typingIndicator}>
                  <span
                    style={{ ...styles.typingDot, animationDelay: "0s" }}
                  ></span>
                  <span
                    style={{ ...styles.typingDot, animationDelay: "0.2s" }}
                  ></span>
                  <span
                    style={{ ...styles.typingDot, animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <div style={styles.inputWrapper}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isLoading}
              rows="3"
              style={styles.textarea}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                ...styles.sendButton,
                ...(isLoading || !inputMessage.trim()
                  ? styles.sendButtonDisabled
                  : {}),
              }}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
