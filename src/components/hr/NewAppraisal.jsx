import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebars from "./sidebars";

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

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/employees/"
        );
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
      const selectedEmployee = employees.find(
        (emp) => emp.employee_id === selectedEmployeeId
      );

      if (selectedEmployee) {
        setFormData((prev) => ({
          ...prev,
          employee_id: selectedEmployee.employee_id,
          name: selectedEmployee.name,
          designation: selectedEmployee.designation,
          joining_date: selectedEmployee.joining_date,
          department: selectedEmployee.department_name || "",
          present_designation: selectedEmployee.designation,
          present_salary: selectedEmployee.salary || "",
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

    // Convert empty string number fields to null
    const numberFields = [
      "job_knowledge",
      "performance_in_meetings",
      "communication_skills",
      "reliability",
      "initiative",
      "stress_management",
      "co_operation",
      "leadership",
      "discipline",
      "ethical_considerations",
    ];

    const cleanFormData = {
      ...formData,
      ...Object.fromEntries(
        numberFields.map((field) => [
          field,
          formData[field] === "" ? null : parseInt(formData[field]),
        ])
      ),
    };

    try {
      await axios.post(
        "http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/",
        cleanFormData
      );
      alert("Appraisal Added Successfully!");

      // Reset form
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

  // Styles
  const containerStyle = {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "15px",
    overflow: "auto",
  };

  const formContainerStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    padding: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: "32px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
  };

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  };

  const sectionContainerStyle = {
    gridColumn: "span 1",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  };

  const sectionTitleStyle = {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
  };

  const fieldContainerStyle = {
    marginBottom: "16px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: "6px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "white",
    transition: "border-color 0.2s",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "16px",
    cursor: "pointer",
  };

  const checkboxContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  };

  const checkboxStyle = {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
    cursor: "pointer",
  };

  const buttonContainerStyle = {
    gridColumn: "span 2",
    display: "flex",
    justifyContent: "center",
    marginTop: "24px",
  };

  const buttonStyle = {
    padding: "12px 24px",
    borderRadius: "6px",
    backgroundColor: "#3b82f6",
    color: "white",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.2s",
  };

  const buttonHoverStyle = {
    backgroundColor: "#2563eb",
  };

  return (
    <div style={containerStyle}>
      <Sidebars />
      <div style={mainContentStyle}>
        <div style={formContainerStyle}>
          <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <h2 style={titleStyle}>Add New Performance Appraisal</h2>
            <form onSubmit={handleSubmit} style={formGridStyle}>
              {/* Employee Information Section */}
              <div style={sectionContainerStyle}>
                <h3 style={sectionTitleStyle}>Employee Information</h3>

                <div style={fieldContainerStyle}>
                  <label htmlFor="employee-select" style={labelStyle}>
                    Employee Name
                  </label>
                  <select
                    id="employee-select"
                    onChange={handleEmployeeSelect}
                    style={selectStyle}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map((employee) => (
                      <option
                        key={employee.employee_id}
                        value={employee.employee_id}
                      >
                        {employee.name} ({employee.employee_id}) -{" "}
                        {employee.designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="employee_id" style={labelStyle}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    id="employee_id"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="designation" style={labelStyle}>
                    Designation
                  </label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="joining_date" style={labelStyle}>
                    Joining Date
                  </label>
                  <input
                    type="date"
                    id="joining_date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="department" style={labelStyle}>
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="last_increment_date" style={labelStyle}>
                    Last Increment Date
                  </label>
                  <input
                    type="date"
                    id="last_increment_date"
                    name="last_increment_date"
                    value={formData.last_increment_date}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="last_promotion_date" style={labelStyle}>
                    Last Promotion Date
                  </label>
                  <input
                    type="date"
                    id="last_promotion_date"
                    name="last_promotion_date"
                    value={formData.last_promotion_date}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="last_education" style={labelStyle}>
                    Last Education
                  </label>
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

              {/* Performance and Salary Details Section */}
              <div style={sectionContainerStyle}>
                <h3 style={sectionTitleStyle}>
                  Performance and Salary Details
                </h3>

                <div style={fieldContainerStyle}>
                  <label htmlFor="performance" style={labelStyle}>
                    Performance
                  </label>
                  <textarea
                    type="text"
                    id="performance"
                    name="performance"
                    value={formData.performance}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="expected_performance" style={labelStyle}>
                    Expected Performance
                  </label>
                  <textarea
                    type="text"
                    id="expected_performance"
                    name="expected_performance"
                    value={formData.expected_performance}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="present_salary" style={labelStyle}>
                    Present Salary
                  </label>
                  <input
                    type="text"
                    id="present_salary"
                    name="present_salary"
                    value={formData.present_salary}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="proposed_salary" style={labelStyle}>
                    Proposed Salary
                  </label>
                  <input
                    type="text"
                    id="proposed_salary"
                    name="proposed_salary"
                    value={formData.proposed_salary}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="present_designation" style={labelStyle}>
                    Present Designation
                  </label>
                  <input
                    type="text"
                    id="present_designation"
                    name="present_designation"
                    value={formData.present_designation}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={fieldContainerStyle}>
                  <label htmlFor="proposed_designation" style={labelStyle}>
                    Proposed Designation
                  </label>
                  <input
                    type="text"
                    id="proposed_designation"
                    name="proposed_designation"
                    value={formData.proposed_designation}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h4
                    style={{
                      ...sectionTitleStyle,
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    Recommendations
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
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
              <div style={{ ...sectionContainerStyle, gridColumn: "span 2" }}>
                <h3 style={sectionTitleStyle}>Appraisal Details</h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "24px",
                  }}
                >
                  {/* Column 1 */}
                  <div>
                    <div style={fieldContainerStyle}>
                      <label htmlFor="job_knowledge" style={labelStyle}>
                        Job Knowledge (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="job_knowledge"
                        name="job_knowledge"
                        value={formData.job_knowledge}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label htmlFor="job_description" style={labelStyle}>
                        Job Description
                      </label>
                      <textarea
                        id="job_description"
                        name="job_description"
                        value={formData.job_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="performance_in_meetings"
                        style={labelStyle}
                      >
                        Performance in Meetings (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="performance_in_meetings"
                        name="performance_in_meetings"
                        value={formData.performance_in_meetings}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="performance_description"
                        style={labelStyle}
                      >
                        Performance Description
                      </label>
                      <textarea
                        id="performance_description"
                        name="performance_description"
                        value={formData.performance_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label htmlFor="communication_skills" style={labelStyle}>
                        Communication Skills (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="communication_skills"
                        name="communication_skills"
                        value={formData.communication_skills}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="communication_description"
                        style={labelStyle}
                      >
                        Communication Description
                      </label>
                      <textarea
                        id="communication_description"
                        name="communication_description"
                        value={formData.communication_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <div style={fieldContainerStyle}>
                      <label htmlFor="reliability" style={labelStyle}>
                        Reliability (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="reliability"
                        name="reliability"
                        value={formData.reliability}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="reliability_description"
                        style={labelStyle}
                      >
                        Reliability Description
                      </label>
                      <textarea
                        id="reliability_description"
                        name="reliability_description"
                        value={formData.reliability_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label htmlFor="initiative" style={labelStyle}>
                        Initiative (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="initiative"
                        name="initiative"
                        value={formData.initiative}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="initiative_description"
                        style={labelStyle}
                      >
                        Initiative Description
                      </label>
                      <textarea
                        id="initiative_description"
                        name="initiative_description"
                        value={formData.initiative_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label htmlFor="stress_management" style={labelStyle}>
                        Stress Management (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="stress_management"
                        name="stress_management"
                        value={formData.stress_management}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="stress_management_description"
                        style={labelStyle}
                      >
                        Stress Management Description
                      </label>
                      <textarea
                        id="stress_management_description"
                        name="stress_management_description"
                        value={formData.stress_management_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div>
                    <div style={fieldContainerStyle}>
                      <label htmlFor="co_operation" style={labelStyle}>
                        Co-operation (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="co_operation"
                        name="co_operation"
                        value={formData.co_operation}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="co_operation_description"
                        style={labelStyle}
                      >
                        Co-operation Description
                      </label>
                      <textarea
                        id="co_operation_description"
                        name="co_operation_description"
                        value={formData.co_operation_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label htmlFor="leadership" style={labelStyle}>
                        Leadership (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="leadership"
                        name="leadership"
                        value={formData.leadership}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="leadership_description"
                        style={labelStyle}
                      >
                        Leadership Description
                      </label>
                      <textarea
                        id="leadership_description"
                        name="leadership_description"
                        value={formData.leadership_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>
                  </div>

                  {/* Column 4 */}
                  <div>
                    <div style={fieldContainerStyle}>
                      <label htmlFor="discipline" style={labelStyle}>
                        Discipline (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="discipline"
                        name="discipline"
                        value={formData.discipline}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="discipline_description"
                        style={labelStyle}
                      >
                        Discipline Description
                      </label>
                      <textarea
                        id="discipline_description"
                        name="discipline_description"
                        value={formData.discipline_description}
                        onChange={handleChange}
                        style={textareaStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="ethical_considerations"
                        style={labelStyle}
                      >
                        Ethical Considerations (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        id="ethical_considerations"
                        name="ethical_considerations"
                        value={formData.ethical_considerations}
                        onChange={handleChange}
                        style={inputStyle}
                      />
                    </div>

                    <div style={fieldContainerStyle}>
                      <label
                        htmlFor="ethical_considerations_description"
                        style={labelStyle}
                      >
                        Ethical Considerations Description
                      </label>
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
            </form>
            <div style={buttonContainerStyle}>
              <button
                type="button"
                style={buttonStyle}
                onClick={handleSubmit} // ✅ Trigger submission manually
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor =
                    buttonHoverStyle.backgroundColor)
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = buttonStyle.backgroundColor)
                }
              >
                Submit Appraisal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAppraisal;
