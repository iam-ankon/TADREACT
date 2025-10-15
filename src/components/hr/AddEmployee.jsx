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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState("personal");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, customersRes, departmentsRes] = await Promise.all([
          axios.get("http://119.148.51.38:8000/api/hrms/api/tad_groups/"),
          axios.get("http://119.148.51.38:8000/api/hrms/api/customers/"),
          axios.get("http://119.148.51.38:8000/api/hrms/api/departments/"),
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
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
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
        "http://119.148.51.38:8000/api/hrms/api/employees/",
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

  // Form sections
  const formSections = [
    {
      id: "personal",
      title: "Personal Information",
      fields: [
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
      ],
    },
    {
      id: "employment",
      title: "Employment Details",
      fields: [
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
      ],
    },
    {
      id: "contact",
      title: "Contact Information",
      fields: [
        { name: "mail_address", label: "Mail Address" },
        { name: "permanent_address", label: "Permanent Address" },
        { name: "office_phone", label: "Office Phone" },
        { name: "reference_phone", label: "Reference Phone" },
      ],
    },
    {
      id: "additional",
      title: "Additional Information",
      fields: [
        { name: "special_skills", label: "Special Skills" },
        { name: "remarks", label: "Remarks" },
        { name: "device_user_id", label: "Device User ID" },
      ],
    },
    {
      id: "customers",
      title: "Customer Assignments",
      fields: [
        {
          name: "customer",
          label: "Customer",
          type: "checkboxes",
          options: customers.map((c) => ({
            label: c.customer_name,
            value: c.id.toString(),
          })),
        },
      ],
    },
    {
      id: "image",
      title: "Employee Image",
      fields: [{ name: "image1", label: "Upload Image", type: "file" }],
    },
  ];

  // Inline styles
  const styles = {
    container: {
      display: "flex",
      backgroundColor: "#f5f7f9",
      minHeight: "100vh",
      width: "100%",
      position: "relative",
    },
    sidebarWrapper: {
      flexShrink: 0,
      position: "sticky",
      top: 0,
      height: "100vh",
      zIndex: 100,
    },
    content: {
      flexGrow: 1,
      padding: "30px",
      maxWidth: "calc(100% - 250px)",
      marginLeft: "0",
      width: "100%",
      boxSizing: "border-box",
      overflow: "auto",
    },
    header: {
      marginBottom: "30px",
    },
    headerTitle: {
      color: "#2c3e50",
      marginBottom: "8px",
      fontSize: "28px",
    },
    headerSubtitle: {
      color: "#7f8c8d",
      margin: "0",
    },
    navigation: {
      display: "flex",
      overflowX: "auto",
      marginBottom: "25px",
      paddingBottom: "5px",
      borderBottom: "1px solid #e0e6ed",
    },
    navButton: {
      background: "none",
      border: "none",
      padding: "12px 20px",
      marginRight: "10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      whiteSpace: "nowrap",
      color: "#5c6bc0",
      transition: "all 0.3s ease",
    },
    navButtonActive: {
      color: "black",
    },
    form: {
      background: "white",
      borderRadius: "12px",
      padding: "30px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      width: "100%",
      boxSizing: "border-box",
    },
    section: {
      display: "none",
    },
    sectionActive: {
      display: "block",
      animation: "fadeIn 0.3s ease",
    },
    sectionTitle: {
      color: "#2c3e50",
      marginTop: "0",
      marginBottom: "20px",
      paddingBottom: "10px",
      borderBottom: "2px solid #5c6bc0",
      fontSize: "20px",
    },
    sectionFields: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "20px",
    },
    field: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "500",
      color: "#34495e",
    },
    required: {
      color: "#e74c3c",
      marginLeft: "4px",
    },
    input: {
      width: "100%",
      padding: "12px 15px",
      border: "1px solid #dcdfe6",
      borderRadius: "6px",
      fontSize: "14px",
      transition: "border-color 0.3s, box-shadow 0.3s",
      boxSizing: "border-box",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#5c6bc0",
      boxShadow: "0 0 0 3px rgba(92, 107, 192, 0.2)",
    },
    inputError: {
      borderColor: "#e74c3c",
    },
    errorText: {
      color: "#e74c3c",
      fontSize: "13px",
      marginTop: "5px",
      display: "block",
    },
    checkboxContainer: {
      maxHeight: "200px",
      overflowY: "auto",
      border: "1px solid #dcdfe6",
      borderRadius: "6px",
      padding: "15px",
      backgroundColor: "#f9fafc",
    },
    checkboxItem: {
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
    },
    checkboxInput: {
      marginRight: "10px",
      width: "18px",
      height: "18px",
      cursor: "pointer",
    },
    checkboxLabel: {
      cursor: "pointer",
      color: "#34495e",
    },
    fileUpload: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
    },
    fileLabel: {
      backgroundColor: "#5c6bc0",
      color: "white",
      padding: "10px 15px",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "background-color 0.3s",
      marginRight: "10px",
    },
    fileLabelHover: {
      backgroundColor: "#3f51b5",
    },
    fileInput: {
      display: "none",
    },
    fileName: {
      color: "#7f8c8d",
      fontSize: "14px",
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "15px",
      marginTop: "30px",
      paddingTop: "20px",
      borderTop: "1px solid #e0e6ed",
    },
    cancelButton: {
      padding: "12px 25px",
      background: "#f5f7f9",
      color: "#7f8c8d",
      border: "1px solid #dcdfe6",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.3s",
    },
    cancelButtonHover: {
      background: "#e0e6ed",
    },
    submitButton: {
      padding: "12px 25px",
      backgroundColor: "#5c6bc0",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      transition: "background-color 0.3s",
    },
    submitButtonHover: {
      backgroundColor: "#3f51b5",
    },
    submitButtonDisabled: {
      backgroundColor: "#9fa8da",
      cursor: "not-allowed",
    },
    loadingSpinner: {
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "50%",
      borderTop: "2px solid white",
      animation: "spin 1s linear infinite",
      marginRight: "8px",
    },
    successPopup: {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "1000",
      animation: "slideIn 0.3s ease",
    },
    popupContent: {
      backgroundColor: "#4caf50",
      color: "white",
      padding: "15px 20px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    },
    popupIcon: {
      marginRight: "10px",
      fontWeight: "bold",
    },
  };

  // State for hover effects
  const [hoverStates, setHoverStates] = useState({
    navButtons: {},
    fileLabel: false,
    cancelButton: false,
    submitButton: false,
  });

  const handleMouseEnter = (element, id) => {
    setHoverStates((prev) => ({
      ...prev,
      [element]: { ...prev[element], [id]: true },
    }));
  };

  const handleMouseLeave = (element, id) => {
    setHoverStates((prev) => ({
      ...prev,
      [element]: { ...prev[element], [id]: false },
    }));
  };

  return (
    <div style={styles.container}>
      <Sidebars />

      <div style={styles.content}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={styles.header}>
            <h2 style={styles.headerTitle}>Add Employee</h2>
            <p style={styles.headerSubtitle}>
              Fill in the details below to add a new employee
            </p>
          </div>

          {showPopup && (
            <div style={styles.successPopup}>
              <div style={styles.popupContent}>
                <span style={styles.popupIcon}>✓</span>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          <div style={styles.navigation}>
            {formSections.map((section) => (
              <button
                key={section.id}
                style={{
                  ...styles.navButton,
                  ...(activeSection === section.id
                    ? styles.navButtonActive
                    : {}),
                  ...(hoverStates.navButtons[section.id]
                    ? styles.navButtonHover
                    : {}),
                }}
                onMouseEnter={() => handleMouseEnter("navButtons", section.id)}
                onMouseLeave={() => handleMouseLeave("navButtons", section.id)}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                {section.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {formSections.map((section) => (
              <div
                key={section.id}
                style={{
                  ...styles.section,
                  ...(activeSection === section.id ? styles.sectionActive : {}),
                }}
              >
                <h3 style={styles.sectionTitle}>{section.title}</h3>
                <div style={styles.sectionFields}>
                  {section.fields.map((field) => (
                    <div key={field.name} style={styles.field}>
                      <label style={styles.label}>
                        {field.label}
                        {field.required && (
                          <span style={styles.required}>*</span>
                        )}
                      </label>

                      {field.type === "select" ? (
                        <>
                          <select
                            name={field.name}
                            onChange={handleChange}
                            style={{
                              ...styles.input,
                              ...(errors[field.name] ? styles.inputError : {}),
                            }}
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
                                  checked={formData.customer.includes(
                                    opt.value
                                  )}
                                  onChange={handleCheckboxChange}
                                  disabled={isLoading}
                                  style={styles.checkboxInput}
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
                        <div style={styles.fileUpload}>
                          <label
                            htmlFor="image1"
                            style={{
                              ...styles.fileLabel,
                              ...(hoverStates.fileLabel
                                ? styles.fileLabelHover
                                : {}),
                            }}
                            onMouseEnter={() =>
                              setHoverStates((prev) => ({
                                ...prev,
                                fileLabel: true,
                              }))
                            }
                            onMouseLeave={() =>
                              setHoverStates((prev) => ({
                                ...prev,
                                fileLabel: false,
                              }))
                            }
                          >
                            Choose File
                          </label>
                          <input
                            type="file"
                            id="image1"
                            name={field.name}
                            accept="image/*"
                            onChange={handleFileChange}
                            style={styles.fileInput}
                            disabled={isLoading}
                          />
                          {formData.image1 && (
                            <span style={styles.fileName}>
                              {formData.image1.name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <input
                            type={field.type || "text"}
                            name={field.name}
                            onChange={handleChange}
                            style={{
                              ...styles.input,
                              ...(errors[field.name] ? styles.inputError : {}),
                            }}
                            value={formData[field.name] || ""}
                            required={field.required}
                            disabled={isLoading}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            onFocus={(e) => {
                              e.target.style.outline = "none";
                              e.target.style.borderColor = "#5c6bc0";
                              e.target.style.boxShadow =
                                "0 0 0 3px rgba(92, 107, 192, 0.2)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = errors[field.name]
                                ? "#e74c3c"
                                : "#dcdfe6";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          {errors[field.name] && (
                            <span style={styles.errorText}>
                              {errors[field.name]}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={styles.actions}>
              <button
                type="button"
                onClick={() => navigate("/employees")}
                style={{
                  ...styles.cancelButton,
                  ...(hoverStates.cancelButton ? styles.cancelButtonHover : {}),
                }}
                onMouseEnter={() =>
                  setHoverStates((prev) => ({ ...prev, cancelButton: true }))
                }
                onMouseLeave={() =>
                  setHoverStates((prev) => ({ ...prev, cancelButton: false }))
                }
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(hoverStates.submitButton ? styles.submitButtonHover : {}),
                  ...(isLoading ? styles.submitButtonDisabled : {}),
                }}
                onMouseEnter={() =>
                  setHoverStates((prev) => ({ ...prev, submitButton: true }))
                }
                onMouseLeave={() =>
                  setHoverStates((prev) => ({ ...prev, submitButton: false }))
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div style={styles.loadingSpinner}></div>
                    Saving...
                  </>
                ) : (
                  "Save Employee"
                )}
              </button>
            </div>
          </form>

          {/* Add style tag for animations and responsive design */}
          <style>
            {`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideIn {
              from { transform: translateX(100px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            /* Responsive adjustments */
            @media (max-width: 1024px) {
              .content {
                max-width: calc(100% - 220px);
                padding: 20px;
              }
            }
            
            @media (max-width: 768px) {
              .container {
                flex-direction: column;
              }
              
              .sidebar-wrapper {
                position: relative;
                height: auto;
                width: 100%;
              }
              
              .content {
                max-width: 100%;
                padding: 15px;
                margin-left: 0;
              }
              
              .form {
                padding: 20px;
              }
              
              .section-fields {
                grid-template-columns: 1fr;
              }
            }
            
            @media (max-width: 480px) {
              .content {
                padding: 10px;
              }
              
              .form {
                padding: 15px;
              }
              
              .header-title {
                font-size: 22px;
              }
              
              .nav-button {
                padding: 10px 15px;
                font-size: 13px;
                margin-right: 5px;
              }
              
              .actions {
                flex-direction: column;
                gap: 10px;
              }
              
              .cancel-button, .submit-button {
                width: 100%;
                justify-content: center;
              }
            }
          `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
