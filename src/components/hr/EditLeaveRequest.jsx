import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEmployeeLeaveById,
  updateEmployeeLeave,
  getEmployeeDetailsByCode,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EditLeaveRequest = () => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee: "",
    employee_code: "",
    designation: "",
    joining_date: "",
    department: "",
    company: "",
    personal_phone: "",
    sub_person: "",
    from_email: "",
    to: "",
    to_email: "",
    cc: "",
    date: "",
    start_date: "",
    end_date: "",
    leave_days: "",
    balance: "",
    whereabouts: "",
    teamleader: "",
    comment: "",
    hrcomment: "",
    leave_type: "",
    date_of_joining_after_leave: "",
    actual_date_of_joining: "",
    reason_for_delay: "",
    status: "",
    emergency_contact: "",
    reason: "",
  });

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      try {
        setLoading(true);
        const response = await getEmployeeLeaveById(id);
        const data = response.data;

        console.log("📋 Raw API Response:", data);

        let correctDesignation = "";
        const employeeCode = data.employee_code || data.employee?.employee_id;
        const employeeName = data.employee_name || data.employee?.name;

        console.log("🔍 Looking for employee:", {
          code: employeeCode,
          name: employeeName,
        });

        if (data.employee && typeof data.employee === "object") {
          correctDesignation = data.employee.designation || "";
          console.log(
            "📝 Found designation in employee object:",
            correctDesignation
          );
        } else if (data.designation) {
          correctDesignation = data.designation;
          console.log("📝 Found designation in main data:", correctDesignation);
        }

        if (!correctDesignation && employeeCode) {
          try {
            console.log("🔄 Fetching employee details for designation...");
            const employeeData = await getEmployeeDetailsByCode(employeeCode);

            if (employeeData) {
              correctDesignation = employeeData.designation || "";
              console.log("✅ Fetched designation:", correctDesignation);
            } else {
              console.warn("⚠️ No employee data found for code:", employeeCode);
            }
          } catch (empError) {
            console.warn("❌ Could not fetch employee details:", empError);
          }
        }

        console.log("🎯 Final designation:", correctDesignation);

        const mappedData = {
          employee: employeeName || data.employee || "",
          employee_code: employeeCode || "",
          designation: correctDesignation,
          email: data.email || data.employee?.email || data.from_email || "",
          to: data.to_email || data.to || "",
          date: data.date ? data.date.split("T")[0] : "",
          start_date: data.start_date ? data.start_date.split("T")[0] : "",
          end_date: data.end_date ? data.end_date.split("T")[0] : "",
          date_of_joining_after_leave: data.date_of_joining_after_leave
            ? data.date_of_joining_after_leave.split("T")[0]
            : "",
          department:
            data.department_name ||
            data.department ||
            data.employee?.department ||
            "",
          company:
            data.company_name || data.company || data.employee?.company || "",
          sub_person: data.sub_person || "",
          leave_days: data.leave_days || 0,
          whereabouts: data.whereabouts || "",
          teamleader: data.teamleader || "",
          comment: data.comment || "",
          hrcomment: data.hrcomment || "",
          leave_type: data.leave_type || "",
          status: data.status || "pending",
          emergency_contact: data.emergency_contact || "",
          reason: data.reason || "",
          from_email: data.employee?.email || "",
          to_email: data.to || "",
          cc: data.cc || "",
        };

        console.log("🔄 Mapped Form Data:", mappedData);
        setFormData(mappedData);
      } catch (err) {
        console.error("Error fetching leave request:", err);
        alert("Failed to load leave request data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequest();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const updateData = {
        status: formData.status,
        comment: formData.comment || "",
        hrcomment: formData.hrcomment || "",
        teamleader: formData.teamleader || "",
        from_email: formData.from_email || "",
        to_email: formData.to_email || "",
        cc: formData.cc || "",
      };

      console.log("📤 Sending update data:", updateData);

      await updateEmployeeLeave(id, updateData);
      alert("Leave request updated successfully!");
      navigate("/employee_leave");
    } catch (err) {
      console.error("Error updating leave request:", err);
      console.error("Error details:", err.response?.data);
      alert("Failed to update leave request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.employee) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p>Loading leave request details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Edit Leave Request</h1>
          <p style={styles.headerSubtitle}>
            Review and update employee leave application
          </p>
        </div>

        <div style={styles.formContainer}>
          <div style={styles.scrollContainer}>
            {/* Employee Information Section */}
            <div style={styles.sectionContainer}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionIcon}>👤</div>
                <div>
                  <h3 style={styles.sectionTitle}>Employee Information</h3>
                  <p style={styles.sectionDescription}>
                    Read-only employee details
                  </p>
                </div>
              </div>

              <div style={styles.formGrid}>
                {[
                  { label: "Employee", name: "employee", type: "text" },
                  { label: "Employee ID", name: "employee_code", type: "text" },
                  { label: "Designation", name: "designation", type: "text" },
                  { label: "Email", name: "email", type: "email" },
                  { label: "To", name: "to", type: "text" },
                  { label: "Department", name: "department", type: "text" },
                  { label: "Company", name: "company", type: "text" },
                  {
                    label: "Substitute Person",
                    name: "sub_person",
                    type: "text",
                  },
                  { label: "Apply Date", name: "date", type: "date" },
                  { label: "Start Date", name: "start_date", type: "date" },
                  { label: "End Date", name: "end_date", type: "date" },
                  { label: "Leave Days", name: "leave_days", type: "number" },
                  {
                    label: "Date of Joining After Leave",
                    name: "date_of_joining_after_leave",
                    type: "date",
                  },
                ].map((field) => (
                  <div key={field.name} style={styles.formGroup}>
                    <label style={styles.formLabel}>{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      style={styles.readOnlyInput}
                      readOnly
                      disabled
                    />
                  </div>
                ))}

                <div style={styles.fullWidthGroup}>
                  <label style={styles.formLabel}>Reason for Leave</label>
                  <textarea
                    name="reason"
                    value={formData.reason || ""}
                    style={styles.readOnlyTextArea}
                    readOnly
                    disabled
                  ></textarea>
                </div>

                <div style={styles.fullWidthGroup}>
                  <label style={styles.formLabel}>Whereabouts</label>
                  <textarea
                    name="whereabouts"
                    value={formData.whereabouts || ""}
                    style={styles.readOnlyTextArea}
                    readOnly
                    disabled
                  ></textarea>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Leave Type</label>
                  <select
                    name="leave_type"
                    value={formData.leave_type || ""}
                    style={styles.readOnlySelect}
                    readOnly
                    disabled
                  >
                    <option value="">Select Leave Type</option>
                    <option value="public_festival_holiday">
                      Public Festival Holiday
                    </option>
                    <option value="casual_leave">Casual Leave</option>
                    <option value="sick_leave">Sick Leave</option>
                    <option value="earned_leave">Earned Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Editable Fields Section */}
            <div style={styles.sectionContainer}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionIcon}>✏️</div>
                <div>
                  <h3 style={styles.sectionTitle}>Approval Section</h3>
                  <p style={styles.sectionDescription}>
                    Editable fields for authority review
                  </p>
                </div>
              </div>

              <div style={styles.formGrid}>
                {[
                  { label: "From Email", name: "from_email", type: "email" },
                  { label: "To Email", name: "to_email", type: "email" },
                  { label: "CC", name: "cc", type: "email" },
                 
                ].map((field) => (
                  <div key={field.name} style={styles.formGroup}>
                    <label style={styles.formLabel}>{field.label}</label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      style={styles.editableInput}
                      disabled={loading}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    style={{
                      ...styles.editableSelect,
                      backgroundColor:
                        formData.status === "approved"
                          ? "#e8f5e8"
                          : formData.status === "rejected"
                          ? "#fde8e8"
                          : "#fff",
                    }}
                    disabled={loading}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="approved">✅ Approved</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
                <div style={styles.fullWidthGroup}>
                  <label style={styles.formLabel}>Team Leader Comment</label>
                  <textarea
                    name="comment"
                    value={formData.teamleader || ""}
                    onChange={handleChange}
                    style={styles.editableTextArea}
                    disabled={loading}
                    placeholder="Enter comments from Team Leader..."
                    rows="3"
                  ></textarea>
                </div>

                <div style={styles.fullWidthGroup}>
                  <label style={styles.formLabel}>MD Sir Comment</label>
                  <textarea
                    name="comment"
                    value={formData.comment || ""}
                    onChange={handleChange}
                    style={styles.editableTextArea}
                    disabled={loading}
                    placeholder="Enter comments from MD..."
                    rows="3"
                  ></textarea>
                </div>

                <div style={styles.fullWidthGroup}>
                  <label style={styles.formLabel}>HR Comment</label>
                  <textarea
                    name="hrcomment"
                    value={formData.hrcomment || ""}
                    onChange={handleChange}
                    style={styles.editableTextArea}
                    disabled={loading}
                    placeholder="Enter HR comments..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={styles.buttonContainer}>
              <button
                type="button"
                onClick={() => navigate("/employee_leave")}
                style={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Updating...
                  </>
                ) : (
                  "Update Leave Request"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    padding: "24px",
    overflow: "auto",
  },
  header: {
    marginBottom: "2px",
    paddingBottom: "6px",
    borderBottom: "1px solid #e2e8f0",
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
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  scrollContainer: {
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    padding: "24px",
  },
  sectionContainer: {
    marginBottom: "32px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionIcon: {
    fontSize: "24px",
    marginRight: "12px",
    marginTop: "2px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  sectionDescription: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  fullWidthGroup: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
  },
  formLabel: {
    fontWeight: "600",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "14px",
  },
  readOnlyInput: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  editableInput: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
  },
  readOnlySelect: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  editableSelect: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  readOnlyTextArea: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    minHeight: "80px",
    fontSize: "14px",
    resize: "vertical",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  editableTextArea: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    minHeight: "80px",
    fontSize: "14px",
    resize: "vertical",
    backgroundColor: "#fff",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  cancelButton: {
    padding: "12px 24px",
    backgroundColor: "#fff",
    color: "#64748b",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
  submitButton: {
    padding: "12px 24px",
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
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid transparent",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Enhanced hover effects using event handlers instead of style objects
const enhancedStyles = {
  ...styles,
  cancelButton: {
    ...styles.cancelButton,
    ":hover": {
      backgroundColor: "#f8fafc",
      borderColor: "#94a3b8",
    },
    ":disabled": {
      backgroundColor: "#f1f5f9",
      color: "#94a3b8",
      cursor: "not-allowed",
    },
  },
  submitButton: {
    ...styles.submitButton,
    ":hover": {
      backgroundColor: "#2563eb",
    },
    ":disabled": {
      backgroundColor: "#93c5fd",
      cursor: "not-allowed",
    },
  },
  editableInput: {
    ...styles.editableInput,
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  },
  editableSelect: {
    ...styles.editableSelect,
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  },
  editableTextArea: {
    ...styles.editableTextArea,
    ":focus": {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
  },
};

export default EditLeaveRequest;
