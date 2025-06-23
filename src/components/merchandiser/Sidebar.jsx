import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiCalendar, FiMail, FiFileText, FiDollarSign, FiTerminal, FiSend, FiLogOut, FiPieChart, FiBriefcase, FiClock, FiHome } from 'react-icons/fi';
import { TfiEmail,TfiWorld } from "react-icons/tfi";

const Sidebar = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const sidebarStyle = {
    width: '250px',
    backgroundColor: '#DCEEF3',
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    
    // Make it full height
  };



  const navStyle = {
    padding: '1rem',
    flex: 1, // Allow navigation to expand
    overflowY: 'auto', // Add scroll if needed
  };

  const ulStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  };

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    backgroundColor: location.pathname === path ? '#eff6ff' : 'transparent',
    color: location.pathname === path ? '#2563eb' : '#374151',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
    ':hover': { backgroundColor: '#f3f4f6' },
  });

  const iconStyle = {
    marginRight: '0.75rem',
  };

  return (
    <div style={sidebarStyle}>
      
      <nav style={navStyle}>
        <ul style={ulStyle}>
          <li>
            <Link to="/dashboard" style={linkStyle('/dashboard')} onClick={() => setActiveTab('/hr-work')}>
              <FiHome style={iconStyle} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/agents" style={linkStyle('/agents')} onClick={() => setActiveTab('/cv-list')}>
              <FiFileText style={iconStyle} />
              Agents
            </Link>
          </li>
          <li>
            <Link to="/buyers" style={linkStyle('/buyers')} onClick={() => setActiveTab('/interviews')}>
              <FiBriefcase style={iconStyle} />
              Buyers
            </Link>
          </li>
          <li>
            <Link to="/customers" style={linkStyle('/customers')} onClick={() => setActiveTab('/employees')}>
              <FiUsers style={iconStyle} />
              Customers
            </Link>
          </li>
          <li>
            <Link to="/suppliers" style={linkStyle('/suppliers')} onClick={() => setActiveTab('/attendance')}>
              <FiClock style={iconStyle} />
              Suppliers
            </Link>
          </li>
          <li>
            <Link to="/inquiries" style={linkStyle('/inquiries')} onClick={() => setActiveTab('/employee_leave')}>
              <FiCalendar style={iconStyle} />
              Inquiry
            </Link>
          </li>
          <li>
            <Link to="/performanse_appraisal" style={linkStyle('/performanse_appraisal')} onClick={() => setActiveTab('/performanse_appraisal')}>
              <FiCalendar style={iconStyle} />
              Performance Appraisal
            </Link>
          </li>
          <li>
            <Link to="/finance-provision" style={linkStyle('/finance-provision')} onClick={() => setActiveTab('/finance-provision')}>
              <FiDollarSign style={iconStyle} />
              Finance
            </Link>
          </li>
          <li>
            <Link to="/employee-termination" style={linkStyle('/employee-termination')} onClick={() => setActiveTab('/employee-termination')}>
              <FiLogOut style={iconStyle} />
              Termination
            </Link>
          </li>
          <li>
            <Link to="/letter-send" style={linkStyle('/letter-send')} onClick={() => setActiveTab('/letter-send')}>
              <FiSend style={iconStyle} />
              Send Letters
            </Link>
          </li>
          <li>
            <Link to="/email-logs" style={linkStyle('/email-logs')} onClick={() => setActiveTab('/email-logs')}>
              <TfiEmail style={iconStyle} />
              Email log
            </Link>
          </li>
          <li>
            <Link to="/tad-groups" style={linkStyle('/tad-groups')} onClick={() => setActiveTab('/tad-groups')}>
              <TfiWorld style={iconStyle} />
              Tad Group
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;