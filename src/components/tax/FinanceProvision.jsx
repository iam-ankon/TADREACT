// FinanceProvision.jsx - yearly tax (TDS) provision per employee.
//
// One CalculatedTax row per employee holds the tax INPUTS (source other,
// bonus, investment, RPF, source-tax minimum, gender) and the latest result.
// This screen edits Source Other and Bonus; the other inputs are edited on
// the employee's Tax Calculator page and are always sent back unchanged.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaSync,
  FaDownload,
  FaEdit,
  FaSave,
  FaExclamationTriangle,
  FaCalculator,
  FaHistory,
  FaDatabase,
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoice,
  FaTimes,
  FaUsers,
  FaMoneyBillWave,
} from "react-icons/fa";

import { financeAPI, setupCrossTabSync, broadcastUpdate } from "../../api/finance";
import {
  FinanceShell,
  Card,
  Kpi,
  Badge,
  Alert,
  LoadingState,
  EmptyState,
  SearchInput,
  formatMoney,
} from "./finance/FinanceUI";

const INPUT_KEYS = ["actual_investment", "rpf_monthly", "source_tax_minimum", "gender"];

const toGender = (value) => {
  const g = String(value || "").toLowerCase();
  if (g === "f" || g === "female") return "Female";
  return "Male";
};

