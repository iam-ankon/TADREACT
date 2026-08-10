// services/merchandiser.js

import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  1.  CONFIGURATION & TOKEN HELPERS                                         */
/* -------------------------------------------------------------------------- */

export const getBackendURL = () => {
  // In development (Vite with proxy), use empty string for relative paths
  // if (import.meta.env.DEV) {
  //   return '';
  // }
  // In production, use the full URL
  return "http://119.148.51.38:8000";
};

const getMerchandiserBaseUrl = () => {
  if (import.meta.env.DEV) {
    return "/api/merchandiser/api/";
  }
  return `${getBackendURL()}/api/merchandiser/api/`;
};

// CSR API base URL - using relative path for proxy
let csrBaseUrl = "/api/csr/api/";

/* Token handling – enhanced with validation */
export const getToken = () => {
  const token = localStorage.getItem("token");

  if (token && token.length < 10) {
    console.warn("⚠️ Token seems too short, might be invalid");
  }

  return token;
};

export const setToken = (token) => {
  if (!token) {
    console.warn("Attempting to set empty token");
    return;
  }

  localStorage.setItem("token", token);
  localStorage.setItem("token_timestamp", Date.now().toString());

  const storedToken = localStorage.getItem("token");
};

export const removeToken = () => {
  const keys = [
    "token",
    "username",
    "user_id",
    "employee_id",
    "employee_name",
    "designation",
    "permissions",
    "mode",
    "token_timestamp",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
};

/* -------------------------------------------------------------------------- */
/*  2.  AXIOS INSTANCE (authenticated)                                        */
/* -------------------------------------------------------------------------- */

export const debugAuthToken = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  return { hasToken: !!token, username };
};

const createInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 45000,
    withCredentials: false,
  });

  instance.interceptors.request.use(async (cfg) => {
    // Always get fresh token from localStorage
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (token) {
      cfg.headers.Authorization = `Token ${token}`;
    } else {
      console.warn("⚠️ No auth token found!");
    }

    // Also add user info in header for debugging
    if (username) {
      cfg.headers["X-Username"] = username;
    }

    return cfg;
  });

  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      console.error(`❌ API Error:`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });

      if (error.response?.status === 401) {
        console.error("🔒 Unauthenticated – logging out");
        removeToken();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
  return instance;
};

export const merchandiserApi = createInstance(getMerchandiserBaseUrl());

// Create CSR API instance with relative path
export let csrApi = createInstance(csrBaseUrl);

// Function to discover and set the correct CSR API base URL
export const discoverCSRApiBaseUrl = async () => {
  const token = localStorage.getItem("token");

  // Try these endpoints in order
  const possibleEndpoints = [`/api/csr/api/supplier/`];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: token ? `Token ${token}` : "",
        },
      });

      if (response.ok) {
        // Check if response is actually JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const baseEndpoint = endpoint.replace("supplier/", "");
          csrBaseUrl = baseEndpoint;
          csrApi = createInstance(csrBaseUrl);
          return csrBaseUrl;
        } else {
        }
      } else {
      }
    } catch (err) {}
  }

  console.warn("⚠️ Could not find CSR API endpoint, using default");
  return csrBaseUrl;
};

// Call discovery on module load
discoverCSRApiBaseUrl();

/* -------------------------------------------------------------------------- */
/*  3.  HELPER FUNCTIONS                                                      */
/* -------------------------------------------------------------------------- */
const extractDataFromResponse = (response) => {
  if (!response || !response.data) return [];

  if (response.data.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (response.data && typeof response.data === "object") {
    return [response.data];
  }
  return [];
};

export const fetchAllPaginatedData = async (apiFunction, params = {}) => {
  let allData = [];
  let page = 1;
  let hasMore = true;
  const pageSize = 100;

  while (hasMore) {
    try {
      const response = await apiFunction(page, pageSize, params);

      if (response.data && response.data.length > 0) {
        allData = [...allData, ...response.data];
        if (response.pagination && response.pagination.next) {
          page++;
        } else if (response.data.length === pageSize) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }
  return allData;
};

/* -------------------------------------------------------------------------- */
/*  4.  AUTHENTICATION                                                        */
/* -------------------------------------------------------------------------- */
export const loginUser = async (payload) => {
  const { username, password } = payload;

  const resp = await fetch(`${getBackendURL()}/users/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username?.trim(),
      password: password?.trim(),
    }),
  });

  if (!resp.ok) {
    let msg = "Login failed";
    try {
      const e = await resp.json();
      msg = e.error || e.detail || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();

  if (!data.token) {
    throw new Error("No token received from server");
  }

  setToken(data.token);

  const store = (k, v) => {
    if (v !== undefined && v !== null && v !== "") {
      localStorage.setItem(k, v.toString());
    } else {
      localStorage.removeItem(k);
    }
  };

  store("username", data.username);
  store("user_id", data.user_id);
  store("employee_id", data.employee_id);
  store("employee_name", data.employee_name);
  store("designation", data.designation);
  store("department", data.department);
  store("email", data.email || data.username);
  store("mode", data.mode || "restricted");
  store("permissions", JSON.stringify(data.permissions || {}));

  return data;
};

export const debugAuth = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  return {
    token: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : null,
    username,
  };
};

export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token)
      return {
        authenticated: false,
        error: "No token found",
        tokenExists: false,
      };
    const response = await merchandiserApi.get("orders/?page=1&page_size=1");
    return { authenticated: true, status: response.status, tokenExists: true };
  } catch (error) {
    return {
      authenticated: false,
      error: error.response?.data || error.message,
      tokenExists: !!localStorage.getItem("token"),
      status: error.response?.status,
    };
  }
};

/* -------------------------------------------------------------------------- */
/*  5.  ORDER APIs                                                            */
/* -------------------------------------------------------------------------- */

export const getOrderById = (id) => merchandiserApi.get(`orders/${id}/`);
export const createOrder = (data) => merchandiserApi.post("orders/", data);
export const updateOrder = (id, data) =>
  merchandiserApi.put(`orders/${id}/`, data);
export const patchOrder = (id, data) =>
  merchandiserApi.patch(`orders/${id}/`, data);
export const deleteOrder = (id) => merchandiserApi.delete(`orders/${id}/`);
export const getOrderStats = () => merchandiserApi.get("orders/stats/");

const pendingRequests = new Map();

async function deduplicateRequest(key, requestFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

export const getOrderStatsWithFilters = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== null &&
        filters[key] !== undefined &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    const url = `orders/stats/${params.toString() ? `?${params.toString()}` : ""}`;
    const cacheKey = `stats_${params.toString()}`;

    return await deduplicateRequest(cacheKey, async () => {
      const response = await merchandiserApi.get(url);
      return response.data;
    });
  } catch (error) {
    console.error("❌ Error fetching order stats:", error);
    return {
      total_orders: 0,
      total_value: 0,
      total_quantity: 0,
      avg_price_per_unit: 0,
      garment_stats: {
        knit: {
          total_orders: 0,
          total_quantity: 0,
          total_value: 0,
          avg_price: 0,
        },
        woven: {
          total_orders: 0,
          total_quantity: 0,
          total_value: 0,
          avg_price: 0,
        },
        sweater: {
          total_orders: 0,
          total_quantity: 0,
          total_value: 0,
          avg_price: 0,
        },
        underwear: {
          total_orders: 0,
          total_quantity: 0,
          total_value: 0,
          avg_price: 0,
        },
        other: {
          total_orders: 0,
          total_quantity: 0,
          total_value: 0,
          avg_price: 0,
        },
      },
    };
  }
};

export const getOrders = async (page = 1, pageSize = 100, options = {}) => {
  try {
    let filters = {};

    if (typeof options === "object") {
      filters = options.filters || {};
    }

    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);

    // Add all filters
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null" &&
        value !== "undefined"
      ) {
        params.append(key, value);
      }
    });

    const response = await merchandiserApi.get(`orders/?${params.toString()}`);

    if (
      response.data &&
      response.data.results &&
      Array.isArray(response.data.results)
    ) {
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    }

    if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          count: response.data.length,
          current_page: page,
          page_size: pageSize,
          total_pages: 1,
        },
      };
    }

    return {
      data: [],
      pagination: {
        count: 0,
        current_page: page,
        page_size: pageSize,
        total_pages: 1,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return {
      data: [],
      pagination: {
        count: 0,
        current_page: page,
        page_size: pageSize,
        total_pages: 1,
      },
      error: error.response?.data || error.message,
    };
  }
};

export const getGarmentOptions = async () => {
  try {
    const response = await merchandiserApi.get("orders/garment-options/");
    return response.data;
  } catch (error) {
    console.error("Error fetching garment options:", error);
    return ["Knit", "Woven", "Sweater", "Underwear"];
  }
};

export const exportOrderToExcel = async (orderId) => {
  try {
    const response = await merchandiserApi.get(
      `orders/${orderId}/export-excel/`,
      { responseType: "blob" },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const contentDisposition = response.headers["content-disposition"];
    let filename = `order_${orderId}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^*]=["']?([^"']+)["']?/,
      );
      if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
    }
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
  } catch (error) {
    console.error("❌ Error exporting order to Excel:", error);
    throw error;
  }
};

