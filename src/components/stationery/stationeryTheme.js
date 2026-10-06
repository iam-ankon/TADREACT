// Shared look for the Stationery pages (Inventory, Requests & Usage, Stock
// Report, My Requests). Same tokens as the CSR / Finance / Company Docs
// redesign and the department sidebar. Scoped under .sp-app.

export const STATIONERY_CSS = `
.sp-app {
  --c-bg: #f3f5f9; --c-surface: #ffffff; --c-soft: #f8fafc;
  --c-border: #e6eaf0; --c-border-strong: #d5dbe4;
  --c-text: #0f172a; --c-text-2: #334155; --c-muted: #64748b; --c-faint: #94a3b8;
  --c-primary: #2563eb; --c-primary-dark: #1d4ed8; --c-primary-soft: #eef4ff;
  --c-green: #15803d; --c-green-soft: #f0fdf4; --c-green-line: #bbf7d0;
  --c-amber: #b45309; --c-amber-soft: #fffbeb; --c-amber-line: #fde68a;
  --c-red: #b91c1c; --c-red-soft: #fef2f2; --c-red-line: #fecaca;
  --c-blue: #1d4ed8; --c-blue-soft: #eff6ff; --c-blue-line: #bfdbfe;
  --c-violet: #6d28d9; --c-violet-soft: #f5f3ff; --c-violet-line: #ddd6fe;
  --c-gray: #475569; --c-gray-soft: #f1f5f9; --c-gray-line: #e2e8f0;
  min-height: 100vh; background: var(--c-bg); color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.sp-app *, .sp-app *::before, .sp-app *::after { box-sizing: border-box; }
.sp-app button:focus-visible, .sp-app a:focus-visible, .sp-app input:focus-visible,
.sp-app select:focus-visible, .sp-app textarea:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

.sp-header {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 18px 28px 16px; background: rgba(255,255,255,.94);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-border);
}
.sp-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--c-primary); margin-bottom: 4px; }
.sp-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.sp-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.sp-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sp-body { padding: 22px 28px 32px; max-width: 1600px; margin: 0 auto; }

.sp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 15px;
  border-radius: 10px; font: inherit; font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer;
  white-space: nowrap; border: 1px solid transparent; transition: background .15s, border-color .15s, color .15s;
}
.sp-btn:disabled { opacity: .55; cursor: not-allowed; }
.sp-btn.primary { background: var(--c-primary); color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.sp-btn.primary:hover:not(:disabled) { background: var(--c-primary-dark); }
.sp-btn.ghost { background: var(--c-surface); color: var(--c-text-2); border-color: var(--c-border-strong); }
.sp-btn.ghost:hover:not(:disabled) { background: var(--c-soft); }
.sp-btn.success { background: var(--c-green); color: #fff; }
.sp-btn.success:hover:not(:disabled) { background: #166534; }
.sp-btn.danger { background: var(--c-red); color: #fff; }
.sp-btn.danger:hover:not(:disabled) { background: #991b1b; }
.sp-btn.sm { height: 30px; padding: 0 10px; font-size: 12.5px; border-radius: 8px; gap: 6px; }
.sp-icon-btn {
  width: 30px; height: 30px; display: inline-grid; place-items: center; flex-shrink: 0; border-radius: 8px;
  border: 1px solid var(--c-border); background: var(--c-surface); color: var(--c-muted); cursor: pointer; font-size: 14px; transition: all .15s;
}
.sp-icon-btn:hover:not(:disabled) { color: var(--c-primary); border-color: #c7d7fe; background: var(--c-primary-soft); }
.sp-icon-btn.danger:hover:not(:disabled) { color: var(--c-red); border-color: var(--c-red-line); background: var(--c-red-soft); }
.sp-icon-btn.ok:hover:not(:disabled) { color: var(--c-green); border-color: var(--c-green-line); background: var(--c-green-soft); }
.sp-icon-btn.on { color: var(--c-primary); border-color: #c7d7fe; background: var(--c-primary-soft); }
.sp-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.sp-link-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--c-primary); font: inherit; font-size: 13px; font-weight: 600; }
.sp-link-btn:hover { text-decoration: underline; }

.sp-alert { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13.5px; font-weight: 500; border: 1px solid; }
.sp-alert > svg { flex-shrink: 0; margin-top: 2px; }
.sp-alert span { flex: 1; }
.sp-alert.ok { background: var(--c-green-soft); border-color: var(--c-green-line); color: var(--c-green); }
.sp-alert.err { background: var(--c-red-soft); border-color: var(--c-red-line); color: var(--c-red); }
.sp-alert.info { background: var(--c-blue-soft); border-color: var(--c-blue-line); color: var(--c-blue); }
.sp-alert .sp-icon-btn { width: 24px; height: 24px; background: transparent; border-color: transparent; color: inherit; }

.sp-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 18px; }
.sp-kpi {
  display: flex; align-items: center; gap: 14px; text-align: left; font: inherit; color: inherit; padding: 16px;
  border-radius: 14px; background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: 0 1px 2px rgba(15,23,42,.04);
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
button.sp-kpi { cursor: pointer; }
button.sp-kpi:hover { border-color: var(--c-border-strong); box-shadow: 0 4px 14px rgba(15,23,42,.06); transform: translateY(-1px); }
.sp-kpi.active { border-color: var(--k); box-shadow: 0 0 0 3px var(--k-ring); }
.sp-kpi-icon { flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; font-size: 19px; color: var(--k); background: var(--k-soft); }
.sp-kpi-value { display: block; font-size: 22px; font-weight: 700; line-height: 1.15; letter-spacing: -.02em; }
.sp-kpi-label { display: block; font-size: 13px; font-weight: 600; color: var(--c-text-2); margin-top: 2px; }
.sp-kpi-hint { display: block; font-size: 11.5px; color: var(--c-faint); margin-top: 1px; }
.k-blue { --k: var(--c-blue); --k-soft: var(--c-blue-soft); --k-ring: rgba(37,99,235,.12); }
.k-green { --k: var(--c-green); --k-soft: var(--c-green-soft); --k-ring: rgba(21,128,61,.12); }
.k-amber { --k: var(--c-amber); --k-soft: var(--c-amber-soft); --k-ring: rgba(180,83,9,.12); }
.k-red { --k: var(--c-red); --k-soft: var(--c-red-soft); --k-ring: rgba(185,28,28,.12); }
.k-violet { --k: var(--c-violet); --k-soft: var(--c-violet-soft); --k-ring: rgba(109,40,217,.12); }
.k-gray { --k: var(--c-gray); --k-soft: var(--c-gray-soft); --k-ring: rgba(71,85,105,.12); }

.sp-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
.sp-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--c-border); }
.sp-card-head h2 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 700; }
.sp-card-head h2 svg { color: var(--c-muted); }
.sp-card-body { padding: 16px; }

.sp-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--c-border); }
.sp-search { position: relative; flex: 1 1 240px; max-width: 420px; }
.sp-search input { width: 100%; height: 38px; padding: 0 34px 0 36px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; }
.sp-search input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.sp-search > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-faint); }
.sp-search .clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: grid; place-items: center; border: none; border-radius: 6px; background: var(--c-soft); color: var(--c-muted); cursor: pointer; }
.sp-select { height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); color: var(--c-text-2); font: inherit; font-size: 13.5px; cursor: pointer; outline: none; }
.sp-select:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.sp-seg { display: inline-flex; padding: 3px; gap: 2px; background: var(--c-surface); border: 1px solid var(--c-border-strong); border-radius: 10px; }
.sp-seg button { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border: none; border-radius: 7px; background: transparent; color: var(--c-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.sp-seg button:hover { color: var(--c-text); }
.sp-seg button.on { background: var(--c-primary-soft); color: var(--c-primary-dark); }
.sp-seg .n { font-size: 11.5px; color: var(--c-faint); font-weight: 600; }
.sp-seg button.on .n { color: var(--c-primary); }
.sp-spacer { flex: 1; }
.sp-note { font-size: 12.5px; color: var(--c-muted); }

.sp-table-wrap { overflow-x: auto; }
.sp-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.sp-table th { padding: 10px 14px; text-align: left; white-space: nowrap; background: var(--c-soft); border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.sp-table th.sortable { cursor: pointer; user-select: none; }
.sp-table th.sortable:hover, .sp-table th.sorted { color: var(--c-text); }
.sp-table th .th { display: inline-flex; align-items: center; gap: 4px; }
.sp-table td { padding: 11px 14px; border-bottom: 1px solid var(--c-border); color: var(--c-text-2); vertical-align: middle; font-size: 13.5px; }
.sp-table tr.row { cursor: pointer; }
.sp-table tr.row:hover td { background: #f8fafd; }
.sp-table tr.row.open td { background: var(--c-soft); }
.sp-table tbody tr:last-child td { border-bottom: none; }
.sp-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.sp-table .right { text-align: right; }
.sp-detail td { background: var(--c-soft) !important; padding: 4px 14px 16px !important; }
.sp-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px 24px; padding-top: 10px; }
.sp-detail-grid .k { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-faint); margin-bottom: 3px; }
.sp-detail-grid .v { font-size: 13.5px; color: var(--c-text); white-space: pre-wrap; word-break: break-word; }

.strong { font-weight: 600; color: var(--c-text); }
.muted { color: var(--c-muted); }
.faint { color: var(--c-faint); }
.small { font-size: 12.5px; }
.nowrap { white-space: nowrap; }
.sp-cell-sub { display: block; font-size: 12px; color: var(--c-muted); margin-top: 2px; }
.sp-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 320px; }

.sp-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; border: 1px solid transparent; text-transform: capitalize; }
.sp-pill svg { font-size: 12px; }
.sp-pill.green { color: var(--c-green); background: var(--c-green-soft); border-color: var(--c-green-line); }
.sp-pill.amber { color: var(--c-amber); background: var(--c-amber-soft); border-color: var(--c-amber-line); }
.sp-pill.red { color: var(--c-red); background: var(--c-red-soft); border-color: var(--c-red-line); }
.sp-pill.blue { color: var(--c-blue); background: var(--c-blue-soft); border-color: var(--c-blue-line); }
.sp-pill.violet { color: var(--c-violet); background: var(--c-violet-soft); border-color: var(--c-violet-line); }
.sp-pill.gray { color: var(--c-gray); background: var(--c-gray-soft); border-color: var(--c-gray-line); }
.sp-count { font-size: 12px; font-weight: 600; color: var(--c-primary-dark); background: var(--c-primary-soft); border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 9px; }

.sp-meter { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.sp-meter .track { flex: 1; height: 6px; border-radius: 999px; background: var(--c-gray-soft); overflow: hidden; }
.sp-meter .track span { display: block; height: 100%; border-radius: 999px; }
.sp-avatar { flex-shrink: 0; width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; font-weight: 700; font-size: 13px; color: var(--c-primary-dark); background: linear-gradient(135deg,#eef4ff,#e0e7ff); border: 1px solid #dbe6fe; }
.sp-person { display: flex; align-items: center; gap: 10px; min-width: 180px; }
.sp-actions-cell { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }

.sp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; padding: 16px; }
.sp-tile { position: relative; display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 14px; background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: box-shadow .15s, border-color .15s; }
.sp-tile:hover { border-color: var(--c-border-strong); box-shadow: 0 6px 18px rgba(15,23,42,.06); }
.sp-tile::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 0 3px 3px 0; background: var(--accent, transparent); }
.sp-tile-top { display: flex; align-items: flex-start; gap: 10px; }
.sp-tile-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-size: 17px; color: var(--c-primary-dark); background: var(--c-primary-soft); }
.sp-tile h3 { margin: 0; font-size: 14.5px; font-weight: 700; line-height: 1.3; }
.sp-tile-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sp-tile-stats .k { font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-faint); }
.sp-tile-stats .v { font-size: 15px; font-weight: 700; color: var(--c-text); }
.sp-tile-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

.sp-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 24px; color: var(--c-muted); }
.sp-state h3 { margin: 0 0 6px; font-size: 16px; color: var(--c-text); }
.sp-state p { margin: 0 0 16px; font-size: 13.5px; }
.sp-state-icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; font-size: 24px; color: var(--c-faint); background: var(--c-soft); border: 1px solid var(--c-border); margin-bottom: 14px; }
.sp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 60vh; color: var(--c-muted); }
.sp-spinner { width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--c-border); border-top-color: var(--c-primary); animation: sp-spin .8s linear infinite; }
.sp-spinner.sm { width: 14px; height: 14px; border-width: 2px; }
.sp-spin { animation: sp-spin .8s linear infinite; }
@keyframes sp-spin { to { transform: rotate(360deg); } }

.sp-modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15,23,42,.45); backdrop-filter: blur(2px); }
.sp-modal { width: 100%; max-height: 92vh; overflow: auto; background: var(--c-surface); border-radius: 16px; box-shadow: 0 24px 64px rgba(15,23,42,.28); }
.sp-modal-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; background: var(--c-surface); border-bottom: 1px solid var(--c-border); }
.sp-modal-head h2 { margin: 0; font-size: 17px; font-weight: 700; }
.sp-modal-head p { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.sp-modal-body { padding: 18px 20px; }
.sp-modal-foot { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; background: var(--c-soft); border-top: 1px solid var(--c-border); }
.sp-field { margin-bottom: 14px; }
.sp-field label { display: block; font-size: 12.5px; font-weight: 600; color: var(--c-text-2); margin-bottom: 5px; }
.sp-field label .req { color: var(--c-red); }
.sp-input { width: 100%; padding: 9px 11px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; transition: border-color .15s, box-shadow .15s; }
.sp-input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
textarea.sp-input { resize: vertical; }
.sp-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.sp-hint { font-size: 12px; color: var(--c-faint); margin-top: 5px; }
.sp-hint.warn { color: var(--c-amber); }
.sp-hint.err { color: var(--c-red); }

.sp-two { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; }
.sp-stat-list { list-style: none; margin: 0; padding: 0; }
.sp-stat-list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--c-border); font-size: 13.5px; }
.sp-stat-list li:last-child { border-bottom: none; }
.sp-stat-list b { font-size: 15px; }

@media (max-width: 1100px) { .sp-two { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 760px) {
  .sp-header, .sp-body { padding-left: 16px; padding-right: 16px; }
  .sp-field-grid { grid-template-columns: 1fr; }
}
@media print {
  .tad-sb-wrap, .tad-menu-btn, .sp-header .sp-actions, .sp-toolbar, .no-print { display: none !important; }
  .sp-app { background: #fff; }
  .sp-header { position: static; border: none; }
  .sp-card, .sp-kpi { box-shadow: none; }
}
`;

export const STOCK_TONE = { "In Stock": "green", "Low Stock": "amber", "Out of Stock": "red" };
export const STOCK_COLOR = { "In Stock": "#22c55e", "Low Stock": "#f59e0b", "Out of Stock": "#ef4444" };
export const REQUEST_TONE = { pending: "amber", approved: "blue", issued: "green", rejected: "red", completed: "gray" };

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Readable API error (DRF field errors, {error}, detail, or a fallback).
export const apiError = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data !== "object") return String(data);
  if (data.error) return String(data.error);
  if (data.detail) return String(data.detail);
  if (data.non_field_errors) return data.non_field_errors.join(", ");
  return (
    Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join(" | ") || fallback
  );
};

/** Fill ratio for a stock meter: full at 2x the reorder level. */
export const stockRatio = (item) => {
  const stock = Number(item.current_stock || 0);
  const target = Math.max(1, Number(item.reorder_level || 0) * 2);
  return Math.max(0, Math.min(1, stock / target));
};
