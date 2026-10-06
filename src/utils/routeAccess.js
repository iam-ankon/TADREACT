// src/utils/routeAccess.js
//
// Which pages (URLs) a logged-in user may open. Mirrors the menus: the main
// menu (components/hr/Sidebar.jsx) and the Merchandising menu
// (components/merchandiser/Sidebar.jsx) - a page is permitted if it belongs
// to a section the user's menus show. Used by ProtectedRoute: a page
// outside that set redirects to the user's home page. This is a UI guard
// only; the API still enforces its own permissions.

// Users who get the whole Merchandising menu (Suppliers, Lab / QC as admin)
// like full-access users - same list as MERCH_FULL_MENU_USERS in
// TADDJANGO/users/views.py (login also sends permissions.merch_full_menu).
export const MERCH_FULL_MENU_USERS = ["SOHEL1", "MIZANUR"];

const read = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

export const getAccessProfile = () => {
  let permissions = {};
  try {
    permissions = JSON.parse(read("permissions") || "{}") || {};
  } catch {
    permissions = {};
  }
  const designation = read("designation").toLowerCase();
  const department = read("department").toLowerCase();
  const rawUsername = read("username");
  const username = rawUsername.toLowerCase();
  const has = (s) => designation.includes(s);

  const fullAccess = permissions.full_access === true;
  const isZOHAER = username === "zohaer";
  const isLimitedHR = has("group hr head");
  const merchFullMenu = permissions.merch_full_menu === true || MERCH_FULL_MENU_USERS.includes(rawUsername);
  const labAdmin = permissions.lab_admin === true || merchFullMenu;
  const labQc = permissions.lab_qc === true || labAdmin;
  const isLabQcOnly = labQc && !fullAccess && !labAdmin;
  const isMerchandiserProduction = has("merchandiser - production");
  const isGroupHeadOfAdmin = has("team leader - admin");
  const isHeadOfFinance = has("head of finance & accounts");

  const isTeamLeader =
    (has("team leader") && !has("qa") && !has("digital") && !has("compliance")) ||
    has("team leader-qa") || has("team leader qa") ||
    has("digital-team leader") || has("digital team leader") ||
    has("team leader-compliance") ||
    has("project architect") || has("business operation manager") ||
    has("head of department") || isGroupHeadOfAdmin || has("head of design") ||
    isHeadOfFinance || has("director - tad logistic") || has("supply chain manager") ||
    isZOHAER ||
    permissions.is_team_leader === true; // server-side TEAM_LEADERS list (users/views.py)

  const dept = {
    finance: department.includes("finance") || department.includes("accounts"),
    csr: department.includes("csr"),
    merchandising: department.includes("merchandising"),
  };

  // Flags the login API sets per user (users/views.py), honoured as well as
  // the menu's designation/department rules.
  const apiFinance = permissions.finance === true;
  const apiHr = permissions.hr_work === true;

  return {
    apiFinance, apiHr,
    merchFullMenu, labAdmin,
    fullAccess, isZOHAER, isLimitedHR, labQc, isLabQcOnly, isMerchandiserProduction,
    isGroupHeadOfAdmin, isHeadOfFinance, isTeamLeader, dept,
  };
};

/** Where a user lands after login / when sent away from a page. */
export const homePath = (p = getAccessProfile()) => {
  if (p.isLabQcOnly) return "/lab-qc";
  if (p.fullAccess || p.isLimitedHR || p.apiHr) return "/hr-work";
  return "/dashboard";
};

// ---- page groups (path prefixes; "/x" also covers "/x/...") -------------

const COMMON = ["/dashboard", "/apply-leave", "/leave-history", "/chat", "/vault", "/notifications", "/RegularUserStationery"];

const TEAM_LEADER = ["/team-leaves", "/performance-appraisal", "/add-newAppraisal", "/appraisal-details", "/edit-appraisal"];

const HR = [
  "/hr-work", "/employees", "/employee", "/edit-employee", "/add-employee", "/performanse_appraisal",
  "/add-newAppraisal", "/appraisal-details", "/edit-appraisal", "/attendance", "/employee_leave_balance",
  "/add-leave-request", "/leave-request-details", "/edit-leave-request", "/employee_leave_type", "/employee_leave",
  "/email-logs", "/interviews", "/tad-groups", "/employee-termination", "/weekly-attendance-graph", "/holidays",
  "/terminated-employee-archive", "/salary-email-modal", "/letter-send", "/add-letter", "/cv-add", "/cv-list",
  "/cv-edit", "/edit-cv", "/cv-detail", "/attachments", "/mailmdsir", "/invitemail", "/team-leaves",
  "/performance-appraisal",
];

const FINANCE = [
  "/finance-provision", "/admin-provision", "/salary-certificate-generator", "/tax-calculator", "/salary-format",
  "/bonus-format", "/bonus-records", "/salary-comparison", "/salary-records",
];

const COMPANY_DOCS = ["/company-docs"];
const CSR = ["/csr-dashboard", "/suppliersCSR", "/add-supplierCSR", "/edit-supplier"];
const STATIONERY_ADMIN = ["/StationeryDashboard", "/StationeryItems", "/StationeryUsage", "/StockReport"];
const LAB_QC = ["/lab-qc"];

// Merchandising pages a regular merchandiser sees (menu: Dashboard, Agents,
// Buyers, Customers, Inquiries, Orders, Courier, T&A, Production Planning, Commissions, Supplier
// Capacity, On-Time Delivery - not Suppliers or Lab/QC).
const MERCH = [
  "/merchandiser-dashboard", "/merchandiser/supplier-capacity-report", "/merchandiser/on-time-delivery-scorecard",
  "/agents", "/add-agent", "/edit-agent", "/buyers", "/add-buyer", "/edit-buyer", "/buyer-details",
  "/customers", "/add-customer", "/edit-customer", "/customer-details",
  "/inquiries", "/inquiry-costing-list", "/bulk-costing", "/orders", "/development-samples",
  "/courier", "/production-planning", "/create-tna", "/edit-tna", "/tna-details", "/tna-reminders", "/commissions",
];
const MERCH_SUPPLIERS = ["/suppliers", "/add-supplier", "/edit/suppliers"];

const matches = (path, prefixes) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/** True if the user may open this path. */
export const canAccessPath = (rawPath, p = getAccessProfile()) => {
  const path = (rawPath || "/").replace(/\/+$/, "") || "/";
  if (path === "/") return true;
  if (p.fullAccess) return true;
  if (matches(path, COMMON)) return true;

  if (p.isTeamLeader && matches(path, TEAM_LEADER)) return true;
  if ((p.isLimitedHR || p.apiHr) && matches(path, HR)) return true;
  if ((p.isLimitedHR || p.isHeadOfFinance || p.dept.finance || p.isZOHAER || p.apiFinance) && matches(path, FINANCE)) return true;
  if (p.dept.finance && matches(path, COMPANY_DOCS)) return true;
  if (p.dept.csr && matches(path, CSR)) return true;
  if (p.isGroupHeadOfAdmin && matches(path, STATIONERY_ADMIN)) return true;

  // Lab/QC: anyone with the lab_qc permission (the Lab pages check it too).
  if (p.labQc && matches(path, LAB_QC)) return true;

  if (p.isLabQcOnly) return false;

  if (p.merchFullMenu && matches(path, [...MERCH, ...MERCH_SUPPLIERS])) return true;

  if (p.isMerchandiserProduction) {
    // Orders (view only - no add/edit) and Courier Management.
    if (path === "/orders" || /^\/orders\/\d+$/.test(path)) return true;
    return matches(path, ["/courier"]);
  }

  if (p.dept.merchandising) {
    if (matches(path, MERCH)) return true;
    if (matches(path, MERCH_SUPPLIERS)) return false;
  }
  return false;
};
