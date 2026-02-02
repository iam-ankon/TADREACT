// src/services/finance.js - COMPLETE FIXED VERSION WITH BATCH CALCULATION
import axios from "axios";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

// Create axios instance with common config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // IMPORTANT: For Django CSRF cookies
});

// Get authentication token from localStorage (same as HRMS API)
const getAuthToken = () => {
  // Try multiple storage locations (same as HRMS API)
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken");

  console.log("🔑 Finance API - Token found:", !!token);
  return token;
};

// finance.js - Update the getCSRFToken function

// Get CSRF token function (for Django REST Framework)
const getCSRFToken = () => {
  let csrfToken = null;

  // Method 1: Check memory cache
  if (window._csrfToken) {
    return window._csrfToken;
  }

  // Method 2: Try to get from cookie (Django sets this)
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken") {
      csrfToken = value;
      break;
    }
  }

  // Method 3: Try to get from meta tag (if Django template includes it)
  if (!csrfToken) {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
      csrfToken = csrfMeta.getAttribute("content");
    }
  }

  // Method 4: Try to fetch CSRF token from Django endpoint
  if (!csrfToken && !window._csrfFetching) {
    // Only fetch once
    window._csrfFetching = true;

    fetch(`${API_BASE.replace("/api/tax-calculator", "")}/api/csrf/`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then((data) => {
        if (data && data.csrfToken) {
          window._csrfToken = data.csrfToken;
          csrfToken = data.csrfToken;
        }
      })
      .catch(() => {
        // Silently fail - we're using Token Auth anyway
      })
      .finally(() => {
        window._csrfFetching = false;
      });
  }

  // Cache for future use
  if (csrfToken) {
    window._csrfToken = csrfToken;
  }

  return csrfToken;
};

// Update the request interceptor to be less strict about CSRF
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 Finance API - ${config.method?.toUpperCase()} to: ${config.url}`,
    );

    // 1. Add Django Token Authentication (same as HRMS)
    const authToken = getAuthToken();
    if (authToken) {
      config.headers["Authorization"] = `Token ${authToken}`;
      console.log("🔑 Finance API - Auth token added");
    } else {
      console.warn("⚠️ Finance API - No auth token found!");
    }

    // 2. Add CSRF token for state-changing requests IF AVAILABLE
    // BUT don't warn if not found - Token Auth doesn't require it
    const method = config.method?.toLowerCase();
    if (method && ["post", "patch", "put", "delete"].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
        console.log("🔒 Finance API - CSRF token added");
      }
      // No warning - Token Auth works without CSRF
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add request interceptor - UPDATED with proper auth
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 Finance API - ${config.method?.toUpperCase()} to: ${config.url}`,
    );

    // 1. Add Django Token Authentication (same as HRMS)
    const authToken = getAuthToken();
    if (authToken) {
      config.headers["Authorization"] = `Token ${authToken}`;
      console.log("🔑 Finance API - Auth token added");
    } else {
      console.warn("⚠️ Finance API - No auth token found!");
    }

    // 2. Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
    const method = config.method?.toLowerCase();
    if (method && ["post", "patch", "put", "delete"].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
        console.log("🔒 Finance API - CSRF token added");
      } else {
        console.warn(
          "⚠️ Finance API - No CSRF token found for state-changing request",
        );
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for authentication errors - UPDATED
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ Finance API - ${response.config.method?.toUpperCase()} ${
        response.config.url
      } success:`,
      response.status,
    );
    return response;
  },
  (error) => {
    console.error(`❌ Finance API Error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Handle 401 Unauthorized - redirect to login (same as HRMS API)
    if (error.response && error.response.status === 401) {
      console.error("Unauthenticated – logging out");

      // Clear auth data (same as HRMS)
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

      // Redirect to login page
      window.location.href = "/login";
    }

    // Handle CSRF errors (403 Forbidden)
    if (error.response?.status === 403 && error.config) {
      console.log(
        "🔄 Finance API - Possible CSRF error, refreshing CSRF token...",
      );

      // Try to fetch fresh CSRF token
      const refreshCsrfToken = async () => {
        try {
          const response = await fetch(
            `${API_BASE.replace("/api/tax-calculator", "")}/api/csrf/`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.csrfToken) {
              window._csrfToken = data.csrfToken;
              // Retry the request
              error.config.headers["X-CSRFToken"] = window._csrfToken;
              return apiClient.request(error.config);
            }
          }
        } catch (csrfErr) {
          console.error("Failed to refresh CSRF token:", csrfErr);
        }
        return Promise.reject(error);
      };

      return refreshCsrfToken();
    }

    return Promise.reject(error);
  },
);

