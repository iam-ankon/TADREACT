import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu } from "react-icons/fi";
import { FiUsers, FiCalendar, FiMail, FiFileText, FiDollarSign, FiTerminal, FiSend, FiLogOut, FiPieChart, FiBriefcase, FiClock, FiHome } from 'react-icons/fi';
import logo from '../../assets/texweave_Logo_1.png';

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar state (open/close)
  const navigate = useNavigate(); // Initialize useNavigate hook
  const sidebarRef = useRef(null); // Reference to the sidebar
  const toggleBtnRef = useRef(null); // Reference to the toggle button
  const logoutBtnRef = useRef(null); // Reference to the logout button

  // Navigate to the HR Work page
  const handleHRWorkClick = () => {
    navigate('/hr-work');
  };

  const handleMerchandiserClick = () => {
    navigate('/dashboard');
  };

  // Navigate to the Dashboard page
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const iconStyle = {
    marginRight: '0.75rem',
  };
  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true }); // Prevent back navigation to protected pages
  };

  // Toggle Sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close Sidebar when clicking outside
  const closeSidebarOnClickOutside = (event) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target) && !toggleBtnRef.current.contains(event.target)) {
      setIsSidebarOpen(false);
    }
  };

  // Adding the event listener to detect clicks outside of the sidebar
  useEffect(() => {
    document.addEventListener('click', closeSidebarOnClickOutside);

    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener('click', closeSidebarOnClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div ref={sidebarRef} className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          {/* Logo Section */}
          <div className="logo">
            <img src={logo} alt="Logo" className="logo-image" />
          </div>
          <button onClick={handleDashboardClick} className="sidebar-title">
            Dashboard
          </button>
        </div>
        <ul className="sidebar-menu">
          {/* Other Sidebar Links */}
        </ul>

        {/* HR Work Button */}
        <button
          onClick={handleHRWorkClick}
          className="hr-work-btn"
        >
          <FiUsers style={iconStyle} />
           Human Resource
        </button>
        <button
          onClick={handleMerchandiserClick}
          className="hr-work-btn"
        >
          Merchandiser
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Sidebar Toggle Button */}
        <button ref={toggleBtnRef} onClick={toggleSidebar} className="menu-btn">
          <FiMenu size={24} />
        </button>
      </div>

      {/* Buttons Above the Blue Bar */}
      <div className="button-bar">
        {/* Logout Button with Logo */}
        <button
          ref={logoutBtnRef}
          onClick={handleLogout}
          className="logout-button"
        >
          <FiLogOut style={iconStyle} />
           Logout
        </button>
      </div>

      {/* Full Screen Blue Bar Below the Buttons */}
      <div className="blue-bar"></div>

      <style jsx>{`
        /* Sidebar Styles */
        .sidebar {
          position: fixed;
          left: -250px;
          top: 0;
          height: 100vh;
          width: 250px;
          background: linear-gradient(135deg,rgb(127, 137, 147),rgb(46, 116, 181));
          color: white;
          transition: 0.3s ease-in-out;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
          padding-top: 40px;
          z-index: 1000; /* Set a high z-index to ensure it overlays other elements */
        }

        .sidebar.open {
          left: 0;
        }

        .main-content {
          flex: 1;
          padding: 30px;
          z-index: 0; /* Lower z-index to make sure it's behind the sidebar */
        }

        .sidebar-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          font-size: 1.5rem;
          font-weight: bold;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo {
          margin-bottom: 10px;
        }

        .logo-image {
          width: 50px;
          height: auto;
        }

        .menu-btn {
          position: fixed;
          top: 15px;
          left: 15px;
          background:rgb(95, 111, 129);
          color: white;
          border: none;
          padding: 10px 12px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 1500; /* Ensure it's on top of sidebar and content */
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .blue-bar {
          position: fixed;
          top: 0;  /* Adjust to cover everything under the buttons */
          left: 0;
          width: 100%;  /* Full screen width */
          height: 70px;  /* Adjust to the height that fits the buttons */
          background-color:rgb(55, 72, 89);
          z-index: 5;  /* Ensure it's below the sidebar */
        }

        /* Logout Button Styles */
        .logout-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #e53e3e;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
        }

        .logout-logo {
          width: 20px;
          height: auto;
          margin-right: 10px;
        }

        .logout-button:hover {
          background-color: #c53030;
        }

        /* HR Work Button */
        .hr-work-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          padding: 10px 20px;
          margin-top: 20px;
          transition: background 0.3s ease;
        }

        .hr-work-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        /* Full Screen Blue Bar Below the Buttons */
        .blue-bar {
          position: fixed;
          top: 0;  /* Adjust to cover everything under the buttons */
          left: 0;
          width: 100%;  /* Full screen width */
          height: 70px;  /* Adjust to the height that fits the buttons */
          background-color:rgb(89, 130, 168);
          z-index: 10;  /* Ensure it's below the buttons */
        }

        .button-bar {
          position: fixed;
          top: 10px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 10px 20px;
          z-index: 20; /* Above the blue bar */
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar {
            width: 200px;
            padding: 15px;
          }

          .blue-bar {
            height: 70px;  /* Bar height remains the same */
          }
        }

        /* Sidebar Title (Dashboard Button) */
        .sidebar-title {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 10px 20px;
          margin-top: 20px;
          transition: background 0.3s ease;
        }

        .sidebar-title:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;