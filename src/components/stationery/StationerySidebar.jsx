// Stationery sidebar + page layout. Same shared sidebar as the other
// departments (common/DeptSidebar). Managers see the management pages;
// everyone else only their own requests (same split as the main menu).
import React from "react";
import { FiGrid, FiPackage, FiClipboard, FiBarChart2, FiShoppingBag, FiHome, FiEdit3 } from "react-icons/fi";
import DeptSidebar from "../common/DeptSidebar";
import { homePath, isStationeryManager } from "./stationeryShared";

export const StationerySidebar = () => {
  const manager = isStationeryManager();
  const sections = manager
    ? [
        {
          label: "Overview",
          items: [{ to: "/StationeryDashboard", label: "Dashboard", icon: <FiGrid /> }],
        },
        {
          label: "Manage",
          items: [
            { to: "/StationeryItems", label: "Inventory", icon: <FiPackage /> },
            { to: "/StationeryUsage", label: "Requests & Usage", icon: <FiClipboard /> },
            { to: "/StockReport", label: "Stock Report", icon: <FiBarChart2 /> },
          ],
        },
        {
          label: "Navigate",
          items: [{ to: homePath(), label: "Main Dashboard", icon: <FiHome />, exact: true }],
        },
      ]
    : [
        {
          label: "Stationery",
          items: [{ to: "/RegularUserStationery", label: "My Requests", icon: <FiShoppingBag /> }],
        },
        {
          label: "Navigate",
          items: [{ to: homePath(), label: "Main Dashboard", icon: <FiHome />, exact: true }],
        },
      ];

  return (
    <DeptSidebar
      title="Stationery"
      subtitle={manager ? "Inventory · Requests" : "Office supplies"}
      icon={<FiEdit3 />}
      sections={sections}
    />
  );
};

/**
 * Sidebar on the left, the page scrolling on the right.
 * framed: wraps pages that were built as panels (Inventory, Requests, Stock
 * Report) in the same page background + card as the rest of TAD.
 */
export const StationeryLayout = ({ children, framed = false }) => (
  <div className="stationery-layout" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <StationerySidebar />
    <div style={{ flex: 1, minWidth: 0, overflow: "auto", background: "#f3f5f9" }}>
      {framed ? (
        <div style={{ padding: "20px 24px 32px", maxWidth: 1600, margin: "0 auto" }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e6eaf0",
              borderRadius: 16,
              boxShadow: "0 1px 2px rgba(15,23,42,.04)",
              minHeight: "calc(100vh - 52px)",
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  </div>
);

export default StationerySidebar;
