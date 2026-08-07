import React, { useState, useEffect } from "react";
import Sidebars from "./sidebars";
import { getCompanies } from "../../api/employeeApi";

const TADGroups = () => {
  const [tadGroups, setTadGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch TAD groups from the API using employeeApi
  useEffect(() => {
    const fetchTadGroups = async () => {
      try {
        setLoading(true);
        console.log("🔄 Fetching TAD groups...");
        
        // The API returns an Axios response object, we need the data property
        const response = await getCompanies();
        console.log("📦 Full response:", response);
        console.log("📊 Response data:", response.data);
        
        // Extract the data array from the response
        const companiesData = response.data;
        
        setTadGroups(companiesData);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching TAD groups:", err);
        setError("Failed to load TAD groups");
        setTadGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTadGroups();
  }, []);

  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>
      {/* Main Content */}
      <div style={styles.outlookContainer}>
        <div style={styles.outlookHeader}>
          <h2>TAD Groups</h2>
          {!loading && tadGroups.length > 0 && (
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
              Showing {tadGroups.length} companies
            </p>
          )}
        </div>
        <div style={styles.outlookBody}>
          {loading ? (
            <p>Loading TAD Groups...</p>
          ) : error ? (
            <p style={styles.errorText}>{error}</p>
          ) : tadGroups.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tadGroups.map((group) => (
                <li key={group.id} style={styles.groupItem}>
                  <div style={styles.companyCard}>
                    <div style={styles.companyName}>{group.company_name}</div>
                    <div style={styles.companyId}>ID: {group.id}</div>
                  </div>
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  outlookContainer: {
    flex: 1,
    backgroundColor: "#f3f6fb",
    borderLeft: "1px solid #ccc",
    padding: "30px",
    overflowY: "auto",
  },
  outlookHeader: {
    backgroundColor: "#0078d4",
    color: "white",
    padding: "20px",
    borderRadius: "8px 8px 0 0",
    marginBottom: "10px",
  },
  outlookBody: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "0 0 8px 8px",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.05)",
    minHeight: "200px",
  },
  groupItem: {
    margin: "10px 0",
  },
  companyCard: {
    padding: "15px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  companyName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  companyId: {
    fontSize: "12px",
    color: "#7f8c8d",
    backgroundColor: "#ecf0f1",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    padding: "20px",
  },
};

// Add hover effect
styles.companyCard[':hover'] = {
  backgroundColor: "#e3f2fd",
  borderColor: "#0078d4",
  transform: "translateY(-2px)",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
};

export default TADGroups;