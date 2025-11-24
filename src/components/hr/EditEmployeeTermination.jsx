import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getEmployeeTerminationById, 
  updateEmployeeTermination,
  getCompanies 
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const EditEmployeeTermination = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    designation: "",
    department: "",
    company: "",
    salary: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch companies list
        const companiesResponse = await getCompanies();
        setCompanies(companiesResponse.data || []);
        
        // Fetch employee termination details
        const employeeResponse = await getEmployeeTerminationById(id);
        setFormData(employeeResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateEmployeeTermination(id, formData);
      alert("Employee termination updated successfully!");
      navigate("/employee-termination");
    } catch (error) {
      console.error("Error updating employee termination:", error);
      alert("Failed to update employee termination. Please try again.");
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
        <h2>Edit Employee Termination</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="employee_id"
            placeholder="Employee ID"
            value={formData.employee_id || ""}
            onChange={handleChange}
            required
            style={styles.input}
            disabled={loading}
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name || ""}
            onChange={handleChange}
            required
            style={styles.input}
            disabled={loading}
          />
          <input
            type="text"
            name="designation"
            placeholder="Designation"
            value={formData.designation || ""}
            onChange={handleChange}
            required
            style={styles.input}
            disabled={loading}
          />
          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department || ""}
            onChange={handleChange}
            required
            style={styles.input}
            disabled={loading}
          />
          <select
            name="company"
            value={formData.company || ""}
            onChange={handleChange}
            required
            style={styles.select}
            disabled={loading}
          >
            <option value="">Select Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="salary"
            placeholder="Salary"
            value={formData.salary || ""}
            onChange={handleChange}
            required
            style={styles.input}
            disabled={loading}
          />
          <div style={styles.buttonGroup}>
            <button 
              type="submit" 
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Employee"}
            </button>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => navigate("/employee-termination")}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "18px",
  },
  mainContent: {
    flex: 1,
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  buttonGroup: {
    display: "flex",
    gap: "15px",
    marginTop: "10px",
  },
  submitBtn: {
    padding: "12px 24px",
    fontSize: "16px",
    backgroundColor: "#0078d4",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    flex: 1,
  },
  cancelBtn: {
    padding: "12px 24px",
    fontSize: "16px",
    backgroundColor: "#d9534f",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    flex: 1,
  },
};

// Add hover effects
styles.submitBtn = {
  ...styles.submitBtn,
  ':hover': {
    backgroundColor: "#005a9e",
  },
  ':disabled': {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  }
};

styles.cancelBtn = {
  ...styles.cancelBtn,
  ':hover': {
    backgroundColor: "#c12f2b",
  },
  ':disabled': {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  }
};

export default EditEmployeeTermination;