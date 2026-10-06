// src/components/merchandiser/detailOrderTheme.js
//
// Visual theme for the order details page (DetailOrder.jsx). Purely
// cosmetic: overrides values of existing `styles` keys, keeping each key's
// property forms (border stays border, borderColor stays borderColor) so
// React never sees shorthand/longhand mixing. No behaviour or markup
// changes. Same tokens as orderListTheme.js.

const T = {
  bg: "#f3f5f9",
  border: "#e6eaf0",
  borderStrong: "#d5dbe4",
  text: "#0f172a",
  text2: "#334155",
  muted: "#64748b",
  primary: "#2563eb",
  primarySoft: "#eef4ff",
  font: "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif",
};

const OVERRIDES = {
  appContainer: { background: T.bg, fontFamily: T.font },
  mainContent: { padding: "0 28px 28px" },
  orderDetailContainer: { maxWidth: "none" },

  pageHeader: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    margin: "0 -28px 18px",
    padding: "18px 28px 16px",
    background: "rgba(255,255,255,.95)",
    backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${T.border}`,
    alignItems: "flex-end",
  },
  pageTitle: { fontSize: "24px", fontWeight: 700, letterSpacing: "-.02em" },
  pageSubtitle: { fontSize: "13.5px", color: T.muted },
  btnIcon: { padding: "0", width: "38px", height: "38px", alignItems: "center", justifyContent: "center", borderRadius: "10px", border: `1px solid ${T.borderStrong}`, color: T.text2 },
  btnPrimary: { height: "38px", padding: "0 15px", gap: "8px", borderRadius: "10px", fontWeight: 600, fontSize: "13.5px", boxShadow: "0 1px 2px rgba(37,99,235,.25)" },
  btnDanger: { height: "38px", padding: "0 15px", gap: "8px", borderRadius: "10px", fontWeight: 600, fontSize: "13.5px", background: "#b91c1c" },
  btnOutline: { borderRadius: "10px", fontWeight: 600 },

  progressSection: { borderRadius: "14px", padding: "16px 18px", marginBottom: "18px", border: `1px solid ${T.border}`, boxShadow: "0 1px 2px rgba(15,23,42,.04)" },

  statsGrid: { gap: "14px", marginBottom: "18px" },
  metricCard: { borderRadius: "14px", padding: "14px 16px", gap: "12px", border: `1px solid ${T.border}`, boxShadow: "0 1px 2px rgba(15,23,42,.04)" },
  metricIcon: { width: "38px", height: "38px", borderRadius: "10px", fontSize: "16px" },
  metricTitle: { fontSize: "12.5px", fontWeight: 600, color: T.muted },
  metricValue: { fontSize: "21px", letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" },

  tabsContainer: { gap: "4px", borderRadius: "14px", padding: "6px", border: `1px solid ${T.border}`, marginBottom: "18px", boxShadow: "0 1px 2px rgba(15,23,42,.04)" },
  tabButton: { padding: "0 14px", height: "36px", borderRadius: "9px", fontSize: "13.5px", fontWeight: 600, color: T.muted },
  tabButtonActive: { background: T.primarySoft, color: "#1d4ed8" },

  twoColumnGrid: { gap: "18px" },
  sectionCard: { borderRadius: "14px", border: `1px solid ${T.border}`, marginBottom: "18px", boxShadow: "0 1px 2px rgba(15,23,42,.04)" },
  sectionHeader: { padding: "13px 18px", borderBottom: `1px solid ${T.border}`, background: "#ffffff" },
  sectionHeading: { fontSize: "14.5px", fontWeight: 650, color: T.text },
  sectionContent: { padding: "8px 18px 14px" },
  infoRow: { padding: "9px 0", borderBottom: `1px solid ${T.border}` },
  infoLabel: { fontSize: "13.5px", color: T.muted },
  infoValue: { fontSize: "13.5px", fontWeight: 600, color: T.text, textAlign: "right" },
};

export const withDetailOrderTheme = (base) => {
  const out = { ...base };
  Object.entries(OVERRIDES).forEach(([key, value]) => {
    if (out[key]) out[key] = { ...out[key], ...value };
  });
  return out;
};
