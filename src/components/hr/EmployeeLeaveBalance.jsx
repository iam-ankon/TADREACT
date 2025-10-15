import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebars from "./sidebars";

const EmployeeLeaveBalance = () => {
  const [balances, setBalances] = useState([]);
  const [setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://119.148.51.38:8000/api/hrms/api/employee_leave_balances/"
        );
        setBalances(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leave balances:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const containerStyle = {
    display: "flex",

    backgroundColor: "#A7D5E1",
    minHeight: "100vh",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "40px 50px",
  };

  const headingStyle = {
    color: "#0a58ca",
    fontSize: "24px",
    marginBottom: "25px",
    borderBottom: "2px solid #ccc",
    paddingBottom: "10px",
  };

  const tableContainerStyle = {
    overflowX: "auto",
    backgroundColor: "#DCEEF3",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle = {
    backgroundColor: "#f0f4f9",
    color: "#333",
    padding: "12px 14px",
    textAlign: "center",
    fontWeight: "600",
    borderBottom: "1px solid #ddd",
  };

  const tdStyle = {
    padding: "12px 14px",
    textAlign: "center",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    color: "#444",
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Your page content here */}
        </div>
      </div>
      <div style={mainContentStyle}>
        <h2 style={headingStyle}>Employee Leave Balances</h2>
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Employee Name</th>
                <th style={thStyle}>Public Festival Holiday</th>
                <th style={thStyle}>Casual Leave</th>
                <th style={thStyle}>Sick Leave</th>
                <th style={thStyle}>Earned Leave</th>
                <th style={thStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => (
                <tr key={balance.id}>
                  <td style={tdStyle}>{balance.employee_name}</td>
                  <td style={tdStyle}>{balance.public_festival_holiday}</td>
                  <td style={tdStyle}>{balance.casual_leave}</td>
                  <td style={tdStyle}>{balance.sick_leave}</td>
                  <td style={tdStyle}>{balance.earned_leave}</td>
                  <td style={tdStyle}>{balance.leave_balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveBalance;
