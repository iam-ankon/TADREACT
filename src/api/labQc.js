// src/api/labQc.js
//
// API client for the Lab/QC module. Mirrors the axios instance pattern in
// src/api/merchandiser.js (see getMerchandiserBaseUrl / createInstance there).
// Reaches the Django backend through the same `/api` vite proxy used by the
// rest of the app: `/api/lab/api/` in dev, `${getBackendURL()}/api/lab/api/`
// in production.
//
// IMPORTANT: This file must NEVER call any endpoint that can return pricing
// (e.g. /api/merchandiser/api/orders/). The only order data source for this
// module is `orders-lite/`, which is guaranteed pricing-free at the data
// layer on the backend.

import axios from "axios";
import { getBackendURL } from "./merchandiser.js";
import { MERCH_FULL_MENU_USERS } from "../utils/routeAccess";

/* -------------------------------------------------------------------------- */
/*  1. BASE URL + AXIOS INSTANCE                                              */
/* -------------------------------------------------------------------------- */

const getLabQcBaseUrl = () => {
  if (import.meta.env.DEV) {
    return "/api/lab/api/";
  }
  return `${getBackendURL()}/api/lab/api/`;
};

export const labApi = axios.create({
  baseURL: getLabQcBaseUrl(),
  timeout: 45000,
  withCredentials: false,
});

labApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) {
    cfg.headers.Authorization = `Token ${token}`;
  }
  return cfg;
});

labApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ Lab/QC API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/*  2. PERMISSION HELPERS                                                     */
/* -------------------------------------------------------------------------- */

// Reads the `permissions` blob that loginUser() stores in localStorage
// (see src/api/employeeApi.js). Never call the backend for this - it's
// already delivered at login.
export const getStoredPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem("permissions") || "{}");
  } catch {
    return {};
  }
};

// Users given the whole Merchandising menu are Lab admins too (server:
// lab_qc/permissions.is_lab_admin). Checked by username as well so it works
// with permissions saved by a login from before the flag existed.
const isMerchFullMenuUser = () => {
  try {
    return MERCH_FULL_MENU_USERS.includes(localStorage.getItem("username") || "");
  } catch {
    return false;
  }
};

// Lab admin = anyone with full_access (existing admins, is_staff/is_superuser).
export const isLabAdmin = () => {
  const p = getStoredPermissions();
  return p.full_access === true || p.lab_admin === true || isMerchFullMenuUser();
};

// Any user allowed into the Lab/QC module at all (officer or admin).
export const hasLabQcAccess = () => {
  const p = getStoredPermissions();
  return p.lab_qc === true || isLabAdmin();
};

// A restricted Lab/QC officer (not an admin) - sees only her own reports/orders.
export const isLabQcOfficerOnly = () => {
  const p = getStoredPermissions();
  return p.lab_qc === true && !isLabAdmin();
};

/* -------------------------------------------------------------------------- */
/*  3. SECTION SCHEMA (drives the dynamic report form - never hardcode)       */
/* -------------------------------------------------------------------------- */

export const getSectionSchema = () => labApi.get("section-schema/");

/* -------------------------------------------------------------------------- */
/*  4. ORDERS (read-only, pricing-free)                                      */
/* -------------------------------------------------------------------------- */

export const getOrdersLite = (params = {}) =>
  labApi.get("orders-lite/", { params });

/* -------------------------------------------------------------------------- */
/*  5. REPORTS                                                                */
/* -------------------------------------------------------------------------- */

export const getReports = (params = {}) => labApi.get("reports/", { params });

export const getReportById = (id) => labApi.get(`reports/${id}/`);

export const createReport = (data) => labApi.post("reports/", data);

export const patchReport = (id, data) => labApi.patch(`reports/${id}/`, data);

export const deleteReport = (id) => labApi.delete(`reports/${id}/`);

export const submitReport = (id, overall_result) =>
  labApi.post(`reports/${id}/submit/`, { overall_result });

/**
 * Downloads the report PDF via a blob response and triggers a save through a
 * synthetic <a> click (never render the PDF inline).
 */
export const exportReportPdf = async (id, fallbackFilename) => {
  const response = await labApi.get(`reports/${id}/export/`, {
    responseType: "blob",
  });

  let filename = fallbackFilename || `LAB-${id}.pdf`;
  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^*]=["']?([^"';]+)["']?/);
    if (match && match[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return { success: true, filename };
};

/* -------------------------------------------------------------------------- */
/*  6. DASHBOARD                                                              */
/* -------------------------------------------------------------------------- */

export const getLabDashboard = (params = {}) =>
  labApi.get("dashboard/", { params });

/* -------------------------------------------------------------------------- */
/*  7. ADMIN-ONLY: FACTORY ASSIGNMENTS                                        */
/* -------------------------------------------------------------------------- */

export const getFactoryAssignments = (params = {}) =>
  labApi.get("factory-assignments/", { params });

export const createFactoryAssignment = (data) =>
  labApi.post("factory-assignments/", data);

export const patchFactoryAssignment = (id, data) =>
  labApi.patch(`factory-assignments/${id}/`, data);

export const deleteFactoryAssignment = (id) =>
  labApi.delete(`factory-assignments/${id}/`);

export const getQcUsers = () => labApi.get("qc-users/");

export const getFactories = () => labApi.get("factories/");
