import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

const EditAppraisal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    axios
      .get(
        `http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/${id}/`
      )
      .then((res) => setFormData(res.data))
      .catch((err) => console.error("Error fetching data:", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://119.148.12.1:8000/api/hrms/api/performanse_appraisals/${id}/`,
        formData
      );
      alert("Appraisal updated successfully!");
      navigate("/performanse_appraisal"); // Ensure the route exists
    } catch (error) {
      console.error("Error updating appraisal:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        
      }}
    >
      {/* Fixed Sidebar */}
      <div>
        <Sidebars />
      </div>

      {/* Main content */}
      <div style={containerStyle}>
        <div style={styles.container}>
          <h2 style={styles.title}>Edit Performance Appraisal</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* form fields */}
            <div style={styles.gridContainer}>
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
              <div style={styles.field}>
                <label style={styles.label}>Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Increment Date</label>
                <input
                  type="date"
                  name="last_increment_date"
                  value={formData.last_increment_date || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Promotion Date</label>
                <input
                  type="date"
                  name="last_promotion_date"
                  value={formData.last_promotion_date || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Education</label>
                <input
                  type="text"
                  name="last_education"
                  value={formData.last_education || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Job Knowledge</label>
                <input
                  type="text"
                  name="job_knowledge"
                  value={formData.job_knowledge || ""}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Job Description</label>
                <textarea
                  name="job_description"
                  value={formData.job_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Performance in Meetings</label>
                <input
                  type="text"
                  name="performance_in_meetings"
                  value={formData.performance_in_meetings || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Performance Description</label>
                <textarea
                  name="performance_description"
                  value={formData.performance_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Communication Skills</label>
                <input
                  type="text"
                  name="communication_skills"
                  value={formData.communication_skills || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Communication Description</label>
                <textarea
                  name="communication_description"
                  value={formData.communication_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Reliability</label>
                <input
                  type="text"
                  name="reliability"
                  value={formData.reliability || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Reliability Description</label>
                <textarea
                  name="reliability_description"
                  value={formData.reliability_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Initiative</label>
                <input
                  type="text"
                  name="initiative"
                  value={formData.initiative || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Initiative Description</label>
                <textarea
                  name="initiative_description"
                  value={formData.initiative_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Stress Management</label>
                <input
                  type="text"
                  name="stress_management"
                  value={formData.stress_management || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>
                  Stress Management Description
                </label>
                <textarea
                  name="stress_management_description"
                  value={formData.stress_management_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Co-operation</label>
                <input
                  type="text"
                  name="co_operation"
                  value={formData.co_operation || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Co-operation Description</label>
                <textarea
                  name="co_operation_description"
                  value={formData.co_operation_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Leadership</label>
                <input
                  type="text"
                  name="leadership"
                  value={formData.leadership || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Leadership Description</label>
                <textarea
                  name="leadership_description"
                  value={formData.leadership_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Discipline</label>
                <input
                  type="text"
                  name="discipline"
                  value={formData.discipline || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Discipline Description</label>
                <textarea
                  name="discipline_description"
                  value={formData.discipline_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Ethical Considerations</label>
                <input
                  type="text"
                  name="ethical_considerations"
                  value={formData.ethical_considerations || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>
                  Ethical Considerations Description
                </label>
                <textarea
                  name="ethical_considerations_description"
                  value={formData.ethical_considerations_description || ""}
                  onChange={handleChange}
                  style={styles.input}
                ></textarea>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Promotion</label>
                <input
                  type="checkbox"
                  name="promotion"
                  checked={formData.promotion}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Increment</label>
                <input
                  type="checkbox"
                  name="increment"
                  checked={formData.increment}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Performance Reward</label>
                <input
                  type="checkbox"
                  name="performance_reward"
                  checked={formData.performance_reward}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Performance</label>
                <input
                  type="text"
                  name="performance"
                  value={formData.performance || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Expected Performance</label>
                <input
                  type="text"
                  name="expected_performance"
                  value={formData.expected_performance || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Present Salary</label>
                <input
                  type="number"
                  name="present_salary"
                  value={formData.present_salary || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Proposed Salary</label>
                <input
                  type="number"
                  name="proposed_salary"
                  value={formData.proposed_salary || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Present Designation</label>
                <input
                  type="text"
                  name="present_designation"
                  value={formData.present_designation || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Proposed Designation</label>
                <input
                  type="text"
                  name="proposed_designation"
                  value={formData.proposed_designation || ""}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>
              Update Appraisal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Styles (same as before)
const styles = {
  container: {
    width: "70%",
    margin: "30px auto",
    
    background: "#f3f3f3",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
  },
  title: {
    textAlign: "center",
    color: "#0078D4",
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "600",
  },
  form: { display: "flex", flexDirection: "column" },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  field: { display: "flex", flexDirection: "column" },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "5px",
    color: "#333",
  },
  input: {
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    outline: "none",
  },
  checkbox: { marginTop: "5px" },
  submitButton: {
    backgroundColor: "#0078D4",
    color: "white",
    padding: "12px",
    fontSize: "16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "20px",
    width: "20%",
  },
};
const containerStyle = {
  backgroundColor: "#A7D5E1",
  width: "100%",
  overflowY: "auto",
  padding: "2px",
  
};

export default EditAppraisal;
