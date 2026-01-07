// src/pages/finance/FinanceProvision.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaSync,
  FaSearch,
  FaDownload,
  FaEdit,
  FaSave,
  FaExclamationTriangle,
  FaCalculator,
  FaHistory,
  FaDatabase,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaServer,
} from "react-icons/fa";

import {
  financeAPI,
  setupCrossTabSync,
  broadcastUpdate,
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
  const [cacheStats, setCacheStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    fromDatabase: 0,
  });
  const [errorLog, setErrorLog] = useState([]);
  const [showErrors, setShowErrors] = useState(false);

  const employeesPerPage = 15;
  const navigate = useNavigate();
  const calculationInProgress = useRef(false);
  const isInitialMount = useRef(true);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Load data from BACKEND first, then calculate missing ones
  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (calculationInProgress.current) {
      console.log("⏸️ Load already in progress, skipping");
      return;
    }

    try {
      setLoading(true);
      console.log("📊 Loading finance data...");

      // 1. Load employees
      const { data: employeeData } =
        await financeAPI.employee.getEmployeesWithCache();
      setEmployees(employeeData);

      // 2. Load source other and bonus
      const localSourceData = await financeAPI.storage.getSourceTaxOther();
      const localBonusData = await financeAPI.storage.getBonusOverride();

      setSourceOther(localSourceData);
      setBonusOverride(localBonusData);

      const employeeIds = employeeData.map((emp) => emp.employee_id);
      console.log(`✅ Loaded ${employeeData.length} employees`);

      // 3. FIRST: Try to load saved calculations from BACKEND
      console.log("💾 Loading saved calculations from database...");
      try {
        const savedResponse = await financeAPI.tax.getCalculatedTaxes({
          employee_ids: employeeIds,
          month: currentMonth,
          year: currentYear,
        });

        if (savedResponse.data.success && savedResponse.data.results) {
          const savedResults = savedResponse.data.results;
          const databaseResults = {};
          let dbCount = 0;

          // Process database results
          Object.keys(savedResults).forEach((empId) => {
            const savedData = savedResults[empId];
            if (savedData.calculation_data) {
              databaseResults[empId] = savedData.calculation_data;
              dbCount++;

              // Also save to localStorage cache
              financeAPI.storage.setTaxResultsByEmployee(
                empId,
                savedData.calculation_data
              );
            }
          });

          console.log(`💾 Loaded ${dbCount} calculations from database`);
          setTaxResults(databaseResults);

          // Update cache stats
          setCacheStats({
            total: employeeIds.length,
            valid: dbCount,
            invalid: employeeIds.length - dbCount,
            fromDatabase: dbCount,
          });

          setLastCalculated(
            `Loaded from database (${new Date().toLocaleTimeString()})`
          );

          // 4. Calculate only missing ones
          const missingEmployeeIds = employeeIds.filter(
            (id) => !databaseResults[id]
          );

          if (missingEmployeeIds.length > 0 && !calculationInProgress.current) {
            console.log(
              `🔄 Calculating ${missingEmployeeIds.length} missing employees...`
            );
            calculateMissingTaxes(
              employeeData,
              missingEmployeeIds,
              localSourceData,
              localBonusData
            );
          }

          return; // Exit early since we have data
        }
      } catch (dbError) {
        console.warn(
          "Failed to load from database, using local cache:",
          dbError
        );
      }

      // 5. FALLBACK: Check localStorage cache
      console.log("📁 Checking localStorage cache...");
      const allResults = financeAPI.storage.getTaxResultsByEmployee();

      const cachedResults = {};
      let cacheCount = 0;

      employeeIds.forEach((id) => {
        const cached = allResults[id];
        if (cached && cached.data) {
          // Check if cache is recent (within 24 hours)
          const cacheTime = new Date(cached.timestamp);
          const now = new Date();
          const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);

          if (hoursDiff < 24) {
            cachedResults[id] = cached.data;
            cacheCount++;
          }
        }
      });

      setTaxResults(cachedResults);

      setCacheStats({
        total: employeeIds.length,
        valid: cacheCount,
        invalid: employeeIds.length - cacheCount,
        fromDatabase: 0,
      });

      console.log(`📁 Found ${cacheCount} cached results`);

      // 6. Calculate missing ones
      const missingEmployeeIds = employeeIds.filter((id) => !cachedResults[id]);

      if (missingEmployeeIds.length > 0 && !calculationInProgress.current) {
        console.log(
          `🔄 Calculating ${missingEmployeeIds.length} missing employees...`
        );
        calculateMissingTaxes(
          employeeData,
          missingEmployeeIds,
          localSourceData,
          localBonusData
        );
      } else if (cacheCount > 0) {
        setLastCalculated(
          `Loaded from cache (${new Date().toLocaleTimeString()})`
        );
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setErrorLog((prev) => [...prev, { type: "load", message: err.message }]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  // Calculate taxes for missing employees
  const calculateMissingTaxes = useCallback(
    async (employeeList, employeeIds, sourceData, bonusData) => {
      if (calculationInProgress.current || !employeeIds.length) return;

      calculationInProgress.current = true;
      setCalculating(true);
      setProgress(0);

      try {
        console.log(`🧮 Calculating for ${employeeIds.length} employees...`);

        const newResults = { ...taxResults };
        const newErrors = [];
        let successCount = 0;

        // Process in smaller batches to avoid overwhelming server
        const batchSize = 3;

        for (
          let batchIndex = 0;
          batchIndex < employeeIds.length;
          batchIndex += batchSize
        ) {
          const batchIds = employeeIds.slice(
            batchIndex,
            batchIndex + batchSize
          );

          const batchPromises = batchIds.map(async (empId) => {
            const emp = employeeList.find((e) => e.employee_id === empId);
            if (!emp) return null;

            try {
              const response = await financeAPI.tax.calculate({
                employee_id: empId,
                gender: emp.gender === "M" ? "Male" : "Female",
                source_other: sourceData[empId] || 0,
                bonus: bonusData[empId] || 0,
              });

              if (response.data) {
                // Save to LOCALSTORAGE cache
                financeAPI.storage.setTaxResultsByEmployee(
                  empId,
                  response.data
                );

                // Save to BACKEND database
                try {
                  await financeAPI.tax.saveCalculatedTax({
                    employee_id: empId,
                    month: currentMonth,
                    year: currentYear,
                    calculation_data: response.data,
                    calculated_by: "system",
                  });
                } catch (saveError) {
                  console.warn(
                    `Could not save to database for ${empId}:`,
                    saveError
                  );
                }

                return { empId, data: response.data };
              }
            } catch (err) {
              console.error(`Failed to calculate for ${empId}:`, err);
              return { empId, error: err.message };
            }
            return null;
          });

          const batchResults = await Promise.all(batchPromises);

          batchResults.forEach((result) => {
            if (result) {
              if (result.data) {
                newResults[result.empId] = result.data;
                successCount++;
              } else if (result.error) {
                newErrors.push({ empId: result.empId, error: result.error });
              }
            }
          });

          // Update progress
          const currentProgress = Math.round(
            ((batchIndex + batchSize) / employeeIds.length) * 100
          );
          setProgress(Math.min(currentProgress, 100));

          // Update UI incrementally
          setTaxResults((prev) => ({ ...prev, ...newResults }));

          // Small delay between batches to prevent overwhelming server
          if (batchIndex + batchSize < employeeIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        // Final update
        setTaxResults((prev) => ({ ...prev, ...newResults }));
        setLastCalculated(
          `Calculated ${successCount} employees (${new Date().toLocaleTimeString()})`
        );
        setCacheStats((prev) => ({
          ...prev,
          valid: prev.valid + successCount,
          invalid: newErrors.length,
        }));
        setErrorLog((prev) => [...prev, ...newErrors]);

        console.log(
          `✅ Calculation completed: ${successCount} success, ${newErrors.length} errors`
        );
      } catch (error) {
        console.error("Calculation failed:", error);
        setErrorLog((prev) => [
          ...prev,
          { type: "calculation", message: error.message },
        ]);
      } finally {
        calculationInProgress.current = false;
        setCalculating(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [currentMonth, currentYear]
  );

  // Initial load - ONLY ON MOUNT
  useEffect(() => {
    if (isInitialMount.current) {
      loadData();
      isInitialMount.current = false;
    }
  }, [loadData]);

  // Cross-tab sync - FIXED: Use ref to prevent infinite loops
  // In FinanceProvision.jsx - Replace the cross-tab sync effect
  useEffect(() => {
    let mounted = true;
    let lastUpdateTime = 0;
    const UPDATE_COOLDOWN = 2000; // 2 seconds between updates

    const handleDataUpdate = (event) => {
      if (!mounted) return;

      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_COOLDOWN) {
        console.log("🔄 Update throttled, skipping");
        return;
      }

      lastUpdateTime = now;

      // Only reload if the update came from another tab/page
      if (event && event.detail && event.detail.type === "taxResults") {
        console.log("🔄 Cross-tab update detected, refreshing data");

        // Use a timeout to avoid immediate re-renders
        setTimeout(() => {
          if (mounted) {
            loadData();
          }
        }, 500);
      }
    };

    const cleanup = setupCrossTabSync(handleDataUpdate);

    return () => {
      mounted = false;
      cleanup();
    };
  }, [loadData]);

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
    const updatedSourceOther = { ...sourceOther, [employeeId]: val };

    try {
      // Save to backend
      await financeAPI.tax.saveTaxExtra({
        employee_id: employeeId,
        source_other: val,
        bonus: bonusOverride[employeeId] || 0,
      });
    } catch (err) {
      console.warn("Save source failed:", err);
    }

    // Update state
    setSourceOther(updatedSourceOther);
    setEditingSourceId(null);
    financeAPI.storage.setSourceTaxOther(updatedSourceOther);
    broadcastUpdate("sourceTaxOther", updatedSourceOther);

    // Recalculate for this employee
    const employee = employees.find((e) => e.employee_id === employeeId);
    if (employee) {
      calculateMissingTaxes(
        employees,
        [employeeId],
        updatedSourceOther,
        bonusOverride
      );
    }
  };

  // Save bonus value
  const handleSaveBonus = async (employeeId) => {
    const val = parseFloat(editBonusValue) || 0;
    const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };

    try {
      // Save to backend
      await financeAPI.tax.saveTaxExtra({
        employee_id: employeeId,
        source_other: sourceOther[employeeId] || 0,
        bonus: val,
      });
    } catch (err) {
      console.warn("Save bonus failed:", err);
    }

    // Update state
    setBonusOverride(updatedBonusOverride);
    setEditingBonusId(null);
    financeAPI.storage.setBonusOverride(updatedBonusOverride);
    broadcastUpdate("bonusOverride", updatedBonusOverride);

    // Recalculate for this employee
    const employee = employees.find((e) => e.employee_id === employeeId);
    if (employee) {
      calculateMissingTaxes(
        employees,
        [employeeId],
        sourceOther,
        updatedBonusOverride
      );
    }
  };

  // Export data to CSV
  const handleExport = () => {
    const exportData = Object.keys(taxResults).map((empId) => {
      const emp = employees.find((e) => e.employee_id === empId);
      const result = taxResults[empId];
      const calc = result?.tax_calculation || {};
      return {
        "Employee ID": empId,
        Name: emp?.name || "",
        Salary: emp?.salary || 0,
        "Source Other": sourceOther[empId] || 0,
        Bonus: bonusOverride[empId] || 0,
        "Net Tax Payable": calc.net_tax_payable || 0,
        "Monthly TDS": calc.monthly_tds || 0,
        "Should Deduct": calc.should_deduct_tax ? "Yes" : "No",
        "Actual Deduction": calc.actual_deduction || 0,
        "Calculated At": lastCalculated || "Unknown",
      };
    });

    if (exportData.length === 0) {
      alert("No data to export. Please calculate taxes first.");
      return;
    }

    const csvContent = [
      Object.keys(exportData[0]),
      ...exportData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax_calculations_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear and recalculate all
  const handleRefreshCalculations = async () => {
    if (
      window.confirm(
        "Clear all cached tax calculations and recalculate for all employees?"
      )
    ) {
      try {
        // Clear backend calculations
        await financeAPI.tax.clearCalculatedTaxes({
          month: currentMonth,
          year: currentYear,
        });
      } catch (err) {
        console.warn("Could not clear backend:", err);
      }

      // Clear local cache
      financeAPI.storage.clearAllTaxResults();
      setTaxResults({});
      setCacheStats((prev) => ({ ...prev, valid: 0, fromDatabase: 0 }));

      // Recalculate all
      const employeeIds = employees.map((emp) => emp.employee_id);
      calculateMissingTaxes(employees, employeeIds, sourceOther, bonusOverride);
    }
  };

  // Sync data from backend
  const handleSyncData = async () => {
    try {
      const employeeIds = employees.map((emp) => emp.employee_id);

      // Load fresh from backend
      const savedResponse = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: employeeIds,
        month: currentMonth,
        year: currentYear,
      });

      if (savedResponse.data.success && savedResponse.data.results) {
        const savedResults = savedResponse.data.results;
        const databaseResults = {};
        let dbCount = 0;

        Object.keys(savedResults).forEach((empId) => {
          const savedData = savedResults[empId];
          if (savedData.calculation_data) {
            databaseResults[empId] = savedData.calculation_data;
            dbCount++;
            financeAPI.storage.setTaxResultsByEmployee(
              empId,
              savedData.calculation_data
            );
          }
        });

        setTaxResults(databaseResults);
        setCacheStats((prev) => ({
          ...prev,
          fromDatabase: dbCount,
          valid: dbCount,
        }));
        setLastCalculated(
          `Synced from database (${new Date().toLocaleTimeString()})`
        );

        alert(`Synced ${dbCount} calculations from database!`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Failed to sync from database. Please try again.");
    }
  };

  // Calculate selected employees (current page)
  const handleCalculateSelected = async () => {
    const selectedEmployeeIds = filtered
      .slice(start, start + employeesPerPage)
      .map((emp) => emp.employee_id);

    if (selectedEmployeeIds.length > 0) {
      calculateMissingTaxes(
        employees,
        selectedEmployeeIds,
        sourceOther,
        bonusOverride
      );
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
  const currentEmployees = filtered.slice(start, start + employeesPerPage);

  // Auto reset page on search
  useEffect(() => {
    if (!isInitialMount.current) setCurrentPage(1);
  }, [searchQuery]);

  const handleNavigate = (empId) => {
    navigate(`/tax-calculator/${empId}`);
  };

  // Calculate totals
  const totals = React.useMemo(
    () => ({
      netTaxPayable: Object.values(taxResults).reduce((sum, result) => {
        return sum + (result?.tax_calculation?.net_tax_payable || 0);
      }, 0),
      monthlyTDS: Object.values(taxResults).reduce((sum, result) => {
        return sum + (result?.tax_calculation?.monthly_tds || 0);
      }, 0),
      employeesWithTax: Object.values(taxResults).filter(
        (result) => result?.tax_calculation?.should_deduct_tax
      ).length,
    }),
    [taxResults]
  );

  // Loading state
  if (loading && isInitialMount.current) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <FaSpinner
            className="spinning"
            style={{ fontSize: "3rem", color: "#7c3aed" }}
          />
          <h2>Loading Finance Dashboard...</h2>
          <p>Fetching employee data and tax calculations</p>
        </div>
        <style jsx>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .loading-content {
            text-align: center;
            color: white;
          }
          .spinning {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="dashboard">
        <div className="card">
          {/* Header Section */}
          <div className="header">
            <div className="header-left">
              <h1>Finance Provision Dashboard</h1>
              <div className="sub-header">
                <div className="last-calculated">
                  <FaHistory /> {lastCalculated || "Not calculated yet"}
                </div>
                <div className="data-source">
                  {cacheStats.fromDatabase > 0 ? (
                    <span className="source-database">
                      <FaServer /> {cacheStats.fromDatabase} from database
                    </span>
                  ) : cacheStats.valid > 0 ? (
                    <span className="source-cache">
                      <FaDatabase /> {cacheStats.valid} from cache
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="cache-stats">
                <FaDatabase /> {cacheStats.valid}/{cacheStats.total} ready
                {cacheStats.invalid > 0 && (
                  <span className="invalid-count">
                    {" "}
                    ({cacheStats.invalid} pending)
                  </span>
                )}
              </div>
              <div className="actions">
                <button
                  onClick={() => navigate("/salary-format")}
                  className="btn format"
                >
                  <FaFileAlt /> Salary Sheet
                </button>
                <button
                  className="btn sync"
                  onClick={handleSyncData}
                  disabled={calculating}
                >
                  <FaSync /> Sync DB
                </button>
                <button
                  className="btn export"
                  onClick={handleExport}
                  disabled={Object.keys(taxResults).length === 0}
                >
                  <FaDownload /> Export CSV
                </button>
                <button
                  className="btn refresh"
                  onClick={handleRefreshCalculations}
                  disabled={calculating}
                >
                  <FaSync /> Recalculate All
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {calculating && (
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Calculating: {progress}% • Processing employees in batches
              </div>
            </div>
          )}

          {/* Totals Summary */}
          <div className="totals-summary">
            <div className="total-item">
              <div className="total-label">Total Net Tax Payable</div>
              <div className="total-value">
                {financeAPI.utils.formatCurrency(totals.netTaxPayable)}
              </div>
            </div>
            <div className="total-item">
              <div className="total-label">Total Monthly TDS</div>
              <div className="total-value">
                {financeAPI.utils.formatCurrency(totals.monthlyTDS)}
              </div>
            </div>
            <div className="total-item">
              <div className="total-label">Employees with Tax</div>
              <div className="total-value">
                {totals.employeesWithTax} / {filtered.length}
              </div>
            </div>
            <div className="total-item">
              <div className="total-label">Errors</div>
              <div
                className="total-value error-count"
                onClick={() => setShowErrors(!showErrors)}
              >
                {errorLog.length} {showErrors ? "▲" : "▼"}
              </div>
            </div>
          </div>

          {/* Error Log */}
          {showErrors && errorLog.length > 0 && (
            <div className="error-log">
              <div className="error-log-header">
                <FaExclamationTriangle /> Calculation Errors ({errorLog.length})
                <button
                  className="clear-errors"
                  onClick={() => setErrorLog([])}
                >
                  Clear
                </button>
              </div>
              {errorLog.slice(0, 5).map((error, idx) => (
                <div key={idx} className="error-item">
                  <span className="error-emp">{error.empId || "System"}:</span>
                  <span className="error-msg">
                    {error.message || error.error}
                  </span>
                </div>
              ))}
              {errorLog.length > 5 && (
                <div className="error-more">
                  ... and {errorLog.length - 5} more errors
                </div>
              )}
            </div>
          )}

          {/* Search and Controls */}
          <div className="controls-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <div className="result-count">
                {filtered.length} employees found
              </div>
            </div>
            <div className="action-buttons">
              <button
                className="btn calculate-selected"
                onClick={handleCalculateSelected}
                disabled={calculating || currentEmployees.length === 0}
              >
                <FaCalculator /> Calculate Page ({currentEmployees.length})
              </button>
              {errorLog.length > 0 && (
                <button
                  className="btn show-errors"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  <FaExclamationTriangle /> {showErrors ? "Hide" : "Show"}{" "}
                  Errors
                </button>
              )}
            </div>
          </div>

          {/* Main Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Salary</th>
                  <th>Source Other</th>
                  <th>Bonus</th>
                  <th>Net Tax Payable</th>
                  <th>Monthly TDS</th>
                  <th>Deduct?</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map((emp) => {
                  const res = taxResults[emp.employee_id] || {};
                  const calc = res.tax_calculation || {};
                  const hasCache = !!res.tax_calculation;
                  const shouldDeduct = calc.should_deduct_tax;
                  const isError = res.error;
                  const fromDatabase =
                    cacheStats.fromDatabase > 0 && taxResults[emp.employee_id];

                  return (
                    <tr
                      key={emp.employee_id}
                      className={`data-row ${isError ? "row-error" : ""} ${
                        hasCache ? "row-cached" : ""
                      } ${fromDatabase ? "row-database" : ""}`}
                      onClick={() => handleNavigate(emp.employee_id)}
                    >
                      <td className="id-cell">{emp.employee_id}</td>
                      <td className="name-cell">{emp.name}</td>
                      <td className="salary-cell">
                        {financeAPI.utils.formatCurrency(emp.salary || 0)}
                      </td>

                      {/* Source Other Cell */}
                      <td className="source-cell">
                        {editingSourceId === emp.employee_id ? (
                          <div className="edit-input">
                            <input
                              type="number"
                              value={editSourceValue}
                              onChange={(e) =>
                                setEditSourceValue(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="edit-input-field"
                              placeholder="0"
                            />
                            <FaSave
                              className="save-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveSource(emp.employee_id);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="display-value">
                            {financeAPI.utils.formatCurrency(
                              sourceOther[emp.employee_id] || 0
                            )}
                            <FaEdit
                              className="edit-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSource(emp);
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Bonus Cell */}
                      <td className="bonus-cell">
                        {editingBonusId === emp.employee_id ? (
                          <div className="edit-input">
                            <input
                              type="number"
                              value={editBonusValue}
                              onChange={(e) =>
                                setEditBonusValue(e.target.value)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="edit-input-field"
                              placeholder="0"
                            />
                            <FaSave
                              className="save-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveBonus(emp.employee_id);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="display-value">
                            {financeAPI.utils.formatCurrency(
                              bonusOverride[emp.employee_id] || 0
                            )}
                            <FaEdit
                              className="edit-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBonus(emp);
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Tax Cells */}
                      <td className="tax-cell">
                        {calc.net_tax_payable ? (
                          financeAPI.utils.formatCurrency(calc.net_tax_payable)
                        ) : (
                          <span className="loading-text">-</span>
                        )}
                      </td>

                      <td className="tds-cell">
                        {calc.monthly_tds ? (
                          financeAPI.utils.formatCurrency(calc.monthly_tds)
                        ) : (
                          <span className="loading-text">-</span>
                        )}
                      </td>

                      <td className="deduct-cell">
                        {shouldDeduct !== undefined ? (
                          <span
                            className={`deduct-badge ${
                              shouldDeduct ? "deduct-yes" : "deduct-no"
                            }`}
                          >
                            {shouldDeduct ? (
                              <FaCheckCircle />
                            ) : (
                              <FaTimesCircle />
                            )}
                            {shouldDeduct ? "Yes" : "No"}
                          </span>
                        ) : (
                          <span className="loading-text">-</span>
                        )}
                      </td>

                      {/* Status Cell */}
                      <td className="status-cell">
                        {isError ? (
                          <span className="status-error">
                            <FaExclamationTriangle /> Failed
                          </span>
                        ) : calc.net_tax_payable ? (
                          <span className="status-success">
                            <FaCheckCircle /> {fromDatabase ? "DB" : "Ready"}
                          </span>
                        ) : calculating ? (
                          <span className="status-pending">
                            <FaSpinner className="spinning" /> Calculating
                          </span>
                        ) : (
                          <span className="status-pending">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {currentEmployees.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-text">No employees found</div>
                {searchQuery && (
                  <button
                    className="btn clear-search"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>
              <div className="pagination-info">
                Page <span className="current-page">{currentPage}</span> of{" "}
                <span className="total-pages">{totalPages}</span>
                <span className="total-items">
                  ({filtered.length} employees)
                </span>
              </div>
              <button
                className="pagination-btn"
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
          align-items: flex-start;
          padding: 1rem;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .dashboard {
          width: 100%;
          max-width: 1600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          margin-top: 1rem;
        }

        .card {
          padding: 2rem;
        }

        /* Header Styles */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .header-left {
          flex: 1;
          min-width: 300px;
        }

        .header h1 {
          font-size: 2.2rem;
          color: #1e3a8a;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sub-header {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .last-calculated {
          font-size: 0.95rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f3f4f6;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .data-source {
          font-size: 0.9rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .source-database {
          color: #10b981;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #d1fae5;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .source-cache {
          color: #f59e0b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef3c7;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-end;
        }

        .cache-stats {
          background: #1e293b;
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .invalid-count {
          color: #f87171;
          font-weight: normal;
        }

        .actions {
          display: flex;
          gap: 0.8rem;
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
          transition: all 0.3s ease;
          white-space: nowrap;
          font-size: 0.9rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }

        .format {
          background: #8b5cf6;
          color: white;
        }
        .sync {
          background: #3b82f6;
          color: white;
        }
        .export {
          background: #10b981;
          color: white;
        }
        .refresh {
          background: #ef4444;
          color: white;
        }
        .calculate-selected {
          background: #f59e0b;
          color: white;
        }
        .show-errors {
          background: #dc2626;
          color: white;
        }
        .clear-search {
          background: #6b7280;
          color: white;
          margin-top: 1rem;
        }
        .clear-errors {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 0.85rem;
          text-decoration: underline;
        }

        /* Progress Section */
        .progress-section {
          margin: 1.5rem 0;
        }

        .progress-bar {
          height: 10px;
          background: #e5e7eb;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #8b5cf6);
          width: 0;
          transition: width 0.3s ease;
          border-radius: 5px;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #6b7280;
          text-align: center;
        }

        /* Totals Summary */
        .totals-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .total-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .total-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .total-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }

        .error-count {
          color: #dc2626;
          cursor: pointer;
          text-decoration: underline;
        }

        /* Error Log */
        .error-log {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        }

        .error-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          color: #dc2626;
          font-weight: 600;
        }

        .error-item {
          padding: 0.5rem;
          border-bottom: 1px solid #fecaca;
          font-size: 0.9rem;
        }

        .error-emp {
          font-weight: 600;
          color: #7c2d12;
          margin-right: 0.5rem;
        }

        .error-msg {
          color: #991b1b;
        }

        .error-more {
          text-align: center;
          color: #dc2626;
          margin-top: 0.5rem;
          font-size: 0.85rem;
        }

        /* Controls Section */
        .controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 2rem 0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .search-container {
          position: relative;
          flex: 1;
          min-width: 300px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #7c3aed;
        }

        .result-count {
          position: absolute;
          right: 1rem;
          font-size: 0.85rem;
          color: #6b7280;
          background: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 0.8rem;
        }

        /* Table Container */
        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          margin: 2rem 0;
          border: 1px solid #e5e7eb;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        .data-table th {
          background: #5b7fdb;
          color: white;
          padding: 1.2rem 1rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.95rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table td {
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.95rem;
        }

        .data-row {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .data-row:hover {
          background: #f8faff;
          transform: scale(1.002);
        }

        .row-error {
          background: #fef2f2;
        }

        .row-error:hover {
          background: #fee2e2;
        }

        .row-cached {
          background: #f0f9ff;
        }

        .row-database {
          
        }

        .row-database:hover {
          background: #bbf7d0;
        }

        /* Cell Styles */
        .id-cell {
          font-family: "Monaco", "Courier New", monospace;
          font-weight: 600;
          color: #1e293b;
        }

        .name-cell {
          font-weight: 600;
          color: #1e293b;
          text-align: left;
          min-width: 150px;
        }

        .salary-cell {
          font-weight: 600;
          color: #059669;
        }

        .source-cell,
        .bonus-cell {
          min-width: 120px;
        }

        .display-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
        }

        .edit-input {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .edit-input-field {
          width: 80px;
          padding: 0.5rem;
          border: 2px solid #7c3aed;
          border-radius: 6px;
          font-size: 0.9rem;
          text-align: center;
        }

        .edit-icon,
        .save-icon {
          color: #7c3aed;
          cursor: pointer;
          font-size: 1rem;
          transition: color 0.2s;
        }

        .edit-icon:hover,
        .save-icon:hover {
          color: #5b21b6;
        }

        .tax-cell,
        .tds-cell {
          font-weight: 700;
          color: #dc2626;
          min-width: 120px;
        }

        .deduct-cell {
          min-width: 100px;
        }

        .deduct-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .deduct-yes {
          background: #d1fae5;
          color: #059669;
        }

        .deduct-no {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-cell {
          min-width: 120px;
        }

        .status-success {
          color: #059669;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .status-error {
          color: #dc2626;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .status-pending {
          color: #f59e0b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          color: #9ca3af;
          font-style: italic;
          font-size: 0.9rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-top: 3rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .pagination-btn {
          padding: 0.8rem 1.5rem;
          border: 2px solid #7c3aed;
          background: white;
          color: #7c3aed;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #7c3aed;
          color: white;
        }

        .pagination-info {
          font-size: 1rem;
          color: #4b5563;
        }

        .current-page {
          font-weight: 700;
          color: #7c3aed;
        }

        .total-pages {
          font-weight: 600;
        }

        .total-items {
          font-size: 0.9rem;
          color: #6b7280;
          margin-left: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .header {
            flex-direction: column;
            text-align: center;
          }

          .header-right {
            align-items: center;
            width: 100%;
          }

          .controls-section {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            width: 100%;
          }

          .action-buttons {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .card {
            padding: 1rem;
          }

          .header h1 {
            font-size: 1.8rem;
          }

          .totals-summary {
            grid-template-columns: 1fr;
          }

          .actions {
            justify-content: center;
          }

          .btn {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }

          .data-table th,
          .data-table td {
            padding: 0.8rem 0.5rem;
            font-size: 0.85rem;
          }

          .pagination {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .sub-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .actions {
            flex-direction: column;
            width: 100%;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default FinanceProvision;
