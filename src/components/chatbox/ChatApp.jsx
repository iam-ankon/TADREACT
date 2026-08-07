
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { getToken, removeToken } from "../../api/employeeApi";
import chatAPI from "../../api/chatApi";
import { FiMessageSquare, FiUsers, FiBell, FiSearch, FiPlus } from "react-icons/fi";

const ChatApp = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    
    if (conv.name) {
      return conv.name.toLowerCase().includes(searchLower);
    }
    
    // For direct conversations, check participant names
    if (conv.participants && Array.isArray(conv.participants)) {
      return conv.participants.some(participant => 
        participant.name && participant.name.toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });

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
        color: 'white',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '60px',
            width: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#ffffff',
            margin: '0 auto 20px',
          }}></div>
          <h3 style={{ 
            margin: '0 0 10px 0',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            Loading Chat
          </h3>
          <p style={{ 
            margin: '0',
            opacity: 0.8,
            fontSize: '1rem'
          }}>
            Please wait while we load your conversations...
          </p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Error Toast */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
          zIndex: 1000,
          maxWidth: '400px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: 'slideInRight 0.3s ease-out',
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '4px'
            }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Error</span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ×
              </button>
            </div>
            <p style={{ 
              margin: '0', 
              fontSize: '13px',
              opacity: 0.9,
              lineHeight: '1.4'
            }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div style={{
        width: '100%',
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        margin: '0',
        padding: '20px',
        gap: '20px',
      }}>
        {/* Sidebar - Conversation List */}
        <div style={{
          width: '380px',
          minWidth: '380px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
        }}>
          {/* Sidebar Header */}
          <div style={{
            padding: '24px 24px 20px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}>
                  <FiMessageSquare />
                </div>
                <div>
                  <h2 style={{
                    margin: '0',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}>
                    Messages
                  </h2>
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '13px',
                    opacity: 0.9,
                  }}>
                    {conversations.length} conversations
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Refresh conversations
                  fetchConversationsData();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'rotate(90deg)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'rotate(0deg)';
                }}
                title="Refresh"
              >
                ↻
              </button>
            </div>

            {/* Search Bar */}
            <div style={{
              position: 'relative',
              marginBottom: '16px',
            }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.7)',
              }}>
                <FiSearch size={18} />
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
              />
            </div>
          </div>

          {/* Chat List */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
              padding: '16px',
            }}>
              <ChatList
                conversations={filteredConversations}
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
          </div>

          {/* Sidebar Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '14px',
              }}>
                {localStorage.getItem('employee_name')?.charAt(0) || 'U'}
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1e293b',
                }}>
                  {localStorage.getItem('employee_name') || 'User'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                }}>
                  {localStorage.getItem('designation') || 'Employee'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // Implement notification bell action
                alert('Notifications feature coming soon!');
              }}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f1f5f9';
                e.target.style.color = '#3b82f6';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#64748b';
              }}
              title="Notifications"
            >
              <FiBell />
            </button>
          </div>
        </div>

        {/* Main Chat Window */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              setMessages={setMessages}
              users={users}
              fetchMessages={fetchMessages}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              padding: '40px',
              color: '#64748b',
              textAlign: 'center',
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                fontSize: '48px',
                color: '#94a3b8',
              }}>
                <FiMessageSquare />
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 12px 0',
              }}>
                Welcome to TAD Chat
              </h3>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.5',
                maxWidth: '500px',
                margin: '0 0 24px 0',
                color: '#64748b',
              }}>
                Select a conversation from the sidebar to start messaging, 
                or create a new group chat to collaborate with your team.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    // Scroll to new group section
                    const groupSection = document.querySelector('.new-group-section');
                    if (groupSection) {
                      groupSection.scrollIntoView({ behavior: 'smooth' });
                      groupSection.querySelector('input')?.focus();
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <FiPlus /> Create Group Chat
                </button>
                <button
                  onClick={fetchConversationsData}
                  style={{
                    background: 'white',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#f1f5f9';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ↻ Refresh Conversations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ChatApp;