// Employee APIs
export const employeeAPI = {
  // Get all employees
  getAll: () => apiClient.get("/employees/"),

  // Get employee by ID
  getById: (employeeId) =>
    apiClient
      .get("/employees/")
      .then((response) =>
        response.data.find((e) => e.employee_id === employeeId),
      ),

  // Get employees with cache
  getEmployeesWithCache: async () => {
    const cacheKey = "employees_cache";
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes

    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheExpiry) {
        console.log("📁 Returning cached employees");
        return { data };
      }
    }

    // Fetch fresh data
    try {
      const response = await employeeAPI.getAll();
      const validEmployees = response.data.filter(
        (e) => e.salary && e.employee_id,
      );

      // Cache the result
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: validEmployees,
          timestamp: Date.now(),
        }),
      );

      console.log("🔄 Fetched fresh employee data");
      return { data: validEmployees };
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      throw error;
    }
  },
};

// Tax Calculation APIs
export const taxAPI = {
  // Calculate tax (individual)
  calculate: (data) => apiClient.post("/calculate/", data),

  // Save calculated tax to backend
  saveCalculatedTax: (data) => apiClient.post("/save-calculated-tax/", data),

  // Get saved taxes from backend
  getCalculatedTaxes: (data) => apiClient.post("/get-calculated-taxes/", data),

  // Clear saved taxes
  clearCalculatedTaxes: (data) =>
    apiClient.post("/clear-calculated-taxes/", data),

  // Batch calculate taxes for multiple employees
  batchCalculate: async (employeeData) => {
    try {
      const response = await apiClient.post(
        "/batch-calculate/",
        { employees: employeeData },
        {
          timeout: 60000, // 60 seconds for large batches
        },
      );
      return response;
    } catch (error) {
      console.error("Batch tax calculation failed:", error);
      throw error;
    }
  },

  getAitValue: async (employeeId, month, year) => {
    try {
      const response = await apiClient.get(
        `/get-ait/${employeeId}/${year}/${month}/`,
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch AIT for ${employeeId}:`, error);
      return {
        ait: 0,
        calculatedAit: 0,
        shouldDeduct: false,
        loading: false,
      };
    }
  },

  // Batch get AIT values for multiple employees
  getAitValuesBatch: async (employeeData) => {
    try {
      const response = await apiClient.post("/batch-get-ait/", {
        employees: employeeData,
      });
      return response.data;
    } catch (error) {
      console.error("Batch AIT fetch failed:", error);
      return {};
    }
  },

  // Save tax extra data
  saveTaxExtra: (data) => apiClient.post("/save-tax-extra/", data),

  // Get tax extra data - with better error handling
  getTaxExtra: async (employeeId) => {
    try {
      const response = await apiClient.get(`/tax-extra/${employeeId}/`);
      return response;
    } catch (error) {
      // If backend fails, return default values
      console.warn(
        `Failed to load tax extra for ${employeeId}, using defaults`,
      );
      return {
        data: {
          source_other: 0,
          bonus: 0,
        },
      };
    }
  },

  // Batch get tax extra data for multiple employees
  getTaxExtraBatch: async (employeeIds) => {
    try {
      // Use Promise.all to fetch multiple employees in parallel
      const promises = employeeIds.map((empId) =>
        taxAPI
          .getTaxExtra(empId)
          .then((response) => ({
            empId,
            data: response.data,
          }))
          .catch((error) => ({
            empId,
            data: { source_other: 0, bonus: 0 },
            error: error.message,
          })),
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("Batch tax extra fetch failed:", error);
      return employeeIds.map((empId) => ({
        empId,
        data: { source_other: 0, bonus: 0 },
      }));
    }
  },

  // Enhanced calculate tax with proper salary validation
  calculateTaxWithSalary: async (
    employeeId,
    monthlySalary,
    gender = "Male",
    sourceOther = 0,
  ) => {
    try {
      // Only calculate tax if salary > 41,000
      if (monthlySalary <= 41000) {
        return {
          tax_calculation: {
            monthly_tds: 0,
            should_deduct_tax: false,
            calculated_tax: 0,
          },
        };
      }

      const response = await apiClient.post("/calculate/", {
        employee_id: employeeId,
        gender,
        source_other: parseFloat(sourceOther) || 0,
        monthly_salary: monthlySalary,
      });

      return response.data;
    } catch (error) {
      console.error("Tax calculation error:", error);
      return {
        tax_calculation: {
          monthly_tds: 0,
          should_deduct_tax: false,
          error: error.message,
        },
      };
    }
  },
};

// Salary APIs
export const salaryAPI = {
  // Save salary data
  saveSalary: (data) => apiClient.post("/save-salary/", data),

  // Get all salary records (backward compatibility)
  getAllSalaryRecords: async () => {
    try {
      const response = await salaryRecordsAPI.getAllRecords();
      return response.data;
    } catch (error) {
      console.error("Error fetching salary records:", error);
      throw error;
    }
  },
};

// // Salary Records APIs
// export const salaryRecordsAPI = {
//   // Get all salary records with optional filtering
//   getAllRecords: (params = {}) => apiClient.get("/salary-records/", { params }),

//   // Get salary records summary grouped by month/year
//   getSummary: () => apiClient.get("/salary-records/summary/"),

//   // Get company-wise summary
//   getCompanySummary: () => apiClient.get("/salary-records/company-summary/"),

//   // Get detailed records for specific month/year
//   getMonthlyDetails: (year, month) =>
//     apiClient.get(`/salary-records/${year}/${month}/`),

//   // Get available years
//   getAvailableYears: () => apiClient.get("/salary-records/years/"),

//   // Debug endpoint
//   getDebugInfo: () => apiClient.get("/salary-records-debug/"),

//   //   // New function for immediate Excel generation
//   // generateExcelNow: (companyName, month, year) => {
//   //   return apiClient.post('/api/generate-excel-now/', {
//   //     company_name: companyName,
//   //     month: month,
//   //     year: year
//   //   }, {
//   //     responseType: 'blob', // Important for file downloads
//   //     headers: {
//   //       'Content-Type': 'application/json',
//   //     }
//   //   });
//   // },

//   generateExcelNow: (data) => {
//     return apiClient.post("/generate-excel-now/", data, {
//       responseType: "blob", // Important for file download
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   },

//   generateBankTransferExcel: (data) => {
//     return apiClient.post("/generate-bank-transfer-excel/", data, {
//       responseType: "blob", // Important for file download
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   },
// };

// Salary Records APIs
export const salaryRecordsAPI = {
  // Get all salary records with optional filtering - FIXED VERSION
  getAllRecords: (params = {}) => {
    console.log("📡 Finance API - Getting salary records with params:", params);

    // Build query string from params
    const queryString = Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join("&");

    const url = `/salary-records/${queryString ? "?" + queryString : ""}`;
    console.log("🌐 Finance API - URL:", url);

    return apiClient.get(url);
  },

  // Get salary records summary grouped by month/year
  getSummary: () => apiClient.get("/salary-records/summary/"),

  // Get company-wise summary
  getCompanySummary: () => apiClient.get("/salary-records/company-summary/"),

  // Get detailed records for specific month/year
  getMonthlyDetails: (year, month) =>
    apiClient.get(`/salary-records/${year}/${month}/`),

  // Get available years
  getAvailableYears: () => apiClient.get("/salary-records/years/"),

  // Debug endpoint
  getDebugInfo: () => apiClient.get("/salary-records-debug/"),

  generateExcelNow: (data) => {
    return apiClient.post("/generate-excel-now/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  generateSalarySheetExcel: (data) => {
    return apiClient.post("/generate-salary-sheet-excel/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  generateAllCompaniesExcel: (data) => {
    return apiClient.post("/generate-all-companies-excel/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};

// In your finance API file - Update approvalAPI
export const approvalAPI = {
  // Send approval step
  sendApproval: (data) => apiClient.post("/salary-approval/", data),

  // Get approval status with month/year parameters
  getApprovalStatus: (params) => {
    // Default to current month/year if not provided
    const defaultParams = {
      company_name: params.company_name || 'All Companies',
      month: params.month || new Date().getMonth() + 1,
      year: params.year || new Date().getFullYear(),
    };
    return apiClient.get("/approval-status/", { params: defaultParams });
  },
};

// Enhanced storage utilities with backend sync and input hashing
export const storageAPI = {
  // Generate input hash for cache validation
  generateInputHash: (employeeId, sourceVal, bonusVal) => {
    return btoa(`${employeeId}_${sourceVal}_${bonusVal}_${Date.now()}`);
  },

  // Store tax result with input hash
  setTaxResultsByEmployee: (employeeId, data, inputHash = null) => {
    const allResults = JSON.parse(localStorage.getItem("taxResults") || "{}");

    // Generate hash if not provided
    if (!inputHash && data) {
      const source = data?.tax_calculation?.source_tax_other || 0;
      const bonus = data?.salary_breakdown?.bonus || 0;
      inputHash = storageAPI.generateInputHash(employeeId, source, bonus);
    }

    allResults[employeeId] = {
      data,
      timestamp: new Date().toISOString(),
      inputHash,
    };

    localStorage.setItem("taxResults", JSON.stringify(allResults));

    // Trigger cross-tab sync
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "taxResults", data: allResults },
      }),
    );

    return true;
  },

  // Get tax results for all or specific employee
  getTaxResultsByEmployee: (employeeId = null) => {
    const allResults = JSON.parse(localStorage.getItem("taxResults") || "{}");

    if (employeeId) {
      return allResults[employeeId] || null;
    }
    return allResults;
  },

  // Get tax result with input validation
  getTaxResult: (employeeId, validateHash = null) => {
    const key = `tax_result_${employeeId}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);

    // Validate input hash if provided
    if (validateHash && parsed.inputHash !== validateHash) {
      return null;
    }

    return parsed;
  },

  // Clear specific tax result
  clearTaxResult: (employeeId) => {
    const allResults = JSON.parse(localStorage.getItem("taxResults") || "{}");
    delete allResults[employeeId];
    localStorage.setItem("taxResults", JSON.stringify(allResults));

    // Also clear individual key for backward compatibility
    localStorage.removeItem(`tax_result_${employeeId}`);
    return true;
  },

  removeTaxResultsByEmployee: (employeeId) =>
    storageAPI.clearTaxResult(employeeId),

  clearAllTaxResults: () => {
    localStorage.removeItem("taxResults");
  },

  // Check if cache is valid with input validation
  isTaxCacheValid: (
    cachedData,
    employeeId = null,
    currentSource = 0,
    currentBonus = 0,
    maxAgeHours = 24,
  ) => {
    if (!cachedData || !cachedData.timestamp) return false;

    // Check timestamp
    const cacheTime = new Date(cachedData.timestamp);
    const now = new Date();
    const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
    if (hoursDiff >= maxAgeHours) return false;

    // Check input hash if employeeId provided
    if (employeeId && cachedData.inputHash) {
      const currentHash = storageAPI.generateInputHash(
        employeeId,
        currentSource,
        currentBonus,
      );
      return cachedData.inputHash === currentHash;
    }

    return true;
  },

  // Get valid cached results for multiple employees with input validation
  getValidTaxResults: (
    employeeIds,
    sourceOtherData = {},
    bonusOverrideData = {},
    maxAgeHours = 24,
  ) => {
    const allResults = JSON.parse(localStorage.getItem("taxResults") || "{}");
    const validResults = {};

    employeeIds.forEach((id) => {
      const cached = allResults[id];
      const currentSource = sourceOtherData[id] || 0;
      const currentBonus = bonusOverrideData[id] || 0;

      if (
        cached &&
        storageAPI.isTaxCacheValid(
          cached,
          id,
          currentSource,
          currentBonus,
          maxAgeHours,
        )
      ) {
        validResults[id] = cached.data;
      }
    });

    return validResults;
  },

  // Backward compatibility
  getCachedTaxResults: () => {
    const allResults = JSON.parse(localStorage.getItem("taxResults") || "{}");
    const simpleResults = {};

    Object.keys(allResults).forEach((id) => {
      simpleResults[id] = allResults[id].data;
    });

    return simpleResults;
  },

  setCachedTaxResults: (data) => {
    const allResults = {};
    Object.keys(data).forEach((id) => {
      allResults[id] = {
        data: data[id],
        timestamp: new Date().toISOString(),
      };
    });
    localStorage.setItem("taxResults", JSON.stringify(allResults));
  },

  // Source Tax Other with backend sync
  getSourceTaxOther: async (employeeId = null) => {
    const localData = JSON.parse(
      localStorage.getItem("sourceTaxOther") || "{}",
    );

    // If specific employee ID provided, try to get from backend first
    if (employeeId) {
      try {
        const backendData = await taxAPI.getTaxExtra(employeeId);
        const backendValue = backendData.data.source_other || 0;

        // Update local storage with backend value
        if (backendValue !== localData[employeeId]) {
          localData[employeeId] = backendValue;
          localStorage.setItem("sourceTaxOther", JSON.stringify(localData));
        }

        return localData;
      } catch (error) {
        console.warn("Failed to sync from backend, using local data");
      }
    }

    return localData;
  },

  setSourceTaxOther: (data) => {
    localStorage.setItem("sourceTaxOther", JSON.stringify(data));
    // Trigger custom event for cross-tab communication
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "sourceTaxOther", data },
      }),
    );
  },

  // Bonus Override with backend sync
  getBonusOverride: async (employeeId = null) => {
    const localData = JSON.parse(localStorage.getItem("bonusOverride") || "{}");

    // If specific employee ID provided, try to get from backend first
    if (employeeId) {
      try {
        const backendData = await taxAPI.getTaxExtra(employeeId);
        const backendValue = backendData.data.bonus || 0;

        // Update local storage with backend value
        if (backendValue !== localData[employeeId]) {
          localData[employeeId] = backendValue;
          localStorage.setItem("bonusOverride", JSON.stringify(localData));
        }

        return localData;
      } catch (error) {
        console.warn("Failed to sync bonus from backend, using local data");
      }
    }

    return localData;
  },

  setBonusOverride: (data) => {
    localStorage.setItem("bonusOverride", JSON.stringify(data));
    // Trigger custom event for cross-tab communication
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "bonusOverride", data },
      }),
    );
  },

  // Cached Tax Results (backward compatibility)
  getLegacyCachedTaxResults: () =>
    JSON.parse(localStorage.getItem("cachedTaxResults") || "{}"),

  setLegacyCachedTaxResults: (data) =>
    localStorage.setItem("cachedTaxResults", JSON.stringify(data)),

  // Salary Manual Data
  getSalaryManualData: () =>
    JSON.parse(localStorage.getItem("salaryManualData") || "{}"),

  setSalaryManualData: (data) =>
    localStorage.setItem("salaryManualData", JSON.stringify(data)),

  // Get last sync timestamp
  getLastSyncTime: () => localStorage.getItem("lastSyncTime") || "0",

  setLastSyncTime: (timestamp) =>
    localStorage.setItem("lastSyncTime", timestamp.toString()),
};

