import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  getCompanies,
  getCustomers,
  getDepartments,
  addEmployee,
} from "../../api/employeeApi";

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
    nid_number: "",
    blood_group: "",
    gender: "",
    bank_account: "",
    branch_name: "",
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState("personal");
  const [hoverStates, setHoverStates] = useState({
    navButtons: {},
    fileLabel: false,
    cancelButton: false,
    submitButton: false,
  });

  const genderOptions = [
    { label: "Male", value: "M" },
    { label: "Female", value: "F" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, custRes, deptRes] = await Promise.all([
          getCompanies(),
          getCustomers(),
          getDepartments(),
        ]);
        setCompanies(compRes.data);
        setCustomers(custRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error("Failed to load dropdowns:", err);
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
    if (!formData.joining_date)
      newErrors.joining_date = "Joining date is required";
    if (!formData.date_of_birth)
      newErrors.date_of_birth = "Date of birth is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updated = checked
        ? [...prev.customer, value]
        : prev.customer.filter((id) => id !== value);
      return { ...prev, customer: updated };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, image1: file }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  // Add this helper function
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      if (!file.type.includes("image")) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(
                new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
              );
            },
            "image/jpeg",
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Update handleSubmit to compress images
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const fd = new FormData();

    try {
      // Compress image if exists
      let finalImage = formData.image1;
      if (formData.image1 && formData.image1.size > 500000) {
        // Compress if > 500KB
        finalImage = await compressImage(formData.image1);
      }

      // Append all fields...
      Object.entries(formData).forEach(([key, val]) => {
        if (key === "customer" || key === "image1") return;
        if (val === null || val === undefined || val === "") return;
        const formatted = ["joining_date", "date_of_birth"].includes(key)
          ? formatDate(val)
          : val;
        fd.append(key, formatted);
      });

      if (finalImage) {
        fd.append("image1", finalImage);
      }

      // Append customers
      if (formData.customer.length > 0) {
        formData.customer.forEach((customerId) => {
          fd.append("customers", customerId);
        });
      }

      await addEmployee(fd);
      setSuccessMessage("Employee saved successfully!");
      setShowPopup(true);
      setTimeout(() => navigate("/employees"), 1500);
    } catch (err) {
      console.error("Add employee failed:", err);
      setSuccessMessage("Failed to save employee.");
    } finally {
      setIsLoading(false);
    }
  };

  const formSections = [
    {
      id: "personal",
      title: "Personal Information",
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "employee_id", label: "Employee ID", required: true },
        { name: "designation", label: "Designation", required: true },
        { name: "email", label: "Email" },
        { name: "personal_phone", label: "Personal Phone" },
        { name: "emergency_contact", label: "Emergency Contact" },
        { name: "nid_number", label: "NID Number" },
        { name: "bank_account", label: "Bank Account Number" },
        { name: "branch_name", label: "Branch Code" },
        { name: "blood_group", label: "Blood Group" },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          options: genderOptions,
        },
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

  /* -------------------------------------------------------------------------- */
  /*  ALL YOUR ORIGINAL INLINE STYLES (unchanged)                               */
  /* -------------------------------------------------------------------------- */
  const styles = {
    container: {
      display: "flex",
      backgroundColor: "#f5f7f9",
      minHeight: "100vh",
      width: "100%",
      position: "relative",

      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    header: { marginBottom: "30px" },
    headerTitle: { color: "#2c3e50", marginBottom: "8px", fontSize: "28px" },
    headerSubtitle: { color: "#7f8c8d", margin: "0" },
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
    navButtonActive: { color: "black" },
    form: {
      background: "white",
      borderRadius: "12px",
      padding: "30px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      width: "100%",
      boxSizing: "border-box",
    },
    section: { display: "none" },
    sectionActive: { display: "block", animation: "fadeIn 0.3s ease" },
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
    field: { marginBottom: "15px" },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "500",
      color: "#2c3e50",
    },
    required: { color: "#e74c3c" },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "6px",
      border: "1px solid #dcdfe6",
      backgroundColor: "#fff",
      fontSize: "14px",
      transition: "all 0.2s ease",
    },
    inputError: { borderColor: "#e74c3c" },
    errorText: {
      color: "#e74c3c",
      fontSize: "12px",
      marginTop: "4px",
      display: "block",
    },
    checkboxContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "10px",
      padding: "10px",
      border: "1px solid #dcdfe6",
      borderRadius: "6px",
      backgroundColor: "#f9f9f9",
    },
    checkboxItem: { display: "flex", alignItems: "center", gap: "8px" },
    checkboxInput: { width: "18px", height: "18px", cursor: "pointer" },
    checkboxLabel: { fontSize: "14px", cursor: "pointer" },
    fileUpload: { position: "relative", display: "inline-block" },
    fileLabel: {
      display: "inline-block",
      padding: "10px 20px",
      backgroundColor: "#5c6bc0",
      color: "white",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.3s ease",
    },
    fileLabelHover: {
      backgroundColor: "#3f51b5",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(92,107,192,0.3)",
    },
    fileInput: {
      position: "absolute",
      left: 0,
      top: 0,
      opacity: 0,
      width: "100%",
      height: "100%",
      cursor: "pointer",
    },
    fileName: { marginLeft: "12px", fontSize: "14px", color: "#27ae60" },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "15px",
      marginTop: "30px",
    },
    cancelButton: {
      padding: "12px 24px",
      backgroundColor: "#95a5a6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.3s ease",
    },
    cancelButtonHover: {
      backgroundColor: "#7f8c8d",
      transform: "translateY(-1px)",
    },
    submitButton: {
      padding: "12px 28px",
      backgroundColor: "#27ae60",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.3s ease",
      position: "relative",
    },
    submitButtonHover: {
      backgroundColor: "#219653",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(39,174,96,0.3)",
    },
    submitButtonDisabled: { opacity: 0.7, cursor: "not-allowed" },
    loadingSpinner: {
      display: "inline-block",
      width: "16px",
      height: "16px",
      border: "2px solid #fff",
      borderTop: "2px solid transparent",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      marginRight: "8px",
    },
    successPopup: {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "#27ae60",
      color: "white",
      padding: "16px 24px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      animation: "slideIn 0.4s ease",
    },
    popupContent: { display: "flex", alignItems: "center", gap: "10px" },
    popupIcon: { fontSize: "20px" },
  };

  const handleMouseEnter = (type, id) => {
    setHoverStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], [id]: true },
    }));
  };
  const handleMouseLeave = (type, id) => {
    setHoverStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], [id]: false },
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
                <span style={styles.popupIcon}>Success</span>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          <div style={styles.navigation}>
            {formSections.map((sec) => (
              <button
                key={sec.id}
                style={{
                  ...styles.navButton,
                  ...(activeSection === sec.id ? styles.navButtonActive : {}),
                  ...(hoverStates.navButtons[sec.id]
                    ? { color: "#3f51b5" }
                    : {}),
                }}
                onMouseEnter={() => handleMouseEnter("navButtons", sec.id)}
                onMouseLeave={() => handleMouseLeave("navButtons", sec.id)}
                onClick={() => setActiveSection(sec.id)}
                type="button"
              >
                {sec.title}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {formSections.map((sec) => (
              <div
                key={sec.id}
                style={{
                  ...styles.section,
                  ...(activeSection === sec.id ? styles.sectionActive : {}),
                }}
              >
                <h3 style={styles.sectionTitle}>{sec.title}</h3>
                <div style={styles.sectionFields}>
                  {sec.fields.map((field) => (
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
                            value={formData[field.name] || ""}
                            onChange={handleChange}
                            style={{
                              ...styles.input,
                              ...(errors[field.name] ? styles.inputError : {}),
                            }}
                            required={field.required}
                            disabled={isLoading}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
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
                          {field.options.map((opt) => (
                            <div key={opt.value} style={styles.checkboxItem}>
                              <input
                                type="checkbox"
                                id={`cust-${opt.value}`}
                                value={opt.value}
                                checked={formData.customer.includes(opt.value)}
                                onChange={handleCheckboxChange}
                                disabled={isLoading}
                                style={styles.checkboxInput}
                              />
                              <label
                                htmlFor={`cust-${opt.value}`}
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
                              setHoverStates((p) => ({ ...p, fileLabel: true }))
                            }
                            onMouseLeave={() =>
                              setHoverStates((p) => ({
                                ...p,
                                fileLabel: false,
                              }))
                            }
                          >
                            Choose File
                          </label>
                          <input
                            type="file"
                            id="image1"
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
                            value={formData[field.name] || ""}
                            onChange={handleChange}
                            style={{
                              ...styles.input,
                              ...(errors[field.name] ? styles.inputError : {}),
                            }}
                            required={field.required}
                            disabled={isLoading}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            onFocus={(e) => {
                              e.target.style.outline = "none";
                              e.target.style.borderColor = "#5c6bc0";
                              e.target.style.boxShadow =
                                "0 0 0 3px rgba(92,107,192,0.2)";
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
                  setHoverStates((p) => ({ ...p, cancelButton: true }))
                }
                onMouseLeave={() =>
                  setHoverStates((p) => ({ ...p, cancelButton: false }))
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
                  setHoverStates((p) => ({ ...p, submitButton: true }))
                }
                onMouseLeave={() =>
                  setHoverStates((p) => ({ ...p, submitButton: false }))
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

          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @media (max-width: 768px) {
              .container { flex-direction: column; }
              .content { max-width: 100%; margin-left: 0; padding: 15px; }
              .section-fields { grid-template-columns: 1fr; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
