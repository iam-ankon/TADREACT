// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { FiMenu } from "react-icons/fi";
// import {
//   FiUsers,
//   FiCalendar,
//   FiMail,
//   FiFileText,
//   FiDollarSign,
//   FiTerminal,
//   FiSend,
//   FiLogOut,
//   FiPieChart,
//   FiBriefcase,
//   FiClock,
//   FiHome,
// } from "react-icons/fi";
// import logo from "../../assets/texweave_Logo_1.png";

// const Sidebar = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar state (open/close)
//   const navigate = useNavigate(); // Initialize useNavigate hook
//   const sidebarRef = useRef(null); // Reference to the sidebar
//   const toggleBtnRef = useRef(null); // Reference to the toggle button
//   const logoutBtnRef = useRef(null); // Reference to the logout button

//   // Navigate to the HR Work page
//   const handleHRWorkClick = () => {
//     navigate("/hr-work");
//   };

//   const handleMerchandiserClick = () => {
//     navigate("/dashboard");
//   };

//   // Navigate to the Dashboard page
//   const handleDashboardClick = () => {
//     navigate("/hr-work");
//   };

//   const iconStyle = {
//     marginRight: "0.75rem",
//   };
//   // Handle Logout

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     navigate("/", { replace: true }); // clear history
//   };
//   // Toggle Sidebar visibility
//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   // Close Sidebar when clicking outside
//   const closeSidebarOnClickOutside = (event) => {
//     if (
//       sidebarRef.current &&
//       !sidebarRef.current.contains(event.target) &&
//       !toggleBtnRef.current.contains(event.target)
//     ) {
//       setIsSidebarOpen(false);
//     }
//   };

//   // Adding the event listener to detect clicks outside of the sidebar
//   useEffect(() => {
//     document.addEventListener("click", closeSidebarOnClickOutside);

//     // Cleanup the event listener when component unmounts
//     return () => {
//       document.removeEventListener("click", closeSidebarOnClickOutside);
//     };
//   }, []);

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Sidebar */}
//       <div
//         ref={sidebarRef}
//         className={`sidebar ${isSidebarOpen ? "open" : ""}`}
//       >
//         <div className="sidebar-header">
//           {/* Logo Section */}
//           <div className="logo">
//             <img src={logo} alt="Logo" className="logo-image" />
//           </div>
//           <button onClick={handleDashboardClick} className="sidebar-title">
//             Dashboard
//           </button>
//         </div>
//         <ul className="sidebar-menu">{/* Other Sidebar Links */}</ul>

//         {/* HR Work Button */}
//         <button onClick={handleHRWorkClick} className="hr-work-btn">
//           <FiUsers style={iconStyle} />
//           Human Resource
//         </button>
//         {/* <button onClick={handleMerchandiserClick} className="hr-work-btn">
//           Merchandiser
//         </button> */}
//       </div>

//       {/* Main Content Area */}
//       <div className="main-content">
//         {/* Sidebar Toggle Button */}
//         <button ref={toggleBtnRef} onClick={toggleSidebar} className="menu-btn">
//           <FiMenu size={24} />
//         </button>
//       </div>

//       {/* Buttons Above the Blue Bar */}
//       <div className="button-bar">
//         {/* Logout Button with Logo */}
//         <button
//           ref={logoutBtnRef}
//           onClick={handleLogout}
//           className="logout-button"
//         >
//           <FiLogOut style={iconStyle} />
//           Logout
//         </button>
//       </div>

//       {/* Full Screen Blue Bar Below the Buttons */}
//       <div className="blue-bar"></div>

//       <style jsx>{`
//         /* Sidebar Styles */
//         .sidebar {
//           position: fixed;
//           left: -250px;
//           top: 0;
//           height: 100vh;
//           width: 250px;
//           background: linear-gradient(
//             135deg,
//             rgb(127, 137, 147),
//             rgb(46, 116, 181)
//           );
//           color: white;
//           transition: 0.3s ease-in-out;
//           display: flex;
//           flex-direction: column;
//           box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
//           padding-top: 40px;
//           z-index: 1000; /* Set a high z-index to ensure it overlays other elements */
//         }

//         .sidebar.open {
//           left: 0;
//         }

//         .main-content {
//           flex: 1;
//           padding: 30px;
//           z-index: 0; /* Lower z-index to make sure it's behind the sidebar */
//         }

//         .sidebar-header {
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           padding: 20px;
//           font-size: 1.5rem;
//           font-weight: bold;
//           border-bottom: 1px solid rgba(255, 255, 255, 0.2);
//         }

//         .logo {
//           margin-bottom: 10px;
//         }

//         .logo-image {
//           width: 50px;
//           height: auto;
//         }

//         .menu-btn {
//           position: fixed;
//           top: 15px;
//           left: 15px;
//           background: rgb(95, 111, 129);
//           color: white;
//           border: none;
//           padding: 10px 12px;
//           border-radius: 50%;
//           cursor: pointer;
//           z-index: 1500; /* Ensure it's on top of sidebar and content */
//           display: flex;
//           justify-content: center;
//           align-items: center;
//         }

//         .blue-bar {
//           position: fixed;
//           top: 0; /* Adjust to cover everything under the buttons */
//           left: 0;
//           width: 100%; /* Full screen width */
//           height: 70px; /* Adjust to the height that fits the buttons */
//           background-color: rgb(55, 72, 89);
//           z-index: 5; /* Ensure it's below the sidebar */
//         }

