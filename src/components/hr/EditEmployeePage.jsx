

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebars from "./sidebars";

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState({
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
  });

  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeRes, companiesRes, customersRes] = await Promise.all([
          axios.get(`http://119.148.12.1:8000/api/hrms/api/employees/${id}/`),
          axios.get("http://119.148.12.1:8000/api/hrms/api/tad_groups/"),
          axios.get("http://119.148.12.1:8000/api/hrms/api/customers/"),
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
      const formData = new FormData();
      Object.keys(employee).forEach((key) => {
        if (key !== "customer" && key !== "image1" && employee[key] != null) {
          formData.append(key, employee[key]);
        }
      });

      if (employee.image1 && typeof employee.image1 === "object") {
        formData.append("image1", employee.image1);
      }

      await axios.put(
        `http://119.148.12.1:8000/api/hrms/api/employees/${id}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      await axios.patch(
        `http://119.148.12.1:8000/api/hrms/api/employees/${id}/update_customers/`,
        { customers: employee.customer }
      );

      navigate(`/employee/${id}`);
    } catch (error) {
      console.error("Error updating employee:", error);
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
              { name: "department", label: "Department" },
              { name: "salary", label: "Salary", type: "number" },
              { name: "reporting_leader", label: "Reporting Leader" },
            ].map(({ name, label, type = "text" }) => (
              <div key={name}>
                <label htmlFor={name} style={labelStyle}>
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={employee[name]}
                  onChange={handleChange}
                  style={inputStyle}
                />
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
