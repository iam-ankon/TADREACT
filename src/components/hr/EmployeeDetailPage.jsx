// EmployeeDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEmployeeById,
  getCustomerById,
  getAllCustomers,
  getPerformanceAppraisalsByEmployeeId,
  sendWelcomeEmail,
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
  FaPaperPlane,
  FaIdCard,
  FaBriefcase,
  FaHome,
  FaUser,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [customerNames, setCustomerNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incrementHistory, setIncrementHistory] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

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
    const diffTime = today.getTime() - joinDate.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    return `${years} year(s), ${months} month(s), ${days} day(s)`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "৳0";
    return `৳${Number(amount).toLocaleString('en-BD')}`;
  };

  // Calculate total salary
  const calculateTotalSalary = () => {
    if (!employee) return "৳0";
    const basic = Number(employee.salary) || 0;
    const cash = Number(employee.salary_cash) || 0;
    return formatCurrency(basic + cash);
  };

  // Function to show confirmation dialog
  const handleSendWelcomeEmailClick = () => {
    if (!employee) return;
    setShowConfirmation(true);
  };

  // Function to send welcome email after confirmation
  const handleConfirmSendEmail = async () => {
    if (!employee) return;

    setShowConfirmation(false); // Close confirmation dialog

    try {
      setSendingEmail(true);
      setEmailStatus("Sending welcome emails...");

      const response = await sendWelcomeEmail(employee.id);

      if (response.data && response.data.success) {
        setEmailStatus(
          `✅ ${response.data.message || "Welcome emails sent successfully!"}`
        );
        setTimeout(() => {
          setEmailStatus("");
        }, 5000);
      } else {
        setEmailStatus("❌ Failed to send welcome emails");
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      setEmailStatus(
        `❌ Error: ${error.response?.data?.message || error.message}`
      );
      setTimeout(() => {
        setEmailStatus("");
      }, 5000);
    } finally {
      setSendingEmail(false);
    }
  };

  // Function to cancel sending email
  const handleCancelSendEmail = () => {
    setShowConfirmation(false);
    setEmailStatus("❌ Email sending cancelled");
    setTimeout(() => {
      setEmailStatus("");
    }, 3000);
  };

  // Fetch employee details
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const response = await getEmployeeById(id);
        const employeeData = response.data;
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
        setCustomerNames([]);
        return;
      }

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
          const numericId = parseInt(customerId);
          if (isNaN(numericId)) {
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
            names.push("Error Loading");
          }
        }
      }

      setCustomerNames(names);
    };

    if (employee) {
      fetchCustomerNames();
    }
  }, [employee]);

  // Fetch increment history
  useEffect(() => {
    const fetchIncrementHistory = async () => {
      if (!employee?.employee_id) return;

      try {
        const response = await getPerformanceAppraisalsByEmployeeId(
          employee.employee_id
        );

        if (response.data) {
          const approvedIncrements = response.data.filter((appraisal) => {
            const matchesEmployee =
              appraisal.employee_id === employee.employee_id;
            const isApprovedIncrement =
              appraisal.increment === true &&
              appraisal.increment_approved === true;
            return matchesEmployee && isApprovedIncrement;
          });
          setIncrementHistory(approvedIncrements);
        } else {
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

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Details - ${employee?.name || ''}</title>
          <style>
            body {
              margin: 20px;
              color: #2c3e50;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #f8fafc;
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0f2fe;
            }
            .print-header h2 {
              margin: 0;
              color: #1e40af;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .print-subtitle {
              color: #64748b;
              font-size: 14px;
              margin-top: 5px;
            }
            .profile-section {
              display: flex;
              margin-bottom: 30px;
              align-items: center;
              padding: 20px;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border-radius: 12px;
            }
            .profile-images {
              display: flex;
              gap: 15px;
              margin-right: 30px;
            }
            .profile-image {
              width: 100px;
              height: 100px;
              object-fit: cover;
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .basic-info h3 {
              margin: 0 0 8px 0;
              font-size: 24px;
              color: #1e293b;
              font-weight: 700;
            }
            .designation {
              font-weight: 600;
              color: #3b82f6;
              margin: 0 0 5px 0;
              font-size: 16px;
            }
            .employee-id {
              color: #64748b;
              font-size: 14px;
              background: #f1f5f9;
              padding: 4px 12px;
              border-radius: 20px;
              display: inline-block;
            }
            .detail-sections {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .detail-section {
              margin-bottom: 20px;
              background: white;
              border-radius: 10px;
              padding: 20px;
              border: 1px solid #e2e8f0;
            }
            .detail-section h4 {
              margin: 0 0 15px 0;
              font-size: 16px;
              color: #1e40af;
              border-bottom: 2px solid #e0f2fe;
              padding-bottom: 8px;
              font-weight: 600;
            }
            .detail-row {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
              padding: 8px 0;
              border-bottom: 1px dashed #f1f5f9;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-row span:first-child {
              font-weight: 600;
              min-width: 140px;
              color: #475569;
            }
            .detail-row span:last-child {
              color: #334155;
            }
            .increment-item {
              background: #f0fdf4;
              padding: 8px 12px;
              border-radius: 6px;
              margin-bottom: 6px;
              border-left: 3px solid #10b981;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <h2>Employee Details</h2>
              <div class="print-subtitle">Generated on ${new Date().toLocaleDateString()}</div>
            </div>
            
            <div class="profile-section">
              <div class="profile-images">
                <img src="${employee?.image1 || ''}" alt="Employee" class="profile-image" />
                ${employee?.image2 ? `<img src="${employee.image2}" alt="Employee Secondary" class="profile-image" />` : ''}
              </div>
              
              <div class="basic-info">
                <h3>${employee?.name || 'N/A'}</h3>
                <p class="designation">${employee?.designation || 'N/A'}</p>
                <p class="department">${employee?.department_name || 'N/A'}</p>
                <p class="employee-id">ID: ${employee?.employee_id || 'N/A'}</p>
              </div>
            </div>

            <div class="detail-sections">
              <div class="detail-section">
                <h4>Company Information</h4>
                <div class="detail-row">
                  <span>Company:</span>
                  <span>${employee?.company_name || employee?.company || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Job Title:</span>
                  <span>${employee?.job_title || employee?.designation || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Salary:</span>
                  <span>${formatCurrency(employee?.salary)}</span>
                </div>
                <div class="detail-row">
                  <span>Joining Date:</span>
                  <span>${employee?.joining_date || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Reporting Leader:</span>
                  <span>${employee?.reporting_leader || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Customers:</span>
                  <span>${customerNames.length > 0 ? customerNames.join(", ") : "N/A"}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Contact Information</h4>
                <div class="detail-row">
                  <span>Email:</span>
                  <span>${employee?.email || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Personal Phone:</span>
                  <span>${employee?.personal_phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Office Phone:</span>
                  <span>${employee?.office_phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Reference Phone:</span>
                  <span>${employee?.reference_phone || "N/A"}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Address Information</h4>
                <div class="detail-row">
                  <span>Mailing Address:</span>
                  <span>${employee?.mail_address || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Permanent Address:</span>
                  <span>${employee?.permanent_address || 'N/A'}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>Personal Information</h4>
                <div class="detail-row">
                  <span>Date of Birth:</span>
                  <span>${employee?.date_of_birth || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span>Special Skills:</span>
                  <span>${employee?.special_skills || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span>Remarks:</span>
                  <span>${employee?.remarks || "N/A"}</span>
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

  if (loading) {
    return (
      <div className="employee-detail-container">
        <Sidebars />
        <div className="content-wrapper">
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="employee-detail-container">
        <Sidebars />
        <div className="content-wrapper">
          <div className="employee-detail-card">
            <div className="error-state">
              <h3>Employee Not Found</h3>
              <p>The requested employee could not be found.</p>
              <button 
                onClick={() => navigate('/employees')}
                className="btn-back"
              >
                <FaArrowLeft /> Back to Employees
              </button>
            </div>
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
          <div className="scrollable-content">
            {/* Email Status Notification */}
            {emailStatus && (
              <div
                className={`email-status ${
                  emailStatus.includes("✅") ? "success" : "error"
                }`}
              >
                {emailStatus}
              </div>
            )}

            {/* Header with Actions */}
            <div className="employee-header">
              <div className="header-content">
                <h1>
                  <FaUserTie className="header-icon" />
                  Employee Profile
                </h1>
                <p className="header-subtitle">
                  Comprehensive details for {employee.name}
                </p>
              </div>
              <div className="action-buttons">
                <button
                  onClick={handleSendWelcomeEmailClick}
                  className="btn-email"
                  disabled={sendingEmail}
                >
                  <FaPaperPlane />
                  {sendingEmail ? "Sending..." : "Send Welcome Email"}
                </button>
                <button
                  onClick={() => navigate(`/edit-employee/${id}`)}
                  className="btn-edit"
                >
                  <FaEdit /> Edit Profile
                </button>
                <button onClick={handlePrint} className="btn-print">
                  <FaPrint /> Print
                </button>
                <button
                  onClick={() => navigate(`/employees`)}
                  className="btn-back"
                >
                  <FaArrowLeft /> Back
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div id="printable-area" className="employee-content">
              {/* Profile Summary */}
              <div className="profile-summary">
                <div className="profile-images">
                  <div className="image-container">
                    <img
                      src={employee.image1}
                      alt="Employee"
                      className="profile-image primary"
                    />
                  </div>
                  {employee.image2 && (
                    <div className="image-container secondary">
                      <img
                        src={employee.image2}
                        alt="Employee Secondary"
                        className="profile-image"
                      />
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <div className="name-title">
                    <h2>{employee.name}</h2>
                    <div className="designation-badge">
                      <FaBriefcase />
                      <span>{employee.designation}</span>
                    </div>
                  </div>
                  <div className="employee-meta">
                    <div className="meta-item">
                      <FaIdCard />
                      <span>ID: {employee.employee_id}</span>
                    </div>
                    <div className="meta-item">
                      <FaBuilding />
                      <span>{employee.department_name}</span>
                    </div>
                    <div className="meta-item">
                      <FaCalendarAlt />
                      <span>Joined: {employee.joining_date}</span>
                    </div>
                  </div>
                  <div className="service-duration">
                    <FaStar />
                    <span>Service: {calculateLengthOfService(employee.joining_date)}</span>
                  </div>
                </div>
                <div className="salary-summary">
                  <div className="salary-item">
                    <span className="salary-label">Basic Salary</span>
                    <span className="salary-amount">{formatCurrency(employee.salary)}</span>
                  </div>
                  <div className="salary-item">
                    <span className="salary-label">Cash Portion</span>
                    <span className="salary-amount">{formatCurrency(employee.salary_cash)}</span>
                  </div>
                  <div className="salary-total">
                    <span className="salary-label">Total Salary</span>
                    <span className="salary-amount total">{calculateTotalSalary()}</span>
                  </div>
                </div>
              </div>

              {/* Detail Sections */}
              <div className="detail-grid">
                {/* Company Information */}
                <div className="detail-card">
                  <div className="card-header">
                    <FaBuilding className="card-icon" />
                    <h3>Company Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <span className="info-label">Company</span>
                      <span className="info-value">{employee.company_name || employee.company}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Reporting Leader</span>
                      <span className="info-value">{employee.reporting_leader}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Job Title</span>
                      <span className="info-value">{employee.job_title}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Customers</span>
                      <span className="info-value customers">
                        {customerNames.length > 0 ? (
                          customerNames.map((name, idx) => (
                            <span key={idx} className="customer-tag">{name}</span>
                          ))
                        ) : (
                          <span className="no-data">No assigned customers</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="detail-card">
                  <div className="card-header">
                    <FaEnvelope className="card-icon" />
                    <h3>Contact Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value email">{employee.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Personal Phone</span>
                      <span className="info-value">{employee.personal_phone}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Office Phone</span>
                      <span className="info-value">{employee.office_phone}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Emergency Contact</span>
                      <span className="info-value">{employee.emergency_contact || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="detail-card">
                  <div className="card-header">
                    <FaMapMarkerAlt className="card-icon" />
                    <h3>Address Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <span className="info-label">Mailing Address</span>
                      <span className="info-value">{employee.mail_address}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Permanent Address</span>
                      <span className="info-value">{employee.permanent_address}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Bank Details</span>
                      <div className="info-value bank-details">
                        <div>{employee.bank_account || "N/A"}</div>
                        <div className="bank-branch">{employee.branch_name || ""}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="detail-card">
                  <div className="card-header">
                    <FaUser className="card-icon" />
                    <h3>Personal Information</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-row">
                      <span className="info-label">Date of Birth</span>
                      <span className="info-value">{employee.date_of_birth}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Gender</span>
                      <span className="info-value">{displayGender(employee.gender)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">NID Number</span>
                      <span className="info-value">{employee.nid_number || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Blood Group</span>
                      <span className="info-value blood-group">{employee.blood_group || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Skills & Remarks */}
                <div className="detail-card">
                  <div className="card-header">
                    <FaStar className="card-icon" />
                    <h3>Skills & Remarks</h3>
                  </div>
                  <div className="card-content">
                    <div className="info-row full-width">
                      <span className="info-label">Special Skills</span>
                      <span className="info-value">{employee.special_skills || "No special skills recorded"}</span>
                    </div>
                    <div className="info-row full-width">
                      <span className="info-label">Remarks</span>
                      <span className="info-value remarks">{employee.remarks || "No remarks"}</span>
                    </div>
                  </div>
                </div>

                {/* Increment History */}
                <div className="detail-card">
                  <div className="card-header">
                    <FaChartLine className="card-icon" />
                    <h3>Increment History</h3>
                  </div>
                  <div className="card-content">
                    {incrementHistory.length > 0 ? (
                      <div className="increment-history">
                        {incrementHistory.map((inc, idx) => (
                          <div key={idx} className="increment-item">
                            <div className="increment-date">
                              {inc.last_increment_date || "N/A"}
                            </div>
                            <div className="increment-amount">
                              <span className="from-amount">{formatCurrency(inc.present_salary)}</span>
                              <span className="increment-arrow">→</span>
                              <span className="to-amount">{formatCurrency(inc.proposed_salary)}</span>
                            </div>
                            {inc.remarks && (
                              <div className="increment-remarks">{inc.remarks}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-increment">
                        <p>No approved increment history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <FaExclamationTriangle className="modal-icon" />
              <h3>Confirm Email Sending</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to send welcome emails to{" "}
                <strong>{employee.name}</strong>?
              </p>
              <p className="modal-warning">
                This action will send welcome emails to the employee's registered
                email address and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCancelSendEmail}
                className="modal-btn modal-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSendEmail}
                className="modal-btn modal-btn-confirm"
                disabled={sendingEmail}
              >
                {sendingEmail ? "Sending..." : "Yes, Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .employee-detail-container {
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

        .employee-detail-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          min-height: 90vh;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
        }

        .scrollable-content {
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          padding: 2rem;
        }

        /* Email Status */
        .email-status {
          padding: 12px 20px;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-weight: 500;
          text-align: center;
          animation: slideIn 0.3s ease-out;
          backdrop-filter: blur(10px);
        }

        .email-status.success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .email-status.error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #7f1d1d;
          border: 1px solid #fca5a5;
        }

        /* Header */
        .employee-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f1f5f9;
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

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-buttons button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-email {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-email:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        .btn-email:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-edit {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }

        .btn-edit:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .btn-print {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .btn-print:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn-back {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
        }

        .btn-back:hover {
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
        }

        /* Profile Summary */
        .profile-summary {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 2.5rem;
          align-items: center;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 2rem;
          border-radius: 16px;
          margin-bottom: 2.5rem;
          border: 1px solid #bae6fd;
        }

        .profile-images {
          display: flex;
          gap: 1rem;
        }

        .image-container {
          position: relative;
        }

        .profile-image {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease;
        }

        .profile-image:hover {
          transform: scale(1.05);
        }

        .image-container.secondary .profile-image {
          border-color: #fef3c7;
        }

        .profile-info {
          flex: 1;
        }

        .name-title {
          margin-bottom: 1rem;
        }

        .name-title h2 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          color: #1e293b;
          font-weight: 700;
        }

        .designation-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .employee-meta {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #475569;
          font-size: 0.9rem;
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .meta-item svg {
          color: #3b82f6;
        }

        .service-duration {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .salary-summary {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          min-width: 220px;
        }

        .salary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.5rem;
          border-bottom: 1px dashed #e2e8f0;
        }

        .salary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          border-top: 2px solid #3b82f6;
        }

        .salary-label {
          color: #64748b;
          font-size: 0.9rem;
        }

        .salary-amount {
          color: #1e293b;
          font-weight: 600;
          font-size: 1rem;
        }

        .salary-amount.total {
          color: #059669;
          font-size: 1.2rem;
          font-weight: 700;
        }

        /* Detail Grid */
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .detail-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .detail-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .card-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .card-icon {
          color: #3b82f6;
          font-size: 1.1rem;
        }

        .card-content {
          padding: 1.5rem;
        }

        .info-row {
          display: flex;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .info-row.full-width {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .info-label {
          flex: 0 0 140px;
          color: #64748b;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .info-value {
          flex: 1;
          color: #1e293b;
          line-height: 1.5;
        }

        .info-value.email {
          color: #3b82f6;
          word-break: break-all;
        }

        .info-value.remarks {
          background: #f8fafc;
          padding: 0.75rem;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }

        .customers {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .customer-tag {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .bank-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .bank-branch {
          font-size: 0.85rem;
          color: #64748b;
        }

        .blood-group {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-weight: 600;
          display: inline-block;
        }

        /* Increment History */
        .increment-history {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .increment-item {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 1rem;
          border-radius: 10px;
          border-left: 4px solid #10b981;
          transition: transform 0.2s ease;
        }

        .increment-item:hover {
          transform: translateX(4px);
        }

        .increment-date {
          color: #059669;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .increment-amount {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .from-amount {
          color: #6b7280;
          text-decoration: line-through;
        }

        .increment-arrow {
          color: #059669;
          font-weight: bold;
        }

        .to-amount {
          color: #059669;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .increment-remarks {
          color: #6b7280;
          font-size: 0.85rem;
          font-style: italic;
          padding-top: 0.5rem;
          border-top: 1px dashed #d1fae5;
        }

        .no-increment {
          text-align: center;
          padding: 2rem 1rem;
          color: #9ca3af;
        }

        .no-data {
          color: #9ca3af;
          font-style: italic;
        }

        /* Confirmation Modal */
        .confirmation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          backdrop-filter: blur(4px);
        }

        .confirmation-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease-out;
          border: 1px solid #e2e8f0;
        }

        .modal-header {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid #fbbf24;
        }

        .modal-icon {
          color: #d97706;
          font-size: 1.5rem;
        }

        .modal-header h3 {
          margin: 0;
          color: #92400e;
          font-size: 1.3rem;
          font-weight: 600;
        }

        .modal-body {
          padding: 2rem;
          color: #374151;
          line-height: 1.6;
        }

        .modal-body p {
          margin: 0 0 1rem 0;
        }

        .modal-body strong {
          color: #1e40af;
        }

        .modal-warning {
          background: #fef2f2;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
          color: #7f1d1d;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .modal-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .modal-btn-cancel {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .modal-btn-cancel:hover {
          background: #e5e7eb;
        }

        .modal-btn-confirm {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: 1px solid #7c3aed;
        }

        .modal-btn-confirm:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(123, 58, 237, 0.3);
        }

        .modal-btn-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Loading State */
        .loading-overlay {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          gap: 1rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #e0f2fe;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .error-state h3 {
          color: #dc2626;
          margin-bottom: 1rem;
        }

        /* Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .profile-summary {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .employee-meta {
            justify-content: center;
          }

          .salary-summary {
            flex-direction: row;
            justify-content: space-around;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 1rem;
          }

          .scrollable-content {
            padding: 1.5rem;
          }

          .employee-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-buttons button {
            width: 100%;
            justify-content: center;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .info-row {
            flex-direction: column;
            gap: 0.25rem;
          }

          .info-label {
            flex: none;
          }

          .confirmation-modal {
            width: 95%;
            margin: 1rem;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .profile-images {
            justify-content: center;
          }

          .profile-image {
            width: 100px;
            height: 100px;
          }

          .name-title h2 {
            font-size: 1.5rem;
          }

          .salary-summary {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDetailPage;