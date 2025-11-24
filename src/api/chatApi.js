// src/api/chatApi.js
import axios from "axios";
import { getBackendURL, getToken } from "./employeeApi";

const CHAT_BASE_URL = `${getBackendURL()}/api/chat`;

// Create axios instance for chat API
const chatApi = axios.create({
  baseURL: CHAT_BASE_URL,
  timeout: 15000,
});

// Request interceptor
chatApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Response interceptor
chatApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized - redirecting to login");
      // You might want to handle logout here
    }
    return Promise.reject(error);
  }
);

// API functions with consistent response handling
export const chatAPI = {
  // Conversations
  getConversations: async () => {
    try {
      const response = await chatApi.get("/conversations/");
      // Normalize response to always return array
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  },

  createDirectConversation: async (userId) => {
    try {
      const response = await chatApi.post("/conversations/", {
        user_id: parseInt(userId),
        is_group: false,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating direct conversation:", error);
      throw error;
    }
  },

  createGroupConversation: async (title, members) => {
    try {
      const response = await chatApi.post("/conversations/", {
        title,
        is_group: true,
        members: members.map(id => parseInt(id)),
      });
      return response.data;
    } catch (error) {
      console.error("Error creating group conversation:", error);
      throw error;
    }
  },

  // Messages
  getMessages: async (conversationId) => {
    try {
      const response = await chatApi.get(`/conversations/${conversationId}/messages/`);
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  },

  sendMessage: async (conversationId, content, replyTo = null) => {
    try {
      const payload = {
        conversation: conversationId,
        content: content.trim(),
      };
      
      if (replyTo) {
        payload.reply_to = replyTo;
      }

      const response = await chatApi.post("/messages/", payload);
      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Users
  getUsers: async () => {
    try {
      const response = await chatApi.get("/users/");
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },
};

export default chatAPI;