// In finance.js - Add this function
export const syncAllDataFromBackend = async (employeeIds = []) => {
  try {
    console.log(`Full syncing data for ${employeeIds.length} employees...`);

    // Use batch operation to fetch all data at once
    const batchResults = await taxAPI.getTaxExtraBatch(employeeIds);

    const sourceTaxOther = {};
    const bonusOverride = {};

    batchResults.forEach((result) => {
      sourceTaxOther[result.empId] = result.data.source_other || 0;
      bonusOverride[result.empId] = result.data.bonus || 0;
    });

    storageAPI.setSourceTaxOther(sourceTaxOther);
    storageAPI.setBonusOverride(bonusOverride);
    storageAPI.setLastSyncTime(Date.now());

    console.log("Full data sync completed successfully");
    return { sourceTaxOther, bonusOverride };
  } catch (error) {
    console.error("Failed to sync all data from backend:", error);
    return { sourceTaxOther: {}, bonusOverride: {} };
  }
};

// Also add this function to storageAPI
storageAPI.syncAllDataFromBackend = syncAllDataFromBackend;
// Force sync for specific employees
export const forceSyncEmployees = async (employeeIds = []) => {
  try {
    console.log(`Force syncing ${employeeIds.length} employees...`);
    const batchResults = await taxAPI.getTaxExtraBatch(employeeIds);

    const sourceTaxOther = JSON.parse(
      localStorage.getItem("sourceTaxOther") || "{}",
    );
    const bonusOverride = JSON.parse(
      localStorage.getItem("bonusOverride") || "{}",
    );

    batchResults.forEach((result) => {
      sourceTaxOther[result.empId] = result.data.source_other || 0;
      bonusOverride[result.empId] = result.data.bonus || 0;
    });

    storageAPI.setSourceTaxOther(sourceTaxOther);
    storageAPI.setBonusOverride(bonusOverride);

    return { sourceTaxOther, bonusOverride };
  } catch (error) {
    console.error("Force sync failed:", error);
    throw error;
  }
};

