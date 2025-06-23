import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebars from "./sidebars"; // Adjust the import path as necessary

const NewAppraisal = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    designation: "",
    joining_date: "",
    department: "",
    last_increment_date: "",
    last_promotion_date: "",
    last_education: "",
    job_knowledge: "",
    job_description: "",
    performance_in_meetings: "",
    performance_description: "",
    communication_skills: "",
    communication_description: "",
    reliability: "",
    reliability_description: "",
    initiative: "",
    initiative_description: "",
    stress_management: "",
    stress_management_description: "",
    co_operation: "",
    co_operation_description: "",
    leadership: "",
    leadership_description: "",
    discipline: "",
    discipline_description: "",
    ethical_considerations: "",
    ethical_considerations_description: "",
    promotion: false,
    increment: false,
    performance_reward: false,
    performance: "",
    expected_performance: "",
    present_salary: "",
    proposed_salary: "",
    present_designation: "",
    proposed_designation: "",
  });

  // Fetch employees when component mounts
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get("http://119.148.12.1:8000/api/hrms/api/employees/");
        setEmployees(response.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  const handleEmployeeSelect = async (e) => {
    const selectedEmployeeId = e.target.value;
    if (!selectedEmployeeId) return;

    try {
      // Find the selected employee from the employees list
      const selectedEmployee = employees.find(emp => emp.employee_id === selectedEmployeeId);

      if (selectedEmployee) {
        // Update form data with employee details
        setFormData(prev => ({
          ...prev,
          employee_id: selectedEmployee.employee_id,
          name: selectedEmployee.name,
          designation: selectedEmployee.designation,
          joining_date: selectedEmployee.joining_date,
          department: selectedEmployee.department || "",
          present_designation: selectedEmployee.designation,
          present_salary: selectedEmployee.salary || "",
          // Add other fields as needed
        }));
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
    }
  };



  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/",
        formData
      );
      alert("Appraisal Added Successfully!");
      // Reset form after successful submission
      setFormData({
        employee_id: "",
        name: "",
        designation: "",
        joining_date: "",
        department: "",
        last_increment_date: "",
        last_promotion_date: "",
        last_education: "",
        job_knowledge: "",
        job_description: "",
        performance_in_meetings: "",
        performance_description: "",
        communication_skills: "",
        communication_description: "",
        reliability: "",
        reliability_description: "",
        initiative: "",
        initiative_description: "",
        stress_management: "",
        stress_management_description: "",
        co_operation: "",
        co_operation_description: "",
        leadership: "",
        leadership_description: "",
        discipline: "",
        discipline_description: "",
        ethical_considerations: "",
        ethical_considerations_description: "",
        promotion: false,
        increment: false,
        performance_reward: false,
        performance: "",
        expected_performance: "",
        present_salary: "",
        proposed_salary: "",
        present_designation: "",
        proposed_designation: "",
      });
    } catch (error) {
      console.error("Error adding appraisal:", error);
      alert("Failed to add appraisal. Please try again.");
    }
  };



  const mainContentStyle = {
    flex: 1,
    padding: "30px",

    margin: "0 auto",
  };

  const formContainerStyle = {
    backgroundColor: "#f4f5f7",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    margin: "0 auto",
  };

  const titleStyle = {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: "20px",
  };

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
  };

  const sectionContainerStyle = {
    gridColumn: "span 1",
    backgroundColor: "#fff",
    borderRadius: "6px",
    padding: "15px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  };

  const sectionTitleStyle = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",

    marginBottom: "15px",
    paddingBottom: "5px",
    borderBottom: "1px solid #eee",
  };

  const fieldContainerStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const labelContainerStyle = {
    marginBottom: "5px",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "bold",
  };

  const inputContainerStyle = {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    // Add any specific styling for the input container if needed
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  };

  const textareaStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    height: "50px",
    resize: "vertical",
    gridColumn: "span 2",
    width: "100%",
    boxSizing: "border-box",
  };

  const checkboxContainerStyle = {
    display: "flex",
    alignItems: "center",
  };

  const checkboxStyle = {
    marginRight: "8px",
  };

  const buttonContainerStyle = {
    gridColumn: "span 2",
    display: "flex",
    justifyContent: "center",
  };

  const buttonStyle = {
    padding: "12px 20px",
    borderRadius: "6px",
    backgroundColor: "#0078d4",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    border: "none",
    width: "auto",
  };

  const buttonHoverStyle = {
    backgroundColor: "#005a9e",
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={mainContentStyle}>
            <div style={formContainerStyle}>
              <h2 style={titleStyle}>Add New Performance Appraisal</h2>
              <form onSubmit={handleSubmit} style={formGridStyle}>
                {/* Employee Information Section */}
                <div style={sectionContainerStyle}>
                  <h3 style={sectionTitleStyle}>Employee Information</h3>
                  <div style={formGridStyle}>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="employee_id" style={labelStyle}>
                          EMPLOYEE ID
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="employee_id"
                          name="employee_id"
                          value={formData.employee_id}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <label
                          htmlFor="employee-select"
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "4px"
                          }}
                        >
                          Employee Name
                        </label>
                      </div>
                      <div style={{ position: "relative" }}>
                        <select
                          id="employee-select"
                          onChange={handleEmployeeSelect}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            fontSize: "14px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#fff",
                            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                            transition: "all 0.2s ease",
                            appearance: "none",
                            backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 10px center",
                            backgroundSize: "16px",
                            cursor: "pointer",
                            ":hover": {
                              borderColor: "#9ca3af"
                            },
                            ":focus": {
                              outline: "none",
                              borderColor: "#3b82f6",
                              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
                            }
                          }}
                        >
                          <option value="">-- Select Employee --</option>
                          {employees.map((employee) => (
                            <option
                              key={employee.employee_id}
                              value={employee.employee_id}
                            >
                              {employee.name} ({employee.employee_id}) - {employee.designation}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="designation" style={labelStyle}>
                          DESIGNATION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="designation"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="joining_date" style={labelStyle}>
                          JOINING DATE
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="date"
                          id="joining_date"
                          name="joining_date"
                          value={formData.joining_date}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="department" style={labelStyle}>
                          DEPARTMENT
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="last_increment_date" style={labelStyle}>
                          LAST INCREMENT DATE
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="date"
                          id="last_increment_date"
                          name="last_increment_date"
                          value={formData.last_increment_date}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="last_promotion_date" style={labelStyle}>
                          LAST PROMOTION DATE
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="date"
                          id="last_promotion_date"
                          name="last_promotion_date"
                          value={formData.last_promotion_date}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="last_education" style={labelStyle}>
                          LAST EDUCATION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="last_education"
                          name="last_education"
                          value={formData.last_education}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Performance and Salary Details Section */}

                  <h3 style={sectionTitleStyle}>Performance and Salary Details</h3>
                  <div style={formGridStyle}>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="performance" style={labelStyle}>
                          PERFORMANCE
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="performance"
                          name="performance"
                          value={formData.performance}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="expected_performance" style={labelStyle}>
                          EXPECTED PERFORMANCE
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="expected_performance"
                          name="expected_performance"
                          value={formData.expected_performance}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="present_salary" style={labelStyle}>
                          PRESENT SALARY
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="present_salary"
                          name="present_salary"
                          value={formData.present_salary}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="proposed_salary" style={labelStyle}>
                          PROPOSED SALARY
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="proposed_salary"
                          name="proposed_salary"
                          value={formData.proposed_salary}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="present_designation" style={labelStyle}>
                          PRESENT DESIGNATION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="present_designation"
                          name="present_designation"
                          value={formData.present_designation}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="proposed_designation" style={labelStyle}>
                          PROPOSED DESIGNATION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="text"
                          id="proposed_designation"
                          name="proposed_designation"
                          value={formData.proposed_designation}
                          onChange={handleChange}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Recommendations */}
                  <div style={{ gridColumn: "span 2", marginTop: "20px" }}>
                    <h3 style={{ marginBottom: "15px" }}>Recommendations</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
                      <div style={checkboxContainerStyle}>
                        <input
                          type="checkbox"
                          id="promotion"
                          name="promotion"
                          checked={formData.promotion}
                          onChange={handleCheckboxChange}
                          style={checkboxStyle}
                        />
                        <label htmlFor="promotion" style={labelStyle}>
                          Promotion
                        </label>
                      </div>
                      <div style={checkboxContainerStyle}>
                        <input
                          type="checkbox"
                          id="increment"
                          name="increment"
                          checked={formData.increment}
                          onChange={handleCheckboxChange}
                          style={checkboxStyle}
                        />
                        <label htmlFor="increment" style={labelStyle}>
                          Increment
                        </label>
                      </div>
                      <div style={checkboxContainerStyle}>
                        <input
                          type="checkbox"
                          id="performance_reward"
                          name="performance_reward"
                          checked={formData.performance_reward}
                          onChange={handleCheckboxChange}
                          style={checkboxStyle}
                        />
                        <label htmlFor="performance_reward" style={labelStyle}>
                          Performance Reward
                        </label>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Appraisal Details Section */}
                <div style={sectionContainerStyle}>
                  <h3 style={sectionTitleStyle}>Appraisal Details</h3>
                  <div style={formGridStyle}>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="job_knowledge" style={labelStyle}>
                          JOB KNOWLEDGE (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="job_knowledge"
                          name="job_knowledge"
                          value={formData.job_knowledge}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="job_description" style={labelStyle}>
                          JOB DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="job_description"
                          name="job_description"
                          value={formData.job_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="performance_in_meetings" style={labelStyle}>
                          PERFORMANCE IN MEETINGS (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="performance_in_meetings"
                          name="performance_in_meetings"
                          value={formData.performance_in_meetings}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="performance_description" style={labelStyle}>
                          PERFORMANCE DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="performance_description"
                          name="performance_description"
                          value={formData.performance_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="communication_skills" style={labelStyle}>
                          COMMUNICATION SKILLS (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="communication_skills"
                          name="communication_skills"
                          value={formData.communication_skills}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="communication_description" style={labelStyle}>
                          COMMUNICATION DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="communication_description"
                          name="communication_description"
                          value={formData.communication_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="reliability" style={labelStyle}>
                          RELIABILITY (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="reliability"
                          name="reliability"
                          value={formData.reliability}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="reliability_description" style={labelStyle}>
                          RELIABILITY DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="reliability_description"
                          name="reliability_description"
                          value={formData.reliability_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="initiative" style={labelStyle}>
                          INITIATIVE (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="initiative"
                          name="initiative"
                          value={formData.initiative}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="initiative_description" style={labelStyle}>
                          INITIATIVE DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="initiative_description"
                          name="initiative_description"
                          value={formData.initiative_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="stress_management" style={labelStyle}>
                          STRESS MANAGEMENT (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="stress_management"
                          name="stress_management"
                          value={formData.stress_management}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="stress_management_description" style={labelStyle}>
                          STRESS MANAGEMENT DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="stress_management_description"
                          name="stress_management_description"
                          value={formData.stress_management_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="co_operation" style={labelStyle}>
                          CO-OPERATION (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="co_operation"
                          name="co_operation"
                          value={formData.co_operation}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="co_operation_description" style={labelStyle}>
                          CO-OPERATION DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="co_operation_description"
                          name="co_operation_description"
                          value={formData.co_operation_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="leadership" style={labelStyle}>
                          LEADERSHIP (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="leadership"
                          name="leadership"
                          value={formData.leadership}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="leadership_description" style={labelStyle}>
                          LEADERSHIP DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="leadership_description"
                          name="leadership_description"
                          value={formData.leadership_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="discipline" style={labelStyle}>
                          DISCIPLINE (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="discipline"
                          name="discipline"
                          value={formData.discipline}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="discipline_description" style={labelStyle}>
                          DISCIPLINE DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="discipline_description"
                          name="discipline_description"
                          value={formData.discipline_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>
                    <div style={fieldContainerStyle}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="ethical_considerations" style={labelStyle}>
                          ETHICAL CONSIDERATIONS (1-5)
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          id="ethical_considerations"
                          name="ethical_considerations"
                          value={formData.ethical_considerations}
                          onChange={handleChange}
                          required
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: "span 1" }}>
                      <div style={labelContainerStyle}>
                        <label htmlFor="ethical_considerations_description" style={labelStyle}>
                          ETHICAL CONSIDERATIONS DESCRIPTION
                        </label>
                      </div>
                      <div style={inputContainerStyle}>
                        <textarea
                          id="ethical_considerations_description"
                          name="ethical_considerations_description"
                          value={formData.ethical_considerations_description}
                          onChange={handleChange}
                          style={textareaStyle}
                        />
                      </div>
                    </div>


                  </div>
                </div>



                {/* Submit Button */}
                <div style={buttonContainerStyle}>
                  <button
                    type="submit"
                    style={buttonStyle}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                  >
                    Submit Appraisal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAppraisal;