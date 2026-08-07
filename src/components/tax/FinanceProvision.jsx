// FinanceProvision.jsx - CACHE REMOVED VERSION

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
  FaFileInvoice,
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
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [editingBonusId, setEditingBonusId] = useState(null);
  const [editingSalaryId, setEditingSalaryId] = useState(null);
  const [editSourceValue, setEditSourceValue] = useState("");
  const [editBonusValue, setEditBonusValue] = useState("");
  const [editSalaryValue, setEditSalaryValue] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const [showErrors, setShowErrors] = useState(false);

  const navigate = useNavigate();
  const calculationInProgress = useRef(false);
  const isInitialMount = useRef(true);

  // Calculate missing taxes - NO CACHE
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

        const batchSize = 5;

        for (
          let batchIndex = 0;
          batchIndex < employeeIds.length;
          batchIndex += batchSize
        ) {
          const batchIds = employeeIds.slice(
            batchIndex,
            batchIndex + batchSize,
          );

          const batchPromises = batchIds.map(async (empId) => {
            const emp = employeeList.find((e) => e.employee_id === empId);
            if (!emp) return null;

            try {
              const response = await financeAPI.tax.calculate({
                employee_id: empId,
                gender: emp.gender === "M" ? "Male" : "Female",
                salary: emp.salary || 0,
                source_other: sourceData[empId] || 0,
                bonus: bonusData[empId] || 0,
              });

              if (response.data) {
                // Save to backend database only (no localStorage cache)
                try {
                  await financeAPI.tax.saveCalculatedTax({
                    employee_id: empId,
                    calculation_data: response.data,
                    source_other: sourceData[empId] || 0,
                    bonus: bonusData[empId] || 0,
                    calculated_by: "system",
                  });
                } catch (saveError) {
                  console.warn(
                    `Could not save to database for ${empId}:`,
                    saveError,
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

          const currentProgress = Math.round(
            ((batchIndex + batchSize) / employeeIds.length) * 100,
          );
          setProgress(Math.min(currentProgress, 100));
          setTaxResults((prev) => ({ ...prev, ...newResults }));

          if (batchIndex + batchSize < employeeIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        setTaxResults((prev) => ({ ...prev, ...newResults }));
        setLastCalculated(
          `Calculated ${successCount} employees (${new Date().toLocaleTimeString()})`,
        );
        setErrorLog((prev) => [...prev, ...newErrors]);

        console.log(
          `✅ Calculation completed: ${successCount} success, ${newErrors.length} errors`,
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
    [taxResults],
  );

  // Load data from backend only - NO CACHE
  const loadData = useCallback(async () => {
    if (calculationInProgress.current) {
      console.log("⏸️ Load already in progress, skipping");
      return;
    }

    try {
      setLoading(true);
      console.log("📊 Loading finance data from backend...");

      // Get current month/year
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // 1. Load employees with salary data for current month/year
      const response = await financeAPI.employee.getAll(
        currentMonth,
        currentYear,
      );
      const employeeData = response.data;

      setEmployees(employeeData);
      const employeeIds = employeeData.map((emp) => emp.employee_id);
      console.log(`✅ Loaded ${employeeData.length} employees`);

      // 2. Load source other and bonus from database
      console.log("💾 Loading source_other and bonus from database...");
      try {
        const savedResponse = await financeAPI.tax.getCalculatedTaxes({
          employee_ids: employeeIds,
        });

        if (savedResponse.data.success && savedResponse.data.results) {
          const savedResults = savedResponse.data.results;
          const databaseResults = {};
          const newSourceOther = {};
          const newBonusOverride = {};

          Object.keys(savedResults).forEach((empId) => {
            const savedData = savedResults[empId];

            if (savedData.source_other !== undefined) {
              newSourceOther[empId] = savedData.source_other || 0;
            }
            if (savedData.bonus !== undefined) {
              newBonusOverride[empId] = savedData.bonus || 0;
            }

            if (savedData.calculation_data) {
              databaseResults[empId] = savedData.calculation_data;
            }
          });

          console.log(
            `💾 Loaded ${Object.keys(databaseResults).length} calculations from database`,
          );

          setSourceOther(newSourceOther);
          setBonusOverride(newBonusOverride);
          setTaxResults(databaseResults);

          // Also store in localStorage for UI state persistence (not cache)
          financeAPI.storage.setSourceTaxOther(newSourceOther);
          financeAPI.storage.setBonusOverride(newBonusOverride);

          setLastCalculated(
            `Loaded from database (${new Date().toLocaleTimeString()})`,
          );

          // Find employees without calculations
          const missingEmployeeIds = employeeIds.filter(
            (id) => !databaseResults[id],
          );

          if (missingEmployeeIds.length > 0 && !calculationInProgress.current) {
            console.log(
              `🔄 Calculating ${missingEmployeeIds.length} missing employees...`,
            );
            calculateMissingTaxes(
              employeeData,
              missingEmployeeIds,
              newSourceOther,
              newBonusOverride,
            );
          }

          return;
        }
      } catch (dbError) {
        console.error("Failed to load from database:", dbError);
        setErrorLog((prev) => [
          ...prev,
          { type: "load", message: dbError.message },
        ]);

        // Fallback to localStorage for UI state only
        const localSourceData = financeAPI.storage.getSourceTaxOther();
        const localBonusData = financeAPI.storage.getBonusOverride();

        setSourceOther(localSourceData);
        setBonusOverride(localBonusData);

        // Calculate all employees
        if (employeeIds.length > 0 && !calculationInProgress.current) {
          calculateMissingTaxes(
            employeeData,
            employeeIds,
            localSourceData,
            localBonusData,
          );
        }
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setErrorLog((prev) => [...prev, { type: "load", message: err.message }]);
    } finally {
      setLoading(false);
    }
  }, [calculateMissingTaxes]);

  // Handle salary edit
  const handleEditSalary = (emp) => {
    setEditingSalaryId(emp.employee_id);
    setEditSalaryValue(emp.salary?.toString() || "0");
  };

  const handleSaveSalary = async (employeeId) => {
    const newSalary = parseFloat(editSalaryValue) || 0;

    const updatedEmployees = employees.map((emp) =>
      emp.employee_id === employeeId ? { ...emp, salary: newSalary } : emp,
    );
    setEmployees(updatedEmployees);
    setEditingSalaryId(null);

    try {
      setCalculating(true);

      const employee = updatedEmployees.find(
        (e) => e.employee_id === employeeId,
      );

      const response = await financeAPI.tax.calculate({
        employee_id: employeeId,
        gender: employee.gender === "M" ? "Male" : "Female",
        salary: newSalary,
        source_other: sourceOther[employeeId] || 0,
        bonus: bonusOverride[employeeId] || 0,
      });

      if (response.data) {
        await financeAPI.tax.saveCalculatedTax({
          employee_id: employeeId,
          calculation_data: response.data,
          source_other: sourceOther[employeeId] || 0,
          bonus: bonusOverride[employeeId] || 0,
          calculated_by: "user",
        });

        setTaxResults((prev) => ({
          ...prev,
          [employeeId]: response.data,
        }));

        setLastCalculated(
          `Updated salary for employee ${employeeId} (${new Date().toLocaleTimeString()})`,
        );

        console.log("✅ Salary updated and tax recalculated");
      }
    } catch (err) {
      console.error("Failed to update salary:", err);
      setErrorLog((prev) => [
        ...prev,
        { empId: employeeId, error: err.message },
      ]);
    } finally {
      setCalculating(false);
    }
  };

  const handleEditSource = (emp) => {
    setEditingSourceId(emp.employee_id);
    setEditSourceValue(sourceOther[emp.employee_id]?.toString() || "0");
  };

  const handleEditBonus = (emp) => {
    setEditingBonusId(emp.employee_id);
    setEditBonusValue(bonusOverride[emp.employee_id]?.toString() || "0");
  };

  const handleSaveSource = async (employeeId) => {
    const val = parseFloat(editSourceValue) || 0;

    const updatedSourceOther = { ...sourceOther, [employeeId]: val };
    setSourceOther(updatedSourceOther);
    setEditingSourceId(null);

    financeAPI.storage.setSourceTaxOther(updatedSourceOther);
    broadcastUpdate("sourceTaxOther", updatedSourceOther);

    try {
      const employee = employees.find((e) => e.employee_id === employeeId);
      if (employee) {
        setCalculating(true);

        const response = await financeAPI.tax.calculate({
          employee_id: employeeId,
          gender: employee.gender === "M" ? "Male" : "Female",
          salary: employee.salary || 0,
          source_other: val,
          bonus: bonusOverride[employeeId] || 0,
        });

        if (response.data) {
          await financeAPI.tax.saveCalculatedTax({
            employee_id: employeeId,
            calculation_data: response.data,
            source_other: val,
            bonus: bonusOverride[employeeId] || 0,
            calculated_by: "user",
          });

          setTaxResults((prev) => ({
            ...prev,
            [employeeId]: response.data,
          }));

          setLastCalculated(
            `Updated for employee ${employeeId} (${new Date().toLocaleTimeString()})`,
          );
        }
      }
    } catch (err) {
      console.error("Failed to save source other:", err);
      setErrorLog((prev) => [
        ...prev,
        { empId: employeeId, error: err.message },
      ]);
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveBonus = async (employeeId) => {
    const val = parseFloat(editBonusValue) || 0;

    const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };
    setBonusOverride(updatedBonusOverride);
    setEditingBonusId(null);

    financeAPI.storage.setBonusOverride(updatedBonusOverride);
    broadcastUpdate("bonusOverride", updatedBonusOverride);

    try {
      const employee = employees.find((e) => e.employee_id === employeeId);
      if (employee) {
        setCalculating(true);

        const response = await financeAPI.tax.calculate({
          employee_id: employeeId,
          gender: employee.gender === "M" ? "Male" : "Female",
          salary: employee.salary || 0,
          source_other: sourceOther[employeeId] || 0,
          bonus: val,
        });

        if (response.data) {
          await financeAPI.tax.saveCalculatedTax({
            employee_id: employeeId,
            calculation_data: response.data,
            source_other: sourceOther[employeeId] || 0,
            bonus: val,
            calculated_by: "user",
          });

          setTaxResults((prev) => ({
            ...prev,
            [employeeId]: response.data,
          }));

          setLastCalculated(
            `Updated for employee ${employeeId} (${new Date().toLocaleTimeString()})`,
          );
        }
      }
    } catch (err) {
      console.error("Failed to save bonus:", err);
      setErrorLog((prev) => [
        ...prev,
        { empId: employeeId, error: err.message },
      ]);
    } finally {
      setCalculating(false);
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
        Company: emp?.company_name || "",
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

  const handleSyncData = async () => {
    try {
      setCalculating(true);
      const employeeIds = employees.map((emp) => emp.employee_id);

      const savedResponse = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: employeeIds,
      });

      if (savedResponse.data.success && savedResponse.data.results) {
        const savedResults = savedResponse.data.results;
        const databaseResults = {};
        const newSourceOther = {};
        const newBonusOverride = {};

        Object.keys(savedResults).forEach((empId) => {
          const savedData = savedResults[empId];

          if (savedData.source_other !== undefined) {
            newSourceOther[empId] = savedData.source_other || 0;
          }
          if (savedData.bonus !== undefined) {
            newBonusOverride[empId] = savedData.bonus || 0;
          }

          if (savedData.calculation_data) {
            databaseResults[empId] = savedData.calculation_data;
          }
        });

        setSourceOther(newSourceOther);
        setBonusOverride(newBonusOverride);
        setTaxResults(databaseResults);
        setLastCalculated(
          `Synced from database (${new Date().toLocaleTimeString()})`,
        );

        alert(
          `Synced ${Object.keys(databaseResults).length} calculations from database!`,
        );
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Failed to sync from database. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleRefreshCalculations = async () => {
    if (
      window.confirm(
        "Clear all tax calculations and recalculate for all employees?",
      )
    ) {
      try {
        await financeAPI.tax.clearCalculatedTaxes({
          employee_id: null,
        });
      } catch (err) {
        console.warn("Could not clear backend:", err);
      }

      setTaxResults({});

      const employeeIds = employees.map((emp) => emp.employee_id);
      calculateMissingTaxes(employees, employeeIds, sourceOther, bonusOverride);
    }
  };

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadData();
      isInitialMount.current = false;
    }
  }, [loadData]);

  // Cross-tab sync
  useEffect(() => {
    let mounted = true;
    let lastUpdateTime = 0;
    const UPDATE_COOLDOWN = 2000;

    const handleDataUpdate = (event) => {
      if (!mounted) return;

      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_COOLDOWN) {
        console.log("🔄 Update throttled, skipping");
        return;
      }

      lastUpdateTime = now;

      if (
        event &&
        event.detail &&
        (event.detail.type === "sourceTaxOther" ||
          event.detail.type === "bonusOverride")
      ) {
        console.log("🔄 Cross-tab update detected, refreshing data");

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

  // Filter employees
  const filtered = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id?.toString().includes(searchQuery),
  );

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
        (result) => result?.tax_calculation?.should_deduct_tax,
      ).length,
    }),
    [taxResults],
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
              </div>
            </div>
            <div className="header-right">
              <div className="actions">
                <button
                  onClick={() => navigate("/salary-format")}
                  className="btn format"
                >
                  <FaFileAlt /> Salary Sheet
                </button>
                <button
                  onClick={() => navigate("/salary-certificate-generator")}
                  className="btn certificate"
                >
                  <FaFileInvoice /> Generate Certificate
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
                {progress > 0
                  ? `Calculating: ${progress}%`
                  : "Updating data..."}
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
          </div>

          {/* Main Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Company</th>
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
                {filtered.map((emp) => {
                  const res = taxResults[emp.employee_id] || {};
                  const calc = res.tax_calculation || {};
                  const hasCalculation = !!res.tax_calculation;
                  const shouldDeduct = calc.should_deduct_tax;
                  const isError = res.error;

                  return (
                    <tr
                      key={emp.employee_id}
                      className={`data-row ${isError ? "row-error" : ""}`}
                      onClick={() => handleNavigate(emp.employee_id)}
                    >
                      <td className="id-cell">{emp.employee_id}</td>
                      <td className="name-cell">{emp.name}</td>
                      <td className="company-cell">{emp.company_name}</td>

                      {/* Salary Cell - NO EDIT BUTTON */}
                      <td className="salary-cell">
                        <div className="display-value">
                          {financeAPI.utils.formatCurrency(emp.salary || 0)}
                        </div>
                      </td>

                      {/* Source Other Cell - Keep Edit */}
                      <td className="source-cell">
                        {editingSourceId === emp.employee_id ? (
                          <div
                            className="edit-input"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              value={editSourceValue}
                              onChange={(e) =>
                                setEditSourceValue(e.target.value)
                              }
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
                              sourceOther[emp.employee_id] || 0,
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

                      {/* Bonus Cell - Keep Edit */}
                      <td className="bonus-cell">
                        {editingBonusId === emp.employee_id ? (
                          <div
                            className="edit-input"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              value={editBonusValue}
                              onChange={(e) =>
                                setEditBonusValue(e.target.value)
                              }
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
                              bonusOverride[emp.employee_id] || 0,
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
                        {calc.net_tax_payable !== undefined &&
                        calc.net_tax_payable !== null ? (
                          financeAPI.utils.formatCurrency(calc.net_tax_payable)
                        ) : (
                          <span className="loading-text">-</span>
                        )}
                      </td>

                      <td className="tds-cell">
                        {calc.monthly_tds !== undefined &&
                        calc.monthly_tds !== null ? (
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
                            <FaCheckCircle /> Ready
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

            {filtered.length === 0 && (
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
          font-family:
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .dashboard {
          width: 100%;
          max-width: 95%;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          margin-top: 1rem;
        }

        .card {
          padding: 1rem;
        }

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

        .header-right {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-end;
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

        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          margin: 2rem 0;
          border: 1px solid #e5e7eb;
          max-height: 600px;
          overflow-y: auto;
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
        }

        .row-error {
          background: #fef2f2;
        }

        .row-error:hover {
          background: #fee2e2;
        }

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
          min-width: 120px;
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
          width: 100px;
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