// Smart sync - sync only if data is old or missing
export const smartSyncData = async (employeeIds = []) => {
  try {
    const lastSyncTime = parseInt(storageAPI.getLastSyncTime());
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes ago

    // If we synced recently, use local data
    if (lastSyncTime > fiveMinutesAgo) {
      console.log("Using recent local data, skipping sync");
      const localSourceData = JSON.parse(
        localStorage.getItem("sourceTaxOther") || "{}",
      );
      const localBonusData = JSON.parse(
        localStorage.getItem("bonusOverride") || "{}",
      );
      return {
        sourceTaxOther: localSourceData,
        bonusOverride: localBonusData,
        synced: false,
      };
    }

    console.log(`Smart syncing ${employeeIds.length} employees...`);
    return await syncAllDataFromBackend(employeeIds);
  } catch (error) {
    console.error("Smart sync failed:", error);
    const localSourceData = JSON.parse(
      localStorage.getItem("sourceTaxOther") || "{}",
    );
    const localBonusData = JSON.parse(
      localStorage.getItem("bonusOverride") || "{}",
    );
    return {
      sourceTaxOther: localSourceData,
      bonusOverride: localBonusData,
      synced: false,
    };
  }
};

// Listen for storage changes across browser tabs
export const setupCrossTabSync = (callback) => {
  const handleStorageChange = (e) => {
    if (
      e.key === "sourceTaxOther" ||
      e.key === "bonusOverride" ||
      e.key === "taxResults"
    ) {
      console.log("Storage changed in another tab:", e.key);
      if (callback) callback();
    }
  };

  const handleCustomEvent = (e) => {
    console.log("Custom event received:", e.detail.type);
    if (callback) callback(e);
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("financeDataUpdated", handleCustomEvent);

  // Return cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("financeDataUpdated", handleCustomEvent);
  };
};

