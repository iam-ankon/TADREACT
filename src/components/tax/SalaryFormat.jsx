// SalaryFormat.jsx - this month's salary sheet for every company.
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSave,
  FaBuilding,
  FaUsers,
  FaCheckCircle,
  FaGift,
  FaHistory,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaCalculator,
  FaUniversity,
  FaSync,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import { financeAPI } from "../../api/finance";
import {
  FinanceShell,
  Card,
  Kpi,
  Badge,
  Alert,
  LoadingState,
  EmptyState,
  SearchInput,
  CompanyChips,
  Stat,
  formatMoney,
  parseFlexibleDate,
  MONTH_NAMES,
} from "./finance/FinanceUI";

const formatNumber = formatMoney;
const AIT_THRESHOLD = 43000;

const calculateOTPay = (monthlySalary, otMinutes, totalDaysInMonth) => {
  if (!monthlySalary || !otMinutes || otMinutes <= 0) return 0;

  // Basic salary is 60% of gross salary
  const basicSalary = monthlySalary * 0.6;

  // Input is in minutes where 60 = 60 minutes (1 hour)
  const otHours = otMinutes / 60;

  // OT Pay = (Basic Salary ÷ daysInMonth ÷ 10) × Monthly OT Hours
  const dailyBasicSalary = basicSalary / totalDaysInMonth;
  const hourlyRate = dailyBasicSalary / 10; // Assuming 10-hour work day
  const otPay = hourlyRate * otHours;

  return Number(otPay.toFixed(2));
};

const APPROVAL_STEPS = [
  { key: "hr_prepared", label: "HR" },
  { key: "finance_checked", label: "Finance" },
  { key: "director_checked", label: "Director" },
  { key: "proprietor_approved", label: "MD" },
];

