import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDepartments,
  getPerformanceAppraisalById,
  updatePerformanceAppraisal,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EditAppraisal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
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
    salary_text: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch departments list
        const deptResponse = await getDepartments();
        setDepartments(deptResponse.data || []);

        // Fetch appraisal data
        const appraisalResponse = await getPerformanceAppraisalById(id);
        const appraisalData = appraisalResponse.data;

        const departmentName = appraisalData.department
          ? (deptResponse.data || []).find(
              (d) => d.id === appraisalData.department
            )?.department_name
          : "";

        setFormData({
          ...appraisalData,
          department_name: departmentName,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Failed to load appraisal data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      setLoading(true);

      // Create a copy of formData without department_name for submission
      const submissionData = { ...formData };
      delete submissionData.department_name;

      await updatePerformanceAppraisal(id, submissionData);
      alert("Appraisal updated successfully!");
      navigate("/performanse_appraisal");
    } catch (error) {
      console.error("Error updating appraisal:", error);
      alert("Failed to update appraisal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.employee_id) {
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
          <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
            <h2 style={styles.title}>Edit Performance Appraisal</h2>
            <form onSubmit={handleSubmit} style={styles.formGrid}>
              {/* Employee Information Section */}
              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Employee Information</h3>

                <div style={styles.fieldContainer}>
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

                <div style={styles.fieldContainer}>
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

                <div style={styles.fieldContainer}>
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

                <div style={styles.fieldContainer}>
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

                <div style={styles.fieldContainer}>
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

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Increment Date</label>
                  <input
                    type="date"
                    name="last_increment_date"
                    value={formData.last_increment_date || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Promotion Date</label>
                  <input
                    type="date"
                    name="last_promotion_date"
                    value={formData.last_promotion_date || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Last Education</label>
                  <input
                    type="text"
                    name="last_education"
                    value={formData.last_education || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Performance and Salary Details Section */}
              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>
                  Performance and Salary Details
                </h3>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Performance</label>
                  <textarea
                    name="performance"
                    value={formData.performance || ""}
                    onChange={handleChange}
                    style={styles.textarea}
                    placeholder="Describe current performance..."
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Expected Performance</label>
                  <textarea
                    name="expected_performance"
                    value={formData.expected_performance || ""}
                    onChange={handleChange}
                    style={styles.textarea}
                    placeholder="Describe expected performance..."
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Present Salary</label>
                  <input
                    type="number"
                    name="present_salary"
                    value={formData.present_salary || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Proposed Salary</label>
                  <input
                    type="number"
                    name="proposed_salary"
                    value={formData.proposed_salary || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Proposed Salary Remarks</label>
                  <textarea
                    type="text"
                    name="salary_text"
                    value={formData.salary_text || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Present Designation</label>
                  <input
                    type="text"
                    name="present_designation"
                    value={formData.present_designation || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldContainer}>
                  <label style={styles.label}>Proposed Designation</label>
                  <input
                    type="text"
                    name="proposed_designation"
                    value={formData.proposed_designation || ""}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h4 style={styles.subSectionTitle}>Recommendations</h4>
                  <div style={styles.checkboxGroup}>
                    {["promotion", "increment", "performance_reward"].map(
                      (field) => (
                        <div key={field} style={styles.checkboxContainer}>
                          <input
                            type="checkbox"
                            name={field}
                            checked={formData[field]}
                            onChange={handleChange}
                            style={styles.checkbox}
                          />
                          <label style={styles.label}>
                            {field
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </label>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Appraisal Details Section */}
              <div style={{ ...styles.sectionContainer, gridColumn: "span 2" }}>
                <h3 style={styles.sectionTitle}>Appraisal Details</h3>
                <div style={styles.appraisalGrid}>
                  {/* Column 1 */}
                  <div>
                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Job Knowledge (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="job_knowledge"
                        value={formData.job_knowledge || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Job Description</label>
                      <textarea
                        name="job_description"
                        value={formData.job_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Performance in Meetings (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="performance_in_meetings"
                        value={formData.performance_in_meetings || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Performance Description
                      </label>
                      <textarea
                        name="performance_description"
                        value={formData.performance_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Communication Skills (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="communication_skills"
                        value={formData.communication_skills || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Communication Description
                      </label>
                      <textarea
                        name="communication_description"
                        value={formData.communication_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Reliability (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="reliability"
                        value={formData.reliability || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Reliability Description
                      </label>
                      <textarea
                        name="reliability_description"
                        value={formData.reliability_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Initiative (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="initiative"
                        value={formData.initiative || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Initiative Description</label>
                      <textarea
                        name="initiative_description"
                        value={formData.initiative_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Stress Management (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="stress_management"
                        value={formData.stress_management || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Stress Management Description
                      </label>
                      <textarea
                        name="stress_management_description"
                        value={formData.stress_management_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div>
                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Co-operation (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="co_operation"
                        value={formData.co_operation || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Co-operation Description
                      </label>
                      <textarea
                        name="co_operation_description"
                        value={formData.co_operation_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Leadership (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="leadership"
                        value={formData.leadership || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Leadership Description</label>
                      <textarea
                        name="leadership_description"
                        value={formData.leadership_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>
                  </div>

                  {/* Column 4 */}
                  <div>
                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Discipline (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="discipline"
                        value={formData.discipline || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>Discipline Description</label>
                      <textarea
                        name="discipline_description"
                        value={formData.discipline_description || ""}
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Ethical Considerations (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        name="ethical_considerations"
                        value={formData.ethical_considerations || ""}
                        onChange={handleChange}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.fieldContainer}>
                      <label style={styles.label}>
                        Ethical Considerations Description
                      </label>
                      <textarea
                        name="ethical_considerations_description"
                        value={
                          formData.ethical_considerations_description || ""
                        }
                        onChange={handleChange}
                        style={styles.textarea}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.buttonContainer}>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Appraisal"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/performanse_appraisal")}
                  style={styles.secondaryButton}
                  disabled={loading}
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
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
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
    padding: "15px",
    overflow: "auto",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    padding: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: "32px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
  },
  sectionContainer: {
    gridColumn: "span 1",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  subSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },
  fieldContainer: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "white",
    transition: "border-color 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "white",
    transition: "border-color 0.2s",
    minHeight: "80px",
    resize: "vertical",
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#3b82f6",
    cursor: "pointer",
  },
  appraisalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "24px",
  },
  buttonContainer: {
    gridColumn: "span 2",
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "24px",
  },
  button: {
    padding: "12px 24px",
    borderRadius: "6px",
    backgroundColor: "#3b82f6",
    color: "white",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.2s",
  },
  secondaryButton: {
    padding: "12px 24px",
    borderRadius: "6px",
    backgroundColor: "#f5f5f5",
    color: "#555",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    border: "1px solid #ddd",
    transition: "background-color 0.2s",
  },
};

export default EditAppraisal;