// Broadcast update to other tabs
export const broadcastUpdate = (type, data) => {
  // Update localStorage (triggers storage event)
  if (type === "sourceTaxOther") {
    storageAPI.setSourceTaxOther(data);
  } else if (type === "bonusOverride") {
    storageAPI.setBonusOverride(data);
  } else if (type === "taxResults") {
    localStorage.setItem("taxResults", JSON.stringify(data));
  }

  // Also dispatch custom event for immediate response
  window.dispatchEvent(
    new CustomEvent("financeDataUpdated", {
      detail: { type, data },
    }),
  );
};

// Utility functions for salary records
export const salaryUtils = {
  // Format currency for display
  formatCurrency: (amount) => {
    if (amount === null || amount === undefined) return "৳0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    const abs = Math.abs(num);
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
  },

  // Get month name from number
  getMonthName: (monthNumber) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[monthNumber - 1] || "Unknown";
  },

  // Calculate summary statistics from records
  calculateSummary: (records) => {
    return records.reduce(
      (summary, record) => ({
        totalEmployees: summary.totalEmployees + 1,
        totalGross: summary.totalGross + (record.gross_salary || 0),
        totalNetPay: summary.totalNetPay + (record.net_pay_bank || 0),
        totalAIT: summary.totalAIT + (record.ait || 0),
        totalAdvance: summary.totalAdvance + (record.advance || 0),
        totalCashPayment: summary.totalCashPayment + (record.cash_payment || 0),
        totalAddition: summary.totalAddition + (record.addition || 0),
      }),
      {
        totalEmployees: 0,
        totalGross: 0,
        totalNetPay: 0,
        totalAIT: 0,
        totalAdvance: 0,
        totalCashPayment: 0,
        totalAddition: 0,
      },
    );
  },

  // Group records by company
  groupByCompany: (records) => {
    return records.reduce((groups, record) => {
      const company = record.company_name || "Unknown Company";
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(record);
      return groups;
    }, {});
  },

  // Export data to Excel format
  prepareExportData: (records, includeCompany = false) => {
    const headers = [
      "SL",
      "Name",
      "Employee ID",
      "Designation",
      "DOJ",
      "Basic",
      "House Rent",
      "Medical",
      "Conveyance",
      "Gross Salary",
      "Total Days",
      "Days Worked",
      "Absent Days",
      "Absent Deduction",
      "Advance",
      "AIT",
      "Total Deduction",
      "OT Hours",
      "Addition",
      "Cash Payment",
      "Net Pay (Bank)",
      "Total Payable",
      "Remarks",
    ];

    if (includeCompany) {
      headers.splice(3, 0, "Company");
    }

    const rows = records.map((record, index) => {
      const row = [
        index + 1,
        record.name,
        record.employee_id,
        record.designation,
        record.doj,
        record.basic || 0,
        record.house_rent || 0,
        record.medical || 0,
        record.conveyance || 0,
        record.gross_salary || 0,
        record.total_days || 0,
        record.days_worked || 0,
        record.absent_days || 0,
        record.absent_ded || 0,
        record.advance || 0,
        record.ait || 0,
        record.total_ded || 0,
        record.ot_hours || 0,
        record.addition || 0,
        record.cash_payment || 0,
        record.net_pay_bank || 0,
        record.total_payable || 0,
        record.remarks || "",
      ];

      if (includeCompany) {
        row.splice(3, 0, record.company_name || "Unknown Company");
      }

      return row;
    });

    return { headers, rows };
  },
};