const SalaryFormat = () => {
  const today = new Date();
  const selectedMonth = today.getMonth() + 1;
  const selectedYear = today.getFullYear();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCompanies, setOpenCompanies] = useState({});
  const [manualData, setManualData] = useState({});
  // Approved unpaid leave (leave without pay) per employee_id for the month.
  // Each unpaid day is added to the absent deduction (one day's basic).
  const [unpaidLeave, setUnpaidLeave] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [loadingAit, setLoadingAit] = useState({});
  const [calculatingTaxes, setCalculatingTaxes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();
  const [companyApprovalStatus, setCompanyApprovalStatus] = useState({});
  const [isDataSavedForMonth, setIsDataSavedForMonth] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const grouped = useMemo(() => {
    return filteredEmployees.reduce((acc, emp) => {
      const comp = emp.company_name ?? "Unknown";
      if (!acc[comp]) acc[comp] = [];
      acc[comp].push(emp);
      return acc;
    }, {});
  }, [filteredEmployees]);

  const checkBackendDataExists = async () => {
    try {
      const response = await financeAPI.salary.checkSalaryRecordsExists(
        selectedMonth,
        selectedYear,
      );
      setIsDataSavedForMonth(!!(response.data && response.data.exists));
    } catch (error) {
      console.error("Error checking backend for salary records:", error);
      setIsDataSavedForMonth(false);
    }
  };

  useEffect(() => {
    if (!loading && employees.length > 0) {
      checkBackendDataExists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedMonth, selectedYear, employees.length]);

  // Load initial data immediately
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // 1. Load employees
        const res = await financeAPI.employee.getAll();
        const filtered = res.data.filter((e) => e.salary && e.employee_id);
        setEmployees(filtered);
        setFilteredEmployees(filtered);
        const employeeIds = filtered.map((emp) => emp.employee_id);

        // 2. This month's manual entries (advance, days worked, ...).
        // Nothing typed in this browser yet but the month was already saved?
        // Start from the saved salary records so a re-save keeps them.
        let savedManual = financeAPI.storage.getSalaryManualData(selectedYear, selectedMonth);
        if (!savedManual) {
          savedManual = await loadManualFromSavedRecords();
          if (Object.keys(savedManual).length > 0) {
            financeAPI.storage.setSalaryManualData(savedManual, selectedYear, selectedMonth);
          }
        }
        setManualData(savedManual || {});

        // 3. Tax results
        const loadingMap = {};
        employeeIds.forEach((empId) => {
          loadingMap[empId] = true;
        });
        setLoadingAit(loadingMap);

        await loadTaxResultsImmediately(employeeIds, filtered);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        setNotice({ tone: "danger", text: "Failed to load employees. Please refresh the page." });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    let active = true;
    financeAPI.unpaidLeave
      .getForMonth(selectedYear, selectedMonth)
      .then((res) => active && setUnpaidLeave(res.data || {}))
      .catch((err) => {
        console.error("Failed to load unpaid leave:", err);
        if (active) setUnpaidLeave({});
      });
    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  // Auto-sync on component mount
  useEffect(() => {
    const autoSync = async () => {
      if (employees.length > 0 && Object.keys(taxResults).length === 0) {
        await handleSyncData();
      }
    };
    const timer = setTimeout(autoSync, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length, taxResults]);

  // Manual entries rebuilt from an already-saved month ({} if not saved yet).
  const loadManualFromSavedRecords = async () => {
    try {
      const res = await financeAPI.salaryRecords.getMonthlyDetails(selectedYear, selectedMonth);
      const manual = {};
      (res.data?.companies || []).forEach((company) =>
        (company.records || []).forEach((r) => {
          const empId = (r.employee_id || "").trim();
          if (!empId) return;
          manual[empId] = {
            daysWorked: Number(r.days_worked) || 0,
            advance: Number(r.advance) || 0,
            cashPayment: Number(r.cash_payment) || 0,
            addition: Number(r.addition) || 0,
            otHours: Number(r.ot_hours) || 0,
            otPay: Number(r.ot_pay) || 0,
            remarks: r.remarks || "",
          };
        }),
      );
      return manual;
    } catch {
      return {}; // month not saved yet (the API answers 404)
    }
  };

  const loadTaxResultsImmediately = async (employeeIds, employeeList) => {
    const databaseIds = new Set();
    try {
      // This browser's copy first (fastest)
      const cachedResults = financeAPI.storage.getTaxResultsByEmployee(selectedYear, selectedMonth);
      const initialResults = {};
      Object.keys(cachedResults).forEach((empId) => {
        if (cachedResults[empId] && cachedResults[empId].data) {
          initialResults[empId] = cachedResults[empId].data;
        }
      });
      if (Object.keys(initialResults).length > 0) {
        setTaxResults(initialResults);
      }

      // Then the saved results from the database
      try {
        const savedResponse = await financeAPI.tax.getCalculatedTaxes({
          employee_ids: employeeIds,
        });

        if (savedResponse.data.success && savedResponse.data.results) {
          const databaseResults = {};
          const savedResults = savedResponse.data.results;
          Object.keys(savedResults).forEach((empId) => {
            if (savedResults[empId]?.calculation_data) {
              databaseResults[empId] = savedResults[empId].calculation_data;
              databaseIds.add(empId);
            }
          });

          if (Object.keys(databaseResults).length > 0) {
            setTaxResults((prev) => ({ ...prev, ...databaseResults }));
            Object.keys(databaseResults).forEach((empId) => {
              financeAPI.storage.setTaxResultsByEmployee(
                empId,
                databaseResults[empId],
                selectedYear,
                selectedMonth,
              );
            });
          }
        }
      } catch (dbError) {
        console.warn("Database check failed:", dbError);
      }

      // Calculate missing ones immediately (not saved - see below)
      const missingIds = employeeIds.filter((id) => !initialResults[id] && !databaseIds.has(id));
      const doneMap = {};
      employeeIds.forEach((empId) => {
        if (!missingIds.includes(empId)) doneMap[empId] = false;
      });
      setLoadingAit((prev) => ({ ...prev, ...doneMap }));

      if (missingIds.length > 0) {
        const { sourceTaxOther, bonusOverride: bonusData } =
          await financeAPI.storage.smartSyncData();
        calculateMissingTaxes(employeeList, missingIds, sourceTaxOther, bonusData);
      }
    } catch (error) {
      console.error("Error loading tax results:", error);
      const doneMap = {};
      employeeIds.forEach((empId) => {
        doneMap[empId] = false;
      });
      setLoadingAit((prev) => ({ ...prev, ...doneMap }));
    }
  };

  const calculateMissingTaxes = useCallback(
    async (employeeList, employeeIds, sourceData, bonusData, investmentData = {}, rpfData = {}) => {
      if (!employeeIds.length) return;
      setCalculatingTaxes(true);

      const startMap = {};
      employeeIds.forEach((empId) => {
        startMap[empId] = true;
      });
      setLoadingAit((prev) => ({ ...prev, ...startMap }));

      const batchSize = 10;

      for (let i = 0; i < employeeIds.length; i += batchSize) {
        const batchIds = employeeIds.slice(i, i + batchSize);

        await Promise.all(
          batchIds.map(async (empId) => {
            const emp = employeeList.find((e) => e.employee_id === empId);
            if (!emp) {
              setLoadingAit((prev) => ({ ...prev, [empId]: false }));
              return;
            }

            const monthlySalary = Number(emp.salary) || 0;

            try {
              let taxData;

              if (monthlySalary <= AIT_THRESHOLD) {
                // No tax deduction
                taxData = {
                  tax_calculation: {
                    monthly_tds: 0,
                    calculated_tds: 0,
                    should_deduct_tax: false,
                    actual_deduction: 0,
                    deduction_reason: "Salary ≤ 43,000 - No tax deduction",
                  },
                  salary_breakdown: {
                    bonus: bonusData[empId] || 0,
                    monthly_salary: monthlySalary,
                  },
                };
              } else {
                const response = await financeAPI.tax.calculate({
                  employee_id: empId,
                  gender: emp.gender === "F" ? "Female" : "Male",
                  source_other: sourceData[empId] || 0,
                  bonus: bonusData[empId] || 0,
                  actual_investment: investmentData[empId] || 0,
                  rpf_monthly: rpfData[empId] || 0,
                  monthly_salary: monthlySalary,
                });
                taxData = response.data;
              }

              setTaxResults((prev) => ({ ...prev, [empId]: taxData }));
              setLoadingAit((prev) => ({ ...prev, [empId]: false }));
              financeAPI.storage.setTaxResultsByEmployee(empId, taxData, selectedYear, selectedMonth);

              // Not saved to the database: CalculatedTax holds one row per
              // employee with the Finance Provision inputs (source other,
              // bonus, investment, RPF) and this save would reset them.
              // Finance Provision is the only screen that writes tax rows.
            } catch (err) {
              console.error(`Failed to calculate for ${empId}:`, err);
              setLoadingAit((prev) => ({ ...prev, [empId]: false }));
            }
          }),
        );

        if (i + batchSize < employeeIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setCalculatingTaxes(false);
    },
    [selectedMonth, selectedYear],
  );

  // Approval status of one company for THIS month (read-only here; the
  // approval buttons are on Salary Records).
  const loadApprovalStatus = useCallback(
    async (companyName = "All Companies") => {
      try {
        const response = await financeAPI.approval.getApprovalStatus({
          company_name: companyName,
          month: selectedMonth,
          year: selectedYear,
        });
        setCompanyApprovalStatus((prev) => ({
          ...prev,
          [companyName]: {
            hr_prepared: response.data.hr_prepared || false,
            finance_checked: response.data.finance_checked || false,
            director_checked: response.data.director_checked || false,
            proprietor_approved: response.data.proprietor_approved || false,
          },
        }));
      } catch (error) {
        console.error(`Failed to load approval status for ${companyName}:`, error);
      }
    },
    [selectedMonth, selectedYear],
  );

  // USER DETECTION
  useEffect(() => {
    let detectedUser = "";
    try {
      const username = localStorage.getItem("username");
      if (username) {
        detectedUser = username.toLowerCase().trim();
      } else {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          detectedUser = (parsedData.username || parsedData.user_name || "").toLowerCase().trim();
        }
      }
      if (!detectedUser) {
        for (const key of ["user", "user_name", "employee_name", "name", "email"]) {
          const value = localStorage.getItem(key);
          if (value) {
            detectedUser = value.toLowerCase().trim();
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error detecting user:", error);
    }
    setCurrentUser(detectedUser);
  }, []);

  // Filter employees based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            emp.name?.toLowerCase().includes(term) ||
            emp.employee_id?.toLowerCase().includes(term),
        ),
      );
    }
  }, [searchTerm, employees]);

  // Load approval status for all companies
  useEffect(() => {
    if (currentUser && employees.length > 0) {
      const uniqueCompanies = [...new Set(employees.map((emp) => emp.company_name ?? "Unknown"))];
      uniqueCompanies.forEach((companyName) => loadApprovalStatus(companyName));
    }
  }, [currentUser, employees.length, loadApprovalStatus]);

  // AIT for one employee: 0 at or below the threshold, otherwise the
  // backend's deduction.
  const getAitValue = useCallback(
    (empId, monthlySalary) => {
      if (loadingAit[empId]) {
        return { ait: 0, calculatedAit: 0, shouldDeduct: false, loading: true };
      }

      const result = taxResults[empId];
      if (!result) {
        return {
          ait: 0,
          calculatedAit: 0,
          shouldDeduct: false,
          loading: false,
          deductionReason: "No tax data found",
        };
      }

      const taxCalc = result.tax_calculation || {};

      let calculatedAit = 0;
      if (taxCalc.monthly_tds !== undefined) {
        calculatedAit = parseFloat(taxCalc.monthly_tds) || 0;
      } else if (taxCalc.calculated_tds !== undefined) {
        calculatedAit = parseFloat(taxCalc.calculated_tds) || 0;
      } else if (taxCalc.net_tax_payable !== undefined) {
        calculatedAit = parseFloat(taxCalc.net_tax_payable) || 0;
      }

      let shouldDeduct = false;
      if (monthlySalary <= AIT_THRESHOLD) {
        shouldDeduct = false;
      } else if (taxCalc.should_deduct_tax !== undefined) {
        shouldDeduct = taxCalc.should_deduct_tax === true;
      } else if (calculatedAit > 0) {
        shouldDeduct = true;
      }

      const ait = shouldDeduct ? parseFloat(taxCalc.actual_deduction) || calculatedAit || 0 : 0;

      return {
        ait,
        calculatedAit,
        shouldDeduct,
        loading: false,
        deductionReason:
          taxCalc.deduction_reason ||
          (shouldDeduct
            ? `Salary above 43,000 (${formatNumber(monthlySalary)})`
            : monthlySalary <= AIT_THRESHOLD
              ? `Salary at or below 43,000 threshold (${formatNumber(monthlySalary)})`
              : "No tax calculated"),
      };
    },
    [taxResults, loadingAit],
  );

  const handleSyncData = async () => {
    try {
      setCalculatingTaxes(true);
      const startMap = {};
      employees.forEach((emp) => {
        startMap[emp.employee_id] = true;
      });
      setLoadingAit((prev) => ({ ...prev, ...startMap }));

      const employeeIds = employees.map((emp) => emp.employee_id);
      const savedResponse = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: employeeIds,
      });

      if (savedResponse.data.success && savedResponse.data.results) {
        const databaseResults = {};
        const savedResults = savedResponse.data.results;
        Object.keys(savedResults).forEach((empId) => {
          if (savedResults[empId]?.calculation_data) {
            databaseResults[empId] = savedResults[empId].calculation_data;
          }
        });
        setTaxResults(databaseResults);

        const doneMap = {};
        employeeIds.forEach((empId) => {
          doneMap[empId] = false;
        });
        setLoadingAit((prev) => ({ ...prev, ...doneMap }));

        // Employees without a saved result are calculated for display.
        const missing = employeeIds.filter((id) => !databaseResults[id]);
        if (missing.length > 0) {
          const { sourceTaxOther, bonusOverride: bonusData } =
            await financeAPI.storage.smartSyncData();
          await calculateMissingTaxes(employees, missing, sourceTaxOther, bonusData);
        }
      } else {
        const { sourceTaxOther, bonusOverride: bonusData } =
          await financeAPI.storage.smartSyncData();
        await calculateMissingTaxes(employees, employeeIds, sourceTaxOther, bonusData);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setNotice({ tone: "danger", text: "Tax sync failed. Please try again." });
    } finally {
      setCalculatingTaxes(false);
    }
  };

  const getManual = (empId, field, defaultVal = 0) => {
    return manualData[empId]?.[field] ?? defaultVal;
  };

  const getUnpaidLeaveDays = (empId) => unpaidLeave[(empId || "").trim()]?.unpaid_days || 0;

  const unpaidLeaveRemark = (empId) => {
    const days = getUnpaidLeaveDays(empId);
    return days ? `Unpaid leave: ${days} day(s)` : "";
  };

  // THE salary calculation for one employee, used by the rows on screen, the
  // company summary, the grand totals AND the saved payload, so what you see
  // is exactly what gets saved and paid. Unpaid leave days are added to the
  // absent days: one day's basic (basic / 30) each.
  const round2 = (n) => Number((Number(n) || 0).toFixed(2));
  const computeSalary = (emp) => {
    const empId = (emp.employee_id || "").trim();
    const monthlySalary = Number(emp.salary) || 0;
    const salaryCash = Number(emp.salary_cash) || 0;

    const basicFull = round2(monthlySalary * 0.6);
    const houseRentFull = round2(monthlySalary * 0.3);
    const medicalFull = round2(monthlySalary * 0.05);
    const conveyanceFull = round2(monthlySalary * 0.05);
    const grossFull = round2(monthlySalary);

    const aitInfo = getAitValue(empId, monthlySalary);
    const ait = Number(aitInfo.ait) || 0;

    const daysWorkedManual = Number(getManual(empId, "daysWorked")) || 0;
    const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
    const addition = Number(getManual(empId, "addition")) || 0; // includes OT pay
    const advance = Number(getManual(empId, "advance")) || 0;

    // New joiner this month: default days worked = from the joining date.
    const doj = parseFlexibleDate(emp.joining_date);
    const isNewJoiner =
      doj && doj.getMonth() + 1 === selectedMonth && doj.getFullYear() === selectedYear;
    const defaultDays = isNewJoiner ? totalDaysInMonth - doj.getDate() + 1 : totalDaysInMonth;
    const daysWorked = daysWorkedManual > 0 ? daysWorkedManual : defaultDays;
    const unpaidLeaveDays = getUnpaidLeaveDays(empId);
    const absentDays = Math.max(0, totalDaysInMonth - daysWorked) + unpaidLeaveDays;

    const dailyBasic = round2(basicFull / 30);
    const absentDeduction = round2(dailyBasic * absentDays);
    const totalDeduction = round2(ait + advance + absentDeduction);
    const netPayBank = round2(
      (monthlySalary / totalDaysInMonth) * daysWorked - cashPayment - totalDeduction + addition,
    );
    const totalPayable = round2(netPayBank + cashPayment + ait + salaryCash);

    return {
      empId,
      monthlySalary,
      salaryCash,
      basicFull,
      houseRentFull,
      medicalFull,
      conveyanceFull,
      grossFull,
      ait,
      calculatedAit: aitInfo.calculatedAit || 0,
      shouldDeduct: aitInfo.shouldDeduct,
      aitLoading: aitInfo.loading,
      daysWorkedManual,
      defaultDays,
      isNewJoiner,
      daysWorked,
      unpaidLeaveDays,
      absentDays,
      absentDeduction,
      advance,
      cashPayment,
      addition,
      totalDeduction,
      netPayBank,
      totalPayable,
    };
  };

  // Save the sheet. Always ALL employees - a search filter only changes what
  // is shown, never what is saved (it used to save just the matching rows,
  // after which the month was locked with everyone else missing).
  const saveData = async () => {
    if (isDataSavedForMonth) {
      const confirmResave = window.confirm(
        `Salary data for ${monthLabel} has already been saved. Do you want to save again?`,
      );
      if (!confirmResave) return;
    }

    const stillCalculating = employees.some((emp) => loadingAit[emp.employee_id]);
    if (
      stillCalculating &&
      !window.confirm("Some AIT values are still being calculated. Save anyway?")
    ) {
      return;
    }

    const payload = employees
      .map((emp, idx) => {
        const empId = emp.employee_id?.trim();
        if (!empId) return null;

        const {
          monthlySalary,
          salaryCash,
          basicFull,
          houseRentFull,
          medicalFull,
          conveyanceFull,
          grossFull,
          ait,
          daysWorked,
          absentDays,
          absentDeduction,
          advance,
          cashPayment,
          addition,
          totalDeduction,
          netPayBank,
          totalPayable,
        } = computeSalary(emp);
        const otHours = Number(getManual(empId, "otHours")) || 0;
        const otPay = calculateOTPay(monthlySalary, otHours, totalDaysInMonth);
        const remarks = getManual(empId, "remarks", "") || "";

        // DOJ as YYYY-MM-DD (null if it cannot be read)
        const dojDate = parseFlexibleDate(emp.joining_date);
        const dojStr = dojDate
          ? `${dojDate.getFullYear()}-${String(dojDate.getMonth() + 1).padStart(2, "0")}-${String(
              dojDate.getDate(),
            ).padStart(2, "0")}`
          : null;

        return {
          sl: idx + 1,
          name: emp.name?.trim() || "Unknown",
          employee_id: empId,
          designation: emp.designation?.trim() || "",
          doj: dojStr,
          basic: basicFull,
          house_rent: houseRentFull,
          medical: medicalFull,
          conveyance: conveyanceFull,
          gross_salary: grossFull,
          total_days: totalDaysInMonth,
          days_worked: daysWorked,
          absent_days: absentDays,
          absent_ded: absentDeduction,
          advance: advance,
          ait: ait,
          total_ded: totalDeduction,
          ot_hours: otHours,
          ot_pay: otPay,
          addition: addition,
          cash_payment: cashPayment,
          cash_salary: salaryCash,
          net_pay_bank: netPayBank,
          total_payable: totalPayable,
          remarks:
            unpaidLeaveRemark(empId) && !remarks.includes("Unpaid leave")
              ? [unpaidLeaveRemark(empId), remarks].filter(Boolean).join("; ")
              : remarks,
          bank_account: emp.bank_account?.trim() || "",
          branch_name: emp.branch_name?.trim() || "",
          company_name: emp.company_name || "Unknown",
        };
      })
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await financeAPI.salary.saveSalary(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (saved > 0) await checkBackendDataExists();

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        setNotice({
          tone: "warning",
          text: `Saved ${saved} rows, but ${errors.length} failed. Check the browser console for details.`,
        });
      } else {
        setNotice({ tone: "success", text: `All ${saved} rows saved for ${monthLabel}.` });
      }
    } catch (e) {
      setIsDataSavedForMonth(false);
      console.error("Save failed:", e.response?.data || e);
      setNotice({ tone: "danger", text: "Save failed. Nothing was saved — please try again." });
    } finally {
      setSaving(false);
    }
  };

  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => {
      const newState = { ...prev, [comp]: !prev[comp] };
      setShowSummary(!Object.values(newState).some((v) => v));
      return newState;
    });
  };

  const showAllCompanies = () => {
    const allOpen = {};
    Object.keys(grouped).forEach((comp) => {
      allOpen[comp] = true;
    });
    setOpenCompanies(allOpen);
    setShowSummary(false);
  };

  const hideAllCompanies = () => {
    setOpenCompanies({});
    setShowSummary(true);
  };

  const updateManual = (empId, field, value) => {
    const parsed = field === "remarks" ? value : parseFloat(value) || 0;

    const newData = {
      ...manualData,
      [empId]: {
        ...manualData[empId],
        [field]: parsed,
      },
    };

    // OT minutes changed: replace the old OT pay inside Addition with the new one
    if (field === "otHours" && employees.length > 0) {
      const emp = employees.find((e) => e.employee_id === empId);
      if (emp) {
        const monthlySalary = Number(emp.salary) || 0;
        const otPay = calculateOTPay(monthlySalary, parsed, totalDaysInMonth);
        const existingAddition = newData[empId]?.addition || 0;
        const existingOtPay = newData[empId]?.otPay || 0;
        newData[empId] = {
          ...newData[empId],
          addition: existingAddition - existingOtPay + otPay,
          otPay: otPay,
        };
      }
    }

    setManualData(newData);
    financeAPI.storage.setSalaryManualData(newData, selectedYear, selectedMonth);
  };

  // Totals over a list of employees, all from computeSalary().
  const sumUp = (list) =>
    list.reduce(
      (acc, e) => {
        const c = computeSalary(e);
        acc.gross += c.monthlySalary;
        acc.ait += c.ait;
        acc.calculatedAit += c.calculatedAit;
        acc.absentDed += c.absentDeduction;
        acc.advance += c.advance;
        acc.cash += c.cashPayment;
        acc.cashSalary += c.salaryCash;
        acc.addition += c.addition;
        acc.netBank += c.netPayBank;
        acc.totalPay += c.totalPayable;
        acc.totalDed += c.totalDeduction;
        if (c.monthlySalary > AIT_THRESHOLD) acc.aboveThreshold += 1;
        return acc;
      },
      {
        gross: 0,
        ait: 0,
        calculatedAit: 0,
        absentDed: 0,
        advance: 0,
        cash: 0,
        cashSalary: 0,
        addition: 0,
        netBank: 0,
        totalPay: 0,
        totalDed: 0,
        aboveThreshold: 0,
      },
    );

  if (loading) {
    return (
      <FinanceShell>
        <LoadingState page title="Loading salary sheet…" text="Fetching employees and tax calculations" />
      </FinanceShell>
    );
  }

  const grand = sumUp(filteredEmployees);
  const companyNames = Object.keys(grouped);

  const approvalBadges = (comp) => {
    const status = companyApprovalStatus[comp];
    if (!status) return null;
    return (
      <span className="fin-row" style={{ gap: 4 }}>
        {APPROVAL_STEPS.map((step) => (
          <Badge
            key={step.key}
            tone={status[step.key] ? "success" : undefined}
            title={status[step.key] ? `${step.label} done` : `${step.label} pending`}
          >
            {status[step.key] && <FaCheckCircle />}
            {step.label}
          </Badge>
        ))}
      </span>
    );
  };

  return (
    <FinanceShell
      title="Salary Sheet"
      icon={<FaFileInvoiceDollar />}
      meta={
        <>
          <Badge tone="primary" className="fin-badge--lg">
            {monthLabel}
          </Badge>
          {isDataSavedForMonth && (
            <Badge tone="success" className="fin-badge--lg">
              <FaCheckCircle /> Saved
            </Badge>
          )}
        </>
      }
      subtitle="Enter days worked, advance, OT and cash payments, then save the month. Everything below is saved exactly as shown."
      actions={
        <>
          <button className="fin-btn" onClick={handleSyncData} disabled={calculatingTaxes}>
            <FaSync className={calculatingTaxes ? "fin-spin" : ""} /> Sync Tax
          </button>
          <button onClick={() => navigate("/bonus-format")} className="fin-btn">
            <FaGift /> Bonus Sheet
          </button>
          <button onClick={() => navigate("/salary-records")} className="fin-btn">
            <FaHistory /> View Records
          </button>
          <button
            className="fin-btn fin-btn--primary"
            onClick={saveData}
            disabled={isDataSavedForMonth || saving}
            title={
              isDataSavedForMonth
                ? `Data already saved for ${monthLabel}. Edit it on Salary Records.`
                : "Save salary data for all employees"
            }
          >
            {isDataSavedForMonth ? <FaCheckCircle /> : <FaSave />}
            {saving ? "Saving…" : isDataSavedForMonth ? "Saved" : "Save Data"}
          </button>
        </>
      }
    >
      <div className="fin-stack">
        {notice && (
          <Alert
            tone={notice.tone}
            action={
              <button className="fin-btn fin-btn--ghost fin-btn--sm" onClick={() => setNotice(null)}>
                ×
              </button>
            }
          >
            {notice.text}
          </Alert>
        )}

        {calculatingTaxes && (
          <Alert tone="info">
            <span className="fin-row">
              <span className="fin-spinner fin-spinner--sm" /> Calculating taxes… please wait before
              saving.
            </span>
          </Alert>
        )}

        <div className="fin-kpis">
          <Kpi
            tone="primary"
            icon={<FaUsers />}
            label="Employees"
            value={filteredEmployees.length}
            hint={`${grand.aboveThreshold} with salary above 43K`}
          />
          <Kpi
            icon={<FaMoneyBillWave />}
            label="Gross salary"
            value={formatNumber(grand.gross)}
            hint={`${companyNames.length} companies`}
          />
          <Kpi
            tone="warning"
            icon={<FaCalculator />}
            label="AIT deducted"
            value={formatNumber(grand.ait)}
            hint={`Tax calculated for ${Object.keys(taxResults).length}`}
          />
          <Kpi
            tone="success"
            icon={<FaUniversity />}
            label="Net pay (bank)"
            value={formatNumber(grand.netBank)}
            hint={`Total payable ${formatNumber(grand.totalPay)}`}
          />
        </div>

        <Card
          title={
            <>
              <FaBuilding /> Companies
            </>
          }
          subtitle="Open a company to view and edit its sheet."
          actions={
            <>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search employees by name or ID…"
              />
              <button onClick={showAllCompanies} className="fin-btn fin-btn--sm">
                <FaEye /> Show all
              </button>
              <button onClick={hideAllCompanies} className="fin-btn fin-btn--sm">
                <FaEyeSlash /> Hide all
              </button>
            </>
          }
        >
          {companyNames.length ? (
            <CompanyChips
              companies={companyNames.map((name) => ({ name, count: grouped[name].length }))}
              open={openCompanies}
              onToggle={toggleCompany}
            />
          ) : (
            <EmptyState title="No employees match your search" />
          )}
        </Card>

        {companyNames.map((comp) => {
          const emps = grouped[comp];
          if (!openCompanies[comp]) return null;
          const totals = sumUp(emps);

          return (
            <Card
              key={comp}
              flush
              title={
                <>
                  {comp}
                  {approvalBadges(comp)}
                </>
              }
              subtitle={`Salary sheet for ${monthLabel} · ${emps.length} employees`}
              actions={
                <button className="fin-btn fin-btn--sm fin-btn--ghost" onClick={() => toggleCompany(comp)}>
                  Close
                </button>
              }
              footer={
                <div className="fin-stats">
                  <Stat label="Employees" value={emps.length} />
                  <Stat label="Salary > 43K" value={totals.aboveThreshold} />
                  <Stat label="Salary ≤ 43K" value={emps.length - totals.aboveThreshold} />
                  <Stat label="Calculated tax" value={formatNumber(totals.calculatedAit)} />
                  <Stat label="Deducted tax" value={formatNumber(totals.ait)} />
                  <Stat label="Net pay (bank)" value={formatNumber(totals.netBank)} highlight />
                  <Stat label="Total payable" value={formatNumber(totals.totalPay)} highlight />
                </div>
              }
            >
              <div className="fin-table-wrap">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th className="fin-sticky" style={{ left: 0, minWidth: 48 }}>SL</th>
                      <th className="fin-sticky fin-sticky-edge" style={{ left: 48 }}>Name</th>
                      <th>ID</th>
                      <th>Designation</th>
                      <th>DOJ</th>
                      <th className="num">Basic</th>
                      <th className="num">House Rent</th>
                      <th className="num">Medical</th>
                      <th className="num">Conveyance</th>
                      <th className="num">Gross Salary</th>
                      <th className="num">Total Days</th>
                      <th className="num">Days Worked</th>
                      <th className="num">Absent Days</th>
                      <th className="num">Absent Ded.</th>
                      <th className="num">Advance</th>
                      <th className="num">AIT</th>
                      <th className="num">Total Ded.</th>
                      <th className="num">OT Min</th>
                      <th className="num">OT Pay</th>
                      <th className="num">Addition</th>
                      <th className="num">Cash Payment</th>
                      <th className="num">Cash Salary</th>
                      <th className="num">Net Pay (Bank)</th>
                      <th className="num">Total Payable</th>
                      <th>Bank Account</th>
                      <th>Branch Code</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emps.map((emp, idx) => {
                      const empId = emp.employee_id;
                      const c = computeSalary(emp);
                      const remarks = getManual(empId, "remarks", "");

                      return (
                        <tr key={empId}>
                          <td className="fin-sticky muted" style={{ left: 0, minWidth: 48 }}>
                            {idx + 1}
                          </td>
                          <td className="fin-sticky fin-sticky-edge fin-col-name" style={{ left: 48 }}>
                            {emp.name}
                          </td>
                          <td className="fin-col-id">{empId}</td>
                          <td className="muted">{emp.designation}</td>
                          <td className="muted">
                            {emp.joining_date}
                            {c.isNewJoiner && (
                              <div className="fin-cell-note fin-cell-note--success">New joiner</div>
                            )}
                          </td>
                          <td className="num">{formatNumber(c.basicFull)}</td>
                          <td className="num">{formatNumber(c.houseRentFull)}</td>
                          <td className="num">{formatNumber(c.medicalFull)}</td>
                          <td className="num">{formatNumber(c.conveyanceFull)}</td>
                          <td className="num strong">{formatNumber(c.grossFull)}</td>
                          <td className="num muted">{totalDaysInMonth}</td>
                          <td className="num">
                            <input
                              type="number"
                              value={c.daysWorkedManual > 0 ? c.daysWorkedManual : ""}
                              placeholder={c.defaultDays}
                              onChange={(e) => updateManual(empId, "daysWorked", e.target.value)}
                              className="fin-cell-input fin-cell-input--sm"
                              min="0"
                              max={totalDaysInMonth}
                              aria-label={`Days worked, ${emp.name}`}
                            />
                          </td>
                          <td
                            className="num"
                            title={
                              c.unpaidLeaveDays
                                ? `Includes ${c.unpaidLeaveDays} unpaid leave day(s) — one day's basic each`
                                : undefined
                            }
                          >
                            <div className="fin-cell-stack">
                              <span>{c.absentDays}</span>
                              {c.unpaidLeaveDays > 0 && (
                                <span className="fin-cell-note fin-cell-note--danger">
                                  incl. {c.unpaidLeaveDays} unpaid leave
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`num ${c.absentDeduction ? "text-neg" : "muted"}`}>
                            {formatNumber(c.absentDeduction)}
                          </td>
                          <td className="num">
                            <input
                              type="number"
                              value={c.advance !== 0 ? c.advance : ""}
                              placeholder="0"
                              onChange={(e) => updateManual(empId, "advance", e.target.value)}
                              className="fin-cell-input"
                              aria-label={`Advance, ${emp.name}`}
                            />
                          </td>
                          <td className="num" title={getAitValue(empId, c.monthlySalary).deductionReason}>
                            {c.aitLoading ? (
                              <span className="fin-row" style={{ justifyContent: "flex-end" }}>
                                <span className="fin-spinner fin-spinner--sm" />
                                <span className="fin-cell-note">Calculating…</span>
                              </span>
                            ) : (
                              <div className="fin-cell-stack">
                                <span className={c.ait ? "strong" : "muted"}>{formatNumber(c.ait)}</span>
                                {c.calculatedAit > 0 && !c.shouldDeduct && (
                                  <span className="fin-cell-note">
                                    Calc {formatNumber(c.calculatedAit)} · not deducted
                                  </span>
                                )}
                                {c.shouldDeduct && c.calculatedAit > 0 && (
                                  <span className="fin-cell-note fin-cell-note--success">Deducted</span>
                                )}
                                {!c.calculatedAit && !c.shouldDeduct && c.monthlySalary > 0 && (
                                  <span className="fin-cell-note">No tax</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="num text-neg">{formatNumber(c.totalDeduction)}</td>
                          <td className="num">
                            <input
                              type="number"
                              value={getManual(empId, "otHours") || ""}
                              placeholder="Min"
                              onChange={(e) => updateManual(empId, "otHours", e.target.value)}
                              className="fin-cell-input fin-cell-input--sm"
                              min="0"
                              step="1"
                              title="Enter OT in minutes (60 = 1 hour, 120 = 2 hours)"
                              aria-label={`OT minutes, ${emp.name}`}
                            />
                          </td>
                          <td className="num">
                            {formatNumber(
                              calculateOTPay(c.monthlySalary, getManual(empId, "otHours") || 0, totalDaysInMonth),
                            )}
                          </td>
                          <td className="num">
                            <input
                              type="number"
                              value={c.addition !== 0 ? c.addition : ""}
                              placeholder="0"
                              onChange={(e) => updateManual(empId, "addition", e.target.value)}
                              className="fin-cell-input"
                              title="Includes OT pay"
                              aria-label={`Addition, ${emp.name}`}
                            />
                          </td>
                          <td className="num">
                            <input
                              type="number"
                              value={c.cashPayment !== 0 ? c.cashPayment : ""}
                              placeholder="0"
                              onChange={(e) => updateManual(empId, "cashPayment", e.target.value)}
                              className="fin-cell-input"
                              aria-label={`Cash payment, ${emp.name}`}
                            />
                          </td>
                          <td className="num">{formatNumber(c.salaryCash)}</td>
                          <td className={`num strong ${c.netPayBank < 0 ? "text-neg" : "text-pos"}`}>
                            {formatNumber(c.netPayBank)}
                          </td>
                          <td className="num strong">{formatNumber(c.totalPayable)}</td>
                          <td className="fin-col-id">{emp.bank_account || "N/A"}</td>
                          <td className="muted">{emp.branch_name || "N/A"}</td>
                          <td>
                            <input
                              type="text"
                              value={remarks}
                              placeholder={unpaidLeaveRemark(empId) || "Remarks"}
                              onChange={(e) => updateManual(empId, "remarks", e.target.value)}
                              className="fin-cell-input fin-cell-input--text"
                              aria-label={`Remarks, ${emp.name}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="fin-sticky" style={{ left: 0, minWidth: 48 }} />
                      <td className="fin-sticky fin-sticky-edge" style={{ left: 48 }}>
                        Total ({emps.length})
                      </td>
                      <td colSpan={7} />
                      <td className="num">{formatNumber(totals.gross)}</td>
                      <td colSpan={3} />
                      <td className="num">{formatNumber(totals.absentDed)}</td>
                      <td className="num">{formatNumber(totals.advance)}</td>
                      <td className="num">{formatNumber(totals.ait)}</td>
                      <td className="num">{formatNumber(totals.totalDed)}</td>
                      <td colSpan={2} />
                      <td className="num">{formatNumber(totals.addition)}</td>
                      <td className="num">{formatNumber(totals.cash)}</td>
                      <td className="num">{formatNumber(totals.cashSalary)}</td>
                      <td className="num">{formatNumber(totals.netBank)}</td>
                      <td className="num">{formatNumber(totals.totalPay)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          );
        })}

        {showSummary && filteredEmployees.length > 0 && (
          <Card
            flush
            title={
              <>
                <FaUsers /> Summary by company
              </>
            }
            subtitle={`All companies · ${monthLabel}`}
          >
            <div className="fin-table-wrap fin-table-wrap--auto">
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Company</th>
                    <th className="num">Employees</th>
                    <th className="num">Gross Salary</th>
                    <th className="num">AIT (Deducted)</th>
                    <th className="num">Net Pay (Bank)</th>
                    <th className="num">Total Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {companyNames.map((comp, i) => {
                    const summary = sumUp(grouped[comp]);
                    return (
                      <tr
                        key={comp}
                        className="fin-row-clickable"
                        onClick={() => toggleCompany(comp)}
                        title="Open this company's sheet"
                      >
                        <td className="muted">{i + 1}</td>
                        <td className="fin-col-name">{comp}</td>
                        <td className="num">{grouped[comp].length}</td>
                        <td className="num">{formatNumber(summary.gross)}</td>
                        <td className="num">
                          <div className="fin-cell-stack">
                            <span>{formatNumber(summary.ait)}</span>
                            {summary.calculatedAit > summary.ait && (
                              <span className="fin-cell-note">Calc {formatNumber(summary.calculatedAit)}</span>
                            )}
                          </div>
                        </td>
                        <td className={`num strong ${summary.netBank < 0 ? "text-neg" : ""}`}>
                          {formatNumber(summary.netBank)}
                        </td>
                        <td className="num strong">{formatNumber(summary.totalPay)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Grand Total</td>
                    <td className="num">{filteredEmployees.length}</td>
                    <td className="num">{formatNumber(grand.gross)}</td>
                    <td className="num">
                      <div className="fin-cell-stack">
                        <span>{formatNumber(grand.ait)}</span>
                        <span className="fin-cell-note">Calc {formatNumber(grand.calculatedAit)}</span>
                      </div>
                    </td>
                    <td className={`num ${grand.netBank < 0 ? "text-neg" : ""}`}>
                      {formatNumber(grand.netBank)}
                    </td>
                    <td className="num">{formatNumber(grand.totalPay)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </div>
    </FinanceShell>
  );
};

export default SalaryFormat;
