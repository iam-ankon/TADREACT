import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSend,
  FiLogOut,
  FiBriefcase,
  FiClock,
  FiHome,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiSettings,
  FiHelpCircle,
  FiTrendingUp,
  FiMenu,
} from "react-icons/fi";
import { TfiEmail, TfiWorld } from "react-icons/tfi";

const Sidebar = () => {
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarsOpenState");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarsOpenState", JSON.stringify(newState));
      return newState;
    });
  };

  const sidebarStyle = {
    width: isOpen ? "270px" : "100px",
    background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
    boxShadow: "inset -1px 0 0 rgba(0, 0, 0, 0.05), 4px 0 20px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    minWidth: "80px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    borderRight: "1px solid rgba(203, 213, 225, 0.5)",
  };

  const headerStyle = {
    padding: isOpen ? "0 14px" : "0 19px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    height: "80px",
  };

  const headerOverlayStyle = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
  };

  const headerTextStyle = {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "white",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    letterSpacing: "-0.025em",
    position: "relative",
    zIndex: 1,
  };

  const navStyle = {
    padding: "24px 0",
    flex: 1,
    overflowY: "auto",
  };

  const ulStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    listStyleType: "none",
    padding: "0 16px",
    margin: 0,
  };

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: "12px",
    background: location.pathname === path ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "transparent",
    color: location.pathname === path ? "#1d4ed8" : "#475569",
    textDecoration: "none",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    border: location.pathname === path ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid transparent",
    position: "relative",
    fontWeight: location.pathname === path ? "500" : "400",
  });

  const iconStyle = (path) => ({
    marginRight: isOpen ? "16px" : "0",
    fontSize: "1.25rem",
    transition: "all 0.3s ease",
    minWidth: "24px",
    textAlign: "center",
    color: location.pathname === path ? "#3b82f6" : "#64748b",
  });

  const badgeStyle = {
    position: "absolute",
    right: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "#3b82f6",
    color: "white",
    fontSize: "0.7rem",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "10px",
    display: isOpen ? "block" : "none",
  };

  const menuItems = [
    { to: "/merchandiser-dashboard", icon: <FiHome />, label: "Dashboard", badge: null },
    { to: "/agents", icon: <FiFileText />, label: "Agents", badge: null },
    { to: "/buyers", icon: <FiBriefcase />, label: "Buyers", badge: null },
    { to: "/customers", icon: <FiUsers />, label: "Customers", badge: null },
    { to: "/suppliers", icon: <FiClock />, label: "Suppliers", badge: null },
    { to: "/inquiries", icon: <FiCalendar />, label: "Inquiries", badge: null },
    { to: "/orders", icon: <FiClock />, label: "Orders", badge: null },
  ];

  return (
    <div>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={headerStyle}>
          <div style={headerOverlayStyle} />
          <span style={headerTextStyle}>
            {isOpen ? "Merchandise" : "M"}
          </span>
        </div>

        <nav style={navStyle}>
          <ul style={ulStyle}>
            {menuItems.map(({ to, icon, label, badge }) => (
              <li key={to}>
                <Link 
                  to={to} 
                  style={linkStyle(to)}
                  onMouseOver={(e) => {
                    if (location.pathname !== to) {
                      e.currentTarget.style.background = "rgba(241, 245, 249, 1)";
                      e.currentTarget.style.color = "#334155";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (location.pathname !== to) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#475569";
                    }
                  }}
                >
                  <span style={iconStyle(to)}>{icon}</span>
                  {isOpen && <span>{label}</span>}
                  {badge && isOpen && (
                    <span style={badgeStyle}>{badge}</span>
                  )}
                  {location.pathname === to && (
                    <div style={{
                      position: "absolute",
                      left: "0",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "4px",
                      height: "24px",
                      background: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
                      borderRadius: "0 2px 2px 0",
                    }} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* External Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="menu-btn"
        style={{
          position: "absolute",
          top: "25px",
          left: isOpen ? "255px" : "85px",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "white",
          border: "none",
          padding: "10px",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          width: "36px",
          height: "36px",
        }}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
        }}
      >
        {isOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
      </button>

      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(203, 213, 225, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }

        /* For main content adjustment */
        .main-content-with-sidebar {
          margin-left: ${isOpen ? "270px" : "100px"};
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;