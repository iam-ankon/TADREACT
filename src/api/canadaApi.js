/**
 * canadaApi.js
 * Canada Office HRMS API wrapper.
 * Mirrors the patterns in employeeApi.js — same base URL, same token auth.
 */
import axios from "axios";

// ─── Base URL — same backend as TAD HRMS ────────────────────────────────────
export const getBackendURL = () =>
  import.meta.env.VITE_BACKEND_URL || "http://119.148.51.38:8000";

const getCanadaBaseUrl = () => `${getBackendURL()}/api/canada/`;

// ─── Auth helpers (reused from employeeApi pattern) ─────────────────────────
const getToken = () => localStorage.getItem("token");

const authHeaders = () => {
  const token = getToken();
  if (!token) throw new Error("No auth token found. Please log in.");
  return { Authorization: `Token ${token}` };
};

// ─── Axios instance ──────────────────────────────────────────────────────────
const canadaAxios = axios.create({ baseURL: getCanadaBaseUrl() });

canadaAxios.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...authHeaders() };
  return config;
});

canadaAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired — redirect to login
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const getCanadaDashboard = () => canadaAxios.get("dashboard/");

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export const getCanadaEmployees = (params = {}) =>
  canadaAxios.get("employees/", { params });

export const getCanadaEmployee = (id) => canadaAxios.get(`employees/${id}/`);

export const createCanadaEmployee = (data) =>
  canadaAxios.post("employees/", data);

export const updateCanadaEmployee = (id, data) =>
  canadaAxios.patch(`employees/${id}/`, data);

export const deleteCanadaEmployee = (id) =>
  canadaAxios.delete(`employees/${id}/`);

export const getEmployeePayrollSummary = (id) =>
  canadaAxios.get(`employees/${id}/payroll_summary/`);

export const getEmployeeLeaveBalance = (id) =>
  canadaAxios.get(`employees/${id}/leave_balance/`);

// ─── PAYROLL ─────────────────────────────────────────────────────────────────
export const getCanadaPayroll = (params = {}) =>
  canadaAxios.get("payroll/", { params });

export const createPayrollRecord = (data) => canadaAxios.post("payroll/", data);

export const updatePayrollRecord = (id, data) =>
  canadaAxios.patch(`payroll/${id}/`, data);

export const calculatePayroll = (data) =>
  canadaAxios.post("payroll/calculate/", data);

export const getMonthlyPayrollSummary = (month, year) =>
  canadaAxios.get("payroll/monthly_summary/", { params: { month, year } });

// ─── LEAVES ──────────────────────────────────────────────────────────────────
export const getCanadaLeaves = (params = {}) =>
  canadaAxios.get("leaves/", { params });

export const createCanadaLeave = (data) => canadaAxios.post("leaves/", data);

export const updateCanadaLeave = (id, data) =>
  canadaAxios.patch(`leaves/${id}/`, data);

export const approveLeave = (id) =>
  canadaAxios.post(`leaves/${id}/approve/`);

export const rejectLeave = (id, note = "") =>
  canadaAxios.post(`leaves/${id}/reject/`, { note });

export const deleteCanadaLeave = (id) => canadaAxios.delete(`leaves/${id}/`);

// ─── HOLIDAYS ────────────────────────────────────────────────────────────────
export const getCanadaHolidays = (year) =>
  canadaAxios.get("holidays/", { params: { year } });

export const getUpcomingHolidays = () => canadaAxios.get("holidays/upcoming/");

export const createHoliday = (data) => canadaAxios.post("holidays/", data);

// ─── RECRUITMENT ─────────────────────────────────────────────────────────────
export const getRecruitment = (params = {}) =>
  canadaAxios.get("recruitment/", { params });

export const createRecruitment = (data) =>
  canadaAxios.post("recruitment/", data);

export const updateRecruitment = (id, data) =>
  canadaAxios.patch(`recruitment/${id}/`, data);

export const deleteRecruitment = (id) =>
  canadaAxios.delete(`recruitment/${id}/`);

// ─── APPRAISALS ──────────────────────────────────────────────────────────────
export const getCanadaAppraisals = (params = {}) =>
  canadaAxios.get("appraisals/", { params });

export const createAppraisal = (data) => canadaAxios.post("appraisals/", data);

export const updateAppraisal = (id, data) =>
  canadaAxios.patch(`appraisals/${id}/`, data);

// ─── TAX CALCULATOR ──────────────────────────────────────────────────────────
export const calculateTax = (annualSalary, province) =>
  canadaAxios.post("tax/calculate/", {
    annual_salary: annualSalary,
    province,
  });

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
export const getCanadaAttendanceSummary = (month, year) =>
  canadaAxios.get("attendance/summary/", { params: { month, year } });
