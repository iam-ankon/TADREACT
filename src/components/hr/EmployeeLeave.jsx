import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeLeaves, deleteEmployeeLeave } from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameSearch, setNameSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        console.log("🔄 Fetching leave data...");
        const response = await getEmployeeLeaves();

        if (response.data && Array.isArray(response.data)) {
          console.log("✅ Valid array received, length:", response.data.length);
          if (response.data.length > 0) {
            console.log(
              "👤 Employee name in data:",
              response.data[0].employee_name
            );
            console.log("🆔 Employee ID in data:", response.data[0].employee);
          }

          setLeaves(response.data);
          setFilteredLeaves(response.data);
        } else {
          console.warn("❌ Invalid data format received");
          setLeaves([]);
          setFilteredLeaves([]);
        }
      } catch (error) {
        console.error("❌ Error fetching leave data:", error);
        console.error("Error details:", error.response?.data);
        alert("Failed to load leave data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  useEffect(() => {
    let results = leaves;

    if (nameSearch) {
      results = results.filter((leave) =>
        leave.employee_name.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }

    if (startDate) {
      results = results.filter(
        (leave) => new Date(leave.start_date) >= new Date(startDate)
      );
    }

    if (endDate) {
      results = results.filter(
        (leave) => new Date(leave.end_date) <= new Date(endDate)
      );
    }

    setFilteredLeaves(results);
  }, [nameSearch, startDate, endDate, leaves]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave record?")) {
      return;
    }

    try {
      await deleteEmployeeLeave(id);
      setLeaves(leaves.filter((leave) => leave.id !== id));
      alert("Leave record deleted successfully!");
    } catch (error) {
      console.error("Error deleting leave record:", error);
      alert("Failed to delete leave record. Please try again.");
    }
  };

  const handleRowClick = (id) => {
    navigate(`/leave-request-details/${id}`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "#f59e0b", bgColor: "#fef3c7", label: "⏳ Pending" },
      approved: { color: "#10b981", bgColor: "#d1fae5", label: "✅ Approved" },
      rejected: { color: "#ef4444", bgColor: "#fee2e2", label: "❌ Rejected" },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span
        style={{
          color: config.color,
          backgroundColor: config.bgColor,
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-block",
          minWidth: "80px",
          textAlign: "center",
        }}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading leave records...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Employee Leave Management</h1>
            <p style={styles.headerSubtitle}>
              Manage and track employee leave requests
            </p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{filteredLeaves.length}</span>
              <span style={styles.statLabel}>Total Records</span>
            </div>
          </div>
        </div>

        <div style={styles.contentCard}>
          {/* Search and Filters Section */}
          <div style={styles.filtersSection}>
            <h3 style={styles.sectionTitle}>Search & Filters</h3>
            <div style={styles.filtersGrid}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Search by Employee Name</label>
                <input
                  type="text"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Enter employee name..."
                  style={styles.filterInput}
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Start Date Range</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.filterInput}
                />
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>End Date Range</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.filterInput}
                />
              </div>

              <div style={styles.filterGroup}>
                <button
                  onClick={() => {
                    setNameSearch("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  style={styles.clearButton}
                >
                  🗑️ Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div style={styles.actionsSection}>
            <h3 style={styles.sectionTitle}>Quick Actions</h3>
            <div style={styles.actionsGrid}>
              <button
                onClick={() => navigate("/add-leave-request")}
                style={styles.primaryButton}
              >
                ➕ Add New Leave Record
              </button>
              <button
                onClick={() => navigate("/employee_leave_type")}
                style={styles.secondaryButton}
              >
                📊 Leave Types
              </button>
              <button
                onClick={() => navigate("/employee_leave_balance")}
                style={styles.secondaryButton}
              >
                ⚖️ Leave Balance
              </button>
            </div>
          </div>

          {/* Leave Records Table */}
          <div style={styles.tableSection}>
            <div style={styles.tableHeader}>
              <h3 style={styles.sectionTitle}>Leave Records</h3>
              <span style={styles.resultsCount}>
                {filteredLeaves.length} record{filteredLeaves.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeaderCell}>Employee</th>
                    <th style={styles.tableHeaderCell}>Leave Type</th>
                    <th style={styles.tableHeaderCell}>Start Date</th>
                    <th style={styles.tableHeaderCell}>End Date</th>
                    <th style={styles.tableHeaderCell}>Duration</th>
                    <th style={styles.tableHeaderCell}>Status</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave, index) => (
                      <tr
                        key={leave.id}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc',
                        }}
                        onClick={() => handleRowClick(leave.id)}
                      >
                        <td style={styles.tableCell}>
                          <div style={styles.employeeCell}>
                            <div style={styles.avatar}>
                              {leave.employee_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={styles.employeeName}>
                                {leave.employee_name}
                              </div>
                              {leave.employee_code && (
                                <div style={styles.employeeId}>
                                  ID: {leave.employee_code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.leaveType}>
                            {leave.leave_type?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(leave.start_date).toLocaleDateString()}
                        </td>
                        <td style={styles.tableCell}>
                          {new Date(leave.end_date).toLocaleDateString()}
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.durationBadge}>
                            {leave.leave_days || 'N/A'} day{leave.leave_days !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {getStatusBadge(leave.status)}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/edit-leave-request/${leave.id}`);
                              }}
                              style={styles.editButton}
                              title="Edit leave record"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(leave.id);
                              }}
                              style={styles.deleteButton}
                              title="Delete leave record"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={styles.noDataCell}>
                        <div style={styles.noData}>
                          <div style={styles.noDataIcon}>📝</div>
                          <h4>No leave records found</h4>
                          <p>Try adjusting your search criteria or add a new leave record.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations and scrollbars */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Main content scrollbar */
          .main-content-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
          
          .main-content-scroll::-webkit-scrollbar {
            width: 12px;
          }
          
          .main-content-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 6px;
          }
          
          .main-content-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 6px;
            border: 2px solid #f1f5f9;
          }
          
          .main-content-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Table container scrollbar */
          .table-container-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }
          
          .table-container-scroll::-webkit-scrollbar {
            height: 8px;
          }
          
          .table-container-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .table-container-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          
          .table-container-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}
      </style>
    </div>
  );
};

// ========================
// Simplified Styles with Proper Scroll
// ========================
const styles = {
  container: {
    display: "flex",
    height: "100vh", // Use full viewport height
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    overflow: "hidden", // Prevent container scrolling
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f8fafc",
  },
  loadingSpinner: {
    textAlign: "center",
    color: "#64748b",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "10px",
    height: "100vh", // Full height
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "4px",
    paddingBottom: "1px",
    borderBottom: "1px solid #e2e8f0",
    flexShrink: 0, // Prevent header from shrinking
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  headerSubtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: "0",
  },
  headerStats: {
    display: "flex",
    gap: "16px",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  contentCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    flex: 1, // Take remaining space
    display: "flex",
    flexDirection: "column",
    minHeight: 0, // Important for flexbox scrolling
  },
  filtersSection: {
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    flexShrink: 0, // Prevent shrinking
  },
  actionsSection: {
    padding: "10px",
    borderBottom: "1px solid #e2e8f0",
    flexShrink: 0, // Prevent shrinking
  },
  tableSection: {
    padding: "24px",
    flex: 1, // Take remaining space
    display: "flex",
    flexDirection: "column",
    minHeight: 0, // Important for flexbox scrolling
    overflow: "hidden", // Contain table scrolling
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
  },
  filterLabel: {
    fontWeight: "600",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "14px",
  },
  filterInput: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
  },
  clearButton: {
    padding: "10px 16px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  actionsGrid: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  secondaryButton: {
    padding: "12px 20px",
    backgroundColor: "#f8fafc",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexShrink: 0, // Prevent shrinking
  },
  resultsCount: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  tableContainer: {
    flex: 1, // Take remaining space
    overflow: "auto", // Enable scrolling for table
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px",
  },
  tableHeaderRow: {
    backgroundColor: "#f1f5f9",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  tableHeaderCell: {
    padding: "16px 12px",
    textAlign: "left",
    fontWeight: "600",
    color: "#374151",
    fontSize: "14px",
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  tableCell: {
    padding: "16px 12px",
    textAlign: "left",
    fontSize: "14px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  employeeCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px",
  },
  employeeName: {
    fontWeight: "600",
    color: "#1e293b",
  },
  employeeId: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  leaveType: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  durationBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  editButton: {
    padding: "6px 12px",
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  deleteButton: {
    padding: "6px 12px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  noDataCell: {
    padding: "40px 20px",
    textAlign: "center",
  },
  noData: {
    color: "#64748b",
  },
  noDataIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
};

// Apply scrollbar classes
setTimeout(() => {
  const mainContent = document.querySelector('[style*="mainContent"]');
  const tableContainer = document.querySelector('[style*="tableContainer"]');
  
  if (mainContent) {
    mainContent.classList.add('main-content-scroll');
  }
  if (tableContainer) {
    tableContainer.classList.add('table-container-scroll');
  }
}, 100);

export default EmployeeLeave;