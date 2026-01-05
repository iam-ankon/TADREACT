// src/pages/finance/FinanceProvision.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileAlt, FaSync, FaSearch, FaDownload, FaEdit, FaSave, FaExclamationTriangle, FaCalculator, FaHistory } from "react-icons/fa";

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
  const [lastCalculated, setLastCalculated] = useState(null);
  
  const employeesPerPage = 10;
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // Cache validation function
  const isCacheValid = useCallback((cachedData, maxAgeHours = 24) => {
    if (!cachedData || !cachedData.timestamp) return false;
    
    const cacheTime = new Date(cachedData.timestamp);
    const now = new Date();
    const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
    
    return hoursDiff < maxAgeHours;
  }, []);

  // Load and sync data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("📊 Loading finance data...");

        // 1. Fetch employees
        const res = await employeeAPI.getAll();
        const validEmployees = res.data.filter(
          (e) => e.salary && e.employee_id
        );
        setEmployees(validEmployees);

        const employeeIds = validEmployees.map((emp) => emp.employee_id);
        console.log(`✅ Loaded ${validEmployees.length} employees`);

        // 2. Load source other and bonus data
        const localSourceData = JSON.parse(
          localStorage.getItem("sourceTaxOther") || "{}"
        );
        setSourceOther(localSourceData);

        const localBonusData = JSON.parse(
          localStorage.getItem("bonusOverride") || "{}"
        );
        setBonusOverride(localBonusData);

        // 3. Load cached tax results from localStorage
        const cachedResults = storageAPI.getTaxResultsByEmployee();
        console.log(`📁 Found ${Object.keys(cachedResults || {}).length} cached tax results`);

        // Filter valid cached results for current employees
        const validCachedResults = {};
        let validCount = 0;
        
        employeeIds.forEach(id => {
          const cached = cachedResults[id];
          if (cached && isCacheValid(cached, 24)) {
            validCachedResults[id] = cached.data;
            validCount++;
          }
        });

        console.log(`✅ Using ${validCount} valid cached tax results`);
        setTaxResults(validCachedResults);

        // Set last calculated timestamp
        if (validCount > 0) {
          setLastCalculated("Loaded from cache");
        }

        // 4. Find employees that need calculation
        const employeesNeedingCalculation = validEmployees.filter(
          emp => !validCachedResults[emp.employee_id]
        );

        console.log(`🔄 ${employeesNeedingCalculation.length} employees need calculation`);

        // 5. Calculate taxes for employees without valid cache
        if (employeesNeedingCalculation.length > 0) {
          setTimeout(() => {
            calculateTaxesForEmployees(
              employeesNeedingCalculation.map(emp => emp.employee_id)
            );
          }, 1000);
        }

        // 6. Smart sync in background
        setTimeout(async () => {
          try {
            const syncedData = await smartSyncData(employeeIds);
            if (syncedData.sourceTaxOther) {
              setSourceOther(syncedData.sourceTaxOther);
            }
            if (syncedData.bonusOverride) {
              setBonusOverride(syncedData.bonusOverride);
            }

            // Recalculate if data changed
            if (syncedData.synced) {
              console.log("🔄 Recalculating after sync...");
              await calculateTaxesForEmployees(employeeIds);
            }
          } catch (error) {
            console.error("Background sync failed:", error);
          }
        }, 2000);

      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isCacheValid]);

  // Setup cross-tab synchronization
  useEffect(() => {
    const handleDataUpdate = (event) => {
      console.log("🔄 Cross-tab update detected:", event.detail?.type);

      // Reload data from localStorage
      const localSourceData = JSON.parse(
        localStorage.getItem("sourceTaxOther") || "{}"
      );
      setSourceOther(localSourceData);

      const localBonusData = JSON.parse(
        localStorage.getItem("bonusOverride") || "{}"
      );
      setBonusOverride(localBonusData);

      // Reload tax results
      const cachedResults = storageAPI.getTaxResultsByEmployee();
      const validCachedResults = {};
      
      employees.forEach(emp => {
        const cached = cachedResults[emp.employee_id];
        if (cached && isCacheValid(cached, 24)) {
          validCachedResults[emp.employee_id] = cached.data;
        }
      });

      setTaxResults(validCachedResults);

      // If tax results were updated, trigger recalculation for affected employees
      if (event.detail?.type === "taxResults") {
        const updatedEmployeeIds = Object.keys(event.detail.data || {});
        if (updatedEmployeeIds.length > 0) {
          console.log(`🔄 Recalculating for ${updatedEmployeeIds.length} employees after cross-tab update`);
          setTimeout(() => {
            calculateTaxesForEmployees(updatedEmployeeIds);
          }, 500);
        }
      }
    };

    const cleanup = setupCrossTabSync(handleDataUpdate);
    return cleanup;
  }, [employees, isCacheValid]);

  // Calculate taxes for specific employees
  const calculateTaxesForEmployees = async (employeeIds) => {
    if (calculating || !employeeIds.length) return;

    try {
      setCalculating(true);
      setProgress(0);
      console.log(`🧮 Calculating taxes for ${employeeIds.length} employees...`);

      const results = { ...taxResults };
      const batchSize = 5;
      const totalEmployees = employeeIds.length;

      for (let i = 0; i < totalEmployees; i += batchSize) {
        const batchIds = employeeIds.slice(i, i + batchSize);
        
        const batchPromises = batchIds.map(async (empId) => {
          try {
            const emp = employees.find(e => e.employee_id === empId);
            if (!emp) return null;

            const gender = emp.gender === "M" ? "Male" : "Female";
            const other = sourceOther[empId] || 0;
            const bonusVal = bonusOverride[empId] || 0;

            const calc = await taxAPI.calculate({
              employee_id: empId,
              gender,
              source_other: parseFloat(other) || 0,
              bonus: parseFloat(bonusVal) || 0,
            });

            // Store result in localStorage by employee ID
            storageAPI.setTaxResultsByEmployee(empId, calc.data);
            
            return { empId, data: calc.data };
          } catch (err) {
            console.error(`Failed to calculate for ${empId}:`, err);
            return {
              empId,
              data: { error: "Failed", employee_name: "Unknown" },
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            results[result.value.empId] = result.value.data;
          }
        });

        const currentProgress = Math.round(((i + batchSize) / totalEmployees) * 100);
        setProgress(currentProgress);

        // Small delay between batches
        if (i + batchSize < totalEmployees) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setTaxResults(results);
      setLastCalculated(new Date().toLocaleTimeString());
      console.log("✅ Tax calculation completed");

    } catch (err) {
      console.error("Error in tax calculation:", err);
    } finally {
      setCalculating(false);
      setProgress(0);
    }
  };

  // Calculate all taxes (for button click)
  const calculateAllTaxes = async () => {
    const employeeIds = employees
      .filter(e => e.salary && e.employee_id)
      .map(e => e.employee_id);
    
    if (employeeIds.length > 0) {
      await calculateTaxesForEmployees(employeeIds);
    }
  };

  // Handle source other edit
  const handleEditSource = (emp) => {
    setEditingSourceId(emp.employee_id);
    setEditSourceValue(sourceOther[emp.employee_id] || "0");
  };

  // Handle bonus edit
  const handleEditBonus = (emp) => {
    setEditingBonusId(emp.employee_id);
    setEditBonusValue(bonusOverride[emp.employee_id] || "0");
  };

  // Save source other value
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
        // Update state
        const updatedSourceOther = { ...sourceOther, [employeeId]: val };
        setSourceOther(updatedSourceOther);
        setEditingSourceId(null);

        // Update localStorage
        storageAPI.setSourceTaxOther(updatedSourceOther);
        broadcastUpdate("sourceTaxOther", updatedSourceOther);

        // Recalculate tax for this employee
        await calculateTaxesForEmployees([employeeId]);

        console.log("✅ Source tax saved and recalculated");
      }
    } catch (err) {
      console.error("Save source failed:", err);
      
      // Fallback to localStorage only
      const updatedSourceOther = { ...sourceOther, [employeeId]: val };
      setSourceOther(updatedSourceOther);
      setEditingSourceId(null);
      storageAPI.setSourceTaxOther(updatedSourceOther);
      broadcastUpdate("sourceTaxOther", updatedSourceOther);

      // Recalculate with local data
      await calculateTaxesForEmployees([employeeId]);
    }
  };

  // Save bonus value
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
        // Update state
        const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };
        setBonusOverride(updatedBonusOverride);
        setEditingBonusId(null);

        // Update localStorage
        storageAPI.setBonusOverride(updatedBonusOverride);
        broadcastUpdate("bonusOverride", updatedBonusOverride);

        // Recalculate tax for this employee
        await calculateTaxesForEmployees([employeeId]);

        console.log("✅ Bonus saved and recalculated");
      }
    } catch (err) {
      console.error("Save bonus failed:", err);
      
      // Fallback to localStorage only
      const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };
      setBonusOverride(updatedBonusOverride);
      setEditingBonusId(null);
      storageAPI.setBonusOverride(updatedBonusOverride);
      broadcastUpdate("bonusOverride", updatedBonusOverride);

      // Recalculate with local data
      await calculateTaxesForEmployees([employeeId]);
    }
  };

  // Clear cache and recalculate
  const handleRefreshCalculations = async () => {
    if (window.confirm("Clear all cached tax calculations and recalculate?")) {
      storageAPI.clearAllTaxResults();
      setTaxResults({});
      await calculateAllTaxes();
    }
  };

  // Filter and pagination
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

  const handleNavigate = (empId) => {
    navigate(`/tax-calculator/${empId}`);
  };

  const handleExport = () => {
    const exportData = Object.keys(taxResults).map(empId => {
      const emp = employees.find(e => e.employee_id === empId);
      const result = taxResults[empId];
      return {
        "Employee ID": empId,
        "Name": emp?.name || "",
        "Salary": emp?.salary || 0,
        "Source Other": sourceOther[empId] || 0,
        "Bonus": bonusOverride[empId] || 0,
        "Net Tax Payable": result?.tax_calculation?.net_tax_payable || 0,
        "Monthly TDS": result?.tax_calculation?.monthly_tds || 0,
        "Calculated At": lastCalculated || "Unknown"
      };
    });

    const csvContent = [
      Object.keys(exportData[0] || {}),
      ...exportData.map(row => Object.values(row))
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax_calculations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="center-screen">
      <div className="dashboard">
        <div className="card">
          <div className="header">
            <div>
              <h1>Finance Provision Dashboard</h1>
              {lastCalculated && (
                <div className="last-calculated">
                  <FaHistory /> Last calculated: {lastCalculated}
                </div>
              )}
            </div>
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
                onClick={handleRefreshCalculations}
                disabled={calculating}
              >
                <FaSync /> Refresh All
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
            {Object.keys(taxResults).length > 0 && (
              <span className="cache-info">
                ({Object.keys(taxResults).length} cached results)
              </span>
            )}
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
                      <td>৳{emp.salary?.toLocaleString() || 0}</td>
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
                        {calc.net_tax_payable ? (
                          `৳${(calc.net_tax_payable || 0).toLocaleString()}`
                        ) : (
                          <span className="loading">Calculating...</span>
                        )}
                      </td>
                      <td className="tds">
                        {calc.monthly_tds ? (
                          `৳${(calc.monthly_tds || 0).toLocaleString()}`
                        ) : (
                          <span className="loading">-</span>
                        )}
                      </td>
                      <td>
                        {res.error ? (
                          <span className="error">
                            <FaExclamationTriangle /> Failed
                          </span>
                        ) : calc.net_tax_payable ? (
                          <span className="success">Calculated</span>
                        ) : calculating ? (
                          <span className="pending">Calculating...</span>
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
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header h1 {
          font-size: 2.2rem;
          color: #1e3a8a;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .last-calculated {
          font-size: 0.9rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        .refresh {
          background: #f59e0b;
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
        .cache-info {
          margin-left: auto;
          font-size: 0.8rem;
          color: #4b5563;
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
        .loading {
          color: #9ca3af;
          font-style: italic;
          font-size: 0.9rem;
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