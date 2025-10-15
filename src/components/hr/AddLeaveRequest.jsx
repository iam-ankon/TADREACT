// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { Link, useNavigate } from "react-router-dom";
// import Sidebars from "./sidebars";

// const AddLeaveRequest = () => {
//   const [loading, setLoading] = useState(false);
//   const [employees, setEmployees] = useState([]);
//   const [companies, setCompanies] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [balances, setBalances] = useState([]);
//   const [newLeave, setNewLeave] = useState({
//     employee: "",
//     employee_code: "",
//     designation: "",
//     joining_date: "",
//     department: "",
//     company: "",
//     personal_phone: "",
//     sub_person: "",
//     email: "",
//     receiver_name: "",
//     to: "",
//     date: "",
//     leave_days: "",
//     leave_balance: 0,
//     whereabouts: "",
//     leave_type: "",
//     start_date: "",
//     end_date: "",
//     leave_entited: 0,
//     leave_applied_for: 0,
//     leave_availed: 0,
//     balance: "",
//     date_of_joining_after_leave: "",
//     actual_date_of_joining: "",
//     reson_for_delay: "",
//     reason: "",
//     status: "pending",
//     emergency_contact: "",
//   });

//   const navigate = useNavigate();

//   useEffect(() => {
//     // Fetch employees, companies, and leave balances
//     Promise.all([
//       axios.get("http://119.148.51.38:8000/api/hrms/api/employees/"),
//       axios.get("http://119.148.51.38:8000/api/hrms/api/tad_groups/"),
//       axios.get("http://119.148.51.38:8000/api/hrms/api/departments/"),
//       axios.get(
//         "http://119.148.51.38:8000/api/hrms/api/employee_leave_balances/"
//       ),
//     ])
//       .then(([empRes, compRes, deptRes, balRes]) => {
//         // Changed parameter names
//         setEmployees(empRes.data);
//         setCompanies(compRes.data);
//         setDepartments(deptRes.data); // Now using the correct response for departments
//         setBalances(balRes.data);
//       })
//       .catch((err) => console.error("Error fetching data:", err));
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "employee") {
//       const selectedEmployee = employees.find(
//         (emp) => emp.id.toString() === value
//       );
//       if (selectedEmployee) {
//         setNewLeave((prev) => ({
//           ...prev,
//           employee: value,
//           employee_code: selectedEmployee.employee_id || "",
//           designation: selectedEmployee.designation || "",
//           department: selectedEmployee.department || "",
//           company: selectedEmployee.company || "",
//           personal_phone: selectedEmployee.personal_phone || "",
//           joining_date: selectedEmployee.joining_date || "",
//           email: selectedEmployee.email || "",
//           emergency_contact: selectedEmployee.emergency_contact || "",
//         }));

//         const selectedBalance = balances.find(
//           (balance) => balance.employee === selectedEmployee.id
//         );
//         setNewLeave((prev) => ({
//           ...prev,
//           balance: selectedBalance?.leave_balance || 0,
//           leave_balance: selectedBalance?.leave_balance || 0,
//         }));
//       }
//     } else {
//       setNewLeave((prev) => {
//         const updatedLeave = { ...prev, [name]: value };
//         if (updatedLeave.start_date && updatedLeave.end_date) {
//           const startDate = new Date(updatedLeave.start_date);
//           const endDate = new Date(updatedLeave.end_date);
//           if (startDate && endDate && !isNaN(startDate) && !isNaN(endDate)) {
//             updatedLeave.leave_days =
//               Math.ceil((endDate - startDate) / (1000 * 3600 * 24)) + 1;
//           }
//         }
//         return updatedLeave;
//       });
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const formatDate = (date) => {
//       const d = new Date(date);
//       return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : null;
//     };

//     const updatedLeave = {
//       ...newLeave,
//       to: newLeave.to || null,
//       date: newLeave.date || null,
//       reason: newLeave.reason || "",
//       date_of_joining_after_leave: formatDate(
//         newLeave.date_of_joining_after_leave
//       ),
//       actual_date_of_joining: formatDate(newLeave.actual_date_of_joining),
//     };

//     axios
//       .post(
//         "http://119.148.51.38:8000/api/hrms/api/employee_leaves/",
//         updatedLeave
//       )
//       .then(() => {
//         navigate("/employee_leave");
//       })
//       .catch((err) =>
//         console.error("Error adding leave record:", err.response?.data || err)
//       )
//       .finally(() => setLoading(false));
//   };

//   const containerStyle = {
//     display: "flex",
//   };

//   const mainContentStyle = {
//     flex: 1,
//     padding: "30px",
//     backgroundColor: "#A7D5E1",
//   };

//   const headingStyle = {
//     fontSize: "24px",
//     fontWeight: "bold",
//     marginBottom: "30px",
//     color: "#2b5797",
//     textAlign: "center",
//   };

//   const formGrid = {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//     gap: "20px",
//   };

//   const inputGroup = {
//     display: "flex",
//     flexDirection: "column",
//   };

//   const labelStyle = {
//     fontWeight: "600",
//     marginBottom: "6px",
//   };

//   const inputStyle = {
//     padding: "10px",
//     borderRadius: "6px",
//     border: "1px solid #ccc",
//     fontSize: "14px",
//     backgroundColor: "#DCEEF3",
//   };

//   const textareaStyle = { ...inputStyle, height: "80px" };

//   const buttonStyle = {
//     display: "block",
//     margin: "20px auto",
//     padding: "10px 20px",
//     backgroundColor: "#4CAF50",
//     color: "white",
//     border: "none",
//     borderRadius: "4px",
//     cursor: "pointer",
//     fontSize: "16px",
//   };

//   const buttonContainerStyle = {
//     display: "flex",
//     justifyContent: "center",
//     marginTop: "20px",
//   };

//   return (
//     <div style={containerStyle}>
//       <div style={{ display: "flex" }}>
//         <Sidebars />
//       </div>
//       <div style={mainContentStyle}>
//         <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
//           <h3 style={headingStyle}>Add New Leave Request</h3>
//           <form>
//             {" "}
//             {/* Removed onSubmit from form tag */}
//             <div style={formGrid}>
//               {[
//                 {
//                   label: "Employee",
//                   name: "employee",
//                   type: "select",
//                   options: employees,
//                   optionLabel: "name",
//                 },
//                 { label: "Employee Code", name: "employee_code" },
//                 { label: "Designation", name: "designation" },
//                 { label: "Joining Date", name: "joining_date", type: "date" },
//                 {
//                   label: "Department",
//                   name: "department",
//                   type: "select",
//                   options: departments,
//                   optionLabel: "department_name",
//                 },
//                 {
//                   label: "Company",
//                   name: "company",
//                   type: "select",
//                   options: companies,
//                   optionLabel: "company_name",
//                 },
//                 { label: "Personal Phone", name: "personal_phone" },
//                 { label: "Emergency Contact", name: "emergency_contact" },
//                 { label: "Email", name: "email", type: "email" },
//                 { label: "Substitute Person", name: "sub_person" },
//                 { label: "Receiver Name", name: "receiver_name" },
//                 { label: "To", name: "to" },
//                 { label: "Date", name: "date", type: "date" },
//                 { label: "Start Date", name: "start_date", type: "date" },
//                 { label: "End Date", name: "end_date", type: "date" },
//                 {
//                   label: "Leave Days",
//                   name: "leave_days",
//                   type: "number",
//                   readOnly: true,
//                   value: newLeave.leave_days,
//                 },
//                 {
//                   label: "Balance",
//                   name: "balance",
//                   type: "number",
//                   readOnly: true,
//                   value: newLeave.balance,
//                 },
//                 { label: "Where abouts", name: "whereabouts" },
//                 {
//                   label: "Leave Type",
//                   name: "leave_type",
//                   type: "select",
//                   options: [
//                     {
//                       id: "public_festival_holiday",
//                       name: "Public Festival Holiday",
//                     },
//                     { id: "casual_leave", name: "Casual Leave" },
//                     { id: "sick_leave", name: "Sick Leave" },
//                     { id: "earned_leave", name: "Earned Leave" },
//                   ],
//                 },
//                 {
//                   label: "Date of Joining After Leave",
//                   name: "date_of_joining_after_leave",
//                   type: "date",
//                 },
//                 {
//                   label: "Actual Date of Joining",
//                   name: "actual_date_of_joining",
//                   type: "date",
//                 },
//                 { label: "Reason for Delay", name: "reson_for_delay" },
//                 {
//                   label: "Status",
//                   name: "status",
//                   type: "select",
//                   options: [
//                     { id: "pending", name: "Pending" },
//                     { id: "approved", name: "Approved" },
//                     { id: "rejected", name: "Rejected" },
//                   ],
//                   disabled: true,
//                 },
//               ].map((field) => (
//                 <div key={field.name} style={inputGroup}>
//                   <label style={labelStyle}>{field.label}:</label>
//                   {field.type === "select" ? (
//                     <select
//                       name={field.name}
//                       value={newLeave[field.name]}
//                       onChange={handleInputChange}
//                       style={inputStyle}
//                       disabled={field.disabled}
//                     >
//                       <option value="">Select {field.label}</option>
//                       {field.options.map((option) => (
//                         <option key={option.id} value={option.id}>
//                           {option[field.optionLabel] || option.name}
//                         </option>
//                       ))}
//                     </select>
//                   ) : (
//                     <input
//                       type={field.type || "text"}
//                       name={field.name}
//                       value={newLeave[field.name]}
//                       onChange={handleInputChange}
//                       style={inputStyle}
//                       readOnly={field.readOnly}
//                       disabled={field.readOnly}
//                     />
//                   )}
//                 </div>
//               ))}
//               <div style={{ ...inputGroup, gridColumn: "1 / -1" }}>
//                 <label style={labelStyle}>Leave Reason:</label>
//                 <textarea
//                   name="reason"
//                   value={newLeave.reason}
//                   onChange={handleInputChange}
//                   style={textareaStyle}
//                 />
//               </div>
//             </div>
//           </form>
//           <div style={buttonContainerStyle}>
//             <button
//               type="button"
//               style={buttonStyle}
//               disabled={loading}
//               onClick={handleSubmit}
//             >
//               {loading ? "Submitting..." : "Submit"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddLeaveRequest;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, compRes, deptRes, balRes] = await Promise.all([
          axios.get("http://119.148.51.38:8000/api/hrms/api/employees/"),
          axios.get("http://119.148.51.38:8000/api/hrms/api/tad_groups/"),
          axios.get("http://119.148.51.38:8000/api/hrms/api/departments/"),
          axios.get(
            "http://119.148.51.38:8000/api/hrms/api/employee_leave_balances/"
          ),
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "employee") {
      const selectedEmployee = employees.find(
        (emp) => emp.id.toString() === value
      );
      if (selectedEmployee) {
        const selectedBalance = balances.find(
          (balance) => balance.employee === selectedEmployee.id
        );

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
          balance: selectedBalance?.leave_balance || 0,
          leave_balance: selectedBalance?.leave_balance || 0,
        }));
      }
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
    setLoading(true);

    try {
      await axios.post(
        "http://119.148.51.38:8000/api/hrms/api/employee_leaves/",
        {
          ...newLeave,
          to: newLeave.to || null,
          date: newLeave.date || null,
          reason: newLeave.reason || "",
          date_of_joining_after_leave:
            newLeave.date_of_joining_after_leave || null,
          actual_date_of_joining: newLeave.actual_date_of_joining || null,
        }
      );
      navigate("/employee_leave");
      alert("Leave request submitted successfully!");
    } catch (err) {
      console.error("Error adding leave record:", err);
      alert("Failed to submit leave request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
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
    },
    inputFocus: {
      outline: "none",
      borderColor: "#4299e1",
      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.2)",
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
    },
    primaryButtonHover: {
      backgroundColor: "#3182ce",
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
    },
    secondaryButtonHover: {
      backgroundColor: "#cbd5e0",
    },
    disabledButton: {
      opacity: "0.6",
      cursor: "not-allowed",
    },
    loadingIndicator: {
      display: "inline-block",
      marginLeft: "0.5rem",
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
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={styles.card}>
            <h2 style={styles.heading}>New Leave Request</h2>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Employee Information</h3>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Employee *</label>
                  <select
                    name="employee"
                    value={newLeave.employee}
                    onChange={handleInputChange}
                    style={{ ...styles.input, ...styles.select }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Employee Code</label>
                  <input
                    type="text"
                    name="employee_code"
                    value={newLeave.employee_code}
                    readOnly
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={newLeave.designation}
                    readOnly
                    style={styles.input}
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
                    style={styles.input}
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
                  <label style={styles.label}>Leave Type *</label>
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
                  <label style={styles.label}>Start Date *</label>
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
                  <label style={styles.label}>End Date *</label>
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
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Current Balance</label>
                  <input
                    type="number"
                    name="balance"
                    value={newLeave.balance}
                    readOnly
                    style={styles.input}
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
                <label style={styles.label}>Leave Reason *</label>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLeaveRequest;