export const exportOrdersToExcel = async (orderIds) => {
  try {
    const response = await merchandiserApi.post(
      "orders/export-excel-bulk/",
      { order_ids: orderIds },
      { responseType: "blob" },
    );
    return response;
  } catch (error) {
    console.error("❌ Error exporting orders to Excel:", error);
    throw error;
  }
};

/**
 * Export ALL orders matching the current filters as a fast flat Excel sheet.
 * Uses a 5-minute timeout (override the global 45s) for large exports.
 */
export const exportOrdersToExcelFiltered = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null" &&
        value !== "undefined"
      ) {
        params.append(key, value);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : "";
    // Pass timeout in the per-request config — overrides the instance default
    const response = await merchandiserApi.get(
      `orders/export-excel-filtered/${qs}`,
      { responseType: "blob", timeout: 300000 },
    );
    return response;
  } catch (error) {
    console.error("❌ Error exporting filtered orders to Excel:", error);
    throw error;
  }
};

export const uploadOrderFiles = async (orderId, formData) => {
  try {
    const response = await merchandiserApi.post(
      `orders/${orderId}/upload-files/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

export const deleteOrderFile = async (orderId, filePath, fileType) => {
  try {
    const fileName = filePath.split("/").pop();
    let sendData = {
      file_path: filePath,
      file_type: fileType,
      file_name: fileName,
    };
    if (filePath.startsWith("/media/"))
      sendData.file_path = filePath.replace("/media/", "");
    try {
      const response = await merchandiserApi({
        method: "delete",
        url: `orders/${orderId}/delete-file/`,
        data: sendData,
      });
      return response;
    } catch (deleteError) {
      const response = await merchandiserApi({
        method: "post",
        url: `orders/${orderId}/delete-file/`,
        data: sendData,
      });
      return response;
    }
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    throw error;
  }
};

export const getOrderFiles = async (orderId) => {
  try {
    const response = await merchandiserApi.get(`orders/${orderId}/`);
    return {
      data: {
        attachments: response.data.multiple_attachments || [],
        images: response.data.multiple_images || [],
      },
    };
  } catch (error) {
    console.error("Error fetching order files:", error);
    return { data: { attachments: [], images: [] } };
  }
};

export const renameOrderFile = async (orderId, filePath, fileType, newName) => {
  try {
    const response = await merchandiserApi.post(
      `orders/${orderId}/rename-file/`,
      { file_path: filePath, file_type: fileType, new_name: newName },
    );
    return response;
  } catch (error) {
    console.error("❌ Error renaming file:", error);
    throw error;
  }
};

// Add this to merchandiser.js

/**
 * Get commission statistics from ALL orders with filters
 * This is a single API call that returns aggregated data
 * Much faster than fetching all orders page by page
 */
export const getCommissionStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== null &&
        filters[key] !== undefined &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    const url = `orders/commission-stats/${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await merchandiserApi.get(url);
    return response.data;
  } catch (error) {
    return {
      total_est: 0,
      total_act: 0,
      orders_with_commission: 0,
      available_months: ["All"],
      available_years: ["All"],
      chart_data: [],
    };
  }
};

// Add to merchandiser.js after the other API functions

/* -------------------------------------------------------------------------- */
/*  24. TNA (Time & Action) APIs                                              */
/* -------------------------------------------------------------------------- */

export const getTNA = async (
  page = 1,
  pageSize = 100,
  allPages = false,
  filters = {},
) => {
  try {
    if (allPages) {
      // Fetch all pages
      let allTNA = [];
      let currentPage = 1;
      let hasMore = true;
      let maxPages = 50; // Safety limit

      while (hasMore && currentPage <= maxPages) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });

        const response = await merchandiserApi.get(`tna/?${params.toString()}`);

        if (response.data && response.data.results) {
          allTNA = [...allTNA, ...response.data.results];
          hasMore = response.data.next !== null;
          currentPage++;
        } else if (Array.isArray(response.data)) {
          allTNA = [...allTNA, ...response.data];
          hasMore = false;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allTNA,
        pagination: {
          count: allTNA.length,
          total_pages: currentPage - 1,
        },
      };
    }

    // Single page request
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters,
    });

    const response = await merchandiserApi.get(`tna/?${params.toString()}`);

    if (response.data && response.data.results) {
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    }

    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          count: response.data.length,
          current_page: page,
          page_size: pageSize,
          total_pages: 1,
        },
      };
    }

    return { data: [], pagination: { count: 0 } };
  } catch (error) {
    console.error("❌ Error fetching TNA:", error);
    return {
      data: [],
      pagination: { count: 0 },
      error: error.response?.data || error.message,
    };
  }
};

