// src/components/ApplyLeave.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getEmployeeLeaveBalances,
  addEmployeeLeave,
} from "../../../api/employeeApi";

const ApplyLeave = () => {
  const [loading, setLoading] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({
    casual_leave: 0,
    sick_leave: 0,
    earned_leave: 0,
    public_festival_holiday: 0,
  });

  const employeeInfo = {
    name: localStorage.getItem("employee_name") || "",
    employee_id: localStorage.getItem("employee_id") || "",
    employee_db_id: localStorage.getItem("employee_db_id") || "",
    designation: localStorage.getItem("designation") || "",
    department: localStorage.getItem("department") || "",
    email: localStorage.getItem("email") || "",
  };

  const [leaveForm, setLeaveForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    leave_days: 0,
    reason: "",
    whereabouts: "",
    sub_person: "",
    date_of_joining_after_leave: "",
    to: "laila@tadgroupbd.com",
    receiver_name: "",
    date: new Date().toISOString().split("T")[0],
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaveBalances();

    // Debug localStorage
    console.log("🔍 localStorage contents:");
    console.log("employee_db_id:", localStorage.getItem("employee_db_id"));
    console.log("employee_id:", localStorage.getItem("employee_id"));
    console.log("employee_name:", localStorage.getItem("employee_name"));
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      const employeeId = localStorage.getItem("employee_id");
      console.log("🔍 Fetching leave balances for employee:", employeeId);

      const response = await getEmployeeLeaveBalances(employeeId);
      console.log("💰 Raw balances response:", response.data);

      // Handle different response structures
      let balanceData = {};

      if (response.data && Array.isArray(response.data)) {
        // Case 1: Array response (multiple balance records)
        const userBalance = response.data.find(
          (balance) =>
            balance.employee_code === employeeId ||
            balance.employee === employeeId ||
            (balance.employee && balance.employee.employee_id === employeeId)
        );

        if (userBalance) {
          balanceData = {
            casual_leave: userBalance.casual_leave || 0,
            sick_leave: userBalance.sick_leave || 0,
            earned_leave: userBalance.earned_leave || 0,
            public_festival_holiday: userBalance.public_festival_holiday || 0,
          };
        }
      } else if (response.data && typeof response.data === "object") {
        // Case 2: Single object response (transformed data)
        balanceData = {
          casual_leave: response.data.casual_leave || 0,
          sick_leave: response.data.sick_leave || 0,
          earned_leave: response.data.earned_leave || 0,
          public_festival_holiday: response.data.public_festival_holiday || 0,
        };
      }

      console.log("🔄 Setting leave balances:", balanceData);
      setLeaveBalances(balanceData);
    } catch (error) {
      console.error("❌ Error fetching leave balances:", error);
      // Set default values on error
      setLeaveBalances({
        casual_leave: 0,
        sick_leave: 0,
        earned_leave: 0,
        public_festival_holiday: 0,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setLeaveForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (
        (name === "start_date" || name === "end_date") &&
        updated.start_date &&
        updated.end_date
      ) {
        const start = new Date(updated.start_date);
        const end = new Date(updated.end_date);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const timeDiff = end.getTime() - start.getTime();
          const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
          updated.leave_days = dayDiff;
        } else {
          updated.leave_days = 0;
        }
      }

      return updated;
    });
  };

  // In ApplyLeave.jsx - Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !leaveForm.leave_type ||
      !leaveForm.start_date ||
      !leaveForm.end_date ||
      !leaveForm.reason ||
      !leaveForm.to
    ) {
      alert("Please fill all required fields");
      return;
    }

    const startDate = new Date(leaveForm.start_date);
    const endDate = new Date(leaveForm.end_date);
    if (endDate < startDate) {
      alert("End date cannot be before start date");
      return;
    }

    const selectedLeaveType = leaveForm.leave_type;
    const availableBalance = leaveBalances[selectedLeaveType] || 0;
    if (leaveForm.leave_days > availableBalance) {
      alert(
        `Insufficient ${selectedLeaveType.replace(
          "_",
          " "
        )} balance. Available: ${availableBalance} days`
      );
      return;
    }

    setLoading(true);

    try {
      // Get both employee_db_id and employee_id
      const employeeDbId = localStorage.getItem("employee_db_id");
      const employeeId = localStorage.getItem("employee_id");

      console.log("📝 Creating leave with:", {
        employeeDbId,
        employeeId,
        employeeName: employeeInfo.name,
      });

      // Format dates properly for backend
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      };

      const leaveData = {
        employee: parseInt(employeeDbId), // This should be the database ID
        employee_code: employeeId, // Add employee_code for better filtering
        leave_type: leaveForm.leave_type,
        start_date: formatDateForBackend(leaveForm.start_date),
        end_date: formatDateForBackend(leaveForm.end_date),
        leave_days: leaveForm.leave_days,
        reason: leaveForm.reason,
        status: "pending",
        to_email: leaveForm.to,
        receiver_name: leaveForm.receiver_name || "HR Department",
        from_email: employeeInfo.email,
        whereabouts: leaveForm.whereabouts || "",
        sub_person: leaveForm.sub_person || "",
        date_of_joining_after_leave: formatDateForBackend(
          leaveForm.date_of_joining_after_leave
        ),
        date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
      };

      console.log("📦 Final leave data:", leaveData);
      await addEmployeeLeave(leaveData);
      alert("Leave request submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting leave:", error);
      console.error("Full error details:", error.response);

      // More detailed error logging
      if (error.response?.data) {
        console.error("Backend validation errors:", error.response.data);

        // Handle specific backend errors
        if (error.response.data.date) {
          alert(`Date error: ${error.response.data.date.join(", ")}`);
        } else if (error.response.data.employee) {
          alert(`Employee error: ${error.response.data.employee}`);
        } else if (error.response.status === 400) {
          alert("Bad request. Please check all fields and try again.");
        } else if (error.response.status === 404) {
          alert("Employee not found. Please contact HR.");
        } else {
          alert(`Error: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        alert("Failed to submit leave request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getAvailableBalance = (leaveType) => {
    return leaveBalances[leaveType] || 0;
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
      textAlign: "center",
      marginBottom: "30px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "8px",
    },
    subtitle: {
      fontSize: "16px",
      color: "#6c757d",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      padding: "24px",
      marginBottom: "20px",
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "16px",
    },
    employeeInfo: {
      backgroundColor: "#e8f4fd",
      padding: "16px",
      borderRadius: "6px",
      marginBottom: "20px",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
    },
    infoItem: {
      marginBottom: "8px",
    },
    infoLabel: {
      fontSize: "12px",
      color: "#495057",
      marginBottom: "4px",
    },
    infoValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#2c3e50",
    },
    balancesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "16px",
      marginBottom: "24px",
    },
    balanceCard: {
      backgroundColor: "#f8f9fa",
      padding: "16px",
      borderRadius: "6px",
      textAlign: "center",
      border: "1px solid #e9ecef",
    },
    balanceLabel: {
      fontSize: "14px",
      color: "#6c757d",
      marginBottom: "8px",
    },
    balanceValue: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#2c3e50",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "16px",
      marginBottom: "16px",
    },
    inputGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#495057",
      marginBottom: "6px",
    },
    required: {
      color: "#dc3545",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "4px",
      border: "1px solid #ced4da",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    textarea: {
      minHeight: "100px",
      resize: "vertical",
    },
    select: {
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      backgroundSize: "16px",
    },
    buttonContainer: {
      display: "flex",
      gap: "12px",
      justifyContent: "center",
      marginTop: "24px",
    },
    button: {
      padding: "12px 24px",
      borderRadius: "4px",
      border: "none",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      minWidth: "120px",
    },
    primaryButton: {
      backgroundColor: "#007bff",
      color: "white",
    },
    secondaryButton: {
      backgroundColor: "#6c757d",
      color: "white",
    },
    disabledButton: {
      opacity: "0.6",
      cursor: "not-allowed",
    },
    emailSection: {
      backgroundColor: "#f3e8fd",
      padding: "16px",
      borderRadius: "6px",
      marginBottom: "20px",
      border: "1px solid #e2d4f7",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Apply for Leave</h1>
          <p style={styles.subtitle}>Submit your leave request form</p>
        </div>

        <div style={styles.card}>
          {/* Employee Information */}
          <div style={styles.employeeInfo}>
            <h3
              style={{
                margin: "0 0 12px 0",
                color: "#0056b3",
                fontSize: "16px",
              }}
            >
              Employee Details
            </h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Name</div>
                <div style={styles.infoValue}>{employeeInfo.name}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Employee ID</div>
                <div style={styles.infoValue}>{employeeInfo.employee_id}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Designation</div>
                <div style={styles.infoValue}>{employeeInfo.designation}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Department</div>
                <div style={styles.infoValue}>{employeeInfo.department}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Email</div>
                <div style={styles.infoValue}>{employeeInfo.email}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Database ID</div>
                <div style={styles.infoValue}>
                  {employeeInfo.employee_db_id || "Not set"}
                </div>
              </div>
            </div>
          </div>

          {/* Leave Balances */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={styles.sectionTitle}>Leave Balances</h3>
            <div style={styles.balancesGrid}>
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>Casual Leave</div>
                <div style={styles.balanceValue}>
                  {leaveBalances.casual_leave}
                </div>
              </div>
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>Sick Leave</div>
                <div style={styles.balanceValue}>
                  {leaveBalances.sick_leave}
                </div>
              </div>
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>Earned Leave</div>
                <div style={styles.balanceValue}>
                  {leaveBalances.earned_leave}
                </div>
              </div>
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>Public Holiday</div>
                <div style={styles.balanceValue}>
                  {leaveBalances.public_festival_holiday}
                </div>
              </div>
            </div>
          </div>

          {/* Email Section */}
          <div style={styles.emailSection}>
            <h3 style={{ ...styles.sectionTitle, color: "#6f42c1" }}>
              Email Notification
            </h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Recipient Email <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="to"
                  value={leaveForm.to}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="hr@company.com"
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Receiver Name</label>
                <input
                  type="text"
                  name="receiver_name"
                  value={leaveForm.receiver_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="HR Department"
                />
              </div>
            </div>
          </div>

          {/* Leave Application Form */}
          <form onSubmit={handleSubmit}>
            <h3 style={styles.sectionTitle}>Leave Details</h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Leave Type <span style={styles.required}>*</span>
                </label>
                <select
                  name="leave_type"
                  value={leaveForm.leave_type}
                  onChange={handleInputChange}
                  style={{ ...styles.input, ...styles.select }}
                  required
                >
                  <option value="">Select Leave Type</option>
                  <option value="casual_leave">
                    Casual Leave (Available:{" "}
                    {getAvailableBalance("casual_leave")})
                  </option>
                  <option value="sick_leave">
                    Sick Leave (Available: {getAvailableBalance("sick_leave")})
                  </option>
                  <option value="earned_leave">
                    Earned Leave (Available:{" "}
                    {getAvailableBalance("earned_leave")})
                  </option>
                  <option value="public_festival_holiday">
                    Public Festival Holiday (Available:{" "}
                    {getAvailableBalance("public_festival_holiday")})
                  </option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Start Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={leaveForm.start_date}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  End Date <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={leaveForm.end_date}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Total Leave Days</label>
                <input
                  type="number"
                  name="leave_days"
                  value={leaveForm.leave_days}
                  readOnly
                  style={{ ...styles.input, backgroundColor: "#f8f9fa" }}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Reason for Leave <span style={styles.required}>*</span>
              </label>
              <textarea
                name="reason"
                value={leaveForm.reason}
                onChange={handleInputChange}
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Please provide a detailed reason for your leave request..."
                required
              />
            </div>

            <h3 style={styles.sectionTitle}>Additional Information</h3>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Whereabouts During Leave</label>
                <input
                  type="text"
                  name="whereabouts"
                  value={leaveForm.whereabouts}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Your location during leave"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Substitute Person</label>
                <input
                  type="text"
                  name="sub_person"
                  value={leaveForm.sub_person}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Person covering your duties"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Expected Joining Date After Leave
                </label>
                <input
                  type="date"
                  name="date_of_joining_after_leave"
                  value={leaveForm.date_of_joining_after_leave}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  ...(loading && styles.disabledButton),
                }}
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  ...(loading && styles.disabledButton),
                }}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
