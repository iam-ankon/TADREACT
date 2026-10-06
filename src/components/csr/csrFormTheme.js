// Shared look for the CSR Add Supplier / Edit Supplier pages.
//
// Each page keeps its own style objects; csrStyle(name, base) layers the
// values below on top, so anything not listed here stays as it was.

const C = {
  bg: "#f3f5f9",
  surface: "#ffffff",
  soft: "#f8fafc",
  border: "#e3e8ef",
  borderStrong: "#cfd7e2",
  text: "#0f172a",
  text2: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primarySoft: "#eff6ff",
  success: "#059669",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  warning: "#d97706",
};

const btn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "40px",
  padding: "0 18px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
  transition: "all 0.15s",
};

const field = {
  width: "100%",
  boxSizing: "border-box",
  height: "40px",
  padding: "0 12px",
  border: `1px solid ${C.borderStrong}`,
  borderRadius: "9px",
  fontSize: "14px",
  color: C.text,
  background: C.surface,
  fontFamily: "inherit",
  outline: "none",
};

const OVERRIDES = {
  // page + header
  containerStyle: {
    backgroundColor: C.bg,
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  headerStyle: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(6px)",
    padding: "16px 32px 14px 32px",
    borderBottom: `1px solid ${C.border}`,
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  headerContentStyle: { gap: "14px", marginBottom: "12px" },
  backButtonStyle: {
    ...btn,
    height: "38px",
    padding: "0 14px",
    backgroundColor: C.surface,
    border: `1px solid ${C.borderStrong}`,
    color: C.text2,
  },
  titleStyle: { fontSize: "22px", fontWeight: 700, color: C.text, margin: "0 0 2px 0", letterSpacing: "-0.02em" },
  subtitleStyle: { fontSize: "13px", color: C.muted },
  progressSectionStyle: { maxWidth: "420px" },
  progressTextStyle: { fontSize: "11px", fontWeight: 700, color: C.muted, marginBottom: "6px", letterSpacing: "0.06em" },
  progressBarStyle: { height: "6px", backgroundColor: "#e2e8f0", borderRadius: "999px" },
  progressFillStyle: {
    background: `linear-gradient(90deg, #3b82f6, ${C.primaryDark})`,
    borderRadius: "999px",
  },
  errorAlertStyle: {
    backgroundColor: C.dangerSoft,
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "12px",
    margin: "16px 32px 0",
    border: "1px solid #fecaca",
    boxShadow: "none",
  },

  // tabs + form card
  contentWrapperStyle: { maxWidth: "1360px", margin: "0 auto", padding: "20px 32px 32px" },
  tabsContainerStyle: {
    backgroundColor: C.surface,
    borderRadius: "14px 14px 0 0",
    border: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    boxShadow: "none",
  },
  tabsStyle: { padding: "0 8px", gap: "2px" },
  tabButtonStyle: {
    padding: "14px 14px",
    fontSize: "13.5px",
    fontWeight: 600,
    color: C.muted,
    fontFamily: "inherit",
  },
  activeTabStyle: { color: C.primary, fontWeight: 700 },
  activeTabIndicatorStyle: { height: "3px", left: "10px", right: "10px", backgroundColor: C.primary, borderRadius: "3px 3px 0 0" },
  formStyle: {
    backgroundColor: C.surface,
    borderRadius: "0 0 14px 14px",
    border: `1px solid ${C.border}`,
    borderTop: "none",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.03)",
  },
  tabContentStyle: { padding: "26px 28px" },
  sectionHeaderStyle: { marginBottom: "20px", paddingBottom: "14px", borderBottom: `1px solid ${C.border}` },
  sectionTitleStyle: { fontSize: "18px", fontWeight: 700, color: C.text, gap: "10px", marginBottom: "4px", letterSpacing: "-0.01em" },
  sectionIconStyle: { fontSize: "1.25rem" },
  sectionDescriptionStyle: { fontSize: "13px", color: C.muted },
  subSectionTitleStyle: { fontSize: "15px", fontWeight: 700, color: C.text, marginBottom: "14px" },
  subSectionHeaderStyle: { fontSize: "13px", fontWeight: 700, color: C.primary, marginBottom: "12px" },
  subSectionIndentStyle: { borderLeft: `3px solid ${C.primarySoft}`, paddingLeft: "16px" },
  dividerStyle: { backgroundColor: C.border, margin: "24px 0" },

  // fields
  formGridStyle: {
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "18px 20px",
    padding: "4px 0",
  },
  labelStyle: { fontSize: "12.5px", fontWeight: 600, color: C.text2, marginBottom: "6px", gap: "6px" },
  inputStyle: { ...field },
  selectStyle: { ...field, cursor: "pointer" },
  textareaStyle: { height: "auto", minHeight: "96px", padding: "10px 12px", lineHeight: 1.5 },
  inputErrorStyle: { borderColor: C.danger, boxShadow: "0 0 0 3px rgba(220,38,38,0.10)" },
  inputDisabledStyle: { backgroundColor: C.soft, color: C.muted },
  readOnlyFieldStyle: { backgroundColor: C.soft, color: C.text2 },
  daysRemainingFieldStyle: { backgroundColor: C.soft, color: C.text2, fontWeight: 600 },
  fieldErrorStyle: { fontSize: "12px", color: C.danger, marginTop: "4px", fontWeight: 500 },

  // checkboxes
  checkboxLabelStyle: { gap: "10px" },
  checkboxStyle: { width: "16px", height: "16px", accentColor: C.primary },
  checkboxTextStyle: { fontSize: "13.5px", fontWeight: 600, color: C.text },
  checkboxDescriptionStyle: { fontSize: "12px", color: C.muted },
  checkboxGridStyle: { gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px 16px" },
  checkboxGroupTitleStyle: { fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "10px" },
  checklistItemStyle: { padding: "12px 14px", gap: "10px", borderBottom: `1px solid ${C.border}` },

  // files
  fileInputLabelStyle: {
    height: "40px",
    padding: "0 14px",
    backgroundColor: C.soft,
    border: `1.5px dashed ${C.borderStrong}`,
    borderRadius: "9px",
    fontSize: "13px",
    color: C.text2,
    fontWeight: 500,
    boxSizing: "border-box",
  },
  filePreviewStyle: { borderRadius: "8px", backgroundColor: C.soft, border: `1px solid ${C.border}`, padding: "8px 10px" },
  fileListContainerStyle: { borderRadius: "10px", border: `1px solid ${C.border}` },
  fileListHeaderStyle: { backgroundColor: C.soft, padding: "8px 12px" },
  fileListItemStyle: { borderRadius: "8px", border: `1px solid ${C.border}`, padding: "6px 10px" },
  imagePreviewContainerStyle: { borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: C.soft },
  imagePreviewStyle: { borderRadius: "6px" },

  // cards (e.g. certifications / licences)
  cardsContainerStyle: { gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" },
  cardStyle: {
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  cardHeaderStyle: { padding: "12px 16px", backgroundColor: C.soft, borderBottom: `1px solid ${C.border}` },
  cardTitleStyle: { fontSize: "14.5px", fontWeight: 700, color: C.text },
  cardSubtitleStyle: { fontSize: "12px", color: C.muted },
  cardBodyStyle: { padding: "16px" },
  twoColumnGridStyle: { gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" },

  // chain-supply picker
  checkboxListStyle: { borderRadius: "10px", border: `1px solid ${C.border}` },
  checkboxItemStyle: { padding: "10px 14px" },
  checkboxItemNameStyle: { fontSize: "13.5px", fontWeight: 600, color: C.text },
  checkboxItemBadgeStyle: { backgroundColor: C.primarySoft, color: C.primaryDark, fontWeight: 600 },
  createNewButtonStyle: { ...btn, height: "32px", padding: "0 12px", fontSize: "12.5px", backgroundColor: C.primary, color: "#fff", border: "none" },
  emptyStateStyle: { color: C.muted, fontSize: "13px" },

  // sticky action bar + buttons
  formActionsStyle: {
    position: "sticky",
    bottom: 0,
    zIndex: 15,
    padding: "14px 28px",
    borderTop: `1px solid ${C.border}`,
    backgroundColor: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(6px)",
    borderRadius: "0 0 14px 14px",
    boxShadow: "0 -6px 18px rgba(15,23,42,0.05)",
    flexWrap: "wrap",
    gap: "12px",
  },
  requiredHintStyle: { fontSize: "12.5px", color: C.muted },
  actionButtonsStyle: { gap: "10px", flexWrap: "wrap" },
  navigationButtonsStyle: { gap: "10px" },
  cancelButtonStyle: { ...btn, backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.borderStrong}` },
  previousButtonStyle: { ...btn, backgroundColor: C.surface, color: C.text, border: `1px solid ${C.borderStrong}` },
  nextButtonStyle: {
    ...btn,
    background: `linear-gradient(135deg, #3b82f6 0%, ${C.primaryDark} 100%)`,
    color: "#fff",
    border: "none",
    boxShadow: "0 4px 12px rgba(37,99,235,0.25)",
  },
  submitButtonStyle: {
    ...btn,
    background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 4px 12px rgba(5,150,105,0.25)",
  },
  submitButtonDisabledStyle: { background: "#94a3b8", boxShadow: "none" },
  clearAllButtonStyle: { borderRadius: "7px", padding: "4px 10px", fontWeight: 600 },
  removeFileButtonStyle: { borderRadius: "7px", fontWeight: 600, backgroundColor: C.dangerSoft, color: C.danger, border: "1px solid #fecaca" },

  // modals
  modalOverlayStyle: { backgroundColor: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(2px)" },
  modalContentStyle: {
    borderRadius: "16px",
    padding: "24px",
    border: `1px solid ${C.border}`,
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.3)",
  },
  modalTitleStyle: { fontSize: "17px", fontWeight: 700, color: C.text, margin: "0 0 16px 0" },
  modalActionsStyle: { gap: "10px", marginTop: "20px" },
  modalCancelButtonStyle: { ...btn, flex: 1, backgroundColor: C.surface, color: C.text2, border: `1px solid ${C.borderStrong}` },
  modalCreateButtonStyle: { ...btn, flex: 1, backgroundColor: C.primary, color: "#fff", border: "none" },

  // edit page only
  loadingContainerStyle: { backgroundColor: C.bg },
  spinnerStyle: { borderTopColor: C.primary },
};

export const csrStyle = (name, base) => ({ ...base, ...(OVERRIDES[name] || {}) });

// Focus ring for every field on the page (class "csr-form" on the page root).
export const CSR_FORM_CSS = `
  .csr-form input:focus, .csr-form select:focus, .csr-form textarea:focus {
    border-color: ${C.primary} !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
  }
  .csr-form ::-webkit-scrollbar { height: 6px; }
  .csr-form input[type="checkbox"]:focus, .csr-form input[type="radio"]:focus { box-shadow: none; }
`;
