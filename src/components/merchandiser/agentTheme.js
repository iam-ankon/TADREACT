// Shared look for the Agent pages (list, add, edit). Same tokens as the rest
// of the TAD redesign (sidebar, CSR, Company Docs, Stationery). Scoped .ag-app.

export const AGENT_CSS = `
.ag-app {
  --c-bg: #f3f5f9; --c-surface: #fff; --c-soft: #f8fafc; --c-border: #e6eaf0; --c-border-strong: #d5dbe4;
  --c-text: #0f172a; --c-text-2: #334155; --c-muted: #64748b; --c-faint: #94a3b8;
  --c-primary: #2563eb; --c-primary-dark: #1d4ed8; --c-primary-soft: #eef4ff;
  --c-red: #b91c1c; --c-red-soft: #fef2f2; --c-red-line: #fecaca;
  --c-green: #15803d; --c-green-soft: #f0fdf4; --c-green-line: #bbf7d0;
  flex: 1; min-width: 0; min-height: 100vh; background: var(--c-bg); color: var(--c-text);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; font-size: 14px;
}
.ag-app *, .ag-app *::before, .ag-app *::after { box-sizing: border-box; }
.ag-app button:focus-visible, .ag-app a:focus-visible, .ag-app input:focus-visible,
.ag-app select:focus-visible, .ag-app textarea:focus-visible { outline: 2px solid var(--c-primary); outline-offset: 2px; }

.ag-header {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; padding: 18px 28px 16px; background: rgba(255,255,255,.94);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--c-border);
}
.ag-crumbs { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--c-muted); margin-bottom: 4px; }
.ag-crumbs a { color: var(--c-muted); text-decoration: none; }
.ag-crumbs a:hover { color: var(--c-primary); }
.ag-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--c-primary); margin-bottom: 4px; }
.ag-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.ag-subtitle { margin: 4px 0 0; color: var(--c-muted); font-size: 13.5px; }
.ag-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ag-body { padding: 22px 28px 32px; max-width: 1400px; margin: 0 auto; }
.ag-count { font-size: 12px; font-weight: 600; color: var(--c-primary-dark); background: var(--c-primary-soft); border: 1px solid #dbe6fe; border-radius: 999px; padding: 1px 9px; }

.ag-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 15px;
  border-radius: 10px; font: inherit; font-size: 13.5px; font-weight: 600; text-decoration: none; cursor: pointer;
  white-space: nowrap; border: 1px solid transparent; transition: background .15s, border-color .15s, color .15s;
}
.ag-btn:disabled { opacity: .55; cursor: not-allowed; }
.ag-btn.primary { background: var(--c-primary); color: #fff; box-shadow: 0 1px 2px rgba(37,99,235,.25); }
.ag-btn.primary:hover:not(:disabled) { background: var(--c-primary-dark); }
.ag-btn.ghost { background: var(--c-surface); color: var(--c-text-2); border-color: var(--c-border-strong); }
.ag-btn.ghost:hover:not(:disabled) { background: var(--c-soft); }
.ag-btn.danger-ghost { background: var(--c-surface); color: var(--c-red); border-color: var(--c-red-line); }
.ag-btn.danger-ghost:hover:not(:disabled) { background: var(--c-red-soft); }
.ag-btn.sm { height: 30px; padding: 0 10px; font-size: 12.5px; border-radius: 8px; }
.ag-icon-btn {
  width: 30px; height: 30px; display: inline-grid; place-items: center; flex-shrink: 0; border-radius: 8px;
  border: 1px solid var(--c-border); background: var(--c-surface); color: var(--c-muted); cursor: pointer; font-size: 14px; transition: all .15s;
}
.ag-icon-btn:hover:not(:disabled) { color: var(--c-primary); border-color: #c7d7fe; background: var(--c-primary-soft); }
.ag-icon-btn.danger:hover:not(:disabled) { color: var(--c-red); border-color: var(--c-red-line); background: var(--c-red-soft); }
.ag-icon-btn:disabled { opacity: .45; cursor: not-allowed; }

.ag-alert { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px 10px 14px; border-radius: 10px; margin-bottom: 16px; font-size: 13.5px; font-weight: 500; border: 1px solid; }
.ag-alert > svg { flex-shrink: 0; margin-top: 2px; }
.ag-alert span { flex: 1; }
.ag-alert.ok { background: var(--c-green-soft); border-color: var(--c-green-line); color: var(--c-green); }
.ag-alert.err { background: var(--c-red-soft); border-color: var(--c-red-line); color: var(--c-red); }
.ag-alert .ag-icon-btn { width: 24px; height: 24px; background: transparent; border-color: transparent; color: inherit; }

.ag-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden; }
.ag-toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--c-border); }
.ag-search { position: relative; flex: 1 1 260px; max-width: 440px; }
.ag-search input { width: 100%; height: 38px; padding: 0 34px 0 36px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; }
.ag-search input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ag-search > svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--c-faint); }
.ag-search .clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; display: grid; place-items: center; border: none; border-radius: 6px; background: var(--c-soft); color: var(--c-muted); cursor: pointer; }
.ag-spacer { flex: 1; }
.ag-note { font-size: 12.5px; color: var(--c-muted); }

.ag-table-wrap { overflow-x: auto; }
.ag-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.ag-table th { padding: 10px 14px; text-align: left; white-space: nowrap; background: var(--c-soft); border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); }
.ag-table th.sortable { cursor: pointer; user-select: none; }
.ag-table th.sortable:hover, .ag-table th.sorted { color: var(--c-text); }
.ag-table th .th { display: inline-flex; align-items: center; gap: 4px; }
.ag-table td { padding: 12px 14px; border-bottom: 1px solid var(--c-border); color: var(--c-text-2); vertical-align: middle; font-size: 13.5px; }
.ag-table tbody tr { cursor: pointer; transition: background .12s; }
.ag-table tbody tr:hover td { background: #f8fafd; }
.ag-table tbody tr:last-child td { border-bottom: none; }
.ag-table .right { text-align: right; }
.ag-person { display: flex; align-items: center; gap: 11px; min-width: 200px; }
.ag-avatar { flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-weight: 700; font-size: 13px; color: var(--c-primary-dark); background: linear-gradient(135deg,#eef4ff,#e0e7ff); border: 1px solid #dbe6fe; }
.ag-avatar.lg { width: 56px; height: 56px; border-radius: 16px; font-size: 20px; }
.ag-name { font-weight: 600; color: var(--c-text); }
.ag-sub { display: block; font-size: 12px; color: var(--c-faint); margin-top: 1px; }
.ag-contact { display: inline-flex; align-items: center; gap: 6px; color: var(--c-text-2); text-decoration: none; white-space: nowrap; }
.ag-contact svg { color: var(--c-faint); flex-shrink: 0; }
a.ag-contact:hover { color: var(--c-primary); }
.ag-address { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 340px; color: var(--c-muted); }
.ag-row-actions { display: flex; gap: 6px; justify-content: flex-end; }

.ag-pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--c-border); }
.ag-page-info { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 13px; color: var(--c-muted); }
.ag-page-info strong { color: var(--c-text); font-weight: 600; }
.ag-page-info select { height: 30px; margin-left: 10px; padding: 0 6px; border: 1px solid var(--c-border-strong); border-radius: 8px; background: var(--c-surface); font: inherit; font-size: 13px; }
.ag-pages { display: flex; gap: 4px; }
.ag-page { min-width: 34px; height: 34px; padding: 0 8px; display: inline-grid; place-items: center; border-radius: 8px; border: 1px solid var(--c-border); background: var(--c-surface); color: var(--c-text-2); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.ag-page:hover:not(:disabled):not(.active) { background: var(--c-soft); }
.ag-page.active { background: var(--c-primary); border-color: var(--c-primary); color: #fff; }
.ag-page:disabled { opacity: .45; cursor: not-allowed; }

.ag-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 24px; color: var(--c-muted); }
.ag-state h3 { margin: 0 0 6px; font-size: 16px; color: var(--c-text); }
.ag-state p { margin: 0 0 16px; font-size: 13.5px; }
.ag-state-icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; font-size: 24px; color: var(--c-faint); background: var(--c-soft); border: 1px solid var(--c-border); margin-bottom: 14px; }
.ag-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 50vh; color: var(--c-muted); }
.ag-spinner { width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--c-border); border-top-color: var(--c-primary); animation: ag-spin .8s linear infinite; }
.ag-spinner.sm { width: 14px; height: 14px; border-width: 2px; }
.ag-btn.primary .ag-spinner.sm { border-color: rgba(255,255,255,.35); border-top-color: #fff; }
.ag-spin { animation: ag-spin .8s linear infinite; }
@keyframes ag-spin { to { transform: rotate(360deg); } }

/* Form */
.ag-form-card { max-width: 760px; margin: 0 auto; }
.ag-form-head { display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--c-border); }
.ag-form-head h2 { margin: 0; font-size: 16px; font-weight: 700; }
.ag-form-head p { margin: 2px 0 0; font-size: 13px; color: var(--c-muted); }
.ag-form-body { padding: 20px; }
.ag-form-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 14px 20px; background: var(--c-soft); border-top: 1px solid var(--c-border); }
.ag-form-foot .right { display: flex; gap: 10px; margin-left: auto; }
.ag-field { margin-bottom: 16px; }
.ag-field label { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: var(--c-text-2); margin-bottom: 6px; }
.ag-field label .req { color: var(--c-red); }
.ag-field label .count { font-weight: 500; color: var(--c-faint); }
.ag-input-wrap { position: relative; }
.ag-input-wrap > svg { position: absolute; left: 12px; top: 12px; color: var(--c-faint); pointer-events: none; }
.ag-input { width: 100%; padding: 9px 12px 9px 36px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); font: inherit; font-size: 13.5px; color: var(--c-text); outline: none; transition: border-color .15s, box-shadow .15s; }
.ag-input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ag-input.invalid { border-color: #ef4444; }
textarea.ag-input { resize: vertical; min-height: 90px; }
.ag-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.ag-field-error { font-size: 12px; color: var(--c-red); margin-top: 5px; }

/* Chips, KPIs, select, sections (Buyer pages) */
.ag-chips { display: flex; flex-wrap: wrap; gap: 4px; max-width: 260px; }
.ag-chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
.ag-chip.blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.ag-chip.violet { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
.ag-chip.amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.ag-chip.green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.ag-chip.more { background: transparent; color: var(--c-faint); border-color: transparent; padding: 2px 4px; cursor: help; }
.ag-chip button { display: grid; place-items: center; width: 16px; height: 16px; border: none; border-radius: 999px; background: transparent; color: inherit; cursor: pointer; padding: 0; }
.ag-chip button:hover { background: rgba(15,23,42,.08); }
.ag-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 18px; }
.ag-kpi { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 14px; background: var(--c-surface); border: 1px solid var(--c-border); box-shadow: 0 1px 2px rgba(15,23,42,.04); }
.ag-kpi-icon { flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px; display: grid; place-items: center; font-size: 19px; }
.ag-kpi-value { display: block; font-size: 22px; font-weight: 700; line-height: 1.15; letter-spacing: -.02em; }
.ag-kpi-label { display: block; font-size: 13px; font-weight: 600; color: var(--c-text-2); margin-top: 2px; }
.t-blue { color: #1d4ed8; background: #eff6ff; } .t-violet { color: #6d28d9; background: #f5f3ff; }
.t-amber { color: #b45309; background: #fffbeb; } .t-green { color: #15803d; background: #f0fdf4; }
.ag-select { height: 38px; padding: 0 12px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); color: var(--c-text-2); font: inherit; font-size: 13.5px; cursor: pointer; outline: none; }
.ag-select:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ag-section { margin-bottom: 16px; }
.ag-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--c-border); }
.ag-section-head h2 { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 14.5px; font-weight: 700; }
.ag-section-head h2 svg { color: var(--c-muted); }
.ag-section-head p { margin: 2px 0 0; font-size: 12.5px; color: var(--c-muted); }
.ag-section-body { padding: 16px; }
.ag-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px 24px; }
.ag-info-grid .k { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-faint); margin-bottom: 4px; }
.ag-info-grid .v { font-size: 14px; color: var(--c-text); word-break: break-word; }
.ag-empty-line { padding: 22px 16px; color: var(--c-muted); font-size: 13.5px; text-align: center; }

/* Row editor table */
.ag-rows { width: 100%; border-collapse: separate; border-spacing: 0; }
.ag-rows th { padding: 8px 10px; text-align: left; background: var(--c-soft); border-bottom: 1px solid var(--c-border); font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--c-muted); white-space: nowrap; }
.ag-rows td { padding: 6px 10px; border-bottom: 1px solid var(--c-border); vertical-align: middle; }
.ag-rows tr:last-child td { border-bottom: none; }
.ag-rows .idx { width: 36px; color: var(--c-faint); font-size: 12.5px; font-weight: 600; text-align: center; }
.ag-rows .ops { width: 76px; text-align: right; white-space: nowrap; }
.ag-cell-input { width: 100%; min-width: 120px; padding: 7px 10px; border: 1px solid var(--c-border-strong); border-radius: 8px; background: var(--c-surface); font: inherit; font-size: 13px; color: var(--c-text); outline: none; }
.ag-cell-input:focus { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ag-plain-input { padding-left: 12px !important; }

/* Multi-select */
.ag-ms { position: relative; }
.ag-ms-box { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 42px; padding: 6px 10px; border: 1px solid var(--c-border-strong); border-radius: 10px; background: var(--c-surface); cursor: text; }
.ag-ms-box:focus-within { border-color: var(--c-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ag-ms-box input { flex: 1; min-width: 140px; border: none; outline: none; font: inherit; font-size: 13.5px; background: transparent; color: var(--c-text); padding: 4px 2px; }
.ag-ms-list { position: absolute; z-index: 30; top: calc(100% + 4px); left: 0; right: 0; max-height: 260px; overflow-y: auto; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 10px; box-shadow: 0 12px 32px rgba(15,23,42,.14); padding: 4px; }
.ag-ms-opt { display: block; width: 100%; text-align: left; padding: 8px 10px; border: none; border-radius: 7px; background: transparent; font: inherit; font-size: 13.5px; color: var(--c-text-2); cursor: pointer; }
.ag-ms-opt:hover, .ag-ms-opt.active { background: var(--c-primary-soft); color: var(--c-primary-dark); }
.ag-ms-none { padding: 10px; font-size: 13px; color: var(--c-faint); }

@media (max-width: 760px) {
  .ag-header, .ag-body { padding-left: 16px; padding-right: 16px; }
  .ag-field-grid { grid-template-columns: 1fr; }
}
`;

// Merchandiser customers come back in a few shapes; pick a readable name.
// Note: merchandiser Customer.name is a FK id (a number) to hrms.Customers;
// the readable name is hrms_customer_name. Always returns a string.
export const customerName = (customer) => {
  if (!customer) return "-";
  if (typeof customer !== "object") return String(customer);
  const candidates = [
    customer.hrms_customer_name,
    customer.customer_name,
    customer.name && typeof customer.name === "object" ? customer.name.customer_name || customer.name.name : null,
    typeof customer.name === "string" ? customer.name : null,
    customer.display_name,
  ];
  const found = candidates.find((v) => typeof v === "string" && v.trim());
  return found ? found.trim() : `Customer ${customer.id}`;
};

export const initialsOf = (name) =>
  (name || "?")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";
