// src/components/merchandiser/tnaShared.jsx
//
// Shared pieces for the TNA (Time & Action) screens: one API client, the
// planning rules (mirrors TNA.calculate_all_dates / MILESTONES in
// merchandiser/models.py), status helpers, a confirm dialog (instead of
// window.confirm/alert, which block the page) and the scoped .tna-app CSS
// (same tokens as the rest of the TAD redesign).

import React from "react";
import axios from "axios";

export const tnaApi = axios.create({ baseURL: "http://119.148.51.38:8000/api/merchandiser/api/" });
tnaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const apiError = (err, fallback = "Something went wrong. Please try again.") => {
  const d = err?.response?.data;
  if (!d) return fallback;
  if (typeof d === "string") return d.length < 200 ? d : fallback;
  if (d.detail) return d.detail;
  const first = Object.entries(d)[0];
  if (first) return `${first[0].replace(/_/g, " ")}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}`;
  return fallback;
};

// Approval stages and their weight in the progress % (TNA.PROGRESS_WEIGHTS).
export const STAGES = [
  { field: "lab_dip_status", label: "Lab Dip", weight: 10, dateField: "lab_dip_date" },
  { field: "fabric_status", label: "Fabric", weight: 40, dateField: "fabric_approved_date" },
  { field: "fit_sample_status", label: "Fit Sample", weight: 20, dateField: "fit_sample_date" },
  { field: "pp_sample_status", label: "PP Sample", weight: 30, dateField: "pps_date" },
];

// Planned dates in schedule order (TNA.MILESTONES).
export const MILESTONES = [
  { key: "order_booking_date", label: "Order Booking", group: "order" },
  { key: "fabric_booking_date", label: "Fabric Booking", group: "fabric", rule: "Order booking + 5 days" },
  { key: "lab_dip_date", label: "Lab Dip", group: "samples", stage: "lab_dip_status", rule: "Order booking + 15 days" },
  { key: "fit_sample_date", label: "Fit Sample", group: "samples", stage: "fit_sample_status", rule: "Order booking + 15 days" },
  { key: "fabric_lc_date", label: "Fabric LC", group: "fabric", rule: "Fabric booking + 10 days" },
  { key: "bulk_fabric_approve_date", label: "Bulk Fabric Approval", group: "fabric", rule: "Fabric booking + 30 days" },
  { key: "pp_sample_yardage_china_date", label: "PP Sample Yardage (China)", group: "samples", stage: "pp_sample_status", rule: "Fabric ETD − 7 days (imported)" },
  { key: "pps_date", label: "PP Sample", group: "samples", stage: "pp_sample_status", rule: "Yardage + 12 days (imported) / Fabric booking + 20 days (local)" },
  { key: "fabric_etd", label: "Fabric ETD", group: "fabric", rule: "Bulk approval + 35 days" },
  { key: "fabric_eta", label: "Fabric ETA", group: "fabric", rule: "Fabric ETD + 15 days" },
  { key: "fabric_approved_date", label: "Fabric Approved", group: "fabric", stage: "fabric_status", rule: "Shipment − 120 days (imported) / − 90 (local)" },
  { key: "fabric_inhouse_date", label: "Fabric In-house", group: "fabric", rule: "Fabric ETA + 10 days" },
  { key: "test_samples_date", label: "Test Samples", group: "production", rule: "Production start − 10 days" },
  { key: "production_start_date", label: "Production Start", group: "production", rule: "Fabric in-house + 10 days" },
  { key: "ps_date", label: "PS (Production Sample)", group: "production", rule: "Production start + 10 days" },
  { key: "shipment_date", label: "Shipment", group: "shipment" },
];

export const GROUP_LABEL = { order: "Order", fabric: "Fabric", samples: "Samples", production: "Production", shipment: "Shipment" };

