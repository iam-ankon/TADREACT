import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebars from "./sidebars";

const AddLeaveRequest = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [balances, setBalances] = useState([]);
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
    // Fetch employees, companies, and leave balances
    Promise.all([
      axios.get("http://119.148.12.1:8000/api/hrms/api/employees/"),
      axios.get("http://119.148.12.1:8000/api/hrms/api/tad_groups/"),
      axios.get("http://119.148.12.1:8000/api/hrms/api/departments/"),
      axios.get(
        "http://119.148.12.1:8000/api/hrms/api/employee_leave_balances/"
      ),
    ])
      .then(([empRes, compRes, deptRes, balRes]) => {
        // Changed parameter names
        setEmployees(empRes.data);
        setCompanies(compRes.data);
        setDepartments(deptRes.data); // Now using the correct response for departments
        setBalances(balRes.data);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "employee") {
      const selectedEmployee = employees.find(
        (emp) => emp.id.toString() === value
      );
      if (selectedEmployee) {
        setNewLeave((prev) => ({
          ...prev,
          employee: value,
          employee_code: selectedEmployee.employee_id || "",
          designation: selectedEmployee.designation || "",
          department: selectedEmployee.department || "",
          company: selectedEmployee.company || "",
          personal_phone: selectedEmployee.personal_phone || "",
          joining_date: selectedEmployee.joining_date || "",
          email: selectedEmployee.email || "",
          emergency_contact: selectedEmployee.emergency_contact || "",
        }));

        const selectedBalance = balances.find(
          (balance) => balance.employee === selectedEmployee.id
        );
        setNewLeave((prev) => ({
          ...prev,
          balance: selectedBalance?.leave_balance || 0,
          leave_balance: selectedBalance?.leave_balance || 0,
        }));
      }
    } else {
      setNewLeave((prev) => {
        const updatedLeave = { ...prev, [name]: value };
        if (updatedLeave.start_date && updatedLeave.end_date) {
          const startDate = new Date(updatedLeave.start_date);
          const endDate = new Date(updatedLeave.end_date);
          if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
            updatedLeave.leave_days =
              Math.ceil((endDate - startDate) / (1000 * 3600 * 24)) + 1;
          }
        }
        return updatedLeave;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const formatDate = (date) => {
      const d = new Date(date);
      return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : null;
    };

    const updatedLeave = {
      ...newLeave,
      to: newLeave.to || null,
      date: newLeave.date || null,
      reason: newLeave.reason || "",
      date_of_joining_after_leave: formatDate(
        newLeave.date_of_joining_after_leave
      ),
      actual_date_of_joining: formatDate(newLeave.actual_date_of_joining),
    };

    axios
      .post(
        "http://119.148.12.1:8000/api/hrms/api/employee_leaves/",
        updatedLeave
      )
      .then(() => {
        navigate("/employee_leave");
      })
      .catch((err) =>
        console.error("Error adding leave record:", err.response?.data || err)
      )
      .finally(() => setLoading(false));
  };

  const containerStyle = {
    display: "flex",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "30px",
    backgroundColor: "#A7D5E1",
  };

  const headingStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "30px",
    color: "#2b5797",
    textAlign: "center",
  };

  const formGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  };

  const inputGroup = {
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    fontWeight: "600",
    marginBottom: "6px",
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    backgroundColor: "#DCEEF3",
  };

  const textareaStyle = { ...inputStyle, height: "80px" };

  const buttonStyle = {
    display: "block",
    margin: "20px auto",
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex" }}>
        <Sidebars />
      </div>
      <div style={mainContentStyle}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <h3 style={headingStyle}>Add New Leave Request</h3>
          <form>
            {" "}
            {/* Removed onSubmit from form tag */}
            <div style={formGrid}>
              {[
                {
                  label: "Employee",
                  name: "employee",
                  type: "select",
                  options: employees,
                  optionLabel: "name",
                },
                { label: "Employee Code", name: "employee_code" },
                { label: "Designation", name: "designation" },
                { label: "Joining Date", name: "joining_date", type: "date" },
                {
                  label: "Department",
                  name: "department",
                  type: "select",
                  options: departments,
                  optionLabel: "department_name",
                },
                {
                  label: "Company",
                  name: "company",
                  type: "select",
                  options: companies,
                  optionLabel: "company_name",
                },
                { label: "Personal Phone", name: "personal_phone" },
                { label: "Emergency Contact", name: "emergency_contact" },
                { label: "Email", name: "email", type: "email" },
                { label: "Substitute Person", name: "sub_person" },
                { label: "Receiver Name", name: "receiver_name" },
                { label: "To", name: "to" },
                { label: "Date", name: "date", type: "date" },
                { label: "Start Date", name: "start_date", type: "date" },
                { label: "End Date", name: "end_date", type: "date" },
                {
                  label: "Leave Days",
                  name: "leave_days",
                  type: "number",
                  readOnly: true,
                  value: newLeave.leave_days,
                },
                {
                  label: "Balance",
                  name: "balance",
                  type: "number",
                  readOnly: true,
                  value: newLeave.balance,
                },
                { label: "Where abouts", name: "whereabouts" },
                {
                  label: "Leave Type",
                  name: "leave_type",
                  type: "select",
                  options: [
                    {
                      id: "public_festival_holiday",
                      name: "Public Festival Holiday",
                    },
                    { id: "casual_leave", name: "Casual Leave" },
                    { id: "sick_leave", name: "Sick Leave" },
                    { id: "earned_leave", name: "Earned Leave" },
                  ],
                },
                {
                  label: "Date of Joining After Leave",
                  name: "date_of_joining_after_leave",
                  type: "date",
                },
                {
                  label: "Actual Date of Joining",
                  name: "actual_date_of_joining",
                  type: "date",
                },
                { label: "Reason for Delay", name: "reson_for_delay" },
                {
                  label: "Status",
                  name: "status",
                  type: "select",
                  options: [
                    { id: "pending", name: "Pending" },
                    { id: "approved", name: "Approved" },
                    { id: "rejected", name: "Rejected" },
                  ],
                  disabled: true,
                },
              ].map((field) => (
                <div key={field.name} style={inputGroup}>
                  <label style={labelStyle}>{field.label}:</label>
                  {field.type === "select" ? (
                    <select
                      name={field.name}
                      value={newLeave[field.name]}
                      onChange={handleInputChange}
                      style={inputStyle}
                      disabled={field.disabled}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option[field.optionLabel] || option.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={newLeave[field.name]}
                      onChange={handleInputChange}
                      style={inputStyle}
                      readOnly={field.readOnly}
                      disabled={field.readOnly}
                    />
                  )}
                </div>
              ))}
              <div style={{ ...inputGroup, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Leave Reason:</label>
                <textarea
                  name="reason"
                  value={newLeave.reason}
                  onChange={handleInputChange}
                  style={textareaStyle}
                />
              </div>
            </div>
          </form>
          <div style={buttonContainerStyle}>
            <button
              type="button"
              style={buttonStyle}
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLeaveRequest;
