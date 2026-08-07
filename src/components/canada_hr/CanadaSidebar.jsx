import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome, FiUsers, FiClock, FiClipboard, FiAward,
  FiUserPlus, FiDollarSign, FiFileText, FiUmbrella,
  FiChevronLeft, FiChevronRight, FiLogOut, FiBell,
  FiSettings, FiPercent,
} from "react-icons/fi";
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
    items: [
      { to: "/canada/dashboard", icon: <FiHome />, label: "Dashboard" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/canada/employees", icon: <FiUsers />, label: "Employees" },
      { to: "/canada/attendance", icon: <FiClock />, label: "Attendance" },
      { to: "/canada/leave", icon: <FiClipboard />, label: "Leave management", badge: true },
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
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem("canada_sidebarOpen");
    return stored ? JSON.parse(stored) : true;
  });

  const employeeName = localStorage.getItem("employee_name") || "HR Manager";
  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("canada_sidebarOpen", JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    [
      "token", "username", "user_id", "mode", "permissions",
      "employee_id", "employee_name", "designation", "department",
      "reporting_leader", "token_timestamp",
    ].forEach((k) => localStorage.removeItem(k));
    navigate("/", { replace: true });
  };

  const sidebarW = isOpen ? 236 : 56;

  return (
    <div
      ref={sidebarRef}
      style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: "#0F172A",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/*
        Clearance spacer — the main TAD app's own floating toggle button
        (Sidebar.jsx) is `position: fixed; top:15px; left:5px; z-index:2000`,
        so it always floats in this exact screen corner regardless of what
        route is active. Rather than hiding that button, we keep it working
        and simply make sure nothing of ours renders underneath it.
      */}
      <div style={{ height: 64, flexShrink: 0 }} />

      {/* Brand */}
      <div style={{
        padding: "14px 14px 10px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 56,
      }}>
        {isOpen && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            flex: 1, minWidth: 0, overflow: "hidden",
          }}>
            <MapleLeaf style={{ color: "#C8102E", fontSize: 20, flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <div style={{
                color: "#fff", fontSize: 13, fontWeight: 500, lineHeight: 1.2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                Canada HRM
              </div>
              <div style={{
                color: "#475569", fontSize: 10, lineHeight: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                TAD Group · CA Office
              </div>
            </div>
          </div>
        )}
        {!isOpen && (
          <MapleLeaf style={{ color: "#C8102E", fontSize: 20, margin: "0 auto" }} />
        )}
        <button
          onClick={toggleSidebar}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#475569", fontSize: 16, padding: 4, display: "flex",
            alignItems: "center", flexShrink: 0,
          }}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: 8 }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {isOpen && (
              <div style={{
                padding: "12px 14px 4px",
                color: "#334155",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}>
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.to ||
                location.pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isOpen ? 10 : 0,
                    padding: isOpen ? "7px 14px" : "9px 0",
                    justifyContent: isOpen ? "flex-start" : "center",
                    color: isActive ? "#fff" : "#94A3B8",
                    background: isActive ? "rgba(79,120,241,0.15)" : "transparent",
                    borderLeft: isActive ? "2.5px solid #4F78F1" : "2.5px solid transparent",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.1s",
                    margin: "1px 0",
                    position: "relative",
                  }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "#CBD5E1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#94A3B8";
                      }
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {isOpen && (
                      <>
                        <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.label}</span>
                        {item.badge && pendingLeaves > 0 && (
                          <span style={{
                            background: "#C8102E",
                            color: "#fff",
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 10,
                            fontWeight: 600,
                            marginLeft: "auto",
                          }}>
                            {pendingLeaves}
                          </span>
                        )}
                      </>
                    )}
                    {!isOpen && item.badge && pendingLeaves > 0 && (
                      <span style={{
                        position: "absolute",
                        top: 6, right: 6,
                        width: 8, height: 8,
                        borderRadius: "50%",
                        background: "#C8102E",
                      }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{
        padding: "10px 12px",
        borderTop: "0.5px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg,#1B4FD8,#4F78F1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>
          {initials}
        </div>
        {isOpen && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: "#CBD5E1", fontSize: 12, fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {employeeName}
              </div>
              <div style={{ color: "#475569", fontSize: 10 }}>CA · HR Manager</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#475569", fontSize: 16, padding: 4,
                display: "flex", alignItems: "center",
              }}
            >
              <FiLogOut />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