// CSV cell: quote when it contains a comma, quote or line break.
const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const FinanceProvision = () => {
  const [employees, setEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const [bonusOverride, setBonusOverride] = useState({});
  // Other stored inputs per employee (investment, RPF, source-tax minimum,
  // gender) so every recalculation uses them. Empty until the server sends them.
  const [savedInputs, setSavedInputs] = useState({});
  const [inputsAvailable, setInputsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [editingSourceId, setEditingSourceId] = useState(null);
  const [editingBonusId, setEditingBonusId] = useState(null);
  const [editSourceValue, setEditSourceValue] = useState("");
  const [editBonusValue, setEditBonusValue] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [lastCalculated, setLastCalculated] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [notice, setNotice] = useState(null);

  const navigate = useNavigate();
  const calculationInProgress = useRef(false);
  const isInitialMount = useRef(true);

  const genderFor = useCallback(
    (emp, inputs = savedInputs) => {
      const stored = inputs[emp.employee_id]?.gender;
      return stored ? toGender(stored) : toGender(emp.gender);
    },
    [savedInputs],
  );

  // Request body for /calculate/ with every stored input of the employee.
  const buildCalcRequest = (emp, overrides, inputs = savedInputs) => {
    const empId = emp.employee_id;
    const stored = inputs[empId] || {};
    return {
      employee_id: empId,
      gender: genderFor(emp, inputs),
      salary: emp.salary || 0,
      source_other: sourceOther[empId] || 0,
      bonus: bonusOverride[empId] || 0,
      actual_investment: stored.actual_investment || 0,
      rpf_monthly: stored.rpf_monthly || 0,
      source_tax_minimum:
        stored.source_tax_minimum === undefined ? null : stored.source_tax_minimum,
      ...overrides,
    };
  };

  // Split a get-calculated-taxes response into the pieces this screen keeps.
  const readSavedResults = (savedResults) => {
    const databaseResults = {};
    const newSourceOther = {};
    const newBonusOverride = {};
    const newInputs = {};
    let hasInputs = false;

    Object.keys(savedResults).forEach((empId) => {
      const savedData = savedResults[empId];
      if (savedData.source_other !== undefined) {
        newSourceOther[empId] = savedData.source_other || 0;
      }
      if (savedData.bonus !== undefined) {
        newBonusOverride[empId] = savedData.bonus || 0;
      }
      if (savedData.actual_investment !== undefined) hasInputs = true;
      newInputs[empId] = {};
      INPUT_KEYS.forEach((key) => {
        if (savedData[key] !== undefined) newInputs[empId][key] = savedData[key];
      });
      if (savedData.calculation_data) {
        databaseResults[empId] = savedData.calculation_data;
      }
    });

    return { databaseResults, newSourceOther, newBonusOverride, newInputs, hasInputs };
  };

  // Calculate employees that have no saved result yet (new rows only: an
  // automatic "system" save never changes the inputs of an existing row).
  const calculateMissingTaxes = useCallback(
    async (employeeList, employeeIds, sourceData, bonusData, inputs = {}, label) => {
      if (calculationInProgress.current || !employeeIds.length) return;

      calculationInProgress.current = true;
      setCalculating(true);
      setProgress(0);

      try {
        const newResults = {};
        const newErrors = [];
        let successCount = 0;
        const batchSize = 5;

        for (let batchIndex = 0; batchIndex < employeeIds.length; batchIndex += batchSize) {
          const batchIds = employeeIds.slice(batchIndex, batchIndex + batchSize);

          const batchResults = await Promise.all(
            batchIds.map(async (empId) => {
              const emp = employeeList.find((e) => e.employee_id === empId);
              if (!emp) return null;
              const stored = inputs[empId] || {};

              try {
                const response = await financeAPI.tax.calculate({
                  employee_id: empId,
                  gender: stored.gender ? toGender(stored.gender) : toGender(emp.gender),
                  salary: emp.salary || 0,
                  source_other: sourceData[empId] || 0,
                  bonus: bonusData[empId] || 0,
                  actual_investment: stored.actual_investment || 0,
                  rpf_monthly: stored.rpf_monthly || 0,
                  source_tax_minimum:
                    stored.source_tax_minimum === undefined ? null : stored.source_tax_minimum,
                });

                if (response.data) {
                  try {
                    await financeAPI.tax.saveCalculatedTax({
                      employee_id: empId,
                      calculation_data: response.data,
                      source_other: sourceData[empId] || 0,
                      bonus: bonusData[empId] || 0,
                      calculated_by: "system",
                    });
                  } catch (saveError) {
                    console.warn(`Could not save to database for ${empId}:`, saveError);
                  }
                  return { empId, data: response.data };
                }
              } catch (err) {
                return {
                  empId,
                  error: err.response?.data?.error || err.message,
                };
              }
              return null;
            }),
          );

          batchResults.forEach((result) => {
            if (!result) return;
            if (result.data) {
              newResults[result.empId] = result.data;
              successCount++;
            } else if (result.error) {
              newErrors.push({ empId: result.empId, error: result.error });
            }
          });

          setProgress(
            Math.min(Math.round(((batchIndex + batchSize) / employeeIds.length) * 100), 100),
          );
          setTaxResults((prev) => ({ ...prev, ...newResults }));

          if (batchIndex + batchSize < employeeIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        setTaxResults((prev) => ({ ...prev, ...newResults }));
        setLastCalculated(
          `${label || "Calculated"} ${successCount} employee${successCount === 1 ? "" : "s"} · ${new Date().toLocaleTimeString()}`,
        );
        setErrorLog((prev) => [...prev, ...newErrors]);
      } catch (error) {
        console.error("Calculation failed:", error);
        setErrorLog((prev) => [...prev, { type: "calculation", message: error.message }]);
      } finally {
        calculationInProgress.current = false;
        setCalculating(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [],
  );

  // Load data from backend only - NO CACHE
  const loadData = useCallback(async () => {
    if (calculationInProgress.current) return;

    try {
      setLoading(true);

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // 1. Employees with salary data for the current month
      const response = await financeAPI.employee.getAll(currentMonth, currentYear);
      const employeeData = response.data;
      setEmployees(employeeData);
      const employeeIds = employeeData.map((emp) => emp.employee_id);

      // 2. Saved inputs and results
      try {
        const savedResponse = await financeAPI.tax.getCalculatedTaxes({
          employee_ids: employeeIds,
        });

        if (savedResponse.data.success && savedResponse.data.results) {
          const { databaseResults, newSourceOther, newBonusOverride, newInputs, hasInputs } =
            readSavedResults(savedResponse.data.results);

          setSourceOther(newSourceOther);
          setBonusOverride(newBonusOverride);
          setSavedInputs(newInputs);
          setInputsAvailable(hasInputs);
          setTaxResults(databaseResults);

          // Keep a copy for UI state persistence (not a cache)
          financeAPI.storage.setSourceTaxOther(newSourceOther);
          financeAPI.storage.setBonusOverride(newBonusOverride);

          setLastCalculated(`Loaded from database · ${new Date().toLocaleTimeString()}`);

          const missingEmployeeIds = employeeIds.filter((id) => !databaseResults[id]);
          if (missingEmployeeIds.length > 0 && !calculationInProgress.current) {
            calculateMissingTaxes(
              employeeData,
              missingEmployeeIds,
              newSourceOther,
              newBonusOverride,
              newInputs,
            );
          }
          return;
        }
      } catch (dbError) {
        console.error("Failed to load from database:", dbError);
        setErrorLog((prev) => [...prev, { type: "load", message: dbError.message }]);

        // Fallback to the last values this browser saw
        const localSourceData = financeAPI.storage.getSourceTaxOther();
        const localBonusData = financeAPI.storage.getBonusOverride();
        setSourceOther(localSourceData);
        setBonusOverride(localBonusData);

        if (employeeIds.length > 0 && !calculationInProgress.current) {
          calculateMissingTaxes(employeeData, employeeIds, localSourceData, localBonusData);
        }
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setErrorLog((prev) => [...prev, { type: "load", message: err.message }]);
    } finally {
      setLoading(false);
    }
  }, [calculateMissingTaxes]);

  const handleEditSource = (emp) => {
    setEditingBonusId(null);
    setEditingSourceId(emp.employee_id);
    setEditSourceValue(sourceOther[emp.employee_id]?.toString() || "0");
  };

  const handleEditBonus = (emp) => {
    setEditingSourceId(null);
    setEditingBonusId(emp.employee_id);
    setEditBonusValue(bonusOverride[emp.employee_id]?.toString() || "0");
  };

  // Save one edited input (source_other or bonus), recalculate with all the
  // employee's other stored inputs, and store the new result.
  const saveInput = async (employeeId, field, val) => {
    const employee = employees.find((e) => e.employee_id === employeeId);
    if (!employee) return;

    // The recalculation needs the employee's investment, RPF and source-tax
    // minimum; without them the saved tax would be wrong.
    if (!inputsAvailable && savedInputs[employeeId]) {
      setNotice({
        tone: "warning",
        text: "Saving is paused until the server update is live (it must send each employee's investment, RPF and source-tax minimum). Nothing was changed.",
      });
      loadData();
      return;
    }

    const nextSource = field === "source_other" ? val : sourceOther[employeeId] || 0;
    const nextBonus = field === "bonus" ? val : bonusOverride[employeeId] || 0;

    try {
      setCalculating(true);
      const response = await financeAPI.tax.calculate(
        buildCalcRequest(employee, { source_other: nextSource, bonus: nextBonus }),
      );

      if (response.data) {
        await financeAPI.tax.saveCalculatedTax({
          employee_id: employeeId,
          calculation_data: response.data,
          source_other: nextSource,
          bonus: nextBonus,
          calculated_by: "user",
        });

        setTaxResults((prev) => ({ ...prev, [employeeId]: response.data }));
        setLastCalculated(
          `Updated ${employee.name || employeeId} · ${new Date().toLocaleTimeString()}`,
        );
      }
    } catch (err) {
      console.error(`Failed to save ${field}:`, err);
      setErrorLog((prev) => [
        ...prev,
        { empId: employeeId, error: err.response?.data?.error || err.message },
      ]);
      setNotice({
        tone: "danger",
        text: `Could not save for ${employee.name || employeeId}. Please try again.`,
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveSource = async (employeeId) => {
    const val = parseFloat(editSourceValue) || 0;
    const updatedSourceOther = { ...sourceOther, [employeeId]: val };
    setSourceOther(updatedSourceOther);
    setEditingSourceId(null);
    broadcastUpdate("sourceTaxOther", updatedSourceOther);
    await saveInput(employeeId, "source_other", val);
  };

  const handleSaveBonus = async (employeeId) => {
    const val = parseFloat(editBonusValue) || 0;
    const updatedBonusOverride = { ...bonusOverride, [employeeId]: val };
    setBonusOverride(updatedBonusOverride);
    setEditingBonusId(null);
    broadcastUpdate("bonusOverride", updatedBonusOverride);
    await saveInput(employeeId, "bonus", val);
  };

  const handleEditKey = (e, save, cancel) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  // Export data to CSV
  const handleExport = () => {
    const exportData = Object.keys(taxResults).map((empId) => {
      const emp = employees.find((e) => e.employee_id === empId);
      const calc = taxResults[empId]?.tax_calculation || {};
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
      setNotice({ tone: "warning", text: "No data to export. Please calculate taxes first." });
      return;
    }

    const csvContent = [Object.keys(exportData[0]), ...exportData.map((row) => Object.values(row))]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax_calculations_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSyncData = async () => {
    try {
      setCalculating(true);
      const savedResponse = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: employees.map((emp) => emp.employee_id),
      });

      if (savedResponse.data.success && savedResponse.data.results) {
        const { databaseResults, newSourceOther, newBonusOverride, newInputs, hasInputs } =
          readSavedResults(savedResponse.data.results);

        setSourceOther(newSourceOther);
        setBonusOverride(newBonusOverride);
        setSavedInputs(newInputs);
        setInputsAvailable(hasInputs);
        setTaxResults(databaseResults);
        setLastCalculated(`Synced from database · ${new Date().toLocaleTimeString()}`);
        setNotice({
          tone: "success",
          text: `Synced ${Object.keys(databaseResults).length} calculations from the database.`,
        });
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setNotice({ tone: "danger", text: "Failed to sync from the database. Please try again." });
    } finally {
      setCalculating(false);
    }
  };

  // Recalculate every employee from the inputs stored in the database. It
  // refreshes the results only: the stored inputs are never deleted or
  // changed. (It used to delete every row first, which lost investment,
  // RPF and source-tax minimum for everyone.)
  const handleRefreshCalculations = async () => {
    if (!inputsAvailable) {
      setNotice({
        tone: "warning",
        text:
          "Recalculate All needs the latest server update (it reads each employee's investment, RPF and source-tax minimum). Nothing was changed.",
      });
      return;
    }
    if (
      !window.confirm(
        `Recalculate tax for all ${employees.length} employees from their saved inputs?\n\nSaved inputs (source other, bonus, investment, RPF, source-tax minimum) are kept.`,
      )
    ) {
      return;
    }
    const employeeIds = employees.map((emp) => emp.employee_id);
    await calculateMissingTaxes(
      employees,
      employeeIds,
      sourceOther,
      bonusOverride,
      savedInputs,
      "Recalculated",
    );
  };

  // Initial load
  useEffect(() => {
    if (isInitialMount.current) {
      loadData();
      isInitialMount.current = false;
    }
  }, [loadData]);

  // Reload when another browser tab changes the inputs. Events from this tab
  // (our own saves) carry an event object and are ignored: the screen is
  // already up to date.
  useEffect(() => {
    let mounted = true;
    let lastUpdateTime = 0;

    const handleDataUpdate = (event) => {
      if (!mounted || event) return;
      const now = Date.now();
      if (now - lastUpdateTime < 2000) return;
      lastUpdateTime = now;
      setTimeout(() => mounted && loadData(), 500);
    };

    const cleanup = setupCrossTabSync(handleDataUpdate);
    return () => {
      mounted = false;
      cleanup();
    };
  }, [loadData]);

  const companies = useMemo(
    () => [...new Set(employees.map((e) => e.company_name).filter(Boolean))].sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(
      (emp) =>
        (companyFilter === "All" || emp.company_name === companyFilter) &&
        (!q ||
          emp.name?.toLowerCase().includes(q) ||
          emp.employee_id?.toString().toLowerCase().includes(q)),
    );
  }, [employees, searchQuery, companyFilter]);

  const totals = useMemo(() => {
    const rows = filtered.map((emp) => taxResults[emp.employee_id]?.tax_calculation || {});
    return {
      netTaxPayable: rows.reduce((sum, c) => sum + (c.net_tax_payable || 0), 0),
      monthlyTDS: rows.reduce((sum, c) => sum + (c.monthly_tds || 0), 0),
      employeesWithTax: rows.filter((c) => c.should_deduct_tax).length,
      calculated: rows.filter((c) => c.net_tax_payable !== undefined).length,
    };
  }, [filtered, taxResults]);

  const pageActions = (
    <>
      <button onClick={() => navigate("/salary-format")} className="fin-btn">
        <FaFileAlt /> Salary Sheet
      </button>
      <button onClick={() => navigate("/salary-certificate-generator")} className="fin-btn">
        <FaFileInvoice /> Certificates
      </button>
      <button className="fin-btn" onClick={handleSyncData} disabled={calculating}>
        <FaDatabase /> Sync DB
      </button>
      <button
        className="fin-btn"
        onClick={handleExport}
        disabled={Object.keys(taxResults).length === 0}
      >
        <FaDownload /> Export CSV
      </button>
      <button
        className="fin-btn fin-btn--primary"
        onClick={handleRefreshCalculations}
        disabled={calculating || employees.length === 0}
        title="Recalculate every employee from the saved inputs"
      >
        <FaSync className={calculating ? "fin-spin" : ""} /> Recalculate All
      </button>
    </>
  );

  if (loading && employees.length === 0) {
    return (
      <FinanceShell>
        <LoadingState
          page
          title="Loading tax provision…"
          text="Fetching employees and saved tax calculations"
        />
      </FinanceShell>
    );
  }

  const renderEditable = (emp, kind) => {
    const isSource = kind === "source";
    const editingId = isSource ? editingSourceId : editingBonusId;
    const value = isSource ? sourceOther[emp.employee_id] : bonusOverride[emp.employee_id];

    if (editingId === emp.employee_id) {
      const save = () =>
        isSource ? handleSaveSource(emp.employee_id) : handleSaveBonus(emp.employee_id);
      const cancel = () => (isSource ? setEditingSourceId(null) : setEditingBonusId(null));
      return (
        <div className="fin-editable" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            autoFocus
            value={isSource ? editSourceValue : editBonusValue}
            onChange={(e) =>
              isSource ? setEditSourceValue(e.target.value) : setEditBonusValue(e.target.value)
            }
            onKeyDown={(e) => handleEditKey(e, save, cancel)}
            onFocus={(e) => e.target.select()}
            className="fin-cell-input fin-cell-input--wide"
            placeholder="0"
          />
          <button
            type="button"
            className="fin-edit-btn fin-edit-btn--save"
            title="Save (Enter)"
            onClick={save}
          >
            <FaSave />
          </button>
          <button type="button" className="fin-edit-btn" title="Cancel (Esc)" onClick={cancel}>
            <FaTimes />
          </button>
        </div>
      );
    }

    return (
      <div className="fin-editable">
        <span>{formatMoney(value || 0)}</span>
        <button
          type="button"
          className="fin-edit-btn"
          title={isSource ? "Edit source tax other" : "Edit yearly bonus"}
          onClick={(e) => {
            e.stopPropagation();
            isSource ? handleEditSource(emp) : handleEditBonus(emp);
          }}
        >
          <FaEdit />
        </button>
      </div>
    );
  };

  return (
    <FinanceShell
      title="Tax Provision"
      icon={<FaCalculator />}
      subtitle={
        <>
          <FaHistory style={{ marginRight: 6, verticalAlign: "-1px" }} />
          {lastCalculated || "Not calculated yet"}
        </>
      }
      actions={pageActions}
    >
      <div className="fin-stack">
        {notice && (
          <Alert
            tone={notice.tone}
            action={
              <button className="fin-btn fin-btn--ghost fin-btn--sm" onClick={() => setNotice(null)}>
                <FaTimes />
              </button>
            }
          >
            {notice.text}
          </Alert>
        )}

        {calculating && (
          <Card>
            <div className="fin-row" style={{ marginBottom: 8 }}>
              <span className="fin-spinner fin-spinner--sm" />
              <strong>{progress > 0 ? `Calculating… ${progress}%` : "Updating data…"}</strong>
            </div>
            <div className={`fin-progress ${progress > 0 ? "" : "fin-progress--indeterminate"}`}>
              <div className="fin-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </Card>
        )}

        <div className="fin-kpis">
          <Kpi
            tone="primary"
            icon={<FaMoneyBillWave />}
            label="Net tax payable (year)"
            value={formatMoney(totals.netTaxPayable)}
            hint={`${totals.calculated} of ${filtered.length} calculated`}
          />
          <Kpi
            tone="success"
            icon={<FaCalculator />}
            label="Monthly TDS"
            value={formatMoney(totals.monthlyTDS)}
            hint="Sum of monthly deductions"
          />
          <Kpi
            tone="info"
            icon={<FaUsers />}
            label="Employees with tax"
            value={`${totals.employeesWithTax} / ${filtered.length}`}
            hint="Salary above the AIT threshold"
          />
          <Kpi
            tone={errorLog.length ? "danger" : undefined}
            icon={<FaExclamationTriangle />}
            label="Errors"
            value={errorLog.length}
            hint={errorLog.length ? (showErrors ? "Click to hide" : "Click to view") : "No errors"}
            onClick={errorLog.length ? () => setShowErrors(!showErrors) : undefined}
          />
        </div>

        {showErrors && errorLog.length > 0 && (
          <Alert
            tone="danger"
            title={`Calculation errors (${errorLog.length})`}
            action={
              <button className="fin-btn fin-btn--sm" onClick={() => setErrorLog([])}>
                Clear
              </button>
            }
          >
            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
              {errorLog.slice(0, 8).map((error, idx) => (
                <li key={idx}>
                  <strong>{error.empId || "System"}:</strong> {error.message || error.error}
                </li>
              ))}
            </ul>
            {errorLog.length > 8 && <div>… and {errorLog.length - 8} more</div>}
          </Alert>
        )}

        <Card
          flush
          title="Employees"
          subtitle="Click a row to open the employee's full tax calculation. Edit Source Other and Bonus inline."
          actions={
            <>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or ID…"
              />
              <select
                className="fin-select"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                aria-label="Company"
              >
                <option value="All">All companies</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Badge>{filtered.length} employees</Badge>
            </>
          }
        >
          <div className="fin-table-wrap">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th className="num">Salary</th>
                  <th className="num">Source Other</th>
                  <th className="num">Bonus (Yearly)</th>
                  <th className="num">Net Tax Payable</th>
                  <th className="num">Monthly TDS</th>
                  <th className="center">Deduct?</th>
                  <th className="center">Status</th>
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
                      className={`fin-row-clickable ${isError ? "fin-row-error" : ""}`}
                      onClick={() => navigate(`/tax-calculator/${emp.employee_id}`)}
                    >
                      <td className="fin-col-id">{emp.employee_id}</td>
                      <td className="fin-col-name">{emp.name}</td>
                      <td className="muted">{emp.company_name}</td>
                      <td className="num strong">{formatMoney(emp.salary || 0)}</td>
                      <td className="num">{renderEditable(emp, "source")}</td>
                      <td className="num">{renderEditable(emp, "bonus")}</td>
                      <td className="num">
                        {calc.net_tax_payable !== undefined && calc.net_tax_payable !== null ? (
                          formatMoney(calc.net_tax_payable)
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="num strong">
                        {calc.monthly_tds !== undefined && calc.monthly_tds !== null ? (
                          formatMoney(calc.monthly_tds)
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="center">
                        {shouldDeduct !== undefined ? (
                          <Badge tone={shouldDeduct ? "success" : undefined}>
                            {shouldDeduct ? <FaCheckCircle /> : <FaTimesCircle />}
                            {shouldDeduct ? "Yes" : "No"}
                          </Badge>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="center">
                        {isError ? (
                          <Badge tone="danger">
                            <FaExclamationTriangle /> Failed
                          </Badge>
                        ) : hasCalculation ? (
                          <Badge tone="primary">
                            <FaCheckCircle /> Ready
                          </Badge>
                        ) : calculating ? (
                          <Badge tone="warning">
                            <span className="fin-spinner fin-spinner--sm" /> Calculating
                          </Badge>
                        ) : (
                          <Badge>Pending</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <EmptyState
                title="No employees found"
                action={
                  (searchQuery || companyFilter !== "All") && (
                    <button
                      className="fin-btn fin-btn--sm"
                      onClick={() => {
                        setSearchQuery("");
                        setCompanyFilter("All");
                      }}
                    >
                      Clear filters
                    </button>
                  )
                }
              >
                Try a different name, ID or company.
              </EmptyState>
            )}
          </div>
        </Card>
      </div>
    </FinanceShell>
  );
};

export default FinanceProvision;
