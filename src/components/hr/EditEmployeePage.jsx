import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

// === 1. GET CSRF TOKEN FROM COOKIE ===
const getCsrfToken = () => {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
};

// === 2. SET DEFAULTS + INTERCEPTOR ===
// At top of file
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = getCsrfToken();
  if (token) {
    config.headers["X-CSRFToken"] = token;
  }
  return config;
});

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
    email: "", // ← MUST BE EMPTY STRING
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
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeRes, companiesRes, customersRes, departmentsRes] =
          await Promise.all([
            axios.get(
              `http://119.148.51.38:8000/api/hrms/api/employees/${id}/`
            ),
            axios.get("http://119.148.51.38:8000/api/hrms/api/tad_groups/"),
            axios.get("http://119.148.51.38:8000/api/hrms/api/customers/"),
            axios.get("http://119.148.51.38:8000/api/hrms/api/departments/"),
          ]);

        const emp = employeeRes.data;
        const customerIds = Array.isArray(emp.customer)
          ? emp.customer.map((c) => (typeof c === "object" ? c.id : c))
          : [];

        setEmployee({
          ...emp,
          company: emp.company?.id || emp.company,
          customer: customerIds,
        });

        setCompanies(companiesRes.data);
        setCustomers(customersRes.data);
        setDepartments(departmentsRes.data);

        if (emp.image1) {
          setImagePreview(emp.image1);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files && files[0]) {
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
    try {
      // === BUILD JSON DATA ===
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

      // === EMAIL: ONLY SEND IF CHANGED OR TO CLEAR ===
      if (employee.email === "") {
        jsonData.email = null; // ← CLEAR EMAIL
      } else if (employee.email) {
        jsonData.email = employee.email; // ← KEEP OR UPDATE
      }
      // If email not touched → NOT SENT → keeps old value

      // === FOREIGN KEYS: ONLY IF SELECTED ===
      if (employee.department)
        jsonData.department = Number(employee.department);
      if (employee.company) jsonData.company = Number(employee.company);
      if (employee.salary) jsonData.salary = Number(employee.salary);

      // === REMOVE UNDEFINED ===
      Object.keys(jsonData).forEach((key) => {
        if (jsonData[key] === undefined) delete jsonData[key];
      });

      // === UPDATE EMPLOYEE ===
      await axios.put(
        `http://119.148.51.38:8000/api/hrms/api/employees/${id}/`,
        jsonData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // === UPLOAD IMAGE ===
      if (employee.image1 && typeof employee.image1 === "object") {
        const imageFormData = new FormData();
        imageFormData.append("image1", employee.image1);

        await axios.patch(
          `http://119.148.51.38:8000/api/hrms/api/employees/${id}/`,
          imageFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // === UPDATE CUSTOMERS ===
      await axios.patch(
        `http://119.148.51.38:8000/api/hrms/api/employees/${id}/update_customers/`,
        { customers: employee.customer },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert("Employee updated successfully!");
      navigate(`/employee/${id}`);
    } catch (error) {
      console.error("Update failed:", error.response || error);
      const msg = error.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : error.message;
      alert("Update failed:\n" + msg);
    }
  };
  const labelStyle = {
    fontWeight: "bold",
    fontSize: "14px",
    marginBottom: "6px",
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    backgroundColor: "#f9f9f9",
    width: "100%",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  const checkboxContainer = {
    padding: "10px",
    borderRadius: "6px",
    maxHeight: "80px",
    overflowY: "auto",
    backgroundColor: "#f9f9f9",
  };

  const imagePreviewStyle = {
    maxWidth: "200px",
    maxHeight: "200px",
    borderRadius: "6px",
    marginTop: "10px",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Fixed Sidebar */}

      <Sidebars />

      {/* Scrollable Content */}
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
          >
            {[
              { name: "device_user_id", label: "Device User ID" }, // Added device_user_id field
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
                        gap: "10px", // space between checkbox and text
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCustomerCheckboxChange(c.id)}
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ fontSize: "14px", color: "#333" }}>
                        {c.customer_name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Special Skills</label>
              <textarea
                name="special_skills"
                value={employee.special_skills}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Emergency Contact</label>
              <textarea
                name="emergency_contact"
                value={employee.emergency_contact}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Remarks</label>
              <textarea
                name="remarks"
                value={employee.remarks}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Permanent Address</label>
              <textarea
                name="permanent_address"
                value={employee.permanent_address}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Company</label>
              <select
                name="company"
                value={employee.company}
                onChange={handleChange}
                style={inputStyle}
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
              />
            </div>
          </form>

          <div style={{ textAlign: "right", marginTop: "30px" }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                backgroundColor: "#3182ce",
                color: "white",
                padding: "12px 24px",
                fontSize: "16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Update Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeePage;