const iso = (d) => d.toISOString().split("T")[0];
const addDays = (value, n) => {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

/** Same rules as TNA.calculate_all_dates on the server (preview only;
 *  the server recalculates on save). */
export const calculatePlan = ({ order_booking_date: booking, shipment_date: ship, fabric_type: type }) => {
  const p = {};
  if (!booking || !ship || !type) return p;
  const imported = type === "imported";
  p.fabric_booking_date = addDays(booking, 5);
  p.fabric_lc_date = addDays(p.fabric_booking_date, 10);
  p.fabric_approved_date = addDays(ship, imported ? -120 : -90);
  p.bulk_fabric_approve_date = addDays(p.fabric_booking_date, 30);
  p.fabric_etd = addDays(p.bulk_fabric_approve_date, 35);
  p.fabric_eta = addDays(p.fabric_etd, 15);
  p.fabric_inhouse_date = addDays(p.fabric_eta, 10);
  p.lab_dip_date = addDays(booking, 15);
  p.fit_sample_date = addDays(booking, 15);
  p.pp_sample_yardage_china_date = imported ? addDays(p.fabric_etd, -7) : "";
  p.pps_date = imported ? addDays(p.pp_sample_yardage_china_date, 12) : addDays(p.fabric_booking_date, 20);
  p.production_start_date = addDays(p.fabric_inhouse_date, 10);
  p.ps_date = addDays(p.production_start_date, 10);
  p.test_samples_date = addDays(p.production_start_date, -10);
  p.order_booking_date = booking;
  p.shipment_date = ship;
  return p;
};

export const daysFromToday = (value) => {
  if (!value) return null;
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(`${String(value).slice(0, 10)}T00:00:00Z`) - t) / 86400000);
};

export const fmtDate = (value, long = false) => {
  if (!value) return "—";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: long ? "long" : "short", year: "numeric", timeZone: "UTC" });
};

export const relDays = (days) => {
  if (days === null || days === undefined) return "";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};

/** Shipment-based status (same buckets as the API's status filter). */
export const shipStatus = (shipmentDate) => {
  const d = daysFromToday(shipmentDate);
  if (d === null) return { key: "unknown", label: "No date", cls: "grey" };
  if (d < 0) return { key: "overdue", label: "Past ship date", cls: "red" };
  if (d <= 15) return { key: "at_risk", label: "Ships ≤ 15 days", cls: "amber" };
  return { key: "on_track", label: "On track", cls: "green" };
};

