// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeLeaves,
  getEmployeeLeaveBalances,
  getTeamLeaves,
} from "../../../api/employeeApi";

const Dashboard = () => {
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
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

      // Get current user's leaves
      const leavesResponse = await getEmployeeLeaves();
      console.log("📋 My leaves API Response:", leavesResponse);

      // Handle leaves data - ensure it's an array
      let myLeavesData = [];
      if (Array.isArray(leavesResponse.data)) {
        myLeavesData = leavesResponse.data;
      } else if (
        leavesResponse.data &&
        Array.isArray(leavesResponse.data.results)
      ) {
        myLeavesData = leavesResponse.data.results;
      } else if (leavesResponse.data) {
        myLeavesData = [leavesResponse.data];
      }

      console.log("📊 My leaves count:", myLeavesData.length);

      // Get team leaves if user has team members (check if user has reporting_leader responsibilities)
      let teamLeavesData = [];
      const hasReportingResponsibilities = employeeInfo.reporting_leader || 
        employeeInfo.designation.toLowerCase().includes('manager') ||
        employeeInfo.designation.toLowerCase().includes('lead') ||
        employeeInfo.designation.toLowerCase().includes('head') ||
        employeeInfo.designation.toLowerCase().includes('director');

      if (hasReportingResponsibilities) {
        try {
          const teamLeavesResponse = await getTeamLeaves();
          console.log("👥 Team leaves API Response:", teamLeavesResponse);
          
          if (teamLeavesResponse.data && Array.isArray(teamLeavesResponse.data)) {
            teamLeavesData = teamLeavesResponse.data;
          } else if (teamLeavesResponse.data?.data && Array.isArray(teamLeavesResponse.data.data)) {
            teamLeavesData = teamLeavesResponse.data.data;
          }
          
          console.log("📊 Team leaves count:", teamLeavesData.length);
        } catch (teamError) {
          console.log("⚠️ Could not fetch team leaves:", teamError.message);
        }
      }

      // Sort leaves by date (newest first)
      myLeavesData.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || a.start_date || a.id);
        const dateB = new Date(b.created_at || b.date || b.start_date || b.id);
        return dateB - dateA;
      });

      teamLeavesData.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || a.start_date || a.id);
        const dateB = new Date(b.created_at || b.date || b.start_date || b.id);
        return dateB - dateA;
      });

      setMyLeaves(myLeavesData);
      setTeamLeaves(teamLeavesData);

      // Get leave balances
      const balancesResponse = await getEmployeeLeaveBalances();
      console.log("💰 Balances API Response:", balancesResponse);

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
  const handleViewTeamLeaves = (id) => navigate(`/team-leaves`);

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

  // Check if a leave belongs to the current user
  const isTeamLeave = (leave) => {
    if (!leave) return false;
    
    const currentEmployeeId = employeeInfo.employee_id;
    const currentEmployeeName = employeeInfo.name;
    
    // Check if this is the current user's own leave
    const isOwnLeave = 
        leave.employee_code === currentEmployeeId ||
        (leave.employee && leave.employee.employee_id === currentEmployeeId) ||
        (leave.employee_name && leave.employee_name === currentEmployeeName);
    
    // If it's not the user's own leave, it's a team leave
    return !isOwnLeave;
  };

  // Inline Styles
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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

  // Render Leave Item Component
  const LeaveItem = ({ leave, isTeamLeave = false }) => {
    const statusInfo = getStatusInfo(leave.status);
    const leaveEmployeeName = leave.employee_name || leave.employee?.name || "Unknown";

    return (
      <div
        onClick={() => leave.id && handleViewLeaveDetails(leave.id)}
        style={{
          ...styles.leaveItem,
          ...(leave.id ? styles.leaveItemHover : {}),
          backgroundColor: isTeamLeave ? "#f0f8ff" : "white",
          borderLeft: isTeamLeave ? "4px solid #1976d2" : "none",
        }}
        onMouseEnter={(e) => {
          if (leave.id)
            e.currentTarget.style.backgroundColor = isTeamLeave ? "#e3f2fd" : "#f8f9fa";
        }}
        onMouseLeave={(e) => {
          if (leave.id)
            e.currentTarget.style.backgroundColor = isTeamLeave ? "#f0f8ff" : "white";
        }}
      >
        <div style={styles.leaveHeader}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h4 style={styles.leaveType}>
              {formatLeaveType(leave.leave_type)}
              {isTeamLeave && (
                <span style={styles.teamLeaveBadge}>
                  Team Member
                </span>
              )}
            </h4>
          </div>
          <span style={statusInfo.style}>{statusInfo.text}</span>
        </div>

        <p style={styles.leaveDetails}>
          <strong>Employee:</strong> {leaveEmployeeName}
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

        {isTeamLeave && leave.reporting_leader && (
          <p style={styles.leaveDetails}>
            <strong>Reporting Leader:</strong> {leave.reporting_leader}
          </p>
        )}

        <p style={styles.debugInfo}>
          Leave ID: {leave.id} | Employee: {leaveEmployeeName} | 
          Type: {leave.leave_type} | Team Leave: {isTeamLeave ? "Yes" : "No"}
        </p>
      </div>
    );
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
                Employee ID: {employeeInfo.employee_id} | My Leaves: {myLeaves.length} | 
                Team Leaves: {teamLeaves.length} | Last refresh: {new Date().toLocaleTimeString()}
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

        {/* My Recent Leaves - ONLY show user's own leaves */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            My Recent Leave Requests {myLeaves.length > 0 && `(${myLeaves.length})`}
          </h3>

          {myLeaves.length === 0 ? (
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
              {myLeaves.slice(0, 5).map((leave, index) => (
                <LeaveItem key={leave.id || index} leave={leave} isTeamLeave={false} />
              ))}

              {myLeaves.length > 5 && (
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
                    View all {myLeaves.length} requests
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