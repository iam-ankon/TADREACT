// stationery.js - FIXED Stationery Management API Service
import axios from "axios";

// API Configuration
const API_BASE = "http://119.148.51.38:8000/api/hrms/api/";

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  };

  // Only add CSRF token if it exists
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  return headers;
};

// Helper function to get CSRF token
const getCSRFToken = () => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1] || ""
  );
};

// DEBUG FUNCTION: Log API calls
const debugLog = (operation, url, params = {}, data = null) => {
  console.log(`🔍 ${operation}:`, {
    url,
    params,
    data,
    timestamp: new Date().toISOString(),
  });
};

const fetchAllPages = async (url, params = {}) => {
  let allData = [];
  let next = url;
  let page = 1;

  while (next) {
    console.log(`Fetching page ${page} → ${next}`);
    const response = await axios.get(next, {
      headers: getAuthHeaders(),
      params: next === url ? { ...params, _t: Date.now() } : undefined,
    });

    let pageData =
      response.data?.results ||
      response.data?.data ||
      response.data?.stationery_usage ||
      (Array.isArray(response.data) ? response.data : []);

    allData = [...allData, ...pageData];

    next = response.data?.next || null;
    page++;
  }

  console.log(`Total fetched: ${allData.length} records`);
  return allData;
};

// Stationery API functions - FIXED WITH PAGINATION HANDLING
export const stationeryAPI = {
  // ========== ITEMS ==========
  fetchItems: async () => {
    return fetchAllPages(`${API_BASE}stationery_items/`);
  },

  addItem: async (itemData) => {
    try {
      debugLog("Add item", `${API_BASE}stationery_items/`, {}, itemData);
      const response = await axios.post(
        `${API_BASE}stationery_items/`,
        itemData,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error adding stationery item:", error);
      throw error;
    }
  },

  updateItem: async (itemId, itemData) => {
    try {
      debugLog(
        "Update item",
        `${API_BASE}stationery_items/${itemId}/`,
        {},
        itemData,
      );
      const response = await axios.put(
        `${API_BASE}stationery_items/${itemId}/`,
        itemData,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error updating stationery item:", error);
      throw error;
    }
  },

  // ADD THIS NEW METHOD
  deleteItem: async (itemId) => {
    try {
      debugLog("Delete item", `${API_BASE}stationery_items/${itemId}/`);
      const response = await axios.delete(
        `${API_BASE}stationery_items/${itemId}/`,
        { headers: getAuthHeaders() },
      );
      console.log("✅ Item deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error deleting stationery item:", error);
      throw error;
    }
  },

  // ========== USAGE ==========
  fetchUsage: async (employeeId = null) => {
    console.log(
      employeeId
        ? `🔍 Fetching usage for employee ${employeeId}`
        : "🔍 Fetching ALL usage (admin mode)",
    );

    const params = employeeId ? { employee: employeeId } : {};

    try {
      const response = await axios.get(`${API_BASE}stationery_usage/`, {
        headers: getAuthHeaders(),
        params: params,
      });

      console.log("📥 API Response:", {
        url: `${API_BASE}stationery_usage/`,
        status: response.status,
        dataCount: Array.isArray(response.data)
          ? response.data.length
          : response.data.results
            ? response.data.results.length
            : 0,
        dataSample: Array.isArray(response.data)
          ? response.data.slice(0, 3)
          : response.data.results
            ? response.data.results.slice(0, 3)
            : response.data,
      });

      const data = response.data.results || response.data || [];

      // Debug each record
      data.forEach((record, index) => {
        console.log(`📝 Record ${index + 1}:`, {
          id: record.id,
          employee: record.employee,
          employee_object: record.employee,
          stationery_item: record.stationery_item,
          item_object: record.stationery_item,
          quantity: record.quantity,
          purpose: record.purpose,
          status: record.status,
        });
      });

      return data;
    } catch (error) {
      console.error("❌ Error fetching usage:", error);
      throw error;
    }
  },

  addUsage: async (usageData) => {
    try {
      debugLog("Add usage", `${API_BASE}stationery_usage/`, {}, usageData);
      const response = await axios.post(
        `${API_BASE}stationery_usage/`,
        usageData,
        { headers: getAuthHeaders() },
      );
      console.log("✅ Usage added:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding usage request:", error);
      throw error;
    }
  },

  approveUsage: async (usageId) => {
    try {
      debugLog(
        "Approve usage",
        `${API_BASE}stationery_usage/${usageId}/approve_request/`,
      );
      const response = await axios.post(
        `${API_BASE}stationery_usage/${usageId}/approve_request/`,
        {},
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error approving usage request:", error);
      throw error;
    }
  },

  issueUsage: async (usageId) => {
    try {
      debugLog(
        "Issue usage",
        `${API_BASE}stationery_usage/${usageId}/issue_item/`,
      );
      const response = await axios.post(
        `${API_BASE}stationery_usage/${usageId}/issue_item/`,
        {},
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error issuing stationery item:", error);
      throw error;
    }
  },

  // ========== TRANSACTIONS ==========
  fetchTransactions: async () => {
    return fetchAllPages(`${API_BASE}stationery_transactions/`);
  },

  addTransaction: async (transactionData) => {
    try {
      debugLog(
        "Add transaction",
        `${API_BASE}stationery_transactions/`,
        {},
        transactionData,
      );
      const response = await axios.post(
        `${API_BASE}stationery_transactions/`,
        transactionData,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  },

  // ========== EMPLOYEES ==========
  fetchEmployees: async () => {
    return fetchAllPages(`${API_BASE}employees/`);
  },

  // ========== DEBUG ENDPOINTS ==========
  debugStationeryData: async () => {
    try {
      const response = await axios.get(`${API_BASE}debug_stationery_data/`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error debugging stationery data:", error);
      throw error;
    }
  },

  debugStationeryUsage: async () => {
    try {
      const response = await axios.get(`${API_BASE}debug_stationery_usage/`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error debugging stationery usage:", error);
      throw error;
    }
  },

  forceRefreshUsage: async () => {
    return stationeryAPI.fetchUsage(); // admin mode
  },
};

// Helper functions
export const getStockStatus = (item) => {
  if (!item) return { color: "#9ca3af", label: "Unknown", bg: "#f3f4f6" };

  if (item.current_stock <= 0) {
    return { color: "#ef4444", label: "Out of Stock", bg: "#fef2f2" };
  } else if (item.current_stock <= item.reorder_level) {
    return { color: "#f97316", label: "Low Stock", bg: "#fff7ed" };
  } else {
    return { color: "#10b981", label: "In Stock", bg: "#f0fdf4" };
  }
};

export const getTransactionColor = (type) => {
  const colors = {
    issue: "#3b82f6",
    order: "#10b981",
    return: "#8b5cf6",
    adjust: "#f59e0b",
    damage: "#ef4444",
  };
  return colors[type] || "#6b7280";
};

export const getTransactionLabel = (type) => {
  const labels = {
    issue: "Issue",
    order: "Order",
    return: "Return",
    adjust: "Adjust",
    damage: "Damage",
  };
  return labels[type] || type;
};

export default stationeryAPI;
