// src/pages/finance/FinanceProvision.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileAlt, FaSync } from "react-icons/fa";
import {
  FaSearch,
  FaDownload,
  FaEdit,
  FaSave,
  FaExclamationTriangle,
  FaCalculator,
} from "react-icons/fa";

// Import API services
import {
  employeeAPI,
  taxAPI,
  storageAPI,
  smartSyncData,
  setupCrossTabSync,
  broadcastUpdate,
  forceSyncEmployees,
} from "../../api/finance";

const FinanceProvision = () => {
  const [employees, setEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const [bonusOverride, setBonusOverride] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [editingBonusId, setEditingBonusId] = useState(null);
  const [editSourceValue, setEditSourceValue] = useState("");
  const [editBonusValue, setEditBonusValue] = useState("");
  const [calculating, setCalculating] = useState(false);
  const employeesPerPage = 10;
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // Load and sync data on component mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // First, fetch employees
        const res = await employeeAPI.getAll();
        const validEmployees = res.data.filter(
          (e) => e.salary && e.employee_id
        );
        setEmployees(validEmployees);

        // Extract employee IDs for syncing
        const employeeIds = validEmployees.map((emp) => emp.employee_id);

        // Load local data immediately for fast display
        const localSourceData = JSON.parse(
          localStorage.getItem("sourceTaxOther") || "{}"
        );
        setSourceOther(localSourceData);

        const localBonusData = JSON.parse(
          localStorage.getItem("bonusOverride") || "{}"
        );
        setBonusOverride(localBonusData);

        // Load cached results if available
        const cachedResults = storageAPI.getCachedTaxResults();
        if (cachedResults) {
          setTaxResults(cachedResults);
        }

        // Smart sync in background
        setTimeout(async () => {
          try {
            const syncedData = await smartSyncData(employeeIds);
            if (syncedData.sourceTaxOther) {
              setSourceOther(syncedData.sourceTaxOther);
            }
            if (syncedData.bonusOverride) {
              setBonusOverride(syncedData.bonusOverride);
            }

            // Calculate taxes with synced data
            await calculateAllTaxes();
          } catch (error) {
            console.error("Background sync failed:", error);
          }
        }, 100);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Setup cross-tab synchronization with immediate updates
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log("Cross-tab update detected, reloading data...");

      // Reload data from localStorage immediately
      const localSourceData = JSON.parse(
        localStorage.getItem("sourceTaxOther") || "{}"
      );
      setSourceOther(localSourceData);

      const localBonusData = JSON.parse(
        localStorage.getItem("bonusOverride") || "{}"
      );
      setBonusOverride(localBonusData);

      // Recalculate taxes with updated data
      setTimeout(() => {
        calculateAllTaxes();
      }, 1000);
    };

    const cleanup = setupCrossTabSync(handleDataUpdate);
    return cleanup;
  }, []);



  const calculateAllTaxes = async (specificEmployeeIds = null) => {
    if (calculating) return;

    try {
      setCalculating(true);
      setProgress(0);

      const validEmployees = employees.filter((e) => e.salary && e.employee_id);

      // Filter to specific employees if provided
      const employeesToCalculate = specificEmployeeIds
        ? validEmployees.filter((emp) =>
            specificEmployeeIds.includes(emp.employee_id)
          )
        : validEmployees;

      const results = { ...taxResults };
      const batchSize = 10;

      for (let i = 0; i < employeesToCalculate.length; i += batchSize) {
        const batch = employeesToCalculate.slice(i, i + batchSize);

        const batchPromises = batch.map(async (emp) => {
          try {
            const gender = emp.gender === "M" ? "Male" : "Female";
            const other = sourceOther[emp.employee_id] || 0;
            const bonusVal = bonusOverride[emp.employee_id] || 0;

            const calc = await taxAPI.calculate({
              employee_id: emp.employee_id,
              gender,
              source_other: parseFloat(other) || 0,
              bonus: parseFloat(bonusVal) || 0,
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

        batchResults.forEach((result) => {
          if (result.status === "fulfilled") {
            results[result.value.empId] = result.value.data;
          }
        });

        const currentProgress = Math.round(
          ((i + batch.length) / employeesToCalculate.length) * 100
        );
        setProgress(currentProgress);

        if (i + batchSize < employeesToCalculate.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      setTaxResults(results);
      storageAPI.setCachedTaxResults(results);
    } catch (err) {
      console.error("Error in tax calculation:", err);
    } finally {
      setCalculating(false);
    }
  };


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

  const handleEditSource = (emp) => {
    setEditingSourceId(emp.employee_id);
    setEditSourceValue(sourceOther[emp.employee_id] || "0");
  };

  const handleEditBonus = (emp) => {
    setEditingBonusId(emp.employee_id);
    setEditBonusValue(bonusOverride[emp.employee_id] || "0");
  };

  // Enhanced save function for source other that ensures backend sync and cross-tab update
  const handleSaveSource = async (employeeId) => {
    const val = parseFloat(editSourceValue) || 0;

    try {
      // Save to backend
      const response = await taxAPI.saveTaxExtra({
        employee_id: employeeId,
        source_other: val,
        bonus: bonusOverride[employeeId] || 0,
      });

      if (response.data.success) {
        // Update state only after successful backend save
        const updatedSourceOther = { ...sourceOther, [employeeId]: val };
        setSourceOther(updatedSourceOther);
        setEditingSourceId(null);

        // Update localStorage
        storageAPI.setSourceTaxOther(updatedSourceOther);

        // Broadcast sourceOther update
        broadcastUpdate("sourceTaxOther", updatedSourceOther);

        // Trigger calculation which will update cache
        await calculateAllTaxes([employeeId]);

        console.log(
          "Successfully saved source tax other to backend and localStorage"
        );
      }
    } catch (err) {
      console.error("Save source failed:", err);
      alert("Failed to save to server. Using local storage only.");

      // Fallback to localStorage only
      const updatedSourceOther = { ...sourceOther, [employeeId]: val };
      setSourceOther(updatedSourceOther);
      setEditingSourceId(null);
      storageAPI.setSourceTaxOther(updatedSourceOther);

      // Broadcast update
      broadcastUpdate("sourceTaxOther", updatedSourceOther);

      // Trigger calculation with local data
      await calculateAllTaxes([employeeId]);
    }
  };

  // Enhanced save function for bonus that ensures backend sync and cross-tab update
  const handleSaveBonus = async (employeeId) => {
    const val = parseFloat(editBonusValue) || 0;

    try {
      // Save to backend
      const response = await taxAPI.saveTaxExtra({
        employee_id: employeeId,
        source_other: sourceOther[employeeId] || 0,
        bonus: val,
      });

      if (response.data.success) {
        // Update state only after successful backend save
        const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };
        setBonusOverride(updatedBonusOverride);
        setEditingBonusId(null);

        // Update localStorage
        storageAPI.setBonusOverride(updatedBonusOverride);

        // Broadcast bonus update
        broadcastUpdate("bonusOverride", updatedBonusOverride);

        // Trigger calculation which will update cache
        await calculateAllTaxes([employeeId]);

        console.log("Successfully saved bonus to backend and localStorage");
      }
    } catch (err) {
      console.error("Save bonus failed:", err);
      alert("Failed to save to server. Using local storage only.");

      // Fallback to localStorage only
      const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };
      setBonusOverride(updatedBonusOverride);
      setEditingBonusId(null);
      storageAPI.setBonusOverride(updatedBonusOverride);

      // Broadcast update
      broadcastUpdate("bonusOverride", updatedBonusOverride);

      // Trigger calculation with local data
      await calculateAllTaxes([employeeId]);
    }
  };

  const handleNavigate = (empId) => {
    navigate(`/tax-calculator/${empId}`);
  };

  const handleExport = () => {
    // Implementation for export (e.g., CSV or Excel)
    console.log("Exporting data...");
  };


  return (
    <div className="center-screen">
      <div className="dashboard">
        <div className="card">
          <div className="header">
            <h1>Finance Provision Dashboard</h1>
            <div className="actions">
              <button
                onClick={() => navigate("/salary-format")}
                className="btn format"
              >
                <FaFileAlt /> Salary Sheet
              </button>
              <button className="btn export" onClick={handleExport}>
                <FaDownload /> Export
              </button>
              <button
                className="btn calc"
                onClick={() => calculateAllTaxes()}
                disabled={calculating}
              >
                <FaCalculator /> Recalculate All
              </button>
            </div>
          </div>

          {calculating && (
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }}></div>
              <span>Calculating: {progress}%</span>
            </div>
          )}

          <div className="info-banner">
            <FaFileAlt />
            Showing tax provisions for {filtered.length} employees
          </div>

          <div className="search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Salary</th>
                  <th>Source Other</th>
                  <th>Bonus</th>
                  <th>Net Tax Payable</th>
                  <th>Monthly TDS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {current.map((emp) => {
                  const res = taxResults[emp.employee_id] || {};
                  const calc = res.tax_calculation || {};
                  return (
                    <tr
                      key={emp.employee_id}
                      className="row"
                      onClick={() => handleNavigate(emp.employee_id)}
                    >
                      <td>{emp.employee_id}</td>
                      <td className="name">{emp.name}</td>
                      <td>৳{emp.salary.toLocaleString()}</td>
                      <td>
                        {editingSourceId === emp.employee_id ? (
                          <div className="edit-input">
                            <input
                              type="number"
                              value={editSourceValue}
                              onChange={(e) =>
                                setEditSourceValue(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <FaSave
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveSource(emp.employee_id);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="source-cell">
                            ৳
                            {(
                              sourceOther[emp.employee_id] || 0
                            ).toLocaleString()}
                            <FaEdit
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSource(emp);
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td>
                        {editingBonusId === emp.employee_id ? (
                          <div className="edit-input">
                            <input
                              type="number"
                              value={editBonusValue}
                              onChange={(e) =>
                                setEditBonusValue(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <FaSave
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveBonus(emp.employee_id);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="bonus-cell">
                            ৳
                            {(
                              bonusOverride[emp.employee_id] || 0
                            ).toLocaleString()}
                            <FaEdit
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBonus(emp);
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

      <style>{`
        .center-screen {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          justify-content: center;
          align-items: center;
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
        .format {
          background: #8b5cf6;
          color: white;
        }
        .export {
          background: #10b981;
          color: white;
        }
        .sync {
          background: #3b82f6;
          color: white;
        }
        .calc {
          background: #ef4444;
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
        .bonus-cell,
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
        .source-cell svg,
        .bonus-cell svg {
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
