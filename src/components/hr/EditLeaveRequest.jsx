import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEmployeeLeaveById,
  updateEmployeeLeave,
  getEmployeeDetailsByCode, // ADD THIS IMPORT
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

  // In EditLeaveRequest.jsx - Update the fetchLeaveRequest function
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

        // Try to get designation from multiple sources
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

        // If still no designation, fetch employee details
        if (!correctDesignation && employeeCode) {
          try {
            console.log("🔄 Fetching employee details for designation...");
            const employeeData = await getEmployeeDetailsByCode(employeeCode);

            if (employeeData) {
              correctDesignation = employeeData.designation || "";
              console.log("✅ Fetched designation:", correctDesignation);
            } else {
              console.warn("⚠️ No employee data found for code:", employeeCode);

              // If we have employee name but no code match, try to find by name
              if (employeeName) {
                console.log(
                  "🔄 Trying to find employee by name:",
                  employeeName
                );
                // You might need to implement a name-based search here
              }
            }
          } catch (empError) {
            console.warn("❌ Could not fetch employee details:", empError);
          }
        }

        console.log("🎯 Final designation:", correctDesignation);

        const mappedData = {
          // Employee information
          employee: employeeName || data.employee || "",
          employee_code: employeeCode || "",

          // Use the correct designation
          designation: correctDesignation,

          email: data.email || data.employee?.email || data.from_email || "",
          to: data.to_email || data.to || "",

          // Rest of the mapping...
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
          to_email:  data.to || "",
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

      // Send only the editable fields to avoid 400 error
      const updateData = {
        status: formData.status,
        comment: formData.comment || "",
        hrcomment: formData.hrcomment || "",
        teamleader: formData.teamleader || "",
        from_email: formData.email || "",
        to_email: formData.to || "",
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
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.formContainer}>
          <div style={styles.scrollContainer}>
            <h2 style={styles.title}>Edit Leave Request</h2>

            <div style={styles.sectionContainer}>
              <h3 style={styles.sectionHeader}>
                Employee Information (Read-only)
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Employee</label>
                  <input
                    type="text"
                    name="employee"
                    value={formData.employee || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Employee ID</label>
                  <input
                    type="text"
                    name="employee_code"
                    value={formData.employee_code || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                {/* ADD BACK THE DESIGNATION FIELD */}
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>To</label>
                  <input
                    type="text"
                    name="to"
                    value={formData.to || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Company</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Substitute Person</label>
                  <input
                    type="text"
                    name="sub_person"
                    value={formData.sub_person || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Apply Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Leave Days</label>
                  <input
                    type="number"
                    name="leave_days"
                    value={formData.leave_days || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Date of Joining After Leave
                  </label>
                  <input
                    type="date"
                    name="date_of_joining_after_leave"
                    value={formData.date_of_joining_after_leave || ""}
                    style={styles.formInput}
                    readOnly
                    disabled
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Reason for Leave</label>
                  <textarea
                    name="reason"
                    value={formData.reason || ""}
                    style={styles.formTextArea}
                    readOnly
                    disabled
                  ></textarea>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Where abouts</label>
                  <textarea
                    name="whereabouts"
                    value={formData.whereabouts || ""}
                    style={styles.formTextArea}
                    readOnly
                    disabled
                  ></textarea>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Leave Type</label>
                  <select
                    name="leave_type"
                    value={formData.leave_type || ""}
                    style={styles.formSelect}
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

            <div style={styles.sectionContainer}>
              <h3 style={styles.sectionHeader}>
                Editable Fields (Only by Authority)
              </h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>From Email</label>
                  <input
                    type="email"
                    name="from_email"
                    value={formData.from_email || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                    disabled={loading}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>To Email</label>
                  <input
                    type="email"
                    name="to_email"
                    value={formData.to_email || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                    disabled={loading}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>CC</label>
                  <input
                    type="email"
                    name="cc"
                    value={formData.cc || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                    disabled={loading}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>MD Sir Comment</label>
                  <textarea
                    name="comment"
                    value={formData.comment || ""}
                    onChange={handleChange}
                    style={styles.formTextArea}
                    disabled={loading}
                  ></textarea>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Team Leader</label>
                  <input
                    type="text"
                    name="teamleader"
                    value={formData.teamleader || ""}
                    onChange={handleChange}
                    style={styles.formInput}
                    disabled={loading}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>HR Comment</label>
                  <textarea
                    name="hrcomment"
                    value={formData.hrcomment || ""}
                    onChange={handleChange}
                    style={styles.formTextArea}
                    disabled={loading}
                  ></textarea>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    style={styles.formSelect}
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button
                type="button"
                onClick={handleSubmit}
                style={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    backgroundColor: "#DCEEF3",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "18px",
  },
  mainContent: {
    flex: 1,
    padding: "30px",
    backgroundColor: "#A7D5E1",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  scrollContainer: {
    maxHeight: "calc(100vh - 100px)",
    overflowY: "auto",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#333",
    fontSize: "24px",
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: "20px",
    padding: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    backgroundColor: "#DCEEF3",
  },
  sectionHeader: {
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#555",
    fontSize: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formLabel: {
    fontWeight: "600",
    marginBottom: "5px",
    color: "#555",
    fontSize: "14px",
  },
  formInput: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  formSelect: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  formTextArea: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minHeight: "100px",
    fontSize: "14px",
    resize: "vertical",
  },
  buttonContainer: {
    textAlign: "center",
    marginTop: "20px",
  },
  submitButton: {
    padding: "12px 24px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    transition: "background-color 0.3s",
  },
};

// Add hover effect for submit button
styles.submitButton = {
  ...styles.submitButton,
  ":hover": {
    backgroundColor: "#45a049",
  },
  ":disabled": {
    backgroundColor: "#cccccc",
    cursor: "not-allowed",
  },
};

export default EditLeaveRequest;
