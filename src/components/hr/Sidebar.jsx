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
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiBell,
  FiHelpCircle,
  FiSend,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";
import { TfiEmail, TfiWorld } from "react-icons/tfi";
// Try different import paths for the logo
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
    return stored ? JSON.parse(stored) : true;
  });
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);

  // State to handle logo loading error
  const [logoError, setLogoError] = useState(false);

  // Get employee info from localStorage
  const employeeInfo = {
    employee_id: localStorage.getItem("employee_id") || "",
    name: localStorage.getItem("employee_name") || "",
    designation: localStorage.getItem("designation") || "",
    department: localStorage.getItem("department") || "",
    reporting_leader: localStorage.getItem("reporting_leader") || "",
  };

  // Get user permissions
  const userMode = localStorage.getItem("mode");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");
  const hasFullAccess = permissions.full_access === true;
  const designation = localStorage.getItem("designation") || "";
  const department = (localStorage.getItem("department") || "").toLowerCase();

  // === DEPARTMENT-BASED PERMISSIONS ===
  const departmentPermissions = {
    isAdmin: department.includes("admin") || department.includes("management"),
    isQA: department.includes("qa") || department.includes("quality"),
    isRnD: department.includes("r&d") || department.includes("research"),
    isProduction: department.includes("production"),
    isSampleSection: department.includes("sample"),
    isHR: department.includes("human resource") || department.includes("hr"),
    isCorporateHealth: department.includes("corporate health"),
    isArchitecture: department.includes("architecture"),
    isBusinessDev: department.includes("business development"),
    isCSR: department.includes("csr"),
    isMerchandising: department.includes("merchandising"),
    isDigitalMarketing:
      department.includes("digital marketing") ||
      department.includes("e-commerce"),
    isFinance:
      department.includes("finance") || department.includes("accounts"),
    isKlotheBangladesh:
      department.includes("klothe") && department.includes("bangladesh"),
    isIT: department.includes("it department"),
    isLogistics: department.includes("logistics"),
    isKoitheBangladesh:
      department.includes("koithe") && department.includes("bangladesh"),
    isSoftwareDev: department.includes("software development"),
  };

  // === DESIGNATION-BASED PERMISSIONS ===
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

  const isDirectorOfTadLogistic = designation
    .toLowerCase()
    .includes("director - tad logistic");

  const isSupplyChainManager = designation
    .toLowerCase()
    .includes("supply chain manager");

  const isHeadOfDesign = designation.toLowerCase().includes("head of design");

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", JSON.stringify(newState));
      return newState;
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

  const handleDashboardClick = () => {
    navigate(hasFullAccess ? "/hr-work" : "/dashboard");
  };

  useEffect(() => {
    const closeSidebarOnClickOutside = (event) => {
      // If sidebar is open and we click outside of it (and not on the toggle button), close the sidebar
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
        localStorage.setItem("sidebarOpen", JSON.stringify(false));
      }
    };

    // Add event listener to close sidebar when clicking outside
    document.addEventListener("mousedown", closeSidebarOnClickOutside);

    return () => {
      document.removeEventListener("mousedown", closeSidebarOnClickOutside);
    };
  }, [isSidebarOpen]); // Add isSidebarOpen as dependency

  // === HR DASHBOARD MENU ITEMS (Full Access Users) ===
  const hrDashboardMenuItems = [
    { to: "/hr-work", icon: <FiHome />, label: "Dashboard", badge: null },
    // { to: "/cv-list", icon: <FiFileText />, label: "All CV", badge: "12" },
    // { to: "/interviews", icon: <FiBriefcase />, label: "Recruitment", badge: "3" },
    // { to: "/employees", icon: <FiUsers />, label: "Employees", badge: null },
    // { to: "/attendance", icon: <FiClock />, label: "Attendance", badge: null },
    // { to: "/employee_leave", icon: <FiCalendar />, label: "Leave Management", badge: "5" },
    // { to: "/performanse_appraisal", icon: <FiTrendingUp />, label: "Performance Appraisal", badge: null },
    // { to: "/employee-termination", icon: <FiLogOut />, label: "Termination", badge: null },
    // { to: "/letter-send", icon: <FiSend />, label: "Send Letters", badge: "2" },
    // { to: "/email-logs", icon: <TfiEmail />, label: "Email Log", badge: null },
    // { to: "/tad-groups", icon: <TfiWorld />, label: "TAD Groups", badge: null },
    {
      to: "/finance-provision",
      icon: <FiDollarSign />,
      label: "Finance",
      badge: null,
    },
    // { to: "/hr-settings", icon: <FiSettings />, label: "Settings", badge: null },
    // { to: "/hr-help", icon: <FiHelpCircle />, label: "Help Center", badge: null },
    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      badge: null,
      onClick: handleChatClick,
    },
    // { to: "/notifications", icon: <FiBell />, label: "Notifications", badge: null },
  ];

  // === REGULAR EMPLOYEE MENU ITEMS ===
  const regularEmployeeMenuItems = [
    { to: "/dashboard", icon: <FiHome />, label: "Leave Apply", badge: null },

    ...(!isGroupHeadOfAdmin
      ? [
          {
            to: "/RegularUserStationery",
            icon: <FiUsers />,
            label: "RegularUser Stationery",
            badge: null,
          },
        ]
      : []),

    ...(isTeamLeader ||
    isTeamLeaderQC ||
    isTeamLeaderDigital ||
    isTeamLeaderCompliance ||
    isProjectArchitect ||
    isBusinessOperationManager ||
    isHeadOfDepartment ||
    isGroupHeadOfAdmin ||
    isHeadOfDesign ||
    isHeadOfFinance ||
    isDirectorOfTadLogistic ||
    isSupplyChainManager
      ? [
          {
            to: "/team-leaves",
            icon: <FiUsers />,
            label: "Team Leaves",
            badge: null,
          },
        ]
      : []),

    ...(isGroupHeadOfAdmin
      ? [
          {
            to: "/StationeryDashboard",
            icon: <FiUsers />,
            label: "Stationery Dashboard",
            badge: null,
          },
        ]
      : []),

    ...(isTeamLeader ||
    isTeamLeaderQC ||
    isProjectArchitect ||
    isBusinessOperationManager ||
    isHeadOfDepartment ||
    isGroupHeadOfAdmin ||
    isHeadOfDesign ||
    isTeamLeaderDigital ||
    isTeamLeaderCompliance ||
    isHeadOfFinance ||
    isDirectorOfTadLogistic ||
    isSupplyChainManager
      ? [
          {
            to: "/performance-appraisal",
            icon: <FiAward />,
            label: "Performance Appraisal",
            badge: null,
          },
        ]
      : []),

    ...(isHeadOfFinance || departmentPermissions.isFinance
      ? [
          {
            to: "/finance-provision",
            icon: <FiDollarSign />,
            label: "Finance",
            badge: null,
          },
        ]
      : []),

    ...(departmentPermissions.isCSR
      ? [
          {
            to: "/csr-dashboard",
            icon: <FiUsers />,
            label: "Corporate Social Responsibility",
            badge: null,
          },
        ]
      : []),

    ...(departmentPermissions.isMerchandising
      ? [
          {
            to: "/merchandiser-dashboard",
            icon: <FiUsers />,
            label: "Merchandising",
            badge: null,
          },
        ]
      : []),

    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      badge: null,
      onClick: handleChatClick,
    },
    // { to: "/notifications", icon: <FiBell />, label: "Notifications", badge: null },
    // { to: "/help", icon: <FiHelpCircle />, label: "Help Center", badge: null },
  ];

  // Select menu items based on user permissions
  const menuItems = hasFullAccess
    ? hrDashboardMenuItems
    : regularEmployeeMenuItems;

  // Get department display name for user info
  const getDepartmentDisplayName = () => {
    if (departmentPermissions.isAdmin) return "Admin Department";
    if (departmentPermissions.isHR) return "Human Resources";
    if (departmentPermissions.isQA) return "Quality Assurance";
    if (departmentPermissions.isCSR) return "Corporate Social Responsibility";
    if (departmentPermissions.isRnD) return "Research & Development";
    if (departmentPermissions.isProduction) return "Production";
    if (departmentPermissions.isSampleSection) return "Sample Section";
    if (departmentPermissions.isCorporateHealth) return "Corporate Health";
    if (departmentPermissions.isArchitecture) return "Architecture";
    if (departmentPermissions.isBusinessDev) return "Business Development";
    if (departmentPermissions.isMerchandising) return "Merchandising";
    if (departmentPermissions.isDigitalMarketing) return "Digital Marketing";
    if (departmentPermissions.isFinance) return "Finance & Accounts";
    if (departmentPermissions.isKlotheBangladesh) return "KLOTHEN Bangladesh";
    if (departmentPermissions.isIT) return "IT Department";
    if (departmentPermissions.isLogistics) return "Logistics Department";
    if (departmentPermissions.isKoitheBangladesh) return "KOITHE Bangladesh";
    if (departmentPermissions.isSoftwareDev) return "Software Development";

    return employeeInfo.department || "General Department";
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (hasFullAccess) return "HR Administrator";
    if (isTeamLeader) return "Merchandising Team Leader";
    if (isTeamLeaderQC) return "Team Leader - QA";
    if (isTeamLeaderDigital) return "Digital Marketing Team Leader";
    if (isProjectArchitect) return "Project Architect";
    if (isBusinessOperationManager) return "KLOTHEN Bangladesh";
    if (isHeadOfDepartment) return "Head of Department";
    if (isGroupHeadOfAdmin) return "Group Head of Admin";
    if (isHeadOfDesign) return "Head of Design";
    if (isTeamLeaderCompliance) return "Team Leader - CSR";
    if (isHeadOfFinance) return "Team Leader Finance & Accounts";
    if (isDirectorOfTadLogistic) return "LOGISTIC DEPARTMENT";
    if (isSupplyChainManager) return "Koithe Bangladesh";
    return "Employee";
  };

  // Determine sidebar style based on user type
  const isHRDashboard = hasFullAccess;

  const sidebarStyle = {
    position: "fixed",
    left: isSidebarOpen ? "0" : "-280px",
    top: "0",
    height: "100vh",
    width: "280px",
    background: isHRDashboard
      ? "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)"
      : "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
    color: isHRDashboard ? "#374151" : "white",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    boxShadow: isSidebarOpen ? "4px 0 20px rgba(0, 0, 0, 0.3)" : "none",
    paddingTop: "0",
    zIndex: 1000,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden",
    borderRight: isHRDashboard ? "1px solid rgba(203, 213, 225, 0.5)" : "none",
  };

  const headerStyle = {
    height: "80px",
    padding: "0 24px",
    background: isHRDashboard
      ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
      : "rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    borderBottom: isHRDashboard ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
  };

  const headerOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
    display: isHRDashboard ? "block" : "none",
  };

  const headerTextStyle = {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: isHRDashboard ? "white" : "#cbd5e1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    letterSpacing: "-0.025em",
    position: "relative",
    zIndex: 1,
  };

  const logoStyle = {
    marginRight: isSidebarOpen ? "12px" : "0",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const logoImageStyle = {
    width: "70px",
    height: "50px",
    borderRadius: "8px",
    objectFit: "contain",
    backgroundColor: isHRDashboard ? "#3b82f6" : "transparent", // Changed this line
    padding: isHRDashboard ? "6px" : "0", // Increased padding slightly
    border: isHRDashboard ? "1px solid rgba(0, 0, 0, 0.1)" : "none", // Added border for HR
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
    background:
      location.pathname === path
        ? isHRDashboard
          ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
          : "rgba(59, 130, 246, 0.2)"
        : "transparent",
    color:
      location.pathname === path
        ? isHRDashboard
          ? "#1d4ed8"
          : "#60a5fa"
        : isHRDashboard
          ? "#475569"
          : "#cbd5e1",
    textDecoration: "none",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    border:
      location.pathname === path
        ? isHRDashboard
          ? "1px solid rgba(59, 130, 246, 0.2)"
          : "1px solid rgba(59, 130, 246, 0.3)"
        : "1px solid transparent",
    position: "relative",
    fontWeight: location.pathname === path ? "500" : "400",
  });

  const iconStyle = (path) => ({
    marginRight: isSidebarOpen ? "16px" : "0",
    fontSize: "1.25rem",
    transition: "all 0.3s ease",
    minWidth: "24px",
    textAlign: "center",
    color:
      location.pathname === path
        ? isHRDashboard
          ? "#3b82f6"
          : "#3b82f6"
        : isHRDashboard
          ? "#64748b"
          : "#cbd5e1",
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
    display: isSidebarOpen ? "block" : "none",
  };

  const toggleButtonStyle = {
    background: isHRDashboard
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(255, 255, 255, 0.1)",
    border: isHRDashboard ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
    color: isHRDashboard ? "white" : "#cbd5e1",
    borderRadius: "10px",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative",
    zIndex: 1,
  };

  const userInfoStyle = {
    padding: "20px",
    borderTop: isHRDashboard
      ? "1px solid rgba(203, 213, 225, 0.5)"
      : "1px solid rgba(255, 255, 255, 0.1)",
    borderBottom: isHRDashboard
      ? "1px solid rgba(203, 213, 225, 0.5)"
      : "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: isHRDashboard
      ? "rgba(241, 245, 249, 0.5)"
      : "rgba(255, 255, 255, 0.03)",
  };

  const userAvatarStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: isHRDashboard
      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
      : "linear-gradient(135deg, #3b82f6, #1e40af)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    marginRight: "12px",
    color: "white",
  };

  // Handle logo error - show fallback
  const handleLogoError = () => {
    console.error("Logo image failed to load:", logo);
    setLogoError(true);
  };

  return (
    <ErrorBoundary>
      <div>
        {/* Sidebar */}
        <div ref={sidebarRef} style={sidebarStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={headerOverlayStyle} />
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={logoStyle}>
                {logoError ? (
                  <div
                    style={{
                      ...logoImageStyle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isHRDashboard
                        ? "white"
                        : "rgba(255,255,255,0.1)",
                      color: isHRDashboard ? "#3b82f6" : "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    TAD
                  </div>
                ) : (
                  <img
                    src={logo}
                    alt="Logo"
                    style={logoImageStyle}
                    onError={handleLogoError}
                  />
                )}
              </div>
              {isSidebarOpen && (
                <span style={headerTextStyle}>
                  {isHRDashboard ? "HR Portal" : "Employee Portal"}
                </span>
              )}
            </div>
            {/* No toggle button in header when sidebar is open */}
          </div>

          {/* User Info */}
          {isSidebarOpen && (
            <div style={userInfoStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={userAvatarStyle}>
                  {employeeInfo.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "0.95rem",
                      color: isHRDashboard ? "#1e293b" : "white",
                    }}
                  >
                    {employeeInfo.name || "User"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: isHRDashboard
                        ? "#64748b"
                        : "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {employeeInfo.designation || "Employee"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  color: isHRDashboard ? "#64748b" : "rgba(255, 255, 255, 0.7)",
                  padding: "8px 12px",
                  backgroundColor: isHRDashboard
                    ? "rgba(255, 255, 255, 0.5)"
                    : "rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                  marginTop: "8px",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <strong>Department:</strong> {getDepartmentDisplayName()}
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <strong>Role:</strong> {getUserRoleDisplay()}
                </div>
                {employeeInfo.reporting_leader && (
                  <div>
                    <strong>Reports to:</strong> {employeeInfo.reporting_leader}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav style={navStyle}>
            <ul style={ulStyle}>
              {menuItems.map(({ to, icon, label, badge, onClick }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={linkStyle(to)}
                    onClick={onClick}
                    title={!isSidebarOpen ? label : ""}
                    onMouseOver={(e) => {
                      if (location.pathname !== to) {
                        e.currentTarget.style.background = isHRDashboard
                          ? "rgba(241, 245, 249, 1)"
                          : "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = isHRDashboard
                          ? "#334155"
                          : "#e2e8f0";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (location.pathname !== to) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = isHRDashboard
                          ? "#475569"
                          : "#cbd5e1";
                      }
                    }}
                  >
                    <span style={iconStyle(to)}>{icon}</span>
                    {isSidebarOpen && <span>{label}</span>}
                    {badge && isSidebarOpen && (
                      <span style={badgeStyle}>{badge}</span>
                    )}
                    {location.pathname === to && (
                      <div
                        style={{
                          position: "absolute",
                          left: "0",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "4px",
                          height: "24px",
                          background: isHRDashboard
                            ? "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)"
                            : "linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div
            style={{
              padding: "20px",
              borderTop: isHRDashboard
                ? "1px solid rgba(203, 213, 225, 0.5)"
                : "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                padding: "12px 20px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                width: "100%",
                fontWeight: "500",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.2)";
              }}
              title={!isSidebarOpen ? "Logout" : ""}
            >
              <FiLogOut
                style={{
                  marginRight: isSidebarOpen ? "10px" : "0",
                  fontSize: "1.2rem",
                }}
              />
              {isSidebarOpen && "Logout"}
            </button>
          </div>
        </div>

        {/* Toggle Button (always visible, position changes based on sidebar state) */}
        <button
          ref={toggleBtnRef}
          onClick={toggleSidebar}
          className="menu-btn"
          style={{
            position: "fixed",
            top: "10px",
            left: isSidebarOpen ? "300px" : "5px", // Changed this line
            background: isHRDashboard
              ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
              : "linear-gradient(135deg, #3b82f6, #1e40af)",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "25px",
            cursor: "pointer",
            zIndex: 2000, // Increased z-index
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
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
          {isSidebarOpen ? <FiChevronLeft size={20} /> : <FiMenu size={20} />}
        </button>

        {/* Overlay when sidebar is open (for mobile/tablet) */}
        {isSidebarOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: "280px",
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              zIndex: 900,
              display: "none", // Hidden on desktop
            }}
            onClick={() => {
              setIsSidebarOpen(false);
              localStorage.setItem("sidebarOpen", JSON.stringify(false));
            }}
          />
        )}

        <style>{`
          .main-content {
            flex: 1;
            padding: 30px;
            z-index: 0;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: ${isSidebarOpen ? "280px" : "0"};
          }

          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: ${isHRDashboard ? "rgba(203, 213, 225, 0.3)" : "rgba(255, 255, 255, 0.05)"};
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb {
            background: ${isHRDashboard ? "rgba(148, 163, 184, 0.5)" : "rgba(255, 255, 255, 0.2)"};
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: ${isHRDashboard ? "rgba(148, 163, 184, 0.7)" : "rgba(255, 255, 255, 0.3)"};
          }

          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              padding: 20px;
            }

            button.menu-btn {
              top: 15px;
              left: ${isSidebarOpen ? "calc(100% - 60px)" : "15px"};
            }

            /* On mobile, sidebar takes full width */
            .sidebar {
              width: 100% !important;
              left: ${isSidebarOpen ? "0" : "-100%"} !important;
            }

            /* Show overlay on mobile when sidebar is open */
            .overlay {
              display: block !important;
              left: 0 !important;
              background-color: rgba(0, 0, 0, 0.5) !important;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default Sidebar;
