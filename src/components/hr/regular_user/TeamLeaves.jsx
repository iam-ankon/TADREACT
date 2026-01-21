
// src/components/hr/regular_user/TeamLeaves.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeLeaves,
  updateEmployeeLeave,
  hrmsApi, // ADD THIS IMPORT
  getTeamLeaves, // ADD THIS IMPORT
  addTeamLeaderComment
} from "../../../api/employeeApi";
// Remove Sidebar import since it's already in the main layout
// import Sidebar from "../Sidebar";

const TeamLeaves = () => {
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  const employeeInfo = {
    employee_id: localStorage.getItem("employee_id") || "",
    name: localStorage.getItem("employee_name") || "",
    designation: localStorage.getItem("designation") || "",
    department: localStorage.getItem("department") || "",
    reporting_leader: localStorage.getItem("reporting_leader") || "",
  };

  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  const fetchTeamLeaves = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching team leaves for:", employeeInfo.name);

      // Try the new endpoint first
      const response = await getTeamLeaves();

      // Check the response structure
      if (response.data && Array.isArray(response.data)) {
        // If it returns a direct array (legacy format)
        console.log("📋 All leaves response (legacy format):", response.data);

        // Filter leaves where current user is the reporting leader
        const filteredLeaves = response.data.filter((leave) =>
          isTeamLeave(leave)
        );
        console.log("👥 Team leaves found (filtered):", filteredLeaves.length);
        setTeamLeaves(filteredLeaves);
      } else if (response.data && response.data.data) {
        // New endpoint format with nested data
        console.log("📋 Team leaves response (new format):", response.data);
        const teamLeavesData = response.data.data || [];
        console.log("👥 Team leaves found (direct):", teamLeavesData.length);
        setTeamLeaves(teamLeavesData);
      } else {
        console.log("⚠️ Unexpected response format:", response.data);
        setTeamLeaves([]);
      }
    } catch (error) {
      console.error("❌ Error fetching team leaves:", error);
      // Fallback to using getEmployeeLeaves
      try {
        console.log("🔄 Falling back to getEmployeeLeaves...");
        const allLeavesResponse = await getEmployeeLeaves();
        console.log(
          "📋 All leaves response (fallback):",
          allLeavesResponse.data
        );

        const filteredLeaves = allLeavesResponse.data.filter((leave) =>
          isTeamLeave(leave)
        );
        console.log(
          "👥 Team leaves found (fallback filtered):",
          filteredLeaves.length
        );
        setTeamLeaves(filteredLeaves);
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        setTeamLeaves([]);
      }
    } finally {
      setLoading(false);
    }
  };
  // Simplify since API handles filtering
  const isTeamLeave = (leave) => {
    if (!leave) return false;

    // For fallback mode only - simplified version
    const currentEmployeeId = employeeInfo.employee_id;
    const currentEmployeeName = employeeInfo.name;

    // Skip own leaves
    const isOwnLeave =
      leave.employee_code === currentEmployeeId ||
      (leave.employee && leave.employee.employee_id === currentEmployeeId) ||
      leave.employee_name === currentEmployeeName;

    if (isOwnLeave) return false;

    // Check if current user is the reporting leader
    const reportingLeader = leave.reporting_leader || "";

    if (!reportingLeader) return false;

    const leaderLower = reportingLeader.toLowerCase();
    const userNameLower = currentEmployeeName.toLowerCase();
    const userIdLower = currentEmployeeId.toLowerCase();

    // Simple matching - if current user's name or ID appears in reporting_leader
    return (
      leaderLower.includes(userNameLower) ||
      userNameLower.includes(leaderLower) ||
      leaderLower.includes(userIdLower)
    );
  };

  // Call this in useEffect to debug:
  useEffect(() => {
    fetchTeamLeaves();
  }, []);

  const formatLeaveType = (leaveType) => {
    if (!leaveType) return "Unknown Leave Type";
    return leaveType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusInfo = (status) => {
    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
    };

    switch (status?.toLowerCase()) {
      case "approved":
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
          },
          text: "Approved",
        };
      case "rejected":
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
          },
          text: "Rejected",
        };
      case "pending":
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#fff3cd",
            color: "#856404",
            border: "1px solid #ffeaa7",
          },
          text: "Pending Review",
        };
      default:
        return {
          style: {
            ...baseStyle,
            backgroundColor: "#e2e3e5",
            color: "#383d41",
            border: "1px solid #d6d8db",
          },
          text: "Unknown",
        };
    }
  };

  const handleAddComment = (leave) => {
    setSelectedLeave(leave);
    setComment(leave.teamleader || "");
  };

  const handleSubmitComment = async () => {
    if (!selectedLeave || !comment.trim()) return;

    try {
      setUpdating(true);
      console.log(
        "💬 Submitting team leader comment for leave:",
        selectedLeave.id
      );
      console.log("📝 Selected leave:", {
        id: selectedLeave.id,
        employee_name: selectedLeave.employee_name,
        reporting_leader: selectedLeave.reporting_leader,
        current_user: employeeInfo.name,
      });

      // Use the new team leader comment endpoint
      const response = await addTeamLeaderComment(
        selectedLeave.id,
        comment.trim()
      );
      console.log("✅ Comment added successfully:", response.data);

      // Update local state
      setTeamLeaves((prev) =>
        prev.map((leave) =>
          leave.id === selectedLeave.id
            ? { ...leave, teamleader: comment.trim() }
            : leave
        )
      );

      alert("✅ Comment added successfully!");
      setSelectedLeave(null);
      setComment("");
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      console.error("Error details:", error.response?.data);

      if (error.response?.status === 403) {
        alert(
          "❌ You are not authorized to comment on this leave. You must be the reporting leader."
        );
      } else if (error.response?.status === 404) {
        alert("❌ Leave not found. Please refresh the page and try again.");
      } else {
        alert("❌ Failed to add comment. Please try again.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (leaveId, newStatus) => {
    try {
      setUpdating(true);
      console.log("🔄 Updating status for leave:", leaveId, "to:", newStatus);

      const updateData = {
        status: newStatus,
        teamleader:
          teamLeaves.find((leave) => leave.id === leaveId)?.teamleader || "",
      };

      await updateEmployeeLeave(leaveId, updateData);

      // Update local state
      setTeamLeaves((prev) =>
        prev.map((leave) =>
          leave.id === leaveId ? { ...leave, status: newStatus } : leave
        )
      );

      alert(`Leave request ${newStatus} successfully!`);
    } catch (error) {
      console.error("❌ Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "50px",
    },
    mainContent: {
      flex: 1,
      padding: "24px",
      overflow: "auto",
      marginLeft: "0", // Remove sidebar margin since Sidebar is in main layout
      transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    header: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "24px",
      marginBottom: "24px",
      border: "1px solid #e9ecef",
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1e293b",
      margin: "0 0 8px 0",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    subtitle: {
      fontSize: "16px",
      color: "#64748b",
      margin: "0",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      padding: "24px",
      marginBottom: "20px",
      border: "1px solid #e9ecef",
    },
    leaveCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      padding: "20px",
      marginBottom: "16px",
      border: "1px solid #e2e8f0",
      transition: "all 0.2s ease",
    },
    leaveHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
    },
    employeeInfo: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "12px",
    },
    avatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "600",
      fontSize: "16px",
    },
    leaveDetails: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
      marginBottom: "16px",
    },
    detailItem: {
      display: "flex",
      flexDirection: "column",
    },
    detailLabel: {
      fontSize: "12px",
      color: "#64748b",
      fontWeight: "500",
      marginBottom: "4px",
    },
    detailValue: {
      fontSize: "14px",
      color: "#1e293b",
      fontWeight: "500",
    },
    reasonBox: {
      backgroundColor: "#f8fafc",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "16px",
      border: "1px solid #e2e8f0",
    },
    actionButtons: {
      display: "flex",
      gap: "8px",
      marginTop: "16px",
    },
    button: {
      padding: "8px 16px",
      borderRadius: "6px",
      border: "none",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    approveButton: {
      backgroundColor: "#10b981",
      color: "white",
    },
    rejectButton: {
      backgroundColor: "#ef4444",
      color: "white",
    },
    commentButton: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "24px",
      width: "90%",
      maxWidth: "500px",
      maxHeight: "80vh",
      overflow: "auto",
    },
    textarea: {
      width: "100%",
      minHeight: "120px",
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      fontSize: "14px",
      resize: "vertical",
      marginBottom: "16px",
      fontFamily: "inherit",
    },
    modalButtons: {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
    },
    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#64748b",
    },
    loadingSpinner: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
    },
    teamBadge: {
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "10px",
      fontWeight: "600",
      marginLeft: "8px",
    },
  };

  // Remove loading state to avoid double sidebar issue
  // if (loading) {
  //   return (
  //     <div style={styles.container}>
  //       <Sidebar />
  //       <div style={styles.mainContent}>
  //         <div style={styles.loadingSpinner}>
  //           <div>Loading team leave requests...</div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div style={styles.container}>
      {/* REMOVED Sidebar component from here - it should be in the main layout */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            👥 Team Leave Requests
            <span style={styles.teamBadge}>
              {teamLeaves.length} Request{teamLeaves.length !== 1 ? "s" : ""}
            </span>
          </h1>
          <p style={styles.subtitle}>
            Manage leave requests from your team members
          </p>
          {employeeInfo.reporting_leader && (
            <p
              style={{ ...styles.subtitle, fontSize: "14px", marginTop: "8px" }}
            >
              You are reporting to:{" "}
              <strong>{employeeInfo.reporting_leader}</strong>
            </p>
          )}
        </div>

        {/* Team Leaves List */}
        <div style={styles.card}>
          <h3 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>
            Team Member Leave Requests
          </h3>

          {teamLeaves.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
              <h3 style={{ color: "#64748b", marginBottom: "8px" }}>
                No Team Leave Requests
              </h3>
              <p style={{ color: "#94a3b8", marginBottom: "0" }}>
                When your team members apply for leave, their requests will
                appear here for your review.
              </p>
            </div>
          ) : (
            teamLeaves.map((leave) => {
              const statusInfo = getStatusInfo(leave.status);
              const employeeInitials = leave.employee_name
                ? leave.employee_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "??";

              return (
                <div key={leave.id} style={styles.leaveCard}>
                  <div style={styles.leaveHeader}>
                    <div>
                      <div style={styles.employeeInfo}>
                        <div style={styles.avatar}>{employeeInitials}</div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1e293b" }}>
                            {leave.employee_name || "Unknown Employee"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {leave.employee?.designation ||
                              leave.designation ||
                              "No designation"}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              marginTop: "4px",
                            }}
                          >
                            Reports to:{" "}
                            {leave.reporting_leader || "Not specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span style={statusInfo.style}>{statusInfo.text}</span>
                  </div>

                  <div style={styles.leaveDetails}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Leave Type</span>
                      <span style={styles.detailValue}>
                        {formatLeaveType(leave.leave_type)}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Duration</span>
                      <span style={styles.detailValue}>
                        {formatDate(leave.start_date)} to{" "}
                        {formatDate(leave.end_date)}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Total Days</span>
                      <span style={styles.detailValue}>
                        {leave.leave_days || "N/A"} day(s)
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Applied On</span>
                      <span style={styles.detailValue}>
                        {formatDate(leave.date || leave.created_at)}
                      </span>
                    </div>
                  </div>

                  {leave.reason && (
                    <div style={styles.reasonBox}>
                      <div style={styles.detailLabel}>Reason for Leave</div>
                      <div style={{ color: "#475569", fontSize: "14px" }}>
                        {leave.reason}
                      </div>
                    </div>
                  )}

                  {leave.teamleader && (
                    <div style={styles.reasonBox}>
                      <div style={styles.detailLabel}>
                        Your Previous Comment
                      </div>
                      <div
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontStyle: "italic",
                        }}
                      >
                        "{leave.teamleader}"
                      </div>
                    </div>
                  )}

                  <div style={styles.actionButtons}>
                    {leave.status === "pending" && (
                      <>
                        {/* <button
                          onClick={() =>
                            handleStatusChange(leave.id, "approved")
                          }
                          style={{ ...styles.button, ...styles.approveButton }}
                          disabled={updating}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(leave.id, "rejected")
                          }
                          style={{ ...styles.button, ...styles.rejectButton }}
                          disabled={updating}
                        >
                          ❌ Reject
                        </button> */}
                      </>
                    )}
                    <button
                      onClick={() => handleAddComment(leave)}
                      style={{ ...styles.button, ...styles.commentButton }}
                    >
                      💬 {leave.teamleader ? "Edit Comment" : "Add Comment"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Modal */}
        {selectedLeave && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={{ margin: "0 0 16px 0", color: "#1e293b" }}>
                Add Comment for {selectedLeave.employee_name}
              </h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comments or feedback for this leave request..."
                style={styles.textarea}
              />
              <div style={styles.modalButtons}>
                <button
                  onClick={() => {
                    setSelectedLeave(null);
                    setComment("");
                  }}
                  style={{
                    ...styles.button,
                    backgroundColor: "#6b7280",
                    color: "white",
                  }}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComment}
                  style={{
                    ...styles.button,
                    backgroundColor: "#3b82f6",
                    color: "white",
                  }}
                  disabled={updating || !comment.trim()}
                >
                  {updating ? "Saving..." : "Save Comment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamLeaves;
