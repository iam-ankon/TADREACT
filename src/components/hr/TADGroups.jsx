import React, { useState, useEffect } from 'react';
import Sidebars from './sidebars';

const TADGroups = () => {
  const [tadGroups, setTadGroups] = useState([]);

  // Fetch TAD groups from the API
  useEffect(() => {
    fetch('http://119.148.12.1:8000/api/hrms/api/tad_groups/')
      .then(response => response.json())
      .then(data => setTadGroups(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>
      {/* Main Content */}
      <div style={styles.outlookContainer}>
        <div style={styles.outlookHeader}>
          <h2>TAD Groups</h2>
        </div>
        <div style={styles.outlookBody}>
          {tadGroups.length > 0 ? (
            <ul>
              {tadGroups.map(group => (
                <li key={group.id} style={styles.groupItem}>
                  <span>{group.company_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No TAD Groups available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline CSS styles
const styles = {
  appContainer: {
    display: "flex",
    height: "100vh",
    
  },
  sidebar: {
    width: "230px",
    backgroundColor: "#f3f6fb",
    height: "100vh",
    padding: "20px 15px",
    boxShadow: "2px 0 5px rgba(0, 0, 0, 0.05)",
  },
  sidebarHeader: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#0078D4",
  },
  sidebarLink: {
    display: "block",
    padding: "10px",
    margin: "5px 0",
    textDecoration: "none",
    color: "#333",
    borderRadius: "6px",
    transition: "0.3s",
  },
  sidebarLinkHover: {
    backgroundColor: "#e1eaff",
  },
  outlookContainer: {
    flex: 1,
    backgroundColor: '#f3f6fb',
    borderLeft: '1px solid #ccc',
    padding: '30px',
    overflowY: 'auto'
  },
  outlookHeader: {
    backgroundColor: '#0078d4',
    color: 'white',
    padding: '20px',
    borderRadius: '8px 8px 0 0',
    marginBottom: '10px'
  },
  outlookBody: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '0 0 8px 8px',
    boxShadow: '0px 4px 8px rgba(0,0,0,0.05)'
  },
  groupItem: {
    padding: '10px',
    margin: '5px 0',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '5px'
  }
};

export default TADGroups;
