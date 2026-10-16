import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Sidebars from "./sidebars";
import {
  getEmployeeById,
  getCompanies,
  getCustomers,
  getDepartments,
  getMDepartments,
  addEmployee,
  updateEmployee,
  updateEmployeeImage,
  updateEmployeeCustomers,
} from "../../api/employeeApi";
import {
  FaSave,
  FaArrowLeft,
  FaUserPlus,
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

const EMPTY_FORM = {
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
  merchandising_department: [],
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
};

const EmployeeForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();

  // When arriving from Interviews "Hire" action (add mode only)
  const { name, position_for, email, phone, age, date_of_birth } =
    location.state || {};

  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    name: name || "",
    designation: position_for || "",
    email: email || "",
    personal_phone: phone || "",
    date_of_birth: date_of_birth || age || "",
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [merchandising_departments, setMerchandisingDepartments] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const calls = [
          getCompanies(),
          getCustomers(),
          getDepartments(),
          getMDepartments(),
        ];
        if (isEditMode) calls.unshift(getEmployeeById(id));

        const results = await Promise.all(calls);
        const [empRes, compRes, custRes, deptRes, mdeptRes] = isEditMode
          ? results
          : [null, ...results];

        if (isEditMode && empRes) {
          const emp = empRes.data;

          const customerIds = Array.isArray(emp.customer)
            ? emp.customer.map((c) => (typeof c === "object" ? c.id : c))
            : [];

          let merchandisingDeptIds = [];
          if (emp.merchandising_department) {
            if (Array.isArray(emp.merchandising_department)) {
              merchandisingDeptIds = emp.merchandising_department.map((m) =>
                typeof m === "object" ? m.id : m,
              );
            } else if (typeof emp.merchandising_department === "object") {
              merchandisingDeptIds = [emp.merchandising_department.id];
            } else {
              merchandisingDeptIds = [emp.merchandising_department];
            }
          }

          setFormData((prev) => ({
            ...prev,
            ...emp,
            company: emp.company?.id || emp.company,
            customer: customerIds,
            merchandising_department: merchandisingDeptIds,
          }));

          if (emp.image1) setImagePreview(emp.image1);
        }

        setCompanies(compRes.data || []);
        setCustomers(custRes.data || []);
        setDepartments(deptRes.data || []);
        setMerchandisingDepartments(mdeptRes.data || []);
      } catch (err) {
        console.error("Failed to load employee form data:", err);
        if (isEditMode) alert("Error loading employee data: " + err.message);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employee_id?.trim())
      newErrors.employee_id = "Employee ID is required";
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.designation?.trim())
      newErrors.designation = "Designation is required";
    if (!formData.joining_date)
      newErrors.joining_date = "Joining date is required";

    if (formData.email?.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = "Invalid email format";
      }
    }

    if (
      formData.personal_phone?.trim() &&
      !/^[0-9+\-\s()]{10,15}$/.test(formData.personal_phone.trim())
    ) {
      newErrors.personal_phone = "Invalid phone number (10-15 digits)";
    }
    if (
      formData.office_phone?.trim() &&
      !/^[0-9+\-\s()]{10,15}$/.test(formData.office_phone.trim())
    ) {
      newErrors.office_phone = "Invalid phone number (10-15 digits)";
    }

    if (
      formData.salary &&
      (isNaN(formData.salary) || Number(formData.salary) < 0)
    ) {
      newErrors.salary = "Must be a valid positive number";
    }
    if (
      formData.salary_cash &&
      (isNaN(formData.salary_cash) || Number(formData.salary_cash) < 0)
    ) {
      newErrors.salary_cash = "Must be a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files, options, multiple } = e.target;

    if (type === "file" && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (multiple) {
      const selectedValues = Array.from(options)
        .filter((option) => option.selected && option.value !== "")
        .map((option) => option.value);
      setFormData((prev) => ({ ...prev, [name]: selectedValues }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCustomerCheckboxChange = (customerId) => {
    setFormData((prev) => {
      const updated = prev.customer.includes(customerId)
        ? prev.customer.filter((cid) => cid !== customerId)
        : [...prev.customer, customerId];
      return { ...prev, customer: updated };
    });
  };

  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      if (!file || !file.type.includes("image")) {
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
                }),
              );
            },
            "image/jpeg",
            quality,
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddSubmit = async () => {
    let finalImage = formData.image1;
    if (formData.image1 && formData.image1.size > 500000) {
      finalImage = await compressImage(formData.image1);
    }

    const fd = new FormData();

    ["employee_id", "name", "designation"].forEach((field) => {
      if (formData[field]) fd.append(field, formData[field].trim());
    });

    if (formData.joining_date) {
      fd.append(
        "joining_date",
        new Date(formData.joining_date).toISOString().split("T")[0],
      );
    }
    if (formData.date_of_birth) {
      fd.append(
        "date_of_birth",
        new Date(formData.date_of_birth).toISOString().split("T")[0],
      );
    }

    if (formData.email?.trim()) {
      const emailValue = formData.email.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        fd.append("email", emailValue);
      }
    }

    [
      "device_user_id",
      "mail_address",
      "office_phone",
      "reference_phone",
      "reporting_leader",
      "special_skills",
      "remarks",
      "permanent_address",
      "emergency_contact",
      "nid_number",
      "blood_group",
      "gender",
      "bank_account",
      "branch_name",
    ].forEach((field) => {
      if (formData[field]?.trim()) fd.append(field, formData[field].trim());
    });

    if (formData.personal_phone?.trim()) {
      fd.append("personal_phone", formData.personal_phone.trim());
    }

    if (formData.department) fd.append("department", Number(formData.department));
    if (formData.company) fd.append("company", Number(formData.company));

    if (
      Array.isArray(formData.merchandising_department) &&
      formData.merchandising_department.length > 0
    ) {
      formData.merchandising_department
        .map((mid) => parseInt(mid, 10))
        .filter((mid) => !isNaN(mid) && mid > 0)
        .forEach((mid) => fd.append("merchandising_department", mid));
    }

    if (formData.salary && !isNaN(formData.salary) && Number(formData.salary) > 0) {
      fd.append("salary", Number(formData.salary));
    }
    if (
      formData.salary_cash &&
      !isNaN(formData.salary_cash) &&
      Number(formData.salary_cash) > 0
    ) {
      fd.append("salary_cash", Number(formData.salary_cash));
    }

    if (finalImage) fd.append("image1", finalImage);

    // Customer M2M — serializer field is "customer" (singular); sending "customers"
    // here is what silently dropped the assignment on create.
    if (formData.customer && formData.customer.length > 0) {
      formData.customer
        .map((cid) => parseInt(cid, 10))
        .filter((cid) => !isNaN(cid))
        .forEach((cid) => fd.append("customer", cid));
    }

    await addEmployee(fd);
    navigate("/employees");
  };

  const handleEditSubmit = async () => {
    const jsonData = {
      employee_id: formData.employee_id || "",
      name: formData.name || "",
      designation: formData.designation || "",
      joining_date: formData.joining_date || null,
      date_of_birth: formData.date_of_birth || null,
      mail_address: formData.mail_address || null,
      personal_phone: formData.personal_phone || null,
      office_phone: formData.office_phone || null,
      reference_phone: formData.reference_phone || null,
      reporting_leader: formData.reporting_leader || null,
      special_skills: formData.special_skills || null,
      remarks: formData.remarks || null,
      permanent_address: formData.permanent_address || null,
      emergency_contact: formData.emergency_contact || null,
      nid_number: formData.nid_number || null,
      blood_group: formData.blood_group || null,
      gender: formData.gender || null,
      bank_account: formData.bank_account || null,
      branch_name: formData.branch_name || null,
      device_user_id: formData.device_user_id
        ? Number(formData.device_user_id)
        : null,
      email: formData.email?.trim() ? formData.email.trim() : null,
      department: formData.department ? Number(formData.department) : null,
      company: formData.company ? Number(formData.company) : null,
      salary: formData.salary ? Number(formData.salary) : null,
      salary_cash: formData.salary_cash ? Number(formData.salary_cash) : null,
      merchandising_department:
        formData.merchandising_department &&
        formData.merchandising_department.length > 0
          ? formData.merchandising_department.map((mid) => Number(mid))
          : [],
    };

    await updateEmployee(id, jsonData);

    if (formData.image1 && typeof formData.image1 === "object") {
      const imageFormData = new FormData();
      imageFormData.append("image1", formData.image1);
      try {
        await updateEmployeeImage(id, imageFormData);
      } catch (imageError) {
        console.error("Image update failed:", imageError);
      }
    }

    const customerIds = formData.customer
      .map((cid) => parseInt(cid, 10))
      .filter((cid) => !isNaN(cid));

    if (customerIds.length > 0) {
      await updateEmployeeCustomers(id, customerIds);
    }

    navigate(`/employee/${id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await handleEditSubmit();
      } else {
        await handleAddSubmit();
      }
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Add"} employee failed:`, error);

      let errorMessage = `${isEditMode ? "Update" : "Add"} failed: `;
      if (error.response?.data) {
        const errorData = error.response.data;
        if (
          errorData.email &&
          String(errorData.email).includes("already exists")
        ) {
          errorMessage =
            "This email address is already registered. Please use a different email.";
          setErrors((prev) => ({ ...prev, email: "Email already exists" }));
        } else if (
          errorData.employee_id &&
          String(errorData.employee_id).includes("already exists")
        ) {
          errorMessage =
            "This Employee ID is already taken. Please use a different ID.";
          setErrors((prev) => ({
            ...prev,
            employee_id: "Employee ID already exists",
          }));
        } else if (typeof errorData === "object") {
          Object.keys(errorData).forEach((key) => {
            const errorValue = errorData[key];
            errorMessage += `\n${key}: ${Array.isArray(errorValue) ? errorValue.join(", ") : errorValue}`;
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

  const cancelTarget = isEditMode ? `/employee/${id}` : "/employees";

  return (
    <div className="employee-form-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="employee-form-card">
          {/* Header */}
          <div className="form-header">
            <div className="header-content">
              <h1>
                {isEditMode ? (
                  <FaUserEdit className="header-icon" />
                ) : (
                  <FaUserPlus className="header-icon" />
                )}
                {isEditMode ? "Edit Employee Profile" : "Add New Employee"}
              </h1>
              <p className="header-subtitle">
                {isEditMode
                  ? `Update details for ${formData.name}`
                  : "Fill in the details to create a new employee profile"}
              </p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                onClick={() => navigate(cancelTarget)}
                className="btn-cancel"
                disabled={isSubmitting}
              >
                <FaArrowLeft /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-save"
                disabled={isSubmitting}
              >
                <FaSave />
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Save Changes"
                    : "Save Employee"}
              </button>
            </div>
          </div>

          {/* Form Sections */}
          <div className="form-sections-container">
            <div className="form-sections">
              {/* Personal Information */}
              <div className="form-section">
                <div className="section-header">
                  <FaUser className="section-icon" />
                  <h3>Personal Information</h3>
                </div>
                <div className="form-grid">
                  <div className={`form-group ${errors.name ? "error" : ""}`}>
                    <label>
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  <div
                    className={`form-group ${errors.employee_id ? "error" : ""}`}
                  >
                    <label>
                      Employee ID <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      placeholder="Enter employee ID"
                      disabled={isSubmitting}
                    />
                    {errors.employee_id && (
                      <span className="error-message">
                        {errors.employee_id}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Device User ID</label>
                    <input
                      type="text"
                      name="device_user_id"
                      value={formData.device_user_id}
                      onChange={handleChange}
                      placeholder="Enter device user ID"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div
                    className={`form-group ${errors.designation ? "error" : ""}`}
                  >
                    <label>
                      Designation <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Enter designation"
                      disabled={isSubmitting}
                    />
                    {errors.designation && (
                      <span className="error-message">
                        {errors.designation}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <small className="optional-text">Optional</small>
                  </div>

                  <div className="form-group">
                    <label>NID Number</label>
                    <input
                      type="text"
                      name="nid_number"
                      value={formData.nid_number}
                      onChange={handleChange}
                      placeholder="National ID number"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                        (bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ),
                      )}
                    </select>
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
                  <div className={`form-group ${errors.email ? "error" : ""}`}>
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@company.com (optional)"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>

                  <div
                    className={`form-group ${errors.personal_phone ? "error" : ""}`}
                  >
                    <label>Personal Phone</label>
                    <div className="input-with-icon">
                      <FaPhone className="input-icon" />
                      <input
                        type="text"
                        name="personal_phone"
                        value={formData.personal_phone}
                        onChange={handleChange}
                        placeholder="Optional"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.personal_phone && (
                      <span className="error-message">
                        {errors.personal_phone}
                      </span>
                    )}
                  </div>

                  <div
                    className={`form-group ${errors.office_phone ? "error" : ""}`}
                  >
                    <label>Office Phone</label>
                    <div className="input-with-icon">
                      <FaPhone className="input-icon" />
                      <input
                        type="text"
                        name="office_phone"
                        value={formData.office_phone}
                        onChange={handleChange}
                        placeholder="Optional"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.office_phone && (
                      <span className="error-message">
                        {errors.office_phone}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Reference Phone</label>
                    <input
                      type="text"
                      name="reference_phone"
                      value={formData.reference_phone}
                      onChange={handleChange}
                      placeholder="Optional"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      placeholder="Optional"
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
                      value={formData.mail_address}
                      onChange={handleChange}
                      placeholder="Optional"
                      rows="3"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Permanent Address</label>
                    <textarea
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleChange}
                      placeholder="Optional"
                      rows="3"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="form-section">
                <div className="section-header">
                  <FaBriefcase className="section-icon" />
                  <h3>Employment Details</h3>
                </div>
                <div className="form-grid">
                  <div
                    className={`form-group ${errors.joining_date ? "error" : ""}`}
                  >
                    <label>
                      Joining Date <span className="required">*</span>
                    </label>
                    <div className="input-with-icon">
                      <FaCalendarAlt className="input-icon" />
                      <input
                        type="date"
                        name="joining_date"
                        value={formData.joining_date}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.joining_date && (
                      <span className="error-message">
                        {errors.joining_date}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Company</label>
                    <div className="select-with-icon">
                      <FaBuilding className="select-icon" />
                      <select
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Company</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.company_name || c.name}
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
                        value={formData.department}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.department_name || d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Management Departments (Select Multiple)</label>
                    <div className="select-with-icon">
                      <FaUsers className="select-icon" />
                      <select
                        name="merchandising_department"
                        value={formData.merchandising_department || []}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        multiple
                        size={4}
                        style={{ height: "auto", minHeight: "120px" }}
                      >
                        {merchandising_departments.map((md) => (
                          <option key={md.id} value={md.id}>
                            {md.merchandising_department_name ||
                              md.merchandising_department ||
                              md.name ||
                              md.department_name ||
                              `Dept ${md.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <small className="optional-text">
                      Hold Ctrl (Windows) or Cmd (Mac) to select multiple
                      departments
                    </small>
                    {formData.merchandising_department &&
                      formData.merchandising_department.length > 0 && (
                        <div className="selected-summary">
                          <strong>Selected:</strong>{" "}
                          {formData.merchandising_department
                            .map((mid) => {
                              const dept = merchandising_departments.find(
                                (d) => String(d.id) === String(mid),
                              );
                              return dept
                                ? dept.merchandising_department_name ||
                                    dept.merchandising_department ||
                                    dept.name
                                : mid;
                            })
                            .join(", ")}
                        </div>
                      )}
                  </div>

                  <div className="form-group">
                    <label>Reporting Leader</label>
                    <input
                      type="text"
                      name="reporting_leader"
                      value={formData.reporting_leader}
                      onChange={handleChange}
                      placeholder="Optional"
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
                  <div className={`form-group ${errors.salary ? "error" : ""}`}>
                    <label>Salary</label>
                    <div className="input-with-icon currency">
                      <span className="currency-symbol">৳</span>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.salary && (
                      <span className="error-message">{errors.salary}</span>
                    )}
                  </div>

                  <div
                    className={`form-group ${errors.salary_cash ? "error" : ""}`}
                  >
                    <label>Salary (Cash Portion)</label>
                    <div className="input-with-icon currency">
                      <span className="currency-symbol">৳</span>
                      <input
                        type="number"
                        name="salary_cash"
                        value={formData.salary_cash}
                        onChange={handleChange}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {errors.salary_cash && (
                      <span className="error-message">
                        {errors.salary_cash}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Bank Account Number</label>
                    <input
                      type="text"
                      name="bank_account"
                      value={formData.bank_account}
                      onChange={handleChange}
                      placeholder="Optional"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Branch Code</label>
                    <input
                      type="text"
                      name="branch_name"
                      value={formData.branch_name}
                      onChange={handleChange}
                      placeholder="Optional"
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
                  <div className="form-group full-width">
                    <label>Special Skills</label>
                    <textarea
                      name="special_skills"
                      value={formData.special_skills}
                      onChange={handleChange}
                      placeholder="Optional"
                      rows="2"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Optional"
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
                    {customers.length > 0 ? (
                      customers.map((c) => {
                        const checked = formData.customer.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`customer-checkbox ${checked ? "checked" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                !isSubmitting &&
                                handleCustomerCheckboxChange(c.id)
                              }
                              disabled={isSubmitting}
                            />
                            <span className="customer-name">
                              {c.customer_name || c.name}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="no-customers">No customers available</p>
                    )}
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
                        <span>Upload photo</span>
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
                    <small>
                      Recommended: Square image, max 2MB, JPG/PNG format
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-footer">
            <button
              type="button"
              onClick={() => navigate(cancelTarget)}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              <FaArrowLeft /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-save"
              disabled={isSubmitting}
            >
              <FaSave />
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Employee"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .employee-form-container {
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

        .employee-form-card {
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

        .form-header {
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

        .optional-text {
          color: #6b7280;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .selected-summary {
          margin-top: 8px;
          font-size: 13px;
          color: #666;
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

        .form-group select[multiple] {
          padding: 0.5rem;
          min-height: 120px;
        }

        .form-group select[multiple] option {
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
        }

        .form-group select[multiple] option:checked {
          background: #3b82f6;
          color: white;
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

        .select-with-icon {
          position: relative;
        }

        .select-icon {
          position: absolute;
          left: 1rem;
          top: 1rem;
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

        .no-customers {
          grid-column: 1 / -1;
          text-align: center;
          color: #9ca3af;
          padding: 1rem;
        }

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

        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-top: 2px solid #f1f5f9;
          background: #f8fafc;
          flex-shrink: 0;
        }

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

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .employee-form-card {
            height: calc(100vh - 2rem);
          }

          .form-header {
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

export default EmployeeForm;
