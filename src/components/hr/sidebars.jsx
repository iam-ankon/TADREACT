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
} from "react-icons/fi";
import { TfiEmail, TfiWorld } from "react-icons/tfi";

const Sidebars = () => {
  const location = useLocation();
  
  // ✅ Use a UNIQUE key for Sidebars component
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarsOpenState");
    console.log("🔄 Loading Sidebars state:", stored);
    // Default to TRUE (open) if no stored value
    return stored !== null ? JSON.parse(stored) : true;
  });

  // ✅ Toggle with the unique key
  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      console.log("💾 Saving Sidebars state:", newState);
      localStorage.setItem("sidebarsOpenState", JSON.stringify(newState));
      return newState;
    });
  };

  // Your existing styles and JSX remain the same...
  const sidebarStyle = {
    width: isOpen ? "250px" : "75px",
    backgroundColor: "#DCEEF3",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    transition: "width 0.3s ease",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    minWidth: "75px",
  };

  const headerStyle = {
    height: "58px",
    padding: "1rem",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#374151",
    whiteSpace: "nowrap",
    overflow: "hidden",
    display: "flex",
    justifyContent: "space-between",
  };

  const toggleButtonStyle = {
    color: "#fff",
    border: "none",
    top: "18px",
    right: isOpen ? "10px" : "-1px",
    transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
    borderRadius: "50%",
    padding: "0.1rem",
    cursor: "pointer",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease, right 0.3s ease",
  };

  const navStyle = {
    padding: "1rem",
    flex: 1,
    overflowY: "auto",
  };

  const ulStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    listStyleType: "none",
    padding: 0,
    margin: 0,
  };

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    padding: "0.5rem",
    borderRadius: "0.375rem",
    backgroundColor: location.pathname === path ? "#eff6ff" : "transparent",
    color: location.pathname === path ? "#2563eb" : "#374151",
    textDecoration: "none",
    transition: "background-color 0.2s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
  });

  const iconStyle = {
    marginRight: isOpen ? "0.75rem" : "0",
    fontSize: "1.25rem",
    transition: "margin 0.3s ease",
    minWidth: "24px",
    textAlign: "center",
  };

  const menuItems = [
    { to: "/hr-work", icon: <FiHome />, label: "Dashboard" },
    { to: "/cv-list", icon: <FiFileText />, label: "All CV" },
    { to: "/interviews", icon: <FiBriefcase />, label: "Recruitment" },
    { to: "/employees", icon: <FiUsers />, label: "Employees" },
    { to: "/attendance", icon: <FiClock />, label: "Attendance" },
    { to: "/employee_leave", icon: <FiCalendar />, label: "Leave Management" },
    {
      to: "/performanse_appraisal",
      icon: <FiCalendar />,
      label: "Performance Appraisal",
    },
    { to: "/employee-termination", icon: <FiLogOut />, label: "Termination" },
    { to: "/letter-send", icon: <FiSend />, label: "Send Letters" },
    { to: "/email-logs", icon: <TfiEmail />, label: "Email log" },
    { to: "/tad-groups", icon: <TfiWorld />, label: "Tad Group" },
  ];

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <span>{isOpen ? "HR Dashboard" : "H"}</span>
        <button
          onClick={toggleSidebar}
          style={toggleButtonStyle}
          title="Toggle Sidebar"
        >
          {isOpen ? <FiChevronLeft /> : <FiChevronLeft />}
        </button>
      </div>

      <nav style={navStyle}>
        <ul style={ulStyle}>
          {menuItems.map(({ to, icon, label }) => (
            <li key={to}>
              <Link to={to} style={linkStyle(to)}>
                <span style={iconStyle}>{icon}</span>
                {isOpen && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebars;