/* supplierApi.js – Supplier Management API wrapper */
import axios from "axios";

/* -------------------------------------------------------------------------- */
/*  1.  BASE CONFIGURATION                                                   */
/* -------------------------------------------------------------------------- */
export const getBackendURL = () => "http://119.148.51.38:8000";

const getBaseUrl = () => `${getBackendURL()}/api/merchandiser/api/`;

/* -------------------------------------------------------------------------- */
/*  2.  CSRF & AUTH HELPERS (Reuse from employeeApi)                         */
/* -------------------------------------------------------------------------- */
let _csrfToken = null;
let _csrfFetchInProgress = false;

// Get CSRF token from cookies
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
  if (_csrfToken) {
    console.log("🔐 Using cached CSRF token");
    return _csrfToken;
  }

  const tokenFromCookie = getCsrfTokenFromCookie();
  if (tokenFromCookie) {
    _csrfToken = tokenFromCookie;
    return _csrfToken;
  }

  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    _csrfToken = metaTag.getAttribute("content");
    console.log("🏷️ CSRF token found in meta tag");
    return _csrfToken;
  }

  const tokenFromStorage = localStorage.getItem("csrftoken");
  if (tokenFromStorage) {
    _csrfToken = tokenFromStorage;
    console.log("💾 CSRF token found in localStorage");
    return tokenFromStorage;
  }

  console.warn("❌ No CSRF token found!");
  return null;
};

