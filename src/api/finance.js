// src/services/finance.js - CACHE REMOVED VERSION

import axios from "axios";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

// Create axios instance with common config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Get authentication token from localStorage
const getAuthToken = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken");

  console.log("🔑 Finance API - Token found:", !!token);
  return token;
};

// Get CSRF token function
const getCSRFToken = () => {
  let csrfToken = null;

  if (window._csrfToken) {
    return window._csrfToken;
  }

  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken") {
      csrfToken = value;
      break;
    }
  }

  if (!csrfToken) {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
      csrfToken = csrfMeta.getAttribute("content");
    }
  }

  if (csrfToken) {
    window._csrfToken = csrfToken;
  }

  return csrfToken;
};

// Update the request interceptor in finance.js

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Don't log for blob responses as they can be large
    if (config.responseType !== "blob") {
      console.log(
        `🚀 Finance API - ${config.method?.toUpperCase()} to: ${config.url}`,
      );
    }

    const authToken = getAuthToken();
    if (authToken) {
      config.headers["Authorization"] = `Token ${authToken}`;
    }

    const method = config.method?.toLowerCase();
    if (method && ["post", "patch", "put", "delete"].includes(method)) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Update the response interceptor in finance.js

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // For blob responses (file downloads), don't try to parse as JSON
    if (response.config.responseType === "blob") {
      console.log(`✅ File download response received`);
      return response;
    }
    console.log(
      `✅ Finance API - ${response.config.method?.toUpperCase()} ${response.config.url} success:`,
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

    if (error.response && error.response.status === 401) {
      console.error("Unauthenticated – logging out");
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
      window.location.href = "/login";
    }

    if (error.response?.status === 403 && error.config) {
      console.log("🔄 Possible CSRF error, refreshing CSRF token...");
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

// Employee APIs - NO CACHE
export const employeeAPI = {
  // Get all employees with optional month/year
  getAll: (month, year) => {
    let url = "/employees/";
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return apiClient.get(url);
  },

  // Get employee by ID
  getById: (employeeId) =>
    apiClient
      .get("/employees/")
      .then((response) =>
        response.data.find((e) => e.employee_id === employeeId),
      ),
};

// Tax APIs
export const taxAPI = {
  // Calculate tax (individual)
  calculate: (data) => apiClient.post("/calculate/", data),

  // Save calculated tax to backend
  saveCalculatedTax: (data) =>
    apiClient.post("/save-calculated-tax/", {
      employee_id: data.employee_id,
      calculation_data: data.calculation_data,
      source_other: data.source_other || 0,
      bonus: data.bonus || 0,
      actual_investment: data.actual_investment || 0,
      rpf_monthly: data.rpf_monthly || 0,
      // IMPORTANT: null/undefined means "no manual override -- use the
      // gender default (25,000/50,000)". Don't coerce that to 0.
      source_tax_minimum:
        data.source_tax_minimum === undefined || data.source_tax_minimum === null || data.source_tax_minimum === ""
          ? null
          : data.source_tax_minimum,
      calculated_by: data.calculated_by || "system",
    }),

  // Get saved taxes from backend
  getCalculatedTaxes: (data) =>
    apiClient.post("/get-calculated-taxes/", {
      employee_ids: data.employee_ids,
    }),

  // Clear saved taxes
  clearCalculatedTaxes: (data) =>
    apiClient.post("/clear-calculated-taxes/", {
      employee_id: data.employee_id || null,
    }),

  // Batch calculate taxes for multiple employees
  batchCalculate: async (employeeData) => {
    try {
      const response = await apiClient.post(
        "/batch-calculate/",
        { employees: employeeData },
        {
          timeout: 60000,
        },
      );
      return response;
    } catch (error) {
      console.error("Batch tax calculation failed:", error);
      throw error;
    }
  },

  getAitValue: async (employeeId) => {
    try {
      const response = await apiClient.get(`/get-ait/${employeeId}/`);
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

  saveTaxExtra: (data) => apiClient.post("/save-tax-extra/", data),

  getTaxExtra: async (employeeId) => {
    try {
      const response = await apiClient.get(`/tax-extra/${employeeId}/`);
      return response;
    } catch (error) {
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

  getTaxExtraBatch: async (employeeIds) => {
    try {
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

  // AIT is never deducted at or below this monthly gross salary.
  // Raised from 41,000 -> 43,000 (2026-2027).
  AIT_MIN_SALARY_THRESHOLD: 43000,

  calculateTaxWithSalary: async (
    employeeId,
    monthlySalary,
    gender = "Male",
    sourceOther = 0,
    bonus = null,
    actualInvestment = 0,
    rpfMonthly = 0,
    sourceTaxMinimum = null,
  ) => {
    try {
      if (monthlySalary <= taxAPI.AIT_MIN_SALARY_THRESHOLD) {
        return {
          tax_calculation: {
            monthly_tds: 0,
            should_deduct_tax: false,
            calculated_tax: 0,
            deduction_reason: `Salary at or below ${taxAPI.AIT_MIN_SALARY_THRESHOLD.toLocaleString()} (no deduction)`,
          },
        };
      }

      const response = await apiClient.post("/calculate/", {
        employee_id: employeeId,
        gender,
        source_other: parseFloat(sourceOther) || 0,
        bonus: bonus === null || bonus === undefined ? null : parseFloat(bonus),
        actual_investment: parseFloat(actualInvestment) || 0,
        rpf_monthly: parseFloat(rpfMonthly) || 0,
        // null/undefined -- let the backend use the gender default (25,000/50,000)
        source_tax_minimum:
          sourceTaxMinimum === null || sourceTaxMinimum === undefined || sourceTaxMinimum === ""
            ? null
            : parseFloat(sourceTaxMinimum),
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
  saveSalary: (data) => apiClient.post("/save-salary/", data),

  getAllSalaryRecords: async () => {
    try {
      const response = await salaryRecordsAPI.getAllRecords();
      return response.data;
    } catch (error) {
      console.error("Error fetching salary records:", error);
      throw error;
    }
  },

  checkSalaryRecordsExists: async (month, year, companyName = "") => {
    try {
      const params = { month, year };
      if (companyName && companyName !== "All Companies") {
        params.company_name = companyName;
      }
      const response = await apiClient.get("/check-salary-records-exists/", {
        params,
      });
      return response;
    } catch (error) {
      console.error("Error checking salary records:", error);
      return { data: { exists: false, error: error.message } };
    }
  },
};

// Salary Records APIs
export const salaryRecordsAPI = {
  getAllRecords: (params = {}) => {
    console.log("📡 Finance API - Getting salary records with params:", params);
    const queryString = Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join("&");
    const url = `/salary-records/${queryString ? "?" + queryString : ""}`;
    return apiClient.get(url);
  },

  getSummary: () => apiClient.get("/salary-records/summary/"),
  getCompanySummary: () => apiClient.get("/salary-records/company-summary/"),
  getMonthlyDetails: (year, month) =>
    apiClient.get(`/salary-records/${year}/${month}/`),
  getAvailableYears: () => apiClient.get("/salary-records/years/"),
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

  compareTwoMonths: (params) => {
    const queryString = Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join("&");
    return apiClient.get(`/compare-months/?${queryString}`);
  },

  exportComparisonExcel: (data) => {
    return apiClient.post("/export-comparison-excel/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  generatePaySlipForCompany: (data) => {
    // Ensure we only send plain data, no DOM elements
    const cleanData = {
      company_name: String(data.company_name || ""),
      month: Number(data.month),
      year: Number(data.year),
    };
    console.log("📤 Sending pay slip request:", cleanData);
    return apiClient.post("/generate-pay-slip-for-company/", cleanData, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  generateAllPaySlipsExcel: (data) => {
    // Ensure we only send plain data, no DOM elements
    const cleanData = {
      month: Number(data.month),
      year: Number(data.year),
    };
    console.log("📤 Sending all pay slips request:", cleanData);
    return apiClient.post("/generate-all-pay-slips-excel/", cleanData, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};

// Approval APIs
export const approvalAPI = {
  sendApproval: (data) => apiClient.post("/salary-approval/", data),
  getApprovalStatus: (params) => {
    const defaultParams = {
      company_name: params.company_name || "All Companies",
      month: params.month || new Date().getMonth() + 1,
      year: params.year || new Date().getFullYear(),
    };
    return apiClient.get("/approval-status/", { params: defaultParams });
  },
};

// Storage API - NO CACHE (just localStorage for UI state)
export const storageAPI = {
  // Simple storage without cache invalidation
  setSourceTaxOther: (data) => {
    localStorage.setItem("sourceTaxOther", JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "sourceTaxOther", data },
      }),
    );
  },

  getSourceTaxOther: () => {
    return JSON.parse(localStorage.getItem("sourceTaxOther") || "{}");
  },

  setBonusOverride: (data) => {
    localStorage.setItem("bonusOverride", JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "bonusOverride", data },
      }),
    );
  },

  getBonusOverride: () => {
    return JSON.parse(localStorage.getItem("bonusOverride") || "{}");
  },

  setActualInvestment: (data) => {
    localStorage.setItem("actualInvestment", JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "actualInvestment", data },
      }),
    );
  },

  getActualInvestment: () => {
    return JSON.parse(localStorage.getItem("actualInvestment") || "{}");
  },

  setRpfMonthly: (data) => {
    localStorage.setItem("rpfMonthly", JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "rpfMonthly", data },
      }),
    );
  },

  getRpfMonthly: () => {
    return JSON.parse(localStorage.getItem("rpfMonthly") || "{}");
  },

  // Manual "Source Tax (Minimum)" override, keyed by employee_id.
  // Absence of a key (or a null value) means "use the gender default
  // (25,000 Male / 50,000 Female)" -- NOT 0.
  setSourceTaxMinimum: (data) => {
    localStorage.setItem("sourceTaxMinimum", JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("financeDataUpdated", {
        detail: { type: "sourceTaxMinimum", data },
      }),
    );
  },

  getSourceTaxMinimum: () => {
    return JSON.parse(localStorage.getItem("sourceTaxMinimum") || "{}");
  },

  clearAll: () => {
    localStorage.removeItem("sourceTaxOther");
    localStorage.removeItem("bonusOverride");
    localStorage.removeItem("actualInvestment");
    localStorage.removeItem("rpfMonthly");
    localStorage.removeItem("sourceTaxMinimum");
  },
};

// Bonus APIs
export const bonusAPI = {
  getAll: (params = {}) => {
    const queryString = Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join("&");
    const url = `/bonus/${queryString ? "?" + queryString : ""}`;
    return apiClient.get(url);
  },

  createBonus: (data) => apiClient.post("/bonus/create/", data),
  updateBonus: (recordId, data) =>
    apiClient.put(`/bonus/update/${recordId}/`, data),
  approveBatch: (batchId, data) =>
    apiClient.post(`/bonus/approve/${batchId}/`, data),

  getSummary: (params) => {
    const queryString = Object.keys(params)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
      )
      .join("&");
    return apiClient.get(
      `/bonus/summary/${queryString ? "?" + queryString : ""}`,
    );
  },

  saveBonus: (data) => apiClient.post("/save-bonus/", data),

  checkBonusExists: (month, year, companyName = "") => {
    const params = { month, year };
    if (companyName && companyName !== "All Companies") {
      params.company_name = companyName;
    }
    return apiClient.get("/check-bonus-exists/", { params });
  },

  generateBonusBankTransferExcel: (data) => {
    return apiClient.post("/generate-bonus-bank-transfer-excel/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  generateBonusSheetExcel: (data) => {
    return apiClient.post("/generate-bonus-sheet-excel/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  generateAllCompaniesBonusExcel: (data) => {
    return apiClient.post("/generate-all-companies-bonus-excel/", data, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};

// Utility functions
export const salaryUtils = {
  formatCurrency: (amount) => {
    if (amount === null || amount === undefined) return "৳0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    const abs = Math.abs(num);
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
  },

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
};

// Batch calculation utility
export const batchCalculationUtils = {
  prepareBatchData: (
    employees,
    sourceOtherData = {},
    bonusOverrideData = {},
    actualInvestmentData = {},
    rpfMonthlyData = {},
    sourceTaxMinimumData = {},
  ) => {
    return employees
      .filter((emp) => emp.salary && emp.employee_id)
      .map((emp) => {
        const stm = sourceTaxMinimumData[emp.employee_id];
        return {
          employee_id: emp.employee_id,
          salary: emp.salary,
          gender: emp.gender === "M" ? "Male" : "Female",
          source_other: sourceOtherData[emp.employee_id] || 0,
          bonus: bonusOverrideData[emp.employee_id] || 0,
          actual_investment: actualInvestmentData[emp.employee_id] || 0,
          rpf_monthly: rpfMonthlyData[emp.employee_id] || 0,
          // undefined/null -- backend uses the gender default (25,000/50,000)
          source_tax_minimum: stm === undefined || stm === null || stm === "" ? null : stm,
        };
      });
  },

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

// Cross-tab sync setup
export const setupCrossTabSync = (callback) => {
  const handleStorageChange = (e) => {
    if (
      e.key === "sourceTaxOther" ||
      e.key === "bonusOverride" ||
      e.key === "actualInvestment" ||
      e.key === "rpfMonthly" ||
      e.key === "sourceTaxMinimum"
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

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("financeDataUpdated", handleCustomEvent);
  };
};

export const broadcastUpdate = (type, data) => {
  if (type === "sourceTaxOther") {
    storageAPI.setSourceTaxOther(data);
  } else if (type === "bonusOverride") {
    storageAPI.setBonusOverride(data);
  }

  window.dispatchEvent(
    new CustomEvent("financeDataUpdated", {
      detail: { type, data },
    }),
  );
};

// Main export
export const financeAPI = {
  employee: employeeAPI,
  tax: taxAPI,
  salary: salaryAPI,
  salaryRecords: salaryRecordsAPI,
  approval: approvalAPI,
  storage: storageAPI,
  bonus: bonusAPI,
  utils: salaryUtils,
  batch: batchCalculationUtils,

  salaryRecordsAPI: salaryRecordsAPI,

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

export default apiClient;