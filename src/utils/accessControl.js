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

// Merchandiser - Production can view orders but must not add, edit, or
// delete them - view-only access.
export const canManageOrders = () => !isMerchandiserProduction();

// Merchandiser - Production must not see the actual Shipment Date. In its
// place they see the Factory Ship Date; only when the Factory Ship Date is
// empty do they fall back to seeing the Shipment Date.
export const getDisplayShipmentDate = (order) => {
  if (!order) return null;
  if (isMerchandiserProduction()) {
    return order.factory_ship_date || order.shipment_date;
  }
  return order.shipment_date;
};
