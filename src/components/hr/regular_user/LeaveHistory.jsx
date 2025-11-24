// src/components/LeaveHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployeeLeaves } from "../../../api/employeeApi";

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    leaveType: "all",
    dateRange: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const employeeInfo = {
    employee_id: localStorage.getItem("employee_id") || "",
    name: localStorage.getItem("employee_name") || "",
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, filters, searchTerm]);

  // In LeaveHistory.jsx - Replace the fetchLeaveHistory function
  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Fetching leave history...");
      console.log("👤 Employee Info:", employeeInfo);

      const leavesResponse = await getEmployeeLeaves();

      console.log("📋 Raw leaves API Response:", leavesResponse);

      // Use the transformed data from API
      let leavesData = leavesResponse.data || [];

      console.log("📊 All leaves from backend:", leavesData.length);

      const employeeId = localStorage.getItem("employee_id");
      const employeeDbId = localStorage.getItem("employee_db_id");

      // Debug: Check each leave
      leavesData.forEach((leave, index) => {
        console.log(`🔍 Leave ${index}:`, {
          id: leave.id,
          employee: leave.employee,
          employee_name: leave.employee?.name,
          employee_code: leave.employee_code,
          matches:
            (leave.employee && leave.employee.employee_id === employeeId) ||
            leave.employee_code === employeeId ||
            (leave.employee &&
              leave.employee.id &&
              leave.employee.id.toString() === employeeDbId),
        });
      });

      // Use the SAME filtering logic as Dashboard
      const userLeaves = leavesData.filter((leave) => {
        let matches = false;

        // Strategy 1: Check if employee_code matches
        if (leave.employee_code === employeeId) {
          console.log(`✅ Leave ${leave.id} matched by employee_code`);
          matches = true;
        }

        // Strategy 2: Check if employee object has matching employee_id
        else if (leave.employee && leave.employee.employee_id === employeeId) {
          console.log(`✅ Leave ${leave.id} matched by employee.employee_id`);
          matches = true;
        }

        // Strategy 3: Check if employee object has matching database ID
        else if (
          leave.employee &&
          leave.employee.id &&
          leave.employee.id.toString() === employeeDbId
        ) {
          console.log(`✅ Leave ${leave.id} matched by employee.id`);
          matches = true;
        }

        // Strategy 4: Check if there's an employee_name that matches (fallback)
        else if (
          leave.employee_name &&
          leave.employee_name === employeeInfo.name
        ) {
          console.log(`✅ Leave ${leave.id} matched by employee_name`);
          matches = true;
        }

        // Strategy 5: Check if the raw employee field matches database ID
        else if (leave.employee && leave.employee.toString() === employeeDbId) {
          console.log(`✅ Leave ${leave.id} matched by raw employee field`);
          matches = true;
        }

        if (!matches) {
          console.log(`❌ Leave ${leave.id} didn't match any criteria:`, {
            leaveEmployeeCode: leave.employee_code,
            leaveEmployeeId: leave.employee?.employee_id,
            leaveEmployeeDbId: leave.employee?.id,
            leaveEmployeeName: leave.employee_name,
            rawEmployeeField: leave.employee,
            ourEmployeeId: employeeId,
            ourEmployeeDbId: employeeDbId,
            ourEmployeeName: employeeInfo.name,
          });
        }

        return matches;
      });

      console.log("👤 User's leaves after filtering:", userLeaves.length);
      console.log("✅ Final user leaves:", userLeaves);

      // Sort leaves by date (newest first)
      userLeaves.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || a.start_date || a.id);
        const dateB = new Date(b.created_at || b.date || b.start_date || b.id);
        return dateB - dateA;
      });

      setLeaves(userLeaves);
    } catch (err) {
      console.error("❌ Leave history error:", err);
      setError("Failed to load leave history. Please try again.");
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];

    // Apply status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (leave) => leave.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Apply leave type filter
    if (filters.leaveType !== "all") {
      filtered = filtered.filter(
        (leave) =>
          leave.leave_type?.toLowerCase() === filters.leaveType.toLowerCase()
      );
    }

    // Apply date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));

      filtered = filtered.filter((leave) => {
        const leaveDate = new Date(
          leave.created_at || leave.date || leave.start_date
        );

        switch (filters.dateRange) {
          case "last_30_days":
            return leaveDate >= thirtyDaysAgo;
          case "last_6_months":
            return leaveDate >= sixMonthsAgo;
          case "this_year":
            return leaveDate.getFullYear() === new Date().getFullYear();
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          leave.reason?.toLowerCase().includes(term) ||
          leave.leave_type?.toLowerCase().includes(term) ||
          leave.status?.toLowerCase().includes(term)
      );
    }

    setFilteredLeaves(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleViewLeaveDetails = (id) => {
    if (id) {
      navigate(`/leave-history`);
    }
  };

  const handleApplyLeave = () => navigate("/apply-leave");
  const handleBackToDashboard = () => navigate("/dashboard");

  // Format leave type for display
  const formatLeaveType = (leaveType) => {
    if (!leaveType) {
      return "Unknown Leave Type";
    }

    try {
      return leaveType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch (error) {
      return String(leaveType);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return String(dateString);
    }
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500",
    };

    if (!status) {
      return {
        style: {
          ...baseStyle,
          backgroundColor: "#e2e3e5",
          color: "#383d41",
        },
        text: "Unknown",
      };
    }

    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case "approved":
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#d4edda",
            color: "#155724",
          },
          text: "Approved",
        };
      case "rejected":
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#f8d7da",
            color: "#721c24",
          },
          text: "Rejected",
        };
      case "pending":
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#fff3cd",
            color: "#856404",
          },
          text: "Pending",
        };
      default:
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#e2e3e5",
            color: "#383d41",
          },
          text: status,
        };
    }
  };

  // Get unique leave types for filter dropdown
  const getUniqueLeaveTypes = () => {
    const types = [
      ...new Set(leaves.map((leave) => leave.leave_type).filter(Boolean)),
    ];
    return types.map((type) => ({
      value: type,
      label: formatLeaveType(type),
    }));
  };

  // Inline Styles
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px",
    },
    mainContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      padding: "24px",
      marginBottom: "24px",
      border: "1px solid #e9ecef",
    },
    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#2c3e50",
      margin: "0 0 8px 0",
    },
    subtitle: {
      fontSize: "16px",
      color: "#6c757d",
      margin: "0",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
    },
    primaryButton: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "12px 24px",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      minWidth: "140px",
    },
    secondaryButton: {
      backgroundColor: "#6c757d",
      color: "white",
      padding: "12px 24px",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      minWidth: "140px",
    },
    filtersCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      padding: "20px",
      marginBottom: "24px",
      border: "1px solid #e9ecef",
    },
    filtersTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "16px",
    },
    filtersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "16px",
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    filterLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#495057",
    },
    filterSelect: {
      padding: "8px 12px",
      border: "1px solid #ced4da",
      borderRadius: "4px",
      fontSize: "14px",
      backgroundColor: "white",
    },
    searchInput: {
      padding: "8px 12px",
      border: "1px solid #ced4da",
      borderRadius: "4px",
      fontSize: "14px",
      width: "100%",
    },
    resultsCount: {
      fontSize: "14px",
      color: "#6c757d",
      marginTop: "16px",
    },
    leavesCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      border: "1px solid #e9ecef",
    },
    leaveItem: {
      padding: "20px",
      borderBottom: "1px solid #f8f9fa",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      display: "block",
      width: "100%",
      boxSizing: "border-box",
    },
    leaveHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px",
    },
    leaveType: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#2c3e50",
      margin: "0",
    },
    leaveDetailsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "12px",
    },
    leaveDetail: {
      fontSize: "14px",
      color: "#6c757d",
      lineHeight: "1.4",
    },
    leaveReason: {
      fontSize: "14px",
      color: "#495057",
      margin: "12px 0 0 0",
      fontStyle: "italic",
      backgroundColor: "#f8f9fa",
      padding: "12px",
      borderRadius: "4px",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
    },
    emptyText: {
      fontSize: "16px",
      color: "#6c757d",
      marginBottom: "16px",
    },
    loadingSkeleton: {
      backgroundColor: "#e9ecef",
      borderRadius: "4px",
      marginBottom: "8px",
    },
    debugInfo: {
      fontSize: "12px",
      color: "#6c757d",
      backgroundColor: "#f8f9fa",
      padding: "8px",
      borderRadius: "4px",
      marginTop: "8px",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.mainContainer}>
          <div
            style={{
              ...styles.header,
              ...styles.loadingSkeleton,
              height: "100px",
            }}
          ></div>
          <div
            style={{
              ...styles.filtersCard,
              ...styles.loadingSkeleton,
              height: "120px",
            }}
          ></div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                ...styles.leavesCard,
                ...styles.loadingSkeleton,
                height: "150px",
                marginBottom: "16px",
              }}
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.mainContainer}>
          <div
            style={{
              ...styles.leavesCard,
              textAlign: "center",
              padding: "40px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ color: "#dc3545", marginBottom: "8px" }}>Error</h3>
            <p style={{ color: "#6c757d", marginBottom: "20px" }}>{error}</p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button onClick={fetchLeaveHistory} style={styles.primaryButton}>
                Try Again
              </button>
              <button
                onClick={handleBackToDashboard}
                style={styles.secondaryButton}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerText}>
              <h1 style={styles.title}>Leave History</h1>
              <p style={styles.subtitle}>
                View and manage your leave requests - {employeeInfo.name}
              </p>
              <p style={styles.debugInfo}>
                Employee ID: {employeeInfo.employee_id} | Total requests:{" "}
                {leaves.length} | Filtered: {filteredLeaves.length} | Last
                refresh: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div style={styles.buttonGroup}>
              <button
                onClick={handleBackToDashboard}
                style={styles.secondaryButton}
              >
                Back to Dashboard
              </button>
              <button onClick={handleApplyLeave} style={styles.primaryButton}>
                Apply for Leave
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filtersCard}>
          <h3 style={styles.filtersTitle}>Filter Leave Requests</h3>

          <div style={styles.filtersGrid}>
            {/* Status Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Leave Type Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Leave Type</label>
              <select
                value={filters.leaveType}
                onChange={(e) =>
                  handleFilterChange("leaveType", e.target.value)
                }
                style={styles.filterSelect}
              >
                <option value="all">All Types</option>
                {getUniqueLeaveTypes().map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  handleFilterChange("dateRange", e.target.value)
                }
                style={styles.filterSelect}
              >
                <option value="all">All Time</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            {/* Search Filter */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Search</label>
              <input
                type="text"
                placeholder="Search by reason, type, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={styles.resultsCount}>
            Showing {filteredLeaves.length} of {leaves.length} leave requests
          </div>
        </div>

        {/* Leave Requests List */}
        <div style={styles.leavesCard}>
          {filteredLeaves.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                {leaves.length === 0
                  ? "No leave requests found."
                  : "No leave requests match your current filters."}
              </p>
              <p style={{ ...styles.emptyText, fontSize: "14px" }}>
                {leaves.length === 0
                  ? "Your leave requests will appear here after you apply for leave."
                  : "Try adjusting your filters to see more results."}
              </p>
              {leaves.length === 0 && (
                <button onClick={handleApplyLeave} style={styles.primaryButton}>
                  Apply for Leave
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredLeaves.map((leave, index) => {
                const statusInfo = getStatusInfo(leave.status);

                return (
                  <div
                    key={leave.id || index}
                    onClick={() => leave.id && handleViewLeaveDetails(leave.id)}
                    style={styles.leaveItem}
                    onMouseEnter={(e) => {
                      if (leave.id)
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      if (leave.id)
                        e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    <div style={styles.leaveHeader}>
                      <h4 style={styles.leaveType}>
                        {formatLeaveType(leave.leave_type)}
                      </h4>
                      <span style={statusInfo.style}>{statusInfo.text}</span>
                    </div>

                    <div style={styles.leaveDetailsGrid}>
                      <div style={styles.leaveDetail}>
                        <strong>Apply Date:</strong>{" "}
                        {formatDate(leave.date || leave.created_at)}
                      </div>

                      <div style={styles.leaveDetail}>
                        <strong>Leave Period:</strong>{" "}
                        {formatDate(leave.start_date)} to{" "}
                        {formatDate(leave.end_date)}
                      </div>

                      <div style={styles.leaveDetail}>
                        <strong>Duration:</strong> {leave.leave_days || "N/A"}{" "}
                        day(s)
                      </div>

                      <div style={styles.leaveDetail}>
                        <strong>Applied On:</strong>{" "}
                        {formatDate(leave.created_at)}
                      </div>
                    </div>

                    {leave.reason && (
                      <p style={styles.leaveReason}>
                        <strong>Reason:</strong> {leave.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
