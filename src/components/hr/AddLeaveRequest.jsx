import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  getEmployees,
  getCompanies,
  getDepartments,
  addEmployeeLeave,
  getEmployeeLeaveBalances,
} from "../../api/employeeApi";

const AddLeaveRequest = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [balances, setBalances] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [newLeave, setNewLeave] = useState({
    employee: "",
    employee_code: "",
    designation: "",
    joining_date: "",
    department: "",
    company: "",
    personal_phone: "",
    sub_person: "",
    email: "",
    receiver_name: "",
    to: "",
    date: "",
    leave_days: "",
    leave_balance: 0,
    whereabouts: "",
    leave_type: "",
    start_date: "",
    end_date: "",
    leave_entited: 0,
    leave_applied_for: 0,
    leave_availed: 0,
    balance: "",
    date_of_joining_after_leave: "",
    actual_date_of_joining: "",
    reson_for_delay: "",
    reason: "",
    status: "pending",
    emergency_contact: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, compRes, deptRes, balRes] = await Promise.all([
          getEmployees(),
          getCompanies(),
          getDepartments(),
          getEmployeeLeaveBalances(),
        ]);

        setEmployees(empRes.data);
        setCompanies(compRes.data);
        setDepartments(deptRes.data);
        setBalances(balRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Safe string conversion function
  const safeToString = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    return String(value);
  };

  // Filter employees based on search term - COMPLETELY SAFE VERSION
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employees;

    const searchTerm = safeToString(employeeSearch).toLowerCase();

    return employees.filter((emp) => {
      if (!emp) return false;

      const name = safeToString(emp.name);
      const employeeId = safeToString(emp.employee_id);
      const designation = safeToString(emp.designation);
      const department = safeToString(emp.department);

      return (
        name.toLowerCase().includes(searchTerm) ||
        employeeId.toLowerCase().includes(searchTerm) ||
        designation.toLowerCase().includes(searchTerm) ||
        department.toLowerCase().includes(searchTerm)
      );
    });
  }, [employees, employeeSearch]);

  const handleEmployeeSelect = (employeeId, employee) => {
    const selectedEmployee = employees.find(
      (emp) => emp && emp.id.toString() === employeeId
    );

    if (selectedEmployee) {
      const selectedBalance = balances.find(
        (balance) => balance && balance.employee === selectedEmployee.id
      );

      setNewLeave((prev) => ({
        ...prev,
        employee: employeeId,
        employee_code: safeToString(selectedEmployee.employee_id),
        designation: safeToString(selectedEmployee.designation),
        department: safeToString(selectedEmployee.department),
        company: safeToString(selectedEmployee.company),
        personal_phone: safeToString(selectedEmployee.personal_phone),
        joining_date: safeToString(selectedEmployee.joining_date),
        email: safeToString(selectedEmployee.email),
        emergency_contact: safeToString(selectedEmployee.emergency_contact),
        balance: selectedBalance?.leave_balance || 0,
        leave_balance: selectedBalance?.leave_balance || 0,
      }));
    }

    if (employee) {
      const displayName = `${safeToString(employee.name)} (${safeToString(
        employee.employee_id
      )})`;
      setEmployeeSearch(displayName);
    } else {
      setEmployeeSearch("");
    }
    setShowEmployeeDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "employee_search") {
      setEmployeeSearch(value);
      setShowEmployeeDropdown(true);
    } else {
      setNewLeave((prev) => {
        const updated = { ...prev, [name]: value };

        // Auto-calculate leave days if both dates are present
        if (updated.start_date && updated.end_date) {
          const start = new Date(updated.start_date);
          const end = new Date(updated.end_date);
          if (!isNaN(start) && !isNaN(end)) {
            const diffTime = Math.abs(end - start);
            updated.leave_days =
              Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          }
        }
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newLeave.employee) {
      alert("Please select an employee");
      return;
    }

    if (!newLeave.leave_type) {
      alert("Please select a leave type");
      return;
    }

    if (!newLeave.start_date || !newLeave.end_date) {
      alert("Please select both start and end dates");
      return;
    }

    if (!newLeave.reason) {
      alert("Please provide a reason for leave");
      return;
    }

    setLoading(true);

    try {
      // Prepare the data with all required fields
      const leaveData = {
        ...newLeave,
        to: newLeave.to || null,
        date: newLeave.date || new Date().toISOString().split("T")[0], // Default to today
        reason: newLeave.reason || "",
        date_of_joining_after_leave:
          newLeave.date_of_joining_after_leave || null,
        actual_date_of_joining: newLeave.actual_date_of_joining || null,
        status: "pending",
      };

      console.log("Submitting leave data:", leaveData); // Debug log

      await addEmployeeLeave(leaveData);

      navigate("/employee_leave");
      alert("Leave request submitted successfully!");
    } catch (err) {
      console.error("Error adding leave record:", err);
      alert("Failed to submit leave request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".employee-search-container")) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Styles
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    mainContent: {
      flex: 1,
      padding: "2rem",
      overflow: "auto",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    heading: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: "1.5rem",
      textAlign: "center",
      borderBottom: "1px solid #eaeaea",
      paddingBottom: "1rem",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "1.5rem",
    },
    inputGroup: {
      marginBottom: "1rem",
    },
    employeeSearchGroup: {
      marginBottom: "1rem",
      position: "relative",
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      fontWeight: "500",
      color: "#4a5568",
      fontSize: "0.875rem",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      borderRadius: "0.375rem",
      border: "1px solid #e2e8f0",
      fontSize: "0.875rem",
      transition: "border-color 0.2s",
      backgroundColor: "white",
    },
    select: {
      appearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.75rem center",
      backgroundSize: "1rem",
    },
    textarea: {
      minHeight: "6rem",
      resize: "vertical",
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "1rem",
      marginTop: "2rem",
    },
    primaryButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#4299e1",
      color: "white",
      border: "none",
      borderRadius: "0.375rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      fontSize: "1rem",
    },
    secondaryButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#e2e8f0",
      color: "#4a5568",
      border: "none",
      borderRadius: "0.375rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      fontSize: "1rem",
    },
    disabledButton: {
      opacity: "0.6",
      cursor: "not-allowed",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "0.375rem",
      maxHeight: "250px",
      overflowY: "auto",
      zIndex: 1000,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    dropdownItem: {
      padding: "0.75rem",
      cursor: "pointer",
      borderBottom: "1px solid #f7fafc",
      fontSize: "0.875rem",
      transition: "background-color 0.2s",
    },
    dropdownItemHover: {
      backgroundColor: "#edf2f7",
    },
    employeeName: {
      fontWeight: "600",
      color: "#2d3748",
      marginBottom: "0.25rem",
    },
    employeeDetails: {
      fontSize: "0.75rem",
      color: "#718096",
      lineHeight: "1.4",
    },
    section: {
      backgroundColor: "#f7fafc",
      borderRadius: "0.375rem",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      border: "1px solid #e2e8f0",
    },
    sectionTitle: {
      fontSize: "1.125rem",
      fontWeight: "600",
      color: "#2d3748",
      marginBottom: "1rem",
      paddingBottom: "0.5rem",
      borderBottom: "1px solid #e2e8f0",
    },
    requiredField: {
      color: "#e53e3e",
      marginLeft: "2px",
    },
    loadingText: {
      textAlign: "center",
      color: "#718096",
      fontStyle: "italic",
      padding: "2rem",
    },
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={styles.card}>
            <h2 style={styles.heading}>New Leave Request</h2>

            {loading && employees.length === 0 ? (
              <div style={styles.loadingText}>Loading data...</div>
            ) : (
              <>
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Employee Information</h3>
                  <div style={styles.formGrid}>
                    <div
                      style={styles.employeeSearchGroup}
                      className="employee-search-container"
                    >
                      <label style={styles.label}>
                        Employee <span style={styles.requiredField}>*</span>
                      </label>
                      <input
                        type="text"
                        name="employee_search"
                        value={employeeSearch}
                        onChange={handleInputChange}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        style={styles.input}
                        placeholder="Search by name, ID, designation, or department..."
                        required
                      />
                      {showEmployeeDropdown && filteredEmployees.length > 0 && (
                        <div style={styles.dropdown}>
                          {filteredEmployees.map((emp) => (
                            <div
                              key={emp.id}
                              style={styles.dropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmployeeSelect(emp.id.toString(), emp);
                              }}
                              onMouseEnter={(e) =>
                                (e.target.style.backgroundColor =
                                  styles.dropdownItemHover.backgroundColor)
                              }
                              onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = "transparent")
                              }
                            >
                              <div style={styles.employeeName}>
                                {safeToString(emp.name) || "No Name"}
                              </div>
                              <div style={styles.employeeDetails}>
                                ID: {safeToString(emp.employee_id) || "No ID"} |{" "}
                                {safeToString(emp.designation) ||
                                  "No Designation"}
                              </div>
                              <div style={styles.employeeDetails}>
                                Dept:{" "}
                                {safeToString(emp.department) ||
                                  "No Department"}{" "}
                                | Phone:{" "}
                                {safeToString(emp.personal_phone) || "No Phone"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {showEmployeeDropdown &&
                        filteredEmployees.length === 0 &&
                        employeeSearch && (
                          <div style={styles.dropdown}>
                            <div
                              style={{
                                ...styles.dropdownItem,
                                cursor: "default",
                              }}
                            >
                              No employees found matching "{employeeSearch}"
                            </div>
                          </div>
                        )}
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Employee Code</label>
                      <input
                        type="text"
                        name="employee_code"
                        value={newLeave.employee_code}
                        readOnly
                        style={{ ...styles.input, backgroundColor: "#f7fafc" }}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={newLeave.designation}
                        readOnly
                        style={{ ...styles.input, backgroundColor: "#f7fafc" }}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Department</label>
                      <select
                        name="department"
                        value={newLeave.department}
                        onChange={handleInputChange}
                        style={{ ...styles.input, ...styles.select }}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Company</label>
                      <select
                        name="company"
                        value={newLeave.company}
                        onChange={handleInputChange}
                        style={{ ...styles.input, ...styles.select }}
                      >
                        <option value="">Select Company</option>
                        {companies.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.company_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Joining Date</label>
                      <input
                        type="date"
                        name="joining_date"
                        value={newLeave.joining_date}
                        readOnly
                        style={{ ...styles.input, backgroundColor: "#f7fafc" }}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Personal Phone</label>
                      <input
                        type="text"
                        name="personal_phone"
                        value={newLeave.personal_phone}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Emergency Contact</label>
                      <input
                        type="text"
                        name="emergency_contact"
                        value={newLeave.emergency_contact}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={newLeave.email}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Leave Details</h3>
                  <div style={styles.formGrid}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>To (Email)</label>
                      <input
                        type="email"
                        name="to"
                        value={newLeave.to}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Recipient email address"
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        Leave Type <span style={styles.requiredField}>*</span>
                      </label>
                      <select
                        name="leave_type"
                        value={newLeave.leave_type}
                        onChange={handleInputChange}
                        style={{ ...styles.input, ...styles.select }}
                        required
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

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        Start Date <span style={styles.requiredField}>*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={newLeave.start_date}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        End Date <span style={styles.requiredField}>*</span>
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={newLeave.end_date}
                        onChange={handleInputChange}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Leave Days</label>
                      <input
                        type="number"
                        name="leave_days"
                        value={newLeave.leave_days}
                        readOnly
                        style={{ ...styles.input, backgroundColor: "#f7fafc" }}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Current Balance</label>
                      <input
                        type="number"
                        name="balance"
                        value={newLeave.balance}
                        readOnly
                        style={{ ...styles.input, backgroundColor: "#f7fafc" }}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Substitute Person</label>
                      <input
                        type="text"
                        name="sub_person"
                        value={newLeave.sub_person}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Person covering duties during leave"
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Whereabouts</label>
                      <input
                        type="text"
                        name="whereabouts"
                        value={newLeave.whereabouts}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Location during leave (if applicable)"
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        Date of Joining After Leave
                      </label>
                      <input
                        type="date"
                        name="date_of_joining_after_leave"
                        value={newLeave.date_of_joining_after_leave}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>
                      Leave Reason <span style={styles.requiredField}>*</span>
                    </label>
                    <textarea
                      name="reason"
                      value={newLeave.reason}
                      onChange={handleInputChange}
                      style={{ ...styles.input, ...styles.textarea }}
                      required
                      placeholder="Please provide a detailed reason for your leave..."
                    />
                  </div>
                </div>

                <div style={styles.buttonContainer}>
                  <button
                    type="button"
                    style={{
                      ...styles.secondaryButton,
                      ...(loading && styles.disabledButton),
                    }}
                    onClick={() => navigate("/employee_leave")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.primaryButton,
                      ...(loading && styles.disabledButton),
                    }}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLeaveRequest;
