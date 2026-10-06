// Shared look for the Company Documents pages (dashboard + company detail).
// Same tokens as the CSR / Finance redesign and the department sidebar.
// Everything is scoped under .cd-app so nothing leaks into other pages.

export const COMPANY_DOCS_CSS = `
.cd-app {
  --c-bg: #f3f5f9;
  --c-surface: #ffffff;
  --c-soft: #f8fafc;
  --c-border: #e6eaf0;
  --c-border-strong: #d5dbe4;
  --c-text: #0f172a;
  --c-text-2: #334155;
  --c-muted: #64748b;
  --c-faint: #94a3b8;
  --c-primary: #2563eb;
  --c-primary-dark: #1d4ed8;
  --c-primary-soft: #eef4ff;
  --c-green: #15803d; --c-green-soft: #f0fdf4; --c-green-line: #bbf7d0;
  --c-amber: #b45309; --c-amber-soft: #fffbeb; --c-amber-line: #fde68a;
  --c-red: #b91c1c;   --c-red-soft: #fef2f2;   --c-red-line: #fecaca;
  --c-violet: #6d28d9; --c-violet-soft: #f5f3ff; --c-violet-line: #ddd6fe;
  --c-gray: #475569;  --c-gray-soft: #f1f5f9;  --c-gray-line: #e2e8f0;
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif;
  font-size: 14px;
}
.cd-app *, .cd-app *::before, .cd-app *::after { box-sizing: border-box; }
.cd-app button:focus-visible, .cd-app a:focus-visible, .cd-app input:focus-visible,
.cd-app select:focus-visible, .cd-app textarea:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

/* Header */
.cd-header {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding: 18px 28px 16px;
  background: rgba(255,255,255,0.94); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--c-border);
}
.cd-crumbs { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--c-muted); margin-bottom: 4px; }
.cd-crumbs a, .cd-crumbs button { color: var(--c-muted); text-decoration: none; background: none; border: none; padding: 0; cursor: pointer; font: inherit; }
.cd-crumbs a:hover, .cd-crumbs button:hover { color: var(--c-primary); }
.cd-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--c-primary); margin-bottom: 4px; }
.cd-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.cd-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; }
.cd-subtitle span { display: inline-flex; align-items: center; gap: 6px; }
.cd-subtitle svg { color: var(--c-faint); }
.cd-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.cd-body { padding: 22px 28px 32px; max-width: 1600px; margin: 0 auto; }

/* Buttons */
.cd-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 38px; padding: 0 15px; border-radius: 10px; white-space: nowrap;
  font: inherit; font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer;
  border: 1px solid transparent; transition: background .15s, border-color .15s, color .15s;
}
.cd-btn:disabled { opacity: .6; cursor: not-allowed; }
.cd-btn-primary { background: var(--c-primary); color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.cd-btn-primary:hover:not(:disabled) { background: var(--c-primary-dark); }
.cd-btn-ghost { background: var(--c-surface); color: var(--c-text-2); border-color: var(--c-border-strong); }
.cd-btn-ghost:hover:not(:disabled) { background: var(--c-soft); }
.cd-btn-warn { background: var(--c-amber-soft); color: var(--c-amber); border-color: var(--c-amber-line); }
.cd-btn-warn:hover:not(:disabled) { background: #fef3c7; }
.cd-btn-danger { background: var(--c-red); color: #fff; }
.cd-btn-violet { background: var(--c-violet); color: #fff; }
.cd-btn-violet:hover:not(:disabled) { background: #5b21b6; }
.cd-btn-sm { height: 30px; padding: 0 10px; font-size: 12.5px; border-radius: 8px; gap: 6px; }
.cd-icon-btn {
  width: 30px; height: 30px; display: inline-grid; place-items: center; flex-shrink: 0;
  border-radius: 8px; border: 1px solid var(--c-border); background: var(--c-surface);
  color: var(--c-muted); cursor: pointer; transition: all .15s; font-size: 14px;
}
.cd-icon-btn:hover:not(:disabled) { color: var(--c-primary); border-color: #c7d7fe; background: var(--c-primary-soft); }
.cd-icon-btn.danger:hover:not(:disabled) { color: var(--c-red); border-color: var(--c-red-line); background: var(--c-red-soft); }
.cd-icon-btn.on { color: var(--c-primary); border-color: #c7d7fe; background: var(--c-primary-soft); }
.cd-icon-btn:disabled { opacity: .45; cursor: not-allowed; }
.cd-link-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--c-primary); font: inherit; font-size: 13px; font-weight: 600; }
.cd-link-btn:hover { text-decoration: underline; }

/* Alerts */
.cd-alert { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13.5px; font-weight: 500; border: 1px solid; }
.cd-alert > svg { flex-shrink: 0; margin-top: 2px; }
.cd-alert span { flex: 1; }
.cd-alert.ok { background: var(--c-green-soft); border-color: var(--c-green-line); color: var(--c-green); }
.cd-alert.err { background: var(--c-red-soft); border-color: var(--c-red-line); color: var(--c-red); }
.cd-alert.warn { background: var(--c-amber-soft); border-color: var(--c-amber-line); color: var(--c-amber); }
.cd-alert .cd-icon-btn { width: 24px; height: 24px; background: transparent; border-color: transparent; color: inherit; }

/* KPI cards */
.cd-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 20px; }
.cd-kpi {
  display: flex; align-items: center; gap: 14px; text-align: left; font: inherit; color: inherit;
  padding: 16px; border-radius: 14px; background: var(--c-surface); border: 1px solid var(--c-border);
  box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: border-color .15s, box-shadow .15s, transform .15s;
}
button.cd-kpi { cursor: pointer; }
button.cd-kpi:hover { border-color: var(--c-border-strong); box-shadow: 0 4px 14px rgba(15,23,42,.06); transform: translateY(-1px); }
.cd-kpi.active { border-color: var(--k); box-shadow: 0 0 0 3px var(--k-ring); }
.cd-kpi-icon { flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; font-size: 19px; color: var(--k); background: var(--k-soft); }
.cd-kpi-value { display: block; font-size: 24px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.cd-kpi-label { display: block; font-size: 13px; font-weight: 600; color: var(--c-text-2); margin-top: 2px; }
.tone-blue   { --k: #1d4ed8; --k-soft: #eff6ff; --k-ring: rgba(37,99,235,.12); }
.tone-violet { --k: var(--c-violet); --k-soft: var(--c-violet-soft); --k-ring: rgba(109,40,217,.12); }
.tone-red    { --k: var(--c-red); --k-soft: var(--c-red-soft); --k-ring: rgba(185,28,28,.12); }
.tone-amber  { --k: var(--c-amber); --k-soft: var(--c-amber-soft); --k-ring: rgba(180,83,9,.12); }
.tone-green  { --k: var(--c-green); --k-soft: var(--c-green-soft); --k-ring: rgba(21,128,61,.12); }
.tone-gray   { --k: var(--c-gray); --k-soft: var(--c-gray-soft); --k-ring: rgba(71,85,105,.12); }

/* Toolbar */
.cd-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.cd-search { position: relative; flex: 1 1 260px; max-width: 460px; }
.cd-search input { width: 100%; height: 38px; padding: 0 34px 0 36px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; }
.cd-search input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.cd-search > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-faint); }
.cd-search .cd-search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: grid; place-items: center; border: none; border-radius: 6px; background: var(--c-soft); color: var(--c-muted); cursor: pointer; }
.cd-select { height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); color: var(--c-text-2); font: inherit; font-size: 13.5px; cursor: pointer; outline: none; }
.cd-select:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.cd-seg { display: inline-flex; padding: 3px; gap: 2px; background: var(--c-surface); border: 1px solid var(--c-border-strong); border-radius: 10px; }
.cd-seg button { height: 30px; padding: 0 12px; border: none; border-radius: 7px; background: transparent; color: var(--c-muted); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.cd-seg button:hover { color: var(--c-text); }
.cd-seg button.on { background: var(--c-primary-soft); color: var(--c-primary-dark); }
.cd-result-note { font-size: 12.5px; color: var(--c-muted); margin-left: auto; }

/* Pills */
.cd-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; border: 1px solid transparent; }
.cd-pill svg { font-size: 12px; }
.cd-pill.valid { color: var(--c-green); background: var(--c-green-soft); border-color: var(--c-green-line); }
.cd-pill.expiring_soon { color: var(--c-amber); background: var(--c-amber-soft); border-color: var(--c-amber-line); }
.cd-pill.expired { color: var(--c-red); background: var(--c-red-soft); border-color: var(--c-red-line); }
.cd-pill.not_available { color: var(--c-gray); background: var(--c-gray-soft); border-color: var(--c-gray-line); }
.cd-pill.need_apply { color: var(--c-violet); background: var(--c-violet-soft); border-color: var(--c-violet-line); }
.cd-pill.neutral { color: var(--c-muted); background: var(--c-soft); border-color: var(--c-border); }
.cd-count { font-size: 12px; font-weight: 600; color: var(--c-primary-dark); background: var(--c-primary-soft); border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 9px; }

/* Company cards */
.cd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.cd-company {
  position: relative; display: flex; flex-direction: column; gap: 14px; text-align: left;
  padding: 18px; border-radius: 14px; background: var(--c-surface); border: 1px solid var(--c-border);
  box-shadow: 0 1px 2px rgba(15,23,42,.04); cursor: pointer; transition: box-shadow .15s, transform .15s, border-color .15s;
}
.cd-company::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 0 3px 3px 0; background: var(--accent, transparent); }
.cd-company:hover { border-color: var(--c-border-strong); box-shadow: 0 8px 22px rgba(15,23,42,.08); transform: translateY(-2px); }
.cd-company-top { display: flex; align-items: flex-start; gap: 12px; }
.cd-avatar { flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 14px; font-weight: 700; color: var(--c-primary-dark); background: linear-gradient(135deg, #eef4ff, #e0e7ff); border: 1px solid #dbe6fe; }
.cd-company-name { margin: 0; font-size: 15px; font-weight: 700; color: var(--c-text); line-height: 1.3; }
.cd-company-short { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.cd-company-actions { margin-left: auto; display: flex; gap: 4px; opacity: .0; transition: opacity .15s; }
.cd-company:hover .cd-company-actions, .cd-company:focus-within .cd-company-actions { opacity: 1; }
.cd-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cd-health { height: 6px; border-radius: 999px; background: var(--c-gray-soft); overflow: hidden; display: flex; }
.cd-health span { height: 100%; }
.cd-company-foot { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: var(--c-muted); }
.cd-company-foot .go { display: inline-flex; align-items: center; gap: 4px; color: var(--c-primary); font-weight: 600; }

/* Category sections + document table */
.cd-section { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); margin-bottom: 16px; overflow: hidden; }
.cd-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; cursor: pointer; user-select: none; }
.cd-section-head:hover { background: var(--c-soft); }
.cd-section-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cd-section-title h3 { margin: 0; font-size: 14.5px; font-weight: 700; }
.cd-section-icon { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; color: var(--c-primary-dark); background: var(--c-primary-soft); font-size: 15px; }
.cd-section-right { display: flex; align-items: center; gap: 8px; color: var(--c-faint); }
.cd-table-wrap { overflow-x: auto; border-top: 1px solid var(--c-border); }
.cd-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 820px; }
.cd-table th { padding: 10px 14px; text-align: left; white-space: nowrap; background: var(--c-soft); border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.cd-table td { padding: 12px 14px; border-bottom: 1px solid var(--c-border); color: var(--c-text-2); vertical-align: middle; font-size: 13.5px; }
.cd-table tr.cd-row:hover td { background: #f8fafd; }
.cd-table tr.cd-row.open td { background: var(--c-soft); }
.cd-table tbody tr:last-child td { border-bottom: none; }
.cd-doc-name { font-weight: 600; color: var(--c-text); }
.cd-doc-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 3px; font-size: 12px; color: var(--c-muted); }
.cd-doc-meta span { display: inline-flex; align-items: center; gap: 4px; }
.cd-doc-meta svg { color: var(--c-faint); }
.cd-days { font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.cd-days.expired { color: var(--c-red); } .cd-days.expiring_soon { color: var(--c-amber); } .cd-days.valid { color: var(--c-green); }
.cd-remarks { font-size: 12.5px; color: var(--c-muted); max-width: 240px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.cd-actions { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }
.cd-muted { color: var(--c-faint); }
.cd-subrow td { background: var(--c-soft); padding: 10px 14px 14px 14px !important; }
.cd-missing td { background: var(--c-amber-soft) !important; color: var(--c-amber); font-size: 12.5px; padding: 7px 14px !important; }
.cd-missing td span { display: inline-flex; align-items: center; gap: 6px; }

/* Files */
.cd-files { display: flex; flex-wrap: wrap; gap: 8px; }
.cd-file { display: inline-flex; align-items: center; gap: 10px; padding: 7px 8px 7px 10px; border-radius: 10px; background: var(--c-surface); border: 1px solid var(--c-border); max-width: 100%; }
.cd-file-icon { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: var(--c-primary-soft); color: var(--c-primary-dark); flex-shrink: 0; }
.cd-file a, .cd-file .name { font-size: 13px; font-weight: 600; color: var(--c-primary-dark); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }
.cd-file a:hover { text-decoration: underline; }
.cd-file .name { color: var(--c-text-2); }
.cd-file .meta { font-size: 11.5px; color: var(--c-faint); white-space: nowrap; }

/* States */
.cd-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 64px 24px; color: var(--c-muted); background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; }
.cd-state h3 { margin: 0 0 6px; font-size: 16px; color: var(--c-text); }
.cd-state p { margin: 0 0 18px; font-size: 13.5px; }
.cd-state-icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; font-size: 24px; color: var(--c-faint); background: var(--c-soft); border: 1px solid var(--c-border); margin-bottom: 14px; }
.cd-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 60vh; color: var(--c-muted); font-size: 13.5px; }
.cd-spinner { width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--c-border); border-top-color: var(--c-primary); animation: cd-spin .8s linear infinite; }
.cd-spinner.sm { width: 14px; height: 14px; border-width: 2px; }
.cd-spin { animation: cd-spin .8s linear infinite; }
@keyframes cd-spin { to { transform: rotate(360deg); } }

/* Modal */
.cd-modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15,23,42,.45); backdrop-filter: blur(2px); }
.cd-modal { width: 100%; max-height: 92vh; overflow: auto; background: var(--c-surface); border-radius: 16px; box-shadow: 0 24px 64px rgba(15,23,42,.28); }
.cd-modal-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; background: var(--c-surface); border-bottom: 1px solid var(--c-border); }
.cd-modal-head h2 { margin: 0; font-size: 17px; font-weight: 700; }
.cd-modal-head p { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.cd-modal-body { padding: 18px 20px; }
.cd-modal-foot { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; background: var(--c-soft); border-top: 1px solid var(--c-border); }
.cd-field { margin-bottom: 14px; }
.cd-field label { display: block; font-size: 12.5px; font-weight: 600; color: var(--c-text-2); margin-bottom: 5px; }
.cd-field label .req { color: var(--c-red); }
.cd-input { width: 100%; padding: 9px 11px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; transition: border-color .15s, box-shadow .15s; }
.cd-input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
textarea.cd-input { resize: vertical; }
.cd-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.cd-hint { font-size: 12px; color: var(--c-faint); margin-top: 6px; }
.cd-drop { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px; border-radius: 12px; border: 1.5px dashed #c4b5fd; background: var(--c-violet-soft); color: var(--c-violet); text-align: center; cursor: pointer; transition: background .15s, border-color .15s; }
.cd-drop:hover, .cd-drop.drag { background: #ede9fe; border-color: #a78bfa; }
.cd-drop strong { font-size: 13.5px; }
.cd-drop span { font-size: 12px; color: #7c3aed; opacity: .85; }
.cd-drop input { display: none; }
.cd-picked { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--c-border); background: var(--c-surface); font-size: 13px; }
.cd-picked .grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.cd-picked .meta { color: var(--c-faint); font-size: 12px; }

@media (max-width: 760px) {
  .cd-header, .cd-body { padding-left: 16px; padding-right: 16px; }
  .cd-field-grid { grid-template-columns: 1fr; }
  .cd-company-actions { opacity: 1; }
}
`;

export const initialsOf = (name) =>
  (name || "?")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// Fired after companies/documents change so the sidebar refreshes its list.
export const COMPANY_DOCS_CHANGED = "company-docs:changed";
export const notifyCompanyDocsChanged = () => window.dispatchEvent(new Event(COMPANY_DOCS_CHANGED));

// Readable API error (DRF field errors, detail, message, or a fallback).
export const apiErrorMessage = (ex, fallback) => {
  const data = ex?.response?.data;
  if (!data) return fallback;
  if (typeof data !== "object") return String(data);
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" | ");
};
