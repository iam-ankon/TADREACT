// EmployeeDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEmployeeById,
  getCustomerById,
  getAllCustomers,
  getPerformanceAppraisalsByEmployeeId, // ADD THIS IMPORT
} from "../../api/employeeApi";
import Sidebars from "./sidebars";
import {
  FaEdit,
  FaArrowLeft,
  FaPrint,
  FaUserTie,
  FaBuilding,
  FaMoneyBillWave,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaStar,
} from "react-icons/fa";

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [customerNames, setCustomerNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incrementHistory, setIncrementHistory] = useState([]);

  // Helper function to display gender
  const displayGender = (gender) => {
    if (gender === "M") return "Male";
    if (gender === "F") return "Female";
    return "N/A";
  };

  // Helper function to calculate length of service
  const calculateLengthOfService = (joiningDate) => {
    if (!joiningDate) return "N/A";

    const joinDate = new Date(joiningDate);
    const today = new Date();

    // Calculate total difference in days
    const diffTime = today.getTime() - joinDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Extract years
    const years = Math.floor(totalDays / 365);

    // Remaining days after removing full years
    const remainingDaysAfterYears = totalDays % 365;

    // Extract months (approx 30 days per month)
    const months = Math.floor(remainingDaysAfterYears / 30);

    // Remaining days after removing full months
    const days = remainingDaysAfterYears % 30;

    return `${years} year(s), ${months} month(s), ${days} day(s)`;
  };

  // Fetch employee details
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const response = await getEmployeeById(id);
        const employeeData = response.data;

        console.log("Employee data loaded:", employeeData);

        setEmployee(employeeData);
      } catch (error) {
        console.error("Error fetching employee details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  // Fetch customer names
  useEffect(() => {
    const fetchCustomerNames = async () => {
      if (!employee?.customer || employee.customer.length === 0) {
        console.log("No customers to fetch");
        setCustomerNames([]);
        return;
      }

      console.log("Fetching customers for IDs:", employee.customer);

      const names = [];
      const validCustomerIds = employee.customer.filter(
        (id) => id != null && id !== "" && id !== undefined
      );

      if (validCustomerIds.length === 0) {
        setCustomerNames([]);
        return;
      }

      for (const customerId of validCustomerIds) {
        try {
          // Ensure we have a numeric ID
          const numericId = parseInt(customerId);
          if (isNaN(numericId)) {
            console.warn(`Invalid customer ID: ${customerId}`);
            names.push("Invalid ID");
            continue;
          }

          const response = await getCustomerById(numericId);

          if (response.data && response.data.customer_name) {
            names.push(response.data.customer_name);
          } else {
            names.push("Unknown Customer");
          }
        } catch (error) {
          console.error(`Error fetching customer ${customerId}:`, error);

          // Try to get customer name from all customers list as fallback
          try {
            const allCustomersResponse = await getAllCustomers();
            const allCustomers = allCustomersResponse.data;
            const customer = allCustomers.find(
              (c) => c.id === parseInt(customerId)
            );

            if (customer && customer.customer_name) {
              names.push(customer.customer_name);
            } else {
              names.push("Not Found");
            }
          } catch (altError) {
            console.error(`Alternative fetch also failed for ${customerId}`);
            names.push("Error Loading");
          }
        }
      }

      console.log("Final customer names:", names);
      setCustomerNames(names);
    };

    if (employee) {
      fetchCustomerNames();
    }
  }, [employee]);

  // Fetch increment history using API wrapper - UPDATED
  // In EmployeeDetailPage.jsx - Update the fetchIncrementHistory function
  useEffect(() => {
    const fetchIncrementHistory = async () => {
      if (!employee?.employee_id) return;

      try {
        console.log(
          "🔍 Fetching increment history for employee:",
          employee.employee_id
        );

        // Get all appraisals
        const response = await getPerformanceAppraisalsByEmployeeId(
          employee.employee_id
        );

        console.log("📊 Appraisals response:", response);

        if (response.data) {
          // Filter only approved increments for THIS specific employee
          const approvedIncrements = response.data.filter((appraisal) => {
            const matchesEmployee =
              appraisal.employee_id === employee.employee_id;
            const isApprovedIncrement =
              appraisal.increment === true &&
              appraisal.increment_approved === true;

            console.log(
              `📝 Appraisal ${appraisal.id}: employee_id=${appraisal.employee_id}, matches=${matchesEmployee}, approved=${isApprovedIncrement}`
            );

            return matchesEmployee && isApprovedIncrement;
          });

          console.log("✅ Approved increments found:", approvedIncrements);
          setIncrementHistory(approvedIncrements);
        } else {
          console.log("❌ No appraisal data found");
          setIncrementHistory([]);
        }
      } catch (err) {
        console.error("❌ Error fetching increment history:", err);
        setIncrementHistory([]);
      }
    };

    if (employee?.employee_id) {
      fetchIncrementHistory();
    }
  }, [employee]);

  // Add this function in EmployeeDetailPage.jsx
  const updateEmployeeSalary = async (employeeId, newSalary) => {
    try {
      // You'll need to create this API function
      await updateEmployeeSalary(employeeId, newSalary);
      console.log("Salary updated successfully");
    } catch (error) {
      console.error("Error updating salary:", error);
    }
  };

  // ... rest of the component remains the same (handlePrint, return JSX, etc.)
  // The rest of your component code stays exactly the same

  const handleApprove = async (appraisalId) => {
    console.log("Approve button clicked for:", appraisalId);

    if (!appraisalId) {
      alert("No appraisal ID found");
      return;
    }

    if (appraisal.increment) {
      alert("Increment is already approved");
      return;
    }

    try {
      console.log("Calling approveIncrement API...");
      const result = await approveIncrement(appraisalId);
      console.log("API call successful:", result);

      alert("Increment approved successfully");

      // Refresh appraisal data
      console.log("Refreshing appraisal data...");
      const updatedAppraisal = await getPerformanceAppraisalById(appraisalId);
      setAppraisal(updatedAppraisal.data);
      console.log("Appraisal data updated:", updatedAppraisal.data);
    } catch (err) {
      console.error("Detailed error in handleApprove:", err);
      console.error("Error response:", err.response);
      alert(`Failed to approve increment: ${err.message}`);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Details</title>
          <style>
            body {
              margin: 20px;
              color: #333;
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .print-header h2 {
              margin: 0;
              color: #2c3e50;
            }
            .profile-section {
              display: flex;
              margin-bottom: 20px;
              align-items: center;
            }
            .profile-images {
              display: flex;
              gap: 15px;
              margin-right: 30px;
            }
            .profile-image {
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #ddd;
            }
            .basic-info h3 {
              margin: 0 0 5px 0;
              font-size: 18px;
            }
            .designation {
              font-weight: bold;
              color: #0078d4;
              margin: 0 0 5px 0;
            }
            .employee-id {
              color: #666;
              font-size: 14px;
            }
            .detail-sections {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .detail-section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .detail-section h4 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #2c3e50;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .detail-row {
              display: flex;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .detail-row span:first-child {
              font-weight: bold;
              min-width: 120px;
              color: #555;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <h2>Employee Details</h2>
            </div>
            
            <div class="profile-section">
              <div class="profile-images">
                <img src="${
                  employee.image1
                }" alt="Employee" class="profile-image" />
                ${
                  employee.image2
                    ? `<img src="${employee.image2}" alt="Employee Secondary" class="profile-image" />`
                    : ""
                }
              </div>
              
              <div class="basic-info">
                <h3>${employee.name}</h3>
                <p class="designation">${employee.designation}</p>
                <p class="department">${employee.department_name}</p>
                <p class="employee-id">Employee ID: ${employee.employee_id}</p>
              </div>
            </div>

            <div class="detail-sections">
              <div class="detail-section">
                <h4>Company Information</h4>
                <div class="detail-row">
                  <span>Company:</span>
                  <span>${employee.company_name || employee.company}</span>
                </div>
                <div class="detail-row">
                  <span>Job Title:</span>
                  <span>${employee.job_title}</span>
                </div>
                <div class="detail-row">
                  <span>Salary:</span>
                  <span>৳${employee.salary}</span>
                </div>
                <div class="detail-row">
                  <span>Joining Date:</span>
                  <span>${employee.joining_date}</span>
                </div>
                <div class="detail-row">
                  <span>Reporting Leader:</span>
                  <span>${employee.reporting_leader}</span>
                </div>
                <div class="detail-row">
                  <span>Customers:</span>
                  <span>${
                    customerNames.length > 0 ? customerNames.join(", ") : "N/A"
                  }</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Contact Information</h4>
                <div class="detail-row">
                  <span>Email:</span>
                  <span>${employee.email}</span>
                </div>
                <div class="detail-row">
                  <span>Personal Phone:</span>
                  <span>${employee.personal_phone}</span>
                </div>
                <div class="detail-row">
                  <span>Office Phone:</span>
                  <span>${employee.office_phone}</span>
                </div>
                <div class="detail-row">
                  <span>Reference Phone:</span>
                  <span>${employee.reference_phone || "N/A"}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Address Information</h4>
                <div class="detail-row">
                  <span>Mailing Address:</span>
                  <span>${employee.mail_address}</span>
                </div>
                <div class="detail-row">
                  <span>Permanent Address:</span>
                  <span>${employee.permanent_address}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Personal Information</h4>
                <div class="detail-row">
                  <span>Date of Birth:</span>
                  <span>${employee.date_of_birth}</span>
                </div>
                <div class="detail-row">
                  <span>Special Skills:</span>
                  <span>${employee.special_skills || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span>Remarks:</span>
                  <span>${employee.remarks || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (!employee) {
    return (
      <div className="employee-detail-container">
        <Sidebars />
        <div className="content-wrapper">
          <div className="employee-detail-card">
            <p>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-detail-container">
      <Sidebars />
      <div className="content-wrapper">
        <div className="employee-detail-card">
          <div style={{ maxHeight: "calc(95vh - 100px)", overflowY: "auto" }}>
            <div className="employee-header">
              <h2>
                <FaUserTie className="header-icon" />
                Employee Details
              </h2>
              <div className="action-buttons">
                <button
                  onClick={() => navigate(`/edit-employee/${id}`)}
                  className="btn-edit"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => navigate(`/employees`)}
                  className="btn-back"
                >
                  <FaArrowLeft /> Back
                </button>
                <button onClick={handlePrint} className="btn-print">
                  <FaPrint /> Print
                </button>
              </div>
            </div>

            <div id="printable-area">
              <div className="profile-section">
                <div className="profile-images">
                  <img
                    src={employee.image1}
                    alt="Employee"
                    className="profile-image"
                  />
                  {employee.image2 && (
                    <img
                      src={employee.image2}
                      alt="Employee Secondary"
                      className="profile-image"
                    />
                  )}
                </div>

                <div className="basic-info">
                  <h3>{employee.name}</h3>
                  <p className="designation">{employee.designation}</p>
                  <p className="department">{employee.department_name}</p>
                  <p className="employee-id">
                    Employee ID: {employee.employee_id}
                  </p>
                </div>
              </div>

              <div className="detail-sections">
                <div className="detail-section">
                  <h4>
                    <FaBuilding /> Company Information
                  </h4>
                  <div className="detail-row">
                    <span>Company:</span>
                    <span>{employee.company_name || employee.company}</span>
                  </div>
                  <div className="detail-row">
                    <span>Job Title:</span>
                    <span>{employee.job_title}</span>
                  </div>
                  <div className="detail-row">
                    <span>Salary:</span>
                    <span>৳{employee.salary}</span>
                  </div>
                  <div className="detail-row">
                    <span>Joining Date:</span>
                    <span>{employee.joining_date}</span>
                  </div>
                  <div className="detail-row">
                    <span>Reporting Leader:</span>
                    <span>{employee.reporting_leader}</span>
                  </div>
                  <div className="detail-row">
                    <span> Device ID:</span>
                    <span>{employee.device_user_id || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Customers:</span>
                    <span>
                      {customerNames.length > 0
                        ? customerNames.join(", ")
                        : employee?.customer && employee.customer.length > 0
                        ? `Customer IDs: ${employee.customer.join(", ")}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Length of Service:</span>
                    <span>
                      {calculateLengthOfService(employee.joining_date)}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>
                    <FaEnvelope /> Contact Information
                  </h4>
                  <div className="detail-row email-row">
                    <span>Email:</span>
                    <span>{employee.email}</span>
                  </div>
                  <div className="detail-row">
                    <span>Personal Phone:</span>
                    <span>{employee.personal_phone}</span>
                  </div>
                  <div className="detail-row">
                    <span>Office Phone:</span>
                    <span>{employee.office_phone}</span>
                  </div>
                  <div className="detail-row">
                    <span>Reference Phone:</span>
                    <span>{employee.reference_phone || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Emergency Contact:</span>
                    <span>{employee.emergency_contact || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>
                    <FaMapMarkerAlt /> Address Information
                  </h4>
                  <div className="detail-row">
                    <span>Mailing Address:</span>
                    <span>{employee.mail_address}</span>
                  </div>
                  <div className="detail-row">
                    <span>Permanent Address:</span>
                    <span>{employee.permanent_address}</span>
                  </div>
                  <div className="detail-row">
                    <span>Increment History:</span>
                    {incrementHistory.length > 0 ? (
                      <ul>
                        {incrementHistory.map((inc, idx) => (
                          <li key={idx}>
                            {inc.last_increment_date || "N/A"} — ৳
                            {inc.present_salary} → ৳{inc.proposed_salary}
                            {inc.increment && ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No approved increment history available.</p>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>
                    <FaCalendarAlt /> Personal Information
                  </h4>
                  <div className="detail-row">
                    <span>Date of Birth:</span>
                    <span>{employee.date_of_birth}</span>
                  </div>
                  <div className="detail-row">
                    <span>Gender:</span>
                    <span>{displayGender(employee.gender)}</span>
                  </div>
                  <div className="detail-row">
                    <span>NID Number:</span>
                    <span>{employee.nid_number || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Blood Group:</span>
                    <span>{employee.blood_group || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Special Skills:</span>
                    <span>{employee.special_skills || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Remarks:</span>
                    <span>{employee.remarks || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .employee-detail-container {
          display: flex;
          min-height: 100vh;
          background-color: #a7d5e1;
        }

        .sidebar-wrapper {
          display: flex;
          width: 100%;
        }

        .content-wrapper {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .employee-detail-card {
          background: #dceef3;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .employee-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 1rem;
        }

        .employee-header h2 {
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1.8rem;
        }

        .header-icon {
          color: #0078d4;
        }

        .action-buttons {
          display: flex;
          gap: 0.8rem;
        }

        .action-buttons button {
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          font-size: 0.9rem;
        }

        .btn-edit {
          background-color: #3498db;
          color: white;
        }

        .btn-edit:hover {
          background-color: #2980b9;
        }

        .btn-back {
          background-color: #95a5a6;
          color: white;
        }

        .btn-back:hover {
          background-color: #7f8c8d;
        }

        .btn-print {
          background-color: #2ecc71;
          color: white;
        }

        .btn-print:hover {
          background-color: #27ae60;
        }

        .profile-section {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          align-items: center;
        }

        .profile-images {
          display: flex;
          gap: 1rem;
        }

        .profile-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          border: 3px solid #eaeaea;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .basic-info {
          flex: 1;
        }

        .basic-info h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #2c3e50;
        }

        .designation {
          font-size: 1.2rem;
          color: #0078d4;
          margin: 0.3rem 0;
          font-weight: 600;
        }

        .department {
          color: #7f8c8d;
          margin: 0.3rem 0;
        }

        .employee-id {
          color: #95a5a6;
          font-size: 0.9rem;
        }

        .detail-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .detail-section {
          background: #a7d5e1;
          border-radius: 8px;
          padding: 1.2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .detail-section h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
        }

        .detail-row {
          display: flex;
          margin-bottom: 0.8rem;
          font-size: 0.95rem;
        }

        .detail-row span:first-child {
          font-weight: 600;
          color: #34495e;
          min-width: 120px;
          width: 120px;
        }

        .detail-row span:last-child {
          color: #2c3e50;
          flex: 1;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #0078d4;
        }

        @media (max-width: 768px) {
          .profile-section {
            flex-direction: column;
            text-align: center;
          }

          .profile-images {
            justify-content: center;
          }

          .detail-sections {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
            width: 100%;
          }

          .action-buttons button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetailPage;
