// src/services/finance.js - Complete fixed version
import axios from "axios";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

// Create axios instance with common config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
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
        response.data.find((e) => e.employee_id === employeeId)
      ),
};

// Tax Calculation APIs
export const taxAPI = {
  // Calculate tax
  calculate: (data) => apiClient.post("/calculate/", data),

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
        `Failed to load tax extra for ${employeeId}, using defaults`
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
          }))
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

// Salary Records APIs
export const salaryRecordsAPI = {
  // Get all salary records with optional filtering
  getAllRecords: (params = {}) => 
    apiClient.get('/salary-records/', { params }),

  // Get salary records summary grouped by month/year
  getSummary: () => apiClient.get('/salary-records/summary/'),

  // Get company-wise summary
  getCompanySummary: () => apiClient.get('/salary-records/company-summary/'),

  // Get detailed records for specific month/year
  getMonthlyDetails: (year, month) => 
    apiClient.get(`/salary-records/${year}/${month}/`),

  // Get available years
  getAvailableYears: () => apiClient.get('/salary-records/years/'),

  // Debug endpoint
  getDebugInfo: () => apiClient.get('/salary-records-debug/'),
};

// Approval APIs
export const approvalAPI = {
  // Send approval step
  sendApproval: (data) => apiClient.post("/salary-approval/", data),

  // Get approval status
  getApprovalStatus: (companyName = "All Companies") =>
    apiClient.get(
      `/approval-status/?company_name=${encodeURIComponent(companyName)}`
    ),
};

// Enhanced storage utilities with backend sync
export const storageAPI = {
  // Source Tax Other with backend sync
  getSourceTaxOther: async (employeeId = null) => {
    const localData = JSON.parse(
      localStorage.getItem("sourceTaxOther") || "{}"
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
      })
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
      })
    );
  },

  // Cached Tax Results
  getCachedTaxResults: () =>
    JSON.parse(localStorage.getItem("cachedTaxResults") || "{}"),

  setCachedTaxResults: (data) =>
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

// Full sync - always sync from backend
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

// Force sync for specific employees
export const forceSyncEmployees = async (employeeIds = []) => {
  try {
    console.log(`Force syncing ${employeeIds.length} employees...`);
    const batchResults = await taxAPI.getTaxExtraBatch(employeeIds);

    const sourceTaxOther = JSON.parse(
      localStorage.getItem("sourceTaxOther") || "{}"
    );
    const bonusOverride = JSON.parse(
      localStorage.getItem("bonusOverride") || "{}"
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
        localStorage.getItem("sourceTaxOther") || "{}"
      );
      const localBonusData = JSON.parse(
        localStorage.getItem("bonusOverride") || "{}"
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
      localStorage.getItem("sourceTaxOther") || "{}"
    );
    const localBonusData = JSON.parse(
      localStorage.getItem("bonusOverride") || "{}"
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
    if (e.key === "sourceTaxOther" || e.key === "bonusOverride") {
      console.log("Storage changed in another tab:", e.key);
      callback();
    }
  };

  const handleCustomEvent = (e) => {
    console.log("Custom event received:", e.detail.type);
    callback();
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
  }

  // Also dispatch custom event for immediate response
  window.dispatchEvent(
    new CustomEvent("financeDataUpdated", {
      detail: { type, data },
    })
  );
};

// Utility functions for salary records
export const salaryUtils = {
  // Format currency for display
  formatCurrency: (amount) => {
    if (amount === null || amount === undefined) return '৳0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const abs = Math.abs(num);
    const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
  },

  // Get month name from number
  getMonthName: (monthNumber) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNumber - 1] || 'Unknown';
  },

  // Calculate summary statistics from records
  calculateSummary: (records) => {
    return records.reduce((summary, record) => ({
      totalEmployees: summary.totalEmployees + 1,
      totalGross: summary.totalGross + (record.gross_salary || 0),
      totalNetPay: summary.totalNetPay + (record.net_pay_bank || 0),
      totalAIT: summary.totalAIT + (record.ait || 0),
      totalAdvance: summary.totalAdvance + (record.advance || 0),
      totalCashPayment: summary.totalCashPayment + (record.cash_payment || 0),
      totalAddition: summary.totalAddition + (record.addition || 0),
    }), {
      totalEmployees: 0,
      totalGross: 0,
      totalNetPay: 0,
      totalAIT: 0,
      totalAdvance: 0,
      totalCashPayment: 0,
      totalAddition: 0,
    });
  },

  // Group records by company
  groupByCompany: (records) => {
    return records.reduce((groups, record) => {
      const company = record.company_name || 'Unknown Company';
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
      "SL", "Name", "Employee ID", "Designation", "DOJ",
      "Basic", "House Rent", "Medical", "Conveyance", "Gross Salary",
      "Total Days", "Days Worked", "Absent Days", "Absent Deduction", "Advance",
      "AIT", "Total Deduction", "OT Hours", "Addition", "Cash Payment",
      "Net Pay (Bank)", "Total Payable", "Remarks"
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
        record.remarks || ""
      ];

      if (includeCompany) {
        row.splice(3, 0, record.company_name || 'Unknown Company');
      }

      return row;
    });

    return { headers, rows };
  }
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
};

// Default export
export default apiClient;