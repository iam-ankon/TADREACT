// EmployeeDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployeeById } from "../../api/employeeApi";
import axios from "axios";
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

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const response = await getEmployeeById(id);
        setEmployee(response.data);
      } catch (error) {
        console.error("Error fetching employee details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  useEffect(() => {
    const fetchCustomerNames = async () => {
      if (employee?.customer && employee.customer.length > 0) {
        const names = [];
        for (const customerId of employee.customer) {
          try {
            const response = await axios.get(
              `http://119.148.12.1:8000/api/hrms/api/customers/${customerId}/`
            );
            names.push(response.data.customer_name);
          } catch (error) {
            console.error(`Error fetching customer ${customerId}`, error);
            names.push("N/A");
          }
        }
        setCustomerNames(names);
      } else {
        setCustomerNames([]);
      }
    };

    fetchCustomerNames();
  }, [employee]);

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

  if (!employee) return;
  if (loading) return <div className="loading-spinner">Loading...</div>;

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
                <button onClick={() => navigate(-1)} className="btn-back">
                  <FaArrowLeft /> Back
                </button>
                <button onClick={handlePrint} className="btn-print">
                  <FaPrint /> Print
                </button>
              </div>
            </div>

            <div id="printable-area">
              {/* <div className="print-header">
                <h2>Employee Details</h2>
              </div> */}

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
                        : "N/A"}
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
