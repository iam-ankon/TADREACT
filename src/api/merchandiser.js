// services/merchandiser.js
import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  1.  CONFIGURATION & TOKEN HELPERS                                         */
/* -------------------------------------------------------------------------- */
export const getBackendURL = () => "http://119.148.51.38:8000";

const getMerchandiserBaseUrl = () => `${getBackendURL()}/api/merchandiser/api/`;

/* Token handling – enhanced with validation */
export const getToken = () => {
  const token = localStorage.getItem("token");
  console.log(
    "Retrieved token:",
    token ? "Yes (length: " + token.length + ")" : "No",
  );

  // Validate token format (basic check)
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

  // Verify token was stored
  const storedToken = localStorage.getItem("token");
  console.log("Token stored:", storedToken ? "✅ Success" : "❌ Failed");
  console.log("Token preview:", token.substring(0, 15) + "...");
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
  console.log("All auth data cleared");
};

/* -------------------------------------------------------------------------- */
/*  2.  AXIOS INSTANCE (authenticated)                                        */
/* -------------------------------------------------------------------------- */
const createInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 45000,
    withCredentials: false, // No CSRF needed
  });

  // Request interceptor with ONLY Authorization header
  instance.interceptors.request.use(async (cfg) => {
    console.log(`🚀 Making ${cfg.method?.toUpperCase()} request to:`, cfg.url);

    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // ONLY use standard Authorization header - NO custom headers
      cfg.headers.Authorization = `Token ${token}`;

      console.log("🔑 Auth token added:", token.substring(0, 15) + "...");
    } else {
      console.warn("⚠️ No auth token found in localStorage!");
    }

    return cfg;
  });

  // Enhanced response interceptor with pagination handling
  instance.interceptors.response.use(
    (response) => {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${
          response.config.url
        } success:`,
        response.status,
      );
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

      // Handle authentication errors
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

/* Merchandiser API */
export const merchandiserApi = createInstance(getMerchandiserBaseUrl());

/* -------------------------------------------------------------------------- */
/*  3.  HELPER FUNCTION TO EXTRACT DATA FROM PAGINATED RESPONSES            */
/* -------------------------------------------------------------------------- */

/**
 * Extracts data array from paginated API responses
 * Handles both direct arrays and paginated { results: [...] } format
 */
const extractDataFromResponse = (response) => {
  if (!response || !response.data) return [];

  // Case 1: Paginated response with results array
  if (response.data.results && Array.isArray(response.data.results)) {
    console.log(
      `📊 Paginated response: ${response.data.results.length} items (page ${response.data.current_page || 1} of ${Math.ceil(response.data.count / (response.data.page_size || 50))})`,
    );
    return response.data.results;
  }

  // Case 2: Direct array
  if (Array.isArray(response.data)) {
    console.log(`📊 Direct array response: ${response.data.length} items`);
    return response.data;
  }

  // Case 3: Single object (wrap in array)
  if (response.data && typeof response.data === "object") {
    console.log(`📊 Single object response, wrapping in array`);
    return [response.data];
  }

  // Case 4: Something else
  console.warn("⚠️ Unexpected response format:", response.data);
  return [];
};

/* -------------------------------------------------------------------------- */
/*  4.  PAGINATION HELPER - FETCH ALL PAGES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Generic function to fetch all paginated data from any endpoint
 * @param {Function} apiFunction - The API function that accepts page and pageSize
 * @param {Object} params - Additional parameters to pass to the API function
 * @returns {Promise<Array>} - All items from all pages
 */
export const fetchAllPaginatedData = async (apiFunction, params = {}) => {
  let allData = [];
  let page = 1;
  let hasMore = true;
  const pageSize = 100;

  while (hasMore) {
    try {
      console.log(`📦 Fetching page ${page}...`);
      const response = await apiFunction(page, pageSize, params);

      if (response.data && response.data.length > 0) {
        allData = [...allData, ...response.data];

        // Check if we have more pages based on pagination info
        if (response.pagination && response.pagination.next) {
          page++;
        } else if (response.data.length === pageSize) {
          // If we got a full page, assume there might be more
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

  console.log(
    `✅ Total ${allData.length} items fetched across ${page - 1} pages`,
  );
  return allData;
};

/* -------------------------------------------------------------------------- */
/*  5.  DEBUG / TEST HELPERS                                                  */
/* -------------------------------------------------------------------------- */
export const debugAuth = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  console.log("AUTH DEBUG:", {
    token: token ? "Present (length: " + token.length + ")" : "Missing",
    username,
  });

  return {
    token: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : null,
    username,
  };
};

export const checkAuthStatus = async () => {
  try {
    console.log("🔍 Checking authentication status...");
    const token = localStorage.getItem("token");

    console.log(
      "Token in localStorage:",
      token ? "✅ Yes (length: " + token.length + ")" : "❌ No",
    );
    console.log("Username:", localStorage.getItem("username"));

    if (!token) {
      return {
        authenticated: false,
        error: "No token found",
        tokenExists: false,
      };
    }

    // Try a simple authenticated endpoint
    const response = await merchandiserApi.get("orders/?page=1&page_size=1");
    console.log("✅ Auth check response:", response.status);
    return {
      authenticated: true,
      status: response.status,
      tokenExists: true,
    };
  } catch (error) {
    console.error(
      "❌ Auth check failed:",
      error.response?.data || error.message,
    );
    return {
      authenticated: false,
      error: error.response?.data || error.message,
      tokenExists: !!localStorage.getItem("token"),
      status: error.response?.status,
    };
  }
};

export const testMerchandiserEndpoint = () => merchandiserApi.get("orders/");

/* -------------------------------------------------------------------------- */
/*  6.  AUTHENTICATION                                                        */
/* -------------------------------------------------------------------------- */
export const loginUser = async (payload) => {
  const { username, password } = payload;

  console.log("🔐 Attempting login for username:", username);

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

  console.log("✅ Login response data:", data);
  console.log(
    "🔑 Token received:",
    data.token ? "✅ Yes (length: " + data.token.length + ")" : "❌ No",
  );

  if (!data.token) {
    throw new Error("No token received from server");
  }

  setToken(data.token);

  // Enhanced storage function
  const store = (k, v) => {
    if (v !== undefined && v !== null && v !== "") {
      localStorage.setItem(k, v.toString());
      console.log(`💾 Stored ${k}:`, v);
    } else {
      console.warn(`⚠️ No value for ${k}`);
      localStorage.removeItem(k); // Remove if empty
    }
  };

  // Store all user data
  store("username", data.username);
  store("user_id", data.user_id);
  store("employee_id", data.employee_id);
  store("employee_name", data.employee_name);
  store("designation", data.designation);
  store("department", data.department);
  store("email", data.email || data.username);
  store("mode", data.mode || "restricted");
  store("permissions", JSON.stringify(data.permissions || {}));

  console.log("📋 Final stored data:", {
    username: localStorage.getItem("username"),
    employee_id: localStorage.getItem("employee_id"),
    employee_name: localStorage.getItem("employee_name"),
    designation: localStorage.getItem("designation"),
    department: localStorage.getItem("department"),
    token: localStorage.getItem("token") ? "Present" : "Missing",
  });

  return data;
};

/* -------------------------------------------------------------------------- */
/*  7.  ORDER APIs                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get orders with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {Object|boolean} options - Either filter params or boolean for allPages
 * @returns {Promise<Object>} - Response with data and pagination info
 */
// services/merchandiser.js - Update the getOrders function

export const getOrders = async (page = 1, pageSize = 100, options = {}) => {
  try {
    // Handle backward compatibility and allPages flag
    let allPages = false;
    let filters = {};

    if (typeof options === "boolean") {
      allPages = options;
    } else if (typeof options === "object") {
      allPages = options.allPages || false;
      filters = options.filters || {};
    }

    // If options is an object and doesn't have the allPages property, use it directly as filters
    if (
      typeof options === "object" &&
      !options.allPages &&
      Object.keys(options).length > 0
    ) {
      filters = options;
    }

    if (allPages) {
      // Fetch all pages code...
      let allOrders = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("page_size", pageSize);

        // Add all filters
        Object.keys(filters).forEach((key) => {
          if (
            filters[key] !== null &&
            filters[key] !== undefined &&
            filters[key] !== ""
          ) {
            params.append(key, filters[key]);
          }
        });

        console.log(
          `📡 Fetching orders page ${currentPage} with params:`,
          params.toString(),
        );
        const response = await merchandiserApi.get(
          `orders/?${params.toString()}`,
        );

        if (response.data && response.data.results) {
          allOrders = [...allOrders, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allOrders = [...allOrders, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allOrders,
        pagination: {
          count: allOrders.length,
          total_pages: 1,
        },
      };
    } else {
      // Fetch single page
      const params = new URLSearchParams();

      // Add pagination
      params.append("page", page);
      params.append("page_size", pageSize);

      // Add all filters
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== null &&
          filters[key] !== undefined &&
          filters[key] !== ""
        ) {
          // Special handling for status - ensure it's properly encoded
          if (key === "status") {
            console.log(`📌 Adding status filter: ${filters[key]}`);
          }
          params.append(key, filters[key]);
        }
      });

      const url = `orders/?${params.toString()}`;
      console.log("📡 Full API URL:", url);

      const response = await merchandiserApi.get(url);

      if (response.data && response.data.results) {
        console.log(
          `✅ Found ${response.data.results.length} orders out of ${response.data.count} total`,
        );
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

      // Fallback for non-paginated response
      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: {
          count: data.length,
          current_page: 1,
          page_size: data.length,
          total_pages: 1,
        },
      };
    }
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return { data: [], pagination: { count: 0 } };
  }
};

export const getOrderStatsWithFilters = async (filters = {}) => {
  try {
    // Build query parameters from filters
    const params = new URLSearchParams();

    // Add all filter parameters
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
    console.log("📊 Fetching stats with filters:", url);

    const response = await merchandiserApi.get(url);
    console.log("📊 Stats response:", response.data);

    // Ensure the response has the expected structure
    return {
      total_orders: response.data.total_orders || 0,
      total_value: response.data.total_value || 0,
      total_quantity: response.data.total_quantity || 0,
      avg_price_per_unit: response.data.avg_price_per_unit || 0,
      garment_stats: response.data.garment_stats || {
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
export const getOrderById = (id) => merchandiserApi.get(`orders/${id}/`);
export const createOrder = (data) => merchandiserApi.post("orders/", data);
export const updateOrder = (id, data) =>
  merchandiserApi.put(`orders/${id}/`, data);
export const patchOrder = (id, data) =>
  merchandiserApi.patch(`orders/${id}/`, data);
export const deleteOrder = (id) => merchandiserApi.delete(`orders/${id}/`);
export const getOrderStats = () => merchandiserApi.get("orders/stats/");

/* -------------------------------------------------------------------------- */
/*  8.  INQUIRY APIs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Get inquiries with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {Object|boolean} options - Either filter params or boolean for allPages
 * @returns {Promise<Object>} - Response with data and pagination info
 */
export const getInquiries = async (page = 1, pageSize = 100, options = {}) => {
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
          if (data.length > 0) {
            allInquiries = [...allInquiries, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allInquiries,
        pagination: { count: allInquiries.length },
      };
    } else {
      const params = new URLSearchParams({
        page: page,
        page_size: pageSize,
        ...filters,
      });

      const response = await merchandiserApi.get(
        `inquiry/?${params.toString()}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
  } catch (error) {
    console.error("❌ Error fetching inquiries:", error);
    return { data: [] };
  }
};

