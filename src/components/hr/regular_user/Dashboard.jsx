// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeLeaves,
  getEmployeeLeaveBalances,
} from "../../../api/employeeApi";

const Dashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const employeeInfo = {
    employee_id: localStorage.getItem("employee_id") || "",
    name: localStorage.getItem("employee_name") || "",
    designation: localStorage.getItem("designation") || "",
    department: localStorage.getItem("department") || "",
    email: localStorage.getItem("email") || "",
    reporting_leader: localStorage.getItem("reporting_leader") || "",
  };

  useEffect(() => {
    const mode = localStorage.getItem("mode");
    const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

    if (
      !permissions.full_access &&
      window.location.pathname.includes("/hr-work")
    ) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (mode === "full_access" || permissions.full_access) {
      navigate("/hr-work", { replace: true });
      return;
    }
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Fetching dashboard data...");
      console.log("👤 Employee ID:", employeeInfo.employee_id);
      console.log("👤 Employee DB ID:", localStorage.getItem("employee_db_id"));
      console.log("👤 Employee Name:", employeeInfo.name);
      console.log("👤 Reporting Leader:", employeeInfo.reporting_leader);

      const [leavesResponse, balancesResponse] = await Promise.all([
        getEmployeeLeaves(),
        getEmployeeLeaveBalances(),
      ]);

      console.log("📋 Leaves API Response:", leavesResponse);
      console.log("💰 Balances API Response:", balancesResponse);

      // Handle leaves data - ensure it's an array
      let leavesData = [];
      if (Array.isArray(leavesResponse.data)) {
        leavesData = leavesResponse.data;
      } else if (
        leavesResponse.data &&
        Array.isArray(leavesResponse.data.results)
      ) {
        leavesData = leavesResponse.data.results;
      } else if (leavesResponse.data) {
        // If it's a single object, wrap it in an array
        leavesData = [leavesResponse.data];
      }

      console.log("📊 All leaves from API:", leavesData);

      // Get current user's employee details for filtering
      const currentEmployeeId = employeeInfo.employee_id;
      const currentEmployeeDbId = localStorage.getItem("employee_db_id");

      console.log("🔍 Current user info:", {
        currentEmployeeId,
        currentEmployeeDbId,
        currentEmployeeName: employeeInfo.name,
      });

      // DEBUG: Log each leave to see its structure
      leavesData.forEach((leave, index) => {
        console.log(`🔍 Leave ${index} (ID: ${leave.id}):`, {
          employee: leave.employee,
          employee_code: leave.employee_code,
          employee_name: leave.employee_name,
          reporting_leader: leave.reporting_leader,
          employee_object: leave.employee
            ? {
                id: leave.employee.id,
                employee_id: leave.employee.employee_id,
                name: leave.employee.name,
              }
            : "No employee object",
        });
      });

      // ENHANCED FILTERING - Include team leaves for reporting leaders
      const employeeLeaves = leavesData.filter((leave) => {
        let matches = false;

        // Strategy 1: Check if employee_code matches
        if (leave.employee_code === currentEmployeeId) {
          console.log(`✅ Leave ${leave.id} matched by employee_code`);
          matches = true;
        }

        // Strategy 2: Check if employee object has matching employee_id
        else if (
          leave.employee &&
          leave.employee.employee_id === currentEmployeeId
        ) {
          console.log(`✅ Leave ${leave.id} matched by employee.employee_id`);
          matches = true;
        }

        // Strategy 3: Check if employee object has matching database ID
        else if (
          leave.employee &&
          leave.employee.id &&
          leave.employee.id.toString() === currentEmployeeDbId
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
        else if (
          leave.employee &&
          leave.employee.toString() === currentEmployeeDbId
        ) {
          console.log(`✅ Leave ${leave.id} matched by raw employee field`);
          matches = true;
        }

        // NEW Strategy 6: Check if current user is the reporting leader for this leave
        else if (
          leave.reporting_leader &&
          (leave.reporting_leader.includes(employeeInfo.name) ||
           leave.reporting_leader.includes(currentEmployeeId) ||
           (employeeInfo.reporting_leader && leave.reporting_leader.includes(employeeInfo.reporting_leader)))
        ) {
          console.log(`✅ Leave ${leave.id} matched by reporting_leader: ${leave.reporting_leader}`);
          matches = true;
        }

        if (!matches) {
          console.log(`❌ Leave ${leave.id} didn't match any criteria:`, {
            leaveEmployeeCode: leave.employee_code,
            leaveEmployeeId: leave.employee?.employee_id,
            leaveEmployeeDbId: leave.employee?.id,
            leaveEmployeeName: leave.employee_name,
            leaveReportingLeader: leave.reporting_leader,
            rawEmployeeField: leave.employee,
            ourEmployeeId: currentEmployeeId,
            ourEmployeeDbId: currentEmployeeDbId,
            ourEmployeeName: employeeInfo.name,
            ourReportingLeader: employeeInfo.reporting_leader,
          });
        }

        return matches;
      });

      console.log("👤 Final filtered leaves:", employeeLeaves);

      // Sort leaves by date (newest first)
      employeeLeaves.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || a.start_date || a.id);
        const dateB = new Date(b.created_at || b.date || b.start_date || b.id);
        return dateB - dateA;
      });

      setLeaves(employeeLeaves);

      // Handle leave balances
      if (balancesResponse.data && Array.isArray(balancesResponse.data)) {
        const userBalance = balancesResponse.data.find(
          (b) =>
            b.employee_code === employeeInfo.employee_id ||
            b.employee === employeeInfo.employee_id ||
            (b.employee && b.employee.employee_id === employeeInfo.employee_id)
        );
        console.log("🎯 Found user balance:", userBalance);
        setLeaveBalances(userBalance || {});
      } else if (balancesResponse.data) {
        console.log("🎯 Single balance object:", balancesResponse.data);
        setLeaveBalances(balancesResponse.data || {});
      } else {
        console.log("❌ No balance data found");
        setLeaveBalances({});
      }
    } catch (err) {
      console.error("❌ Dashboard error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = () => navigate("/apply-leave");
  const handleViewLeaveDetails = (id) => navigate(`/leave-history`);

  // Format leave type for display
  const formatLeaveType = (leaveType) => {
    if (!leaveType) return "Unknown Leave Type";
    return leaveType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    const baseStyle = {
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500",
    };

    switch (status?.toLowerCase()) {
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
          text: "Unknown",
        };
    }
  };

  // Check if a leave belongs to the current user or is a team leave
  const isTeamLeave = (leave) => {
    if (!leave) return false;
    
    const currentEmployeeId = employeeInfo.employee_id;
    const currentEmployeeName = employeeInfo.name;
    
    // Check if this is NOT the current user's own leave
    const isOwnLeave = 
        leave.employee_code === currentEmployeeId ||
        (leave.employee && leave.employee.employee_id === currentEmployeeId) ||
        (leave.employee_name && leave.employee_name === currentEmployeeName);
    
    // Check if the current user is the reporting leader for this leave
    const isUserReportingLeader = 
        leave.reporting_leader && 
        (leave.reporting_leader.includes(currentEmployeeName) ||
         leave.reporting_leader.includes(currentEmployeeId));
    
    // It's a team leave if it's NOT the user's own leave AND user is the reporting leader
    return !isOwnLeave && isUserReportingLeader;
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
    applyButton: {
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
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      padding: "20px",
      border: "1px solid #e9ecef",
    },
    cardTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "16px",
    },
    infoItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid #f8f9fa",
    },
    infoLabel: {
      fontSize: "14px",
      color: "#6c757d",
      textTransform: "capitalize",
    },
    infoValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#2c3e50",
    },
    balanceItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px",
      backgroundColor: "#f8f9fa",
      borderRadius: "4px",
      marginBottom: "8px",
    },
    balanceLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#495057",
    },
    balanceValue: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#007bff",
    },
    actionButton: {
      width: "100%",
      padding: "12px",
      border: "none",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      marginBottom: "8px",
    },
    leaveItem: {
      padding: "16px",
      borderBottom: "1px solid #f8f9fa",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    leaveItemHover: {
      backgroundColor: "#f8f9fa",
    },
    leaveHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "8px",
    },
    leaveType: {
      fontSize: "16px",
      fontWeight: "500",
      color: "#2c3e50",
      margin: "0",
    },
    leaveDetails: {
      fontSize: "14px",
      color: "#6c757d",
      margin: "4px 0",
    },
    leaveReason: {
      fontSize: "14px",
      color: "#495057",
      margin: "8px 0 0 0",
      fontStyle: "italic",
    },
    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
    },
    emptyText: {
      fontSize: "16px",
      color: "#6c757d",
      marginBottom: "16px",
    },
    viewAllButton: {
      textAlign: "center",
      padding: "16px",
      backgroundColor: "#f8f9fa",
      borderBottomLeftRadius: "8px",
      borderBottomRightRadius: "8px",
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
    teamLeaveBadge: {
      backgroundColor: "#e3f2fd",
      color: "#1976d2",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "10px",
      fontWeight: "500",
      marginLeft: "8px",
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
          <div style={styles.grid}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  ...styles.card,
                  ...styles.loadingSkeleton,
                  height: "200px",
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.mainContainer}>
          <div style={{ ...styles.card, textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ color: "#dc3545", marginBottom: "8px" }}>Error</h3>
            <p style={{ color: "#6c757d", marginBottom: "20px" }}>{error}</p>
            <button onClick={fetchDashboardData} style={styles.applyButton}>
              Try Again
            </button>
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
              <h1 style={styles.title}>Leave Dashboard</h1>
              <p style={styles.subtitle}>Welcome back, {employeeInfo.name}</p>
              {employeeInfo.reporting_leader && (
                <p style={{ ...styles.subtitle, fontSize: "14px" }}>
                  Reporting to: <strong>{employeeInfo.reporting_leader}</strong>
                </p>
              )}
              <p style={styles.debugInfo}>
                Employee ID: {employeeInfo.employee_id} | Found {leaves.length}{" "}
                leave requests | Last refresh: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <button onClick={handleApplyLeave} style={styles.applyButton}>
              Apply for Leave
            </button>
          </div>
        </div>

        <div style={styles.grid}>
          {/* Employee Info */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Employee Information</h3>
            <div>
              {Object.entries(employeeInfo).map(([key, value]) => (
                <div key={key} style={styles.infoItem}>
                  <span style={styles.infoLabel}>{key.replace(/_/g, " ")}</span>
                  <span style={styles.infoValue}>{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Balances */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Leave Balances</h3>
            <div>
              {[
                { type: "casual_leave", label: "Casual Leave" },
                { type: "sick_leave", label: "Sick Leave" },
                { type: "earned_leave", label: "Earned Leave" },
                { type: "public_festival_holiday", label: "Public Holiday" },
              ].map(({ type, label }) => (
                <div key={type} style={styles.balanceItem}>
                  <span style={styles.balanceLabel}>{label}</span>
                  <span style={styles.balanceValue}>
                    {leaveBalances[type] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Quick Actions</h3>
            <div>
              <button
                onClick={handleApplyLeave}
                style={{
                  ...styles.actionButton,
                  backgroundColor: "#007bff",
                  color: "white",
                }}
              >
                Apply Leave
              </button>
              <button
                onClick={() => navigate("/leave-history")}
                style={{
                  ...styles.actionButton,
                  backgroundColor: "#6c757d",
                  color: "white",
                }}
              >
                Leave History
              </button>
              <button
                onClick={fetchDashboardData}
                style={{
                  ...styles.actionButton,
                  backgroundColor: "#28a745",
                  color: "white",
                }}
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Recent Leaves */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Recent Leave Requests {leaves.length > 0 && `(${leaves.length})`}
          </h3>

          {leaves.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No leave requests found.</p>
              <p style={{ ...styles.emptyText, fontSize: "14px" }}>
                Apply for your first leave to see it here.
              </p>
              <button
                onClick={handleApplyLeave}
                style={{ ...styles.applyButton, backgroundColor: "#28a745" }}
              >
                Apply Your First Leave
              </button>
            </div>
          ) : (
            <div>
              {leaves.slice(0, 5).map((leave, index) => {
                const statusInfo = getStatusInfo(leave.status);
                const teamLeave = isTeamLeave(leave);

                return (
                  <div
                    key={leave.id || index}
                    onClick={() => leave.id && handleViewLeaveDetails(leave.id)}
                    style={{
                      ...styles.leaveItem,
                      ...(leave.id ? styles.leaveItemHover : {}),
                      backgroundColor: teamLeave ? "#f0f8ff" : "white",
                      borderLeft: teamLeave ? "4px solid #1976d2" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (leave.id)
                        e.currentTarget.style.backgroundColor = teamLeave ? "#e3f2fd" : "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      if (leave.id)
                        e.currentTarget.style.backgroundColor = teamLeave ? "#f0f8ff" : "white";
                    }}
                  >
                    <div style={styles.leaveHeader}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <h4 style={styles.leaveType}>
                          {formatLeaveType(leave.leave_type)}
                          {teamLeave && (
                            <span style={styles.teamLeaveBadge}>
                              Team Member Leave
                            </span>
                          )}
                        </h4>
                      </div>
                      <span style={statusInfo.style}>{statusInfo.text}</span>
                    </div>

                    <p style={styles.leaveDetails}>
                      <strong>Employee:</strong> {leave.employee_name || leave.employee?.name || "Unknown"}
                    </p>

                    <p style={styles.leaveDetails}>
                      <strong>Apply Date:</strong>{" "}
                      {formatDate(leave.date || leave.created_at)}
                    </p>

                    <p style={styles.leaveDetails}>
                      <strong>Leave Period:</strong>{" "}
                      {formatDate(leave.start_date)} to{" "}
                      {formatDate(leave.end_date)}
                    </p>

                    <p style={styles.leaveDetails}>
                      <strong>Duration:</strong> {leave.leave_days || "N/A"}{" "}
                      day(s)
                    </p>

                    {leave.reason && (
                      <p style={styles.leaveReason}>
                        <strong>Reason:</strong> {leave.reason}
                      </p>
                    )}

                    {teamLeave && leave.reporting_leader && (
                      <p style={styles.leaveDetails}>
                        <strong>Reporting Leader:</strong> {leave.reporting_leader}
                      </p>
                    )}

                    {/* Debug information */}
                    <p style={styles.debugInfo}>
                      Leave ID: {leave.id} | Applied:{" "}
                      {formatDate(leave.created_at || leave.date)} | Type:{" "}
                      {leave.leave_type} | Team Leave: {teamLeave ? "Yes" : "No"}
                    </p>
                  </div>
                );
              })}

              {leaves.length > 5 && (
                <div style={styles.viewAllButton}>
                  <button
                    onClick={() => navigate("/leave-history")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    View all {leaves.length} requests
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;