// services/chatHistory.js
import axios from 'axios';

const API_BASE_URL = 'http://119.148.51.38:8000';

// Create axios instance with default config
const chatApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
chatApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log('Token added to request');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
chatApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      if (error.response.status === 401) {
        console.error('Unauthorized access - clearing token');
        localStorage.removeItem('token');
      }
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return Promise.reject(error);
  }
);

export const chatService = {
  // Conversations
  getConversations: async () => {
    try {
      console.log('Fetching conversations from:', `${API_BASE_URL}/api/chat-history/conversations/`);
      const response = await chatApi.get('/api/chat-history/conversations/');
      console.log('Conversations response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getConversations:', error);
      throw error;
    }
  },

  createConversation: async () => {
    try {
      console.log('Creating conversation at:', `${API_BASE_URL}/api/chat-history/conversations/create/`);
      const response = await chatApi.post('/api/chat-history/conversations/create/', {});
      return response.data;
    } catch (error) {
      console.error('Error in createConversation:', error);
      throw error;
    }
  },

  getConversation: async (conversationId) => {
    try {
      console.log('Fetching conversation:', `${API_BASE_URL}/api/chat-history/conversations/${conversationId}/`);
      const response = await chatApi.get(`/api/chat-history/conversations/${conversationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw error;
    }
  },

  updateConversation: async (conversationId, data) => {
    try {
      console.log('Updating conversation:', `${API_BASE_URL}/api/chat-history/conversations/${conversationId}/update/`);
      const response = await chatApi.put(`/api/chat-history/conversations/${conversationId}/update/`, data);
      return response.data;
    } catch (error) {
      console.error('Error in updateConversation:', error);
      throw error;
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      console.log('Deleting conversation:', `${API_BASE_URL}/api/chat-history/conversations/${conversationId}/delete/`);
      const response = await chatApi.delete(`/api/chat-history/conversations/${conversationId}/delete/`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteConversation:', error);
      throw error;
    }
  },

  // Messages
  getConversationMessages: async (conversationId) => {
    try {
      console.log('Fetching messages:', `${API_BASE_URL}/api/chat-history/conversations/${conversationId}/messages/`);
      const response = await chatApi.get(`/api/chat-history/conversations/${conversationId}/messages/`);
      return response.data;
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw error;
    }
  },

  // MAIN CHAT ENDPOINT - Use this for all AI conversations
  sendMessage: async (message, conversationId = null) => {
    try {
      const url = '/api/chat-history/message/';
      console.log('Sending message to:', `${API_BASE_URL}${url}`);
      
      const payload = { message: message };
      if (conversationId) {
        payload.conversation_id = conversationId;
      }
      
      console.log('Request payload:', payload);
      
      const response = await chatApi.post(url, payload);
      
      console.log('Send message response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      if (error.response) {
        console.error('Server error details:', error.response.data);
      }
      throw error;
    }
  },

  // Only use this for manual message addition (not for AI chat)
  addManualMessage: async (conversationId, message, role = 'user') => {
    try {
      console.log('Adding manual message to conversation:', `${API_BASE_URL}/api/chat-history/conversations/${conversationId}/messages/add/`);
      const response = await chatApi.post(`/api/chat-history/conversations/${conversationId}/messages/add/`, {
        content: message,
        role: role
      });
      return response.data;
    } catch (error) {
      console.error('Error in addManualMessage:', error);
      throw error;
    }
  }
};

export default chatService;