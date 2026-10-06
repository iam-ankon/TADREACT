// Canada office sidebar.
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiClock,
  FiClipboard,
  FiAward,
  FiUserPlus,
  FiDollarSign,
  FiFileText,
  FiUmbrella,
  FiPercent,
} from "react-icons/fi";
import DeptSidebar from "../common/DeptSidebar";

// Inline SVG maple leaf — avoids react-icons/fa version mismatch
const MapleLeaf = ({ style = {} }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "1em", height: "1em", ...style }}>
    <path d="M12 2l1.5 3.5 3.5-1-2 3 4 1-3 2 1 4-3-1.5-2 3.5-2-3.5-3 1.5 1-4-3-2 4-1-2-3 3.5 1z" />
    <rect x="11" y="17" width="2" height="5" />
  </svg>
);

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ to: "/canada/dashboard", icon: <FiHome />, label: "Dashboard" }],
  },
  {
    label: "People",
    items: [
      { to: "/canada/employees", icon: <FiUsers />, label: "Employees" },
      { to: "/canada/attendance", icon: <FiClock />, label: "Attendance" },
      { to: "/canada/leave", icon: <FiClipboard />, label: "Leave management", pendingBadge: true },
    ],
  },
  {
    label: "Performance",
    items: [
      { to: "/canada/appraisals", icon: <FiAward />, label: "Appraisals" },
      { to: "/canada/recruitment", icon: <FiUserPlus />, label: "Recruitment" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/canada/payroll", icon: <FiDollarSign />, label: "Payroll (CAD)" },
      { to: "/canada/tax", icon: <FiPercent />, label: "Canadian tax" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { to: "/canada/policies", icon: <FiFileText />, label: "HR policies" },
      { to: "/canada/holidays", icon: <FiUmbrella />, label: "CA holidays" },
    ],
  },
];

export default function CanadaSidebar({ pendingLeaves = 0 }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    [
      "token",
      "username",
      "user_id",
      "mode",
      "permissions",
      "employee_id",
      "employee_name",
      "designation",
      "department",
      "reporting_leader",
      "token_timestamp",
    ].forEach((k) => localStorage.removeItem(k));
    navigate("/", { replace: true });
  };

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.pendingBadge && pendingLeaves > 0 ? { ...item, badge: pendingLeaves } : item,
    ),
  }));

  return (
    <DeptSidebar
      title="Canada HRM"
      subtitle="TAD Group · CA Office"
      icon={<MapleLeaf style={{ color: "#fff" }} />}
      sections={sections}
      storageKey="canada_sidebarOpen"
      userRole="CA · HR Manager"
      onLogout={handleLogout}
    />
  );
}
