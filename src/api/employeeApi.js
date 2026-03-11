/*  employeeApi.js  –  HRMS + Chat API wrapper with full pagination support */
import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  1.  CONFIGURATION & TOKEN HELPERS                                         */
/* -------------------------------------------------------------------------- */
export const getBackendURL = () => "http://119.148.51.38:8000";

const getHRMSBaseUrl = () => `${getBackendURL()}/api/hrms/api/`;

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
    "employee_db_id",
    "employee_name",
    "designation",
    "permissions",
    "mode",
    "token_timestamp",
    "reporting_leader",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  console.log("All auth data cleared");
};

/* -------------------------------------------------------------------------- */
/*  CSRF TOKEN - ENHANCED FETCH WITH RETRY LOGIC                             */
/* -------------------------------------------------------------------------- */
let _csrfToken = null;
let _csrfFetchInProgress = false;

export const fetchCsrfToken = async (forceRefresh = false) => {
  // Return cached token if available and not forcing refresh
  if (_csrfToken && !forceRefresh) {
    console.log("Using cached CSRF token");
    return _csrfToken;
  }

  // Prevent multiple simultaneous requests
  if (_csrfFetchInProgress) {
    console.log("CSRF fetch already in progress, waiting...");
    // Wait for existing request to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (_csrfToken) return _csrfToken;
  }

  _csrfFetchInProgress = true;

  try {
    console.log("Fetching CSRF token...");

    const response = await fetch(`${getBackendURL()}/api/csrf/`, {
      method: "GET",
      credentials: "include", // Essential for cookies
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("CSRF fetch response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("CSRF response data:", data);

    // Try multiple ways to get the token
    if (data.csrfToken) {
      _csrfToken = data.csrfToken;
      console.log("CSRF token from JSON:", _csrfToken.substring(0, 10) + "...");
    } else {
      // Fallback to cookie reading
      _csrfToken = getCsrfTokenFromCookie();
      if (_csrfToken) {
        console.log(
          "CSRF token from cookie after fetch:",
          _csrfToken.substring(0, 10) + "...",
        );
      }
    }

    if (!_csrfToken) {
      console.error("Failed to obtain CSRF token");
    }

    return _csrfToken;
  } catch (err) {
    console.error("fetchCsrfToken() error:", err.message);
    // Fallback to cookie method
    _csrfToken = getCsrfTokenFromCookie();
    return _csrfToken;
  } finally {
    _csrfFetchInProgress = false;
  }
};

/* -------------------------------------------------------------------------- */
/*  ROBUST CSRF TOKEN GETTER                                                 */
/* -------------------------------------------------------------------------- */
const getCsrfTokenFromCookie = () => {
  const name = "csrftoken";
  const cookieMatch = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  if (cookieMatch && cookieMatch[2]) {
    console.log("🍪 CSRF token found in cookies");
    return cookieMatch[2];
  }
  return null;
};

export const getCsrfToken = () => {
  // Method 1: Check memory cache
  if (_csrfToken) {
    console.log("🔐 Using cached CSRF token");
    return _csrfToken;
  }

  // Method 2: Check cookies
  const tokenFromCookie = getCsrfTokenFromCookie();
  if (tokenFromCookie) {
    _csrfToken = tokenFromCookie;
    return _csrfToken;
  }

  // Method 3: Check meta tag (common in Django)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    _csrfToken = metaTag.getAttribute("content");
    console.log("🏷️ CSRF token found in meta tag");
    return _csrfToken;
  }

  // Method 4: Check localStorage (some implementations)
  const tokenFromStorage = localStorage.getItem("csrftoken");
  if (tokenFromStorage) {
    _csrfToken = tokenFromStorage;
    console.log("💾 CSRF token found in localStorage");
    return tokenFromStorage;
  }

  console.warn("❌ No CSRF token found!");
  return null;
};

export const sendLeaveEmailToMD = async (emailData) => {
  try {
    // Use the properly exported hrmsApi instance
    const response = await hrmsApi.post("send-leave-email-to-md/", emailData);
    return response.data;
  } catch (error) {
    console.error("Error sending email to MD:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  2.  AXIOS INSTANCES (authenticated)                                      */
/* -------------------------------------------------------------------------- */
const createInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 45000,
    withCredentials: true, // Essential for CSRF
  });

  // FIXED: Request interceptor with ONLY standard headers
  instance.interceptors.request.use(async (cfg) => {
    console.log(`🚀 Making ${cfg.method?.toUpperCase()} request to:`, cfg.url);

    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      // ONLY use standard Authorization header - NO custom headers
      cfg.headers.Authorization = `Token ${token}`;

      console.log("🔑 Auth token added:", token.substring(0, 15) + "...");
      console.log(
        "📋 Authorization header:",
        cfg.headers.Authorization ? "Present" : "Missing",
      );
    } else {
      console.warn("⚠️ No auth token found in localStorage!");
    }

    // ONLY add CSRF for state-changing requests, not GET requests
    const method = cfg.method?.toLowerCase();
    if (method && ["post", "patch", "put", "delete"].includes(method)) {
      let csrfToken = getCsrfToken();

      if (!csrfToken) {
        console.log("🔄 No CSRF token found, fetching...");
        csrfToken = await fetchCsrfToken();
      }

      if (csrfToken) {
        cfg.headers["X-CSRFToken"] = csrfToken;
        console.log("🔒 CSRF Token sent:", csrfToken.substring(0, 10) + "...");
      } else {
        console.warn("⚠️ CSRF token missing for state-changing request");
      }
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

/* HRMS API (all employee / interview / provision endpoints) */
export const hrmsApi = createInstance(getHRMSBaseUrl());

/* Chat API (kept separate – different base URL) */
export const chatApi = createInstance(getBackendURL());

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
/*  5.  DEBUG / TEST HELPERS                                                 */
/* -------------------------------------------------------------------------- */
export const debugAuth = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const mode = localStorage.getItem("mode");
  const permissions = localStorage.getItem("permissions");

  console.log("AUTH DEBUG:", {
    token: token ? "Present (length: " + token.length + ")" : "Missing",
    username,
    mode,
    permissions: permissions ? "Present" : "Missing",
  });

  return {
    token: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : null,
    username,
    mode,
    permissions: !!permissions,
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
    console.log("Employee ID:", localStorage.getItem("employee_id"));

    if (!token) {
      return {
        authenticated: false,
        error: "No token found",
        tokenExists: false,
      };
    }

    // Try a simple authenticated endpoint
    const response = await hrmsApi.get("debug_auth/");
    console.log("✅ Auth check response:", response.data);
    return {
      authenticated: true,
      data: response.data,
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

export const testAuth = () => chatApi.post("/api/auth/test/", { test: "data" });
export const testChatEndpoint = () => chatApi.get("/api/chat/conversations/");
export const testHRMSEndpoint = () => hrmsApi.get("employees/");

/* -------------------------------------------------------------------------- */
/*  6.  AUTHENTICATION                                                        */
export const loginUser = async (payload) => {
  const { username, password, employee_id, designation, department, email } =
    payload;

  console.log("🔐 Attempting login for username:", username);

  const resp = await fetch(`${getBackendURL()}/users/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username?.trim(),
      password: password?.trim(),
      employee_id: employee_id?.trim(),
      designation: designation?.trim() || "",
      department: department?.trim() || "",
      email: email?.trim() || "",
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

  // Enhanced storage function with reporting_leader
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
  store("employee_db_id", data.employee_db_id);
  store("employee_name", data.employee_name);
  store("designation", data.designation);
  store("department", data.department);
  store("email", data.email || data.username);
  store("mode", data.mode || "restricted");
  store("permissions", JSON.stringify(data.permissions || {}));
  store("reporting_leader", data.reporting_leader);

  console.log("📋 Final stored data:", {
    employee_id: localStorage.getItem("employee_id"),
    employee_db_id: localStorage.getItem("employee_db_id"),
    employee_name: localStorage.getItem("employee_name"),
    designation: localStorage.getItem("designation"),
    department: localStorage.getItem("department"),
    reporting_leader: localStorage.getItem("reporting_leader"),
    token: localStorage.getItem("token") ? "Present" : "Missing",
  });

  return data;
};

/* -------------------------------------------------------------------------- */
/*  7.  EMPLOYEE APIs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Get employees with pagination support
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 100)
 * @param {Object|boolean} options - Either filter params or boolean for allPages
 * @returns {Promise<Object>} - Response with data and pagination info
 */
export const getEmployees = async (page = 1, pageSize = 100, options = {}) => {
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

    if (allPages) {
      // Fetch all pages
      let allEmployees = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });

        const response = await hrmsApi.get(`employees/?${params.toString()}`);

        if (response.data && response.data.results) {
          allEmployees = [...allEmployees, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allEmployees = [...allEmployees, ...data];
          }
          hasMore = false;
        }
      }

      console.log(`✅ Fetched ${allEmployees.length} total employees`);
      return {
        data: allEmployees,
        pagination: {
          count: allEmployees.length,
          total_pages: 1,
        },
      };
    } else {
      // Fetch single page
      const params = new URLSearchParams({
        page: page,
        page_size: pageSize,
        ...filters,
      });

      const response = await hrmsApi.get(`employees/?${params.toString()}`);

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
    console.error("❌ Error fetching employees:", error);
    return { data: [], pagination: { count: 0 } };
  }
};

export const getEmployeeById = (id) => hrmsApi.get(`employees/${id}/`);
export const addEmployee = (data) => hrmsApi.post("employees/", data);
export const updateEmployee = (id, data) =>
  hrmsApi.patch(`employees/${id}/`, data);
export const deleteEmployee = async (id, terminationData) => {
  try {
    const response = await hrmsApi.delete(`employees/${id}/terminate/`, {
      data: terminationData,
    });
    return response.data;
  } catch (error) {
    console.error("Error terminating employee:", error);
    throw error;
  }
};

export const updateEmployeeImage = (id, formData) => {
  console.log("=== updateEmployeeImage DEBUG ===");
  console.log("Employee ID:", id);
  return hrmsApi.patch(`employees/${id}/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateEmployeeCustomers = (id, customerIds) => {
  const customersArray = Array.isArray(customerIds)
    ? customerIds.map((id) => parseInt(id)).filter((id) => !isNaN(id))
    : [];

  return hrmsApi.patch(`employees/${id}/update_customers/`, {
    customers: customersArray,
  });
};

export const addEmployeeLeave = async (data) => {
  try {
    console.log("📝 Creating leave request with data:", data);

    const reportingLeader = localStorage.getItem("reporting_leader");

    const leaveData = {
      ...data,
      employee: parseInt(data.employee),
      employee_code: data.employee_code || localStorage.getItem("employee_id"),
      status: data.status || "pending",
      reporting_leader: reportingLeader || "",
    };

    console.log("📦 Final API payload:", leaveData);

    const response = await hrmsApi.post("employee_leaves/", leaveData);
    console.log("✅ Leave created successfully:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Error creating leave:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  8.  CUSTOMER APIs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Get all customers with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getAllCustomers = async (
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
        const response = await hrmsApi.get(
          `customers/?page=${currentPage}&page_size=${pageSize}`,
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
      const response = await hrmsApi.get(
        `customers/?page=${page}&page_size=${pageSize}`,
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

export const getCustomerById = (id) => hrmsApi.get(`customers/${id}/`);

/* -------------------------------------------------------------------------- */
/*  9.  PERFORMANCE APPRAISAL APIs                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get performance appraisals with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {Object|boolean} options - Filter params or allPages flag
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getPerformanceAppraisals = async (
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
      let allAppraisals = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });

        const response = await hrmsApi.get(
          `performance_appraisals/?${params.toString()}`,
        );

        if (response.data && response.data.results) {
          allAppraisals = [...allAppraisals, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allAppraisals,
        pagination: { count: allAppraisals.length },
      };
    } else {
      const params = new URLSearchParams({
        page: page,
        page_size: pageSize,
        ...filters,
      });

      const response = await hrmsApi.get(
        `performance_appraisals/?${params.toString()}`,
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
    console.error("❌ Error fetching appraisals:", error);
    return { data: [] };
  }
};

export const getPerformanceAppraisalById = (id) =>
  hrmsApi.get(`performance_appraisals/${id}/`);

export const createPerformanceAppraisal = (data) =>
  hrmsApi.post("performance_appraisals/", data);

export const addPerformanceAppraisal = (data) =>
  hrmsApi.post("performance_appraisals/", data);

export const updatePerformanceAppraisal = (id, data) =>
  hrmsApi.patch(`performance_appraisals/${id}/`, data);

export const deletePerformanceAppraisal = (id) =>
  hrmsApi.delete(`performance_appraisals/${id}/`);

/**
 * Get performance appraisals by employee ID with pagination
 * @param {string} employeeId - Employee ID
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data
 */
export const getPerformanceAppraisalsByEmployeeId = async (
  employeeId,
  allPages = false,
) => {
  try {
    console.log(`🔍 API: Fetching appraisals for employee ${employeeId}`);

    if (allPages) {
      let allAppraisals = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        const response = await hrmsApi.get(
          `performance_appraisals/?employee_id=${employeeId}&page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allAppraisals = [...allAppraisals, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allAppraisals = [...allAppraisals, ...data];
          }
          hasMore = false;
        }
      }

      console.log(
        `📊 Found ${allAppraisals.length} total appraisals for employee ${employeeId}`,
      );
      return { data: allAppraisals };
    } else {
      const response = await hrmsApi.get(
        `performance_appraisals/?employee_id=${employeeId}`,
      );
      console.log(`📊 API Response for ${employeeId}:`, response.data);
      return {
        ...response,
        data: extractDataFromResponse(response),
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching appraisals for ${employeeId}:`, error);
    return { data: [] };
  }
};

export const approveIncrement = async (appraisalId) => {
  try {
    console.log("📡 Approving increment for ID:", appraisalId);
    const response = await hrmsApi.post(
      `performance_appraisals/${appraisalId}/approve_increment/`,
      {},
    );
    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Error in approveIncrement:", error);
    throw error;
  }
};

export const approveDesignation = async (appraisalId) => {
  try {
    console.log("📡 Approving designation for ID:", appraisalId);
    const response = await hrmsApi.post(
      `performance_appraisals/${appraisalId}/approve_designation/`,
      {},
    );
    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Error in approveDesignation:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  10.  TERMINATED EMPLOYEES ARCHIVE APIs                                    */
/* -------------------------------------------------------------------------- */

/**
 * Get terminated employees with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getTerminatedEmployees = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allTerminated = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `terminated_employees/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allTerminated = [...allTerminated, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allTerminated,
        pagination: { count: allTerminated.length },
      };
    } else {
      const response = await hrmsApi.get(
        `terminated_employees/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching terminated employees:", error);
    return { data: [] };
  }
};

export const getTerminatedEmployeeById = (id) =>
  hrmsApi.get(`terminated_employees/${id}/`);

export const searchTerminatedEmployees = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });

  const queryString = queryParams.toString();
  const url = queryString
    ? `terminated_employees/?${queryString}`
    : "terminated_employees/";

  const response = await hrmsApi.get(url);
  return {
    ...response,
    data: extractDataFromResponse(response),
  };
};

export const restoreTerminatedEmployee = (archiveId) =>
  hrmsApi.post(`terminated_employees/${archiveId}/restore/`, {});

export const getTerminationStats = () =>
  hrmsApi.get("terminated_employees/stats/");

export const exportTerminatedEmployees = (format = "json") =>
  hrmsApi.get(`terminated_employees/export/?format=${format}`, {
    responseType: format === "csv" ? "blob" : "json",
  });

export const updateTerminationStatus = (archiveId, statusData) =>
  hrmsApi.patch(`terminated_employees/${archiveId}/update_status/`, statusData);

export const bulkDeleteTerminatedEmployees = (archiveIds) =>
  hrmsApi.post("terminated_employees/bulk_delete/", { ids: archiveIds });

export const getTerminationTrends = (startDate, endDate) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  return hrmsApi.get("terminated_employees/trends/", { params });
};

export const getDepartmentTerminationStats = () =>
  hrmsApi.get("terminated_employees/department_stats/");

/* -------------------------------------------------------------------------- */
/*  11.  LEAVE BALANCES                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Get employee leave balances with pagination support
 * @param {string} employeeId - Employee ID
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data
 */
export const getEmployeeLeaveBalances = async (
  employeeId = null,
  allPages = false,
) => {
  try {
    const effectiveEmployeeId =
      employeeId || localStorage.getItem("employee_id");
    console.log("🔍 Fetching balances for employee:", effectiveEmployeeId);

    if (allPages) {
      let allBalances = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100;

      while (hasMore) {
        const url = `employee_leave_balances/?employee_id=${effectiveEmployeeId}&page=${currentPage}&page_size=${pageSize}`;
        const response = await hrmsApi.get(url);

        if (response.data && response.data.results) {
          allBalances = [...allBalances, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allBalances = [...allBalances, ...data];
          }
          hasMore = false;
        }
      }

      console.log(`✅ Found ${allBalances.length} total balances`);
      return { data: allBalances };
    } else {
      const url = `employee_leave_balances/?employee_id=${effectiveEmployeeId}`;
      const response = await hrmsApi.get(url);
      const balancesData = extractDataFromResponse(response);

      console.log("✅ Returning balances:", balancesData.length);
      return {
        ...response,
        data: balancesData,
      };
    }
  } catch (error) {
    console.error("❌ Error in getEmployeeLeaveBalances:", error);
    return { data: [] };
  }
};

export const getMyLeaveBalance = async () => {
  try {
    console.log("🔍 Getting my leave balance (direct endpoint)...");
    const response = await hrmsApi.get("get_my_leave_balance/");
    console.log("✅ My leave balance:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Error getting my leave balance:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  12.  EMPLOYEE LEAVES APIs                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Get employee leaves with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {Object|boolean} options - Filter params or allPages flag
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getEmployeeLeaves = async (
  page = 1,
  pageSize = 100,
  options = {},
) => {
  try {
    console.log("🔍 Getting leaves for current user...");

    const username = localStorage.getItem("username");
    const employeeId = localStorage.getItem("employee_id");
    const employeeDbId = localStorage.getItem("employee_db_id");
    const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

    console.log("📋 User info:", {
      username,
      employeeId,
      employeeDbId,
      hasFullAccess: permissions.full_access,
    });

    const hasFullAccess = permissions.full_access === true;
    const isSohel = username === "Sohel";

    let allPages = false;
    let filters = {};

    if (typeof options === "boolean") {
      allPages = options;
    } else if (typeof options === "object") {
      allPages = options.allPages || false;
      filters = options.filters || {};
    }

    if (allPages) {
      let allLeaves = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        let url = `employee_leaves/?page=${currentPage}&page_size=${pageSize}`;

        if (!hasFullAccess || isSohel) {
          const params = new URLSearchParams({
            ...filters,
          });
          if (employeeId) params.append("employee_id", employeeId);
          if (employeeDbId) params.append("employee_db_id", employeeDbId);
          if (params.toString()) {
            url += `&${params.toString()}`;
          }
        }

        console.log("🌐 API URL:", url);
        const response = await hrmsApi.get(url);

        if (response.data && response.data.results) {
          allLeaves = [...allLeaves, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allLeaves = [...allLeaves, ...data];
          }
          hasMore = false;
        }
      }

      console.log(`📋 Found ${allLeaves.length} total leaves`);
      return { data: allLeaves };
    } else {
      let url = `employee_leaves/?page=${page}&page_size=${pageSize}`;

      if (!hasFullAccess || isSohel) {
        const params = new URLSearchParams({
          ...filters,
        });
        if (employeeId) params.append("employee_id", employeeId);
        if (employeeDbId) params.append("employee_db_id", employeeDbId);
        if (params.toString()) {
          url += `&${params.toString()}`;
        }
      }

      console.log("🌐 API URL:", url);

      const response = await hrmsApi.get(url);

      if (response.data && response.data.results) {
        const leavesData = response.data.results;
        console.log(`📋 Found ${leavesData.length} leaves on page ${page}`);

        return {
          ...response,
          data: leavesData,
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

      const leavesData = extractDataFromResponse(response);
      console.log(`📋 Found ${leavesData.length} leaves`);

      return {
        ...response,
        data: leavesData,
        pagination: {
          count: leavesData.length,
          current_page: 1,
          page_size: pageSize,
          total_pages: 1,
        },
      };
    }
  } catch (error) {
    console.error("❌ Error fetching leaves:", error);
    return {
      data: [],
      pagination: {
        count: 0,
        current_page: 1,
        page_size: pageSize,
        total_pages: 1,
      },
    };
  }
};

export const getEmployeeLeaveById = (id) =>
  hrmsApi.get(`employee_leaves/${id}/`);

export const deleteEmployeeLeave = (id) =>
  hrmsApi.delete(`employee_leaves/${id}/`);

export const updateEmployeeLeave = (id, data) => {
  console.log("📤 Updating leave with ID:", id);
  return hrmsApi.patch(`employee_leaves/${id}/`, data);
};

export const addTeamLeaderComment = (leaveId, comment) => {
  console.log("💬 Adding team leader comment for leave:", leaveId);
  return hrmsApi.post(`employee_leaves/${leaveId}/add_team_comment/`, {
    teamleader: comment,
  });
};

/* -------------------------------------------------------------------------- */
/*  13.  DEBUG & DIAGNOSTIC APIs                                              */
/* -------------------------------------------------------------------------- */
export const debugEmployeeLeaves = async () => {
  try {
    console.log("🔍 DEBUG: Fetching all leaves for debugging...");
    const response = await hrmsApi.get("debug_all_leaves/");
    return {
      ...response,
      data: extractDataFromResponse(response),
    };
  } catch (error) {
    console.error("❌ Debug error:", error);
    throw error;
  }
};

export const debugAllLeaves = () => hrmsApi.get("debug_all_leaves/");
export const debugEmployees = () => hrmsApi.get("debug_employees/");
export const debugUserEmployeeMapping = () =>
  hrmsApi.get("debug_user_employee_mapping/");
export const checkUserEmployeeMapping = () =>
  hrmsApi.get("check_user_employee_mapping/");

export const debugCurrentUserLeaves = async () => {
  try {
    console.log("🔍 DEBUG: Fetching current user leaves...");
    const response = await hrmsApi.get("api/debug_current_user_leaves/");
    return {
      ...response,
      data: extractDataFromResponse(response),
    };
  } catch (error) {
    console.error("❌ Debug error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  14.  PERMISSION CHECKS                                                    */
/* -------------------------------------------------------------------------- */
const getPerms = () => JSON.parse(localStorage.getItem("permissions") || "{}");
export const hasFullAccess = () => getPerms().full_access === true;
export const canAccessLeaveRequests = () => getPerms().leave_requests === true;
export const canAccessHRWork = () => getPerms().hr_work === true;

/* -------------------------------------------------------------------------- */
/*  15.  CHAT APIs                                                            */
/* -------------------------------------------------------------------------- */
export const createDirectConversation = (userId) =>
  chatApi.post("/api/chat/conversations/", {
    user_id: userId,
    is_group: false,
  });

export const addMemberToConversation = (convId, userId) =>
  chatApi.post(`/api/chat/conversations/${convId}/add_member/`, {
    user_id: userId,
  });

export const sendMessage = (convId, content) =>
  chatApi.post("/api/chat/messages/", { conversation: convId, content });

export const fetchMessages = (convId) =>
  chatApi.get(`/api/chat/conversations/${convId}/messages/`);

export const fetchConversations = () => chatApi.get("/api/chat/conversations/");
export const fetchUsers = () => chatApi.get("/api/chat/users/");

export const createGroupConversation = (title, members) =>
  chatApi.post("/api/chat/conversations/", { title, is_group: true, members });

/* -------------------------------------------------------------------------- */
/*  16.  COMPANY / DEPARTMENT APIs                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get companies with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getCompanies = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allCompanies = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `tad_groups/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allCompanies = [...allCompanies, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allCompanies,
        pagination: { count: allCompanies.length },
      };
    } else {
      const response = await hrmsApi.get(
        `tad_groups/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching companies:", error);
    return { data: [] };
  }
};

export const getCompanyById = (id) => hrmsApi.get(`tad_groups/${id}/`);

/**
 * Get departments with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
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
        const response = await hrmsApi.get(
          `departments/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allDepartments = [...allDepartments, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allDepartments,
        pagination: { count: allDepartments.length },
      };
    } else {
      const response = await hrmsApi.get(
        `departments/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching departments:", error);
    return { data: [] };
  }
};

export const getDepartmentById = (id) => hrmsApi.get(`departments/${id}/`);

export const getCustomers = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  return getAllCustomers(page, pageSize, allPages);
};

/* -------------------------------------------------------------------------- */
/*  17.  NOTIFICATIONS / ATTENDANCE / LEAVE                                  */
/* -------------------------------------------------------------------------- */

/**
 * Get notifications with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getNotifications = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allNotifications = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `notifications/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allNotifications = [...allNotifications, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allNotifications,
        pagination: { count: allNotifications.length },
      };
    } else {
      const response = await hrmsApi.get(
        `notifications/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching notifications:", error);
    return { data: [] };
  }
};

export const getWeeklyAttendanceStats = (startDate, endDate) => {
  return hrmsApi
    .get("api/weekly_attendance_stats/", {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    })
    .catch((error) => {
      console.error("Error with api/ prefix, trying without...", error);
      return hrmsApi.get("weekly_attendance_stats/", {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
    });
};

export const getTeamLeaves = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    console.log("🔍 Getting team leaves via dedicated endpoint...");

    if (allPages) {
      let allLeaves = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `team_leaves/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allLeaves = [...allLeaves, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allLeaves = [...allLeaves, ...data];
          }
          hasMore = false;
        }
      }

      return { data: allLeaves };
    } else {
      const response = await hrmsApi.get(
        `team_leaves/?page=${page}&page_size=${pageSize}`,
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
      return { data: data };
    }
  } catch (error) {
    console.error("❌ Error in getTeamLeaves:", error);
    return await getEmployeeLeaves(page, pageSize, allPages);
  }
};

export const sendWelcomeEmail = (employeeId) => {
  console.log("Sending welcome email for employee ID:", employeeId);
  return hrmsApi.post(`employees/${employeeId}/send-welcome-email/`);
};

export const getEmployeeDetailsByCode = async (employeeCode) => {
  try {
    console.log("🔍 Fetching employee details for code:", employeeCode);

    const response = await hrmsApi.get(
      `employees/?employee_id=${employeeCode}`,
    );
    const employees = extractDataFromResponse(response);

    if (employees && employees.length > 0) {
      const exactEmployee = employees.find(
        (emp) =>
          emp.employee_id === employeeCode ||
          emp.employee_id?.toString() === employeeCode?.toString(),
      );

      if (exactEmployee) {
        console.log(
          "🎯 Found exact employee:",
          exactEmployee.name,
          "-",
          exactEmployee.designation,
        );
        return exactEmployee;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error fetching employee details:", error);
    return null;
  }
};

/* -------------------------------------------------------------------------- */
/*  18.  ATTENDANCE APIs                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Get attendance records with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getAttendance = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allAttendance = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `attendance/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allAttendance = [...allAttendance, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allAttendance,
        pagination: { count: allAttendance.length },
      };
    } else {
      const response = await hrmsApi.get(
        `attendance/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching attendance:", error);
    return { data: [] };
  }
};

export const getAttendanceById = (id) => hrmsApi.get(`attendance/${id}/`);
export const addAttendance = (data) => hrmsApi.post("attendance/", data);
export const updateAttendance = (id, data) =>
  hrmsApi.patch(`attendance/${id}/`, data);
export const deleteAttendance = (id) => hrmsApi.delete(`attendance/${id}/`);
export const deleteAllAttendance = () =>
  hrmsApi.delete("attendance/delete_all/");

export const deleteAttendanceByMonth = async (year, month) => {
  try {
    console.log(`🗑️ Deleting attendance for ${year}-${month}`);

    // Option 1: Try the specific endpoint first
    try {
      const response = await hrmsApi.delete(`attendance/delete_by_month/`, {
        params: {
          year: year,
          month: month,
        },
      });
      console.log("✅ Monthly attendance deleted via dedicated endpoint");
      return response.data;
    } catch (endpointError) {
      console.log(
        "⚠️ Dedicated endpoint not found, falling back to manual deletion",
      );
    }

    // Option 2: Manual deletion by fetching and deleting each record
    console.log("🔍 Fetching all attendance records...");
    const allAttendance = await getAttendance(1, 100, true);

    if (!allAttendance.data || !Array.isArray(allAttendance.data)) {
      throw new Error("No attendance data found");
    }

    // Filter records for the specific month
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const recordsToDelete = allAttendance.data.filter((record) => {
      if (!record || !record.date) return false;

      // Handle different date formats
      const dateStr = record.date.includes("T")
        ? record.date.split("T")[0]
        : record.date;

      return dateStr.startsWith(prefix);
    });

    console.log(
      `📊 Found ${recordsToDelete.length} records to delete for ${prefix}`,
    );

    if (recordsToDelete.length === 0) {
      return {
        success: true,
        message: "No records found for this month",
        deleted_count: 0,
      };
    }

    // Show progress
    let deletedCount = 0;
    let errors = [];

    // Delete in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < recordsToDelete.length; i += batchSize) {
      const batch = recordsToDelete.slice(i, i + batchSize);

      const batchPromises = batch.map((record) =>
        hrmsApi
          .delete(`attendance/${record.id}/`)
          .then(() => {
            deletedCount++;
            console.log(
              `✅ Deleted record ${record.id} (${deletedCount}/${recordsToDelete.length})`,
            );
            return true;
          })
          .catch((error) => {
            console.warn(
              `❌ Failed to delete record ${record.id}:`,
              error.message,
            );
            errors.push({ id: record.id, error: error.message });
            return false;
          }),
      );

      await Promise.all(batchPromises);

      // Small delay between batches
      if (i + batchSize < recordsToDelete.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `🎯 Deletion complete: ${deletedCount} successful, ${errors.length} failed`,
    );

    return {
      success: true,
      message: `Deleted ${deletedCount} attendance records for ${year}-${month}`,
      deleted_count: deletedCount,
      failed_count: errors.length,
      errors: errors,
    };
  } catch (error) {
    console.error("❌ Error deleting monthly attendance:", error);
    console.error("Error details:", error.response?.data);

    // More specific error messages
    let errorMessage = "Failed to delete attendance";
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

/* -------------------------------------------------------------------------- */
/*  19.  INTERVIEWS                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get interviews with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getInterviews = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allInterviews = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `interviews/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allInterviews = [...allInterviews, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allInterviews,
        pagination: { count: allInterviews.length },
      };
    } else {
      const response = await hrmsApi.get(
        `interviews/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching interviews:", error);
    return { data: [] };
  }
};

export const getInterviewById = (id) => hrmsApi.get(`interviews/${id}/`);
export const addInterview = (data) => hrmsApi.post("interviews/", data);
export const updateInterview = (id, data) =>
  hrmsApi.patch(`interviews/${id}/`, data);
export const deleteInterview = (id) => hrmsApi.delete(`interviews/${id}/`);

/* -------------------------------------------------------------------------- */
/*  20.  CVs                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Get CVs with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {Object|boolean} options - Filter params or allPages flag
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getCVs = async (page = 1, pageSize = 100, options = {}) => {
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
      let allCVs = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage,
          page_size: pageSize,
          ...filters,
        });

        const url = `cvs/?${params.toString()}`;
        console.log(`📡 Fetching CVs from: ${url}`);

        const response = await hrmsApi.get(url);

        if (response.data && response.data.results) {
          allCVs = [...allCVs, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          const data = extractDataFromResponse(response);
          if (data.length > 0) {
            allCVs = [...allCVs, ...data];
          }
          hasMore = false;
        }
      }

      console.log(`✅ Total ${allCVs.length} CVs fetched`);
      return {
        data: allCVs,
        pagination: {
          count: allCVs.length,
          total_pages: 1,
        },
      };
    } else {
      const params = new URLSearchParams({
        page: page,
        page_size: pageSize,
        ...filters,
      });

      const url = `cvs/?${params.toString()}`;
      console.log(`📡 Fetching CVs from: ${url}`);

      const response = await hrmsApi.get(url);

      if (response.data && response.data.results) {
        console.log(
          `📋 Page ${page}: ${response.data.results.length} CVs (Total: ${response.data.count})`,
        );

        return {
          ...response,
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
        ...response,
        data: data,
        pagination: {
          count: data.length,
          next: null,
          previous: null,
          current_page: 1,
          page_size: data.length,
          total_pages: 1,
        },
      };
    }
  } catch (error) {
    console.error("❌ Error fetching CVs:", error);
    return {
      data: [],
      pagination: {
        count: 0,
        current_page: 1,
        page_size: pageSize,
        total_pages: 1,
      },
    };
  }
};

// Function to get ALL CVs (all pages) - kept for backward compatibility
export const getAllCVs = async (filters = {}) => {
  const result = await getCVs(1, 100, { allPages: true, filters });
  return result.data;
};

export const getCVById = (id) => hrmsApi.get(`cvs/${id}/`);

export const addCV = (data) => {
  const fd = new FormData();
  fd.append("employee", data.employee);
  fd.append("cv_file", data.cv_file);
  fd.append("name", data.name);
  fd.append("position_for", data.position_for ?? "");
  fd.append("age", data.age ?? "");
  fd.append("reference", data.reference ?? "");
  fd.append("email", data.email ?? "");
  fd.append("phone", data.phone ?? "");
  return hrmsApi.post("cvs/", fd);
};

export const updateCV = (id, data) => hrmsApi.patch(`cvs/${id}/`, data);
export const deleteCV = (id) => hrmsApi.delete(`cvs/${id}/`);

/* -------------------------------------------------------------------------- */
/*  21.  PROVISIONS (IT / Finance / Admin)                                   */
/* -------------------------------------------------------------------------- */

/**
 * Generic provision API creator with pagination
 * @param {string} base - Base endpoint
 * @returns {Object} - API functions with pagination
 */
const createProvisionApi = (base) => ({
  list: async (page = 1, pageSize = 100, allPages = false) => {
    try {
      if (allPages) {
        let allItems = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await hrmsApi.get(
            `${base}/?page=${currentPage}&page_size=${pageSize}`,
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
        const response = await hrmsApi.get(
          `${base}/?page=${page}&page_size=${pageSize}`,
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
      console.error(`❌ Error fetching ${base}:`, error);
      return { data: [] };
    }
  },
  get: (id) => hrmsApi.get(`${base}/${id}/`),
  add: (data) => hrmsApi.post(`${base}/`, data),
  update: (id, data) => hrmsApi.patch(`${base}/${id}/`, data),
  del: (id) => hrmsApi.delete(`${base}/${id}/`),
});

export const {
  list: getITProvisions,
  get: getITProvisionById,
  add: addITProvision,
  update: updateITProvision,
  del: deleteITProvision,
} = createProvisionApi("it_provisions");

export const {
  list: getFinanceProvisions,
  get: getFinanceProvisionById,
  add: addFinanceProvision,
  update: updateFinanceProvision,
  del: deleteFinanceProvision,
} = createProvisionApi("finance_provisions");

export const {
  list: getAdminProvisions,
  get: getAdminProvisionById,
  add: addAdminProvision,
  update: updateAdminProvision,
  del: deleteAdminProvision,
} = createProvisionApi("admin_provisions");

/* -------------------------------------------------------------------------- */
/*  22.  TERMINATION APIs                                                     */
/* -------------------------------------------------------------------------- */
export const addEmployeeTermination = (data) =>
  hrmsApi.post("employee_termination/", data);
export const getEmployeeTerminationById = (id) =>
  hrmsApi.get(`employee_termination/${id}/`);
export const updateEmployeeTermination = (id, data) =>
  hrmsApi.put(`employee_termination/${id}/`, data);

/* -------------------------------------------------------------------------- */
/*  23.  LETTER SEND & EMAIL LOGS                                            */
/* -------------------------------------------------------------------------- */

/**
 * Get letter send records with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getLetterSend = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allLetters = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `letter_send/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allLetters = [...allLetters, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allLetters,
        pagination: { count: allLetters.length },
      };
    } else {
      const response = await hrmsApi.get(
        `letter_send/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching letter send:", error);
    return { data: [] };
  }
};

export const getLetterSendById = (id) => hrmsApi.get(`letter_send/${id}/`);

export const addLetterSend = (data) => {
  const fd = new FormData();
  if (data.get("name")) fd.append("name", data.get("name"));
  if (data.get("email")) fd.append("email", data.get("email"));
  if (data.get("letter_file"))
    fd.append("letter_file", data.get("letter_file"));
  if (data.get("letter_type"))
    fd.append("letter_type", data.get("letter_type"));
  return hrmsApi.post("letter_send/", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const checkOfferLetter = async (email) => {
  try {
    const resp = await hrmsApi.get("check_offer_letter/", {
      params: { email },
    });
    return resp.data;
  } catch (err) {
    return { offer_letter_sent: false };
  }
};

export const updateLetterSend = (id, data) =>
  hrmsApi.patch(`letter_send/${id}/`, data);
export const deleteLetterSend = (id) => hrmsApi.delete(`letter_send/${id}/`);

/**
 * Get email logs with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getEmailLogs = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allLogs = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `email_logs/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allLogs = [...allLogs, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allLogs,
        pagination: { count: allLogs.length },
      };
    } else {
      const response = await hrmsApi.get(
        `email_logs/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching email logs:", error);
    return { data: [] };
  }
};

export const deleteAllEmailLogs = () =>
  hrmsApi.delete("email_logs/delete_all/");

/* -------------------------------------------------------------------------- */
/*  24.  LEAVE TYPES                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Get leave types with pagination support
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @param {boolean} allPages - Whether to fetch all pages
 * @returns {Promise<Object>} - Response with data and pagination
 */
export const getEmployeeLeaveTypes = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allTypes = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `employee_leave_types/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allTypes = [...allTypes, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allTypes,
        pagination: { count: allTypes.length },
      };
    } else {
      const response = await hrmsApi.get(
        `employee_leave_types/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching leave types:", error);
    return { data: [] };
  }
};

export const updateEmployeeLeaveType = (id, data) =>
  hrmsApi.put(`employee_leave_types/${id}/`, data);

/* -------------------------------------------------------------------------- */
/*  25.  OFFER-LETTER CHECK                                                   */
/* -------------------------------------------------------------------------- */
export const updateInterviewOfferLetterStatus = (interviewId, email) =>
  hrmsApi.patch(`interviews/${interviewId}/`, {
    offer_letter_sent: true,
    email: email,
  });

export const debugCurrentUserData = async () => {
  try {
    console.log("🔍 DEBUG CURRENT USER DATA:");

    const [leavesResponse, balancesResponse, debugResponse] =
      await Promise.allSettled([
        getEmployeeLeaves(1, 100, false),
        getEmployeeLeaveBalances(null, false),
        hrmsApi.get("api/debug_current_user_leaves/"),
      ]);

    return {
      localStorage: {
        employee_id: localStorage.getItem("employee_id"),
        employee_db_id: localStorage.getItem("employee_db_id"),
        employee_name: localStorage.getItem("employee_name"),
      },
      leaves:
        leavesResponse.status === "fulfilled" ? leavesResponse.value.data : [],
      balances:
        balancesResponse.status === "fulfilled"
          ? balancesResponse.value.data
          : [],
      debug:
        debugResponse.status === "fulfilled" ? debugResponse.value.data : null,
    };
  } catch (error) {
    console.error("❌ Debug error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  26.  INVITE / MD SIR                                                      */
/* -------------------------------------------------------------------------- */
export const sendInviteMail = (data) => hrmsApi.post("invitemail/", data);
export const sendMdSirMail = (data) => hrmsApi.post("mdsir/", data);

/* -------------------------------------------------------------------------- */
/*  27.  STATIONERY MANAGEMENT APIs                                           */
/* -------------------------------------------------------------------------- */

/**
 * Get stationery items with pagination support
 */
export const getStationeryItems = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allItems = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `stationery-items/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allItems = [...allItems, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allItems,
        pagination: { count: allItems.length },
      };
    } else {
      const response = await hrmsApi.get(
        `stationery-items/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching stationery items:", error);
    return { data: [] };
  }
};

/**
 * Get stationery usage with pagination support
 */
export const getStationeryUsage = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allUsage = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `stationery-usage/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allUsage = [...allUsage, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allUsage,
        pagination: { count: allUsage.length },
      };
    } else {
      const response = await hrmsApi.get(
        `stationery-usage/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching stationery usage:", error);
    return { data: [] };
  }
};

/**
 * Get stationery transactions with pagination support
 */
export const getStationeryTransactions = async (
  page = 1,
  pageSize = 100,
  allPages = false,
) => {
  try {
    if (allPages) {
      let allTransactions = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await hrmsApi.get(
          `stationery-transactions/?page=${currentPage}&page_size=${pageSize}`,
        );

        if (response.data && response.data.results) {
          allTransactions = [...allTransactions, ...response.data.results];
          hasMore = response.data.next ? true : false;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      return {
        data: allTransactions,
        pagination: { count: allTransactions.length },
      };
    } else {
      const response = await hrmsApi.get(
        `stationery-transactions/?page=${page}&page_size=${pageSize}`,
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
    console.error("❌ Error fetching stationery transactions:", error);
    return { data: [] };
  }
};

/* -------------------------------------------------------------------------- */
/*  28.  FALLBACK RAW REQUEST (rarely needed)                                */
/* -------------------------------------------------------------------------- */
export const apiRequest = async (url, opts = {}) => {
  const token = getToken();
  if (!token) throw new Error("No auth token");

  const resp = await fetch(`${getBackendURL()}${url}`, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      ...opts.headers,
    },
    ...opts,
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
};

/* -------------------------------------------------------------------------- */
/*  EXPORT DEFAULT – ALL EXPORTS IN ONE OBJECT                                */
/* -------------------------------------------------------------------------- */
export default {
  // Core
  hrmsApi,
  chatApi,

  // Auth
  loginUser,
  getToken,
  setToken,
  removeToken,
  debugAuth,
  checkAuthStatus,

  // CSRF
  fetchCsrfToken,
  getCsrfToken,

  // Pagination Helper
  fetchAllPaginatedData,

  // Performance Appraisals
  getPerformanceAppraisals,
  getPerformanceAppraisalById,
  createPerformanceAppraisal,
  addPerformanceAppraisal,
  updatePerformanceAppraisal,
  deletePerformanceAppraisal,
  approveIncrement,
  approveDesignation,
  getPerformanceAppraisalsByEmployeeId,

  // Companies / Departments / Customers
  getCompanies,
  getCompanyById,
  getDepartments,
  getDepartmentById,
  getCustomers,
  getAllCustomers,
  getCustomerById,

  // Employees
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  updateEmployeeImage,
  updateEmployeeCustomers,
  deleteEmployee,

  // Leaves
  getEmployeeLeaves,
  getEmployeeLeaveById,
  addEmployeeLeave,
  updateEmployeeLeave,
  deleteEmployeeLeave,
  getEmployeeLeaveBalances,

  // Leave Types
  getEmployeeLeaveTypes,
  updateEmployeeLeaveType,

  // Attendance
  getAttendance,
  getAttendanceById,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  deleteAllAttendance,
  deleteAttendanceByMonth,

  // Interviews
  getInterviews,
  getInterviewById,
  addInterview,
  updateInterview,
  deleteInterview,

  // CVs
  getCVs,
  getCVById,
  addCV,
  updateCV,
  deleteCV,

  // Provisions
  getITProvisions,
  getITProvisionById,
  addITProvision,
  updateITProvision,
  deleteITProvision,
  getFinanceProvisions,
  getFinanceProvisionById,
  addFinanceProvision,
  updateFinanceProvision,
  deleteFinanceProvision,
  getAdminProvisions,
  getAdminProvisionById,
  addAdminProvision,
  updateAdminProvision,
  deleteAdminProvision,

  // Terminations
  addEmployeeTermination,
  getEmployeeTerminationById,
  updateEmployeeTermination,
  getTerminatedEmployees,
  getTerminatedEmployeeById,
  searchTerminatedEmployees,
  restoreTerminatedEmployee,
  getTerminationStats,
  exportTerminatedEmployees,
  updateTerminationStatus,
  bulkDeleteTerminatedEmployees,
  getTerminationTrends,
  getDepartmentTerminationStats,

  // Notifications
  getNotifications,

  // Stationery
  getStationeryItems,
  getStationeryUsage,
  getStationeryTransactions,

  // Letter Send
  getLetterSend,
  getLetterSendById,
  addLetterSend,
  updateLetterSend,
  deleteLetterSend,

  // Email Logs
  getEmailLogs,
  deleteAllEmailLogs,

  // Offer Letter Check
  checkOfferLetter,

  // Invite / MD Sir
  sendInviteMail,
  sendMdSirMail,

  // Chat
  fetchConversations,
  fetchUsers,
  fetchMessages,
  sendMessage,
  addMemberToConversation,
  createGroupConversation,

  // Test
  testAuth,
  testChatEndpoint,
  testHRMSEndpoint,

  // Fallback
  apiRequest,

  getWeeklyAttendanceStats,
  getTeamLeaves,
  sendWelcomeEmail,
  getEmployeeDetailsByCode,
  addTeamLeaderComment,
  sendLeaveEmailToMD,
  debugEmployeeLeaves,
  debugAllLeaves,
  debugEmployees,
  debugUserEmployeeMapping,
  checkUserEmployeeMapping,
  debugCurrentUserLeaves,
  debugCurrentUserData,

  // Helper
  extractDataFromResponse,
};