// Batch calculation utility
export const batchCalculationUtils = {
  // Prepare batch data for calculation
  prepareBatchData: (
    employees,
    sourceOtherData = {},
    bonusOverrideData = {},
  ) => {
    return employees
      .filter((emp) => emp.salary && emp.employee_id)
      .map((emp) => ({
        employee_id: emp.employee_id,
        salary: emp.salary,
        gender: emp.gender === "M" ? "Male" : "Female",
        source_other: sourceOtherData[emp.employee_id] || 0,
        bonus: bonusOverrideData[emp.employee_id] || 0,
      }));
  },

  // Process batch results
  processBatchResults: (batchResults, employeeIds) => {
    const results = {};
    const errors = [];

    employeeIds.forEach((empId) => {
      const result = batchResults[empId];
      if (result && !result.error) {
        results[empId] = result;
      } else if (result?.error) {
        errors.push({ empId, error: result.error });
      }
    });

    return { results, errors };
  },
};

// Export all APIs as a single object for easy importing
export const financeAPI = {
  employee: employeeAPI,
  tax: taxAPI,
  salary: salaryAPI,
  salaryRecords: salaryRecordsAPI,
  approval: approvalAPI,
  storage: storageAPI,
  utils: salaryUtils,
  batch: batchCalculationUtils,

  salaryRecordsAPI: salaryRecordsAPI,

  // Batch calculation method
  batchCalculateTaxes: async (
    employees,
    sourceOtherData = {},
    bonusOverrideData = {},
  ) => {
    try {
      const batchData = batchCalculationUtils.prepareBatchData(
        employees,
        sourceOtherData,
        bonusOverrideData,
      );

      if (batchData.length === 0) {
        return { results: {}, errors: [] };
      }

      const response = await taxAPI.batchCalculate({ employees: batchData });

      if (response.data.success) {
        const employeeIds = batchData.map((emp) => emp.employee_id);
        return batchCalculationUtils.processBatchResults(
          response.data.results,
          employeeIds,
        );
      }

      return { results: {}, errors: [{ error: "Batch calculation failed" }] };
    } catch (error) {
      console.error("Batch tax calculation error:", error);
      return { results: {}, errors: [{ error: error.message }] };
    }
  },
};

// Default export
export default apiClient;
