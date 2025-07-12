import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

const AddEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, position_for, email, phone } = location.state || {};

  const [formData, setFormData] = useState({
    device_user_id: "",
    employee_id: "",
    name: name || "",
    designation: position_for || "",
    email: email || "",
    personal_phone: phone || "",
    joining_date: "",
    date_of_birth: "",
    mail_address: "",
    office_phone: "",
    reference_phone: "",
    job_title: "",
    department: "",
    customer: [], // Initialize as an empty array for checkboxes
    company: "",
    salary: "",
    reporting_leader: "",
    special_skills: "",
    remarks: "",
    image1: null,
    permanent_address: "",
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]); // State for customers
  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/tad_groups/"
        );
        setCompanies(response.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    const fetchCustomers = async () => {
      try {
        const response = await axios.get(
          "http://119.148.12.1:8000/api/hrms/api/customers/"
        );
        setCustomers(response.data);
        console.log("Customers data:", response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCompanies();
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const customerId = value;

    setFormData((prevState) => {
      const updatedCustomers = [...prevState.customer];
      if (checked) {
        if (!updatedCustomers.includes(customerId)) {
          updatedCustomers.push(customerId);
        }
      } else {
        const index = updatedCustomers.indexOf(customerId);
        if (index > -1) {
          updatedCustomers.splice(index, 1);
        }
      }
      return { ...prevState, customer: updatedCustomers };
    });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Set loading to true when form is submitted

    const employeeFormData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "image1" && formData[key]) {
        employeeFormData.append(key, formData[key], formData[key].name);
      } else if (key === "customer") {
        formData[key].forEach((customerId) => {
          employeeFormData.append(key, customerId);
        });
      } else {
        employeeFormData.append(key, formData[key]);
      }
    });

    try {
      const response = await axios.post(
        "http://119.148.12.1:8000/api/hrms/api/employees/",
        employeeFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setSuccessMessage("Employee saved successfully!");
      setFormData({
        device_user_id: "",
        employee_id: "",
        name: "",
        designation: "",
        email: "",
        personal_phone: "",
        joining_date: "",
        date_of_birth: "",
        mail_address: "",
        office_phone: "",
        reference_phone: "",
        job_title: "",
        department: "",
        customer: [],
        company: "",
        salary: "",
        reporting_leader: "",
        special_skills: "",
        remarks: "",
        image1: null,
        permanent_address: "",
      });
      setShowPopup(true);

      // Wait a short time to show success message before redirecting
      setTimeout(() => {
        setIsLoading(false); // Set loading to false
        navigate("/employees"); // Navigate to employees page
      }, 1500);
    } catch (error) {
      console.error("Error saving employee data:", error);
      if (error.response) {
        console.error("Server responded with:", error.response.data);
        console.error("Status code:", error.response.status);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error setting up the request:", error.message);
      }
      setSuccessMessage("Error saving employee data. Please try again.");
      setIsLoading(false); // Set loading to false if there's an error
    }
  };

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1000px",
      margin: "auto",
      backgroundColor: "#A7D5E1",
      borderRadius: "8px",
    },
    input: {
      width: "100%",
      padding: "8px",
      marginBottom: "10px",
      backgroundColor: "#DCEEF3",
    },
    button: {
      padding: "10px",
      backgroundColor: isHovered ? "#005ea6" : "#0078D4",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: isLoading ? "not-allowed" : "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      transition: "background-color 0.3s, transform 0.2s",
      boxShadow: "2px 4px 6px rgba(0, 0, 0, 0.1)",
      width: "30%",
      marginTop: "50px",
      opacity: isLoading ? 0.7 : 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    loadingSpinner: {
      display: "inline-block",
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      borderTop: "3px solid #fff",
      animation: "spin 1s linear infinite",
      marginRight: "10px",
    },
    successMessage: {
      padding: "10px",
      backgroundColor: "#4CAF50",
      color: "#fff",
      marginBottom: "20px",
      borderRadius: "5px",
      textAlign: "center",
    },
    popup: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px",
      backgroundColor: "#4CAF50",
      color: "#fff",
      borderRadius: "5px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: 9999,
      display: showPopup ? "block" : "none",
    },
    form: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "20px",
    },
    label: { display: "block", marginBottom: "5px" },
    fileInput: {
      padding: "10px",
      border: "1px solid #ddd",
      marginBottom: "10px",
    },
    checkboxContainer: {
      maxHeight: "90px",
      overflowY: "auto",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "10px",
    },
    checkboxItem: {
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
    },
    checkboxInput: {
      marginRight: "10px",
      appearance: "none" /* Remove default checkbox styles */,
      width: "18px",
      height: "18px",
      border: "1px solid #ccc",
      borderRadius: "3px",
      background: "white",
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      outline: "none",
    },
    checkboxInputChecked: {
      background: "#007bff",
      borderColor: "#007bff",
    },
    checkboxLabel: {
      marginLeft: "0",
      fontSize: "16px",
      cursor: "pointer",
    },
  };

  // Add keyframe animation for the spinner
  const keyframes = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

  const sidebarStyle = {
    container: {
      display: "flex",
      backgroundColor: "#A7D5E1",
      minHeight: "100vh",
    },
  };

  return (
    <div style={sidebarStyle.container}>
      <Sidebars />
      <div style={{ flexGrow: 1, padding: "30px" }}>
        <h2>Add Employee</h2>
        {successMessage && (
          <div style={styles.successMessage}>{successMessage}</div>
        )}
        <div style={styles.popup}>{successMessage}</div>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: "device_user_id", label: "Device User ID" },
            { name: "employee_id", label: "Employee ID", required: true },
            { name: "name", label: "Name", required: true },
            { name: "designation", label: "Designation", required: true },
            { name: "email", label: "Email", required: true },
            { name: "personal_phone", label: "Personal Phone" },
            {
              name: "joining_date",
              label: "Joining Date",
              required: true,
              type: "date",
            },
            {
              name: "date_of_birth",
              label: "Date of Birth",
              required: true,
              type: "date",
            },
            { name: "mail_address", label: "Mail Address" },
            { name: "office_phone", label: "Office Phone" },
            { name: "reference_phone", label: "Reference Phone" },
            { name: "job_title", label: "Job Title" },
            { name: "department", label: "Department" },
            {
              name: "customer",
              label: "Customer",
              type: "checkboxes",
              options: customers.map((c) => ({
                label: c.customer_name,
                value: c.id.toString(), // Ensure value is a string for checkbox handling
              })),
            },
            {
              name: "company",
              label: "Company",
              type: "select",
              options: companies.map((c) => ({
                label: c.company_name,
                value: c.id,
              })),
            },
            { name: "salary", label: "Salary" },
            { name: "reporting_leader", label: "Reporting Leader" },
            { name: "special_skills", label: "Special Skills" },
            { name: "remarks", label: "Remarks" },
            { name: "permanent_address", label: "Permanent Address" },
          ].map(({ name, label, type = "text", options, required = false }) => (
            <div key={name}>
              <label style={styles.label}>
                {label}
                {required && <span style={{ color: "red" }}>*</span>}
              </label>
              {type === "select" ? (
                <select
                  name={name}
                  onChange={handleChange}
                  style={styles.input}
                  value={formData[name] || ""}
                  required={required}
                  disabled={isLoading}
                >
                  <option value="">Select {label}</option>
                  {options.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : type === "checkboxes" ? (
                <div style={styles.checkboxContainer}>
                  {options &&
                    options.map((opt) => (
                      <div key={opt.value} style={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`customer-${opt.value}`}
                          name="customer"
                          value={opt.value}
                          checked={formData.customer.includes(opt.value)}
                          onChange={handleCheckboxChange}
                          disabled={isLoading}
                          style={{
                            ...styles.checkboxInput,
                            ...(formData.customer.includes(opt.value) &&
                              styles.checkboxInputChecked),
                          }}
                        />
                        <label
                          htmlFor={`customer-${opt.value}`}
                          style={styles.checkboxLabel}
                        >
                          {opt.label}
                        </label>
                      </div>
                    ))}
                </div>
              ) : (
                <input
                  type={type}
                  name={name}
                  onChange={handleChange}
                  style={styles.input}
                  value={formData[name] || ""}
                  required={required}
                  disabled={isLoading}
                />
              )}
            </div>
          ))}

          <div>
            <label style={styles.label}>Upload Image</label>
            <input
              type="file"
              name="image1"
              accept="image/*"
              onChange={handleFileChange}
              style={styles.fileInput}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div style={styles.loadingSpinner}></div>
                Saving...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
