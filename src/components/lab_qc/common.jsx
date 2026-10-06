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
  v === null ||
  v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  (typeof v === "object" && Object.keys(v).length === 0);

// ---- Schema helpers (see TADDJANGO/lab_qc/section_schema.py) -------------

/** Lookup context for show_if / label placeholders: the color entry, then
 *  the section's setup fields, then General Information (Sample Type). */
export const fieldContext = (sectionsState, setup, entry) => ({
  ...(sectionsState?.general_info || {}),
  ...(setup || {}),
  ...(entry || {}),
});

/** A field with show_if is visible only when the named field holds one of
 *  the listed values. */
export const isFieldVisible = (field, ctx) => {
  if (!field.show_if) return true;
  return (field.show_if.in || []).includes(ctx?.[field.show_if.field]);
};

/** Fills "{field}" placeholders in a label (e.g. the selected weight unit);
 *  an empty value drops the placeholder and its brackets. */
export const fillLabel = (text, ctx) =>
  String(text || "")
    .replace(/\s*\(\{(\w+)\}\)/g, (_, k) => (isEmptyValue(ctx?.[k]) ? "" : ` (${ctx[k]})`))
    .replace(/\{(\w+)\}/g, (_, k) => (isEmptyValue(ctx?.[k]) ? "" : String(ctx[k])));

/** Drops empty cells and rows (fixed rows and user-added "_extra" rows);
 *  returns null when the grid has no data. */
export const cleanTableValue = (field, value) => {
  if (!value || typeof value !== "object") return null;
  const out = {};
  const keepCells = (cells) => {
    const rowOut = {};
    (field.columns || []).forEach((col) => {
      if (!isEmptyValue(cells?.[col.key])) rowOut[col.key] = cells[col.key];
    });
    return rowOut;
  };
  (field.rows || []).forEach((row) => {
    if (!row.key) return;
    const rowOut = keepCells(value[row.key]);
    if (Object.keys(rowOut).length > 0) out[row.key] = rowOut;
  });
  if (field.allow_extra_rows) {
    const extra = (value._extra || [])
      .map((r) => {
        const rowOut = keepCells(r);
        if (Object.keys(rowOut).length === 0) return null;
        return { label: String(r.label || "").trim() || "Other seam", ...rowOut };
      })
      .filter(Boolean);
    if (extra.length > 0) out._extra = extra;
  }
  return Object.keys(out).length > 0 ? out : null;
};

/** "rows" field: keeps only rows with at least one filled cell. */
export const cleanRowsValue = (field, value) => {
  if (!Array.isArray(value)) return null;
  const out = value
    .map((r) => {
      const rowOut = {};
      (field.columns || []).forEach((col) => {
        if (!isEmptyValue(r?.[col.key])) rowOut[col.key] = r[col.key];
      });
      return rowOut;
    })
    .filter((r) => Object.keys(r).length > 0);
  return out.length > 0 ? out : null;
};

/** Non-empty values of the visible fields, with tables/rows cleaned. */
const cleanFields = (fields, raw, ctx) => {
  const out = {};
  (fields || []).forEach((field) => {
    if (field.type === "heading" || field.type === "static") return;
    if (!isFieldVisible(field, ctx)) return;
    let val = raw?.[field.key];
    if (field.type === "table") val = cleanTableValue(field, val);
    else if (field.type === "rows") val = cleanRowsValue(field, val);
    else if (typeof val === "string") val = val.trim() === "" ? "" : val;
    if (!isEmptyValue(val)) out[field.key] = val;
  });
  return out;
};

const addStatics = (fields, target) => {
  (fields || []).filter((f) => f.type === "static").forEach((f) => {
    target[f.key] = f.value;
  });
};

/** Entry has real test data (not just a color name). */
export const entryHasData = (entry) => Object.keys(entry || {}).some((k) => k !== "color_name");

/**
 * Strips empty fields from the in-progress sections state and drops any
 * section / color entry that ends up with nothing filled. This is what
 * keeps drafts clean and makes the PDF's "only filled sections appear" rule
 * work - the backend only prints what's actually in this JSON.
 *   info section: {field: value}
 *   test section: {setup field: value, entries: [{color_name, ...}]}
 */
export const buildCleanSections = (schema, sectionsState) => {
  const cleaned = {};
  const general = sectionsState.general_info || {};
  (schema?.sections || []).forEach((section) => {
    const raw = sectionsState[section.key] || {};
    if (section.kind !== "test") {
      const fieldsClean = cleanFields(section.fields, raw, raw);
      if (Object.keys(fieldsClean).length > 0) {
        addStatics(section.fields, fieldsClean);
        cleaned[section.key] = fieldsClean;
      }
      return;
    }
    const setupCtx = { ...general, ...raw };
    const entries = (raw.entries || [])
      .map((entry) => cleanFields(section.fields, entry, { ...setupCtx, ...entry }))
      .filter(entryHasData);
    if (entries.length === 0) return;
    const setup = cleanFields(section.setup_fields, raw, setupCtx);
    addStatics(section.setup_fields, setup);
    cleaned[section.key] = { ...setup, entries };
  });
  return cleaned;
};

/** Labels of test sections that have a filled color entry without a name. */
export const sectionsMissingColorName = (schema, cleaned) =>
  (schema?.sections || [])
    .filter((s) => s.kind === "test")
    .filter((s) => (cleaned[s.key]?.entries || []).some((e) => isEmptyValue(e.color_name)))
    .map((s) => s.label);

/** Distinct color names used anywhere in the report, in first-seen order. */
export const reportColorNames = (schema, sectionsState) => {
  const seen = new Map();
  (schema?.sections || []).forEach((section) => {
    if (section.kind !== "test") return;
    (sectionsState[section.key]?.entries || []).forEach((e) => {
      const name = String(e?.color_name || "").trim();
      const key = name.toLowerCase();
      if (name && !seen.has(key)) seen.set(key, name);
    });
  });
  return [...seen.values()];
};

const toNumber = (v) => {
  if (isEmptyValue(v)) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n) => String(Math.round(n * 100) / 100);

/** Fills the computed columns of one table row, in column order (so a
 *  computed column can feed a later one, e.g. g/m² -> oz/yd²). */
export const computeTableRow = (columns, rowValues) => {
  const row = { ...(rowValues || {}) };
  (columns || []).forEach((col) => {
    const c = col.compute;
    if (!c) return;
    let result = null;
    if (c.op === "pct_change") {
      const from = toNumber(row[c.from]);
      const to = toNumber(row[c.to]);
      if (from !== null && to !== null && from !== 0) result = ((to - from) / from) * 100;
    } else if (c.op === "ratio_pct") {
      const num = toNumber(row[c.num]);
      const den = toNumber(row[c.den]);
      if (num !== null && den !== null && den !== 0) result = (num / den) * 100;
    } else if (c.op === "avg") {
      const nums = (c.of || []).map((k) => toNumber(row[k])).filter((n) => n !== null);
      if (nums.length > 0) result = nums.reduce((a, b) => a + b, 0) / nums.length;
    } else if (c.op === "mul") {
      const base = toNumber(row[c.of]);
      if (base !== null) result = base * c.factor;
    }
    row[col.key] = result === null ? "" : round2(result);
  });
  return row;
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
