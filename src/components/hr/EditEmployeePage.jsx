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
    nid_number: "",
    blood_group: "",
    gender: "",
    bank_account: "",
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
      setEmployee((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setEmployee((prev) => ({ ...prev, [name]: value }));
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
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
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
        job_title: employee.job_title || "",
        reporting_leader: employee.reporting_leader || "",
        special_skills: employee.special_skills || "",
        remarks: employee.remarks || "",
        permanent_address: employee.permanent_address || "",
        emergency_contact: employee.emergency_contact || "",
        nid_number: employee.nid_number || "",
        blood_group: employee.blood_group || "",
        gender: employee.gender || "",
      };

      // Handle email separately to allow null values
      if (employee.email === "") jsonData.email = null;
      else if (employee.email) jsonData.email = employee.email;

      // Convert to numbers where applicable
      if (employee.department)
        jsonData.department = Number(employee.department);
      if (employee.company) jsonData.company = Number(employee.company);
      if (employee.salary) jsonData.salary = Number(employee.salary);

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
        
        // Log FormData contents for debugging
        console.log("FormData contents:");
        for (let [key, value] of imageFormData.entries()) {
          console.log(`- ${key}:`, value);
        }
        
        try {
          await updateEmployeeImage(id, imageFormData);
          console.log("Image update successful");
        } catch (imageError) {
          console.error("Image update failed:", imageError);
          console.error("Image error response:", imageError.response?.data);
          
          // Handle specific image errors
          if (imageError.response?.data) {
            const errorData = imageError.response.data;
            if (errorData.image1) {
              const imageErrors = Array.isArray(errorData.image1) 
                ? errorData.image1.join(', ') 
                : errorData.image1;
              alert(`Image upload error: ${imageErrors}`);
            } else {
              alert(`Image upload error: ${JSON.stringify(errorData)}`);
            }
          } else {
            alert("Image upload failed. Please check file format and size.");
          }
          // Continue with other updates even if image fails
        }
      } else {
        console.log("No image to update or image is URL string");
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
      } else {
        console.log("No customers to update");
      }

      console.log("=== END SUBMIT DEBUG ===");

      alert("Employee updated successfully!");
      navigate(`/employee/${id}`);
    } catch (error) {
      console.error("Update failed:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      let errorMessage = "Update failed: ";
      if (error.response?.data) {
        // Display server validation errors
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

  const labelStyle = {
    fontWeight: "bold",
    fontSize: "14px",
    marginBottom: "6px",
    display: "block",
  };
  
  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    backgroundColor: "#f9f9f9",
    width: "100%",
    boxSizing: "border-box",
  };
  
  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
    fontFamily: "inherit",
  };
  
  const checkboxContainer = {
    padding: "10px",
    borderRadius: "6px",
    maxHeight: "120px",
    overflowY: "auto",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ccc",
  };
  
  const imagePreviewStyle = {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "6px",
    marginTop: "10px",
    display: "block",
  };

  const buttonStyle = {
    backgroundColor: isSubmitting ? "#ccc" : "#3182ce",
    color: "white",
    padding: "12px 24px",
    fontSize: "16px",
    border: "none",
    borderRadius: "8px",
    cursor: isSubmitting ? "not-allowed" : "pointer",
    opacity: isSubmitting ? 0.7 : 1,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebars />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "30px",
          backgroundColor: "#A7D5E1",
        }}
      >
        <div
          style={{
            backgroundColor: "#DCEEF3",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "1200px",
            margin: "0 auto",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
            Edit Employee
          </h2>

          <form
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
            onSubmit={(e) => e.preventDefault()} // Prevent default form submission
          >
            {[
              { name: "device_user_id", label: "Device User ID" },
              { name: "employee_id", label: "Employee ID" },
              { name: "name", label: "Name" },
              { name: "designation", label: "Designation" },
              { name: "joining_date", label: "Joining Date", type: "date" },
              { name: "date_of_birth", label: "Date of Birth", type: "date" },
              { name: "email", label: "Email" },
              { name: "mail_address", label: "Mail Address" },
              { name: "personal_phone", label: "Personal Phone" },
              { name: "office_phone", label: "Office Phone" },
              { name: "reference_phone", label: "Reference Phone" },
              { name: "job_title", label: "Job Title" },
              { name: "bank_account", label: "Bank Account Number" },
              { name: "nid_number", label: "NID Number" },
              { name: "blood_group", label: "Blood Group" },
              { name: "salary", label: "Salary", type: "number" },
              { name: "reporting_leader", label: "Reporting Leader" },
              {
                name: "gender",
                label: "Gender",
                type: "select",
                options: [
                  { value: "", label: "Select Gender" },
                  { value: "M", label: "Male" },
                  { value: "F", label: "Female" },
                ],
              },
            ].map(({ name, label, type = "text", options }) => (
              <div key={name}>
                <label htmlFor={name} style={labelStyle}>
                  {label}
                </label>
                {type === "select" ? (
                  <select
                    id={name}
                    name={name}
                    value={employee[name]}
                    onChange={handleChange}
                    style={inputStyle}
                    disabled={isSubmitting}
                  >
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={name}
                    name={name}
                    type={type}
                    value={employee[name]}
                    onChange={handleChange}
                    style={inputStyle}
                    disabled={isSubmitting}
                  />
                )}
              </div>
            ))}

            <div>
              <label style={labelStyle}>Customers</label>
              <div style={checkboxContainer}>
                {customers.map((c) => {
                  const checked = employee.customer.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "6px",
                        gap: "10px",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => !isSubmitting && handleCustomerCheckboxChange(c.id)}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                        }}
                        disabled={isSubmitting}
                      />
                      <span style={{ fontSize: "14px", color: "#333" }}>
                        {c.customer_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {[
              "special_skills",
              "emergency_contact",
              "remarks",
              "permanent_address",
            ].map((field) => (
              <div key={field}>
                <label style={labelStyle}>
                  {field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </label>
                <textarea
                  name={field}
                  value={employee[field]}
                  onChange={handleChange}
                  style={textareaStyle}
                  disabled={isSubmitting}
                />
              </div>
            ))}

            <div>
              <label style={labelStyle}>Company</label>
              <select
                name="company"
                value={employee.company}
                onChange={handleChange}
                style={inputStyle}
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

            <div>
              <label style={labelStyle}>Department</label>
              <select
                name="department"
                value={employee.department}
                onChange={handleChange}
                style={inputStyle}
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

            <div>
              <label style={labelStyle}>Employee Photo (optional)</label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Employee"
                  style={imagePreviewStyle}
                />
              )}
              <input
                type="file"
                name="image1"
                accept="image/*"
                onChange={handleChange}
                style={inputStyle}
                disabled={isSubmitting}
              />
            </div>
          </form>

          <div style={{ textAlign: "right", marginTop: "30px" }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={buttonStyle}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeePage;