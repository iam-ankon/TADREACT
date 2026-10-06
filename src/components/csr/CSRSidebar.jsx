// CSR (supplier compliance) sidebar + page layout. Same shared sidebar as
// HR / Merchandising / Finance / Canada (common/DeptSidebar).
import React from "react";
import { FiGrid, FiUsers, FiPlusCircle, FiHome, FiShield } from "react-icons/fi";
import DeptSidebar from "../common/DeptSidebar";

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

// Same destination as the main sidebar's home button.
const homePath = () => (readJSON("permissions").full_access === true ? "/hr-work" : "/dashboard");

const csrSections = () => [
  {
    label: "Compliance",
    items: [
      { to: "/csr-dashboard", label: "Dashboard", icon: <FiGrid /> },
      { to: "/suppliersCSR", label: "Suppliers", icon: <FiUsers />, match: ["/edit-supplier/"] },
      { to: "/add-supplierCSR", label: "Add Supplier", icon: <FiPlusCircle /> },
    ],
  },
  {
    label: "Navigate",
    items: [{ to: homePath(), label: "Main Dashboard", icon: <FiHome />, exact: true }],
  },
];

export const CSRSidebar = () => (
  <DeptSidebar
    title="CSR Compliance"
    subtitle="Supplier audits · Certificates"
    icon={<FiShield />}
    sections={csrSections()}
  />
);

/** Sidebar on the left, the page scrolling on the right. */
export const CSRLayout = ({ children }) => (
  <div className="csr-layout" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <CSRSidebar />
    <div className="csr-layout-main" style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
      {children}
    </div>
  </div>
);

export default CSRSidebar;
