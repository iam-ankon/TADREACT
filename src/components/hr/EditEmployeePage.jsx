import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebars from './sidebars';

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
          axios.get("http://119.148.12.1:8000/api/hrms/api/customers/")
        ]);

        const emp = employeeRes.data;

        // Ensure customer is always an array of IDs (handle both null/undefined and array cases)
        const customerIds = Array.isArray(emp.customer)
          ? emp.customer.map(c => typeof c === 'object' ? c.id : c)
          : [];

        setEmployee({
          ...emp,
          company: emp.company?.id || emp.company,
          customer: customerIds, // This should now be a clean array of IDs
        });

        setCompanies(companiesRes.data);
        setCustomers(customersRes.data);

        if (emp.image1) {
          setImagePreview(emp.image1);
        }

        // Debug logs
        console.log("Fetched employee data:", emp);
        console.log("Processed customer IDs:", customerIds);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
        setEmployee(prev => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setEmployee(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomerCheckboxChange = (customerId) => {
    setEmployee(prev => {
      const newCustomers = prev.customer.includes(customerId)
        ? prev.customer.filter(id => id !== customerId)
        : [...prev.customer, customerId];
      return { ...prev, customer: newCustomers };
    });
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      // Append all fields except customer and image1
      Object.keys(employee).forEach((key) => {
        if (key !== 'customer' && key !== 'image1' && employee[key] !== null && employee[key] !== undefined) {
          formData.append(key, employee[key]);
        }
      });

      // Handle image
      if (employee.image1 && typeof employee.image1 === 'object') {
        formData.append('image1', employee.image1);
      }

      // First update the employee
      await axios.put(
        `http://119.148.12.1:8000/api/hrms/api/employees/${id}/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Then update customers separately
      await axios.patch(
        `http://119.148.12.1:8000/api/hrms/api/employees/${id}/update_customers/`,
        { customers: employee.customer }
      );

      navigate(`/employee/${id}`);
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const containerStyle = {
      display: "flex",
      minheight: "100vh",
      fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#DCEEF3",
  };

  const formContainerStyle = {
    flex: 1,
    padding: "20px",
    backgroundColor: "#A7D5E1",
    borderRadius: "8px",
    margin: "20px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  };

  const formGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  };

  const formGroupStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const labelStyle = {
    fontWeight: "bold",
    marginBottom: "6px",
    fontSize: "14px",
    
  };

  const inputStyle = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
    backgroundColor: "#DCEEF3",
  };

  const textareaStyle = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    resize: "vertical",
    minHeight: "80px",
    fontSize: "14px",
    backgroundColor: "#DCEEF3",
  };

  const selectStyle = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
    backgroundColor: "#DCEEF3",
  };

  const submitButtonStyle = {
    marginTop: "30px",
    padding: "12px 20px",
    fontSize: "1rem",
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    alignSelf: "start",
    transition: "background-color 0.3s",
  };

  const submitButtonHoverStyle = {
    backgroundColor: "#2b6cb0",
  };

  const imagePreviewStyle = {
    maxWidth: "200px",
    maxHeight: "200px",
    marginBottom: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  };

  const imageContainerStyle = {
    marginBottom: "10px",
  };

  const checkboxContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    maxHeight: "100px",
    overflowY: "auto",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#DCEEF3",
  };

  const checkboxItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "#edf2f7",
    },
  };

  const checkboxInputStyle = {
    position: "absolute",
    opacity: 0,
    height: 0,
    width: 0,
  };

  const customCheckboxStyle = {
    width: "18px",
    height: "18px",
    border: "2px solid #cbd5e0",
    borderRadius: "4px",
    backgroundColor: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  const checkedStyle = {
    backgroundColor: "#DCEEF3",
    borderColor: "#3182ce",
  };

  const checkmarkStyle = {
    width: "5px",
    height: "10px",
    border: "solid white",
    borderWidth: "0 2px 2px 0",
    transform: "rotate(45deg)",
    opacity: 0,
    transition: "opacity 0.2s ease",
  };

  const checkedCheckmarkStyle = {
    opacity: 1,
  };

  const checkboxLabelStyle = {
    cursor: "pointer",
    fontSize: "14px",
    color: "#4a5568",
    userSelect: "none",
    marginLeft: "8px",

  };


  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>

      <div style={formContainerStyle}>
        <h2 style={{ fontSize: "24px", marginBottom: "20px", color: "#333", textAlign: "left" }}>Edit Employee</h2>
        <form style={{ display: "flex", flexDirection: "column" }}>
          <div style={formGridStyle}>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="employee_id">Employee ID</label>
              <input type="text" style={inputStyle} id="employee_id" name="employee_id" value={employee.employee_id} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="name">Full Name</label>
              <input type="text" style={inputStyle} id="name" name="name" value={employee.name} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="designation">Designation</label>
              <input type="text" style={inputStyle} id="designation" name="designation" value={employee.designation} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="joining_date">Joining Date</label>
              <input type="date" style={inputStyle} id="joining_date" name="joining_date" value={employee.joining_date} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="date_of_birth">Date of Birth</label>
              <input type="date" style={inputStyle} id="date_of_birth" name="date_of_birth" value={employee.date_of_birth} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="email">Email</label>
              <input type="text" style={inputStyle} id="email" name="email" value={employee.email} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="mail_address">Mailing Address</label>
              <input type="text" style={inputStyle} id="mail_address" name="mail_address" value={employee.mail_address} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="personal_phone">Personal Phone</label>
              <input type="text" style={inputStyle} id="personal_phone" name="personal_phone" value={employee.personal_phone} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="office_phone">Office Phone</label>
              <input type="text" style={inputStyle} id="office_phone" name="office_phone" value={employee.office_phone} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="reference_phone">Reference Phone</label>
              <input type="text" style={inputStyle} id="reference_phone" name="reference_phone" value={employee.reference_phone} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="job_title">Job Title</label>
              <input type="text" style={inputStyle} id="job_title" name="job_title" value={employee.job_title} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="department">Department</label>
              <input type="text" style={inputStyle} id="department" name="department" value={employee.department} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Customers</label>
              <div style={checkboxContainerStyle}>
                {customers.map((c) => {
                  // Ensure we're comparing numbers with numbers or strings with strings
                  const customerId = c.id;
                  const isChecked = employee.customer.some(id =>
                    id.toString() === customerId.toString()
                  );

                  console.log(`Customer ${c.id} (${c.customer_name}):`, isChecked); // Debug log

                  return (
                    <label key={c.id} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        id={`customer-${c.id}`}
                        checked={isChecked}
                        onChange={() => handleCustomerCheckboxChange(c.id)}
                        style={checkboxInputStyle}
                      />
                      <span style={{
                        ...customCheckboxStyle,
                        ...(isChecked ? checkedStyle : {})
                      }}>
                        <span style={{
                          ...checkmarkStyle,
                          ...(isChecked ? checkedCheckmarkStyle : {})
                        }}></span>
                      </span>
                      <span style={checkboxLabelStyle}>{c.customer_name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="salary">Salary</label>
              <input type="number" style={inputStyle} id="salary" name="salary" value={employee.salary} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="reporting_leader">Reporting Leader</label>
              <input type="text" style={inputStyle} id="reporting_leader" name="reporting_leader" value={employee.reporting_leader} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="special_skills">Special Skills</label>
              <textarea style={textareaStyle} id="special_skills" name="special_skills" value={employee.special_skills} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="remarks">Remarks</label>
              <textarea style={textareaStyle} id="remarks" name="remarks" value={employee.remarks} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="permanent_address">Permanent Address</label>
              <textarea style={textareaStyle} id="permanent_address" name="permanent_address" value={employee.permanent_address} onChange={handleChange} />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="company">Company</label>
              <select style={selectStyle} id="company" name="company" value={employee.company} onChange={handleChange}>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle} htmlFor="image1">Employee Photo (Optional)</label>
              {imagePreview && (
                <div style={imageContainerStyle}>
                  <img src={imagePreview} alt="Employee Preview" style={imagePreviewStyle} />
                </div>
              )}
              <input type="file" style={inputStyle} id="image1" name="image1" onChange={handleChange} accept="image/*" />
            </div>
          </div>
        </form>
        <button
          type="button"
          style={submitButtonStyle}
          onClick={handleSubmit}
          onMouseEnter={(e) => (e.target.style.backgroundColor = submitButtonHoverStyle.backgroundColor)}
          onMouseLeave={(e) => (e.target.style.backgroundColor = submitButtonStyle.backgroundColor)}
        >
          Update Employee
        </button>
      </div>
    </div>
  );
};

export default EditEmployeePage;