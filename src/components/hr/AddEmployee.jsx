import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

const AddEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name, position_for, email, phone, age, date_of_birth } =
    location.state || {};

  const [formData, setFormData] = useState({
    device_user_id: "",
    employee_id: "",
    name: name || "",
    designation: position_for || "",
    email: email || "",
    personal_phone: phone || "",
    joining_date: "",
    date_of_birth: date_of_birth || age || "",
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
    emergency_contact: "",
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, customersRes, departmentsRes] = await Promise.all([
          axios.get("http://119.148.12.1:8000/api/hrms/api/tad_groups/"),
          axios.get("http://119.148.12.1:8000/api/hrms/api/customers/"),
          axios.get("http://119.148.12.1:8000/api/hrms/api/departments/"),
        ]);
        setCompanies(companiesRes.data);
        setCustomers(customersRes.data);
        setDepartments(departmentsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employee_id)
      newErrors.employee_id = "Employee ID is required";
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.designation)
      newErrors.designation = "Designation is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.joining_date)
      newErrors.joining_date = "Joining date is required";
    if (!formData.date_of_birth)
      newErrors.date_of_birth = "Date of birth is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

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
      await axios.post(
        "http://119.148.12.1:8000/api/hrms/api/employees/",
        employeeFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setSuccessMessage("Employee saved successfully!");
      setShowPopup(true);

      setTimeout(() => {
        setIsLoading(false);
        navigate("/employees");
      }, 1500);
    } catch (error) {
      console.error("Error saving employee data:", error);
      setSuccessMessage("Error saving employee data. Please try again.");
      setIsLoading(false);
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
      border: "1px solid #ddd",
    },
    inputError: {
      width: "100%",
      padding: "8px",
      marginBottom: "10px",
      backgroundColor: "#DCEEF3",
      border: "1px solid red",
    },
    errorText: {
      color: "red",
      fontSize: "12px",
      marginTop: "-8px",
      marginBottom: "10px",
      display: "block",
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
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "500",
    },
    fileInput: {
      padding: "10px",
      border: "1px solid #ddd",
      marginBottom: "10px",
      width: "100%",
    },
    checkboxContainer: {
      maxHeight: "120px",
      overflowY: "auto",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "10px",
      backgroundColor: "#DCEEF3",
    },
    checkboxItem: {
      display: "flex",
      alignItems: "center",
      marginBottom: "8px",
    },
    checkboxInput: {
      marginRight: "10px",
      appearance: "none",
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
      fontSize: "14px",
      cursor: "pointer",
    },
    sectionTitle: {
      gridColumn: "1 / -1",
      fontSize: "18px",
      fontWeight: "bold",
      margin: "20px 0 10px",
      paddingBottom: "5px",
      borderBottom: "2px solid #0078D4",
    },
  };

  const sidebarStyle = {
    container: {
      display: "flex",
      backgroundColor: "#A7D5E1",
      minHeight: "100vh",
    },
  };

  const formFields = [
    // Personal Information
    { type: "section", label: "Personal Information" },
    { name: "name", label: "Name", required: true },
    { name: "employee_id", label: "Employee ID", required: true },
    { name: "designation", label: "Designation", required: true },
    { name: "email", label: "Email", required: true, type: "email" },
    { name: "personal_phone", label: "Personal Phone" },
    { name: "emergency_contact", label: "Emergency Contact" },
    {
      name: "date_of_birth",
      label: "Date of Birth",
      required: true,
      type: "date",
    },

    // Employment Details
    { type: "section", label: "Employment Details" },
    {
      name: "joining_date",
      label: "Joining Date",
      required: true,
      type: "date",
    },
    { name: "job_title", label: "Job Title" },
    {
      name: "department",
      label: "Department",
      type: "select",
      options: departments.map((d) => ({
        label: d.department_name,
        value: d.id,
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
    { name: "salary", label: "Salary", type: "number" },
    { name: "reporting_leader", label: "Reporting Leader" },

    // Contact Information
    { type: "section", label: "Contact Information" },
    { name: "mail_address", label: "Mail Address" },
    { name: "permanent_address", label: "Permanent Address" },
    { name: "office_phone", label: "Office Phone" },
    { name: "reference_phone", label: "Reference Phone" },

    // Additional Information
    { type: "section", label: "Additional Information" },
    { name: "special_skills", label: "Special Skills" },
    { name: "remarks", label: "Remarks" },
    { name: "device_user_id", label: "Device User ID" },

    // Customers
    { type: "section", label: "Customer Assignments" },
    {
      name: "customer",
      label: "Customer",
      type: "checkboxes",
      options: customers.map((c) => ({
        label: c.customer_name,
        value: c.id.toString(),
      })),
    },

    // Image Upload
    { type: "section", label: "Employee Image" },
    { name: "image1", label: "Upload Image", type: "file" },
  ];

  return (
    <div style={sidebarStyle.container}>
      <Sidebars />
      <div style={{ flexGrow: 1, padding: "30px" }}>
        <h2>Add Employee</h2>
        <div style={styles.popup}>{successMessage}</div>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <form onSubmit={handleSubmit} style={styles.form}>
            {formFields.map((field) => {
              if (field.type === "section") {
                return (
                  <div key={field.label} style={styles.sectionTitle}>
                    {field.label}
                  </div>
                );
              }

              return (
                <div key={field.name}>
                  <label style={styles.label}>
                    {field.label}
                    {field.required && <span style={{ color: "red" }}>*</span>}
                  </label>
                  {field.type === "select" ? (
                    <>
                      <select
                        name={field.name}
                        onChange={handleChange}
                        style={
                          errors[field.name] ? styles.inputError : styles.input
                        }
                        value={formData[field.name] || ""}
                        required={field.required}
                        disabled={isLoading}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((opt, idx) => (
                          <option key={idx} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {errors[field.name] && (
                        <span style={styles.errorText}>
                          {errors[field.name]}
                        </span>
                      )}
                    </>
                  ) : field.type === "checkboxes" ? (
                    <div style={styles.checkboxContainer}>
                      {field.options &&
                        field.options.map((opt) => (
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
                  ) : field.type === "file" ? (
                    <input
                      type="file"
                      name={field.name}
                      accept="image/*"
                      onChange={handleFileChange}
                      style={styles.fileInput}
                      disabled={isLoading}
                    />
                  ) : (
                    <>
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        onChange={handleChange}
                        style={
                          errors[field.name] ? styles.inputError : styles.input
                        }
                        value={formData[field.name] || ""}
                        required={field.required}
                        disabled={isLoading}
                      />
                      {errors[field.name] && (
                        <span style={styles.errorText}>
                          {errors[field.name]}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}

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
