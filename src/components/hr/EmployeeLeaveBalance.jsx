import React, { useEffect, useState, useCallback, useRef } from "react";
import { getEmployeeLeaveBalances } from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EmployeeLeaveBalance = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({
    current: 0,
    total: 0,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltering, setIsFiltering] = useState(false);
  const mainContentRef = useRef(null);

  // Function to get employee name from balance object (handles different field names)
  const getEmployeeName = (balance) => {
    // Try different possible field names
    if (balance.employee_name) return balance.employee_name;
    if (balance.employee?.name) return balance.employee.name;
    if (balance.employeeName) return balance.employeeName;
    if (balance.employee__name) return balance.employee__name;
    return "Unknown Employee";
  };

  // Function to fetch all pages of data

  const fetchAllBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📊 Fetching all leave balances (all pages)...");

      // Fetch ALL pages by passing true as the second parameter (allPages = true)
      const response = await getEmployeeLeaveBalances(null, true);

      console.log("📊 API Response:", response);
      console.log("📊 Total balances fetched:", response.data?.length || 0);

      let allBalances = [];

      if (response.data && Array.isArray(response.data)) {
        allBalances = response.data;
      } else if (response.data && response.data.results) {
        allBalances = response.data.results;
      } else if (Array.isArray(response)) {
        allBalances = response;
      } else if (response.results) {
        allBalances = response.results;
      }

      console.log(`✅ Processed ${allBalances.length} balances`);

      // Ensure each balance has an employee name
      const processedBalances = allBalances.map((balance) => ({
        ...balance,
        employee_name:
          balance.employee_name ||
          balance.employee?.name ||
          balance.employeeName ||
          "Unknown Employee",
        public_festival_holiday: Number(balance.public_festival_holiday) || 0,
        casual_leave: Number(balance.casual_leave) || 0,
        sick_leave: Number(balance.sick_leave) || 0,
        earned_leave: Number(balance.earned_leave) || 0,
        leave_balance: Number(balance.leave_balance) || 0,
      }));

      setBalances(processedBalances);
      setTotalItems(processedBalances.length);
      setTotalPages(Math.ceil(processedBalances.length / itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ Error fetching leave balances:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError(
        error.response?.data?.detail ||
          error.message ||
          "Failed to load leave balances. Please try again.",
      );
      setBalances([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setIsFiltering(false);
      setLoadingProgress({ current: 0, total: 0 });
    }
  };

  useEffect(() => {
    fetchAllBalances();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter balances based on search term
  const filteredBalances = balances.filter((balance) => {
    const employeeName = getEmployeeName(balance);
    return employeeName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Debug filtered balances
  useEffect(() => {
    console.log("🔍 Total balances:", balances.length);
    console.log("🔍 Filtered balances count:", filteredBalances.length);
    console.log("🔍 Current page:", currentPage);
    console.log("🔍 Items per page:", itemsPerPage);
  }, [filteredBalances.length, currentPage, itemsPerPage, balances.length]);

  // Update total pages when filtered balances change
  useEffect(() => {
    setTotalItems(filteredBalances.length);
    setTotalPages(Math.ceil(filteredBalances.length / itemsPerPage));
  }, [filteredBalances.length, itemsPerPage]);

  // Get current page data
  const getCurrentPageData = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBalances.slice(startIndex, endIndex);
  }, [filteredBalances, currentPage, itemsPerPage]);

  // Calculate totals for all filtered balances
  const totals = filteredBalances.reduce(
    (acc, balance) => ({
      public_festival_holiday:
        acc.public_festival_holiday + (balance.public_festival_holiday || 0),
      casual_leave: acc.casual_leave + (balance.casual_leave || 0),
      sick_leave: acc.sick_leave + (balance.sick_leave || 0),
      earned_leave: acc.earned_leave + (balance.earned_leave || 0),
      leave_balance: acc.leave_balance + (balance.leave_balance || 0),
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

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const handleItemsPerPageChange = useCallback((e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Pagination component
  const Pagination = useCallback(() => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={paginationContainerStyle}>
        <div style={paginationInfoStyle}>
          Showing{" "}
          {filteredBalances.length > 0
            ? (currentPage - 1) * itemsPerPage + 1
            : 0}{" "}
          to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
          records
          {isFiltering && <span style={filteringIndicatorStyle}> ⟳</span>}
        </div>

        <div style={paginationControlsStyle}>
          <div style={pageSizeSelectorStyle}>
            <span style={pageSizeLabelStyle}>Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={pageSizeSelectStyle}
            >
              {[25, 50, 100, 200, 500].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div style={paginationButtonsStyle}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={paginationButtonStyle}
            >
              ‹
            </button>

            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  style={paginationButtonStyle}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span style={paginationEllipsisStyle}>...</span>
                )}
              </>
            )}

            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                style={{
                  ...paginationButtonStyle,
                  ...(currentPage === number
                    ? paginationActiveButtonStyle
                    : {}),
                }}
              >
                {number}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span style={paginationEllipsisStyle}>...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  style={paginationButtonStyle}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={paginationButtonStyle}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    );
  }, [
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isFiltering,
    filteredBalances.length,
    handlePageChange,
    handleItemsPerPageChange,
  ]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>
          {loadingProgress.total > 0
            ? `Loading leave balances... (Page ${loadingProgress.current} of ${loadingProgress.total})`
            : "Loading leave balances..."}
        </div>
        {loadingProgress.total > 0 && (
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Sidebars />
        <div style={styles.mainContent}>
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>Error Loading Data</h2>
            <p style={styles.errorMessage}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={styles.retryButton}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPageData = getCurrentPageData();

  // Debug: Log what's being rendered
  console.log("🎨 Rendering with:", {
    totalBalances: balances.length,
    filteredCount: filteredBalances.length,
    currentPageDataLength: currentPageData.length,
    sampleData: currentPageData[0],
  });

  return (
    <div style={styles.container}>
      <Sidebars />
      <div ref={mainContentRef} style={styles.mainContent}>
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

        {/* Table Section */}
        <div style={styles.tableSection}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              Leave Balance Details{" "}
              {searchTerm && `(${filteredBalances.length} found)`}
            </h3>
            <div style={styles.tableActions}>
              <button
                onClick={() => console.log("Balances data:", balances)}
                style={styles.exportButton}
              >
                📊 Debug Data
              </button>
            </div>
          </div>

          {/* Scrollable Table Container */}
          <div style={styles.scrollableTableContainer}>
            {balances.length === 0 && !loading ? (
              <div style={styles.noData}>
                <div style={styles.noDataContent}>
                  <div style={styles.noDataIcon}>📊</div>
                  <div style={styles.noDataText}>
                    No leave balance records available.
                  </div>
                  <button
                    onClick={fetchAllBalances}
                    style={styles.clearSearchButton}
                  >
                    Retry Fetch
                  </button>
                </div>
              </div>
            ) : (
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
                  {currentPageData.length > 0 ? (
                    currentPageData.map((balance, index) => (
                      <tr key={balance.id || index} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.employeeCell}>
                            <div style={styles.avatar}>
                              {getEmployeeName(balance)
                                .charAt(0)
                                ?.toUpperCase() || "U"}
                            </div>
                            <div style={styles.employeeInfo}>
                              <div style={styles.employeeName}>
                                {getEmployeeName(balance)}
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
                              backgroundColor: getLeaveColor(
                                balance.sick_leave,
                              ),
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
            )}
          </div>

          {/* Pagination */}
          {filteredBalances.length > 0 && <Pagination />}
        </div>
      </div>

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

// [Keep all the existing styles unchanged...]
const paginationContainerStyle = {
  padding: "20px 24px",
  borderTop: "1px solid #f1f5f9",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  flexShrink: 0,
};

const paginationInfoStyle = {
  fontSize: "14px",
  color: "#4a5568",
  fontWeight: "500",
};

const paginationControlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
  flexWrap: "wrap",
};

const pageSizeSelectorStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const pageSizeLabelStyle = {
  fontSize: "14px",
  color: "#4a5568",
};

const pageSizeSelectStyle = {
  padding: "6px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
  outline: "none",
};

const paginationButtonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const paginationButtonStyle = {
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  backgroundColor: "white",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#4a5568",
  cursor: "pointer",
  transition: "all 0.2s ease",
  minWidth: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const paginationActiveButtonStyle = {
  backgroundColor: "#3b82f6",
  borderColor: "#3b82f6",
  color: "white",
};

const paginationEllipsisStyle = {
  padding: "8px 4px",
  color: "#6b7280",
  fontSize: "14px",
};

const filteringIndicatorStyle = {
  fontSize: "14px",
  color: "#4299e1",
  animation: "spin 1s linear infinite",
  display: "inline-block",
};

// Styles
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
    marginBottom: "12px",
  },
  progressBarContainer: {
    width: "300px",
    height: "8px",
    backgroundColor: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
    marginTop: "8px",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "12px",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "8px",
  },
  errorMessage: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "20px",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    overflowX: "auto",
    height: "100vh",
    width: "100%",
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
  scrollableTableContainer: {
    flex: 1,
    overflow: "auto",
    maxHeight: "calc(100vh - 550px)",
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
  tr: {
    transition: "background-color 0.2s ease",
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
};

export default EmployeeLeaveBalance;
