// Small helpers shared by the Stationery pages.

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Download rows as a CSV file (opens fine in Excel).
 * columns: [{ label, get: (row) => value }]
 */
export const downloadCSV = (filename, rows, columns) => {
  const lines = [
    columns.map((c) => csvCell(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => csvCell(c.get(row))).join(",")),
  ];
  // BOM so Excel reads UTF-8 (Bangla names, ৳) correctly.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const todayStamp = () => new Date().toISOString().slice(0, 10);

export const formatBDT = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

/** Same rule as the main menu (hr/Sidebar.jsx): full-access users and the
 *  Admin team leader manage stationery; everyone else only requests it. */
export const isStationeryManager = () => {
  const designation = (localStorage.getItem("designation") || "").toLowerCase();
  if (designation.includes("group hr head")) return false;
  return readJSON("permissions").full_access === true || designation.includes("team leader - admin");
};

export const homePath = () => (readJSON("permissions").full_access === true ? "/hr-work" : "/dashboard");
