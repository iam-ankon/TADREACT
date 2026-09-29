// src/components/lab_qc/common.jsx
//
// Shared visual language + small helpers for the Lab/QC module, kept
// consistent with src/components/merchandiser/DashboardPage.jsx and
// OrderList.jsx (blue gradient theme, rounded cards, pill badges).

import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MerchandiserSidebar from "../merchandiser/Sidebar";
import { hasLabQcAccess } from "../../api/labQc";

export const COLORS = {
  page: "#f0f2f5",
  cardBg: "#ffffff",
  border: "#e2e8f0",
  text: "#1e293b",
  textMuted: "#64748b",
  primary: "#3b82f6",
  primaryDark: "#1d4ed8",
};

export const STATUS_COLORS = {
  draft: "#94a3b8",
  submitted: "#3b82f6",
};

export const RESULT_COLORS = {
  pass: "#10b981",
  fail: "#ef4444",
  conditional: "#f59e0b",
  "": "#cbd5e1",
};

export const RESULT_LABELS = {
  pass: "Pass",
  fail: "Fail",
  conditional: "Conditional",
  "": "Pending",
};

export const formatDate = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

export const isEmptyValue = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/**
 * Strips empty leaf fields from the in-progress sections state and drops
 * any section that ends up with nothing filled. This is what keeps drafts
 * clean and is what makes the PDF export's "blank fields don't appear"
 * rule work - the backend only prints what's actually in this JSON.
 */
export const buildCleanSections = (schema, sectionsState) => {
  const cleaned = {};
  (schema?.sections || []).forEach((section) => {
    const raw = sectionsState[section.key] || {};
    const fieldsClean = {};
    (section.fields || []).forEach((field) => {
      const val = raw[field.key];
      if (!isEmptyValue(val)) {
        fieldsClean[field.key] = val;
      }
    });
    if (Object.keys(fieldsClean).length > 0) {
      cleaned[section.key] = fieldsClean;
    }
  });
  return cleaned;
};

export const Badge = ({ children, color }) => (
  <span
    style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "white",
      backgroundColor: color || "#94a3b8",
      textTransform: "capitalize",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

export const StatusBadge = ({ status }) => (
  <Badge color={STATUS_COLORS[status] || "#94a3b8"}>{status || "-"}</Badge>
);

export const ResultBadge = ({ result }) => (
  <Badge color={RESULT_COLORS[result ?? ""] || "#94a3b8"}>
    {RESULT_LABELS[result ?? ""] || result}
  </Badge>
);

export const StatCard = ({ title, value, gradient, icon }) => (
  <div
    style={{
      background: gradient,
      padding: "1.5rem",
      borderRadius: "1rem",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      position: "relative",
      overflow: "hidden",
      color: "white",
      minWidth: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.1)",
      }}
    />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div>
        <p style={{ fontSize: "0.9rem", fontWeight: 500, margin: 0, color: "rgba(255,255,255,0.9)" }}>
          {title}
        </p>
        <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.5rem 0 0 0", lineHeight: 1 }}>
          {value}
        </p>
      </div>
      {icon && (
        <div
          style={{
            padding: "0.85rem",
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}
    </div>
  </div>
);

export const AccessDenied = ({ message }) => (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      background: COLORS.page,
      padding: "2rem",
    }}
  >
    <div
      style={{
        background: COLORS.cardBg,
        borderRadius: "1rem",
        padding: "2.5rem",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
        maxWidth: 480,
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#ef4444", marginBottom: "0.75rem" }}>Access Restricted</h2>
      <p style={{ color: COLORS.textMuted, margin: 0 }}>
        {message || "You don't have permission to view the Lab/QC module."}
      </p>
    </div>
  </div>
);

export const LoadingState = ({ label = "Loading..." }) => (
  <div style={{ padding: "3rem", textAlign: "center", color: COLORS.textMuted }}>{label}</div>
);

/**
 * Standard page shell: Lab/QC is a feature of the Merchandising module (not
 * its own module), so it renders inside the same Sidebar merchandiser pages
 * use (see merchandiser/Sidebar.jsx - it shows a "Lab / QC" entry, narrowed
 * to just that for a restricted Lab/QC officer). Content column + toast
 * host, with a defensive `permissions.lab_qc` self-check per page (routing
 * in App.jsx only checks auth, not role).
 */
export const LabPageLayout = ({ children, skipAccessCheck = false }) => {
  if (!skipAccessCheck && !hasLabQcAccess()) {
    return <AccessDenied />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.page, overflow: "hidden" }}>
      <MerchandiserSidebar />
      <div style={{ flex: 1, padding: "2rem", minWidth: 0, overflowY: "auto", overflowX: "auto" }}>
        {children}
      </div>
      <ToastContainer position="top-right" autoClose={3500} />
    </div>
  );
};

export const cardStyle = {
  background: COLORS.cardBg,
  borderRadius: "1rem",
  padding: "1.5rem",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
};

/**
 * Page-level header: white card, gradient-clip title + subtitle on the
 * left, an optional actions slot on the right. Matches the header treatment
 * every polished merchandiser page uses (see DashboardPage.jsx) - use this
 * instead of a bare <h1> so every Lab/QC page opens with the same look.
 */
export const PageHeader = ({ title, subtitle, actions }) => (
  <header
    style={{
      backgroundColor: COLORS.cardBg,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      borderRadius: "1rem",
      marginBottom: "1.5rem",
      padding: "1.5rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "1rem",
    }}
  >
    <div>
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          margin: 0,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: "0.95rem", color: COLORS.textMuted, margin: "0.4rem 0 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
  </header>
);

export const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  fontSize: "0.9rem",
  color: COLORS.text,
  boxSizing: "border-box",
};

export const labelStyle = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: COLORS.textMuted,
  marginBottom: "6px",
};

export const primaryButtonStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};

export const secondaryButtonStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: `1px solid ${COLORS.border}`,
  background: "white",
  color: COLORS.text,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};

export const dangerButtonStyle = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid rgba(239,68,68,0.3)",
  background: "rgba(239,68,68,0.08)",
  color: "#ef4444",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.8rem",
};

export const disabledButtonStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  background: "#cbd5e1",
  color: "white",
  fontWeight: 600,
  cursor: "not-allowed",
  fontSize: "0.9rem",
};
