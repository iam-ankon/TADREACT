import axios from "axios";

// ========== BASE URL CONFIGURATION ==========

export const getBackendURL = () => {
  return "http://119.148.51.38:8000";
};

// Auto-detect API base URL depending on where frontend is accessed from
const getHRMSBaseUrl = () => {
  const hostname = window.location.hostname;

  if (hostname === "192.168.5.242") {
    return "http://119.148.51.38:8000/api/hrms/api/";
  } else if (hostname === "0.0.0.0") {
    return "http://119.148.51.38:8000/api/hrms/api/";
  } else {
    return "http://119.148.51.38:8000/api/hrms/api/"; // Fallback for 192.168.5.242
  }
};

// ========== TOKEN MANAGEMENT ==========
export const getToken = () => {
  const token = localStorage.getItem("token");
  console.log("Retrieved token from localStorage:", token ? "Yes" : "No");
  return token;
};

const api = axios.create({
  baseURL: getBackendURL(),
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`; // ← Token prefix
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export const setToken = (token) => {
  localStorage.setItem("token", token);
  console.log("Token stored in localStorage");
};

export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("user_id");
  console.log("Tokens removed from localStorage");
};

// ========== AXIOS INSTANCE CONFIGURATION ==========
// Create main axios instance with base configuration
const createAuthenticatedInstance = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL,
  });

  // Add token interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Token ${token}`;
        console.log("Authorization header set with token for:", config.url);
      } else {
        console.warn("No token found for request:", config.url);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle responses
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        console.log("Unauthorized, removing token");
        removeToken();
        // Redirect to login if needed
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create authenticated instances for different APIs
const hrmsApi = createAuthenticatedInstance(getHRMSBaseUrl());
const chatApi = createAuthenticatedInstance(getBackendURL());

// ========== TEST ENDPOINTS ==========
export const testAuth = async () => {
  const response = await chatApi.post("/api/auth/test/", { test: "data" });
  return response.data;
};

export const testChatEndpoint = async () => {
  const response = await chatApi.get("/api/chat/conversations/");
  return response.data;
};

export const testHRMSEndpoint = async () => {
  const response = await hrmsApi.get("employees/");
  return response.data;
};

// api/employeeApi.js - Add these functions
export const apiRequest = async (url, options = {}) => {
  const authToken = getToken();
  if (!authToken) {
    throw new Error("No authentication token found");
  }

  const defaultOptions = {
    headers: {
      Authorization: `Token ${authToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(`${getBackendURL()}${url}`, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Specific API functions
export const fetchMessages = async (conversationId) => {
  return apiRequest(`/api/chat/conversations/${conversationId}/messages/`);
};

export const fetchConversations = async () => {
  return apiRequest("/api/chat/conversations/");
};

export const fetchUsers = async () => {
  return apiRequest("/api/chat/users/");
};

export const createGroupConversation = async (groupName, userIds) => {
  return apiRequest("/api/chat/conversations/", {
    method: "POST",
    body: JSON.stringify({
      title: groupName,
      is_group: true,
      members: userIds,
    }),
  });
};

// ========== AUTHENTICATION API ==========
// ========== AUTHENTICATION API ==========
export const loginUser = async (payload) => {
  const { username, password, employee_id, designation } = payload;

  console.log(`Attempting login at: ${getBackendURL()}/users/login/`);
  console.log("Login payload:", { username, employee_id, designation });

  // Use fetch for login since we don't have token yet
  const response = await fetch(`${getBackendURL()}/users/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
      employee_id: employee_id,
      designation: designation,
    }),
  });

  console.log("Login response status:", response.status);

  if (!response.ok) {
    let errorMessage = "Login failed. Please try again.";

    if (response.status === 401) {
      errorMessage = "Invalid credentials";
    } else if (response.status === 404) {
      errorMessage = "Login endpoint not found. Please check the server.";
    } else if (response.status >= 500) {
      errorMessage = "Server error. Please try again later.";
    }

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.detail || errorMessage;
    } catch (e) {
      // If response is not JSON (like HTML error page), use default message
      console.error("Error parsing error response:", e);
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log("Login successful, received data:", data);

  // Store token and user data
  setToken(data.token);
  localStorage.setItem("username", data.username);
  localStorage.setItem("user_id", data.user_id);
  localStorage.setItem("employee_id", data.employee_id);
  localStorage.setItem("employee_name", data.employee_name);
  localStorage.setItem("designation", data.designation);
  localStorage.setItem("permissions", JSON.stringify(data.permissions));

  return data;
};

// Add permission check helper functions
export const hasFullAccess = () => {
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  return permissions.full_access === true;
};

export const canAccessLeaveRequests = () => {
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  return permissions.leave_requests === true;
};

export const canAccessHRWork = () => {
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  return permissions.hr_work === true;
};

export const createDirectConversation = async (userId) => {
  const response = await chatApi.post("/api/chat/conversations/", {
    user_id: userId,
    is_group: false,
  });
  return response.data;
};

export const addMemberToConversation = async (conversationId, userId) => {
  const response = await chatApi.post(
    `/api/chat/conversations/${conversationId}/add_member/`,
    {
      user_id: userId,
    }
  );
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await chatApi.post("/api/chat/messages/", {
    conversation: conversationId,
    content: content,
  });
  return response.data;
};

// ========== COMPANY APIs ==========
export const getCompanies = () => hrmsApi.get("companies/");
export const getCompanyById = (id) => hrmsApi.get(`companies/${id}/`);
export const getDepartments = () => hrmsApi.get("departments/");
export const getDepartmentById = (id) => hrmsApi.get(`departments/${id}/`);

// ========== EMPLOYEE APIs ==========
export const getEmployees = () => hrmsApi.get("employees/");
export const getEmployeeById = (id) => hrmsApi.get(`employees/${id}/`);
export const updateEmployee = (id, data) =>
  hrmsApi.put(`employees/${id}/`, data);
export const addEmployee = (data) => hrmsApi.post("employees/", data);
export const deleteEmployee = (id) => hrmsApi.delete(`employees/${id}/`);

// ========== NOTIFICATIONS APIs ==========
export const getNotifications = () => hrmsApi.get("notifications/");

// ========== ATTENDANCE APIs ==========
export const getAttendance = () => hrmsApi.get("attendance/");
export const getAttendanceById = (id) => hrmsApi.get(`attendance/${id}/`);
export const updateAttendance = (id, data) =>
  hrmsApi.put(`attendance/${id}/`, data);
export const deleteAttendance = (id) => hrmsApi.delete(`attendance/${id}/`);
export const deleteAllAttendance = () =>
  hrmsApi.delete("attendance/delete_all/");

export const addAttendance = (data) => {
  return hrmsApi.post("attendance/", {
    employee: data.employee,
    check_in: data.check_in,
    check_out: data.check_out,
    office_start_time: data.office_start_time,
    attendance_delay: data.attendance_delay,
  });
};

// ========== LEAVE APIs ==========
export const getEmployeeLeaves = () => hrmsApi.get("employee_leaves/");
export const getEmployeeLeaveById = (id) =>
  hrmsApi.get(`employee_leaves/${id}/`);
export const updateEmployeeLeave = (id, data) =>
  hrmsApi.put(`employee_leaves/${id}/`, data);
export const addEmployeeLeave = (data) =>
  hrmsApi.post("employee_leaves/", data);
export const deleteEmployeeLeave = (id) =>
  hrmsApi.delete(`employee_leaves/${id}/`);

// ========== INTERVIEWS APIs ==========
export const getInterviews = () => hrmsApi.get("interviews/");
export const getInterviewById = (id) => hrmsApi.get(`interviews/${id}/`);
export const updateInterview = (id, data) =>
  hrmsApi.put(`interviews/${id}/`, data);
export const addInterview = (data) => hrmsApi.post("interviews/", data);
export const deleteInterview = (id) => hrmsApi.delete(`interviews/${id}/`);

// ========== CVS APIs ==========
export const getCVs = () => hrmsApi.get("cvs/");
export const getCVById = (id) => hrmsApi.get(`cvs/${id}/`);
export const updateCV = (id, data) => hrmsApi.put(`cvs/${id}/`, data);
export const addCV = (data) => {
  const formData = new FormData();
  formData.append("employee", data.employee);
  formData.append("cv_file", data.cv_file);
  return hrmsApi.post("cvs/", formData);
};
export const deleteCV = (id) => hrmsApi.delete(`cvs/${id}/`);

// ========== IT PROVISIONS APIs ==========
export const getITProvisions = () => hrmsApi.get("it_provisions/");
export const getITProvisionById = (id) => hrmsApi.get(`it_provisions/${id}/`);
export const updateITProvision = (id, data) =>
  hrmsApi.put(`it_provisions/${id}/`, data);
export const addITProvision = (data) => hrmsApi.post("it_provisions/", data);
export const deleteITProvision = (id) => hrmsApi.delete(`it_provisions/${id}/`);

// ========== FINANCE PROVISIONS APIs ==========
export const getFinanceProvisions = () => hrmsApi.get("finance_provisions/");
export const getFinanceProvisionById = (id) =>
  hrmsApi.get(`finance_provisions/${id}/`);
export const updateFinanceProvision = (id, data) =>
  hrmsApi.put(`finance_provisions/${id}/`, data);
export const addFinanceProvision = (data) =>
  hrmsApi.post("finance_provisions/", data);
export const deleteFinanceProvision = (id) =>
  hrmsApi.delete(`finance_provisions/${id}/`);

// ========== ADMIN PROVISIONS APIs ==========
export const getAdminProvisions = () => hrmsApi.get("admin_provisions/");
export const getAdminProvisionById = (id) =>
  hrmsApi.get(`admin_provisions/${id}/`);
export const updateAdminProvision = (id, data) =>
  hrmsApi.put(`admin_provisions/${id}/`, data);
export const addAdminProvision = (data) =>
  hrmsApi.post("admin_provisions/", data);
export const deleteAdminProvision = (id) =>
  hrmsApi.delete(`admin_provisions/${id}/`);

// ========== LETTER SEND APIs ==========
export const getLetterSend = () => hrmsApi.get("letter_send/");
export const getLetterSendById = (id) => hrmsApi.get(`letter_send/${id}/`);
export const updateLetterSend = (id, data) =>
  hrmsApi.put(`letter_send/${id}/`, data);
export const addLetterSend = (data) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("email", data.email);
  formData.append("letter_file", data.letter_file);
  formData.append("letter_type", data.letter_type);
  return hrmsApi.post("letter_send/", formData);
};
export const deleteLetterSend = (id) => hrmsApi.delete(`letter_send/${id}/`);

// ========== EMAIL LOG APIs ==========
export const getEmailLogs = () => hrmsApi.get("email_logs/");
export const deleteAllEmailLogs = () =>
  hrmsApi.delete("email_logs/delete_all/");

// Export the API instances for direct use if needed
export { hrmsApi, chatApi };
