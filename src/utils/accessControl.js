// Small shared helpers for designation-based UI restrictions.
// Designation is stored in localStorage at login - see LoginPage.jsx.

export const getDesignation = () =>
  (localStorage.getItem("designation") || "").trim().toLowerCase();

export const isMerchandiserProduction = () =>
  getDesignation().includes("merchandiser - production");

// Merchandiser - Production has Orders access but must not see pricing
// (unit price, total/factory/shipped value, grand total, commission) or
// order attachments/files.
export const canViewOrderPricing = () => !isMerchandiserProduction();
export const canViewOrderAttachments = () => !isMerchandiserProduction();