export const getInquiryById = (id) => merchandiserApi.get(`inquiry/${id}/`);

export const createInquiry = (formData) => {
  return merchandiserApi.post("inquiry/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateInquiry = (id, formData) => {
  return merchandiserApi.put(`inquiry/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteInquiry = (id) => merchandiserApi.delete(`inquiry/${id}/`);

export const sendInquiryEmail = (inquiryId, emailData) => {
  return merchandiserApi.post(`inquiries/${inquiryId}/send-email/`, emailData);
};

export const sendBulkInquiryEmail = (inquiryId, emailData) => {
  return merchandiserApi.post(`send-inquiry-email/${inquiryId}/`, emailData);
};

/* -------------------------------------------------------------------------- */
/*  9.  SUPPLIER APIs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Get suppliers with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {Object|boolean} options - Either filter params or boolean for allPages
 * @returns {Promise<Object>} - Response with data and pagination info
 */
export const getSuppliers = async (page = 1, pageSize = 100, options = {}) => {
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
      let allSuppliers = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });

        const response = await merchandiserApi.get(
          `supplier/?${params.toString()}`,
        );

        if (response.data && response.data.results) {
          allSuppliers = [...allSuppliers, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allSuppliers = [...allSuppliers, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allSuppliers,
        pagination: { count: allSuppliers.length },
      };
    } else {
      const params = new URLSearchParams({
        page: page,
        page_size: pageSize,
        ...filters,
      });

      const response = await merchandiserApi.get(
        `supplier/?${params.toString()}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
  } catch (error) {
    console.error("❌ Error fetching suppliers:", error);
    return { data: [] };
  }
};

export const getSupplierById = (id) => merchandiserApi.get(`supplier/${id}/`);

export const createSupplier = (formData) => {
  return merchandiserApi.post("supplier/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateSupplier = (id, formData) => {
  return merchandiserApi.put(`supplier/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const patchSupplier = (id, data) => {
  return merchandiserApi.patch(`supplier/${id}/`, data);
};

export const deleteSupplier = (id) => merchandiserApi.delete(`supplier/${id}/`);

export const sendExpiryNotifications = (supplierId, data) => {
  return merchandiserApi.post(
    `supplier/${supplierId}/send-expiry-notifications/`,
    data,
  );
};

export const getDashboardExpirySummary = () => {
  return merchandiserApi.get("supplier/dashboard_expiry_summary/");
};

export const sendBulkReminders = (data) => {
  return merchandiserApi.post("supplier/send-bulk-reminders/", data);
};

export const recalculateAllDays = () => {
  return merchandiserApi.post("supplier/recalculate-all-days/");
};

export const deleteBuildingImage = (supplierId, imageUrl) => {
  return merchandiserApi.delete(
    `supplier/${supplierId}/delete-building-image/`,
    {
      data: { image_url: imageUrl },
    },
  );
};

/* -------------------------------------------------------------------------- */
/*  10.  CUSTOMER APIs                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Get customers with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allCustomers = [...allCustomers, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allCustomers,
        pagination: { count: allCustomers.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `customer/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  11.  BUYER APIs                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get buyers with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allBuyers = [...allBuyers, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allBuyers,
        pagination: { count: allBuyers.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `buyer/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  12.  AGENT APIs                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get agents with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allAgents = [...allAgents, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allAgents,
        pagination: { count: allAgents.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `agent/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  13.  STYLE APIs                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get styles with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allStyles = [...allStyles, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allStyles,
        pagination: { count: allStyles.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `style/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  14.  ITEM APIs                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Get items with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allItems = [...allItems, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allItems,
        pagination: { count: allItems.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `item/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  15.  FABRICATION APIs                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Get fabrications with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allFabrications = [...allFabrications, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allFabrications,
        pagination: { count: allFabrications.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `fabrication/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  16.  REPEAT OF APIs                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Get repeat of records with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allRepeatOfs = [...allRepeatOfs, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allRepeatOfs,
        pagination: { count: allRepeatOfs.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `repeat_of/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  17.  NEGOTIATION APIs                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Get negotiations with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allNegotiations = [...allNegotiations, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allNegotiations,
        pagination: { count: allNegotiations.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `negotiation/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  18.  COLOR SIZE GROUP APIs                                                */
/* -------------------------------------------------------------------------- */

/**
 * Get color size groups with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allGroups = [...allGroups, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allGroups,
        pagination: { count: allGroups.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `color_size_group/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  19.  SIZE QUANTITY APIs                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get size quantities with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allQuantities = [...allQuantities, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allQuantities,
        pagination: { count: allQuantities.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `size_quantity/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  20.  INQUIRY ATTACHMENT APIs                                              */
/* -------------------------------------------------------------------------- */

/**
 * Get inquiry attachments with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allAttachments = [...allAttachments, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allAttachments,
        pagination: { count: allAttachments.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `inquiry_attachment/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
  } catch (error) {
    console.error("❌ Error fetching inquiry attachments:", error);
    return { data: [] };
  }
};

export const getInquiryAttachmentById = (id) =>
  merchandiserApi.get(`inquiry_attachment/${id}/`);

export const createInquiryAttachment = (formData) => {
  return merchandiserApi.post("inquiry_attachment/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteInquiryAttachment = (id) =>
  merchandiserApi.delete(`inquiry_attachment/${id}/`);

/* -------------------------------------------------------------------------- */
/*  21.  DASHBOARD APIs                                                       */
/* -------------------------------------------------------------------------- */

export const getDashboardData = (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.year) queryParams.append("year", params.year);
  if (params.season) queryParams.append("season", params.season);

  const url = `dashboard/data/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  return merchandiserApi.get(url);
};

/* -------------------------------------------------------------------------- */
/*  22.  COLOR TOTAL APIs                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Get color totals with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
          if (data.length > 0) {
            allTotals = [...allTotals, ...data];
          }
          hasMore = false;
        }
      }

      return {
        data: allTotals,
        pagination: { count: allTotals.length },
      };
    } else {
      const response = await merchandiserApi.get(
        `color_total/?page=${page}&page_size=${pageSize}`,
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

      const data = extractDataFromResponse(response);
      return {
        data: data,
        pagination: { count: data.length },
      };
    }
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
/*  EXPORT DEFAULT – ALL EXPORTS IN ONE OBJECT                                */
/* -------------------------------------------------------------------------- */
export default {
  // Core
  merchandiserApi,

  // Auth
  loginUser,
  getToken,
  setToken,
  removeToken,
  debugAuth,
  checkAuthStatus,

  // Pagination Helper
  fetchAllPaginatedData,
  extractDataFromResponse,

  // Orders
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
  getOrderStats,

  // Inquiries
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  sendInquiryEmail,
  sendBulkInquiryEmail,

  // Suppliers
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

  // Customers
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  patchCustomer,
  deleteCustomer,

  // Buyers
  getBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  patchBuyer,
  deleteBuyer,

  // Agents
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  patchAgent,
  deleteAgent,

  // Styles
  getStyles,
  getStyleById,
  createStyle,
  updateStyle,
  deleteStyle,

  // Items
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,

  // Fabrications
  getFabrications,
  getFabricationById,
  createFabrication,
  updateFabrication,
  deleteFabrication,

  // Repeat Of
  getRepeatOfs,
  getRepeatOfById,
  createRepeatOf,
  updateRepeatOf,
  deleteRepeatOf,

  // Negotiations
  getNegotiations,
  getNegotiationById,
  createNegotiation,
  updateNegotiation,
  deleteNegotiation,
  clearNegotiationHistory,

  // Color Size Groups
  getColorSizeGroups,
  getColorSizeGroupById,
  createColorSizeGroup,
  updateColorSizeGroup,
  deleteColorSizeGroup,

  // Size Quantities
  getSizeQuantities,
  getSizeQuantityById,
  createSizeQuantity,
  updateSizeQuantity,
  deleteSizeQuantity,

  // Inquiry Attachments
  getInquiryAttachments,
  getInquiryAttachmentById,
  createInquiryAttachment,
  deleteInquiryAttachment,

  // Color Totals
  getColorTotals,
  getColorTotalById,
  createColorTotal,
  updateColorTotal,
  deleteColorTotal,

  // Dashboard
  getDashboardData,

  // Test
  testMerchandiserEndpoint,
};