export const getTNAById = (id) => merchandiserApi.get(`tna/${id}/`);
export const createTNA = (data) => merchandiserApi.post("tna/", data);
export const updateTNA = (id, data) => merchandiserApi.put(`tna/${id}/`, data);
export const patchTNA = (id, data) => merchandiserApi.patch(`tna/${id}/`, data);
export const deleteTNA = (id) => merchandiserApi.delete(`tna/${id}/`);
export const getTNAStats = () => merchandiserApi.get("tna/stats/");
export const getTNAByOrder = (orderId) =>
  merchandiserApi.get(`tna/by-order/${orderId}/`);
export const syncTNAFromOrder = (orderId) =>
  merchandiserApi.post(`tna/sync-from-order/${orderId}/`);

/* -------------------------------------------------------------------------- */
/*  6.  ORDER CHART APIs                                                      */
/* -------------------------------------------------------------------------- */
export const getOrderMonthlyData = async (years = "all", customerId = null) => {
  try {
    const params = new URLSearchParams();
    if (years !== "all" && years) {
      if (Array.isArray(years)) params.append("year", years.join("|"));
      else params.append("year", years);
    }
    if (customerId && customerId !== "all" && customerId !== null) {
      params.append("customer", customerId);
    }
    const response = await merchandiserApi.get(
      `orders/monthly-data/${params.toString() ? `?${params.toString()}` : ""}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching order monthly data:", error);
    return {
      success: false,
      data: {
        months: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        quantities: Array(12).fill(0),
        values: Array(12).fill(0),
        counts: Array(12).fill(0),
        availableYears: [],
        customers: [],
      },
    };
  }
};

export const getOrderYearlyData = async (years = "all", customerId = null) => {
  try {
    const params = new URLSearchParams();
    if (years !== "all" && years) {
      if (Array.isArray(years)) params.append("years", years.join("|"));
      else params.append("years", years);
    }
    if (customerId && customerId !== "all" && customerId !== null) {
      params.append("customer", customerId);
    }
    const response = await merchandiserApi.get(
      `orders/yearly-data/${params.toString() ? `?${params.toString()}` : ""}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching order yearly data:", error);
    return {
      success: false,
      data: {
        years: [],
        quantities: [],
        values: [],
        counts: [],
        customers: [],
        availableYears: [],
      },
    };
  }
};

export const getGarmentAnalysis = async (years = "all", customerId = null) => {
  try {
    const params = new URLSearchParams();
    if (years !== "all" && years) {
      if (Array.isArray(years)) params.append("years", years.join("|"));
      else params.append("years", years);
    }
    if (customerId && customerId !== "all" && customerId !== null) {
      params.append("customer", customerId);
    }
    const response = await merchandiserApi.get(
      `orders/garment-analysis/${params.toString() ? `?${params.toString()}` : ""}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching garment analysis:", error);
    return {
      success: false,
      data: {
        garments: ["knit", "woven", "sweater", "underwear", "other"],
        quantities: [0, 0, 0, 0, 0],
        values: [0, 0, 0, 0, 0],
        counts: [0, 0, 0, 0, 0],
        avg_unit_prices: [0, 0, 0, 0, 0],
        availableYears: [],
        customers: [],
      },
    };
  }
};

export const getGarmentCustomerComparison = async (
  years = "all",
  customerIds = null,
) => {
  try {
    const params = new URLSearchParams();

    if (years !== "all" && years && years !== "null" && years !== "undefined") {
      if (Array.isArray(years)) {
        params.append("years", years.join("|"));
      } else {
        params.append("years", years);
      }
    }

    if (
      customerIds &&
      customerIds !== "all" &&
      customerIds !== null &&
      customerIds !== "null" &&
      customerIds !== "undefined"
    ) {
      if (Array.isArray(customerIds) && customerIds.length > 0) {
        const filteredIds = customerIds.filter((id) => id !== "all");
        if (filteredIds.length > 0) {
          const customerParam = filteredIds.join("|");
          params.append("customers", customerParam);
        }
      } else if (
        typeof customerIds === "string" &&
        customerIds !== "all" &&
        customerIds !== "null"
      ) {
        params.append("customers", customerIds);
      }
    }

    const url = `orders/garment-customer-comparison/${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await merchandiserApi.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching garment customer comparison:", error);
    return {
      success: false,
      data: {
        garments: [],
        customers: [],
        data: [],
        availableYears: [],
      },
    };
  }
};

export const getCustomerData = async (year = "all", customerIds = null) => {
  try {
    const params = new URLSearchParams();
    if (year !== "all" && year) params.append("year", year);
    if (
      customerIds &&
      customerIds !== "all" &&
      customerIds !== null &&
      customerIds.length > 0
    ) {
      const customerParam = Array.isArray(customerIds)
        ? customerIds.join("|")
        : customerIds;
      params.append("customer", customerParam);
    }
    const response = await merchandiserApi.get(
      `orders/customer-data/${params.toString() ? `?${params.toString()}` : ""}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return {
      success: false,
      data: {
        customers: [],
        quantities: [],
        values: [],
        counts: [],
        availableYears: [],
      },
    };
  }
};

/* -------------------------------------------------------------------------- */
/*  7.  SUPPLIER APIs - FIXED VERSION                                         */
/* -------------------------------------------------------------------------- */

export const getSuppliers = async (page = 1, pageSize = 100, options = {}) => {
  try {
    let allPages = false;
    let filters = {};

    // Parse options parameter
    if (typeof options === "boolean") {
      allPages = options;
    } else if (typeof options === "object") {
      allPages = options.allPages || false;
      filters = options.filters || {};
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);

    // Add search filter if provided
    if (filters.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    // Add other filters
    Object.keys(filters).forEach((key) => {
      if (
        key !== "search" &&
        filters[key] !== null &&
        filters[key] !== undefined &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    // Build the endpoint URL
    const endpoint = `supplier/?${params.toString()}`;

    // Make the API call
    const response = await csrApi.get(endpoint);

    // Check if response is HTML (error - proxy not working)
    if (
      typeof response.data === "string" &&
      response.data.includes("<!doctype html>")
    ) {
      console.error(
        "❌ Received HTML instead of JSON - proxy not working correctly",
      );
      console.error(
        "This means your Vite proxy is not configured or not working",
      );
      console.error("Check your vite.config.js and restart the dev server");

      // Return empty array instead of throwing to prevent UI crash
      return {
        data: [],
        pagination: {
          count: 0,
          current_page: page,
          page_size: pageSize,
          total_pages: 1,
        },
      };
    }

    // Parse the response - handle multiple possible formats
    let suppliersData = [];
    let totalCount = 0;

    if (
      response.data &&
      response.data.results &&
      Array.isArray(response.data.results)
    ) {
      suppliersData = response.data.results;
      totalCount = response.data.count || suppliersData.length;
    } else if (Array.isArray(response.data)) {
      suppliersData = response.data;
      totalCount = suppliersData.length;
    } else if (
      response.data &&
      typeof response.data === "object" &&
      response.data.id
    ) {
      suppliersData = [response.data];
      totalCount = 1;
    } else {
      console.warn("⚠️ Unknown response format:", response.data);
      suppliersData = [];
      totalCount = 0;
    }

    // Transform supplier data to consistent format
    const transformedSuppliers = suppliersData.map((supplier) => {
      const id = supplier.id || supplier.pk;
      const name =
        supplier.supplier_name ||
        supplier.name ||
        supplier.display_name ||
        `Supplier ${id}`;
      return {
        id: id,
        name: name,
        display_name: name,
        supplier_name: name,
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      };
    });

    return {
      data: transformedSuppliers,
      pagination: {
        count: totalCount,
        current_page: page,
        page_size: pageSize,
        total_pages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error("❌ Error in getSuppliers:", error);
    console.error("Error details:", error.response?.data || error.message);

    // Return empty data instead of throwing error
    return {
      data: [],
      pagination: {
        count: 0,
        current_page: page,
        page_size: pageSize,
        total_pages: 1,
      },
      error: error.response?.data || error.message,
    };
  }
};

// Function to get a single supplier by ID
export const getSupplierById = async (id) => {
  try {
    const endpoint = `supplier/${id}/`;

    const response = await csrApi.get(endpoint);

    if (response && response.data) {
      return response;
    }

    throw new Error(`Supplier with ID ${id} not found`);
  } catch (error) {
    console.error(`❌ Error fetching supplier ${id}:`, error);
    throw error;
  }
};

export const createSupplier = async (formData) => {
  try {
    return await csrApi.post("supplier/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw error;
  }
};

export const updateSupplier = async (id, formData) => {
  try {
    return await csrApi.put(`supplier/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw error;
  }
};

export const patchSupplier = async (id, data) => {
  try {
    return await csrApi.patch(`supplier/${id}/`, data);
  } catch (error) {
    console.error("Error patching supplier:", error);
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    return await csrApi.delete(`supplier/${id}/`);
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
};

export const sendExpiryNotifications = (supplierId, data) =>
  csrApi.post(`suppliers/${supplierId}/send-expiry-notifications/`, data);
export const getDashboardExpirySummary = () =>
  csrApi.get("suppliers/dashboard_expiry_summary/");
export const sendBulkReminders = (data) =>
  csrApi.post("suppliers/send-bulk-reminders/", data);
export const recalculateAllDays = () =>
  csrApi.post("suppliers/recalculate-all-days/");
export const deleteBuildingImage = (supplierId, imageUrl) =>
  csrApi.delete(`suppliers/${supplierId}/delete-building-image/`, {
    data: { image_url: imageUrl },
  });

/* -------------------------------------------------------------------------- */
/*  8.  INQUIRY APIs                                                          */
/* -------------------------------------------------------------------------- */
export const getInquiries = async (page = 1, pageSize = 100, options = {}) => {
  try {
    let allPages = false;
    let filters = {};
    if (typeof options === "boolean") allPages = options;
    else if (typeof options === "object") {
      allPages = options.allPages || false;
      filters = options.filters || {};
    }
    if (allPages) {
      let allInquiries = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });
        const response = await merchandiserApi.get(
          `inquiry/?${params.toString()}`,
        );
        if (response.data && response.data.results) {
          allInquiries = [...allInquiries, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allInquiries = [...allInquiries, ...data];
          hasMore = false;
        }
      }
      return { data: allInquiries, pagination: { count: allInquiries.length } };
    }
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters,
    });
    const response = await merchandiserApi.get(`inquiry/?${params.toString()}`);
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching inquiries:", error);
    return { data: [] };
  }
};

export const getInquiryById = (id) => merchandiserApi.get(`inquiry/${id}/`);
export const createInquiry = (formData) =>
  merchandiserApi.post("inquiry/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateInquiry = (id, formData) =>
  merchandiserApi.put(`inquiry/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteInquiry = (id) => merchandiserApi.delete(`inquiry/${id}/`);
export const sendInquiryEmail = (inquiryId, emailData) =>
  merchandiserApi.post(`inquiries/${inquiryId}/send-email/`, emailData);
export const sendBulkInquiryEmail = (inquiryId, emailData) =>
  merchandiserApi.post(`send-inquiry-email/${inquiryId}/`, emailData);

/* -------------------------------------------------------------------------- */
/*  9.  CUSTOMER APIs                                                         */
/* -------------------------------------------------------------------------- */
export const getCustomers = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allCustomers = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `customer/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allCustomers = [...allCustomers, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allCustomers = [...allCustomers, ...data];
          hasMore = false;
        }
      }
      return { data: allCustomers, pagination: { count: allCustomers.length } };
    }
    const response = await merchandiserApi.get(
      `customer/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
    return { data: [] };
  }
};

export const getCustomerById = (id) => merchandiserApi.get(`customer/${id}/`);
export const createCustomer = (data) => merchandiserApi.post("customer/", data);
export const updateCustomer = (id, data) =>
  merchandiserApi.put(`customer/${id}/`, data);
export const patchCustomer = (id, data) =>
  merchandiserApi.patch(`customer/${id}/`, data);
export const deleteCustomer = (id) => merchandiserApi.delete(`customer/${id}/`);

/* -------------------------------------------------------------------------- */
/*  10. BUYER APIs                                                            */
/* -------------------------------------------------------------------------- */
export const getBuyers = async (page = 1, pageSize = 100, allPages = false) => {
  try {
    if (allPages) {
      let allBuyers = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `buyer/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allBuyers = [...allBuyers, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allBuyers = [...allBuyers, ...data];
          hasMore = false;
        }
      }
      return { data: allBuyers, pagination: { count: allBuyers.length } };
    }
    const response = await merchandiserApi.get(
      `buyer/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching buyers:", error);
    return { data: [] };
  }
};

export const getBuyerById = (id) => merchandiserApi.get(`buyer/${id}/`);
export const createBuyer = (data) => merchandiserApi.post("buyer/", data);
export const updateBuyer = (id, data) =>
  merchandiserApi.put(`buyer/${id}/`, data);
export const patchBuyer = (id, data) =>
  merchandiserApi.patch(`buyer/${id}/`, data);
export const deleteBuyer = (id) => merchandiserApi.delete(`buyer/${id}/`);

/* -------------------------------------------------------------------------- */
/*  11. AGENT APIs                                                            */
/* -------------------------------------------------------------------------- */
export const getAgents = async (page = 1, pageSize = 100, allPages = false) => {
  try {
    if (allPages) {
      let allAgents = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `agent/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allAgents = [...allAgents, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allAgents = [...allAgents, ...data];
          hasMore = false;
        }
      }
      return { data: allAgents, pagination: { count: allAgents.length } };
    }
    const response = await merchandiserApi.get(
      `agent/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching agents:", error);
    return { data: [] };
  }
};

export const getAgentById = (id) => merchandiserApi.get(`agent/${id}/`);
export const createAgent = (data) => merchandiserApi.post("agent/", data);
export const updateAgent = (id, data) =>
  merchandiserApi.put(`agent/${id}/`, data);
export const patchAgent = (id, data) =>
  merchandiserApi.patch(`agent/${id}/`, data);
export const deleteAgent = (id) => merchandiserApi.delete(`agent/${id}/`);

/* -------------------------------------------------------------------------- */
/*  12. STYLE APIs                                                            */
/* -------------------------------------------------------------------------- */
export const getStyles = async (page = 1, pageSize = 100, allPages = false) => {
  try {
    if (allPages) {
      let allStyles = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `style/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allStyles = [...allStyles, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allStyles = [...allStyles, ...data];
          hasMore = false;
        }
      }
      return { data: allStyles, pagination: { count: allStyles.length } };
    }
    const response = await merchandiserApi.get(
      `style/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching styles:", error);
    return { data: [] };
  }
};

export const getStyleById = (id) => merchandiserApi.get(`style/${id}/`);
export const createStyle = (data) => merchandiserApi.post("style/", data);
export const updateStyle = (id, data) =>
  merchandiserApi.put(`style/${id}/`, data);
export const deleteStyle = (id) => merchandiserApi.delete(`style/${id}/`);

/* -------------------------------------------------------------------------- */
/*  13. ITEM APIs                                                             */
/* -------------------------------------------------------------------------- */
export const getItems = async (page = 1, pageSize = 100, allPages = false) => {
  try {
    if (allPages) {
      let allItems = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `item/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allItems = [...allItems, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allItems = [...allItems, ...data];
          hasMore = false;
        }
      }
      return { data: allItems, pagination: { count: allItems.length } };
    }
    const response = await merchandiserApi.get(
      `item/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    return { data: [] };
  }
};

export const getItemById = (id) => merchandiserApi.get(`item/${id}/`);
export const createItem = (data) => merchandiserApi.post("item/", data);
export const updateItem = (id, data) =>
  merchandiserApi.put(`item/${id}/`, data);
export const deleteItem = (id) => merchandiserApi.delete(`item/${id}/`);

/* -------------------------------------------------------------------------- */
/*  14. FABRICATION APIs                                                      */
/* -------------------------------------------------------------------------- */
export const getFabrications = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allFabrications = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `fabrication/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allFabrications = [...allFabrications, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allFabrications = [...allFabrications, ...data];
          hasMore = false;
        }
      }
      return {
        data: allFabrications,
        pagination: { count: allFabrications.length },
      };
    }
    const response = await merchandiserApi.get(
      `fabrication/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching fabrications:", error);
    return { data: [] };
  }
};

export const getFabricationById = (id) =>
  merchandiserApi.get(`fabrication/${id}/`);
export const createFabrication = (data) =>
  merchandiserApi.post("fabrication/", data);
export const updateFabrication = (id, data) =>
  merchandiserApi.put(`fabrication/${id}/`, data);
export const deleteFabrication = (id) =>
  merchandiserApi.delete(`fabrication/${id}/`);

/* -------------------------------------------------------------------------- */
/*  15. REPEAT OF APIs                                                        */
/* -------------------------------------------------------------------------- */
export const getRepeatOfs = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allRepeatOfs = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `repeat_of/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allRepeatOfs = [...allRepeatOfs, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allRepeatOfs = [...allRepeatOfs, ...data];
          hasMore = false;
        }
      }
      return { data: allRepeatOfs, pagination: { count: allRepeatOfs.length } };
    }
    const response = await merchandiserApi.get(
      `repeat_of/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching repeat ofs:", error);
    return { data: [] };
  }
};

export const getRepeatOfById = (id) => merchandiserApi.get(`repeat_of/${id}/`);
export const createRepeatOf = (data) =>
  merchandiserApi.post("repeat_of/", data);
export const updateRepeatOf = (id, data) =>
  merchandiserApi.put(`repeat_of/${id}/`, data);
export const deleteRepeatOf = (id) =>
  merchandiserApi.delete(`repeat_of/${id}/`);

/* -------------------------------------------------------------------------- */
/*  16. NEGOTIATION APIs                                                      */
/* -------------------------------------------------------------------------- */
export const getNegotiations = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allNegotiations = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `negotiation/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allNegotiations = [...allNegotiations, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allNegotiations = [...allNegotiations, ...data];
          hasMore = false;
        }
      }
      return {
        data: allNegotiations,
        pagination: { count: allNegotiations.length },
      };
    }
    const response = await merchandiserApi.get(
      `negotiation/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching negotiations:", error);
    return { data: [] };
  }
};

export const getNegotiationById = (id) =>
  merchandiserApi.get(`negotiation/${id}/`);
export const createNegotiation = (data) =>
  merchandiserApi.post("negotiation/", data);
export const updateNegotiation = (id, data) =>
  merchandiserApi.put(`negotiation/${id}/`, data);
export const deleteNegotiation = (id) =>
  merchandiserApi.delete(`negotiation/${id}/`);
export const clearNegotiationHistory = (inquiryId) =>
  merchandiserApi.delete(`negotiation/clear-history/${inquiryId}/`);

/* -------------------------------------------------------------------------- */
/*  17. COLOR SIZE GROUP APIs                                                 */
/* -------------------------------------------------------------------------- */
export const getColorSizeGroups = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allGroups = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `color_size_group/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allGroups = [...allGroups, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allGroups = [...allGroups, ...data];
          hasMore = false;
        }
      }
      return { data: allGroups, pagination: { count: allGroups.length } };
    }
    const response = await merchandiserApi.get(
      `color_size_group/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching color size groups:", error);
    return { data: [] };
  }
};

export const getColorSizeGroupById = (id) =>
  merchandiserApi.get(`color_size_group/${id}/`);
export const createColorSizeGroup = (data) =>
  merchandiserApi.post("color_size_group/", data);
export const updateColorSizeGroup = (id, data) =>
  merchandiserApi.put(`color_size_group/${id}/`, data);
export const deleteColorSizeGroup = (id) =>
  merchandiserApi.delete(`color_size_group/${id}/`);

/* -------------------------------------------------------------------------- */
/*  18. SIZE QUANTITY APIs                                                    */
/* -------------------------------------------------------------------------- */
export const getSizeQuantities = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allQuantities = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `size_quantity/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allQuantities = [...allQuantities, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allQuantities = [...allQuantities, ...data];
          hasMore = false;
        }
      }
      return {
        data: allQuantities,
        pagination: { count: allQuantities.length },
      };
    }
    const response = await merchandiserApi.get(
      `size_quantity/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching size quantities:", error);
    return { data: [] };
  }
};

export const getSizeQuantityById = (id) =>
  merchandiserApi.get(`size_quantity/${id}/`);
export const createSizeQuantity = (data) =>
  merchandiserApi.post("size_quantity/", data);
export const updateSizeQuantity = (id, data) =>
  merchandiserApi.put(`size_quantity/${id}/`, data);
export const deleteSizeQuantity = (id) =>
  merchandiserApi.delete(`size_quantity/${id}/`);

/* -------------------------------------------------------------------------- */
/*  19. INQUIRY ATTACHMENT APIs                                               */
/* -------------------------------------------------------------------------- */
export const getInquiryAttachments = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allAttachments = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `inquiry_attachment/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allAttachments = [...allAttachments, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allAttachments = [...allAttachments, ...data];
          hasMore = false;
        }
      }
      return {
        data: allAttachments,
        pagination: { count: allAttachments.length },
      };
    }
    const response = await merchandiserApi.get(
      `inquiry_attachment/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching inquiry attachments:", error);
    return { data: [] };
  }
};

export const getInquiryAttachmentById = (id) =>
  merchandiserApi.get(`inquiry_attachment/${id}/`);
export const createInquiryAttachment = (formData) =>
  merchandiserApi.post("inquiry_attachment/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteInquiryAttachment = (id) =>
  merchandiserApi.delete(`inquiry_attachment/${id}/`);

/* -------------------------------------------------------------------------- */
/*  20. COLOR TOTAL APIs                                                      */
/* -------------------------------------------------------------------------- */
export const getColorTotals = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allTotals = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `color_total/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allTotals = [...allTotals, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) allTotals = [...allTotals, ...data];
          hasMore = false;
        }
      }
      return { data: allTotals, pagination: { count: allTotals.length } };
    }
    const response = await merchandiserApi.get(
      `color_total/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    return {
      data: extractDataFromResponse(response),
      pagination: { count: extractDataFromResponse(response).length },
    };
  } catch (error) {
    console.error("❌ Error fetching color totals:", error);
    return { data: [] };
  }
};

export const getColorTotalById = (id) =>
  merchandiserApi.get(`color_total/${id}/`);
export const createColorTotal = (data) =>
  merchandiserApi.post("color_total/", data);
export const updateColorTotal = (id, data) =>
  merchandiserApi.put(`color_total/${id}/`, data);
export const deleteColorTotal = (id) =>
  merchandiserApi.delete(`color_total/${id}/`);

/* -------------------------------------------------------------------------- */
/*  21. DEPARTMENT APIs                                                       */
/* -------------------------------------------------------------------------- */
export const getDepartments = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allDepartments = [];
      let currentPage = 1;
      let hasMore = true;
      while (hasMore) {
        const response = await merchandiserApi.get(
          `department/?page=${currentPage}&page_size=${pageSize}`,
        );
        if (response.data && response.data.results) {
          allDepartments = [...allDepartments, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else if (Array.isArray(response.data)) {
          allDepartments = [...allDepartments, ...response.data];
          hasMore = false;
        } else {
          hasMore = false;
        }
      }
      return {
        data: allDepartments,
        pagination: { count: allDepartments.length },
      };
    }
    const response = await merchandiserApi.get(
      `department/?page=${page}&page_size=${pageSize}`,
    );
    if (response.data && response.data.results)
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    if (Array.isArray(response.data))
      return {
        data: response.data,
        pagination: { count: response.data.length },
      };
    return { data: [], pagination: { count: 0 } };
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    return { data: [] };
  }
};

export const getDepartmentById = (id) =>
  merchandiserApi.get(`department/${id}/`);
export const createDepartment = (data) =>
  merchandiserApi.post("department/", data);
export const updateDepartment = (id, data) =>
  merchandiserApi.put(`department/${id}/`, data);
export const patchDepartment = (id, data) =>
  merchandiserApi.patch(`department/${id}/`, data);
export const deleteDepartment = (id) =>
  merchandiserApi.delete(`department/${id}/`);

/* -------------------------------------------------------------------------- */
/*  22. DASHBOARD APIs                                                        */
/* -------------------------------------------------------------------------- */
export const getDashboardData = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.year) queryParams.append("year", params.year);
  if (params.season) queryParams.append("season", params.season);
  const url = `dashboard/data/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  return merchandiserApi.get(url);
};

