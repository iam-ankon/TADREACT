/**
 * companyDocsApi.js
 * API wrapper for the Company Documents module.
 */
import axios from "axios";
import { getBackendURL, getToken } from "./employeeApi";

const BASE = () => `${getBackendURL()}/api/company-docs`;

const authHeaders = () => ({
  headers: { Authorization: `Token ${getToken()}` },
});

const authHeadersForm = () => ({
  headers: {
    Authorization: `Token ${getToken()}`,
    "Content-Type": "multipart/form-data",
  },
});

// ─── Companies ───────────────────────────────────────────────────────────────

export const getCompanies = (params = {}) =>
  axios.get(`${BASE()}/companies/`, { ...authHeaders(), params });

export const getCompany = (id) =>
  axios.get(`${BASE()}/companies/${id}/`, authHeaders());

export const createCompany = (data) =>
  axios.post(`${BASE()}/companies/`, data, authHeadersForm());

export const updateCompany = (id, data) =>
  axios.patch(`${BASE()}/companies/${id}/`, data, authHeadersForm());

export const deleteCompany = (id) =>
  axios.delete(`${BASE()}/companies/${id}/`, authHeaders());

export const getCompanyDocuments = (id, params = {}) =>
  axios.get(`${BASE()}/companies/${id}/documents/`, { ...authHeaders(), params });

export const getCompanySummary = (id) =>
  axios.get(`${BASE()}/companies/${id}/summary/`, authHeaders());

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getCompanyDocsDashboard = () =>
  axios.get(`${BASE()}/dashboard/`, authHeaders());

// ─── Document Types ──────────────────────────────────────────────────────────

export const getDocumentTypes = (params = {}) =>
  axios.get(`${BASE()}/document-types/`, { ...authHeaders(), params });

export const getDocumentType = (id) =>
  axios.get(`${BASE()}/document-types/${id}/`, authHeaders());

export const createDocumentType = (data) =>
  axios.post(`${BASE()}/document-types/`, data, authHeaders());

export const updateDocumentType = (id, data) =>
  axios.patch(`${BASE()}/document-types/${id}/`, data, authHeaders());

export const deleteDocumentType = (id) =>
  axios.delete(`${BASE()}/document-types/${id}/`, authHeaders());

export const getExpiringDocuments = (days = 90) =>
  axios.get(`${BASE()}/document-types/expiring/`, {
    ...authHeaders(),
    params: { days },
  });

export const getExpiredDocuments = () =>
  axios.get(`${BASE()}/document-types/expired/`, authHeaders());

// ─── Document Files ──────────────────────────────────────────────────────────

export const getDocumentFiles = (documentTypeId) =>
  axios.get(`${BASE()}/document-files/`, {
    ...authHeaders(),
    params: { document_type: documentTypeId },
  });

export const uploadDocumentFile = (formData) =>
  axios.post(`${BASE()}/document-files/`, formData, authHeadersForm());

export const deleteDocumentFile = (id) =>
  axios.delete(`${BASE()}/document-files/${id}/`, authHeaders());

// ─── Notifications ───────────────────────────────────────────────────────────

export const sendExpiryNotifications = (days = 90) =>
  axios.post(
    `${BASE()}/send-expiry-notifications/`,
    { days },
    authHeaders()
  );

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const CATEGORY_LABELS = {
  rental: "Rental Agreement",
  trade_license: "Trade License",
  irc: "IRC",
  membership: "Membership",
  environment: "Environment License",
  health: "Health Certificate",
  fire: "Fire License",
  dokan: "Dokan License",
  other: "Other",
};

export const STATUS_CONFIG = {
  valid: { label: "Valid", color: "#16a34a", bg: "#dcfce7", icon: "✓" },
  expiring_soon: { label: "Expiring Soon", color: "#d97706", bg: "#fef3c7", icon: "⚠" },
  expired: { label: "Expired", color: "#dc2626", bg: "#fee2e2", icon: "✗" },
  not_available: { label: "Not Available", color: "#6b7280", bg: "#f3f4f6", icon: "—" },
  need_apply: { label: "Need to Apply", color: "#7c3aed", bg: "#ede9fe", icon: "!" },
};
