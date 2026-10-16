// Front Desk sidebar + page layout. Same shared sidebar as HR / Merchandising
// / Finance / Canada / CSR / Company Docs (common/DeptSidebar).
import React from "react";
import { FiTruck, FiPackage, FiInbox, FiUsers, FiCalendar, FiHome, FiGrid } from "react-icons/fi";
import DeptSidebar from "../common/DeptSidebar";

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {
    return {};
  }
};

const homePath = () => (readJSON("permissions").full_access === true ? "/hr-work" : "/dashboard");

export const FrontDeskSidebar = () => {
  const sections = [
    {
      label: "Front Desk",
      items: [
        { to: "/front-desk", label: "Overview", icon: <FiGrid />, exact: true },
        { to: "/front-desk/couriers", label: "Courier Tracking", icon: <FiTruck /> },
        { to: "/front-desk/sample-routing", label: "Sample / Testing Routing", icon: <FiPackage /> },
        { to: "/front-desk/vendor-receipts", label: "Vendor Receipts", icon: <FiInbox /> },
        { to: "/front-desk/visitors", label: "Visitor Log", icon: <FiUsers /> },
        { to: "/front-desk/meeting-rooms", label: "Meeting Room Booking", icon: <FiCalendar /> },
      ],
    },
    {
      label: "Navigate",
      items: [{ to: homePath(), label: "Main Dashboard", icon: <FiHome />, exact: true }],
    },
  ];

  return (
    <DeptSidebar
      title="Front Desk"
      subtitle="Couriers · Visitors · Rooms"
      icon={<FiTruck />}
      sections={sections}
    />
  );
};

export const FrontDeskLayout = ({ children }) => (
  <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <FrontDeskSidebar />
    <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>{children}</div>
  </div>
);

export default FrontDeskSidebar;
