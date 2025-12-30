import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Sidebars from "./sidebars";
import { 
  getEmployeeLeaveById, 
  getEmployeeLeaveBalances, 
  getEmployeeLeaveTypes,
  getEmployeeDetailsByCode // ADD THIS IMPORT
} from "../../api/employeeApi";

const LeaveRequestDetails = () => {
  const { id } = useParams();
  const [leave, setLeave] = useState(null);
  const [leaveEntitlements, setLeaveEntitlements] = useState({
    earned_leave: 0,
    casual_leave: 0,
    sick_leave: 0,
    public_festival_holiday: 0,
  });
  const [leaveBalances, setLeaveBalances] = useState({
    casual_leave: 0,
    sick_leave: 0,
    earned_leave: 0,
  });
  const [designation, setDesignation] = useState(""); // ADD THIS STATE
  const [loading, setLoading] = useState(true);
  const formRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all required data using centralized API
        const [leaveRes, balancesRes, typesRes] = await Promise.all([
          getEmployeeLeaveById(id),
          getEmployeeLeaveBalances(),
          getEmployeeLeaveTypes(),
        ]);

        const leaveData = leaveRes.data;
        setLeave(leaveData);

        // FETCH DESIGNATION SEPARATELY
        let correctDesignation = "";
        const employeeCode = leaveData.employee_code || leaveData.employee?.employee_id;

        // Try to get designation from multiple sources
        if (leaveData.employee && typeof leaveData.employee === 'object') {
          correctDesignation = leaveData.employee.designation || "";
        } else if (leaveData.designation) {
          correctDesignation = leaveData.designation;
        }

        // If still no designation, fetch employee details
        if (!correctDesignation && employeeCode) {
          try {
            console.log("🔄 Fetching employee details for designation...");
            const employeeData = await getEmployeeDetailsByCode(employeeCode);
            
            if (employeeData) {
              correctDesignation = employeeData.designation || "";
              console.log("✅ Fetched designation:", correctDesignation);
            } else {
              console.warn("⚠️ No employee data found for code:", employeeCode);
            }
          } catch (empError) {
            console.warn("❌ Could not fetch employee details:", empError);
          }
        }

        setDesignation(correctDesignation);
        console.log("🎯 Final designation:", correctDesignation);

        // Process leave balances
        const employeeBalance = balancesRes.data.find(
          (balance) =>
            balance.employee === leaveData?.employee_id ||
            balance.employee_name === leaveData?.employee_name
        );

        if (employeeBalance) {
          setLeaveBalances({
            casual_leave: employeeBalance.casual_leave,
            sick_leave: employeeBalance.sick_leave,
            earned_leave: employeeBalance.earned_leave,
          });
        }

        // Process leave entitlements from EmployeeLeaveTypes
        if (typesRes.data && typesRes.data.length > 0) {
          // Assuming the first item contains all leave types
          const firstLeaveType = typesRes.data[0];
          setLeaveEntitlements({
            earned_leave: firstLeaveType.earned_leave || 0,
            casual_leave: firstLeaveType.casual_leave || 0,
            sick_leave: firstLeaveType.sick_leave || 0,
            public_festival_holiday:
              firstLeaveType.public_festival_holiday || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!leave) return <div>Leave request not found</div>;

  // Helper functions
  const getEntitledLeaveDays = (leaveType) => leaveEntitlements[leaveType] || 0;
  const getBalance = (leaveType) => leaveBalances[leaveType] || 0;
  const calculateLeaveAvailed = (leaveType) =>
    getEntitledLeaveDays(leaveType) - getBalance(leaveType);
  const getAppliedFor = (leaveType) =>
    leave.leave_type === leaveType ? leave.leave_days : "-";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <html>
                <head>
                    <title>Leave Application Form</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 5mm;
                        }
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            font-size: 9pt;
                            line-height: 1.2;
                        }
                        .form-container {
                            width: 100%;
                            padding: 5mm;
                            box-sizing: border-box;
                        }
                        h1 {
                            text-align: center;
                            margin: 5px 0;
                            font-size: 12pt;
                            text-transform: uppercase;
                        }
                        .form-row {
                            margin-bottom: 3px;
                            display: flex;
                            align-items: center;
                            page-break-inside: avoid;
                        }
                        label {
                            min-width: 100px;
                            margin-right: 5px;
                            font-weight: bold;
                        }
                        .field {
                            flex: 1;
                            min-width: 0;
                            padding: 2px;
                            border-bottom: 1px solid #ddd;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .divider {
                            border-top: 1px dashed #000;
                            margin: 5px 0;
                        }
                        .signature-line {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 10px;
                        }
                        .signature {
                            flex: 1;
                            text-align: center;
                            padding: 0 5px;
                            border-top: 1px solid #000;
                            margin-top: 20px;
                            font-style: italic;
                            font-size: 8pt;
                        }
                        .signature-box {
                            height: 15px;
                            border-bottom: 1px solid #000;
                            margin-top: 5px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 5px 0;
                            font-size: 8pt;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 2px;
                            text-align: center;
                        }
                        th {
                            background-color: #f2f2f2;
                            text-transform: uppercase;
                        }
                        .text-area {
                            min-height: 30px;
                            border: 1px solid #ddd;
                            padding: 2px;
                            background-color: #f9f9f9;
                            width: 100%;
                        }
                        .compact-row {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 5px;
                            align-items: center;
                            margin-bottom: 3px;
                        }
                        .compact-field {
                            padding: 2px;
                            border-bottom: 1px solid #ddd;
                        }
                    </style>
                </head>
                <body>
                    <div class="form-container">
                        ${formRef.current.innerHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 100);
                        };
                    </script>
                </body>
            </html>
        `);
    printWindow.document.close();
  };

  // Main styles
  const styles = {
    formContainer: {
      maxWidth: "8000px",
      margin: "auto",
      padding: "20px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      position: "relative",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    header: {
      textAlign: "center",
      marginBottom: "15px",
      fontSize: "20px",
      textTransform: "uppercase",
    },
    formRow: {
      marginBottom: "8px",
      display: "flex",
      alignItems: "center",
    },
    label: {
      minWidth: "120px",
      marginRight: "5px",
      fontWeight: "bold",
      fontSize: "14px",
    },
    field: {
      flex: "1",
      minWidth: "100px",
      padding: "4px",
      borderBottom: "1px solid #ddd",
      fontSize: "14px",
    },
    divider: {
      borderTop: "1px dashed #000",
      margin: "15px 0",
    },
    signatureLine: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
    },
    signature: {
      flex: "1",
      textAlign: "center",
      padding: "0 10px",
      borderTop: "1px solid #000",
      marginTop: "30px",
      fontStyle: "italic",
    },
    signatureBox: {
      height: "40px",
      borderBottom: "1px solid #000",
      marginTop: "5px",
    },
    printButton: {
      display: "block",
      margin: "20px auto",
      padding: "10px 20px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
    },
    sectionHeader: {
      fontSize: "16px",
      margin: "15px 0 8px",
      textAlign: "center",
      textTransform: "uppercase",
    },
    textAreaField: {
      minHeight: "50px",
      border: "1px solid #ddd",
      padding: "6px",
      backgroundColor: "#f9f9f9",
      width: "100%",
      fontSize: "14px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "10px",
      fontSize: "13px",
    },
    tableCell: {
      border: "1px solid #ddd",
      padding: "4px",
      textAlign: "center",
    },
    tableHeader: {
      backgroundColor: "#f2f2f2",
      textTransform: "uppercase",
      fontSize: "12px",
    },
    compactRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "5px",
      alignItems: "center",
      marginBottom: "5px",
    },
    compactField: {
      padding: "4px",
      borderBottom: "1px solid #ddd",
    },
  };

  const contentStyle = {
    flex: 1,
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  };
  const containerStyle = {
    display: "flex",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex" }}>
        <Sidebars />
      </div>
      <div style={contentStyle}>
        <div style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div ref={formRef} style={styles.formContainer}>
            <h1 style={styles.header}>LEAVE APPLICATION FORM</h1>
            {/* Employee Information - Two Column Layout */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div style={{ flex: "1", minWidth: "250px" }}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Date:</label>
                  <div style={styles.field}>
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>Employee ID:</label>
                  <div style={styles.field}>{leave.employee_code}</div>
                </div>
                {/* <div style={styles.formRow}>
                  <label style={styles.label}>Joining Date:</label>
                  <div style={styles.field}>{leave.joining_date}</div>
                </div> */}
                <div style={styles.formRow}>
                  <label style={styles.label}>To:</label>
                  <div style={styles.field}>{leave.to_email || "HR Department"}</div>
                </div>
              </div>
              <div style={{ flex: "1", minWidth: "250px" }}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Name of applicant:</label>
                  <div style={styles.field}>{leave.employee_name}</div>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>Designation:</label>
                  <div style={styles.field}>{designation || "N/A"}</div> {/* USE DESIGNATION STATE */}
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>Company:</label>
                  <div style={styles.field}>{leave.company_name}</div>
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>Department:</label>
                  <div style={styles.field}>{leave.department_name}</div>
                </div>
              </div>
            </div>

            {/* Rest of your component remains the same */}
            {/* Compact Leave Duration Row */}
            <div style={styles.compactRow}>
              <span>I wish to apply for</span>
              <div
                style={{
                  ...styles.compactField,
                  width: "30px",
                  textAlign: "center",
                }}
              >
                {leave.leave_days}
              </div>
              <span>days</span>
              <div style={{ ...styles.compactField, minWidth: "80px" }}>
                {leave.leave_type}
              </div>
              <span>from</span>
              <div style={{ ...styles.compactField, minWidth: "80px" }}>
                {leave.start_date}
              </div>
              <span>to</span>
              <div style={{ ...styles.compactField, minWidth: "80px" }}>
                {leave.end_date}
              </div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Reason for leave:</label>
              <div style={styles.textAreaField}>{leave.reason || "N/A"}</div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Whereabouts:</label>
              <div style={styles.field}>{leave.whereabouts || "N/A"}</div>
            </div>

            <div style={styles.divider}></div>

            {/* Contact Info */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ flex: "1", minWidth: "250px" }}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Mobile no:</label>
                  <div style={styles.field}>{leave.personal_phone}</div>
                </div>
              </div>
              <div style={{ flex: "1", minWidth: "250px" }}>
                <div style={styles.formRow}>
                  <label style={styles.label}>Substitute person:</label>
                  <div style={styles.field}>{leave.sub_person}</div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div style={{ marginTop: "15px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <div style={{ width: "48%" }}>
                  <div>Signature of Substitute:</div>
                  <div style={styles.signatureBox}></div>
                </div>
                <div style={{ width: "48%" }}>
                  <div>Signature of Applicant:</div>
                  <div style={styles.signatureBox}></div>
                </div>
              </div>
            </div>

            <div style={styles.divider}></div>

            {/* Leave Status Table */}
            <h2 style={styles.sectionHeader}>
              Leave Status (for official use)
            </h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{ ...styles.tableCell, ...styles.tableHeader }}
                  ></th>
                  <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                    Earned Leave
                  </th>
                  <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                    Casual Leave
                  </th>
                  <th style={{ ...styles.tableCell, ...styles.tableHeader }}>
                    Sick Leave
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.tableCell}>Leave entitled</td>
                  <td style={styles.tableCell}>
                    {getEntitledLeaveDays("earned_leave")}
                  </td>
                  <td style={styles.tableCell}>
                    {getEntitledLeaveDays("casual_leave")}
                  </td>
                  <td style={styles.tableCell}>
                    {getEntitledLeaveDays("sick_leave")}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Leave availed</td>
                  <td style={styles.tableCell}>
                    {calculateLeaveAvailed("earned_leave")}
                  </td>
                  <td style={styles.tableCell}>
                    {calculateLeaveAvailed("casual_leave")}
                  </td>
                  <td style={styles.tableCell}>
                    {calculateLeaveAvailed("sick_leave")}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Balance</td>
                  <td style={styles.tableCell}>{getBalance("earned_leave")}</td>
                  <td style={styles.tableCell}>{getBalance("casual_leave")}</td>
                  <td style={styles.tableCell}>{getBalance("sick_leave")}</td>
                </tr>
                <tr>
                  <td style={styles.tableCell}>Applied for</td>
                  <td style={styles.tableCell}>
                    {getAppliedFor("earned_leave")}
                  </td>
                  <td style={styles.tableCell}>
                    {getAppliedFor("casual_leave")}
                  </td>
                  <td style={styles.tableCell}>
                    {getAppliedFor("sick_leave")}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={styles.formRow}>
              <label style={styles.label}>Comments:</label>
              <div style={{ ...styles.textAreaField, minHeight: "40px" }}>
                {leave.comment || "N/A"}
              </div>
            </div>

            <div style={styles.signatureLine}>
              <span style={styles.signature}>Head of Department</span>
              <span style={styles.signature}>HR & Admin</span>
              <span style={styles.signature}>Authorized Signature</span>
            </div>

            <div style={styles.divider}></div>

            {/* Post-Leave Report */}
            <h2 style={styles.sectionHeader}>Report on joining after leave</h2>
            <div style={styles.formRow}>
              <label style={styles.label}>Scheduled joining date:</label>
              <div style={styles.field}>
                {leave.date_of_joining_after_leave || "N/A"}
              </div>
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Actual joining date:</label>
              <div style={styles.field}>
                {leave.actual_date_of_joining || "N/A"}
              </div>
            </div>
            <div style={styles.formRow}>
              <label style={styles.label}>Reason for delay:</label>
              <div style={{ ...styles.textAreaField, minHeight: "40px" }}>
                {leave.reson_for_delay || "N/A"}
              </div>
            </div>

            <div style={styles.signatureLine}>
              <span style={styles.signature}>Applicant Signature</span>
              <span style={styles.signature}>HR & Admin</span>
              <span style={styles.signature}>Authorized Signature</span>
            </div>
            <button style={styles.printButton} onClick={handlePrint}>
              Print Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestDetails;