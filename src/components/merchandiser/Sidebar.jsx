// Merchandising sidebar (also used by the Lab / QC pages).
import React from "react";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSend,
  FiBriefcase,
  FiClock,
  FiHome,
  FiDollarSign,
  FiBarChart2,
  FiCheckSquare,
  FiTruck,
  FiShoppingBag,
  FiInbox,
  FiUserCheck,
  FiPackage,
  FiLayers,
} from "react-icons/fi";
import DeptSidebar from "../common/DeptSidebar";
import { MERCH_FULL_MENU_USERS } from "../../utils/routeAccess";

// Function to check if user has full access
const hasFullAccess = () => {
  const username = localStorage.getItem("username");

  // Full-access users, plus those given the whole Merchandising menu
  const fullAccessUsers = ["ankon", "ASHIKUR1", "LAILA", "Samad", ...MERCH_FULL_MENU_USERS];
  if (username && fullAccessUsers.includes(username)) return true;

  const permissionsStr = localStorage.getItem("permissions");
  if (permissionsStr) {
    try {
      if (JSON.parse(permissionsStr).full_access === true) return true;
    } catch (e) {
      console.error("Error parsing permissions:", e);
    }
  }

  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      if (JSON.parse(userStr).mode === "full_access") return true;
    } catch (e) {
      console.error("Error parsing user:", e);
    }
  }

  // Default to restricted access
  return false;
};

// All menu items, with the section each belongs to.
const ALL_MENU_ITEMS = [
  { section: "Overview", to: "/merchandiser-dashboard", icon: <FiHome />, label: "Dashboard" },
  { section: "Partners", to: "/agents", icon: <FiUserCheck />, label: "Agents" },
  { section: "Partners", to: "/buyers", icon: <FiShoppingBag />, label: "Buyers" },
  { section: "Partners", to: "/customers", icon: <FiUsers />, label: "Customers" },
  { section: "Partners", to: "/suppliers", icon: <FiBriefcase />, label: "Suppliers" },
  { section: "Operations", to: "/inquiries", icon: <FiInbox />, label: "Inquiries" },
  { section: "Operations", to: "/orders", icon: <FiPackage />, label: "Orders" },
  { section: "Operations", to: "/courier", icon: <FiSend />, label: "Courier Management" },
  { section: "Operations", to: "/orders/tna", icon: <FiClock />, label: "T & A" },
  { section: "Operations", to: "/production-planning", icon: <FiLayers />, label: "Production Planning" },
  { section: "Operations", to: "/lab-qc", icon: <FiCheckSquare />, label: "Lab / QC", exact: true },
  { section: "Reports", to: "/commissions", icon: <FiDollarSign />, label: "Commissions" },
  {
    section: "Reports",
    to: "/merchandiser/supplier-capacity-report",
    icon: <FiBarChart2 />,
    label: "Supplier Capacity",
  },
  {
    section: "Reports",
    to: "/merchandiser/on-time-delivery-scorecard",
    icon: <FiTruck />,
    label: "On-Time Delivery",
  },
];

const SECTION_ORDER = ["Overview", "Partners", "Operations", "Reports"];

// A restricted Lab/QC officer gets "Lab / QC" + "Orders" - but "Orders"
// must point at the pricing-free /lab-qc/orders page (LabOrdersList,
// backed by orders-lite), NOT the regular /orders route: OrderSerializer
// returns every Order field including unit_price/total_value/commission
// with no role-based filtering, so routing her there would leak pricing.
const LAB_QC_ONLY_MENU_ITEMS = [
  { section: "Lab / QC", to: "/lab-qc", icon: <FiCheckSquare />, label: "Lab / QC", exact: true },
  { section: "Lab / QC", to: "/lab-qc/orders", icon: <FiCalendar />, label: "Orders" },
];

const RESTRICTED_LABELS = [
  "Dashboard",
  "Agents",
  "Buyers",
  "Customers",
  "Inquiries",
  "Orders",
  "Courier Management",
  "T & A",
  "Production Planning",
  "Commissions",
  "Supplier Capacity",
  "On-Time Delivery",
];

const Sidebar = () => {
  const fullAccess = hasFullAccess();

  // Lab/QC is a feature of the Merchandising module (not its own module) -
  // a restricted Lab/QC officer (permissions.lab_qc, not full_access) gets
  // a narrow menu with just that entry.
  let labQcPermission = false;
  try {
    labQcPermission = JSON.parse(localStorage.getItem("permissions") || "{}").lab_qc === true;
  } catch (e) {
    labQcPermission = false;
  }
  const isLabQcOnly = labQcPermission && !fullAccess;

  // Merchandiser - Production (set at login, stored in localStorage -
  // see LoginPage.jsx) gets a narrow menu: only Orders and Courier
  // Management - not the rest of the standard restricted set.
  const designation = (localStorage.getItem("designation") || "").trim();
  const isMerchandiserProduction = designation.toLowerCase() === "merchandiser - production";

  // Full access sees everything; a restricted Lab/QC officer sees Lab/QC +
  // (pricing-free) Orders; Merchandiser - Production sees only Orders +
  // Courier Management; everyone else gets the standard restricted set.
  const menuItems = fullAccess
    ? ALL_MENU_ITEMS
    : isLabQcOnly
      ? LAB_QC_ONLY_MENU_ITEMS
      : isMerchandiserProduction
        ? ALL_MENU_ITEMS.filter(
            (item) => item.label === "Orders" || item.label === "Courier Management",
          )
        : ALL_MENU_ITEMS.filter((item) => RESTRICTED_LABELS.includes(item.label));

  const order = isLabQcOnly ? ["Lab / QC"] : SECTION_ORDER;
  const sections = order.map((label) => ({
    label,
    items: menuItems.filter((item) => item.section === label),
  }));

  return (
    <DeptSidebar
      title="Merchandising"
      subtitle={isLabQcOnly ? "Lab / QC" : "Orders & Suppliers"}
      icon={<FiPackage />}
      sections={sections}
    />
  );
};

export default Sidebar;
