import React, { useEffect, useState } from "react";
import { getEmployeeLeaveBalances } from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EmployeeLeaveBalance = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getEmployeeLeaveBalances();
        setBalances(response.data);
      } catch (error) {
        console.error("Error fetching leave balances:", error);
        alert("Failed to load leave balances. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter balances based on search term
  const filteredBalances = balances.filter((balance) =>
    balance.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate totals
  const totals = filteredBalances.reduce(
    (acc, balance) => ({
      public_festival_holiday:
        acc.public_festival_holiday +
        (parseInt(balance.public_festival_holiday) || 0),
      casual_leave: acc.casual_leave + (parseInt(balance.casual_leave) || 0),
      sick_leave: acc.sick_leave + (parseInt(balance.sick_leave) || 0),
      earned_leave: acc.earned_leave + (parseInt(balance.earned_leave) || 0),
      leave_balance: acc.leave_balance + (parseInt(balance.leave_balance) || 0),
    }),
    {
      public_festival_holiday: 0,
      casual_leave: 0,
      sick_leave: 0,
      earned_leave: 0,
      leave_balance: 0,
    },
  );

  const getLeaveColor = (days, type) => {
    const dayCount = parseInt(days) || 0;

    if (type === "total") {
      if (dayCount >= 30) return "#10b981";
      if (dayCount >= 15) return "#f59e0b";
      return "#ef4444";
    }

    if (dayCount >= 10) return "#10b981";
    if (dayCount >= 5) return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Loading leave balances...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Employee Leave Balances</h1>
            <p style={styles.subtitle}>
              Overview of all employee leave allocations and remaining balances
            </p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{balances.length}</div>
              <div style={styles.statLabel}>Total Employees</div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div style={styles.controls}>
          <div style={styles.searchContainer}>
            <div style={styles.searchIcon}>🔍</div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={styles.clearSearch}
              >
                ✕
              </button>
            )}
          </div>

          <div style={styles.summaryCards}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>🎉</div>
              <div>
                <div style={styles.summaryNumber}>
                  {totals.public_festival_holiday}
                </div>
                <div style={styles.summaryLabel}>Festival Holidays</div>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>😊</div>
              <div>
                <div style={styles.summaryNumber}>{totals.casual_leave}</div>
                <div style={styles.summaryLabel}>Casual Leaves</div>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>🏥</div>
              <div>
                <div style={styles.summaryNumber}>{totals.sick_leave}</div>
                <div style={styles.summaryLabel}>Sick Leaves</div>
              </div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>⭐</div>
              <div>
                <div style={styles.summaryNumber}>{totals.earned_leave}</div>
                <div style={styles.summaryLabel}>Earned Leaves</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section with Scroll */}
        <div style={styles.tableSection}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              Leave Balance Details{" "}
              {searchTerm && `(${filteredBalances.length} found)`}
            </h3>
            <div style={styles.tableActions}>
              <button style={styles.exportButton}>📊 Export Report</button>
            </div>
          </div>

          {/* Scrollable Table Container */}
          <div style={styles.scrollableTableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>
                    <div style={styles.leaveHeader}>
                      <span>🎉</span>
                      <span>Festival</span>
                    </div>
                  </th>
                  <th style={styles.th}>
                    <div style={styles.leaveHeader}>
                      <span>😊</span>
                      <span>Casual</span>
                    </div>
                  </th>
                  <th style={styles.th}>
                    <div style={styles.leaveHeader}>
                      <span>🏥</span>
                      <span>Sick</span>
                    </div>
                  </th>
                  <th style={styles.th}>
                    <div style={styles.leaveHeader}>
                      <span>⭐</span>
                      <span>Earned</span>
                    </div>
                  </th>
                  <th style={styles.th}>
                    <div style={styles.leaveHeader}>
                      <span>📊</span>
                      <span>Total</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody style={styles.tableBody}>
                {filteredBalances.length > 0 ? (
                  filteredBalances.map((balance, index) => (
                    <tr key={balance.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.employeeCell}>
                          <div style={styles.avatar}>
                            {balance.employee_name?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </div>
                          <div style={styles.employeeInfo}>
                            <div style={styles.employeeName}>
                              {balance.employee_name || "Unknown Employee"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.leaveBadge,
                            backgroundColor: getLeaveColor(
                              balance.public_festival_holiday,
                            ),
                          }}
                        >
                          {balance.public_festival_holiday || 0}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.leaveBadge,
                            backgroundColor: getLeaveColor(
                              balance.casual_leave,
                            ),
                          }}
                        >
                          {balance.casual_leave || 0}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.leaveBadge,
                            backgroundColor: getLeaveColor(balance.sick_leave),
                          }}
                        >
                          {balance.sick_leave || 0}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.leaveBadge,
                            backgroundColor: getLeaveColor(
                              balance.earned_leave,
                            ),
                          }}
                        >
                          {balance.earned_leave || 0}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div
                          style={{
                            ...styles.totalBadge,
                            backgroundColor: getLeaveColor(
                              balance.leave_balance,
                              "total",
                            ),
                          }}
                        >
                          {balance.leave_balance || 0}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={styles.noData}>
                      <div style={styles.noDataContent}>
                        <div style={styles.noDataIcon}>📊</div>
                        <div style={styles.noDataText}>
                          {searchTerm
                            ? "No employees found matching your search."
                            : "No leave balance records available."}
                        </div>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            style={styles.clearSearchButton}
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          {filteredBalances.length > 0 && (
            <div style={styles.footerSummary}>
              <div style={styles.footerText}>
                Showing {filteredBalances.length} of {balances.length} employees
              </div>
              <div style={styles.footerTotals}>
                <div style={styles.footerTotalItem}>
                  <span>Total Leaves:</span>
                  <strong>{totals.leave_balance}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS styles for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .scrollable-table-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scrollable-table-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .scrollable-table-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .scrollable-table-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f8fafc",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderLeft: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "20px",
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: "0",
  },
  headerStats: {
    display: "flex",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    minWidth: "120px",
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    marginBottom: "32px",
    flexShrink: 0,
  },
  searchContainer: {
    position: "relative",
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#64748b",
  },
  searchInput: {
    width: "100%",
    padding: "12px 40px 12px 40px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "16px",
    backgroundColor: "white",
    transition: "all 0.2s ease",
    outline: "none",
  },
  searchInputFocus: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
  },
  clearSearch: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#64748b",
    cursor: "pointer",
    padding: "4px",
  },
  summaryCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  summaryCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  summaryCardHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  summaryIcon: {
    fontSize: "24px",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: "8px",
  },
  summaryNumber: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "4px",
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  tableSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: "0",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  tableTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  tableActions: {
    display: "flex",
    gap: "12px",
  },
  exportButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background-color 0.2s ease",
  },
  exportButtonHover: {
    backgroundColor: "#2563eb",
  },
  // Scrollable table container with custom scrollbar
  scrollableTableContainer: {
    flex: 1,
    overflow: "auto",
    maxHeight: "calc(100vh - 550px)",
    // Custom scrollbar styles
    scrollbarWidth: "thin",
    scrollbarColor: "#cbd5e1 #f1f5f9",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },
  tableHead: {
    position: "sticky",
    top: 0,
    backgroundColor: "#f8fafc",
    zIndex: 10,
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
    position: "sticky",
    top: 0,
  },
  leaveHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tableBody: {
    // Table body styles
  },
  tr: {
    transition: "background-color 0.2s ease",
  },
  trHover: {
    backgroundColor: "#f8fafc",
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid #f1f5f9",
  },
  employeeCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "600",
    fontSize: "14px",
  },
  employeeInfo: {
    display: "flex",
    flexDirection: "column",
  },
  employeeName: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "14px",
  },
  leaveBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    color: "white",
    fontWeight: "600",
    fontSize: "12px",
    textAlign: "center",
    minWidth: "40px",
  },
  totalBadge: {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "20px",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    textAlign: "center",
    minWidth: "50px",
  },
  noData: {
    padding: "60px 20px",
    textAlign: "center",
  },
  noDataContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  noDataIcon: {
    fontSize: "48px",
    opacity: "0.5",
  },
  noDataText: {
    fontSize: "16px",
    color: "#64748b",
    fontWeight: "500",
  },
  clearSearchButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  footerSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  footerText: {
    fontSize: "14px",
    color: "#64748b",
  },
  footerTotals: {
    display: "flex",
    gap: "20px",
  },
  footerTotalItem: {
    display: "flex",
    gap: "8px",
    fontSize: "14px",
    color: "#475569",
  },
};

export default EmployeeLeaveBalance;