//         /* Logout Button Styles */
//         .logout-button {
//           position: fixed;
//           top: 20px;
//           right: 20px;
//           background-color: #e53e3e;
//           color: white;
//           padding: 10px 20px;
//           border-radius: 8px;
//           font-size: 1rem;
//           cursor: pointer;
//           transition: background-color 0.3s ease;
//           display: flex;
//           align-items: center;
//         }

//         .logout-logo {
//           width: 20px;
//           height: auto;
//           margin-right: 10px;
//         }

//         .logout-button:hover {
//           background-color: #c53030;
//         }

//         /* HR Work Button */
//         .hr-work-btn {
//           background: none;
//           border: none;
//           color: white;
//           font-size: 1rem;
//           cursor: pointer;
//           padding: 10px 20px;
//           margin-top: 20px;
//           transition: background 0.3s ease;
//         }

//         .hr-work-btn:hover {
//           background-color: rgba(255, 255, 255, 0.2);
//         }

//         /* Full Screen Blue Bar Below the Buttons */
//         .blue-bar {
//           position: fixed;
//           top: 0; /* Adjust to cover everything under the buttons */
//           left: 0;
//           width: 100%; /* Full screen width */
//           height: 70px; /* Adjust to the height that fits the buttons */
//           background-color: rgb(89, 130, 168);
//           z-index: 10; /* Ensure it's below the buttons */
//         }

//         .button-bar {
//           position: fixed;
//           top: 10px;
//           left: 0;
//           right: 0;
//           display: flex;
//           justify-content: space-between;
//           padding: 10px 20px;
//           z-index: 20; /* Above the blue bar */
//         }

//         /* Mobile Responsive */
//         @media (max-width: 768px) {
//           .sidebar {
//             width: 200px;
//             padding: 15px;
//           }

//           .blue-bar {
//             height: 70px; /* Bar height remains the same */
//           }
//         }

//         /* Sidebar Title (Dashboard Button) */
//         .sidebar-title {
//           background: none;
//           border: none;
//           color: white;
//           font-size: 1.5rem;
//           cursor: pointer;
//           padding: 10px 20px;
//           margin-top: 20px;
//           transition: background 0.3s ease;
//         }

//         .sidebar-title:hover {
//           background-color: rgba(255, 255, 255, 0.2);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Sidebar;






import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPieChart,
  FiDollarSign,
  FiMessageSquare,
  FiMenu,
  FiLogOut,
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
      return <div className="p-4 text-red-500">Error loading sidebar. Please refresh.</div>;
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

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      localStorage.setItem("sidebarOpen", JSON.stringify(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      
      // Get token from localStorage
      const token = localStorage.getItem("token");
      
      // Optional: Call backend logout endpoint if you have one
      if (token) {
        try {
          // If you have a logout endpoint, call it here
          // await fetch('/api/auth/logout/', {
          //   method: 'POST',
          //   headers: {
          //     'Authorization': `Token ${token}`,
          //     'Content-Type': 'application/json',
          //   },
          // });
        } catch (error) {
          console.error("Error calling logout endpoint:", error);
        }
      }

      // Clear all authentication data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("user_id");
      
      // Clear any session storage if used
      sessionStorage.clear();
      
      // Reset any default headers if you're using axios
      // delete axios.defaults.headers.common['Authorization'];
      
      console.log("Logout successful, redirecting to login...");
      
      // Navigate to login page with replace to prevent going back
      navigate("/", { replace: true });
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear local storage and redirect
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const handleChatClick = (e) => {
    console.log("Chatbox clicked, navigating to /chat");
    navigate("/chat");
    e.preventDefault();
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

  const sidebarStyle = {
    position: "fixed",
    left: isSidebarOpen ? "0" : "-250px",
    top: "0",
    height: "100vh",
    width: "250px",
    background: "linear-gradient(135deg, rgb(127, 137, 147), rgb(46, 116, 181))",
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
    backgroundColor: location.pathname === path ? "rgba(255, 255, 255, 0.2)" : "transparent",
    color: "white",
    textDecoration: "none",
    transition: "background-color 0.2s ease",
    fontSize: "1rem",
  });

  const iconStyle = {
    marginRight: isSidebarOpen ? "0.75rem" : "0",
    fontSize: "1.25rem",
    minWidth: "24px",
    textAlign: "center",
  };

  const menuItems = [
    { to: "/hr-work", icon: <FiHome />, label: "HR Dashboard" },
    // { to: "/dashboard", icon: <FiPieChart />, label: "Merchandiser Dashboard" },
    { to: "/chat", icon: <FiMessageSquare />, label: "Chatbox", onClick: handleChatClick },
    { to: "/finance-provision", icon: <FiDollarSign />, label: "Finance" },
  ];

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-100">
        <div ref={sidebarRef} style={sidebarStyle}>
          <div style={headerStyle}>
            <div style={logoStyle}>
              <img src={logo} alt="Logo" style={logoImageStyle} />
            </div>
            <span>{isSidebarOpen ? "Dashboard" : "D"}</span>
          </div>
          <nav style={navStyle}>
            <ul style={ulStyle}>
              {menuItems.map(({ to, icon, label, onClick }) => (
                <li key={to}>
                  <Link to={to} style={linkStyle(to)} onClick={onClick}>
                    <span style={iconStyle}>{icon}</span>
                    {isSidebarOpen && <span>{label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#c53030"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#e53e3e"}
            >
              <FiLogOut style={iconStyle} />
              {isSidebarOpen && "Logout"}
            </button>
          </div>
        </div>

        <div className="main-content">
          <button ref={toggleBtnRef} onClick={toggleSidebar} className="menu-btn">
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
            border-radius: 50%;
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