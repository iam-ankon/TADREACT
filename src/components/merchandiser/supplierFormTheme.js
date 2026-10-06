// Visual theme for the large Add / Edit Supplier forms (AddSupplier.jsx,
// EditSupplier.jsx). Those pages keep their own logic and markup; this only
// overrides their `styles` object (same keys) so they match the rest of TAD
// (Agents / Buyers / Customers / Suppliers list). Keys not listed keep the
// page's original style.

const T = {
  bg: "#f3f5f9",
  surface: "#ffffff",
  soft: "#f8fafc",
  border: "#e6eaf0",
  borderStrong: "#d5dbe4",
  text: "#0f172a",
  text2: "#334155",
  muted: "#64748b",
  primary: "#2563eb",
  primarySoft: "#eef4ff",
};

const btn = {
  height: "38px",
  padding: "0 16px",
  borderRadius: "10px",
  fontSize: "13.5px",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const OVERRIDES = {
  mainContainer: {
    backgroundColor: T.bg,
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif",
    color: T.text,
  },
  contentContainer: { padding: "0 0 32px", maxHeight: "none", overflowY: "visible", minWidth: 0 },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    margin: 0,
    padding: "22px 28px 18px",
    fontSize: "24px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: T.text,
    backgroundColor: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${T.border}`,
  },
  formContainer: {
    margin: "22px 28px 0",
    padding: 0,
    backgroundColor: "transparent",
    boxShadow: "none",
    borderRadius: 0,
  },
  formTitle: { fontSize: "13px", fontWeight: 600, color: T.muted, margin: "0 0 12px", letterSpacing: ".02em" },
  tabContainer: {
    gap: "2px",
    padding: "4px",
    marginBottom: "16px",
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "12px",
    borderBottom: `1px solid ${T.border}`,
  },
  tabButton: {
    padding: "8px 14px",
    borderRadius: "8px",
    borderBottom: "none",
    fontSize: "13px",
    fontWeight: 600,
    color: T.muted,
  },
  activeTab: { color: "#1d4ed8", backgroundColor: T.primarySoft, borderBottom: "none" },
  cardContainer: {
    backgroundColor: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: "14px",
    boxShadow: "0 1px 2px rgba(15,23,42,.04)",
    padding: "18px 20px",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: T.text,
    margin: "0 0 16px",
    paddingBottom: "12px",
    borderBottom: `1px solid ${T.border}`,
  },
  sectionHeader: { fontSize: "12px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em" },
  gridContainer: { gap: "14px 16px" },
  inputGroup: { marginBottom: 0 },
  label: { fontSize: "12.5px", fontWeight: 600, color: T.text2, marginBottom: "6px" },
  input: {
    padding: "9px 11px",
    border: `1px solid ${T.borderStrong}`,
    borderRadius: "10px",
    fontSize: "13.5px",
    backgroundColor: T.surface,
    color: T.text,
  },
  textarea: {
    padding: "9px 11px",
    border: `1px solid ${T.borderStrong}`,
    borderRadius: "10px",
    fontSize: "13.5px",
    backgroundColor: T.surface,
    color: T.text,
  },
  select: {
    padding: "9px 11px",
    border: `1px solid ${T.borderStrong}`,
    borderRadius: "10px",
    fontSize: "13.5px",
    backgroundColor: T.surface,
    color: T.text,
  },
  readOnlyInput: { backgroundColor: T.soft, color: T.muted },
  checkboxLabel: { fontSize: "13.5px", color: T.text2 },
  errorText: { fontSize: "12px", color: "#b91c1c", marginTop: "5px" },
  formButtons: {
    position: "sticky",
    bottom: 0,
    zIndex: 10,
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    margin: "8px 0 0",
    padding: "14px 16px",
    backgroundColor: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(6px)",
    border: `1px solid ${T.border}`,
    borderRadius: "14px",
    boxShadow: "0 -4px 16px rgba(15,23,42,.06)",
  },
  cancelButton: { ...btn, backgroundColor: T.surface, color: T.text2, border: `1px solid ${T.borderStrong}` },
  submitButton: { ...btn, backgroundColor: T.primary, color: "#fff", border: `1px solid ${T.primary}`, boxShadow: "0 1px 2px rgba(37,99,235,.25)" },
  loadingText: { color: T.muted, fontSize: "14px", padding: "60px 28px" },
  existingFileStyle: { backgroundColor: T.soft, border: `1px solid ${T.border}`, borderRadius: "10px" },
  existingFileLinkStyle: { color: "#1d4ed8", fontWeight: 600 },
  deleteFileButton: { borderRadius: "8px" },
  fileStatusText: { fontSize: "12px", color: T.muted },
};

export const withSupplierFormTheme = (base) =>
  Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(OVERRIDES)])].map((k) => [k, { ...(base[k] || {}), ...(OVERRIDES[k] || {}) }]),
  );

// Focus / hover states inline styles can't express. Scoped to .sup-form.
export const SUPPLIER_FORM_CSS = `
.sup-form input:focus, .sup-form textarea:focus, .sup-form select:focus {
  outline: none; border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.sup-form button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.sup-form button[type="submit"]:hover { background-color: #1d4ed8 !important; }
.sup-form input[type="checkbox"] { width: 16px; height: 16px; accent-color: #2563eb; }
.sup-form ::-webkit-scrollbar { height: 6px; }
.sup-form ::-webkit-scrollbar-thumb { background: #d5dbe4; border-radius: 6px; }
`;
