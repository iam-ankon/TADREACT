// src/pages/finance/SalaryFormat.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

const SalaryFormat = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("sourceTaxOther");
    if (saved) setSourceOther(JSON.parse(saved));

    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${API_BASE}/employees/`);
        setEmployees(res.data.filter(e => e.salary && e.employee_id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      calculateAllTaxes();
    }
  }, [employees, sourceOther]);

  const calculateAllTaxes = async () => {
    const results = {};
    for (const emp of employees) {
      const gender = emp.gender === "M" ? "Male" : "Female";
      const other = sourceOther[emp.employee_id] || 0;
      try {
        const calc = await axios.post(`${API_BASE}/calculate/`, {
          employee_id: emp.employee_id,
          gender,
          source_other: parseFloat(other) || 0,
        });
        results[emp.employee_id] = calc.data;
      } catch (err) {
        results[emp.employee_id] = { error: "Failed" };
      }
    }
    setTaxResults(results);
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
        <style jsx>{`
          .center-screen {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            justify-content: center;
            align-items: center;
            padding: 1rem;
          }
          .fullscreen-loader {
            text-align: center;
          }
          .spinner {
            width: 80px;
            height: 80px;
            border: 8px solid #f0f0f0;
            border-top: 8px solid #7c3aed;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
          }
        `}</style>
      </div>
    );
  }

  const grouped = employees.reduce((acc, emp) => {
    const comp = emp.company_name || "Unknown";
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(emp);
    return acc;
  }, {});

  const daysInMonth = 30; // November 2025

  return (
    <div className="center-screen">
      <div className="dashboard">
        <div className="card">
          <div className="header">
            <h1>Salary Format</h1>
            <button onClick={() => navigate(-1)} className="btn back">
              <FaArrowLeft /> Back
            </button>
          </div>

          {Object.keys(grouped).map((company, idx) => (
            <div key={idx} className="company-section">
              <h2>{company}</h2>
              <h3>Salary Sheet for the month of November - 2025</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SL</th>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Designation</th>
                      <th>DOJ</th>
                      <th>Basic</th>
                      <th>House Rent</th>
                      <th>Medical</th>
                      <th>Conveyance</th>
                      <th>Gross Salary</th>
                      <th>Actual Working Days</th>
                      <th>Deduction Leave</th>
                      <th>Deduction Late</th>
                      <th>Deduction Loan</th>
                      <th>Deduction Other</th>
                      <th>Total Deduction</th>
                      <th>Over Time Hours</th>
                      <th>Addition (TK.)</th>
                      <th>Net Pay in Bank</th>
                      <th>Cash Payment</th>
                      <th>Total Payable</th>
                      <th>Remarks</th>
                      <th>TAX (AIT)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[company].map((emp, index) => {
                      const salary = Number(emp.salary) || 0;
                      const basic = (salary * 0.6).toFixed(2);
                      const house_rent = (salary * 0.3).toFixed(2);
                      const medical = (salary * 0.05).toFixed(2);
                      const conveyance = (salary * 0.05).toFixed(2);
                      const gross = salary.toFixed(2);
                      const total_deduction = 0;
                      const ot_hours = 0;
                      const addition = 0;
                      const t = taxResults[emp.employee_id] || {};
                      const ait = t.tax_calculation?.monthly_tds || 0;
                      const net_pay = salary - total_deduction - ait + addition;
                      const cash = 0;
                      const total_payable = net_pay + cash;
                      const remarks = emp.remarks || "";

                      return (
                        <tr key={emp.employee_id}>
                          <td>{index + 1}</td>
                          <td>{emp.name}</td>
                          <td>{emp.employee_id}</td>
                          <td>{emp.designation}</td>
                          <td>{emp.joining_date}</td>
                          <td>৳{Number(basic).toLocaleString()}</td>
                          <td>৳{Number(house_rent).toLocaleString()}</td>
                          <td>৳{Number(medical).toLocaleString()}</td>
                          <td>৳{Number(conveyance).toLocaleString()}</td>
                          <td>৳{Number(gross).toLocaleString()}</td>
                          <td>{daysInMonth}</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>{ot_hours}</td>
                          <td>৳{addition.toLocaleString()}</td>
                          <td>৳{net_pay.toLocaleString()}</td>
                          <td>৳{cash.toLocaleString()}</td>
                          <td>৳{total_payable.toLocaleString()}</td>
                          <td>{remarks}</td>
                          <td>৳{ait.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="footer">
                <span>Prepared by: HR</span>
                <span>Checked by: Finance & Accounts</span>
                <span>Checked by: Director</span>
                <span>Approved by: Proprietor / MD</span>
              </div>
            </div>
          ))}

          <div className="summary-section">
            <h2>Summary</h2>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Name of Company</th>
                    <th>NOE</th>
                    <th>Gross Salary</th>
                    <th>TAX</th>
                    <th>Total Deduction</th>
                    <th>Net Pay in Bank</th>
                    <th>Cash</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(grouped).map((company, idx) => {
                    const compEmps = grouped[company];
                    const noe = compEmps.length;
                    const grossSum = compEmps.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
                    const taxSum = compEmps.reduce(
                      (sum, emp) => sum + (taxResults[emp.employee_id]?.tax_calculation?.monthly_tds || 0),
                      0
                    );
                    const totalDed = 0;
                    const netPay = grossSum - taxSum - totalDed;
                    const cash = 0;
                    const total = netPay + cash;

                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{company}</td>
                        <td>{noe}</td>
                        <td>৳{grossSum.toLocaleString()}</td>
                        <td>৳{taxSum.toLocaleString()}</td>
                        <td>৳{totalDed.toLocaleString()}</td>
                        <td>৳{netPay.toLocaleString()}</td>
                        <td>৳{cash.toLocaleString()}</td>
                        <td>৳{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  <tr className="grand-total">
                    <td colSpan="2">Grand Total</td>
                    <td>{employees.length}</td>
                    <td>
                      ৳{employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0).toLocaleString()}
                    </td>
                    <td>
                      ৳{employees.reduce(
                        (sum, emp) => sum + (taxResults[emp.employee_id]?.tax_calculation?.monthly_tds || 0),
                        0
                      ).toLocaleString()}
                    </td>
                    <td>৳0</td>
                    <td>
                      ৳{(employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0) -
                        employees.reduce(
                          (sum, emp) => sum + (taxResults[emp.employee_id]?.tax_calculation?.monthly_tds || 0),
                          0
                        )).toLocaleString()}
                    </td>
                    <td>৳0</td>
                    <td>
                      ৳{(employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0) -
                        employees.reduce(
                          (sum, emp) => sum + (taxResults[emp.employee_id]?.tax_calculation?.monthly_tds || 0),
                          0
                        )).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .center-screen {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          justify-content: center;
          align-items: center;
          padding: 1rem;
        }
        .dashboard {
          width: 100%;
          max-width: 1400px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .card {
          padding: 2rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .header h1 {
          font-size: 2.2rem;
          color: #1e3a8a;
          font-weight: 700;
        }
        .btn.back {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 12px;
          background: #7c3aed;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.3s;
        }
        .btn.back:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .company-section {
          margin-bottom: 3rem;
        }
        .company-section h2 {
          font-size: 1.8rem;
          color: #1e3a8a;
          margin-bottom: 0.5rem;
        }
        .company-section h3 {
          font-size: 1.2rem;
          color: #4b5563;
          margin-bottom: 1rem;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 2000px; /* To handle many columns */
        }
        .table th {
          background: #5b7fdb;
          color: white;
          padding: 1rem;
          text-align: center;
          font-weight: 600;
        }
        .table td {
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid #eee;
        }
        .footer {
          display: flex;
          justify-content: space-around;
          margin-top: 1rem;
          font-size: 0.9rem;
          color: #4b5563;
        }
        .footer span {
          margin: 0 1rem;
        }
        .summary-section {
          margin-top: 3rem;
        }
        .summary-section h2 {
          font-size: 1.8rem;
          color: #1e3a8a;
          margin-bottom: 1rem;
        }
        .grand-total {
          font-weight: bold;
          background: #f3f4f6;
        }
        @media (max-width: 768px) {
          .footer {
            flex-direction: column;
            text-align: center;
          }
          .table th, .table td {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryFormat;