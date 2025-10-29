// ChatApp.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import {
  fetchConversations,
  fetchUsers,
  getToken,
  removeToken,
  testChatEndpoint,
  getBackendURL,
  createGroupConversation,
} from "../../api/employeeApi";
import axios from "axios";

const ChatApp = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const fetchMessages = async (conversation) => {
    if (!conversation) return;
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("📨 Fetching messages for conversation:", conversation.id);
      const response = await axios.get(
        `${getBackendURL()}/api/chat/conversations/${conversation.id}/messages/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      console.log("Messages data:", response.data);
      setMessages(response.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.response?.data?.detail || "Failed to fetch messages");
    }
  };

  const fetchConversationsData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      console.log('Current token:', token);

      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("Fetching conversations...");
      const data = await fetchConversations();
      console.log("Conversations data:", data);

      setConversations(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      if (err.response?.status === 401 || err.message.includes('Unauthorized')) {
        setError("Your session has expired. Please log in again.");
        removeToken();
        setTimeout(() => navigate("/", { replace: true }), 2000);
      } else {
        setError(err.response?.data?.detail || err.message || "Failed to load conversations.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersData = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("Fetching users...");
      const data = await fetchUsers();
      console.log("Users data:", data);

      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 401 || err.message.includes('Unauthorized')) {
        setError("Your session has expired. Please log in again.");
        removeToken();
        setTimeout(() => navigate("/", { replace: true }), 2000);
      } else {
        setError(err.response?.data?.detail || err.message || "Failed to load users.");
      }
    }
  };

  const createGroupChat = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;
    try {
      const token = getToken();
      const response = await createGroupConversation(newGroupName, selectedUsers, token);
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

  useEffect(() => {
    fetchConversationsData();
    fetchUsersData();
    testChatEndpoint();
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
        width: sidebarCollapsed ? 'calc(100% - 80ZZpx)' : 'calc(100% - 250px)',
        marginLeft: sidebarCollapsed ? '100px' : '250px',
        display: 'flex',
        transition: 'all 0.3s ease',
        height: '100vh',
        overflow: 'hidden',
        '@media (max-width: 768px)': {
          width: '100%',
          marginLeft: '0',
          flexDirection: 'column',
        },
      }}>
        <div style={{
          width: '30%',
          minWidth: '280px',
          maxWidth: '40px',
          background: 'white',
          borderRight: '1px solid #e1e8ed',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          '@media (max-width: 768px)': {
            width: '100%',
            maxWidth: 'none',
            height: '40%',
            borderRight: 'none',
            borderBottom: '1px solid #e1e8ed',
          },
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
          '@media (max-width: 768px)': {
            height: '60%',
          },
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