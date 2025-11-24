// src/pages/finance/FinanceProvision.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaFileAlt } from "react-icons/fa";

import {
  FaSearch,
  FaDownload,
  FaEdit,
  FaSave,
  FaExclamationTriangle,
  FaCalculator,
} from "react-icons/fa";

const API_BASE = "http://119.148.51.38:8000/api/tax-calculator";

const FinanceProvision = () => {
  const [employees, setEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [calculating, setCalculating] = useState(false);
  const employeesPerPage = 10;
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // Load saved Source Other
  useEffect(() => {
    const saved = localStorage.getItem("sourceTaxOther");
    if (saved) setSourceOther(JSON.parse(saved));
  }, []);

  const saveSourceOther = (data) => {
    setSourceOther(data);
    localStorage.setItem("sourceTaxOther", JSON.stringify(data));
  };

  // Fetch employees only on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/employees/`);
        const valid = res.data.filter((e) => e.salary && e.employee_id);
        setEmployees(valid);

        // Load cached results if available
        const cachedResults = localStorage.getItem("cachedTaxResults");
        if (cachedResults) {
          setTaxResults(JSON.parse(cachedResults));
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Calculate taxes with batch processing and caching
  const calculateAllTaxes = async () => {
    if (calculating) return;

    try {
      setCalculating(true);
      setProgress(0);

      const validEmployees = employees.filter((e) => e.salary && e.employee_id);
      const results = {};
      const batchSize = 5; // Process 5 employees at a time

      for (let i = 0; i < validEmployees.length; i += batchSize) {
        const batch = validEmployees.slice(i, i + batchSize);

        const batchPromises = batch.map(async (emp) => {
          try {
            const gender = emp.gender === "M" ? "Male" : "Female";
            const other = sourceOther[emp.employee_id] || 0;

            const calc = await axios.post(`${API_BASE}/calculate/`, {
              employee_id: emp.employee_id,
              gender,
              source_other: parseFloat(other) || 0,
            });

            return { empId: emp.employee_id, data: calc.data };
          } catch (err) {
            console.error(`Failed to calculate for ${emp.employee_id}:`, err);
            return {
              empId: emp.employee_id,
              data: { error: "Failed", employee_name: emp.name },
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Process batch results
        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            results[result.value.empId] = result.value.data;
          }
        });

        // Update progress
        const currentProgress = Math.round(
          ((i + batch.length) / validEmployees.length) * 100
        );
        setProgress(currentProgress);

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setTaxResults(results);

      // Cache results
      localStorage.setItem("cachedTaxResults", JSON.stringify(results));
    } catch (err) {
      console.error("Error in tax calculation:", err);
    } finally {
      setCalculating(false);
    }
  };

  // Calculate taxes only when explicitly requested or when sourceOther changes significantly
  useEffect(() => {
    if (employees.length > 0 && Object.keys(sourceOther).length > 0) {
      const calculateTimeout = setTimeout(() => {
        calculateAllTaxes();
      }, 1000); // Debounce calculation

      return () => clearTimeout(calculateTimeout);
    }
  }, [sourceOther, employees.length]);

  const filtered = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id?.toString().includes(searchQuery)
  );

  const totalPages = Math.ceil(filtered.length / employeesPerPage);
  const start = (currentPage - 1) * employeesPerPage;
  const current = filtered.slice(start, start + employeesPerPage);

  useEffect(() => {
    if (!isInitialMount.current) setCurrentPage(1);
    else isInitialMount.current = false;
  }, [searchQuery]);

  const handleEdit = (emp) => {
    setEditingId(emp.employee_id);
    setEditValue(sourceOther[emp.employee_id] || "0");
  };

  const handleSave = async () => {
    const val = parseFloat(editValue) || 0;

    try {
      // Save to backend
      const response = await axios.post(`${API_BASE}/save-tax-extra/`, {
        employee_id: editingId,
        source_other: val,
      });

      if (response.data.success) {
        // Update local state only after successful backend save
        saveSourceOther({ ...sourceOther, [editingId]: val });
        setEditingId(null);

        // Recalculate taxes for this employee
        await recalculateEmployeeTax(editingId, val);
      }
    } catch (err) {
      console.error("Failed to save source tax other:", err);
      alert("Failed to save to server. Please try again.");
    }
  };

  // Add this helper function
  const recalculateEmployeeTax = async (empId, sourceOtherValue) => {
    try {
      const emp = employees.find((e) => e.employee_id === empId);
      if (!emp) return;

      const gender = emp.gender === "M" ? "Male" : "Female";

      const response = await axios.post(`${API_BASE}/calculate/`, {
        employee_id: empId,
        gender,
        source_other: sourceOtherValue,
      });

      if (response.data && !response.data.error) {
        // Update tax results for this employee
        setTaxResults((prev) => ({
          ...prev,
          [empId]: response.data,
        }));

        // Update cache
        const cachedResults = localStorage.getItem("cachedTaxResults");
        if (cachedResults) {
          const parsed = JSON.parse(cachedResults);
          parsed[empId] = response.data;
          localStorage.setItem("cachedTaxResults", JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error(`Failed to recalculate tax for ${empId}:`, error);
    }
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Salary",
      "Source Tax Other",
      "Net Tax",
      "Monthly TDS",
    ];
    const rows = filtered.map((emp) => {
      const t = taxResults[emp.employee_id] || {};
      const c = t.tax_calculation || {};
      return [
        emp.employee_id,
        emp.name,
        emp.salary,
        sourceOther[emp.employee_id] || 0,
        c.net_tax_payable || 0,
        c.monthly_tds || 0,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tax_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshCalculations = () => {
    calculateAllTaxes();
  };

  // CENTERED FULL-SCREEN LOADER
  if (loading) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner"></div>
          <p>Loading Employees...</p>
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
            to {
              transform: rotate(360deg);
            }
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

  return (
    <div className="center-screen">
      <div className="dashboard">
        <div className="card">
          {/* Header */}
          <div className="header">
            <h1>Finance Tax Dashboard</h1>
            <div className="actions">
              <button
                onClick={refreshCalculations}
                className="btn refresh"
                disabled={calculating}
              >
                <FaCalculator />{" "}
                {calculating ? `Calculating... ${progress}%` : "Refresh Taxes"}
              </button>
              <button onClick={exportCSV} className="btn export">
                <FaDownload /> Export
              </button>
              <button
                onClick={() => navigate("/tax-calculator")}
                className="btn calc"
              >
                <FaCalculator /> Manual Calc
              </button>
              <button
                onClick={() => navigate("/salary-format")}
                className="btn format"
              >
                <FaFileAlt /> Salary Sheet
              </button>
            </div>
          </div>

          {/* Progress Bar - Only show when calculating */}
          {calculating && (
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }}></div>
              <span>Calculating Taxes... {Math.round(progress)}%</span>
            </div>
          )}

          {/* Search */}
          <div className="search">
            <FaSearch />
            <input
              placeholder="Search Name / ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Info Banner */}
          <div className="info-banner">
            <FaExclamationTriangle />
            <span>
              Showing {filtered.length} employees.{" "}
              {calculating
                ? "Calculating taxes..."
                : "Click Refresh to update calculations."}
            </span>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Salary</th>
                  <th>Source Tax Other</th>
                  <th>Net Tax</th>
                  <th>Monthly TDS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {current.map((emp) => {
                  const res = taxResults[emp.employee_id] || {};
                  const calc = res.tax_calculation || {};
                  const other = sourceOther[emp.employee_id] || 0;

                  return (
                    <tr
                      key={emp.employee_id}
                      className="row"
                      onClick={() =>
                        navigate(`/tax-calculator/${emp.employee_id}`)
                      }
                    >
                      <td>{emp.employee_id}</td>
                      <td className="name">{emp.name}</td>
                      <td>৳{emp.salary?.toLocaleString()}</td>
                      <td>
                        {editingId === emp.employee_id ? (
                          <div className="edit-input">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSave()
                              }
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            <FaSave
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                              }}
                            />
                          </div>
                        ) : (
                          <div className="source-cell">
                            ৳{parseFloat(other).toLocaleString()}
                            <FaEdit
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(emp);
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="tax">
                        ৳{(calc.net_tax_payable || 0).toLocaleString()}
                      </td>
                      <td className="tds">
                        ৳{(calc.monthly_tds || 0).toLocaleString()}
                      </td>
                      <td>
                        {res.error ? (
                          <span className="error">
                            <FaExclamationTriangle /> Failed
                          </span>
                        ) : calc.net_tax_payable ? (
                          <span className="success">Calculated</span>
                        ) : (
                          <span className="pending">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
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
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
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
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header h1 {
          font-size: 2.2rem;
          color: #1e3a8a;
          font-weight: 700;
        }
        .actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: 0.3s;
          white-space: nowrap;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .refresh {
          background: #f59e0b;
          color: white;
        }
        .export {
          background: #10b981;
          color: white;
        }
        .calc {
          background: #7c3aed;
          color: white;
        }
        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .progress-bar {
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin: 1rem 0;
          position: relative;
        }
        .progress-bar > div {
          height: 100%;
          background: #7c3aed;
          width: 0;
          transition: width 0.3s;
        }
        .progress-bar span {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 0.9rem;
          color: #555;
        }

        .info-banner {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 0.8rem 1rem;
          margin: 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1e40af;
          font-size: 0.9rem;
        }

        .search {
          position: relative;
          max-width: 500px;
          margin: 1.5rem 0;
        }
        .search input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #ddd;
          border-radius: 12px;
          font-size: 1rem;
        }
        .search svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .table {
          width: 100%;
          border-collapse: collapse;
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
        .row {
          cursor: pointer;
          transition: 0.2s;
        }
        .row:hover {
          background: #f8faff;
        }
        .name {
          font-weight: 600;
          color: #1e293b;
        }
        .tax,
        .tds {
          font-weight: bold;
          color: #dc2626;
        }
        .success {
          color: #059669;
          font-weight: bold;
        }
        .pending {
          color: #f59e0b;
          font-weight: bold;
        }
        .error {
          color: #dc2626;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          justify-content: center;
        }

        .source-cell,
        .edit-input {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .edit-input input {
          width: 100px;
          padding: 0.4rem;
          border: 1px solid #7c3aed;
          border-radius: 6px;
        }
        .edit-input svg,
        .source-cell svg {
          color: #7c3aed;
          cursor: pointer;
          font-size: 1.1rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }
        .pagination button {
          padding: 0.6rem 1.2rem;
          border: 2px solid #7c3aed;
          background: white;
          color: #7c3aed;
          border-radius: 10px;
          cursor: pointer;
        }
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            text-align: center;
          }
          .actions {
            width: 100%;
            justify-content: center;
          }
          .table th,
          .table td {
            padding: 0.5rem;
            font-size: 0.9rem;
          }
          .btn {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FinanceProvision;