/** Milestones of a TNA with dates, sorted, each with a state. */
export const milestonePlan = (tna) =>
  MILESTONES.filter((m) => tna?.[m.key])
    .map((m) => {
      const days = daysFromToday(tna[m.key]);
      const approved = m.stage && tna[m.stage] === "approved";
      const state = approved ? "done" : days < 0 ? (m.stage ? "overdue" : "passed") : "upcoming";
      return { ...m, date: tna[m.key], days, state };
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

export const ProgressBar = ({ tna, showLabel = true }) => (
  <div className="tna-progress" title={STAGES.map((s) => `${s.label}: ${tna?.[s.field] === "approved" ? "approved" : "pending"}`).join(" · ")}>
    <div className="tna-progress-track">
      {STAGES.map((s) => (
        <span key={s.field} style={{ width: `${s.weight}%` }} className={tna?.[s.field] === "approved" ? "on" : ""} />
      ))}
    </div>
    {showLabel && <b>{tna?.progress_percentage ?? 0}%</b>}
  </div>
);

export const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", danger, busy, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="tna-modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="tna-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="tna-modal-body">{message}</div>
        <div className="tna-modal-actions">
          <button type="button" className="tna-btn ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`tna-btn ${danger ? "danger" : "primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TNA_CSS = `
.tna-shell { display: flex; height: 100vh; background: #f3f5f9; }
.tna-app {
  --c-border: #e6eaf0; --c-border-strong: #d5dbe4; --c-text: #0f172a; --c-text-2: #334155; --c-muted: #64748b; --c-faint: #94a3b8;
  --c-primary: #2563eb; --c-primary-dark: #1d4ed8; --c-primary-soft: #eef4ff;
  flex: 1; min-width: 0; height: 100vh; overflow-y: auto; background: #f3f5f9; color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.tna-app *, .tna-app *::before, .tna-app *::after, .tna-modal-backdrop * { box-sizing: border-box; }
.tna-app button:focus-visible, .tna-app a:focus-visible, .tna-app input:focus-visible, .tna-app select:focus-visible,
.tna-app textarea:focus-visible, .tna-modal button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

.tna-header { position: sticky; top: 0; z-index: 20; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 28px 16px; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-border); }
.tna-crumbs { display: flex; gap: 6px; align-items: center; font-size: 12.5px; color: var(--c-muted); margin-bottom: 4px; }
.tna-crumbs a { color: var(--c-muted); text-decoration: none; }
.tna-crumbs a:hover { color: var(--c-primary); }
.tna-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--c-primary); margin-bottom: 4px; }
.tna-title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tna-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.tna-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.tna-body { padding: 22px 28px 36px; display: flex; flex-direction: column; gap: 18px; min-width: 0; }

.tna-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 15px; border-radius: 10px; font: inherit; font-size: 13.5px;
  font-weight: 600; cursor: pointer; white-space: nowrap; border: 1px solid transparent; text-decoration: none; transition: background .15s, border-color .15s; }
.tna-btn:disabled { opacity: .55; cursor: not-allowed; }
.tna-btn.primary { background: #2563eb; color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.tna-btn.primary:hover:not(:disabled) { background: #1d4ed8; }
.tna-btn.ghost { background: #fff; color: var(--c-text-2); border-color: var(--c-border-strong); }
.tna-btn.ghost:hover:not(:disabled) { background: #f8fafc; }
.tna-btn.danger { background: #b91c1c; color: #fff; }
.tna-btn.danger:hover:not(:disabled) { background: #991b1b; }
.tna-btn.danger-ghost { background: #fff; color: #b91c1c; border-color: #fecaca; }
.tna-btn.danger-ghost:hover:not(:disabled) { background: #fef2f2; }
.tna-btn.sm { height: 32px; padding: 0 11px; font-size: 12.5px; border-radius: 8px; }
.tna-btn .count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #b91c1c; color: #fff; font-size: 11px; font-weight: 700; display: inline-grid; place-items: center; }
.tna-icon-btn { width: 30px; height: 30px; display: inline-grid; place-items: center; border-radius: 8px; border: 1px solid var(--c-border); background: #fff; color: var(--c-muted); cursor: pointer; transition: all .15s; text-decoration: none; }
.tna-icon-btn:hover { color: #2563eb; border-color: #c7d7fe; background: #eef4ff; }
.tna-icon-btn.danger:hover { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
.tna-link { border: none; background: none; padding: 0; font: inherit; font-size: 12.5px; font-weight: 600; color: #2563eb; cursor: pointer; text-decoration: none; }

.tna-card { background: #fff; border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); min-width: 0; }
.tna-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 18px; border-bottom: 1px solid var(--c-border); }
.tna-card-title { margin: 0; font-size: 14.5px; font-weight: 650; display: flex; align-items: center; gap: 8px; }
.tna-card-sub { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.tna-card-body { padding: 16px 18px; }
.tna-pill-count { font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eef4ff; border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 9px; }

.tna-alert { display: flex; gap: 10px; align-items: flex-start; padding: 10px 14px; border-radius: 10px; font-size: 13.5px; border: 1px solid; }
.tna-alert svg { flex-shrink: 0; margin-top: 2px; }
.tna-alert span { flex: 1; }
.tna-alert.ok { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
.tna-alert.err { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
.tna-alert.warn { background: #fefce8; border-color: #fde68a; color: #854d0e; }
.tna-alert .x { border: none; background: none; color: inherit; cursor: pointer; padding: 0; }

.tna-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.tna-kpi { padding: 15px 17px; display: flex; flex-direction: column; gap: 6px; text-align: left; font: inherit; color: inherit; cursor: default; }
button.tna-kpi { cursor: pointer; transition: border-color .15s, box-shadow .15s; }
button.tna-kpi:hover { border-color: #c7d7fe; }
button.tna-kpi.active { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.tna-kpi-top { display: flex; align-items: center; justify-content: space-between; }
.tna-kpi-label { font-size: 12.5px; font-weight: 600; color: var(--c-muted); }
.tna-kpi-icon { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-size: 14px; }
.tna-kpi-value { font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.tna-kpi-foot { font-size: 12px; color: var(--c-muted); }

.tna-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px 16px; }
.tna-search { position: relative; flex: 1 1 260px; max-width: 380px; }
.tna-search input { width: 100%; height: 38px; padding: 0 32px 0 36px; border: 1px solid var(--c-border-strong); border-radius: 10px; font: inherit; font-size: 13.5px; outline: none; background: #fff; color: var(--c-text); }
.tna-search input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.tna-search > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-faint); }
.tna-search .clear { position: absolute; right: 7px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; display: grid; place-items: center; border: none; border-radius: 6px; background: #f8fafc; color: var(--c-muted); cursor: pointer; }
.tna-ms { position: relative; }
.tna-ms-btn { height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: #fff; font: inherit; font-size: 13.5px; color: var(--c-text-2); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; max-width: 240px; }
.tna-ms-btn.on { border-color: #93b4fb; background: #f5f8ff; color: #1d4ed8; }
.tna-ms-btn span { overflow: hidden; text-overflow: ellipsis; }
.tna-ms-menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: 40; min-width: 220px; max-width: 340px; max-height: 320px; overflow-y: auto; background: #fff; border: 1px solid var(--c-border); border-radius: 12px; box-shadow: 0 16px 32px -12px rgba(15,23,42,.3); padding: 6px; }
.tna-ms-menu input[type=text] { width: 100%; height: 32px; margin-bottom: 4px; padding: 0 10px; border: 1px solid var(--c-border-strong); border-radius: 8px; font: inherit; font-size: 13px; outline: none; }
.tna-ms-menu label { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; font-size: 13px; color: var(--c-text-2); cursor: pointer; }
.tna-ms-menu label:hover { background: #f8fafc; }
.tna-ms-menu .clr { display: block; width: 100%; text-align: left; padding: 6px 8px; border: none; background: none; font: inherit; font-size: 12px; font-weight: 600; color: #2563eb; cursor: pointer; }
.tna-ms-menu .empty { padding: 8px; font-size: 12.5px; color: var(--c-faint); }
.tna-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }
.tna-chip-f { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #1d4ed8; background: #eef4ff; border: 1px solid #dbe6fe; border-radius: 999px; padding: 3px 6px 3px 10px; }
.tna-chip-f button { border: none; background: none; color: inherit; cursor: pointer; padding: 0; display: grid; }

.tna-table-wrap { overflow-x: auto; }
.tna-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.tna-table th { padding: 10px 14px; text-align: left; white-space: nowrap; background: #f8fafc; border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.tna-table th.sortable { cursor: pointer; user-select: none; }
.tna-table th.sortable:hover, .tna-table th.sorted { color: var(--c-text); }
.tna-table th .th { display: inline-flex; align-items: center; gap: 4px; }
.tna-table td { padding: 11px 14px; border-bottom: 1px solid var(--c-border); color: var(--c-text-2); font-size: 13.5px; vertical-align: middle; }
.tna-table tbody tr { cursor: pointer; transition: background .12s; }
.tna-table tbody tr:hover td { background: #f8fafd; }
.tna-table tbody tr.selected td { background: #f1f6ff; }
.tna-table tbody tr:last-child td { border-bottom: none; }
.tna-table tbody.is-loading { opacity: .55; }
.tna-order { font-weight: 650; color: var(--c-text); }
.tna-sub { font-size: 12px; color: var(--c-faint); margin-top: 2px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tna-ellipsis { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tna-faint { color: var(--c-faint); }

.tna-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
.tna-chip.green { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
.tna-chip.amber { color: #a16207; background: #fefce8; border-color: #fde68a; }
.tna-chip.red { color: #b91c1c; background: #fef2f2; border-color: #fecaca; }
.tna-chip.blue { color: #1d4ed8; background: #eef4ff; border-color: #dbe6fe; }
.tna-chip.violet { color: #6d28d9; background: #f5f3ff; border-color: #ddd6fe; }
.tna-chip.grey { color: #475569; background: #f8fafc; border-color: var(--c-border); }

.tna-progress { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.tna-progress-track { flex: 1; display: flex; gap: 2px; height: 7px; border-radius: 999px; overflow: hidden; background: #fff; }
.tna-progress-track span { height: 100%; background: #e6eaf0; }
.tna-progress-track span.on { background: #2563eb; }
.tna-progress b { font-size: 12.5px; font-variant-numeric: tabular-nums; color: var(--c-text); min-width: 34px; text-align: right; }

.tna-next { display: flex; flex-direction: column; gap: 2px; }
.tna-next b { font-weight: 600; color: var(--c-text); font-size: 13px; }
.tna-next span { font-size: 12px; color: var(--c-muted); }
.tna-warn { color: #b91c1c; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }

.tna-pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 12px 18px; border-top: 1px solid var(--c-border); }
.tna-note { font-size: 12.5px; color: var(--c-muted); font-variant-numeric: tabular-nums; }
.tna-pages { display: flex; gap: 4px; align-items: center; }
.tna-page { min-width: 32px; height: 32px; padding: 0 8px; display: inline-grid; place-items: center; border: 1px solid var(--c-border); border-radius: 8px; background: #fff; color: var(--c-text-2); font: inherit; font-size: 13px; font-weight: 550; cursor: pointer; }
.tna-page:hover:not(:disabled) { border-color: #c7d7fe; color: #2563eb; }
.tna-page.active { background: #2563eb; border-color: #2563eb; color: #fff; }
.tna-page:disabled { opacity: .45; cursor: not-allowed; }
.tna-rows { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--c-muted); }
.tna-rows select { height: 32px; padding: 0 8px; border: 1px solid var(--c-border-strong); border-radius: 8px; background: #fff; font: inherit; font-size: 13px; }

.tna-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 44px 20px; color: var(--c-muted); text-align: center; font-size: 13.5px; }
.tna-empty svg { font-size: 26px; color: var(--c-faint); }
.tna-empty b { color: var(--c-text-2); }
.tna-skel { display: block; border-radius: 8px; background: linear-gradient(90deg, #eef1f5 25%, #f6f8fa 50%, #eef1f5 75%); background-size: 200% 100%; animation: tna-shimmer 1.2s infinite; }
@keyframes tna-shimmer { to { background-position: -200% 0; } }

.tna-grid-2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 18px; }
.tna-grid-3 { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 18px; }
@media (max-width: 1100px) { .tna-grid-2, .tna-grid-3 { grid-template-columns: minmax(0, 1fr); } }
.tna-dl { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px 20px; margin: 0; }
.tna-dl dt { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); margin-bottom: 3px; }
.tna-dl dd { margin: 0; color: var(--c-text); font-weight: 500; word-break: break-word; }

.tna-stages { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.tna-stage { border: 1px solid var(--c-border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; background: #fff; }
.tna-stage.done { border-color: #bbf7d0; background: #f7fdf9; }
.tna-stage.late { border-color: #fecaca; background: #fffafa; }
.tna-stage-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.tna-stage-name { font-weight: 650; }
.tna-stage-weight { font-size: 11.5px; color: var(--c-muted); font-weight: 600; }
.tna-stage-meta { font-size: 12px; color: var(--c-muted); }

.tna-timeline { list-style: none; margin: 0; padding: 0; }
.tna-timeline li { display: grid; grid-template-columns: 18px 1fr auto; gap: 12px; align-items: start; padding: 0 0 14px; position: relative; }
.tna-timeline li::before { content: ""; position: absolute; left: 8px; top: 18px; bottom: 0; width: 2px; background: var(--c-border); }
.tna-timeline li:last-child::before { display: none; }
.tna-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #c7d2e0; background: #fff; margin-top: 1px; display: grid; place-items: center; font-size: 10px; color: #fff; z-index: 1; }
.tna-timeline li.done .tna-dot { background: #15803d; border-color: #15803d; }
.tna-timeline li.overdue .tna-dot { background: #b91c1c; border-color: #b91c1c; }
.tna-timeline li.passed .tna-dot { background: #94a3b8; border-color: #94a3b8; }
.tna-timeline li.next .tna-dot { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,.15); }
.tna-tl-label { font-weight: 600; color: var(--c-text); }
.tna-tl-rule { font-size: 12px; color: var(--c-faint); margin-top: 1px; }
.tna-tl-date { text-align: right; font-variant-numeric: tabular-nums; }
.tna-tl-date b { display: block; font-weight: 600; color: var(--c-text); font-size: 13px; }
.tna-tl-date span { font-size: 12px; color: var(--c-muted); }
.tna-timeline li.overdue .tna-tl-date span { color: #b91c1c; font-weight: 600; }

.tna-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px 16px; }
.tna-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.tna-field.full { grid-column: 1 / -1; }
.tna-field label { font-size: 12px; font-weight: 600; color: var(--c-text-2); }
.tna-field label .req { color: #b91c1c; }
.tna-field input, .tna-field select, .tna-field textarea { height: 38px; padding: 0 11px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: #fff; font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; width: 100%; }
.tna-field textarea { height: auto; min-height: 84px; padding: 9px 11px; resize: vertical; line-height: 1.5; }
.tna-field input:focus, .tna-field select:focus, .tna-field textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.tna-field input[readonly] { background: #f8fafc; color: var(--c-text-2); }
.tna-field .hint { font-size: 12px; color: var(--c-faint); }
.tna-seg { display: inline-flex; border: 1px solid var(--c-border-strong); border-radius: 10px; overflow: hidden; height: 38px; }
.tna-seg button { border: none; background: #fff; padding: 0 16px; font: inherit; font-size: 13.5px; font-weight: 600; color: var(--c-text-2); cursor: pointer; }
.tna-seg button + button { border-left: 1px solid var(--c-border-strong); }
.tna-seg button.on { background: #eef4ff; color: #1d4ed8; }
.tna-picker-list { margin-top: 6px; border: 1px solid var(--c-border); border-radius: 12px; max-height: 300px; overflow-y: auto; }
.tna-picker-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid var(--c-border); cursor: pointer; }
.tna-picker-item:last-child { border-bottom: none; }
.tna-picker-item:hover { background: #f8fafd; }
.tna-picker-item b { font-weight: 650; }
.tna-picker-item span { font-size: 12px; color: var(--c-muted); }
.tna-sticky-foot { position: sticky; bottom: 0; z-index: 10; display: flex; justify-content: flex-end; gap: 10px; padding: 12px 28px; background: rgba(255,255,255,.96); border-top: 1px solid var(--c-border); }

.tna-rem-list { list-style: none; margin: 0; padding: 0; }
.tna-rem { display: grid; grid-template-columns: 6px minmax(0, 1fr) auto auto; gap: 14px; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--c-border); }
.tna-rem:last-child { border-bottom: none; }
.tna-rem-bar { width: 6px; height: 36px; border-radius: 4px; background: #94a3b8; }
.tna-rem.overdue .tna-rem-bar { background: #d03b3b; }
.tna-rem.urgent .tna-rem-bar { background: #fab219; }
.tna-rem.normal .tna-rem-bar { background: #2a78d6; }
.tna-rem-main { min-width: 0; }
.tna-rem-title { font-weight: 650; color: var(--c-text); display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tna-rem-meta { font-size: 12.5px; color: var(--c-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tna-rem-date { text-align: right; font-size: 12.5px; color: var(--c-muted); white-space: nowrap; }
.tna-rem-date b { display: block; color: var(--c-text); font-size: 13px; }
.tna-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tna-tab { height: 34px; padding: 0 13px; border-radius: 999px; border: 1px solid var(--c-border-strong); background: #fff; font: inherit; font-size: 13px; font-weight: 600; color: var(--c-text-2); cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.tna-tab.on { background: #0f172a; border-color: #0f172a; color: #fff; }
.tna-tab .n { font-size: 11.5px; padding: 0 7px; border-radius: 999px; background: rgba(100,116,139,.15); }
.tna-tab.on .n { background: rgba(255,255,255,.2); }

.tna-modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(15,23,42,.35); display: grid; place-items: center; padding: 20px;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif; }
.tna-modal { width: 100%; max-width: 440px; background: #fff; border-radius: 16px; box-shadow: 0 30px 60px -20px rgba(15,23,42,.45); padding: 22px 22px 18px; color: #0f172a; }
.tna-modal h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; }
.tna-modal-body { font-size: 14px; color: #334155; line-height: 1.55; }
.tna-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
.tna-modal .tna-btn { display: inline-flex; align-items: center; height: 38px; padding: 0 15px; border-radius: 10px; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.tna-modal .tna-btn.ghost { background: #fff; color: #334155; border-color: #d5dbe4; }
.tna-modal .tna-btn.primary { background: #2563eb; color: #fff; }
.tna-modal .tna-btn.danger { background: #b91c1c; color: #fff; }
.tna-modal .tna-btn:disabled { opacity: .6; cursor: not-allowed; }
`;
