/**
 * vaultApi.js
 * API wrapper for the Password Vault module.
 * Mirrors the patterns in employeeApi.js / companyDocsApi.js — same backend
 * base URL, same DRF Token auth header.
 */
import axios from "axios";
import { getBackendURL, getToken } from "./employeeApi";

const BASE = () => `${getBackendURL()}/api/vault`;

const authHeaders = () => ({
  headers: { Authorization: `Token ${getToken()}` },
});

const vaultAxios = axios.create();

vaultAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = { ...config.headers, Authorization: `Token ${token}` };
  }
  return config;
});

vaultAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ─── Folders ─────────────────────────────────────────────────────────────────

export const getVaultFolders = () => vaultAxios.get(`${BASE()}/folders/`);

export const createVaultFolder = (data) =>
  vaultAxios.post(`${BASE()}/folders/`, data);

export const updateVaultFolder = (id, data) =>
  vaultAxios.patch(`${BASE()}/folders/${id}/`, data);

export const deleteVaultFolder = (id) =>
  vaultAxios.delete(`${BASE()}/folders/${id}/`);

// ─── Items ───────────────────────────────────────────────────────────────────

export const getVaultItems = (params = {}) =>
  vaultAxios.get(`${BASE()}/items/`, { params });

export const getVaultItem = (id) => vaultAxios.get(`${BASE()}/items/${id}/`);

export const createVaultItem = (data) =>
  vaultAxios.post(`${BASE()}/items/`, data);

export const updateVaultItem = (id, data) =>
  vaultAxios.patch(`${BASE()}/items/${id}/`, data);

export const deleteVaultItem = (id) =>
  vaultAxios.delete(`${BASE()}/items/${id}/`);

export const revealVaultItemPassword = (id) =>
  vaultAxios.post(`${BASE()}/items/${id}/reveal/`);

// ─── Sharing (full-access users only) ────────────────────────────────────────

export const getGrantableUsers = (search = "") =>
  vaultAxios.get(`${BASE()}/items/grantable-users/`, { params: search ? { search } : {} });

export const getVaultItemGrants = (itemId) =>
  vaultAxios.get(`${BASE()}/items/${itemId}/grants/`);

export const addVaultItemGrant = (itemId, userId) =>
  vaultAxios.post(`${BASE()}/items/${itemId}/grants/`, { user_id: userId });

export const removeVaultItemGrant = (itemId, grantId) =>
  vaultAxios.delete(`${BASE()}/items/${itemId}/grants/${grantId}/`);

// ─── Audit log ───────────────────────────────────────────────────────────────

export const getVaultAuditLogs = (params = {}) =>
  vaultAxios.get(`${BASE()}/audit-logs/`, { params });

// ─── Browser extension download ──────────────────────────────────────────────

export const downloadVaultExtensionZip = () =>
  vaultAxios.get(`${BASE()}/extension/download/`, { responseType: "blob" });

// ─── Client-side password generator ─────────────────────────────────────────
// Generated locally (Web Crypto) so it works instantly with no network round
// trip and the candidate password never has to leave the browser unsaved.

export const generatePassword = ({
  length = 16,
  uppercase = true,
  lowercase = true,
  digits = true,
  symbols = true,
} = {}) => {
  const sets = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{}",
  };

  let pool = "";
  if (lowercase) pool += sets.lower;
  if (uppercase) pool += sets.upper;
  if (digits) pool += sets.digits;
  if (symbols) pool += sets.symbols;
  if (!pool) pool = sets.lower + sets.upper + sets.digits;

  const clampedLength = Math.min(64, Math.max(8, length));
  const randomValues = new Uint32Array(clampedLength);
  window.crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < clampedLength; i += 1) {
    result += pool[randomValues[i] % pool.length];
  }
  return result;
};
