import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

const EditAppraisal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    designation: "",
    joining_date: "",
    department: "",
    department_name: "",
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
    // Fetch departments list
    axios
      .get("http://119.148.12.1:8000/api/hrms/api/departments/")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Error fetching departments:", err));

    // Fetch appraisal data
    axios
      .get(
        `http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/${id}/`
      )
      .then((res) => {
        const departmentName = res.data.department
          ? departments.find((d) => d.id === res.data.department)
              ?.department_name
          : "";

        setFormData({
          ...res.data,
          department_name: departmentName,
        });
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    // Handle department selection
    if (name === "department") {
      const selectedDept = departments.find((d) => d.id.toString() === value);
      setFormData({
        ...formData,
        department: value,
        department_name: selectedDept ? selectedDept.department_name : "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create a copy of formData without department_name for submission
      const submissionData = { ...formData };
      delete submissionData.department_name;

      await axios.put(
        `http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/${id}/`,
        submissionData
      );
      alert("Appraisal updated successfully!");
      navigate("/performanse_appraisal");
    } catch (error) {
      console.error("Error updating appraisal:", error);
      alert("Failed to update appraisal. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={styles.card}>
            <h2 style={styles.title}>Edit Performance Appraisal</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Personal Information Section */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Personal Information</h3>
                <div style={styles.gridContainer}>
                  {/* Employee ID */}
                  <div style={styles.field}>
                    <label style={styles.label}>Employee ID</label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id || ""}
                      onChange={handleChange}
                      required
                      style={styles.input}
                    />
                  </div>

                  {/* Name */}
                  <div style={styles.field}>
                    <label style={styles.label}>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      required
                      style={styles.input}
                    />
                  </div>

                  {/* Department - Updated to show name */}
                  <div style={styles.field}>
                    <label style={styles.label}>Department</label>
                    <select
                      name="department"
                      value={formData.department || ""}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Other fields remain the same */}
                  {[
                    "designation",
                    "joining_date",
                    "last_increment_date",
                    "last_promotion_date",
                    "last_education",
                  ].map((field) => (
                    <div key={field} style={styles.field}>
                      <label style={styles.label}>
                        {field
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </label>
                      <input
                        type={field.includes("date") ? "date" : "text"}
                        name={field}
                        value={formData[field] || ""}
                        onChange={handleChange}
                        required={field !== "last_education"}
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics Section */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Performance Metrics</h3>
                <div style={styles.gridContainer}>
                  {[
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
                  ].map((field) => (
                    <React.Fragment key={field}>
                      <div style={styles.field}>
                        <label style={styles.label}>
                          {field
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}{" "}
                          (1-5)
                        </label>
                        <select
                          name={field}
                          value={formData[field] || ""}
                          onChange={handleChange}
                          style={styles.input}
                        >
                          <option value="">Select rating</option>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>
                          {field
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}{" "}
                          Description
                        </label>
                        <textarea
                          name={`${field}_description`}
                          value={formData[`${field}_description`] || ""}
                          onChange={handleChange}
                          style={{ ...styles.input, minHeight: "80px" }}
                          placeholder={`Describe ${field.replace(/_/g, " ")}`}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Recommendations Section */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Recommendations</h3>
                <div style={styles.checkboxGroup}>
                  {["promotion", "increment", "performance_reward"].map(
                    (field) => (
                      <label key={field} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          name={field}
                          checked={formData[field]}
                          onChange={handleChange}
                          style={styles.checkbox}
                        />
                        {field
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Salary & Designation Section */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Salary & Designation</h3>
                <div
                  style={{
                    ...styles.gridContainer,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <div style={styles.salaryColumn}>
                    <h4 style={styles.columnHeader}>Present</h4>
                    <div style={styles.field}>
                      <label style={styles.label}>Salary</label>
                      <input
                        type="number"
                        name="present_salary"
                        value={formData.present_salary || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Designation</label>
                      <input
                        type="text"
                        name="present_designation"
                        value={formData.present_designation || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.salaryColumn}>
                    <h4 style={styles.columnHeader}>Proposed</h4>
                    <div style={styles.field}>
                      <label style={styles.label}>Salary</label>
                      <input
                        type="number"
                        name="proposed_salary"
                        value={formData.proposed_salary || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Designation</label>
                      <input
                        type="text"
                        name="proposed_designation"
                        value={formData.proposed_designation || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Performance Summary</h3>
                <div style={styles.gridContainer}>
                  <div style={styles.field}>
                    <label style={styles.label}>Current Performance</label>
                    <textarea
                      name="performance"
                      value={formData.performance || ""}
                      onChange={handleChange}
                      style={{ ...styles.input, minHeight: "100px" }}
                      placeholder="Describe current performance..."
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Expected Performance</label>
                    <textarea
                      name="expected_performance"
                      value={formData.expected_performance || ""}
                      onChange={handleChange}
                      style={{ ...styles.input, minHeight: "100px" }}
                      placeholder="Describe expected performance..."
                    />
                  </div>
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.primaryButton}>
                  Update Appraisal
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/performanse_appraisal")}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mainContent: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
    padding: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    color: "#2c3e50",
    fontSize: "28px",
    fontWeight: "600",
    marginBottom: "32px",
    textAlign: "center",
    borderBottom: "2px solid #eaeaea",
    paddingBottom: "16px",
  },
  section: {
    marginBottom: "32px",
    padding: "20px",
    backgroundColor: "#f9fafc",
    borderRadius: "6px",
  },
  sectionTitle: {
    color: "#3498db",
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "20px",
    paddingBottom: "8px",
    borderBottom: "1px solid #eaeaea",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    color: "#555",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "14px",
    transition: "border 0.3s",
  },
  checkboxGroup: {
    display: "flex",
    gap: "24px",
    marginTop: "12px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  salaryColumn: {
    padding: "16px",
    backgroundColor: "#f0f7ff",
    borderRadius: "6px",
  },
  columnHeader: {
    color: "#2980b9",
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    textAlign: "center",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    marginTop: "32px",
  },
  primaryButton: {
    backgroundColor: "#3498db",
    color: "white",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "500",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  secondaryButton: {
    backgroundColor: "#f5f5f5",
    color: "#555",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "500",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

export default EditAppraisal;