export const fetchCsrfToken = async (forceRefresh = false) => {
  if (_csrfToken && !forceRefresh) {
    console.log("Using cached CSRF token");
    return _csrfToken;
  }

  if (_csrfFetchInProgress) {
    console.log("CSRF fetch already in progress, waiting...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (_csrfToken) return _csrfToken;
  }

  _csrfFetchInProgress = true;

  try {
    console.log("Fetching CSRF token...");

    const response = await fetch(`${getBackendURL()}/api/csrf/`, {
      method: "GET",
      credentials: "include",
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

    if (data.csrfToken) {
      _csrfToken = data.csrfToken;
      console.log("CSRF token from JSON:", _csrfToken);
    } else {
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
    _csrfToken = getCsrfTokenFromCookie();
    return _csrfToken;
  } finally {
    _csrfFetchInProgress = false;
  }
};

/* -------------------------------------------------------------------------- */
/*  3.  AXIOS INSTANCE                                                       */
/* -------------------------------------------------------------------------- */
const createSupplierInstance = () => {
  const instance = axios.create({
    baseURL: getBaseUrl(),
    timeout: 45000,
    withCredentials: true,
  });

  instance.interceptors.request.use(async (config) => {
    console.log(
      `🚀 Making ${config.method?.toUpperCase()} request to:`,
      config.url,
    );

    // Add Authorization token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log("🔑 Auth token added");
    }

    // Add CSRF token for state-changing requests
    const method = config.method?.toLowerCase();
    if (method && ["post", "patch", "put", "delete"].includes(method)) {
      let csrfToken = getCsrfToken();

      if (!csrfToken) {
        console.log("🔄 No CSRF token found, fetching...");
        csrfToken = await fetchCsrfToken();
      }

      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
        console.log("🔒 CSRF Token sent:", csrfToken.substring(0, 10) + "...");
      } else {
        console.warn("⚠️ CSRF token missing for state-changing request");
      }
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} success:`,
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
      });

      // Handle CSRF errors
      if (error.response?.status === 403 && error.config) {
        console.log("🔄 Possible CSRF error, retrying with fresh token...");
        const newCsrfToken = await fetchCsrfToken(true);
        if (newCsrfToken) {
          error.config.headers["X-CSRFToken"] = newCsrfToken;
          console.log("🔄 Retrying request with new CSRF token");
          return instance.request(error.config);
        }
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error("Unauthenticated – redirecting to login");
        window.location.href = "/login";
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

const supplierApi = createSupplierInstance();

/* -------------------------------------------------------------------------- */
/*  4.  SUPPLIER API FUNCTIONS                                               */
/* -------------------------------------------------------------------------- */

// Get all suppliers with optional filtering
export const getSuppliers = (params = {}) => {
  console.log("📡 Fetching suppliers with params:", params);
  return supplierApi.get("supplier/", { params });
};

// Get single supplier by ID
export const getSupplierById = (id) => {
  console.log(`📡 Fetching supplier ID: ${id}`);
  return supplierApi.get(`supplier/${id}/`);
};

// Helper function to convert FormData to object
const formDataToObject = (formData) => {
  const obj = {};
  if (formData instanceof FormData) {
    for (let [key, value] of formData.entries()) {
      // Handle multiple values for same key
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          obj[key].push(value);
        } else {
          obj[key] = [obj[key], value];
        }
      } else {
        obj[key] = value;
      }
    }
  } else if (typeof formData === "object") {
    // If it's already an object, return it
    return formData;
  }
  return obj;
};

// Create new supplier
export const createSupplier = async (supplierData) => {
  console.log("📝 Creating new supplier:", supplierData);

  try {
    // Convert FormData to object if needed
    const data = formDataToObject(supplierData);

    // Special handling for email field - if empty, don't send it
    if (data.email === "" || data.email === null || data.email === undefined) {
      delete data.email;
    }

    // Handle file fields separately
    const formDataToSend = new FormData();
    const jsonData = {};

    // Separate files and regular data
    Object.keys(data).forEach((key) => {
      const value = data[key];

      if (
        value instanceof File ||
        (typeof value === "object" && value?.type?.startsWith?.("application/"))
      ) {
        // It's a file or file-like object
        formDataToSend.append(key, value);
      } else if (value === null || value === undefined || value === "") {
        // Skip empty values for non-file fields
        // Don't append empty strings
      } else if (typeof value === "boolean") {
        jsonData[key] = value;
      } else {
        jsonData[key] = value;
      }
    });

    // If there are no files, send as JSON
    if (formDataToSend.keys().next().done) {
      // No files, send as JSON
      console.log("📦 Sending JSON data:", jsonData);
      const response = await supplierApi.post("supplier/", jsonData);
      console.log("✅ Supplier created successfully:", response.data);
      return response;
    } else {
      // Has files, send as FormData
      // Add JSON data as stringified JSON
      formDataToSend.append("data", JSON.stringify(jsonData));

      console.log("📦 Sending FormData with files");
      const response = await supplierApi.post("supplier/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Supplier created successfully:", response.data);
      return response;
    }
  } catch (error) {
    console.error(
      "❌ Error creating supplier:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Update existing supplier
export const updateSupplier = async (id, supplierData) => {
  console.log(`📝 Updating supplier ID: ${id}`);

  try {
    // Check if supplierData is FormData
    const isFormData = supplierData instanceof FormData;

    if (isFormData) {
      // Log FormData contents for debugging
      console.log("📦 Sending FormData with fields:");
      for (let pair of supplierData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File - ${pair[1].name}`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      const response = await supplierApi.patch(
        `supplier/${id}/`,
        supplierData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      console.log("✅ Supplier updated successfully:", response.data);
      return response;
    } else {
      // Handle regular JSON data
      console.log("📦 Sending JSON data:", supplierData);
      const response = await supplierApi.patch(`supplier/${id}/`, supplierData);
      console.log("✅ Supplier updated successfully:", response.data);
      return response;
    }
  } catch (error) {
    console.error(
      "❌ Error updating supplier:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Delete supplier
export const deleteSupplier = (id) => {
  console.log(`🗑️ Deleting supplier ID: ${id}`);
  return supplierApi.delete(`supplier/${id}/`);
};

// Search suppliers
export const searchSuppliers = (query) => {
  return supplierApi.get("supplier/", {
    params: {
      search: query,
    },
  });
};

// Get suppliers by status
export const getSuppliersByStatus = (status) => {
  return supplierApi.get("supplier/", {
    params: {
      agreement_status: status,
    },
  });
};

// Get dashboard statistics
export const getSupplierStats = () => {
  return supplierApi.get("supplier/dashboard_stats/");
};

// Get dashboard expiry summary
export const getDashboardExpirySummary = () => {
  return supplierApi.get("supplier/dashboard_expiry_summary/");
};

// Send bulk reminders
export const sendBulkReminders = (fromEmail = "niloy@texweave.net") => {
  return supplierApi.post("supplier/send_bulk_reminders/", {
    from_email: fromEmail,
  });
};

// Upload supplier attachment
export const uploadSupplierAttachment = (supplierId, formData) => {
  console.log(`📎 Uploading attachment for supplier: ${supplierId}`);

  // Add the supplier ID to the form data
  const fd = new FormData();
  fd.append("supplier", supplierId);

  // Append all files and data from the original formData
  if (formData instanceof FormData) {
    for (let [key, value] of formData.entries()) {
      fd.append(key, value);
    }
  }

  return supplierApi.post("supplier_attachments/", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Get supplier attachments
export const getSupplierAttachments = (supplierId) => {
  return supplierApi.get("supplier_attachments/", {
    params: { supplier: supplierId },
  });
};

// Update agreement status
export const updateAgreementStatus = (supplierId, status, data = {}) => {
  console.log(`📄 Updating agreement status for ${supplierId} to ${status}`);

  return supplierApi.patch(`supplier/${supplierId}/update_agreement_status/`, {
    agreement_status: status,
    ...data,
  });
};

// Get suppliers by vendor type
export const getSuppliersByVendorType = (vendorType) => {
  return supplierApi.get("supplier/", {
    params: { vendor_type: vendorType },
  });
};

/* -------------------------------------------------------------------------- */
/*  5.  DATA TRANSFORMATION HELPER (Simplified)                              */
/* -------------------------------------------------------------------------- */
const transformSupplierData = (formData) => {
  // Convert FormData to object first
  const data = formDataToObject(formData);

  // Special handling for email - don't send empty email
  if (data.email === "" || data.email === null || data.email === undefined) {
    delete data.email;
  }

  // Convert empty strings to null for date fields
  const dateFields = [
    "deactivation_date",
    "planned_inactivation_date",
    "contract_sign_date",
    "agreement_signature_due_date",
    "agreement_expiry_date",
    "agreement_accepted_on",
    "certification_issue_date",
    "certification_expiry_date",
    "factory_related_since",
    "latest_audit_date",
    "latest_audit_expiry_date",
    "latest_audit_report_date",
    "shared_file_effective_from",
    "shared_file_effective_to",
  ];

  dateFields.forEach((field) => {
    if (data[field] === "") {
      data[field] = null;
    }
  });

  // Convert empty strings to null for numeric fields
  const numericFields = [
    "avg_lead_time_days",
    "total_annual_turnover",
    "export_annual_turnover",
    "credit_limit",
    "agent_payment",
    "super_bonus",
    "qa_score",
    "year_established",
  ];

  numericFields.forEach((field) => {
    if (data[field] === "") {
      data[field] = null;
    } else if (data[field]) {
      // Try to convert to number
      const num = Number(data[field]);
      if (!isNaN(num)) {
        data[field] = num;
      }
    }
  });

  // Convert string booleans to actual booleans
  Object.keys(data).forEach((key) => {
    if (data[key] === "true") {
      data[key] = true;
    } else if (data[key] === "false") {
      data[key] = false;
    }
  });

  return data;
};

/* -------------------------------------------------------------------------- */
/*  6.  UTILITY FUNCTIONS                                                    */
/* -------------------------------------------------------------------------- */

// Get supplier status options
export const getAgreementStatusOptions = () => [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

// Get document status options
export const getDocStatusOptions = () => [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// Get vendor type options
export const getVendorTypeOptions = () => [
  { value: "manufacturer", label: "Manufacturer" },
  { value: "distributor", label: "Distributor" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "retailer", label: "Retailer" },
  { value: "importer", label: "Importer" },
  { value: "exporter", label: "Exporter" },
  { value: "agent", label: "Agent" },
  { value: "service_provider", label: "Service Provider" },
];

// Get business type options
export const getBusinessTypeOptions = () => [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "corporation", label: "Corporation" },
  { value: "llc", label: "Limited Liability Company" },
  { value: "private_limited", label: "Private Limited" },
  { value: "public_limited", label: "Public Limited" },
];

// Get vendor rating options
export const getVendorRatingOptions = () => [
  { value: "A", label: "A - Excellent" },
  { value: "B", label: "B - Good" },
  { value: "C", label: "C - Average" },
  { value: "D", label: "D - Poor" },
  { value: "E", label: "E - Critical" },
];

// Get payment term options
export const getPaymentTermOptions = () => [
  { value: "Net 7", label: "Net 7 Days" },
  { value: "Net 15", label: "Net 15 Days" },
  { value: "Net 30", label: "Net 30 Days" },
  { value: "Net 45", label: "Net 45 Days" },
  { value: "Net 60", label: "Net 60 Days" },
  { value: "Cash", label: "Cash on Delivery" },
  { value: "Advance", label: "Advance Payment" },
];

// Get incoterm options
export const getIncotermOptions = () => [
  { value: "EXW", label: "EXW - Ex Works" },
  { value: "FCA", label: "FCA - Free Carrier" },
  { value: "FOB", label: "FOB - Free On Board" },
  { value: "CIF", label: "CIF - Cost Insurance Freight" },
  { value: "CFR", label: "CFR - Cost and Freight" },
  { value: "DAP", label: "DAP - Delivered At Place" },
  { value: "DPU", label: "DPU - Delivered At Place Unloaded" },
  { value: "DDP", label: "DDP - Delivered Duty Paid" },
];

// Get currency options
export const getCurrencyOptions = () => [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "BDT", label: "BDT - Bangladeshi Taka" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
];

// Get language options
export const getLanguageOptions = () => [
  { value: "English", label: "English" },
  { value: "Bangla", label: "Bangla" },
  { value: "Hindi", label: "Hindi" },
  { value: "Chinese", label: "Chinese" },
  { value: "Arabic", label: "Arabic" },
  { value: "Spanish", label: "Spanish" },
];

/* -------------------------------------------------------------------------- */
/*  7.  EXPORT DEFAULT                                                       */
/* -------------------------------------------------------------------------- */
export default {
  // Core API functions
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
  getSuppliersByStatus,
  getSupplierStats,
  getSuppliersByVendorType,

  // Attachment functions
  uploadSupplierAttachment,
  getSupplierAttachments,

  // Agreement functions
  updateAgreementStatus,

  // Data transformation
  transformSupplierData,
  formDataToObject,

  // Utility functions
  getAgreementStatusOptions,
  getDocStatusOptions,
  getVendorTypeOptions,
  getBusinessTypeOptions,
  getVendorRatingOptions,
  getPaymentTermOptions,
  getIncotermOptions,
  getCurrencyOptions,
  getLanguageOptions,
};
