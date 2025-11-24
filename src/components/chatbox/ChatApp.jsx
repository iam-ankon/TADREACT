// ChatApp.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { getToken, removeToken } from "../../api/employeeApi";
import chatAPI from "../../api/chatApi";

const ChatApp = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch conversations
  const fetchConversationsData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("Fetching conversations...");
      const data = await chatAPI.getConversations();
      console.log("Conversations data:", data);

      setConversations(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsersData = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("Fetching users...");
      const data = await chatAPI.getUsers();
      console.log("Users data:", data);

      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      handleAuthError(err);
    }
  };

  // Fetch messages
  const fetchMessages = async (conversation) => {
    if (!conversation) return;
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("📨 Fetching messages for conversation:", conversation.id);
      const data = await chatAPI.getMessages(conversation.id);
      console.log("Messages data:", data);
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.response?.data?.detail || "Failed to fetch messages");
    }
  };

  // Create group chat
  const createGroupChat = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;
    try {
      const response = await chatAPI.createGroupConversation(newGroupName, selectedUsers);
      console.log("Group chat created:", response);
      await fetchConversationsData();
      setSelectedConversation(response);
      localStorage.setItem("selectedConversationId", response.id);
      await fetchMessages(response);
      setNewGroupName("");
      setSelectedUsers([]);
    } catch (err) {
      console.error("Error creating group chat:", err);
      setError(err.response?.data?.detail || "Failed to create group chat");
    }
  };

  // Handle authentication errors
  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.message.includes('Unauthorized')) {
      setError("Your session has expired. Please log in again.");
      removeToken();
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } else {
      setError(err.response?.data?.detail || err.message || "Failed to load data.");
    }
  };

  useEffect(() => {
    fetchConversationsData();
    fetchUsersData();
  }, []);

  useEffect(() => {
    const savedConversationId = localStorage.getItem("selectedConversationId");
    if (savedConversationId && conversations.length > 0) {
      const savedConv = conversations.find(
        (conv) => conv.id === parseInt(savedConversationId)
      );
      const convToSelect = savedConv || conversations[0];
      setSelectedConversation(convToSelect);
      fetchMessages(convToSelect);
    }
  }, [conversations]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '3rem',
          width: '3rem',
          border: '3px solid transparent',
          borderTopColor: '#ffffff',
          borderRightColor: '#ffffff',
        }}></div>
        <span style={{ marginLeft: '1rem', color: 'white', fontSize: '1.1rem' }}>
          Loading conversations...
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      overflow: 'hidden',
    }}>
      {error && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxWidth: '400px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontWeight: '500' }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '1rem',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '30%',
          minWidth: '280px',
          background: 'white',
          borderRight: '1px solid #e1e8ed',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <ChatList
            conversations={conversations}
            setSelectedConversation={setSelectedConversation}
            setMessages={setMessages}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            users={users}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            createGroupChat={createGroupChat}
            error={error}
            fetchMessages={fetchMessages}
            fetchConversations={fetchConversationsData}
          />
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}>
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            setMessages={setMessages}
            users={users}
            fetchMessages={fetchMessages}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;