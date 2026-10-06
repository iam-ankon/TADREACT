// src/components/merchandiser/orderListTheme.js
//
// Visual theme for the Orders list (OrderList.jsx). Purely cosmetic: it
// overrides values of the existing `styles` keys (same keys, same
// property forms - e.g. borderColor stays borderColor so React never sees
// shorthand/longhand mixing) and adds a scoped stylesheet. No behaviour,
// markup or data handling changes. Same tokens as the rest of the TAD
// redesign (agentTheme.js, tnaShared.jsx).

const T = {
  bg: "#f3f5f9",
  surface: "#ffffff",
  soft: "#f8fafc",
  border: "#e6eaf0",
  borderStrong: "#d5dbe4",
  text: "#0f172a",
  text2: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primarySoft: "#eef4ff",
  font: "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif",
};

const card = {
  background: T.surface,
  borderRadius: "14px",
  boxShadow: "0 1px 2px rgba(15,23,42,.04)",
  border: `1px solid ${T.border}`,
};

const OVERRIDES = {
  appContainer: { background: T.bg, fontFamily: T.font, color: T.text },
  mainContent: { padding: "0" },
  orderDashboard: { maxWidth: "none", padding: "0 28px 28px", gap: "18px" },

  // Sticky white header bar across the top, like the other redesigned pages.
  pageHeader: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    margin: "0 -28px",
    padding: "18px 28px 16px",
    background: "rgba(255,255,255,.95)",
    backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${T.border}`,
    alignItems: "flex-end",
  },
  pageTitle: { fontSize: "24px", fontWeight: 700, letterSpacing: "-.02em", color: T.text },
  headerBadge: {
    padding: "1px 10px",
    background: T.primarySoft,
    color: T.primaryDark,
    border: "1px solid #dbe6fe",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    boxShadow: "none",
  },
  headerActions: { gap: "8px" },
  btnPrimary: {
    height: "38px",
    padding: "0 15px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "13.5px",
    background: T.primary,
    boxShadow: "0 1px 2px rgba(37,99,235,.25)",
  },
  btnExport: {
    height: "38px",
    padding: "0 15px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "13.5px",
    borderColor: T.borderStrong,
    color: T.text2,
  },
  btnOutline: { height: "38px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 600, borderColor: T.borderStrong, color: T.text2 },
  btnOutlineSmall: { height: "34px", borderRadius: "9px", fontSize: "13px", fontWeight: 600, borderColor: T.borderStrong, color: T.text2 },
  btnActiveSmall: { background: T.primarySoft, borderColor: "#93b4fb", color: T.primaryDark },

  // Stats + filter blocks become regular cards with a header row.
  statsSection: { ...card, padding: "0", overflow: "visible" },
  statsHeader: { padding: "12px 18px", marginBottom: "0", borderBottom: `1px solid ${T.border}` },
  statsTitle: { fontSize: "14.5px", fontWeight: 650, color: T.text },
  toggleStatsBtn: {
    height: "32px",
    padding: "0 11px",
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: 600,
    borderColor: T.borderStrong,
    color: T.text2,
    marginBottom: "0",
  },
  statsGrid: { padding: "16px 18px", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" },
  statCard: {
    background: T.surface,
    borderRadius: "12px",
    padding: "14px 16px",
    gap: "12px",
    boxShadow: "none",
    borderColor: T.border,
    alignItems: "center",
  },
  statIcon: { width: "38px", height: "38px", borderRadius: "10px", fontSize: "16px" },
  statLabel: { fontSize: "12.5px", fontWeight: 600, color: T.muted, marginBottom: "4px" },
  statValue: { fontSize: "20px", fontWeight: 700, letterSpacing: "-.02em", color: T.text, marginBottom: "2px", fontVariantNumeric: "tabular-nums", wordBreak: "normal", whiteSpace: "nowrap" },
  statSubInfo: { fontSize: "12.5px", color: T.muted },
  statSmallInfo: { fontSize: "11.5px", color: T.faint },

  filtersSection: { background: "transparent", borderRadius: "0", padding: "14px 18px", boxShadow: "none", border: "none" },
  filtersHeader: { marginBottom: "12px", minHeight: "0" },
  // The block already has a "Filter" heading; the second "Filters" title is hidden.
  filtersTitle: { display: "none" },
  clearFilters: { height: "32px", padding: "0 11px", borderRadius: "8px", fontWeight: 600, fontSize: "12.5px", background: T.surface, borderColor: T.borderStrong, color: T.text2 },
  filtersGrid: { gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginBottom: "12px" },
  filterSelect: { height: "38px", padding: "0 12px", borderRadius: "10px", borderColor: T.borderStrong, fontSize: "13.5px", color: T.text2 },
  filterSelectActive: { borderColor: "#93b4fb", background: "#f5f8ff" },
  searchInputSmall: { height: "38px", borderRadius: "10px", borderColor: T.borderStrong, fontSize: "13.5px", padding: "0 30px 0 34px" },

  tableSection: { ...card },
  tableHeader: { padding: "14px 18px", borderBottom: `1px solid ${T.border}` },
  resultCount: { padding: "1px 9px", background: T.primarySoft, color: T.primaryDark, border: "1px solid #dbe6fe", borderRadius: "999px", fontSize: "12px", fontWeight: 600 },
  tableHeaderCell: {
    padding: "10px 12px",
    fontSize: "11.5px",
    fontWeight: 600,
    letterSpacing: ".04em",
    textTransform: "uppercase",
    color: T.muted,
    background: T.soft,
    borderBottom: `1px solid ${T.border}`,
  },
  tableCell: { padding: "11px 12px", borderBottom: `1px solid ${T.border}`, fontSize: "13.5px", color: T.text2 },
  orderPoNo: { fontWeight: 650, color: T.primaryDark },
  totalValue: { fontWeight: 650, color: T.text, fontVariantNumeric: "tabular-nums" },
  badge: { padding: "3px 9px", borderRadius: "999px", fontSize: "12px", fontWeight: 600 },

  paginationContainer: { padding: "10px 18px", borderTop: `1px solid ${T.border}`, background: T.surface },
  paginationButton: { height: "32px", padding: "0 8px", borderColor: T.border, borderRadius: "8px", fontSize: "13px", color: T.text2, marginBottom: "0", minWidth: "32px" },
  paginationButtonActive: { backgroundColor: T.primary, borderColor: T.primary, color: "#fff" },
  pageSizeSelect: { height: "32px", padding: "0 8px", border: `1px solid ${T.borderStrong}`, borderRadius: "8px", fontSize: "13px" },

  // Small decorative icons in front of every cell value only added noise.
  icon: { display: "none" },
  orderStyle: { fontSize: "12px", color: T.faint, marginTop: "2px" },
  noImageIcon: { display: "none" },
  noImageText: { color: "#cbd5e1", fontSize: "13px" },
  noRemarks: { color: "#cbd5e1", fontStyle: "normal" },
  companyInfo: { gap: "0", minWidth: 0, overflow: "hidden" },
  orderInfo: { minWidth: 0, overflow: "hidden" },
  dateInfo: { gap: "4px" },
  // Sort arrow sits beside the label instead of wrapping under it.
  columnHeaderContent: { display: "inline-flex", verticalAlign: "middle" },
  dragHandle: { marginRight: "4px" },
  headerLeft: { gap: "10px" },
  dropdownMenu: { borderRadius: "12px", boxShadow: "0 16px 32px -12px rgba(15,23,42,.3)" },
  dropdownMenuMultiSelect: { borderRadius: "12px", boxShadow: "0 16px 32px -12px rgba(15,23,42,.3)" },
  columnSelectorDropdown: { borderRadius: "12px", boxShadow: "0 16px 32px -12px rgba(15,23,42,.3)" },
  selectedTag: { borderRadius: "999px", fontWeight: 600 },
  filterTag: { borderRadius: "999px", fontWeight: 600 },
};

export const withOrderListTheme = (base) => {
  const out = { ...base };
  Object.entries(OVERRIDES).forEach(([key, value]) => {
    if (out[key]) out[key] = { ...out[key], ...value };
  });
  return out;
};

// Status row tints: same meaning (Shipped rows stand out), lighter colours;
// the old selected-row colour (#6a88af) made the text hard to read.
export const ROW_TINT = {
  shipped: "#cfeedd",
  other: "#ffffff",
  selected: "#e8f0fe",
};

export const ORDER_LIST_CSS = `
  .order-list-themed .ol-eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #2563eb; margin-bottom: 4px; }
  .order-list-themed .ol-subtitle { margin: 4px 0 0; color: #64748b; font-size: 13.5px; }
  .order-list-themed th .ol-grip { opacity: 0 !important; transition: opacity .15s; }
  .order-list-themed th:hover .ol-grip { opacity: .55 !important; }
  .order-list-themed th .sort-icon { margin-left: 4px; vertical-align: middle; }
  .order-list-themed td > div > span:not([style]) { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .order-list-themed tbody tr:hover td { background-color: #f6f9ff !important; }
  .order-list-themed .stat-card:hover { transform: none; box-shadow: none; border-color: #c7d7fe; }
  .order-list-themed button:focus-visible, .order-list-themed input:focus-visible,
  .order-list-themed select:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
`;
