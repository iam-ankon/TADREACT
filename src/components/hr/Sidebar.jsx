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
  FiFlag,
  FiLock,
} from "react-icons/fi";
import { TfiEmail, TfiWorld } from "react-icons/tfi";
// Try different import paths for the logo
import logo from "../../assets/texweave_Logo_1.png";
import "../../styles/sidebar.css";

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
  const username = localStorage.getItem("username") || "";
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

  // Check for ZOHAER
  const isZOHAER =
    username === "ZOHAER" || username === "Zohaer" || username === "zohaer";

  // === DEPARTMENT-BASED PERMISSIONS ===
  const departmentPermissions = {
    isAdmin: department.includes("management"),
    isAdminDepartment: department.includes("admin"),
    isQA: department.includes("qa") || department.includes("quality"),
    isRnD: department.includes("r&d") || department.includes("research"),
    isProduction: department.includes("production"),
    isSampleSection: department.includes("sample"),
    isHr: department.includes("human resource") || department.includes("hr"),
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
    .includes("team leader - admin");

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

  // Merchandiser - Production sits in the Production department, not
  // Merchandising, so departmentPermissions.isMerchandising misses them -
  // grant the Merchandising module by designation instead.
  const isMerchandiserProduction = designation
    .toLowerCase()
    .includes("merchandiser - production");

  // Group HR Head is a limited HR user (not full access)
  const isLimitedHR = designation.toLowerCase().includes("group hr head");

  // Lab/QC Officer: permissions.lab_qc === true and NOT full_access (see
  // src/api/labQc.js). These users typically have no HR department mapping
  // at all, so none of the departmentPermissions/designation branches below
  // apply to them - they get their own dedicated menu instead of falling
  // through to the generic regularEmployeeMenuItems list.
  const isLabQcOnly = permissions.lab_qc === true && !hasFullAccess && permissions.lab_admin !== true;

  // Team leader as decided by the server at login (its TEAM_LEADERS list, or
  // employees whose reporting leader is this user). Several leaders' job
  // titles don't contain "Team Leader", so the title checks above missed them.
  const isApiTeamLeader = permissions.is_team_leader === true;

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
    // Group HR Head goes to /hr-work, not full access dashboard
    if (isLabQcOnly) {
      navigate("/lab-qc");
    } else if (isLimitedHR) {
      navigate("/hr-work");
    } else {
      navigate(hasFullAccess ? "/hr-work" : "/dashboard");
    }
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
    {
      to: "/vault",
      icon: <FiLock />,
      label: "Password Vault",
      badge: null,
      highlight: true,
    },
    { to: "/hr-work", icon: <FiHome />, label: "Human Resources", badge: null },
    {
      to: "/canada/dashboard",
      icon: <FiFlag style={{ color: "#C8102E" }} />,
      label: "Canada Office",
      badge: null,
    },
    {
      to: "/finance-provision",
      icon: <FiDollarSign />,
      label: "Finance",
      badge: null,
    },
    {
      to: "/csr-dashboard",
      icon: <FiUsers />,
      label: "CSR",
      badge: null,
    },
    {
      to: "/company-docs",
      icon: <FiGrid />,
      label: "Company Docs",
      badge: null,
    },
    {
      to: "/merchandiser-dashboard",
      icon: <FiUsers />,
      label: "Merchandising",
      badge: null,
    },
    {
      to: "/StationeryDashboard",
      icon: <FiBriefcase />,
      label: "Stationery Dashboard",
      badge: null,
    },
    {
      to: "/ai-assistant",
      icon: <FiMessageSquare />,
      label: "AI Assistant",
      badge: null,
    },
    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      badge: null,
      onClick: handleChatClick,
    },
  ];

  // === LIMITED HR ACCESS MENU ITEMS (Group HR Head only) ===
  const limitedHRMenuItems = [
    {
      to: "/vault",
      icon: <FiLock />,
      label: "Password Vault",
      badge: null,
      highlight: true,
    },
    { to: "/hr-work", icon: <FiHome />, label: "HR Dashboard", badge: null },
    {
      to: "/finance-provision",
      icon: <FiDollarSign />,
      label: "Finance",
      badge: null,
    },
    {
      to: "RegularUserStationery",
      icon: <FiUsers />,
      label: "RegularUser Stationery",
      badge: null,
    },
    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      badge: null,
      onClick: handleChatClick,
    },
  ];

  // === REGULAR EMPLOYEE MENU ITEMS ===
  const regularEmployeeMenuItems = [
    {
      to: "/vault",
      icon: <FiLock />,
      label: "Password Vault",
      badge: null,
      highlight: true,
    },
    { to: "/dashboard", icon: <FiHome />, label: "Leave Apply", badge: null },

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
    isSupplyChainManager ||
    isZOHAER || // Add ZOHAER to team leader checks
    isApiTeamLeader
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
    isSupplyChainManager ||
    isZOHAER || // Add ZOHAER to team leader checks
    isApiTeamLeader
      ? [
          {
            to: "/performance-appraisal",
            icon: <FiAward />,
            label: "Performance Appraisal",
            badge: null,
          },
        ]
      : []),

    ...(isHeadOfFinance || departmentPermissions.isFinance || isZOHAER // Add ZOHAER to finance checks
      ? [
          {
            to: "/finance-provision",
            icon: <FiDollarSign />,
            label: "Finance",
            badge: null,
          },
        ]
      : []),

    ...(departmentPermissions.isFinance
      ? [
          {
            to: "/company-docs",
            icon: <FiGrid />,
            label: "Company Docs",
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

    ...(departmentPermissions.isMerchandising || isMerchandiserProduction || isLabQcOnly
      ? [
          {
            // Merchandiser - Production doesn't get the Order Dashboard
            // (see merchandiser/Sidebar.jsx) - send them straight to the
            // Order List instead. A restricted Lab/QC officer goes to
            // /lab-qc directly - merchandiser/Sidebar.jsx narrows her
            // menu there to just "Lab / QC" + "Orders".
            to: isMerchandiserProduction
              ? "/orders"
              : isLabQcOnly
                ? "/lab-qc"
                : "/merchandiser-dashboard",
            icon: <FiUsers />,
            label: "Merchandising",
            badge: null,
          },
        ]
      : []),

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

    {
      to: "/chat",
      icon: <FiMessageSquare />,
      label: "Chatbox",
      badge: null,
      onClick: handleChatClick,
    },
  ];

  // Select menu items based on user permissions
  // Group HR Head is NOT full access - they get limited HR menu.
  // A restricted Lab/QC officer gets the standard regularEmployeeMenuItems
  // set (Password Vault, Leave Apply, RegularUser Stationery, Chatbox) plus
  // a "Merchandising" entry point (added above) - Lab/QC itself lives
  // inside the Merchandising module's own Sidebar, not a dedicated menu
  // here.
  const menuItems = isLimitedHR
    ? limitedHRMenuItems
    : hasFullAccess
      ? hrDashboardMenuItems
      : regularEmployeeMenuItems;

  // Get department display name for user info
  const getDepartmentDisplayName = () => {
    if (isLabQcOnly) return "Lab / QC";
    if (isZOHAER) return "Finance & Operations";
    if (departmentPermissions.isAdmin) return "Admin & Management";
    if (departmentPermissions.isAdminDepartment) return "Admin Department";
    if (departmentPermissions.isHr) return "Human Resources";
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
    if (hasFullAccess) return "Administrator";
    if (isLabQcOnly) return "Lab / QC Officer";
    if (isLimitedHR) return "Group HR Head";
    if (isZOHAER) return "Team Leader - Finance & Accounts";

    // Check more specific conditions first
    if (isGroupHeadOfAdmin) return "Team Leader - Admin";
    if (isTeamLeaderQC) return "Team Leader - QA";
    if (isTeamLeaderDigital) return "Digital Marketing Team Leader";
    if (isTeamLeaderCompliance) return "Team Leader - CSR";
    if (isTeamLeader) return "Merchandising Team Leader";
    if (isProjectArchitect) return "Project Architect";
    if (isBusinessOperationManager) return "KLOTHEN Bangladesh";
    if (isHeadOfDepartment) return "Head of Department";
    if (isHeadOfDesign) return "Head of Design";
    if (isHeadOfFinance) return "Team Leader Finance & Accounts";
    if (isDirectorOfTadLogistic) return "LOGISTIC DEPARTMENT";
    if (isSupplyChainManager) return "Koithe Bangladesh";

    return "Employee";
  };

  // Determine if user should see HR sidebar style
  // Group HR Head sees HR style, but is NOT full access
  const isTeamLeaderForTheme =
    isTeamLeader ||
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
    isSupplyChainManager ||
    regularEmployeeMenuItems ||
    isZOHAER;

  const isHRDashboard = hasFullAccess || isLimitedHR || isTeamLeaderForTheme;

  const portalTitle = hrDashboardMenuItems.includes(menuItems[0])
    ? "Management"
    : isLimitedHR
      ? "HR Portal"
      : "Employee Portal";

  // Handle logo error - show fallback
  const handleLogoError = () => {
    console.error("Logo image failed to load:", logo);
    setLogoError(true);
  };

  return (
    <ErrorBoundary>
      <div>
        {/* Sidebar (slide-in drawer) */}
        <div
          ref={sidebarRef}
          className={`tad-drawer tad-sb-wrap ${isSidebarOpen ? "open" : ""}`}
          aria-hidden={!isSidebarOpen}
        >
          <aside className="tad-sb" aria-label="Main menu">
            {/* Header */}
            <div className="tad-sb-header">
              {logoError ? (
                <div className="tad-drawer-logo tad-drawer-logo-fallback">TAD</div>
              ) : (
                <img
                  src={logo}
                  alt="TAD Group"
                  className="tad-drawer-logo"
                  onError={handleLogoError}
                />
              )}
              <div className="tad-sb-brand">
                <span className="tad-sb-title">{portalTitle}</span>
                <span className="tad-sb-subtitle">TAD Group</span>
              </div>
            </div>

            {/* User Info */}
            <div className="tad-drawer-profile">
              <div className="tad-sb-user">
                <span className="tad-sb-avatar">{employeeInfo.name?.charAt(0) || "U"}</span>
                <div className="tad-sb-user-text">
                  <div className="tad-sb-user-name">{employeeInfo.name || "User"}</div>
                  <div className="tad-sb-user-role">{employeeInfo.designation || "Employee"}</div>
                </div>
              </div>
              <div className="tad-drawer-meta">
                <div>
                  <strong>Department:</strong> {getDepartmentDisplayName()}
                </div>
                <div>
                  <strong>Role:</strong> {getUserRoleDisplay()}
                </div>
                {employeeInfo.reporting_leader && (
                  <div>
                    <strong>Reports to:</strong> {employeeInfo.reporting_leader}
                  </div>
                )}
                {isZOHAER && <span className="tad-drawer-chip">✓ Team Leader Access</span>}
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="tad-sb-nav">
              <div className="tad-sb-section-label">Menu</div>
              <ul className="tad-sb-list">
                {menuItems.map(({ to, icon, label, badge, onClick, highlight }) => {
                  const active = location.pathname === to;
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={onClick}
                        className={`tad-sb-link ${active ? "active" : ""} ${highlight ? "highlight" : ""}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="tad-sb-icon">{icon}</span>
                        <span className="tad-sb-label">{label}</span>
                        {badge && <span className="tad-sb-badge">{badge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout Button */}
            <div className="tad-sb-footer">
              <button type="button" onClick={handleLogout} className="tad-logout-btn">
                <FiLogOut /> Logout
              </button>
            </div>
          </aside>
        </div>

        {/* Toggle Button (always visible, position changes based on sidebar state) */}
        <button
          ref={toggleBtnRef}
          type="button"
          onClick={toggleSidebar}
          className={`menu-btn tad-menu-btn ${isSidebarOpen ? "open" : ""}`}
          aria-label={isSidebarOpen ? "Close main menu" : "Open main menu"}
          title={isSidebarOpen ? "Close menu" : "Main menu"}
        >
          {isSidebarOpen ? <FiChevronLeft size={20} /> : <FiMenu size={20} />}
        </button>

        <style>{`
          .main-content {
            flex: 1;
            padding: 30px;
            z-index: 0;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: ${isSidebarOpen ? "280px" : "0"};
          }

          /* app-wide scrollbars (this component is mounted on every page) */
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

          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              padding: 20px;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default Sidebar;
