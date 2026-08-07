// ChatList.jsx
import React from "react";
import chatAPI from "../../api/chatApi";

const ChatList = ({
  conversations,
  setSelectedConversation,
  setMessages,
  newGroupName,
  setNewGroupName,
  users,
  selectedUsers,
  setSelectedUsers,
  createGroupChat,
  error,
  fetchMessages,
  fetchConversations,
}) => {
  const handleConversationClick = async (conversation) => {
    setSelectedConversation(conversation);
    localStorage.setItem("selectedConversationId", conversation.id);
    await fetchMessages(conversation);
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const startDirectMessage = async (userId) => {
    if (!userId) return;
    try {
      console.log("👤 User ID to start DM with:", userId);

      const numericUserId = parseInt(userId);
      if (isNaN(numericUserId)) {
        console.error("❌ Invalid user ID:", userId);
        return;
      }

      const response = await chatAPI.createDirectConversation(numericUserId);
      console.log("✅ Direct message created:", response);
      
      await fetchConversations();
      setSelectedConversation(response);
      localStorage.setItem("selectedConversationId", response.id);
      await fetchMessages(response);
    } catch (err) {
      console.error("❌ Error starting direct message:", err);
      console.log("🔍 Full error response:", err.response?.data);
    }
  };

  const getConversationTitle = (conversation) => {
    if (conversation.is_group) {
      return `[Group] ${conversation.title || `Group Chat ${conversation.id}`}`;
    }
    if (conversation.title) {
      return conversation.title;
    }
    const currentUser = localStorage.getItem("username");
    const otherMember = conversation.members?.find(
      (member) => member.user !== currentUser
    );
    return otherMember?.user || `Chat ${conversation.id}`;
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        overflow: "hidden",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#1e293b",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          flexShrink: 0,
        }}
      >
        💬 Conversations
      </h2>

      {error && (
        <div
          style={{
            color: "#dc2626",
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            fontSize: "0.875rem",
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "1.5rem",
          minHeight: 0,
        }}
      >
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: "500",
            marginBottom: "0.75rem",
            color: "#374151",
            flexShrink: 0,
          }}
        >
          Your Chats
        </h3>
        {conversations.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
              fontSize: "0.875rem",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            No conversations yet.
          </p>
        ) : (
          <div style={{
            overflowY: "auto",
            maxHeight: "calc(100% - 2rem)",
          }}>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                style={{
                  padding: "0.75rem",
                  marginBottom: "0.5rem",
                  background: "#ffffff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#1e293b",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getConversationTitle(conversation)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rest of the component remains the same */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: "1rem",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: "500",
            marginBottom: "0.75rem",
            color: "#374151",
          }}
        >
          Start Direct Message
        </h3>
        <select
          onChange={(e) => startDirectMessage(e.target.value)}
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            fontSize: "0.875rem",
            outline: "none",
            transition: "all 0.2s ease",
            background: "white",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#d1d5db";
            e.target.style.boxShadow = "none";
          }}
        >
          <option value="">Select a user</option>
          {users
            .filter((user) => user.username !== localStorage.getItem("username"))
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
        </select>
      </div>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: "1rem",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: "500",
            marginBottom: "0.75rem",
            color: "#374151",
          }}
        >
          Create Group Chat
        </h3>

        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Enter group name"
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            fontSize: "0.875rem",
            outline: "none",
            transition: "all 0.2s ease",
            background: "white",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#d1d5db";
            e.target.style.boxShadow = "none";
          }}
        />

        <div
          style={{
            marginBottom: "0.75rem",
            maxHeight: "8rem",
            overflowY: "auto",
            background: "#f8fafc",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h4
            style={{
              fontSize: "0.75rem",
              fontWeight: "500",
              marginBottom: "0.5rem",
              color: "#6b7280",
            }}
          >
            Select Members:
          </h4>
          {users
            .filter((user) => user.username !== localStorage.getItem("username"))
            .map((user) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                  style={{
                    marginRight: "0.5rem",
                    height: "1rem",
                    width: "1rem",
                    accentColor: "#667eea",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "#374151",
                  }}
                >
                  {user.username}
                </span>
              </div>
            ))}
        </div>

        <button
          onClick={createGroupChat}
          disabled={!newGroupName.trim() || selectedUsers.length === 0}
          style={{
            width: "100%",
            background: !newGroupName.trim() || selectedUsers.length === 0
              ? "#9ca3af"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: !newGroupName.trim() || selectedUsers.length === 0
              ? "not-allowed"
              : "pointer",
            transition: "all 0.2s ease",
            opacity: !newGroupName.trim() || selectedUsers.length === 0
              ? 0.6
              : 1,
          }}
          onMouseEnter={(e) => {
            if (newGroupName.trim() && selectedUsers.length > 0) {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (newGroupName.trim() && selectedUsers.length > 0) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }
          }}
        >
          Create Group Chat
        </button>
      </div>
    </div>
  );
};

export default ChatList;