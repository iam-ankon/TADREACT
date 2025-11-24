import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCompanies, addEmployeeTermination } from "../../api/employeeApi";
import Sidebars from "./sidebars";

const AddTermination = () => {
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    designation: "",
    department: "",
    company: "",
    salary: "",
  });

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch the list of companies from the TAD group
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await getCompanies();
        setCompanies(response.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addEmployeeTermination(formData);
      alert("Employee termination added successfully!");
      navigate("/employee-termination");
    } catch (error) {
      console.error("Error adding employee termination:", error);
      alert("Failed to add employee termination. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebars />
      <div style={styles.mainContent}>
        <div style={styles.card}>
          <h2 style={styles.header}>Add Employee Termination</h2>
          <form onSubmit={handleSubmit}>
            {Object.keys(formData).map((key) =>
              key !== "company" ? (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>
                    {key.replace("_", " ").toUpperCase()}
                  </label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              ) : (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.label}>Company</label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.id} - {company.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
            <button 
              type="submit" 
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f4f7fc",
  },
  mainContent: {
    flex: 1,
    padding: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    width: "400px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  header: {
    textAlign: "center",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#333",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.3s",
    marginBottom: "12px",
  },
  submitButton: {
    backgroundColor: "#0078d4",
    color: "white",
    padding: "12px",
    width: "100%",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

export default AddTermination;