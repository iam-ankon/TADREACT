import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPieChart,
  FiDollarSign,
  FiMessageSquare,
  FiMenu,
  FiLogOut,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiSettings,
  FiUser,
  FiBriefcase,
  FiAward,
} from "react-icons/fi";
import logo from "../../assets/texweave_Logo_1.png";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in Sidebar:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          Error loading sidebar. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const stored = localStorage.getItem("sidebarOpen");
    return stored ? JSON.parse(stored) : false;
  });
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);

  // Get employee info from localStorage
  const employeeInfo = {
    employee_id: localStorage.getItem("employee_id") || "",
    name: localStorage.getItem("employee_name") || "",
    designation: localStorage.getItem("designation") || "",
    department: localStorage.getItem("department") || "",
    reporting_leader: localStorage.getItem("reporting_leader") || "",
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      localStorage.setItem("sidebarOpen", JSON.stringify(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Optional logout endpoint
          // await fetch('/api/auth/logout/', { method: 'POST', headers: { 'Authorization': `Token ${token}` } });
        } catch (error) {
          console.error("Error calling logout endpoint:", error);
        }
      }

      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      localStorage.removeItem("mode");
      localStorage.removeItem("permissions");
      localStorage.removeItem("employee_id");
      localStorage.removeItem("employee_name");
      localStorage.removeItem("designation");
      localStorage.removeItem("department");
      localStorage.removeItem("reporting_leader");
      sessionStorage.clear();

      console.log("Logout successful, redirecting to login...");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const handleChatClick = (e) => {
    console.log("Chatbox clicked, navigating to /chat");
    navigate("/chat");
    e.preventDefault();
  };

  // Get user permissions
  const userMode = localStorage.getItem("mode");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  const hasFullAccess = permissions.full_access === true;
  const designation = localStorage.getItem("designation") || "";

  const isTeamLeaderDigital =
    designation.toLowerCase().includes("digital-team leader") ||
    designation.toLowerCase().includes("digital team leader");

  const isTeamLeaderQC =
    designation.toLowerCase().includes("team leader-qa") ||
    designation.toLowerCase().includes("team leader qa");

  const isTeamLeader =
    designation.toLowerCase().includes("team leader") &&
    !designation.toLowerCase().includes("qa") &&
    !designation.toLowerCase().includes("digital") &&
    !designation.toLowerCase().includes("compliance");

  const isProjectArchitect = designation
    .toLowerCase()
    .includes("project architect");

  const isBusinessOperationManager = designation
    .toLowerCase()
    .includes("business operation manager");

  const isSrMerchandiser = designation
    .toLowerCase()
    .includes("sr. merchandiser-t");

  const isHeadOfDepartment = designation
    .toLowerCase()
    .includes("head of department");

  const isGroupHeadOfAdmin = designation
    .toLowerCase()
    .includes("group head of admin");

  const isTeamLeaderCompliance = designation
    .toLowerCase()
    .includes("team leader-compliance");

  const isHeadOfFinance = designation
    .toLowerCase()
    .includes("head of finance & accounts");  

  const isHeadOfDesign = designation.toLowerCase().includes("head of design");

  const dashboardPath = hasFullAccess ? "/hr-work" : "/dashboard";

  const handleDashboardClick = () => {
    navigate(dashboardPath);
  };

  useEffect(() => {
    const closeSidebarOnClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
        localStorage.setItem("sidebarOpen", JSON.stringify(false));
      }
    };

    document.addEventListener("click", closeSidebarOnClickOutside);
    return () => {
      document.removeEventListener("click", closeSidebarOnClickOutside);
    };
  }, []);

  // === MENU ITEMS BASED ON USER PERMISSIONS ===

  // Full Access User Menu Items
  const fullAccessMenuItems = [
    { to: "/hr-work", icon: <FiHome />, label: "Dashboard" },
    { to: "/finance-provision", icon: <FiDollarSign />, label: "Finance" },
    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      onClick: handleChatClick,
    },
  ];

  // Regular User Menu Items - Include Performance Appraisal for Team Leaders
  const regularUserMenuItems = [
    { to: "/dashboard", icon: <FiHome />, label: "Leave Apply" },

    ...(employeeInfo.reporting_leader ||
    isTeamLeader ||
    isTeamLeaderQC ||
    isTeamLeaderDigital ||
    isTeamLeaderCompliance ||
    isProjectArchitect ||
    isBusinessOperationManager ||
    isSrMerchandiser ||
    isHeadOfDepartment ||
    isGroupHeadOfAdmin ||
    isHeadOfDesign ||
    isHeadOfFinance
      ? [
          {
            to: "/team-leaves",
            icon: <FiUsers />,
            label: "Team Leaves",
          },
        ]
      : []),

    // Add Performance Appraisal for Team Leaders
    ...(isTeamLeader ||
    isTeamLeaderQC ||
    isProjectArchitect ||
    isBusinessOperationManager ||
    isSrMerchandiser ||
    isHeadOfDepartment ||
    isGroupHeadOfAdmin ||
    isHeadOfDesign ||
    isTeamLeaderDigital ||
    isTeamLeaderCompliance ||
    isHeadOfFinance
      ? [
          {
            to: "/performance-appraisal",
            icon: <FiAward />,
            label: "Performance Appraisal",
          },
        ]
      : []),

    ...(isHeadOfFinance
      ? [
          {
            to: "/finance-provision",
            icon: <FiDollarSign />,
            label: "Finance",
          },
        ]
      : []),    

    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      onClick: handleChatClick,
    },
  ];

  // Select menu items based on user permissions
  const menuItems = hasFullAccess ? fullAccessMenuItems : regularUserMenuItems;

  const sidebarStyle = {
    position: "fixed",
    left: isSidebarOpen ? "0" : "-250px",
    top: "0",
    height: "100vh",
    width: "250px",
    background:
      "linear-gradient(135deg, rgb(127, 137, 147), rgb(46, 116, 181))",
    color: "white",
    transition: "left 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0, 0, 0, 0.2)",
    paddingTop: "40px",
    zIndex: 1000,
  };

  const headerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    fontSize: "1.5rem",
    fontWeight: "bold",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer",
  };

  const logoStyle = {
    marginBottom: "10px",
  };

  const logoImageStyle = {
    width: "50px",
    height: "auto",
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
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    backgroundColor:
      location.pathname === path ? "rgba(255, 255, 255, 0.2)" : "transparent",
    color: "white",
    textDecoration: "none",
    transition: "background-color 0.2s ease",
    fontSize: "1rem",
    cursor: "pointer",
  });

  const iconStyle = {
    marginRight: isSidebarOpen ? "0.75rem" : "0",
    fontSize: "1.25rem",
    minWidth: "24px",
    textAlign: "center",
  };

  // User info display
  const userInfoStyle = {
    padding: "10px 20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
    fontSize: "0.8rem",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-100">
        <div ref={sidebarRef} style={sidebarStyle}>
          {/* Clickable Dashboard Header */}
          <div style={headerStyle} onClick={handleDashboardClick}>
            <div style={logoStyle}>
              <img src={logo} alt="Logo" style={logoImageStyle} />
            </div>
            <span>
              {isSidebarOpen
                ? hasFullAccess
                  ? "HR Dashboard"
                  : "Dashboard"
                : "D"}
            </span>
          </div>

          {/* User Info */}
          {isSidebarOpen && (
            <div style={userInfoStyle}>
              <div>
                <strong>{employeeInfo.name || "User"}</strong>
              </div>
              <div>{employeeInfo.designation || "Employee"}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                {hasFullAccess
                  ? "Full Access"
                  : isTeamLeader
                  ? "Merchandising Team Leader"
                  : isTeamLeaderQC
                  ? "Team Leader - QA"
                  : isTeamLeaderDigital
                  ? "Digital Markeing Team Leader"
                  : isProjectArchitect
                  ? "Project Architect"
                  : isBusinessOperationManager
                  ? "KLOTHEN Bangladesh"
                  : isSrMerchandiser
                  ? "Sr. Merchandiser-T"
                  : isHeadOfDepartment
                  ? "Head of Department"
                  : isGroupHeadOfAdmin
                  ? "Group Head of Admin"
                  : isHeadOfDesign
                  ? "Head of Design"
                  : isTeamLeaderCompliance
                  ? "Team Leader - CSR"
                  : isHeadOfFinance
                  ? "Team Leader Finance & Accounts"
                  : "Regular User"}
              </div>
              {employeeInfo.reporting_leader && (
                <div
                  style={{ fontSize: "0.7rem", opacity: 0.8, marginTop: "4px" }}
                >
                  Reports to: {employeeInfo.reporting_leader}
                </div>
              )}
            </div>
          )}

          <nav style={navStyle}>
            <ul style={ulStyle}>
              {menuItems.map(({ to, icon, label, onClick }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={linkStyle(to)}
                    onClick={onClick}
                    title={label}
                  >
                    <span style={iconStyle}>{icon}</span>
                    {isSidebarOpen && <span>{label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div style={{ padding: "1rem" }}>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "#e53e3e",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                display: "flex",
                alignItems: "center",
                border: "none",
                width: "100%",
                justifyContent: isSidebarOpen ? "flex-start" : "center",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#c53030")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#e53e3e")}
              title="Logout"
            >
              <FiLogOut style={iconStyle} />
              {isSidebarOpen && "Logout"}
            </button>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="main-content">
          <button
            ref={toggleBtnRef}
            onClick={toggleSidebar}
            className="menu-btn"
          >
            <FiMenu size={24} />
          </button>
        </div>

        <div className="blue-bar"></div>

        <style jsx>{`
          .main-content {
            flex: 1;
            padding: 30px;
            z-index: 0;
          }

          .menu-btn {
            position: fixed;
            top: 15px;
            left: 15px;
            background: rgb(95, 111, 129);
            color: white;
            border: none;
            padding: 10px 12px;
            border-radius: "50%";
            cursor: pointer;
            z-index: 1500;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .blue-bar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 70px;
            background-color: rgb(89, 130, 168);
            z-index: 5;
          }

          @media (max-width: 768px) {
            .sidebar {
              width: 200px;
              padding: 15px;
            }

            .blue-bar {
              height: 70px;
            }

            .menu-btn {
              top: 10px;
              left: 10px;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default Sidebar;
