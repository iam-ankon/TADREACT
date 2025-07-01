// import React, { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { FiUsers, FiCalendar, FiMail, FiFileText, FiDollarSign, FiTerminal, FiSend, FiLogOut, FiPieChart, FiBriefcase, FiClock, FiHome } from 'react-icons/fi';
// import { TfiEmail,TfiWorld } from "react-icons/tfi";

// const Sidebar = () => {
//   const location = useLocation();
//   const [activeTab, setActiveTab] = useState(location.pathname);

//   const sidebarStyle = {
//     width: '250px',
//     backgroundColor: '#DCEEF3',
//     boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
//     display: 'flex',
//     flexDirection: 'column',

//     // Make it full height
//   };

//   const headerStyle = {
//     padding: '1rem',
//     borderBottom: '1px solid #e5e7eb',
//   };

//   const headerTextStyle = {
//     fontSize: '1.25rem',
//     fontWeight: 600,
//     color: '#374151',
//   };

//   const navStyle = {
//     padding: '1rem',
//     flex: 1, // Allow navigation to expand
//     overflowY: 'auto', // Add scroll if needed
//   };

//   const ulStyle = {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '0.5rem',
//     listStyleType: 'none',
//     padding: 0,
//     margin: 0,
//   };

//   const linkStyle = (path) => ({
//     display: 'flex',
//     alignItems: 'center',
//     padding: '0.5rem',
//     borderRadius: '0.375rem',
//     backgroundColor: location.pathname === path ? '#eff6ff' : 'transparent',
//     color: location.pathname === path ? '#2563eb' : '#374151',
//     textDecoration: 'none',
//     transition: 'background-color 0.2s',
//     ':hover': { backgroundColor: '#f3f4f6' },
//   });

//   const iconStyle = {
//     marginRight: '0.75rem',
//   };

//   return (
//     <div style={sidebarStyle}>
//       <div style={headerStyle}>
//         <h2 style={headerTextStyle}>HR Dashboard</h2>
//       </div>
//       <nav style={navStyle}>
//         <ul style={ulStyle}>
//           <li>
//             <Link to="/hr-work" style={linkStyle('/hr-work')} onClick={() => setActiveTab('/hr-work')}>
//               <FiHome style={iconStyle} />
//               Dashboard
//             </Link>
//           </li>
//           <li>
//             <Link to="/cv-list" style={linkStyle('/cv-list')} onClick={() => setActiveTab('/cv-list')}>
//               <FiFileText style={iconStyle} />
//               All CV
//             </Link>
//           </li>
//           <li>
//             <Link to="/interviews" style={linkStyle('/interviews')} onClick={() => setActiveTab('/interviews')}>
//               <FiBriefcase style={iconStyle} />
//               Recruitment
//             </Link>
//           </li>
//           <li>
//             <Link to="/employees" style={linkStyle('/employees')} onClick={() => setActiveTab('/employees')}>
//               <FiUsers style={iconStyle} />
//               Employees
//             </Link>
//           </li>
//           <li>
//             <Link to="/attendance" style={linkStyle('/attendance')} onClick={() => setActiveTab('/attendance')}>
//               <FiClock style={iconStyle} />
//               Attendance
//             </Link>
//           </li>
//           <li>
//             <Link to="/employee_leave" style={linkStyle('/employee_leave')} onClick={() => setActiveTab('/employee_leave')}>
//               <FiCalendar style={iconStyle} />
//               Leave Management
//             </Link>
//           </li>
//           <li>
//             <Link to="/performanse_appraisal" style={linkStyle('/performanse_appraisal')} onClick={() => setActiveTab('/performanse_appraisal')}>
//               <FiCalendar style={iconStyle} />
//               Performance Appraisal
//             </Link>
//           </li>
//           <li>
//             <Link to="/finance-provision" style={linkStyle('/finance-provision')} onClick={() => setActiveTab('/finance-provision')}>
//               <FiDollarSign style={iconStyle} />
//               Finance
//             </Link>
//           </li>
//           <li>
//             <Link to="/employee-termination" style={linkStyle('/employee-termination')} onClick={() => setActiveTab('/employee-termination')}>
//               <FiLogOut style={iconStyle} />
//               Termination
//             </Link>
//           </li>
//           <li>
//             <Link to="/letter-send" style={linkStyle('/letter-send')} onClick={() => setActiveTab('/letter-send')}>
//               <FiSend style={iconStyle} />
//               Send Letters
//             </Link>
//           </li>
//           <li>
//             <Link to="/email-logs" style={linkStyle('/email-logs')} onClick={() => setActiveTab('/email-logs')}>
//               <TfiEmail style={iconStyle} />
//               Email log
//             </Link>
//           </li>
//           <li>
//             <Link to="/tad-groups" style={linkStyle('/tad-groups')} onClick={() => setActiveTab('/tad-groups')}>
//               <TfiWorld style={iconStyle} />
//               Tad Group
//             </Link>
//           </li>
//         </ul>
//       </nav>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiSend,
  FiLogOut,
  FiBriefcase,
  FiClock,
  FiHome,
  FiChevronLeft,
  FiMenu,
} from "react-icons/fi";
import { TfiEmail, TfiWorld } from "react-icons/tfi";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const sidebarStyle = {
    width: isOpen ? "250px" : "70px",
    backgroundColor: "#DCEEF3",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    transition: "width 0.3s ease",
    position: "relative",
    overflow: "hidden",
  };


  const toggleButtonStyle = {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    top: "18px",
    right: isOpen ? "10px" : "-1px",
    transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
    borderRadius: "50%",
    padding: "0.3rem",
    cursor: "pointer",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease, right 0.3s ease",
  };

  const headerStyle = {
    padding: "1rem",
    paddingLeft: isOpen ? "1rem" : "0.5rem",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#374151",
    whiteSpace: "nowrap",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    { to: "/finance-provision", icon: <FiDollarSign />, label: "Finance" },
    { to: "/employee-termination", icon: <FiLogOut />, label: "Termination" },
    { to: "/letter-send", icon: <FiSend />, label: "Send Letters" },
    { to: "/email-logs", icon: <TfiEmail />, label: "Email log" },
    { to: "/tad-groups", icon: <TfiWorld />, label: "Tad Group" },
  ];

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <span>{isOpen ? "HR Dashboard" : "HR"}</span>
        <button onClick={toggleSidebar} style={toggleButtonStyle}>
          {isOpen ? <FiChevronLeft /> : <FiMenu />}
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

export default Sidebar;