// services/merchandiser.js
// Add this section after the TNA APIs (around line 500-550)

// Add this to merchandiser.js - Check if it doesn't already exist

/**
 * Get courier bookings for a specific order (reverse lookup for the
 * Order detail page's Courier tab). Backed by the booking-items endpoint
 * filtered by order_id, since items - not bookings - carry the order link.
 */
export const getCourierBookingsByOrder = async (orderId) => {
  try {
    const response = await merchandiserApi.get(`courier-booking-items/?order_id=${orderId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching courier items for order:", error);
    return { results: [] };
  }
};


/* -------------------------------------------------------------------------- */
/*  25. COURIER MANAGEMENT APIs                                               */
/* -------------------------------------------------------------------------- */

export const getCourierBookings = async (
  page = 1,
  pageSize = 100,
  options = {},
) => {
  try {
    let allPages = false;
    let filters = {};

    if (typeof options === "boolean") {
      allPages = options;
    } else if (typeof options === "object") {
      allPages = options.allPages || false;
      filters = options.filters || {};
    }

    if (allPages) {
      let allBookings = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });

        const response = await merchandiserApi.get(
          `courier-bookings/?${params.toString()}`,
        );

        if (response.data && response.data.results) {
          allBookings = [...allBookings, ...response.data.results];
          hasMore = response.data.next !== null;
          currentPage++;
        } else if (Array.isArray(response.data)) {
          allBookings = [...allBookings, ...response.data];
          hasMore = false;
        } else {
          hasMore = false;
        }
      }

      return { data: allBookings, pagination: { count: allBookings.length } };
    }

    // Single page request
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters,
    });

    const response = await merchandiserApi.get(
      `courier-bookings/?${params.toString()}`,
    );

    if (response.data && response.data.results) {
      return {
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          current_page: page,
          page_size: pageSize,
          total_pages: Math.ceil(response.data.count / pageSize),
        },
      };
    }

    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: {
          count: response.data.length,
          current_page: page,
          page_size: pageSize,
          total_pages: 1,
        },
      };
    }

    return { data: [], pagination: { count: 0 } };
  } catch (error) {
    console.error("❌ Error fetching courier bookings:", error);
    return {
      data: [],
      pagination: { count: 0 },
      error: error.response?.data || error.message,
    };
  }
};

export const getCourierBookingById = (id) =>
  merchandiserApi.get(`courier-bookings/${id}/`);

export const createCourierBooking = (data) =>
  merchandiserApi.post("courier-bookings/", data);

export const updateCourierBooking = (id, data) =>
  merchandiserApi.put(`courier-bookings/${id}/`, data);

export const patchCourierBooking = (id, data) =>
  merchandiserApi.patch(`courier-bookings/${id}/`, data);

export const deleteCourierBooking = (id) =>
  merchandiserApi.delete(`courier-bookings/${id}/`);

export const getCourierBookingStats = () =>
  merchandiserApi.get("courier-bookings/stats/");

export const updateCourierBookingStatus = (id, data) =>
  merchandiserApi.post(`courier-bookings/${id}/update-status/`, data);

export const reopenCourierBooking = (id) =>
  merchandiserApi.post(`courier-bookings/${id}/reopen/`);

export const exportCourierBookings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "null" &&
        value !== "undefined"
      ) {
        params.append(key, value);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : "";

    const response = await merchandiserApi.get(
      `courier-bookings/export-excel/${qs}`,
      { responseType: "blob", timeout: 120000 },
    );
    return response;
  } catch (error) {
    console.error("❌ Error exporting courier bookings:", error);
    throw error;
  }
};

// Courier Stats with filters
export const getCourierStatsWithFilters = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== null &&
        filters[key] !== undefined &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    const url = `courier-bookings/stats/${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await merchandiserApi.get(url);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching courier stats:", error);
    return {
      total_bookings: 0,
      total_export: 0,
      total_import: 0,
      in_transit: 0,
      delivered: 0,
      by_courier: {},
    };
  }
};

// Get available courier names for dropdowns
export const getCourierNames = async () => {
  try {
    const response = await merchandiserApi.get(
      "courier-bookings/courier-names/",
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching courier names:", error);
    return ["DHL", "UPS", "FedEx"];
  }
};

// Get courier status options
export const getCourierStatusOptions = () => {
  return [
    { value: "booked", label: "Booked" },
    { value: "in_transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];
};

// Get shipment type options
export const getShipmentTypeOptions = () => {
  return [
    { value: "export", label: "Export" },
    { value: "import", label: "Import" },
  ];
};

/* -------------------------------------------------------------------------- */
/*  25b. COURIER BOOKING ITEM APIs (Shipment Details line items)             */
/* -------------------------------------------------------------------------- */

export const getCourierBookingItems = async (bookingId) => {
  try {
    const response = await merchandiserApi.get(`courier-booking-items/?booking=${bookingId}&page_size=500`);
    if (response.data && response.data.results) return response.data.results;
    if (Array.isArray(response.data)) return response.data;
    return [];
  } catch (error) {
    console.error("❌ Error fetching courier booking items:", error);
    return [];
  }
};

export const createCourierBookingItem = (data) =>
  merchandiserApi.post("courier-booking-items/", data);

export const updateCourierBookingItem = (id, data) =>
  merchandiserApi.put(`courier-booking-items/${id}/`, data);

export const patchCourierBookingItem = (id, data) =>
  merchandiserApi.patch(`courier-booking-items/${id}/`, data);

export const deleteCourierBookingItem = (id) =>
  merchandiserApi.delete(`courier-booking-items/${id}/`);

/* -------------------------------------------------------------------------- */
/*  25c. COURIER DOCUMENT APIs (booking-level "Upload File")                 */
/* -------------------------------------------------------------------------- */

export const getCourierDocuments = async (bookingId) => {
  try {
    const response = await merchandiserApi.get(`courier-documents/?booking=${bookingId}`);
    if (response.data && response.data.results) return response.data.results;
    if (Array.isArray(response.data)) return response.data;
    return [];
  } catch (error) {
    console.error("❌ Error fetching courier documents:", error);
    return [];
  }
};

export const uploadCourierDocument = (bookingId, file) => {
  const formData = new FormData();
  formData.append("booking", bookingId);
  formData.append("file", file);
  return merchandiserApi.post("courier-documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteCourierDocument = (id) =>
  merchandiserApi.delete(`courier-documents/${id}/`);

/* -------------------------------------------------------------------------- */
/*  25d. HS CODE / ARTICLE NO. AUTOCOMPLETE                                  */
/* -------------------------------------------------------------------------- */

export const searchCourierCodes = async (codeType, search = "") => {
  try {
    const params = new URLSearchParams({ code_type: codeType });
    if (search) params.append("search", search);
    const response = await merchandiserApi.get(`courier-codes/?${params.toString()}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("❌ Error fetching courier codes:", error);
    return [];
  }
};

/* -------------------------------------------------------------------------- */
/*  23. TEST APIs                                                             */
/* -------------------------------------------------------------------------- */
export const testMerchandiserEndpoint = () => merchandiserApi.get("orders/");

/* -------------------------------------------------------------------------- */
/*  EXPORT DEFAULT                                                            */
/* -------------------------------------------------------------------------- */
export default {
  merchandiserApi,
  csrApi,
  discoverCSRApiBaseUrl,
  loginUser,
  getToken,
  setToken,
  removeToken,
  debugAuth,
  checkAuthStatus,
  fetchAllPaginatedData,
  extractDataFromResponse,
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
  getOrderStats,
  getOrderStatsWithFilters,
  exportOrderToExcel,
  exportOrdersToExcel,
  exportOrdersToExcelFiltered,
  uploadOrderFiles,
  deleteOrderFile,
  getOrderFiles,
  renameOrderFile,
  getOrderMonthlyData,
  getOrderYearlyData,
  getGarmentAnalysis,
  getGarmentCustomerComparison,
  getCustomerData,
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  sendInquiryEmail,
  sendBulkInquiryEmail,
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  patchSupplier,
  deleteSupplier,
  sendExpiryNotifications,
  getDashboardExpirySummary,
  sendBulkReminders,
  recalculateAllDays,
  deleteBuildingImage,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  patchCustomer,
  deleteCustomer,
  getBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  patchBuyer,
  deleteBuyer,
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  patchAgent,
  deleteAgent,
  getStyles,
  getStyleById,
  createStyle,
  updateStyle,
  deleteStyle,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getFabrications,
  getFabricationById,
  createFabrication,
  updateFabrication,
  deleteFabrication,
  getRepeatOfs,
  getRepeatOfById,
  createRepeatOf,
  updateRepeatOf,
  deleteRepeatOf,
  getNegotiations,
  getNegotiationById,
  createNegotiation,
  updateNegotiation,
  deleteNegotiation,
  clearNegotiationHistory,
  getColorSizeGroups,
  getColorSizeGroupById,
  createColorSizeGroup,
  updateColorSizeGroup,
  deleteColorSizeGroup,
  getSizeQuantities,
  getSizeQuantityById,
  createSizeQuantity,
  updateSizeQuantity,
  deleteSizeQuantity,
  getInquiryAttachments,
  getInquiryAttachmentById,
  createInquiryAttachment,
  deleteInquiryAttachment,
  getColorTotals,
  getColorTotalById,
  createColorTotal,
  updateColorTotal,
  deleteColorTotal,
  getDashboardData,
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  patchDepartment,
  deleteDepartment,
  testMerchandiserEndpoint,
  getCourierBookings,
  getCourierBookingById,
  createCourierBooking,
  updateCourierBooking,
  patchCourierBooking,
  deleteCourierBooking,
  getCourierBookingStats,
  getCourierStatsWithFilters,
  updateCourierBookingStatus,
  reopenCourierBooking,
  getCourierBookingsByOrder,
  exportCourierBookings,
  getCourierNames,
  getCourierStatusOptions,
  getShipmentTypeOptions,
  getCourierBookingItems,
  createCourierBookingItem,
  updateCourierBookingItem,
  patchCourierBookingItem,
  deleteCourierBookingItem,
  getCourierDocuments,
  uploadCourierDocument,
  deleteCourierDocument,
  searchCourierCodes,
};

/* -------------------------------------------------------------------------- */
/*  SUPPLIER CAPACITY UTILIZATION REPORT                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the Supplier Capacity vs Capacity Used report.
 * @param {Object} filters - { year, from_month, to_month, buyer, supplier }
 */
/**
 * Fetch every distinct year that has real data for this report (from
 * Order.shipment_date or the manual Qty table). Used to populate the
 * Year filter so it isn't limited to a hardcoded "current year ± 1"
 * window.
 */
export const getSupplierCapacityAvailableYears = () =>
  merchandiserApi.get("reports/supplier-capacity/years/");

export const getSupplierCapacityReport = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, v);
  });
  return merchandiserApi.get(`reports/supplier-capacity/?${params.toString()}`);
};

/**
 * Download the report as a styled .xlsx file (server-generated, matches
 * on-screen layout exactly: green Capacity row, yellow Balance row, red
 * bracketed negatives).
 */
export const downloadSupplierCapacityReportExcel = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") params.append(k, v);
  });
  const response = await merchandiserApi.get(
    `reports/supplier-capacity/excel/?${params.toString()}`,
    { responseType: "blob" }
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `Supplier_Capacity_Report_${filters.years || filters.year || new Date().getFullYear()}.xlsx`
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/* -------------------------------------------------------------------------- */
/*  CAPACITY MASTER (monthly capacity assigned to each supplier)              */
/* -------------------------------------------------------------------------- */

export const getCapacityMaster = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") qs.append(k, v);
  });
  return merchandiserApi.get(`capacity-master/?${qs.toString()}`);
};

export const getCapacityMasterForSupplierYear = async (supplierId, year) => {
  const res = await merchandiserApi.get(
    `capacity-master/?supplier=${supplierId}&year=${year}`
  );
  const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
  const byMonth = {};
  list.forEach((row) => {
    byMonth[row.month] = row.capacity_qty;
  });
  return byMonth;
};

/**
 * Save a full year of monthly capacity for one supplier in a single call.
 * @param {number} supplierId
 * @param {number} year
 * @param {Object} months - { "1": 50000, "2": 50000, ... }
 */
export const bulkSaveCapacityMaster = (supplierId, year, months) =>
  merchandiserApi.post("capacity-master/bulk-save/", {
    supplier: supplierId,
    year,
    months,
  });

export const deleteCapacityMasterEntry = (id) =>
  merchandiserApi.delete(`capacity-master/${id}/`);

/**
 * Save a snapshot of the auto-calculated Capacity (Sum of Order.total_qty)
 * into the database for historical/admin visibility. The report itself
 * always computes Capacity live and does NOT need this to be accurate —
 * this is purely an optional persisted record.
 */
export const syncCapacitySnapshot = (filters = {}) =>
  merchandiserApi.post("reports/supplier-capacity/sync-snapshot/", {
    year: filters.year,
    from_month: filters.from_month,
    to_month: filters.to_month,
    supplier: filters.supplier || undefined,
  });
