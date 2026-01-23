import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  getCompanies,
  getCustomers,
  getDepartments,
  addEmployee,
} from "../../api/employeeApi";
import {
  FaUserPlus,
  FaUser,
  FaBriefcase,
  FaPhone,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaUsers,
  FaImage,
  FaSave,
  FaArrowLeft,
  FaBuilding,
  FaUsers as FaUsersIcon,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEnvelope,
  FaIdCard,
  FaFileUpload,
} from "react-icons/fa";

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
    salary_cash: "",
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
  const [imagePreview, setImagePreview] = useState(null);

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
    
    // Required field validations
    if (!formData.employee_id?.trim())
      newErrors.employee_id = "Employee ID is required";
    if (!formData.name?.trim()) 
      newErrors.name = "Name is required";
    if (!formData.designation?.trim())
      newErrors.designation = "Designation is required";
    if (!formData.joining_date)
      newErrors.joining_date = "Joining date is required";
    if (!formData.date_of_birth)
      newErrors.date_of_birth = "Date of birth is required";
    
    // Email validation - only validate if there's content
    if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Invalid email format";
    }
    
    // Phone validation - only validate if there's content
    if (formData.personal_phone?.trim() && !/^[0-9+\-\s()]{10,15}$/.test(formData.personal_phone.trim())) {
      newErrors.personal_phone = "Invalid phone number";
    }
    if (formData.office_phone?.trim() && !/^[0-9+\-\s()]{10,15}$/.test(formData.office_phone.trim())) {
      newErrors.office_phone = "Invalid phone number";
    }
    
    // Salary validation
    if (formData.salary && (isNaN(formData.salary) || Number(formData.salary) < 0)) {
      newErrors.salary = "Must be a valid positive number";
    }
    if (formData.salary_cash && (isNaN(formData.salary_cash) || Number(formData.salary_cash) < 0)) {
      newErrors.salary_cash = "Must be a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCheckboxChange = (customerId) => {
    setFormData((prev) => {
      const updated = prev.customer.includes(customerId)
        ? prev.customer.filter((id) => id !== customerId)
        : [...prev.customer, customerId];
      return { ...prev, customer: updated };
    });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== ADD EMPLOYEE SUBMIT START ===");
    
    if (!validateForm()) {
      console.log("Validation failed", errors);
      alert("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);
    console.log("Form data before processing:", formData);

    try {
      // Compress image if exists
      let finalImage = formData.image1;
      if (formData.image1 && formData.image1.size > 500000) {
        console.log("Compressing image...");
        finalImage = await compressImage(formData.image1);
        console.log("Image compressed");
      }

      const formDataToSend = new FormData();

      // First, handle required fields
      const requiredFields = ["employee_id", "name", "designation", "joining_date", "date_of_birth"];
      requiredFields.forEach(field => {
        if (formData[field]) {
          if (["joining_date", "date_of_birth"].includes(field)) {
            formDataToSend.append(field, new Date(formData[field]).toISOString().split('T')[0]);
          } else {
            formDataToSend.append(field, formData[field].trim());
          }
        }
      });

      // Handle other fields
      const otherFields = [
        "device_user_id", "mail_address", "office_phone", "reference_phone",
        "reporting_leader", "special_skills", "remarks", "permanent_address",
        "emergency_contact", "nid_number", "blood_group", "gender",
        "bank_account", "branch_name"
      ];

      otherFields.forEach(field => {
        if (formData[field]?.trim()) {
          formDataToSend.append(field, formData[field].trim());
        } else {
          // Send empty string for optional fields
          formDataToSend.append(field, "");
        }
      });

      // Handle email - backend expects null or valid email
      if (formData.email?.trim()) {
        const emailValue = formData.email.trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
          formDataToSend.append("email", emailValue);
        } else {
          // Invalid email, send empty string
          formDataToSend.append("email", "");
        }
      } else {
        // No email provided, send empty string
        formDataToSend.append("email", "");
      }

      // Handle phone numbers
      if (formData.personal_phone?.trim()) {
        formDataToSend.append("personal_phone", formData.personal_phone.trim());
      } else {
        formDataToSend.append("personal_phone", "");
      }

      // Handle numeric fields
      if (formData.department) {
        formDataToSend.append("department", Number(formData.department));
      } else {
        formDataToSend.append("department", "");
      }
      
      if (formData.company) {
        formDataToSend.append("company", Number(formData.company));
      } else {
        formDataToSend.append("company", "");
      }
      
      if (formData.salary) {
        formDataToSend.append("salary", Number(formData.salary));
      } else {
        formDataToSend.append("salary", "");
      }
      
      if (formData.salary_cash) {
        formDataToSend.append("salary_cash", Number(formData.salary_cash));
      } else {
        formDataToSend.append("salary_cash", "");
      }

      // Append image
      if (finalImage) {
        console.log("Adding image to form data");
        formDataToSend.append("image1", finalImage);
      } else {
        // If no image, send empty file field
        formDataToSend.append("image1", "");
      }

      // Append customers as an array
      if (formData.customer.length > 0) {
        console.log("Adding customers:", formData.customer);
        const customerIds = formData.customer.map(id => parseInt(id)).filter(id => !isNaN(id));
        customerIds.forEach(customerId => {
          formDataToSend.append("customers", customerId);
        });
      } else {
        // Send empty array for customers
        formDataToSend.append("customers", "");
      }

      // Debug: Log all form data entries
      console.log("FormData entries:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      console.log("Calling addEmployee API...");
      const response = await addEmployee(formDataToSend);
      console.log("API Response:", response);

      setSuccessMessage("Employee added successfully!");
      setShowPopup(true);
      
      // Reset form after successful save
      setTimeout(() => {
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
          department: "",
          customer: [],
          company: "",
          salary: "",
          salary_cash: "",
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
        setImagePreview(null);
        navigate("/employees");
      }, 2000);

    } catch (error) {
      console.error("Add employee failed:", error);
      
      let errorMessage = "Failed to add employee: ";
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            const errorValue = errorData[key];
            if (Array.isArray(errorValue)) {
              errorMessage += `\n${key}: ${errorValue.join(', ')}`;
            } else if (typeof errorValue === 'string') {
              errorMessage += `\n${key}: ${errorValue}`;
            }
          });
        } else {
          errorMessage += errorData;
        }
      } else {
        errorMessage += error.message;
      }
      
      setSuccessMessage(errorMessage);
      setShowPopup(true);
      console.error("Error details:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
      console.log("=== ADD EMPLOYEE SUBMIT END ===");
    }
  };

  const formSections = [
    {
      id: "personal",
      title: "Personal Information",
      icon: <FaUser />,
      fields: [
        { name: "name", label: "Full Name", required: true },
        { name: "employee_id", label: "Employee ID", required: true },
        { name: "designation", label: "Designation", required: true },
        { name: "gender", label: "Gender", type: "select", options: [
          { label: "Select Gender", value: "" },
          { label: "Male", value: "M" },
          { label: "Female", value: "F" }
        ]},
        { name: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
        { name: "nid_number", label: "NID Number" },
        { name: "blood_group", label: "Blood Group" },
      ],
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: <FaPhone />,
      fields: [
        { 
          name: "email", 
          label: "Email Address", 
          type: "email",
          placeholder: "example@company.com (optional)"
        },
        { 
          name: "personal_phone", 
          label: "Personal Phone",
          placeholder: "Optional"
        },
        { 
          name: "office_phone", 
          label: "Office Phone",
          placeholder: "Optional"
        },
        { name: "reference_phone", label: "Reference Phone", placeholder: "Optional" },
        { name: "emergency_contact", label: "Emergency Contact", placeholder: "Optional" },
      ],
    },
    {
      id: "address",
      title: "Address Information",
      icon: <FaMapMarkerAlt />,
      fields: [
        { name: "mail_address", label: "Mailing Address", type: "textarea", placeholder: "Optional" },
        { name: "permanent_address", label: "Permanent Address", type: "textarea", placeholder: "Optional" },
      ],
    },
    {
      id: "employment",
      title: "Employment Details",
      icon: <FaBriefcase />,
      fields: [
        { name: "joining_date", label: "Joining Date", required: true, type: "date" },
        { 
          name: "company", 
          label: "Company", 
          type: "select", 
          options: [
            { label: "Select Company", value: "" },
            ...companies.map((c) => ({ label: c.company_name, value: c.id }))
          ]
        },
        { 
          name: "department", 
          label: "Department", 
          type: "select", 
          options: [
            { label: "Select Department", value: "" },
            ...departments.map((d) => ({ label: d.department_name, value: d.id }))
          ]
        },
        { name: "reporting_leader", label: "Reporting Leader", placeholder: "Optional" },
      ],
    },
    {
      id: "financial",
      title: "Financial Information",
      icon: <FaMoneyBillWave />,
      fields: [
        { name: "salary", label: "Salary", type: "number", placeholder: "0.00", min: "0", step: "0.01" },
        { name: "salary_cash", label: "Salary (Cash Portion)", type: "number", placeholder: "0.00", min: "0", step: "0.01" },
        { name: "bank_account", label: "Bank Account Number", placeholder: "Optional" },
        { name: "branch_name", label: "Branch Code", placeholder: "Optional" },
      ],
    },
    {
      id: "additional",
      title: "Additional Information",
      icon: <FaInfoCircle />,
      fields: [
        { name: "special_skills", label: "Special Skills", type: "textarea", placeholder: "Optional" },
        { name: "remarks", label: "Remarks", type: "textarea", placeholder: "Optional" },
        { name: "device_user_id", label: "Device User ID", placeholder: "Optional" },
      ],
    },
    {
      id: "customers",
      title: "Customer Assignment",
      icon: <FaUsers />,
      fields: [
        { name: "customer", label: "Assigned Customers", type: "checkboxes" },
      ],
    },
    {
      id: "photo",
      title: "Employee Photo",
      icon: <FaImage />,
      fields: [
        { name: "image1", label: "Upload Photo", type: "file" },
      ],
    },
  ];

  return (
    <div className="add-employee-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="add-employee-card">
          {/* Header */}
          <div className="edit-header">
            <div className="header-content">
              <h1>
                <FaUserPlus className="header-icon" />
                Add New Employee
              </h1>
              <p className="header-subtitle">
                Fill in the details to create a new employee profile
              </p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                onClick={() => navigate("/employees")}
                className="btn-cancel"
                disabled={isLoading}
              >
                <FaArrowLeft /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-save"
                disabled={isLoading}
              >
                <FaSave />
                {isLoading ? "Saving..." : "Save Employee"}
              </button>
            </div>
          </div>

          {/* Success Popup */}
          {showPopup && (
            <div className="success-popup">
              <div className="popup-content">
                <span className="popup-icon">✓</span>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="form-navigation">
            {formSections.map((sec) => (
              <button
                key={sec.id}
                className={`nav-button ${activeSection === sec.id ? 'active' : ''}`}
                onClick={() => setActiveSection(sec.id)}
                type="button"
                disabled={isLoading}
              >
                <span className="nav-icon">{sec.icon}</span>
                <span className="nav-text">{sec.title}</span>
              </button>
            ))}
          </div>

          {/* Form Sections Container */}
          <div className="form-sections-container">
            <form onSubmit={handleSubmit} className="add-employee-form">
              {formSections.map((sec) => (
                <div
                  key={sec.id}
                  className={`form-section ${activeSection === sec.id ? 'active' : ''}`}
                >
                  <div className="section-header">
                    {sec.icon}
                    <h3>{sec.title}</h3>
                  </div>
                  
                  <div className="form-grid">
                    {sec.fields.map((field) => (
                      <div
                        key={field.name}
                        className={`form-group ${field.type === 'textarea' || field.type === 'checkboxes' ? 'full-width' : ''} ${errors[field.name] ? 'error' : ''}`}
                      >
                        <label>
                          {field.label}
                          {field.required && <span className="required">*</span>}
                        </label>

                        {field.type === "select" ? (
                          <>
                            <div className="select-with-icon">
                              <select
                                name={field.name}
                                value={formData[field.name] || ""}
                                onChange={handleChange}
                                disabled={isLoading}
                                required={field.required}
                              >
                                {field.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {errors[field.name] && (
                              <span className="error-message">{errors[field.name]}</span>
                            )}
                          </>
                        ) : field.type === "checkboxes" ? (
                          <div className="customers-section">
                            <div className="customers-grid">
                              {customers.map((c) => {
                                const checked = formData.customer.includes(c.id.toString());
                                return (
                                  <label
                                    key={c.id}
                                    className={`customer-checkbox ${checked ? 'checked' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleCheckboxChange(c.id.toString())}
                                      disabled={isLoading}
                                    />
                                    <span className="customer-name">{c.customer_name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : field.type === "textarea" ? (
                          <>
                            <textarea
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleChange}
                              rows="3"
                              disabled={isLoading}
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              required={field.required}
                            />
                            {errors[field.name] && (
                              <span className="error-message">{errors[field.name]}</span>
                            )}
                          </>
                        ) : field.type === "file" ? (
                          <div className="photo-upload-section">
                            <div className="photo-preview">
                              {imagePreview ? (
                                <div className="preview-container">
                                  <img
                                    src={imagePreview}
                                    alt="Employee preview"
                                    className="preview-image"
                                  />
                                  <div className="preview-overlay">
                                    <FaFileUpload />
                                    <span>Click to change</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="upload-placeholder">
                                  <FaFileUpload size={40} />
                                  <span>Upload photo</span>
                                </div>
                              )}
                              <input
                                type="file"
                                name="image1"
                                accept="image/*"
                                onChange={handleChange}
                                className="file-input"
                                disabled={isLoading}
                              />
                            </div>
                            <div className="upload-instructions">
                              <p>Upload a clear photo of the employee</p>
                              <small>Recommended: Square image, max 2MB, JPG/PNG format</small>
                            </div>
                          </div>
                        ) : (
                          <>
                            <input
                              type={field.type || "text"}
                              name={field.name}
                              value={formData[field.name] || ""}
                              onChange={handleChange}
                              disabled={isLoading}
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              required={field.required}
                              min={field.min}
                              step={field.step}
                            />
                            {errors[field.name] && (
                              <span className="error-message">{errors[field.name]}</span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="form-footer">
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="btn-cancel"
              disabled={isLoading}
            >
              <FaArrowLeft /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-save"
              disabled={isLoading}
            >
              <FaSave />
              {isLoading ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .add-employee-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .content-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .add-employee-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          max-width: 1400px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 4rem);
        }

        /* Header Styles */
        .edit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2rem 2rem 1.5rem;
          border-bottom: 2px solid #f1f5f9;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          flex-shrink: 0;
        }

        .header-content h1 {
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .header-icon {
          color: #10b981;
          font-size: 1.8rem;
        }

        .header-subtitle {
          color: #64748b;
          margin-top: 0.5rem;
          font-size: 0.95rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        /* Success Popup */
        .success-popup {
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${successMessage.includes('Failed') ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          animation: slideIn 0.4s ease;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 400px;
        }

        .popup-icon {
          font-size: 1.25rem;
          font-weight: bold;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Navigation */
        .form-navigation {
          display: flex;
          overflow-x: auto;
          padding: 1rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          background: white;
          flex-shrink: 0;
          gap: 0.5rem;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .nav-button:hover:not(:disabled) {
          background: #f1f5f9;
          color: #475569;
        }

        .nav-button.active {
          background: #dbeafe;
          color: #1d4ed8;
          border-color: #93c5fd;
        }

        .nav-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .nav-icon {
          font-size: 1rem;
        }

        .nav-text {
          margin-top: 1px;
        }

        /* Scrollable Form Sections Container */
        .form-sections-container {
          flex: 1;
          overflow-y: auto;
          padding: 0 2rem;
        }

        .add-employee-form {
          min-height: min-content;
        }

        .form-section {
          display: none;
          margin: 2rem 0;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: fadeIn 0.3s ease;
        }

        .form-section.active {
          display: block;
        }

        .form-section:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f1f5f9;
        }

        .section-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-header svg {
          color: #3b82f6;
          font-size: 1.25rem;
        }

        /* Form Grid */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .required {
          color: #ef4444;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #1f2937;
          background: white;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .form-group.error input,
        .form-group.error select,
        .form-group.error textarea {
          border-color: #ef4444;
        }

        .form-group.error input:focus,
        .form-group.error select:focus,
        .form-group.error textarea:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* Select with Icon */
        .select-with-icon {
          position: relative;
        }

        .select-with-icon select {
          width: 100%;
          padding: 0.75rem 1rem;
          padding-left: 2.5rem;
          background: white;
          appearance: none;
        }

        /* Customers Section */
        .customers-section {
          margin-top: 1rem;
        }

        .customers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .customer-checkbox {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .customer-checkbox:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .customer-checkbox.checked {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .customer-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .customer-checkbox input[type="checkbox"]:disabled {
          cursor: not-allowed;
        }

        .customer-name {
          font-size: 0.9rem;
          color: #374151;
          font-weight: 500;
        }

        /* Photo Upload */
        .photo-upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .photo-preview {
          position: relative;
          width: 200px;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .photo-preview:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .preview-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .preview-container:hover .preview-overlay {
          opacity: 1;
        }

        .preview-overlay svg {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: #9ca3af;
          gap: 0.75rem;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .file-input:disabled {
          cursor: not-allowed;
        }

        .upload-instructions {
          text-align: center;
          color: #6b7280;
        }

        .upload-instructions p {
          margin: 0;
          font-weight: 500;
        }

        .upload-instructions small {
          font-size: 0.85rem;
        }

        /* Custom Scrollbar */
        .form-sections-container::-webkit-scrollbar {
          width: 8px;
        }

        .form-sections-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .form-sections-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .form-sections-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .form-sections-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .customers-grid::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .customers-grid::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 3px;
        }

        .customers-grid::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 3px;
        }

        .customers-grid::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Footer */
        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-top: 2px solid #f1f5f9;
          background: #f8fafc;
          flex-shrink: 0;
        }

        /* Button Styles */
        .btn-save,
        .btn-cancel {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-save {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          min-width: 160px;
          justify-content: center;
        }

        .btn-save:hover:not(:disabled) {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-cancel {
          background: white;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-2px);
        }

        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .add-employee-card {
            height: calc(100vh - 2rem);
          }

          .edit-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem 1rem;
          }

          .header-content h1 {
            font-size: 1.5rem;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .form-navigation {
            padding: 1rem;
            gap: 0.25rem;
          }

          .nav-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
          }

          .nav-icon {
            font-size: 0.9rem;
          }

          .form-sections-container {
            padding: 0 1rem;
          }

          .form-section {
            padding: 1rem;
            margin: 1.5rem 0;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-footer {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .form-footer button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .customers-grid {
            grid-template-columns: 1fr;
          }

          .photo-preview {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default AddEmployee;