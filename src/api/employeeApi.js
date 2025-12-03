/*  employeeApi.js  –  HRMS + Chat API wrapper  */
import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  1.  CONFIGURATION & TOKEN HELPERS                                         */
/* -------------------------------------------------------------------------- */
export const getBackendURL = () => "http://119.148.51.38:8000";

const getHRMSBaseUrl = () => `${getBackendURL()}/api/hrms/api/`;

/* Token handling – unchanged */
export const getToken = () => {
  const token = localStorage.getItem("token");
  console.log("Retrieved token:", token ? "Yes" : "No");
  return token;
};

export const setToken = (token) => {
  if (!token) return console.warn("Attempting to set empty token");
  localStorage.setItem("token", token);
  localStorage.setItem("token_timestamp", Date.now().toString());
  console.log("Token stored");
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
      console.log("CSRF token from JSON:", _csrfToken);
    } else {
      // Fallback to cookie reading
      _csrfToken = getCsrfTokenFromCookie();
      if (_csrfToken) {
        console.log("CSRF token from cookie after fetch:", _csrfToken);
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

/* -------------------------------------------------------------------------- */
/*  2.  AXIOS INSTANCES (authenticated)                                      */
/* -------------------------------------------------------------------------- */
const createInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 45000,
    withCredentials: true, // Essential for CSRF
  });

  // Enhanced request interceptor with CSRF retry
  // instance.interceptors.request.use(async (cfg) => {
  //   console.log(`🚀 Making ${cfg.method?.toUpperCase()} request to:`, cfg.url);

  //   const token = localStorage.getItem("token");
  //   if (token) {
  //     cfg.headers.Authorization = `Token ${token}`;
  //     console.log("🔑 Auth token added");
  //   }

  //   // CSRF for state-changing requests
  //   if (["post", "patch", "put", "delete"].includes(cfg.method?.toLowerCase())) {
  //     let csrfToken = getCsrfToken();

  //     // If no CSRF token, try to fetch one
  //     if (!csrfToken) {
  //       console.log("🔄 No CSRF token found, fetching...");
  //       csrfToken = await fetchCsrfToken();
  //     }

  //     if (csrfToken) {
  //       cfg.headers["X-CSRFToken"] = csrfToken;
  //       console.log("🔒 CSRF Token sent:", csrfToken.substring(0, 10) + "...");
  //     } else {
  //       console.error("❌ CSRF token missing after fetch attempt!");
  //       // Don't block the request, let it proceed and handle the error
  //     }
  //   }

  //   return cfg;
  // });

  // In the request interceptor, change the CSRF condition:
  instance.interceptors.request.use(async (cfg) => {
    console.log(`🚀 Making ${cfg.method?.toUpperCase()} request to:`, cfg.url);

    const token = localStorage.getItem("token");
    if (token) {
      cfg.headers.Authorization = `Token ${token}`;
      console.log("🔑 Auth token added");
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

  // Enhanced response interceptor with CSRF error handling
  instance.interceptors.response.use(
    (response) => {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${
          response.config.url
        } success:`,
        response.status
      );
      return response;
    },
    async (error) => {
      console.error(`❌ API Error:`, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
      });

      // Handle CSRF errors (403 Forbidden is common for CSRF failures)
      if (error.response?.status === 403 && error.config) {
        console.log("🔄 Possible CSRF error, retrying with fresh token...");

        // Fetch fresh CSRF token
        const newCsrfToken = await fetchCsrfToken(true); // force refresh

        if (newCsrfToken) {
          // Retry the request with new CSRF token
          error.config.headers["X-CSRFToken"] = newCsrfToken;
          console.log("🔄 Retrying request with new CSRF token");
          return instance.request(error.config);
        }
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error("Unauthenticated – logging out");
        removeToken();
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/* HRMS API (all employee / interview / provision endpoints) */
export const hrmsApi = createInstance(getHRMSBaseUrl());

/* Chat API (kept separate – different base URL) */
export const chatApi = createInstance(getBackendURL());

/* -------------------------------------------------------------------------- */
/*  3.  DEBUG / TEST HELPERS                                                 */
/* -------------------------------------------------------------------------- */
export const debugAuth = () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const mode = localStorage.getItem("mode");
  const permissions = localStorage.getItem("permissions");

  console.log("AUTH DEBUG:", { token: !!token, username, mode, permissions });
  return { token: !!token, username, mode, permissions };
};

export const testAuth = () => chatApi.post("/api/auth/test/", { test: "data" });
export const testChatEndpoint = () => chatApi.get("/api/chat/conversations/");
export const testHRMSEndpoint = () => hrmsApi.get("employees/");

/* -------------------------------------------------------------------------- */
/*  4.  AUTHENTICATION                                                       */
/* -------------------------------------------------------------------------- */
// In employeeApi.js - Update the loginUser function
export const loginUser = async (payload) => {
  const { username, password, employee_id, designation, department, email } = payload;

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

  // Store all user data including employee_db_id and reporting_leader
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
  
  // CRITICAL: Add reporting leader information
  store("reporting_leader", data.reporting_leader);

  console.log("📋 Final stored data:", {
    employee_id: localStorage.getItem("employee_id"),
    employee_db_id: localStorage.getItem("employee_db_id"),
    employee_name: localStorage.getItem("employee_name"),
    designation: localStorage.getItem("designation"),
    department: localStorage.getItem("department"),
    reporting_leader: localStorage.getItem("reporting_leader"),
  });

  return data;
};

/* -------------------------------------------------------------------------- */
/*  5.  PERFORMANCE APPRAISAL APIs - ADDED SECTION                          */
/* -------------------------------------------------------------------------- */
export const getPerformanceAppraisals = () =>
  hrmsApi.get("performance_appraisals/");

export const getPerformanceAppraisalById = (id) =>
  hrmsApi.get(`performance_appraisals/${id}/`);

export const createPerformanceAppraisal = (data) =>
  hrmsApi.post("performance_appraisals/", data);

// Use separate function instead of alias to avoid circular dependency
export const addPerformanceAppraisal = (data) =>
  hrmsApi.post("performance_appraisals/", data);

export const updatePerformanceAppraisal = (id, data) =>
  hrmsApi.patch(`performance_appraisals/${id}/`, data);

export const deletePerformanceAppraisal = (id) =>
  hrmsApi.delete(`performance_appraisals/${id}/`);

// In employeeApi.js - REPLACE the existing function
// In your api/employeeApi.js file
// In api/employeeApi.js - Add these functions
export const getPerformanceAppraisalsByEmployeeId = async (employeeId) => {
  try {
    console.log(`🔍 API: Fetching appraisals for employee ${employeeId}`);

    // Try the custom endpoint first
    const response = await api.get(
      `/performance-appraisals/by_employee/?employee_id=${employeeId}`
    );

    console.log(`📊 API Response for ${employeeId}:`, response.data);
    return response;
  } catch (error) {
    console.error(
      `❌ Custom endpoint failed for employee ${employeeId}:`,
      error
    );

    // Fallback: Use main endpoint with query parameter
    try {
      console.log("🔄 Falling back to main endpoint with filter...");
      const response = await api.get(
        `/performance-appraisals/?employee_id=${employeeId}`
      );
      console.log(`📊 Fallback response for ${employeeId}:`, response.data);
      return response;
    } catch (fallbackError) {
      console.error(
        `❌ Fallback also failed for employee ${employeeId}:`,
        fallbackError
      );

      // Last resort: Get all and filter client-side
      try {
        console.log("🔄 Last resort: Client-side filtering...");
        const allResponse = await getPerformanceAppraisals();
        if (allResponse.data) {
          const filtered = allResponse.data.filter(
            (appraisal) => appraisal.employee_id === employeeId
          );
          console.log(`📊 Client-side filtered for ${employeeId}:`, filtered);
          return { data: filtered };
        }
        return { data: [] };
      } catch (finalError) {
        console.error("❌ All methods failed:", finalError);
        throw error;
      }
    }
  }
};

// Helper function to get increment history
export const getIncrementHistory = async (employeeId) => {
  try {
    const response = await getPerformanceAppraisalsByEmployeeId(employeeId);

    if (response.data && Array.isArray(response.data)) {
      // Filter only approved increments
      const incrementHistory = response.data.filter(
        (appraisal) =>
          appraisal.increment === true && appraisal.increment_approved === true
      );

      console.log(`💰 Increment history for ${employeeId}:`, incrementHistory);
      return incrementHistory;
    }

    return [];
  } catch (error) {
    console.error(
      `❌ Error getting increment history for ${employeeId}:`,
      error
    );
    return [];
  }
};
// In employeeApi.js - Fix the approveIncrement function
export const approveIncrement = async (appraisalId) => {
  try {
    console.log("📡 Approving increment for ID:", appraisalId);

    // Call the custom action endpoint - it should be POST to approve_increment/
    const response = await hrmsApi.post(
      `performance_appraisals/${appraisalId}/approve_increment/`,
      {} // Empty body since we don't need to send data for approval
    );

    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Error in approveIncrement:", error);
    console.error("❌ Error details:", error.response?.data);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  6.  EMPLOYEE APIs                                                        */
/* -------------------------------------------------------------------------- */
export const getEmployees = () => hrmsApi.get("employees/");
export const getEmployeeById = (id) => hrmsApi.get(`employees/${id}/`);
export const addEmployee = (data) => hrmsApi.post("employees/", data);
export const updateEmployee = (id, data) =>
  hrmsApi.patch(`employees/${id}/`, data);
export const deleteEmployee = (id) => hrmsApi.delete(`employees/${id}/`);

/* ---- image & customers (partial updates) ---- */
export const updateEmployeeImage = (id, formData) => {
  console.log("=== updateEmployeeImage DEBUG ===");
  console.log("Employee ID:", id);
  console.log("FormData received:", formData);
  
  // Log FormData contents
  if (formData instanceof FormData) {
    for (let [key, value] of formData.entries()) {
      console.log(`FormData - ${key}:`, value);
    }
  }
  
  console.log("=== END DEBUG ===");
  
  return hrmsApi.patch(`employees/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateEmployeeCustomers = (id, customerIds) => {
  console.log("=== updateEmployeeCustomers DEBUG ===");
  console.log("Employee ID:", id);
  console.log("Customer IDs received:", customerIds);
  console.log("Customer IDs type:", typeof customerIds);

  // Ensure we have an array of numbers
  const customersArray = Array.isArray(customerIds)
    ? customerIds.map((id) => parseInt(id)).filter((id) => !isNaN(id))
    : [];

  console.log("Processed customer IDs:", customersArray);

  // Try multiple payload formats to see what works
  const payload = {
    customers: customersArray,
  };

  console.log("Final payload being sent:", payload);
  console.log("=== END DEBUG ===");

  return hrmsApi.patch(`employees/${id}/update_customers/`, payload);
};



// In employeeApi.js - Add this function
export const getTeamLeaves = async () => {
  try {
    console.log("🔍 Getting team leaves via dedicated endpoint...");
    const response = await hrmsApi.get("team_leaves/");
    console.log("✅ Team leaves response:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Error fetching team leaves:", error);
    // Fallback to frontend filtering
    console.log("🔄 Falling back to frontend filtering...");
    return await getEmployeeLeaves();
  }
};


// In employeeApi.js - Update the addEmployeeLeave function
export const addEmployeeLeave = async (data) => {
  try {
    console.log("📝 Creating leave request with data:", data);
    
    // Get current user's reporting leader from localStorage
    const reportingLeader = localStorage.getItem("reporting_leader");
    console.log("👤 Current user reporting leader:", reportingLeader);
    
    // Ensure employee field is properly formatted and include reporting_leader
    const leaveData = {
      ...data,
      employee: parseInt(data.employee), // Ensure it's a number
      employee_code: data.employee_code || localStorage.getItem("employee_id"),
      status: data.status || "pending",
      reporting_leader: reportingLeader || "" // CRITICAL: Add reporting leader
    };
    
    console.log("📦 Final API payload:", leaveData);
    
    const response = await hrmsApi.post("employee_leaves/", leaveData);
    console.log("✅ Leave created successfully:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Error creating leave:", error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
};


/* -------------------------------------------------------------------------- */
/*  7.  CUSTOMER APIs - ADDED MISSING FUNCTION                              */
/* -------------------------------------------------------------------------- */
export const getAllCustomers = () => hrmsApi.get("customers/");
export const getCustomerById = (id) => hrmsApi.get(`customers/${id}/`);

/* -------------------------------------------------------------------------- */
/*  8.  LEAVE BALANCES                                                       */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  8.  LEAVE BALANCES - FIXED VERSION                                       */
/* -------------------------------------------------------------------------- */

// In employeeApi.js - Replace the getEmployeeLeaveBalances function
export const getEmployeeLeaveBalances = async (employeeId = null) => {
  try {
    const effectiveEmployeeId =
      employeeId || localStorage.getItem("employee_id");
    console.log("🔍 Fetching balances for employee:", effectiveEmployeeId);

    const url = `employee_leave_balances/?employee_id=${effectiveEmployeeId}`;
    const response = await hrmsApi.get(url);

    console.log("📊 Raw balances response:", response.data);

    // Return the array directly instead of transforming to single object
    if (response.data && Array.isArray(response.data)) {
      console.log("✅ Returning array of balances:", response.data.length);
      return response;
    } else {
      console.log("⚠️ No balance records found, returning empty array");
      return {
        ...response,
        data: [],
      };
    }
  } catch (error) {
    console.error("❌ Error in getEmployeeLeaveBalances:", error);
    // Return empty array on error
    return {
      data: [],
    };
  }
};

// In employeeApi.js - Add this function

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

// Add to employeeApi.js
export const debugEmployeeLeaves = async () => {
  try {
    console.log("🔍 DEBUG: Fetching all leaves for debugging...");
    const response = await hrmsApi.get("debug_all_leaves/");
    console.log("📊 DEBUG - All leaves:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Debug error:", error);
    throw error;
  }
};




// Add to employeeApi.js - in the DEBUG / TEST HELPERS section

/* -------------------------------------------------------------------------- */
/*  DEBUG & DIAGNOSTIC APIs                                                  */
/* -------------------------------------------------------------------------- */

export const debugAllLeaves = () => 
  hrmsApi.get("debug_all_leaves/");

export const debugEmployees = () => 
  hrmsApi.get("debug_employees/");

export const debugUserEmployeeMapping = () =>
  hrmsApi.get("debug_user_employee_mapping/");

export const checkUserEmployeeMapping = () => 
  hrmsApi.get("check_user_employee_mapping/");


// In employeeApi.js - fix the debugCurrentUserLeaves function
export const debugCurrentUserLeaves = async () => {
  try {
    console.log("🔍 DEBUG: Fetching current user leaves...");
    const response = await hrmsApi.get("api/debug_current_user_leaves/"); // Fixed URL
    console.log("📊 DEBUG - Current user leaves:", response.data);
    return response;
  } catch (error) {
    console.error("❌ Debug error:", error);
    throw error;
  }
};
// Add this helper function to employeeApi.js
const initializeLeaveBalancesForEmployee = async (employeeDbId) => {
  try {
    console.log("🔄 Initializing leave balances for employee:", employeeDbId);
    const response = await hrmsApi.post("initialize_leave_balances/", {
      employee_db_id: employeeDbId,
    });
    console.log("✅ Leave balances initialized:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error initializing leave balances:", error);
    throw error;
  }
};
/* -------------------------------------------------------------------------- */
/*  9.  PERMISSION CHECKS                                                    */
/* -------------------------------------------------------------------------- */
const getPerms = () => JSON.parse(localStorage.getItem("permissions") || "{}");
export const hasFullAccess = () => getPerms().full_access === true;
export const canAccessLeaveRequests = () => getPerms().leave_requests === true;
export const canAccessHRWork = () => getPerms().hr_work === true;

/* -------------------------------------------------------------------------- */
/*  10.  CHAT APIs                                                            */
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
/*  11.  COMPANY / DEPARTMENT APIs                                           */
/* -------------------------------------------------------------------------- */
export const getCompanies = () => hrmsApi.get("tad_groups/");
export const getCompanyById = (id) => hrmsApi.get(`tad_groups/${id}/`);
export const getDepartments = () => hrmsApi.get("departments/");
export const getDepartmentById = (id) => hrmsApi.get(`departments/${id}/`);
export const getCustomers = () => hrmsApi.get("customers/");

/* -------------------------------------------------------------------------- */
/*  12.  NOTIFICATIONS / ATTENDANCE / LEAVE                                  */
/* -------------------------------------------------------------------------- */
export const getNotifications = () => hrmsApi.get("notifications/");

// export const getEmployeeLeaves = () => hrmsApi.get("employee_leaves/");
export const getEmployeeLeaveById = (id) =>
  hrmsApi.get(`employee_leaves/${id}/`);

export const updateEmployeeLeave = (id, data) =>
  hrmsApi.patch(`employee_leaves/${id}/`, data);
export const deleteEmployeeLeave = (id) =>
  hrmsApi.delete(`employee_leaves/${id}/`);





// In employeeApi.js - Add to the ATTENDANCE APIs section

// In employeeApi.js - Update the function
export const getWeeklyAttendanceStats = (startDate, endDate) => {
  return hrmsApi.get("api/weekly_attendance_stats/", {  // Try with api/ prefix
    params: {
      start_date: startDate,
      end_date: endDate
    }
  }).catch(error => {
    console.error('Error with api/ prefix, trying without...', error);
    // Fallback to without api/ prefix
    return hrmsApi.get("weekly_attendance_stats/", {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
  });
};





// In employeeApi.js - Update the addEmployeeLeave function
// export const addEmployeeLeave = async (data) => {
//   try {
//     console.log("📝 Creating leave request with data:", data);
    
//     // Ensure employee field is properly formatted
//     const leaveData = {
//       ...data,
//       employee: parseInt(data.employee), // Ensure it's a number
//       employee_code: data.employee_code || localStorage.getItem("employee_id"),
//       status: data.status || "pending"
//     };
    
//     console.log("📦 Final API payload:", leaveData);
    
//     const response = await hrmsApi.post("employee_leaves/", leaveData);
//     console.log("✅ Leave created successfully:", response.data);
//     return response;
//   } catch (error) {
//     console.error("❌ Error creating leave:", error);
//     console.error("Error details:", error.response?.data);
//     throw error;
//   }
// };


// CORRECT — use hrmsApi (same as all other employee endpoints)
export const sendWelcomeEmail = (employeeId) => {
  console.log("Sending welcome email for employee ID:", employeeId);
  return hrmsApi.post(`employees/${employeeId}/send-welcome-email/`);
};

// Update in employeeApi.js - Fix the getEmployeeDetailsByCode function
export const getEmployeeDetailsByCode = async (employeeCode) => {
  try {
    console.log("🔍 Fetching employee details for code:", employeeCode);
    
    const response = await hrmsApi.get(`employees/?employee_id=${employeeCode}`);
    console.log("✅ Employee search response count:", response.data.length);
    
    if (response.data && response.data.length > 0) {
      // Filter to find the EXACT employee with matching employee_id
      const exactEmployee = response.data.find(emp => 
        emp.employee_id === employeeCode || 
        emp.employee_id?.toString() === employeeCode?.toString()
      );
      
      if (exactEmployee) {
        console.log("🎯 Found exact employee:", exactEmployee.name, "-", exactEmployee.designation);
        return exactEmployee;
      } else {
        console.warn("⚠️ No exact match found for employee code:", employeeCode);
        console.log("📋 Available employees in response:", response.data.map(emp => ({
          id: emp.id,
          name: emp.name,
          employee_id: emp.employee_id,
          designation: emp.designation
        })));
      }
    } else {
      console.warn("⚠️ No employees found in response");
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error fetching employee details:", error);
    return null;
  }
};



/* -------------------------------------------------------------------------- */
/*  13.  ATTENDANCE APIs                                                     */
/* -------------------------------------------------------------------------- */
export const getAttendance = () => hrmsApi.get("attendance/");
export const getAttendanceById = (id) => hrmsApi.get(`attendance/${id}/`);
export const addAttendance = (data) => hrmsApi.post("attendance/", data);
export const updateAttendance = (id, data) =>
  hrmsApi.patch(`attendance/${id}/`, data);
export const deleteAttendance = (id) => hrmsApi.delete(`attendance/${id}/`);
export const deleteAllAttendance = () =>
  hrmsApi.delete("attendance/delete_all/");

/* -------------------------------------------------------------------------- */
/*  14.  INTERVIEWS                                                          */
/* -------------------------------------------------------------------------- */
export const getInterviews = () => hrmsApi.get("interviews/");
export const getInterviewById = (id) => hrmsApi.get(`interviews/${id}/`);
export const addInterview = (data) => hrmsApi.post("interviews/", data);
export const updateInterview = (id, data) =>
  hrmsApi.patch(`interviews/${id}/`, data);
export const deleteInterview = (id) => hrmsApi.delete(`interviews/${id}/`);

/* -------------------------------------------------------------------------- */
/*  15.  CVs                                                                 */
/* -------------------------------------------------------------------------- */
export const getCVs = () => hrmsApi.get("cvs/");
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
/*  16.  PROVISIONS (IT / Finance / Admin)                                   */
/* -------------------------------------------------------------------------- */
const provision = (base) => ({
  list: () => hrmsApi.get(`${base}/`),
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
} = provision("it_provisions");

export const {
  list: getFinanceProvisions,
  get: getFinanceProvisionById,
  add: addFinanceProvision,
  update: updateFinanceProvision,
  del: deleteFinanceProvision,
} = provision("finance_provisions");

export const {
  list: getAdminProvisions,
  get: getAdminProvisionById,
  add: addAdminProvision,
  update: updateAdminProvision,
  del: deleteAdminProvision,
} = provision("admin_provisions");

/* -------------------------------------------------------------------------- */
/*  17.  TERMINATION APIs                                                    */
/* -------------------------------------------------------------------------- */
export const addEmployeeTermination = (data) =>
  hrmsApi.post("employee_termination/", data);
export const getEmployeeTerminationById = (id) =>
  hrmsApi.get(`employee_termination/${id}/`);
export const updateEmployeeTermination = (id, data) =>
  hrmsApi.put(`employee_termination/${id}/`, data);

/* -------------------------------------------------------------------------- */
/*  18.  LETTER SEND & EMAIL LOGS                                            */
/* -------------------------------------------------------------------------- */
export const getLetterSend = () => hrmsApi.get("letter_send/");
export const getLetterSendById = (id) => hrmsApi.get(`letter_send/${id}/`);
export const addLetterSend = (data) => {
  const fd = new FormData();
  
  if (data.get('name')) fd.append("name", data.get('name'));
  if (data.get('email')) fd.append("email", data.get('email'));
  if (data.get('letter_file')) fd.append("letter_file", data.get('letter_file'));
  if (data.get('letter_type')) fd.append("letter_type", data.get('letter_type'));
  
  return hrmsApi.post("letter_send/", fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
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

export const getEmailLogs = () => hrmsApi.get("email_logs/");
export const deleteAllEmailLogs = () =>
  hrmsApi.delete("email_logs/delete_all/");

/* -------------------------------------------------------------------------- */
/*  19.  LEAVE TYPES                                                         */
/* -------------------------------------------------------------------------- */
export const getEmployeeLeaveTypes = () => hrmsApi.get("employee_leave_types/");
export const updateEmployeeLeaveType = (id, data) =>
  hrmsApi.put(`employee_leave_types/${id}/`, data);



/* -------------------------------------------------------------------------- */
/*  20.  OFFER-LETTER CHECK                                                  */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  UPDATE INTERVIEW OFFER LETTER STATUS                                     */
/* -------------------------------------------------------------------------- */




/* -------------------------------------------------------------------------- */
/*  UPDATE INTERVIEW OFFER LETTER STATUS                                     */
/* -------------------------------------------------------------------------- */
export const updateInterviewOfferLetterStatus = (interviewId, email) =>
  hrmsApi.patch(`interviews/${interviewId}/`, { 
    offer_letter_sent: true,
    email: email // Ensure email is included for tracking
  });

// Add to employeeApi.js - Debug function
export const debugCurrentUserData = async () => {
  try {
    console.log("🔍 DEBUG CURRENT USER DATA:");
    console.log("📋 LocalStorage data:", {
      employee_id: localStorage.getItem("employee_id"),
      employee_db_id: localStorage.getItem("employee_db_id"),
      employee_name: localStorage.getItem("employee_name"),
      username: localStorage.getItem("username"),
      user_id: localStorage.getItem("user_id")
    });

    // Test API endpoints
    const [leavesResponse, balancesResponse, debugResponse] = await Promise.all([
      getEmployeeLeaves(),
      getEmployeeLeaveBalances(),
      hrmsApi.get('api/debug_current_user_leaves/')
    ]);

    console.log("📋 Leaves API response:", leavesResponse.data);
    console.log("💰 Balances API response:", balancesResponse.data);
    console.log("🐛 Debug leaves response:", debugResponse.data);

    return {
      localStorage: {
        employee_id: localStorage.getItem("employee_id"),
        employee_db_id: localStorage.getItem("employee_db_id"),
        employee_name: localStorage.getItem("employee_name")
      },
      leaves: leavesResponse.data,
      balances: balancesResponse.data,
      debug: debugResponse.data
    };
  } catch (error) {
    console.error("❌ Debug error:", error);
    throw error;
  }
};

// In employeeApi.js - REPLACE the getEmployeeLeaves function
export const getEmployeeLeaves = async () => {
  try {
    console.log("🔍 Getting employee leaves...");
    
    // Get employee_id from localStorage for better filtering
    const employeeId = localStorage.getItem("employee_id");
    const employeeDbId = localStorage.getItem("employee_db_id");
    
    console.log("📋 Using employee data:", {
      employeeId,
      employeeDbId
    });
    
    let url = "employee_leaves/";
    
    // Add employee_id as query parameter to help backend filtering
    if (employeeId) {
      url += `?employee_id=${employeeId}`;
    }
    
    console.log("🌐 API URL:", url);
    
    const response = await hrmsApi.get(url);
    
    console.log("📋 Leaves API response:", {
      status: response.status,
      data: response.data,
      count: Array.isArray(response.data) ? response.data.length : 'unknown',
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data
    });
    
    // If data is not an array, try to extract from results or convert
    let leavesData = response.data;
    if (response.data && !Array.isArray(response.data)) {
      if (response.data.results && Array.isArray(response.data.results)) {
        leavesData = response.data.results;
        console.log("🔄 Extracted leaves from results:", leavesData.length);
      } else {
        leavesData = [response.data];
        console.log("🔄 Converted single object to array");
      }
    }
    
    console.log("✅ Final leaves data:", leavesData);
    return { ...response, data: leavesData };
    
  } catch (error) {
    console.error("❌ Error fetching leaves:", error);
    console.error("❌ Error details:", error.response?.data);
    
    // Return empty array on error to prevent frontend crashes
    return { data: [] };
  }
};

/* -------------------------------------------------------------------------- */
/*  21.  INVITE / MD SIR                                                     */
/* -------------------------------------------------------------------------- */
export const sendInviteMail = (data) => hrmsApi.post("invitemail/", data);
export const sendMdSirMail = (data) => hrmsApi.post("mdsir/", data);

/* -------------------------------------------------------------------------- */
/*  22.  FALLBACK RAW REQUEST (rarely needed)                                */
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

  // CSRF
  fetchCsrfToken,
  getCsrfToken,

  // Performance Appraisals - NEWLY ADDED
  getPerformanceAppraisals,
  getPerformanceAppraisalById,
  createPerformanceAppraisal,
  addPerformanceAppraisal,
  updatePerformanceAppraisal,
  deletePerformanceAppraisal,
  approveIncrement,
  getPerformanceAppraisalsByEmployeeId,

  // Companies / Departments / Customers
  getCompanies,
  getCompanyById,
  getDepartments,
  getDepartmentById,
  getCustomers,
  getAllCustomers, // ADDED THIS MISSING FUNCTION
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

  // Notifications
  getNotifications,

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
};
