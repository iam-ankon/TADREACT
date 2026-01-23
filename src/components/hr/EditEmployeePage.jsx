import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  getEmployeeById,
  getCompanies,
  getCustomers,
  getDepartments,
  updateEmployee,
  updateEmployeeImage,
  updateEmployeeCustomers,
} from "../../api/employeeApi";
import {
  FaSave,
  FaArrowLeft,
  FaUserEdit,
  FaBuilding,
  FaUsers,
  FaBriefcase,
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaIdCard,
  FaFileUpload,
  FaImage,
} from "react-icons/fa";

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState({
    device_user_id: "",
    employee_id: "",
    name: "",
    designation: "",
    joining_date: "",
    date_of_birth: "",
    email: "",
    mail_address: "",
    personal_phone: "",
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
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, compRes, custRes, deptRes] = await Promise.all([
          getEmployeeById(id),
          getCompanies(),
          getCustomers(),
          getDepartments(),
        ]);

        const emp = empRes.data;
        const customerIds = Array.isArray(emp.customer)
          ? emp.customer.map((c) => (typeof c === "object" ? c.id : c))
          : [];

        setEmployee({
          ...emp,
          company: emp.company?.id || emp.company,
          customer: customerIds,
        });

        setCompanies(compRes.data);
        setCustomers(custRes.data);
        setDepartments(deptRes.data);

        if (emp.image1) setImagePreview(emp.image1);
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("Error loading employee data: " + err.message);
      }
    };

    fetchData();
  }, [id]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Invalid email format";
        } else {
          delete newErrors.email;
        }
        break;
      case "personal_phone":
      case "office_phone":
        if (value && !/^[0-9+\-\s()]{10,15}$/.test(value)) {
          newErrors[name] = "Invalid phone number";
        } else {
          delete newErrors[name];
        }
        break;
      case "salary":
      case "salary_cash":
        if (value && isNaN(value)) {
          newErrors[name] = "Must be a number";
        } else if (value && Number(value) < 0) {
          newErrors[name] = "Cannot be negative";
        } else {
          delete newErrors[name];
        }
        break;
      case "name":
        if (!value.trim()) {
          newErrors.name = "Name is required";
        } else {
          delete newErrors.name;
        }
        break;
      case "employee_id":
        if (!value.trim()) {
          newErrors.employee_id = "Employee ID is required";
        } else {
          delete newErrors.employee_id;
        }
        break;
      default:
        delete newErrors[name];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
      setEmployee((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setEmployee((prev) => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

  const handleCustomerCheckboxChange = (customerId) => {
    setEmployee((prev) => {
      const updated = prev.customer.includes(customerId)
        ? prev.customer.filter((id) => id !== customerId)
        : [...prev.customer, customerId];
      return { ...prev, customer: updated };
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = ["name", "employee_id"];
    const newErrors = {};
    
    requiredFields.forEach(field => {
      if (!employee[field]?.trim()) {
        newErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fill in all required fields");
      return;
    }
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      console.log("=== EDIT EMPLOYEE SUBMIT DEBUG ===");
      console.log("Original employee data:", employee);

      const jsonData = {
        employee_id: employee.employee_id || "",
        name: employee.name || "",
        designation: employee.designation || "",
        joining_date: employee.joining_date || "",
        date_of_birth: employee.date_of_birth || "",
        mail_address: employee.mail_address || "",
        personal_phone: employee.personal_phone || "",
        office_phone: employee.office_phone || "",
        reference_phone: employee.reference_phone || "",
        reporting_leader: employee.reporting_leader || "",
        special_skills: employee.special_skills || "",
        remarks: employee.remarks || "",
        permanent_address: employee.permanent_address || "",
        emergency_contact: employee.emergency_contact || "",
        nid_number: employee.nid_number || "",
        blood_group: employee.blood_group || "",
        gender: employee.gender || "",
        bank_account: employee.bank_account || "",
        branch_name: employee.branch_name || "",
      };

      // Handle email separately to allow null values
      if (employee.email === "") jsonData.email = null;
      else if (employee.email) jsonData.email = employee.email;

      // Convert to numbers where applicable
      if (employee.department)
        jsonData.department = Number(employee.department);
      if (employee.company) jsonData.company = Number(employee.company);
      if (employee.salary) jsonData.salary = Number(employee.salary);
      if (employee.salary_cash) jsonData.salary_cash = Number(employee.salary_cash);

      // Remove undefined values
      Object.keys(jsonData).forEach((key) => {
        if (jsonData[key] === undefined) delete jsonData[key];
      });

      console.log("Basic employee data to update:", jsonData);

      // Step 1: Update basic employee data first
      console.log("Updating basic employee data...");
      await updateEmployee(id, jsonData);
      console.log("Basic data update successful");

      // Step 2: Handle image update separately
      if (employee.image1 && typeof employee.image1 === "object") {
        console.log("Updating image...");
        
        const imageFormData = new FormData();
        imageFormData.append("image1", employee.image1);
        
        try {
          await updateEmployeeImage(id, imageFormData);
          console.log("Image update successful");
        } catch (imageError) {
          console.error("Image update failed:", imageError);
          if (imageError.response?.data?.image1) {
            const imageErrors = Array.isArray(imageError.response.data.image1) 
              ? imageError.response.data.image1.join(', ') 
              : imageError.response.data.image1;
            alert(`Image upload error: ${imageErrors}`);
          }
        }
      }

      // Step 3: Handle customers update
      const customerIds = employee.customer
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      console.log("Customer IDs to send to API:", customerIds);

      if (customerIds.length > 0) {
        console.log("Updating customers...");
        await updateEmployeeCustomers(id, customerIds);
        console.log("Customer update API call completed");
      }

      console.log("=== END SUBMIT DEBUG ===");

      alert("Employee updated successfully!");
      navigate(`/employee/${id}`);
    } catch (error) {
      console.error("Update failed:", error);
      
      let errorMessage = "Update failed: ";
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            const errorValue = errorData[key];
            errorMessage += `\n${key}: ${Array.isArray(errorValue) ? errorValue.join(', ') : errorValue}`;
          });
        } else {
          errorMessage += errorData;
        }
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-employee-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="edit-employee-card">
          {/* Header */}
          <div className="edit-header">
            <div className="header-content">
              <h1>
                <FaUserEdit className="header-icon" />
                Edit Employee Profile
              </h1>
              <p className="header-subtitle">
                Update details for {employee.name}
              </p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => navigate(`/employee/${id}`)}
                className="btn-cancel"
                disabled={isSubmitting}
              >
                <FaArrowLeft /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn-save"
                disabled={isSubmitting}
              >
                <FaSave />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Form Sections - Scrollable Container */}
          <div className="form-sections-container">
            <div className="form-sections">
              {/* Personal Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaUser className="section-icon" />
                  <h3>Personal Information</h3>
                </div>
                <div className="form-grid">
                  <div className={`form-group ${errors.name ? 'error' : ''}`}>
                    <label>
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={employee.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={isSubmitting}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  <div className={`form-group ${errors.employee_id ? 'error' : ''}`}>
                    <label>
                      Employee ID <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={employee.employee_id}
                      onChange={handleChange}
                      placeholder="Enter employee ID"
                      disabled={isSubmitting}
                    />
                    {errors.employee_id && <span className="error-message">{errors.employee_id}</span>}
                  </div>

                  <div className="form-group">
                    <label>Device User ID</label>
                    <input
                      type="text"
                      name="device_user_id"
                      value={employee.device_user_id}
                      onChange={handleChange}
                      placeholder="Enter device user ID"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={employee.designation}
                      onChange={handleChange}
                      placeholder="Enter designation"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={employee.gender}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={employee.date_of_birth}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaPhone className="section-icon" />
                  <h3>Contact Information</h3>
                </div>
                <div className="form-grid">
                  <div className={`form-group ${errors.email ? 'error' : ''}`}>
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        value={employee.email}
                        onChange={handleChange}
                        placeholder="employee@company.com"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  <div className={`form-group ${errors.personal_phone ? 'error' : ''}`}>
                    <label>Personal Phone</label>
                    <div className="input-with-icon">
                      <FaPhone className="input-icon" />
                      <input
                        type="text"
                        name="personal_phone"
                        value={employee.personal_phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.personal_phone && <span className="error-message">{errors.personal_phone}</span>}
                  </div>

                  <div className={`form-group ${errors.office_phone ? 'error' : ''}`}>
                    <label>Office Phone</label>
                    <div className="input-with-icon">
                      <FaPhone className="input-icon" />
                      <input
                        type="text"
                        name="office_phone"
                        value={employee.office_phone}
                        onChange={handleChange}
                        placeholder="Extension or direct line"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.office_phone && <span className="error-message">{errors.office_phone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Reference Phone</label>
                    <input
                      type="text"
                      name="reference_phone"
                      value={employee.reference_phone}
                      onChange={handleChange}
                      placeholder="Reference contact number"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={employee.emergency_contact}
                      onChange={handleChange}
                      placeholder="Emergency contact person"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaMapMarkerAlt className="section-icon" />
                  <h3>Address Information</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Mailing Address</label>
                    <textarea
                      name="mail_address"
                      value={employee.mail_address}
                      onChange={handleChange}
                      placeholder="Current mailing address"
                      rows="3"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Permanent Address</label>
                    <textarea
                      name="permanent_address"
                      value={employee.permanent_address}
                      onChange={handleChange}
                      placeholder="Permanent residential address"
                      rows="3"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaBuilding className="section-icon" />
                  <h3>Company Information</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company</label>
                    <div className="select-with-icon">
                      <FaBuilding className="select-icon" />
                      <select
                        name="company"
                        value={employee.company}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Company</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <div className="select-with-icon">
                      <FaBriefcase className="select-icon" />
                      <select
                        name="department"
                        value={employee.department}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.department_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Joining Date</label>
                    <div className="input-with-icon">
                      <FaCalendarAlt className="input-icon" />
                      <input
                        type="date"
                        name="joining_date"
                        value={employee.joining_date}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Reporting Leader</label>
                    <input
                      type="text"
                      name="reporting_leader"
                      value={employee.reporting_leader}
                      onChange={handleChange}
                      placeholder="Manager or supervisor"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaMoneyBillWave className="section-icon" />
                  <h3>Financial Information</h3>
                </div>
                <div className="form-grid">
                  <div className={`form-group ${errors.salary ? 'error' : ''}`}>
                    <label>Salary</label>
                    <div className="input-with-icon currency">
                      <span className="currency-symbol">৳</span>
                      <input
                        type="number"
                        name="salary"
                        value={employee.salary}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.salary && <span className="error-message">{errors.salary}</span>}
                  </div>

                  <div className={`form-group ${errors.salary_cash ? 'error' : ''}`}>
                    <label>Salary (Cash Portion)</label>
                    <div className="input-with-icon currency">
                      <span className="currency-symbol">৳</span>
                      <input
                        type="number"
                        name="salary_cash"
                        value={employee.salary_cash}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.salary_cash && <span className="error-message">{errors.salary_cash}</span>}
                  </div>

                  <div className="form-group">
                    <label>Bank Account Number</label>
                    <input
                      type="text"
                      name="bank_account"
                      value={employee.bank_account}
                      onChange={handleChange}
                      placeholder="Bank account number"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Branch Code</label>
                    <input
                      type="text"
                      name="branch_name"
                      value={employee.branch_name}
                      onChange={handleChange}
                      placeholder="Bank branch code"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaIdCard className="section-icon" />
                  <h3>Additional Information</h3>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>NID Number</label>
                    <input
                      type="text"
                      name="nid_number"
                      value={employee.nid_number}
                      onChange={handleChange}
                      placeholder="National ID number"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <input
                      type="text"
                      name="blood_group"
                      value={employee.blood_group}
                      onChange={handleChange}
                      placeholder="e.g., A+, O-"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Special Skills</label>
                    <textarea
                      name="special_skills"
                      value={employee.special_skills}
                      onChange={handleChange}
                      placeholder="Special skills or certifications"
                      rows="2"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={employee.remarks}
                      onChange={handleChange}
                      placeholder="Additional notes or remarks"
                      rows="2"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Assignment */}
              <div className="form-section">
                <div className="section-header">
                  <FaUsers className="section-icon" />
                  <h3>Customer Assignment</h3>
                </div>
                <div className="customers-section">
                  <p className="section-description">
                    Select customers assigned to this employee
                  </p>
                  <div className="customers-grid">
                    {customers.map((c) => {
                      const checked = employee.customer.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`customer-checkbox ${checked ? 'checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => !isSubmitting && handleCustomerCheckboxChange(c.id)}
                            disabled={isSubmitting}
                          />
                          <span className="customer-name">{c.customer_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="form-section">
                <div className="section-header">
                  <FaImage className="section-icon" />
                  <h3>Employee Photo</h3>
                </div>
                <div className="photo-upload-section">
                  <div className="photo-preview">
                    {imagePreview ? (
                      <div className="preview-container">
                        <img
                          src={imagePreview}
                          alt="Employee"
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
                        <span>No photo selected</span>
                      </div>
                    )}
                    <input
                      type="file"
                      name="image1"
                      accept="image/*"
                      onChange={handleChange}
                      className="file-input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="upload-instructions">
                    <p>Upload a clear photo of the employee</p>
                    <small>Recommended: Square image, max 2MB, JPG/PNG format</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-footer">
            <button
              onClick={() => navigate(`/employee/${id}`)}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              <FaArrowLeft /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-save"
              disabled={isSubmitting}
            >
              <FaSave />
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .edit-employee-container {
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

        .edit-employee-card {
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
          color: #3b82f6;
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

        /* Scrollable Form Sections Container */
        .form-sections-container {
          flex: 1;
          overflow-y: auto;
          padding: 0 2rem;
        }

        .form-sections {
          min-height: min-content;
        }

        .form-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .form-section:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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

        .section-icon {
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

        /* Input with Icon */
        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .input-with-icon input {
          padding-left: 2.5rem;
          width: 100%;
        }

        .input-with-icon.currency {
          position: relative;
        }

        .currency-symbol {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-weight: 600;
          pointer-events: none;
        }

        .input-with-icon.currency input {
          padding-left: 2.5rem;
        }

        /* Select with Icon */
        .select-with-icon {
          position: relative;
        }

        .select-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          z-index: 1;
        }

        .select-with-icon select {
          padding-left: 2.5rem;
          width: 100%;
          background: white;
          appearance: none;
        }

        /* Customers Section */
        .customers-section {
          margin-top: 1rem;
        }

        .section-description {
          color: #6b7280;
          margin-bottom: 1rem;
          font-size: 0.9rem;
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

        /* Custom Scrollbar Styles */
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

        /* Firefox scrollbar */
        .form-sections-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          min-width: 160px;
          justify-content: center;
        }

        .btn-save:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
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

          .edit-employee-card {
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

export default EditEmployeePage;