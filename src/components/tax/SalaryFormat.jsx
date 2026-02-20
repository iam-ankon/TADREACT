// src/pages/finance/SalaryFormat.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaSave,
  FaFileExport,
  FaBuilding,
  FaUsers,
  FaCheckCircle,
  FaCalendarAlt,
  FaFileDownload,
  FaFileExcel,
  FaCalculator,
  FaSync,
} from "react-icons/fa";

// FIXED: Import the complete finance API
import { financeAPI } from "../../api/finance";

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "৳0";
  const abs = Math.abs(num);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

const calculateOTPay = (monthlySalary, otMinutes, totalDaysInMonth) => {
  if (!monthlySalary || !otMinutes || otMinutes <= 0) return 0;

  // Basic salary is 60% of gross salary
  const basicSalary = monthlySalary * 0.6;

  // Input is in minutes where 60 = 60 minutes (1 hour)
  // Convert minutes to hours for calculation
  const otHours = otMinutes / 60;

  // OT Pay = (Basic Salary ÷ daysInMonth ÷ 10) × Monthly OT Hours
  const dailyBasicSalary = basicSalary / totalDaysInMonth;
  const hourlyRate = dailyBasicSalary / 10; // Assuming 10-hour work day
  const otPay = hourlyRate * otHours;

  return Number(otPay.toFixed(2));
};

const SalaryFormat = () => {
  // MOVE THESE TO THE TOP - before any functions that use them
  const today = new Date();
  const selectedMonth = today.getMonth() + 1;
  const selectedYear = today.getFullYear();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const BASE_MONTH = new Date(selectedYear, selectedMonth, 0).getDate();

  // Now declare all your state variables
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const [bonusOverride, setBonusOverride] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCompanies, setOpenCompanies] = useState({});
  const [manualData, setManualData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [loadingAit, setLoadingAit] = useState({});
  const [calculatingTaxes, setCalculatingTaxes] = useState(false);
  const navigate = useNavigate();
  const [companyApprovalStatus, setCompanyApprovalStatus] = useState({});

  // Add the new state for save lock
  const [isDataSavedForMonth, setIsDataSavedForMonth] = useState(false);

  // BACKEND-BASED APPROVAL STATUS
  const [approvalStatus, setApprovalStatus] = useState({
    hr_prepared: false,
    finance_checked: false,
    director_checked: false,
    proprietor_approved: false,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentUser, setCurrentUser] = useState("");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // FIXED: Use useMemo for grouped data
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
      console.log(
        `🔍 Checking backend for salary records: ${monthNames[selectedMonth - 1]} ${selectedYear}`,
      );

      // Call backend API to check if records exist
      const response = await financeAPI.salary.checkSalaryRecordsExists(
        selectedMonth,
        selectedYear,
      );

      if (response.data && response.data.exists) {
        console.log(
          `✅ Found ${response.data.count} salary records in backend`,
        );
        setIsDataSavedForMonth(true);
      } else {
        console.log(`❌ No salary records found in backend for this month`);
        setIsDataSavedForMonth(false);
      }
    } catch (error) {
      console.error("Error checking backend for salary records:", error);
      // Fallback to false on error
      setIsDataSavedForMonth(false);
    }
  };

  // Replace the old localStorage check with backend check
  useEffect(() => {
    const checkDataExists = async () => {
      if (!loading && filteredEmployees.length > 0) {
        await checkBackendDataExists();
      }
    };

    checkDataExists();
  }, [loading, selectedMonth, selectedYear, filteredEmployees.length]);

  // FIXED: Load initial data immediately
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        console.log("📊 Loading initial data for Salary Format...");

        // 1. Load employees
        const res = await financeAPI.employee.getAll();
        const filtered = res.data.filter((e) => e.salary && e.employee_id);
        setEmployees(filtered);
        setFilteredEmployees(filtered);

        const employeeIds = filtered.map((emp) => emp.employee_id);
        console.log(`✅ Loaded ${filtered.length} employees`);

        // 2. Load source other and bonus from backend
        const { sourceTaxOther, bonusOverride: bonusData } =
          await financeAPI.storage.smartSyncData(employeeIds);
        setSourceOther(sourceTaxOther);
        setBonusOverride(bonusData);

        // 3. Load manual data
        const savedManual = financeAPI.storage.getSalaryManualData();
        if (savedManual) setManualData(savedManual);

        // 4. CRITICAL: Load tax results IMMEDIATELY (like other screens do)
        // Set initial loading states
        employeeIds.forEach((empId) => {
          setLoadingAit((prev) => ({ ...prev, [empId]: true }));
        });

        await loadTaxResultsImmediately(employeeIds, filtered);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedMonth, selectedYear]);

  // Auto-sync on component mount
  useEffect(() => {
    const autoSync = async () => {
      if (employees.length > 0 && Object.keys(taxResults).length === 0) {
        console.log("🔄 Auto-syncing tax data...");
        await handleSyncData();
      }
    };

    // Wait 2 seconds then auto-sync
    const timer = setTimeout(autoSync, 2000);
    return () => clearTimeout(timer);
  }, [employees.length, taxResults]);

  // Add this function after the useEffect
  const loadTaxResultsImmediately = async (employeeIds, employeeList) => {
    console.log("🚀 Loading tax results immediately...");

    try {
      // First check localStorage cache (fastest)
      const cachedResults = financeAPI.storage.getTaxResultsByEmployee();
      const initialResults = {};

      // Use cached results if available
      Object.keys(cachedResults).forEach((empId) => {
        if (cachedResults[empId] && cachedResults[empId].data) {
          initialResults[empId] = cachedResults[empId].data;
        }
      });

      console.log(
        `📁 Found ${Object.keys(initialResults).length} cached results`,
      );

      // Set tax results immediately from cache
      if (Object.keys(initialResults).length > 0) {
        setTaxResults(initialResults);
      }

      // Also check database in foreground for critical data
      try {
        const savedResponse = await financeAPI.tax.getCalculatedTaxes({
          employee_ids: employeeIds,
          month: selectedMonth,
          year: selectedYear,
        });

        if (savedResponse.data.success && savedResponse.data.results) {
          const databaseResults = {};
          const savedResults = savedResponse.data.results;

          Object.keys(savedResults).forEach((empId) => {
            if (savedResults[empId]?.calculation_data) {
              databaseResults[empId] = savedResults[empId].calculation_data;
            }
          });

          if (Object.keys(databaseResults).length > 0) {
            console.log(
              `💾 Found ${
                Object.keys(databaseResults).length
              } tax calculations in database`,
            );

            // Update with database results
            setTaxResults((prev) => ({
              ...prev,
              ...databaseResults,
            }));

            // Save to cache
            Object.keys(databaseResults).forEach((empId) => {
              financeAPI.storage.setTaxResultsByEmployee(
                empId,
                databaseResults[empId],
              );
            });
          }
        }
      } catch (dbError) {
        console.warn("Database check failed:", dbError);
      }

      // Calculate missing ones immediately (not in background)
      const missingIds = employeeIds.filter(
        (id) => !initialResults[id] && !taxResults[id],
      );
      if (missingIds.length > 0) {
        console.log(
          `🧮 Calculating taxes for ${missingIds.length} employees immediately...`,
        );

        // Get source and bonus data
        const { sourceTaxOther, bonusOverride: bonusData } =
          await financeAPI.storage.getSourceTaxOther();

        // Start calculation immediately
        calculateMissingTaxes(
          employeeList,
          missingIds,
          sourceTaxOther,
          bonusData,
        );
      } else {
        // Clear all loading states if no calculations needed
        employeeIds.forEach((empId) => {
          setLoadingAit((prev) => ({ ...prev, [empId]: false }));
        });
      }
    } catch (error) {
      console.error("Error loading tax results:", error);
      // Clear loading states on error
      employeeIds.forEach((empId) => {
        setLoadingAit((prev) => ({ ...prev, [empId]: false }));
      });
    }
  };

  const calculateMissingTaxes = useCallback(
    async (employeeList, employeeIds, sourceData, bonusData) => {
      if (!employeeIds.length) return;

      console.log(
        `🧮 Calculating taxes for ${employeeIds.length} employees...`,
      );
      setCalculatingTaxes(true);

      const newResults = { ...taxResults };

      // Set loading states for each employee
      employeeIds.forEach((empId) => {
        setLoadingAit((prev) => ({ ...prev, [empId]: true }));
      });

      const batchSize = 10; // Increased batch size for faster calculation

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

              if (monthlySalary <= 41000) {
                // No tax deduction
                taxData = {
                  tax_calculation: {
                    monthly_tds: 0,
                    calculated_tds: 0,
                    should_deduct_tax: false,
                    actual_deduction: 0,
                    deduction_reason: "Salary ≤ 41,000 - No tax deduction",
                  },
                  salary_breakdown: {
                    bonus: bonusData[empId] || 0,
                    monthly_salary: monthlySalary,
                  },
                };
              } else {
                // Calculate tax
                const response = await financeAPI.tax.calculate({
                  employee_id: empId,
                  gender: emp.gender === "M" ? "Male" : "Female",
                  source_other: sourceData[empId] || 0,
                  bonus: bonusData[empId] || 0,
                  monthly_salary: monthlySalary,
                });

                taxData = response.data;
              }

              // Update state immediately
              newResults[empId] = taxData;
              setTaxResults((prev) => ({ ...prev, [empId]: taxData }));

              // Clear loading state
              setLoadingAit((prev) => ({ ...prev, [empId]: false }));

              // Save to cache immediately
              financeAPI.storage.setTaxResultsByEmployee(empId, taxData);

              // Save to database in background
              financeAPI.tax
                .saveCalculatedTax({
                  employee_id: empId,
                  month: selectedMonth,
                  year: selectedYear,
                  calculation_data: taxData,
                  calculated_by: "system",
                })
                .catch((e) => console.warn(`Save failed for ${empId}:`, e));
            } catch (err) {
              console.error(`Failed to calculate for ${empId}:`, err);
              setLoadingAit((prev) => ({ ...prev, [empId]: false }));
            }
          }),
        );

        // Small delay between batches to prevent overwhelming the server
        if (i + batchSize < employeeIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setCalculatingTaxes(false);
      console.log(`✅ Tax calculation completed`);
    },
    [taxResults, selectedMonth, selectedYear],
  );

  // FIXED: Load approval status from backend
  const loadApprovalStatus = useCallback(
    async (companyName = "All Companies") => {
      try {
        setLoadingStatus(true);
        console.log(
          `📡 Loading approval status for company: ${companyName}...`,
        );

        const response =
          await financeAPI.approval.getApprovalStatus(companyName);

        console.log(
          `✅ Approval status loaded for ${companyName}:`,
          response.data,
        );

        // Update company-specific approval status
        setCompanyApprovalStatus((prev) => ({
          ...prev,
          [companyName]: {
            hr_prepared: response.data.hr_prepared || false,
            finance_checked: response.data.finance_checked || false,
            director_checked: response.data.director_checked || false,
            proprietor_approved: response.data.proprietor_approved || false,
          },
        }));

        // Also update global approval status for backward compatibility
        setApprovalStatus({
          hr_prepared: response.data.hr_prepared || false,
          finance_checked: response.data.finance_checked || false,
          director_checked: response.data.director_checked || false,
          proprietor_approved: response.data.proprietor_approved || false,
        });
      } catch (error) {
        console.error(
          `❌ Failed to load approval status for ${companyName}:`,
          error,
        );
      } finally {
        setLoadingStatus(false);
      }
    },
    [],
  );

  // USER DETECTION
  useEffect(() => {
    const detectUser = () => {
      try {
        let detectedUser = "";

        // Method 1: Check for individual username key
        const username = localStorage.getItem("username");
        if (username) {
          detectedUser = username.toLowerCase().trim();
        } else {
          // Method 2: Check for userData object
          const userData = localStorage.getItem("userData");
          if (userData) {
            try {
              const parsedData = JSON.parse(userData);
              detectedUser = (parsedData.username || parsedData.user_name || "")
                .toLowerCase()
                .trim();
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }
        }

        if (!detectedUser) {
          const possibleKeys = [
            "user",
            "user_name",
            "employee_name",
            "name",
            "email",
          ];
          for (let key of possibleKeys) {
            const value = localStorage.getItem(key);
            if (value && typeof value === "string" && value.length > 0) {
              detectedUser = value.toLowerCase().trim();
              break;
            }
          }
        }

        setCurrentUser(detectedUser);
        console.log("🎯 CURRENT USER:", detectedUser);
      } catch (error) {
        console.error("❌ ERROR detecting user:", error);
        setCurrentUser("");
      }
    };

    detectUser();
  }, []);

  // FIXED: Filter employees based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(term) ||
          emp.employee_id?.toLowerCase().includes(term),
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // FIXED: Load approval status for all companies
  useEffect(() => {
    if (currentUser && employees.length > 0) {
      console.log("🔄 Loading approval status for all companies...");
      const uniqueCompanies = [
        ...new Set(employees.map((emp) => emp.company_name ?? "Unknown")),
      ];
      uniqueCompanies.forEach((companyName) => {
        loadApprovalStatus(companyName);
      });
      loadApprovalStatus("All Companies");
    }
  }, [currentUser, employees.length, loadApprovalStatus]);

  // FIXED: Get AIT value with proper deduction logic (similar to FinanceProvision)
  const getAitValue = useCallback(
    (empId, monthlySalary) => {
      const loadingState = loadingAit[empId] || false;

      if (loadingState) {
        return { ait: 0, calculatedAit: 0, shouldDeduct: false, loading: true };
      }

      const result = taxResults[empId];

      // DEBUG: Log what we have
      console.log(`🔍 getAitValue for ${empId}:`, {
        hasResult: !!result,
        result: result,
        monthlySalary: monthlySalary,
      });

      if (!result) {
        return {
          ait: 0,
          calculatedAit: 0,
          shouldDeduct: false,
          loading: false,
          deductionReason: "No tax data found",
        };
      }

      // Extract tax calculation data
      const taxCalc = result.tax_calculation || {};

      // Get calculated TDS value - check multiple possible field names
      let calculatedAit = 0;
      if (taxCalc.monthly_tds !== undefined) {
        calculatedAit = parseFloat(taxCalc.monthly_tds) || 0;
      } else if (taxCalc.calculated_tds !== undefined) {
        calculatedAit = parseFloat(taxCalc.calculated_tds) || 0;
      } else if (taxCalc.net_tax_payable !== undefined) {
        calculatedAit = parseFloat(taxCalc.net_tax_payable) || 0;
      }

      // CRITICAL FIX: Check if tax should be deducted
      let shouldDeduct = false;

      // Rule 1: If salary <= 41,000, no tax deduction
      if (monthlySalary <= 41000) {
        shouldDeduct = false;
      }
      // Rule 2: Use the flag from backend if available
      else if (taxCalc.should_deduct_tax !== undefined) {
        shouldDeduct = taxCalc.should_deduct_tax === true;
      }
      // Rule 3: If calculated tax > 0 and salary > 41,000, deduct
      else if (calculatedAit > 0) {
        shouldDeduct = true;
      }

      // Set actual deduction amount
      let ait = 0;
      if (shouldDeduct) {
        // Use actual_deduction if available, otherwise use calculatedAit
        ait = parseFloat(taxCalc.actual_deduction) || calculatedAit || 0;
      } else {
        ait = 0;
      }

      console.log(`📊 AIT calculation for ${empId}:`, {
        salary: monthlySalary,
        calculatedAit: calculatedAit,
        shouldDeduct: shouldDeduct,
        actualAit: ait,
        taxCalcData: taxCalc,
      });

      return {
        ait,
        calculatedAit,
        shouldDeduct,
        loading: false,
        deductionReason:
          taxCalc.deduction_reason ||
          (shouldDeduct
            ? `Salary above 41,000 (${formatNumber(monthlySalary)})`
            : monthlySalary <= 41000
              ? `Salary at or below 41,000 threshold (${formatNumber(
                  monthlySalary,
                )})`
              : "No tax calculated"),
      };
    },
    [taxResults, loadingAit],
  );

  const handleSyncData = async () => {
    try {
      console.log("🔄 Syncing data...");
      setCalculatingTaxes(true);

      // Show loading states
      filteredEmployees.forEach((emp) => {
        setLoadingAit((prev) => ({ ...prev, [emp.employee_id]: true }));
      });

      const employeeIds = employees.map((emp) => emp.employee_id);

      // Get fresh from database
      const savedResponse = await financeAPI.tax.getCalculatedTaxes({
        employee_ids: employeeIds,
        month: selectedMonth,
        year: selectedYear,
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

        // Clear loading states for employees with data
        Object.keys(databaseResults).forEach((empId) => {
          setLoadingAit((prev) => ({ ...prev, [empId]: false }));
        });
      } else {
        alert("⚠️ No data found. Calculating taxes...");

        // If no data, calculate taxes
        const { sourceTaxOther, bonusOverride: bonusData } =
          await financeAPI.storage.getSourceTaxOther();

        await calculateMissingTaxes(
          filteredEmployees,
          employeeIds,
          sourceTaxOther,
          bonusData,
        );
      }
    } catch (error) {
      console.error("❌ Sync failed:", error);
      alert("❌ Sync failed. Check console.");
    } finally {
      setCalculatingTaxes(false);
    }
  };

  // Update your saveData function
  const saveData = async () => {
    const savedMonthKey = `salary_saved_${selectedYear}_${selectedMonth}`;

    // Check if already saved
    if (isDataSavedForMonth) {
      const confirmResave = window.confirm(
        `Salary data for ${monthNames[selectedMonth - 1]} ${selectedYear} has already been saved. Do you want to save again?`,
      );

      if (!confirmResave) {
        return;
      }
    }

    const payload = filteredEmployees
      .map((emp, idx) => {
        const empId = emp.employee_id?.trim();
        if (!empId) return null;

        const monthlySalary = Number(emp.salary) || 0;
        const salaryCash = Number(emp.salary_cash) || 0;

        const basicFull = Number((monthlySalary * 0.6).toFixed(2));
        const houseRentFull = Number((monthlySalary * 0.3).toFixed(2));
        const medicalFull = Number((monthlySalary * 0.05).toFixed(2));
        const conveyanceFull = Number((monthlySalary * 0.05).toFixed(2));
        const grossFull = Number(monthlySalary.toFixed(2));

        // Get tax calculation with deduction logic
        const { ait } = getAitValue(empId, monthlySalary);

        const daysWorkedManual = Number(getManual(empId, "daysWorked")) || 0;
        const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
        const otHours = Number(getManual(empId, "otHours")) || 0; // Get OT hours
        const otPay = calculateOTPay(monthlySalary, otHours, totalDaysInMonth);
        const additionManual = Number(getManual(empId, "addition")) || 0;
        const addition = additionManual; // OT is already included in addition via updateManual
        const advance = Number(getManual(empId, "advance")) || 0;
        const remarks = getManual(empId, "remarks", "") || "";

        const doj = parseDate(emp.joining_date);
        const isNewJoiner =
          doj &&
          doj.getMonth() + 1 === selectedMonth &&
          doj.getFullYear() === selectedYear;
        const defaultDays = isNewJoiner
          ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
          : totalDaysInMonth;
        const daysWorked =
          daysWorkedManual > 0 ? daysWorkedManual : defaultDays;
        const absentDays = Math.max(0, totalDaysInMonth - daysWorked);

        const dailyBasic = Number((basicFull / 30).toFixed(2));
        const absentDeduction = Number((dailyBasic * absentDays).toFixed(2));
        const totalDeduction = Number(
          (ait + advance + absentDeduction).toFixed(2),
        );

        const netPayBank = Number(
          (
            (monthlySalary / totalDaysInMonth) * daysWorked -
            cashPayment -
            totalDeduction +
            addition
          ).toFixed(2),
        );
        const totalPayable = Number(
          (netPayBank + cashPayment + ait + salaryCash).toFixed(2),
        );

        // ------------------- FIXED: SIMPLIFIED DOJ FORMATTING -------------------
        let dojStr = emp.joining_date || null;

        if (dojStr) {
          dojStr = dojStr.trim();

          // Try to parse the date
          const parseDate = (dateStr) => {
            if (!dateStr) return null;

            // Try common separators
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              let day, month, year;

              // If first part is 4 digits, assume YYYY-MM-DD
              if (parts[0].length === 4) {
                year = parseInt(parts[0]);
                month = parseInt(parts[1]);
                day = parseInt(parts[2]);
              } else {
                // Assume DD/MM/YYYY or similar
                day = parseInt(parts[0]);
                month = parseInt(parts[1]);
                year = parseInt(parts[2]);

                // If year is 2 digits, add 2000
                if (year < 100) year += 2000;
              }

              // Validate and format as YYYY-MM-DD
              if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                return `${year}-${String(month).padStart(2, "0")}-${String(
                  day,
                ).padStart(2, "0")}`;
              }
            }
            return null;
          };

          const parsed = parseDate(dojStr);
          if (parsed) {
            dojStr = parsed;
          } else {
            // If parsing fails, send null
            console.warn(
              `Could not parse DOJ for ${emp.employee_id}: ${emp.joining_date}`,
            );
            dojStr = null;
          }
        }
        // ------------------- END OF FIX -------------------

        return {
          sl: idx + 1,
          name: emp.name?.trim() || "Unknown",
          employee_id: empId,
          designation: emp.designation?.trim() || "",
          doj: dojStr, // Send the formatted string
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
          ait: ait, // This will be 0 for salary <= 41K
          total_ded: totalDeduction,
          ot_hours: otHours,
          ot_pay: otPay,
          addition: addition,
          cash_payment: cashPayment,
          cash_salary: salaryCash,
          net_pay_bank: netPayBank,
          total_payable: totalPayable,
          remarks: remarks,
          bank_account: emp.bank_account?.trim() || "",
          branch_name: emp.branch_name?.trim() || "",
          company_name: emp.company_name || "Unknown",
        };
      })
      .filter(Boolean);

    console.log("Saving payroll data with DOJ:", payload);

    // Debug: Show DOJ values
    payload.forEach((item, index) => {
      console.log(`Row ${index + 1}: ${item.employee_id} - DOJ: ${item.doj}`);
    });

    try {
      const res = await financeAPI.salary.saveSalary(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (saved > 0) {
        // Immediately check backend to confirm save
        await checkBackendDataExists();
      }

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        alert(
          `Warning: Saved ${saved}, but ${errors.length} failed. Check console.`,
        );
      } else {
        alert(
          `✅ Success: All ${saved} rows saved for ${monthNames[selectedMonth - 1]} ${selectedYear}!`,
        );
      }
    } catch (e) {
      // Re-enable button if save failed
      localStorage.removeItem(savedMonthKey);
      setIsDataSavedForMonth(false);
      console.error("Save failed:", e.response?.data || e);
      alert("❌ Save failed – check console");
    }
  };

  // Add reset function
  const resetMonthSave = () => {
    // This now just triggers a re-check of backend
    checkBackendDataExists();
    alert(
      `✅ Re-checked backend for ${monthNames[selectedMonth - 1]} ${selectedYear}`,
    );
  };

  const toggleCompany = (comp) => {
    setOpenCompanies((prev) => {
      const newState = { ...prev, [comp]: !prev[comp] };
      const isAnyCompanyOpen = Object.values(newState).some((v) => v);
      setShowSummary(!isAnyCompanyOpen);
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

    // If OT Hours is updated, automatically calculate and update addition
    if (field === "otHours" && employees.length > 0) {
      const emp = employees.find((e) => e.employee_id === empId);
      if (emp) {
        const monthlySalary = Number(emp.salary) || 0;
        const otPay = calculateOTPay(monthlySalary, parsed, totalDaysInMonth);

        // Get existing addition value (if any)
        const existingAddition = newData[empId]?.addition || 0;
        const existingOtPay = newData[empId]?.otPay || 0;

        // Update addition: remove old OT pay and add new OT pay
        newData[empId] = {
          ...newData[empId],
          addition: existingAddition - existingOtPay + otPay,
          otPay: otPay, // Store OT pay separately for future updates
        };
      }
    }

    setManualData(newData);
    financeAPI.storage.setSalaryManualData(newData);
  };

  const getManual = (empId, field, defaultVal = 0) => {
    return manualData[empId]?.[field] ?? defaultVal;
  };

  // FIXED: UPDATED APPROVAL FOOTER
  const renderApprovalFooter = (companyName) => {
    const companyStatus = companyApprovalStatus[companyName] || approvalStatus;
  };

  // FIXED: Show loading state
  if (loading || loadingStatus) {
    return (
      <div className="center-screen">
        <div className="fullscreen-loader">
          <div className="spinner" />
          <p>Loading Salary Format...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-format-container">
      <div className="dashboard">
        <div className="card">
          {/* HEADER SECTION */}
          <div className="header-section">
            <div className="header-main">
              <div className="title-section">
                <h1 className="main-title">
                  <FaUsers className="title-icon" />
                  Salary Format
                </h1>
                <div className="date-badge">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </div>
              </div>

              <div className="controls-section">
                <div className="search-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search employees by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() => navigate("/finance-provision")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back
                  </button>

                  <button
                    className="btn btn-save"
                    onClick={saveData}
                    disabled={isDataSavedForMonth}
                    style={{
                      opacity: isDataSavedForMonth ? 0.6 : 1,
                      cursor: isDataSavedForMonth ? "not-allowed" : "pointer",
                      position: "relative",
                    }}
                    title={
                      isDataSavedForMonth
                        ? `Data already saved for ${monthNames[selectedMonth - 1]} ${selectedYear}`
                        : "Save salary data"
                    }
                  >
                    <FaSave />
                    {isDataSavedForMonth ? "✓ Saved" : "Save Data"}
                  </button>



                  <button
                    onClick={() => navigate("/salary-records")}
                    className="btn btn-records"
                  >
                    <FaCalendarAlt /> View Records
                  </button>

                  <button
                    onClick={showAllCompanies}
                    className="btn btn-show-all"
                  >
                    <FaBuilding /> Show All
                  </button>

                  <button
                    onClick={hideAllCompanies}
                    className="btn btn-hide-all"
                  >
                    <FaBuilding /> Hide All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TAX STATUS SUMMARY */}
          <div className="tax-status-summary">
            <div className="status-item">
              <span className="status-label">Total Employees:</span>
              <span className="status-value">{filteredEmployees.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Salary {">"} 41K:</span>
              <span className="status-value">
                {
                  filteredEmployees.filter((e) => Number(e.salary || 0) > 41000)
                    .length
                }
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Tax Calculated:</span>
              <span className="status-value">
                {Object.keys(taxResults).length}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Tax Deducted:</span>
              <span className="status-value">
                {formatNumber(
                  filteredEmployees.reduce((sum, e) => {
                    const { ait } = getAitValue(
                      e.employee_id,
                      Number(e.salary || 0),
                    );
                    return sum + ait;
                  }, 0),
                )}
              </span>
            </div>
          </div>

          {/* TAX CALCULATION STATUS */}
          {calculatingTaxes && (
            <div className="tax-calculation-status">
              <div className="spinner-small"></div>
              <span>Calculating taxes... Please wait</span>
            </div>
          )}

          {/* COMPANY QUICK ACCESS */}
          <div className="company-quick-access">
            <div className="section-label">
              <FaBuilding className="section-icon" />
              Companies ({Object.keys(grouped).length})
            </div>
            <div className="company-buttons-grid">
              {Object.keys(grouped).map((comp) => (
                <div key={comp} className="company-card">
                  <button
                    className={`company-toggle-btn ${
                      openCompanies[comp] ? "active" : ""
                    }`}
                    onClick={() => toggleCompany(comp)}
                  >
                    <span className="company-name">{comp}</span>
                    <span className="employee-count">
                      {grouped[comp].length} employees
                    </span>
                    <span className="toggle-indicator">
                      {openCompanies[comp] ? "▲" : "▼"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* COMPANY SECTIONS */}
          {Object.keys(grouped).map((comp) => {
            const emps = grouped[comp];
            if (!openCompanies[comp]) return null;

            return (
              <div key={comp} className="company-section">
                <div className="company-header">
                  <div className="company-title">
                    <h2>{comp}</h2>
                    <h3>
                      Salary Sheet for {monthNames[selectedMonth - 1]}{" "}
                      {selectedYear}
                    </h3>
                  </div>
                </div>

                <div className="table-scroll-container">
                  <div className="table-wrapper">
                    <table className="salary-table">
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
                          <th>Total Days</th>
                          <th>Days Worked</th>
                          <th>Absent Days</th>
                          <th>Absent Ded.</th>
                          <th>Advance</th>
                          <th>AIT</th>
                          <th>Total Ded.</th>
                          <th>OT Min</th>
                          <th>OT Pay</th>
                          <th>Addition</th>
                          <th>Cash Payment</th>
                          <th>Cash Salary</th>
                          <th>Net Pay (Bank)</th>
                          <th>Total Payable</th>
                          <th>Bank Account</th>
                          <th>Branch Code</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emps.map((emp, idx) => {
                          const monthlySalary = Number(emp.salary) || 0;
                          const salaryCash = Number(emp.salary_cash) || 0;
                          const empId = emp.employee_id;

                          const basicFull = monthlySalary * 0.6;
                          const houseRentFull = monthlySalary * 0.3;
                          const medicalFull = monthlySalary * 0.05;
                          const conveyanceFull = monthlySalary * 0.05;
                          const grossFull = monthlySalary;

                          // FIXED: Get AIT value from backend (same as FinanceProvision)
                          const { ait, calculatedAit, shouldDeduct, loading } =
                            getAitValue(empId, monthlySalary);

                          const daysWorkedManual = getManual(
                            empId,
                            "daysWorked",
                          );
                          const cashPayment = getManual(empId, "cashPayment");
                          const addition = getManual(empId, "addition");
                          const advance = getManual(empId, "advance");
                          const remarks = getManual(empId, "remarks", "");

                          const doj = parseDate(emp.joining_date);
                          const isNewJoiner =
                            doj &&
                            doj.getMonth() + 1 === selectedMonth &&
                            doj.getFullYear() === selectedYear;
                          const defaultDays = isNewJoiner
                            ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                            : totalDaysInMonth;
                          const daysWorked =
                            daysWorkedManual > 0
                              ? daysWorkedManual
                              : defaultDays;
                          const absentDays = Math.max(
                            0,
                            totalDaysInMonth - daysWorked,
                          );

                          const dailyRate = monthlySalary / totalDaysInMonth;
                          const dailyBasic = basicFull / BASE_MONTH;
                          const absentDeduction = dailyBasic * absentDays;

                          const totalDeduction =
                            ait + advance + absentDeduction;

                          const netPayBank =
                            monthlySalary -
                            cashPayment -
                            totalDeduction +
                            addition;
                          const totalPayable =
                            netPayBank + cashPayment + ait + salaryCash;

                          return (
                            <tr key={empId} className="data-row">
                              <td className="sl-number">{idx + 1}</td>
                              <td className="emp-name">{emp.name}</td>
                              <td className="emp-id">{empId}</td>
                              <td className="emp-designation">
                                {emp.designation}
                              </td>
                              <td className="emp-doj">{emp.joining_date}</td>
                              <td className="salary-amount">
                                {formatNumber(basicFull)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(houseRentFull)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(medicalFull)}
                              </td>
                              <td className="salary-amount">
                                {formatNumber(conveyanceFull)}
                              </td>
                              <td className="gross-salary">
                                {formatNumber(grossFull)}
                              </td>
                              <td className="days-count">{totalDaysInMonth}</td>

                              <td>
                                <input
                                  type="number"
                                  value={
                                    daysWorkedManual > 0 ? daysWorkedManual : ""
                                  }
                                  placeholder={defaultDays}
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "daysWorked",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input days-input"
                                  min="0"
                                  max={totalDaysInMonth}
                                />
                              </td>

                              <td className="absent-days">{absentDays}</td>
                              <td className="deduction-amount">
                                {formatNumber(absentDeduction)}
                              </td>

                              <td>
                                <input
                                  type="number"
                                  value={advance !== 0 ? advance : ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "advance",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input advance-input"
                                />
                              </td>

                              <td
                                className={`tax-amount ${
                                  loading ? "loading" : ""
                                } ${
                                  calculatedAit > 0 && !shouldDeduct
                                    ? "calculated-no-deduct"
                                    : shouldDeduct
                                      ? "tax-deducted"
                                      : ""
                                }`}
                              >
                                {loading ? (
                                  <div className="loading-spinner-small">
                                    <div className="spinner-tiny"></div>
                                    <span className="loading-text">
                                      Calculating...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="tax-breakdown">
                                    <div className="tax-amount-main">
                                      {formatNumber(ait)}
                                    </div>
                                    {calculatedAit > 0 && !shouldDeduct && (
                                      <div
                                        className="tax-note"
                                        title={`Calculated: ${formatNumber(
                                          calculatedAit,
                                        )} (Not deducted - Salary ≤ 41,000)`}
                                      >
                                        (Calc: {formatNumber(calculatedAit)})
                                      </div>
                                    )}
                                    {shouldDeduct && calculatedAit > 0 && (
                                      <div
                                        className="tax-note"
                                        title="Tax deducted (Salary > 41,000)"
                                      >
                                        ✓ Deducted
                                      </div>
                                    )}
                                    {!calculatedAit &&
                                      !shouldDeduct &&
                                      monthlySalary > 0 && (
                                        <div
                                          className="tax-note"
                                          title="No tax calculation available"
                                        >
                                          No tax
                                        </div>
                                      )}
                                  </div>
                                )}
                              </td>
                              <td className="deduction-amount total-deduction">
                                {formatNumber(totalDeduction)}
                              </td>

                              <td className="ot-hours">
                                <input
                                  type="number"
                                  value={getManual(empId, "otHours") || ""}
                                  placeholder="Minutes"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "otHours",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input ot-input"
                                  min="0"
                                  step="1"
                                  title="Enter OT in minutes (60 = 1 hour, 120 = 2 hours)"
                                />
                              </td>
                              <td className="ot-pay">
                                {formatNumber(
                                  calculateOTPay(
                                    monthlySalary,
                                    getManual(empId, "otHours") || 0,
                                    totalDaysInMonth,
                                  ),
                                )}
                              </td>

                              <td>
                                <input
                                  type="number"
                                  value={addition !== 0 ? addition : ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "addition",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input addition-input"
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  value={cashPayment !== 0 ? cashPayment : ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "cashPayment",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input cash-input"
                                />
                              </td>
                              <td className="total-payable">
                                {formatNumber(salaryCash + cashPayment)}
                              </td>

                              <td
                                className={`net-pay ${
                                  netPayBank < 0 ? "negative" : "positive"
                                }`}
                              >
                                {formatNumber(netPayBank)}
                              </td>
                              <td className="total-payable">
                                {formatNumber(totalPayable)}
                              </td>

                              <td className="bank-account">
                                {emp.bank_account || "N/A"}
                              </td>
                              <td className="branch-code">
                                {emp.branch_name || "N/A"}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={remarks}
                                  placeholder="Remarks"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "remarks",
                                      e.target.value,
                                    )
                                  }
                                  className="editable-input remarks-input"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TAX SUMMARY SECTION */}
                <div className="tax-summary-note">
                  <h4>📊 Tax Deduction Summary for {comp}</h4>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="stat-label">Total Employees:</span>
                      <span className="stat-value">{emps.length}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">
                        Tax-Deductible Employees (Salary &gt; 41K):
                      </span>
                      <span className="stat-value">
                        {
                          emps.filter((e) => Number(e.salary || 0) > 41000)
                            .length
                        }
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">
                        Tax-Exempt Employees (Salary ≤ 41K):
                      </span>
                      <span className="stat-value">
                        {
                          emps.filter((e) => Number(e.salary || 0) <= 41000)
                            .length
                        }
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Calculated Tax:</span>
                      <span className="stat-value">
                        {formatNumber(
                          emps.reduce((sum, e) => {
                            const result = taxResults[e.employee_id] || {};
                            const taxCalc = result.tax_calculation || {};
                            return (
                              sum +
                              (taxCalc.calculated_tds ||
                                taxCalc.monthly_tds ||
                                0)
                            );
                          }, 0),
                        )}
                      </span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Deducted Tax:</span>
                      <span className="stat-value">
                        {formatNumber(
                          emps.reduce((sum, e) => {
                            const result = taxResults[e.employee_id] || {};
                            const taxCalc = result.tax_calculation || {};
                            return sum + (taxCalc.actual_deduction || 0);
                          }, 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* APPROVAL FOOTER */}
                {renderApprovalFooter(comp)}
              </div>
            );
          })}

          {/* SUMMARY SECTION - Only show when no companies are open */}
          {showSummary && filteredEmployees.length > 0 && (
            <div className="summary-section">
              <div className="summary-header">
                <h2>
                  <FaUsers className="section-icon" />
                  Summary Overview
                </h2>
                {/* <div className="summary-actions">
                  <button
                    onClick={exportAllCompanies}
                    className="btn btn-export-all"
                  >
                    <FaFileExport /> Export All
                  </button>
                </div> */}
              </div>

              <div className="summary-stats">
                <div className="stat-card">
                  <div className="stat-number">
                    {Object.keys(grouped).length}
                  </div>
                  <div className="stat-label">Companies</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{filteredEmployees.length}</div>
                  <div className="stat-label">Total Employees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {formatNumber(
                      filteredEmployees.reduce(
                        (s, e) => s + (Number(e.salary) || 0),
                        0,
                      ),
                    )}
                  </div>
                  <div className="stat-label">Total Gross Salary</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {formatNumber(
                      filteredEmployees.reduce((s, e) => {
                        const result = taxResults[e.employee_id] || {};
                        const taxCalc = result.tax_calculation || {};
                        return s + (taxCalc.actual_deduction || 0);
                      }, 0),
                    )}
                  </div>
                  <div className="stat-label">Total Deducted AIT</div>
                </div>
              </div>

              <div className="table-scroll-container">
                <div className="table-wrapper">
                  <table className="salary-table summary-table">
                    <thead>
                      <tr>
                        <th>SL</th>
                        <th>Company</th>
                        <th>Employees</th>
                        <th>Gross Salary</th>
                        <th>AIT (Deducted)</th>
                        <th>Net Pay (Bank)</th>
                        <th>Total Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(grouped).map((comp, i) => {
                        const emps = grouped[comp];
                        const summary = emps.reduce(
                          (acc, e) => {
                            const empId = e.employee_id;
                            const salary = Number(e.salary) || 0;
                            const doj = parseDate(e.joining_date);
                            const isNewJoiner =
                              doj &&
                              doj.getMonth() + 1 === selectedMonth &&
                              doj.getFullYear() === selectedYear;
                            const defaultDays = isNewJoiner
                              ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                              : totalDaysInMonth;
                            const daysWorked =
                              getManual(empId, "daysWorked") || defaultDays;

                            // Get tax calculation with deduction logic
                            const result = taxResults[empId] || {};
                            const taxCalc = result.tax_calculation || {};
                            const shouldDeduct =
                              taxCalc.should_deduct_tax || false;
                            const ait = shouldDeduct
                              ? taxCalc.monthly_tds || 0
                              : 0;
                            const calculatedAit = taxCalc.monthly_tds || 0;

                            const absentDed =
                              ((salary * 0.6) / BASE_MONTH) *
                              (totalDaysInMonth - daysWorked);
                            const advance = getManual(empId, "advance");
                            const cash = getManual(empId, "cashPayment");
                            const addition = getManual(empId, "addition");
                            const totalDed = ait + advance + absentDed;
                            const netBank = salary;
                            cash - totalDed + addition;
                            const totalPay = netBank + cash + ait;

                            return {
                              gross: acc.gross + salary,
                              ait: acc.ait + ait,
                              calculatedAit: acc.calculatedAit + calculatedAit,
                              absentDed: acc.absentDed + absentDed,
                              advance: acc.advance + advance,
                              cash: acc.cash + cash,
                              addition: acc.addition + addition,
                              netBank: acc.netBank + netBank,
                              totalPay: acc.totalPay + totalPay,
                            };
                          },
                          {
                            gross: 0,
                            ait: 0,
                            calculatedAit: 0,
                            absentDed: 0,
                            advance: 0,
                            cash: 0,
                            addition: 0,
                            netBank: 0,
                            totalPay: 0,
                          },
                        );

                        return (
                          <tr key={i} className="data-row summary-row">
                            <td className="sl-number">{i + 1}</td>
                            <td className="company-name">{comp}</td>
                            <td className="employee-count">{emps.length}</td>
                            <td className="gross-salary">
                              {formatNumber(summary.gross)}
                            </td>
                            <td className="tax-amount">
                              <div className="tax-breakdown">
                                <div className="tax-amount-main">
                                  {formatNumber(summary.ait)}
                                </div>
                                {summary.calculatedAit > summary.ait && (
                                  <div className="tax-note">
                                    (Calc: {formatNumber(summary.calculatedAit)}
                                    )
                                  </div>
                                )}
                              </div>
                            </td>
                            <td
                              className={`net-pay ${
                                summary.netBank < 0 ? "negative" : "positive"
                              }`}
                            >
                              {formatNumber(summary.netBank)}
                            </td>
                            <td className="total-payable">
                              {formatNumber(summary.totalPay)}
                            </td>
                          </tr>
                        );
                      })}

                      {/* GRAND TOTAL ROW - PROPERLY ALIGNED */}
                      <tr className="grand-total">
                        <td colSpan="2" className="grand-total-label">
                          Grand Total
                        </td>
                        <td className="grand-total-count">
                          {filteredEmployees.length}
                        </td>
                        <td className="grand-total-gross">
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) => s + (Number(e.salary) || 0),
                              0,
                            ),
                          )}
                        </td>
                        <td className="grand-total-tax">
                          <div className="tax-breakdown">
                            <div className="tax-amount-main">
                              {formatNumber(
                                filteredEmployees.reduce((s, e) => {
                                  const result =
                                    taxResults[e.employee_id] || {};
                                  const taxCalc = result.tax_calculation || {};
                                  const shouldDeduct =
                                    taxCalc.should_deduct_tax || false;
                                  const ait = shouldDeduct
                                    ? taxCalc.monthly_tds || 0
                                    : 0;
                                  return s + ait;
                                }, 0),
                              )}
                            </div>
                            <div className="tax-note">
                              (Calc:{" "}
                              {formatNumber(
                                filteredEmployees.reduce((s, e) => {
                                  const result =
                                    taxResults[e.employee_id] || {};
                                  const taxCalc = result.tax_calculation || {};
                                  return s + (taxCalc.monthly_tds || 0);
                                }, 0),
                              )}
                              )
                            </div>
                          </div>
                        </td>
                        <td
                          className={`grand-total-net ${
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              const result = taxResults[empId] || {};
                              const taxCalc = result.tax_calculation || {};
                              const shouldDeduct =
                                taxCalc.should_deduct_tax || false;
                              const ait = shouldDeduct
                                ? taxCalc.monthly_tds || 0
                                : 0;
                              const absentDed =
                                ((salary * 0.6) / BASE_MONTH) *
                                (totalDaysInMonth - daysWorked);
                              const advance = getManual(empId, "advance");
                              const cash = getManual(empId, "cashPayment");
                              const addition = getManual(empId, "addition");
                              const totalDed = ait + advance + absentDed;
                              const netBank =
                                (salary / totalDaysInMonth) * daysWorked -
                                cash -
                                totalDed +
                                addition;
                              return s + netBank;
                            }, 0) < 0
                              ? "negative"
                              : "positive"
                          }`}
                        >
                          {formatNumber(
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              const result = taxResults[empId] || {};
                              const taxCalc = result.tax_calculation || {};
                              const shouldDeduct =
                                taxCalc.should_deduct_tax || false;
                              const ait = shouldDeduct
                                ? taxCalc.monthly_tds || 0
                                : 0;
                              const absentDed =
                                ((salary * 0.6) / BASE_MONTH) *
                                (totalDaysInMonth - daysWorked);
                              const advance = getManual(empId, "advance");
                              const cash = getManual(empId, "cashPayment");
                              const addition = getManual(empId, "addition");
                              const totalDed = ait + advance + absentDed;
                              const netBank =
                                (salary / totalDaysInMonth) * daysWorked -
                                cash -
                                totalDed +
                                addition;
                              return s + netBank;
                            }, 0),
                          )}
                        </td>
                        <td className="grand-total-payable">
                          {formatNumber(
                            filteredEmployees.reduce((s, e) => {
                              const empId = e.employee_id;
                              const salary = Number(e.salary) || 0;
                              const doj = parseDate(e.joining_date);
                              const isNewJoiner =
                                doj &&
                                doj.getMonth() + 1 === selectedMonth &&
                                doj.getFullYear() === selectedYear;
                              const defaultDays = isNewJoiner
                                ? totalDaysInMonth - (doj?.getDate() ?? 0) + 1
                                : totalDaysInMonth;
                              const daysWorked =
                                getManual(empId, "daysWorked") || defaultDays;
                              const result = taxResults[empId] || {};
                              const taxCalc = result.tax_calculation || {};
                              const shouldDeduct =
                                taxCalc.should_deduct_tax || false;
                              const ait = shouldDeduct
                                ? taxCalc.monthly_tds || 0
                                : 0;
                              const absentDed =
                                ((salary * 0.6) / BASE_MONTH) *
                                (totalDaysInMonth - daysWorked);
                              const advance = getManual(empId, "advance");
                              const cash = getManual(empId, "cashPayment");
                              const addition = getManual(empId, "addition");
                              const totalDed = ait + advance + absentDed;
                              const netBank =
                                (salary / totalDaysInMonth) * daysWorked -
                                cash -
                                totalDed +
                                addition;
                              const totalPay = netBank + cash + ait;
                              return s + totalPay;
                            }, 0),
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .salary-format-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dashboard {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 1rem;
        }

        .card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          backdrop-filter: blur(10px);
          
        }

        /* IMPROVED HEADER SECTION */
        .header-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2.5rem;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .main-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .title-icon {
          font-size: 2.2rem;
          opacity: 0.9;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .date-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 15px;
          font-size: 1.1rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          align-self: flex-start;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .controls-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-width: 320px;
        }

        .search-wrapper {
          position: relative;
          width: 100%;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          border: none;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border: 2px solid transparent;
        }

        .search-input:focus {
          outline: none;
          background: white;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8b5cf6;
          font-size: 1.2rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1rem 1.8rem;
          border: none;
          border-radius: 15px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
        }

        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .btn-back {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .btn-save {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .btn-save:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn-sync {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-sync:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .btn-recalculate {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-recalculate:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        }

        .btn-export-all,
        .btn-export-section {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-export-all:hover,
        .btn-export-section:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
        }

        .btn-show-all,
        .btn-hide-all {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .btn-show-all:hover,
        .btn-hide-all:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }

        /* TAX STATUS SUMMARY */
        .tax-status-summary {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          min-width: 120px;
        }

        .status-label {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .status-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1f2937;
        }

        /* COMPANY QUICK ACCESS */
        .company-quick-access {
          padding: 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 2rem;
        }

        .section-icon {
          color: #8b5cf6;
          font-size: 1.4rem;
        }

        .company-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.2rem;
        }

        .company-card {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .company-toggle-btn {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 1.8rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .company-toggle-btn:hover {
          border-color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
        }

        .company-toggle-btn.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border-color: #8b5cf6;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
        }

        .company-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .employee-count {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .toggle-indicator {
          font-weight: bold;
          margin-left: 0.5rem;
          font-size: 1.1rem;
        }

        .btn-export-company {
          padding: 1rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-export-company:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(217, 119, 6, 0.3);
        }

        /* COMPANY SECTIONS */
        .company-section {
          padding: 2.5rem;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
        }

        .company-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .company-title {
          flex: 1;
        }

        .company-title h2 {
          margin: 0 0 0.8rem 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .company-title h3 {
          margin: 0;
          color: #6b7280;
          font-size: 1.2rem;
          font-weight: 500;
        }

        .company-action-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-generate-excel {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 1rem 1.8rem;
          border: none;
          border-radius: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .btn-generate-excel:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .btn-generate-excel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* FIXED TABLE STYLING */
        .table-scroll-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          margin-bottom: 2.5rem;
          max-height: 70vh;
          position: relative;
          background: white;
        }

        .table-wrapper {
          min-width: 2400px;
          position: relative;
        }

        .salary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          position: relative;
        }

        .salary-table thead {
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .salary-table thead tr {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .salary-table th {
          padding: 1.2rem 0.8rem;
          text-align: center;
          font-weight: 600;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          position: sticky;
          top: 0;
          background: inherit;
          font-size: 0.85rem;
        }

        .data-row td {
          padding: 1rem 0.8rem;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
          transition: all 0.2s ease;
        }

        .data-row:hover {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          transform: scale(1.01);
        }

        .data-row:nth-child(even) {
          background: #fafafa;
        }

        .data-row:nth-child(even):hover {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }

        .editable-input {
          width: 85px;
          padding: 0.6rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.85rem;
          text-align: center;
          transition: all 0.2s ease;
          background: white;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .editable-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          transform: scale(1.05);
        }

        .days-input {
          border-color: #f59e0b;
          background: #fffbeb;
        }
        .advance-input {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .addition-input {
          border-color: #10b981;
          background: #ecfdf5;
        }
        .cash-input {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .remarks-input {
          border-color: #8b5cf6;
          background: #faf5ff;
          width: 130px;
        }

        /* LOADING SPINNER FOR AIT CELLS */
        .loading-spinner-small {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 5px;
        }

        .spinner-tiny {
          width: 16px;
          height: 16px;
          border: 2px solid #8b5cf6;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          font-size: 0.7rem;
          color: #6b7280;
        }

        .tax-amount.loading {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
          border: 2px solid #d1d5db !important;
          color: #6b7280 !important;
          min-height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* TAX BREAKDOWN STYLES */
        .tax-breakdown {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .tax-amount-main {
          font-weight: 700;
          font-size: 1rem;
        }

        .tax-note {
          font-size: 0.7rem;
          color: #6b7280;
          background: #f9fafb;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
          cursor: help;
          border: 1px solid #e5e7eb;
          max-width: 100px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .calculated-no-deduct .tax-note {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #92400e;
        }

        .tax-deducted .tax-note {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #dc2626;
        }

        .tax-amount.calculated-no-deduct {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
          border: 2px solid #f59e0b !important;
          color: #92400e !important;
        }

        .tax-amount.tax-deducted {
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%) !important;
          border: 2px solid #ef4444 !important;
          color: #b91c1c !important;
        }

        .tax-amount.loading {
          background: #f3f4f6 !important;
          border: 2px solid #d1d5db !important;
          color: #6b7280 !important;
        }

        /* BEAUTIFUL COLOR CODING */
        .sl-number {
          color: #7c3aed;
          font-weight: 700;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          padding: 0.5rem;
          border-radius: 10px;
          border: 2px solid #ddd6fe;
        }
        .emp-name {
          color: #1e40af;
          font-weight: 700;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
        }
        .emp-id {
          color: #dc2626;
          font-weight: 700;
          background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
          border: 2px solid #fca5a5;
        }
        .emp-designation {
          color: #059669;
          font-weight: 600;
          background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%);
          padding: 0.5rem 0.8rem;
          border-radius: 10px;
        }
        .emp-doj {
          color: #7c2d12;
          background: #fef3c7;
          padding: 0.5rem;
          border-radius: 8px;
          font-weight: 500;
        }
        .salary-amount {
          color: #1e3a8a;
          font-weight: 600;
          background: #f0f9ff;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .gross-salary {
          color: #1e3a8a;
          font-weight: 800;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #93c5fd;
        }
        .days-count {
          color: #7c2d12;
          font-weight: 600;
          background: #fed7aa;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .absent-days {
          color: #dc2626;
          font-weight: 600;
          background: #fecaca;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .deduction-amount {
          color: #dc2626;
          font-weight: 600;
          background: #fee2e2;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .total-deduction {
          color: #b91c1c;
          font-weight: 700;
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #f87171;
        }
        .tax-amount {
          color: #c2410c;
          font-weight: 600;
          background: #ffedd5;
          padding: 0.5rem;
          border-radius: 8px;
          border: 2px solid #fdba74;
        }
        .net-pay.positive {
          color: #059669;
          font-weight: 800;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #34d399;
        }
        .net-pay.negative {
          color: #dc2626;
          font-weight: 800;
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #f87171;
        }
        .total-payable {
          color: #1e3a8a;
          font-weight: 800;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          padding: 0.8rem 0.5rem;
          border-radius: 12px;
          border: 2px solid #a5b4fc;
        }
        .ot-hours {
          color: #64748b;
          background: #f1f5f9;
          padding: 0.5rem;
          border-radius: 8px;
        }

        /* TAX SUMMARY SECTION */
        .tax-summary-note {
          margin-top: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .tax-summary-note h4 {
          margin-top: 0;
          color: #1e293b;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        /* APPROVAL BUTTONS STYLES */
        .approval-btn {
          padding: 1rem 1.5rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          min-width: 200px;
          justify-content: center;
        }

        .approval-btn.enabled {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #059669;
          cursor: pointer;
        }

        .approval-btn.enabled:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
        }

        .approval-btn.disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .status-badge {
          background: white;
          color: #10b981;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          padding: 2rem 0;
          color: #64748b;
          font-size: 0.95rem;
          border-top: 2px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        /* SUMMARY SECTION */
        .summary-section {
          padding: 2.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .summary-header h2 {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .summary-actions {
          display: flex;
          gap: 1rem;
        }

        /* SUMMARY STATS CARDS */
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 2rem;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.15);
          border-color: #8b5cf6;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #8b5cf6;
          margin-bottom: 0.8rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          font-size: 1rem;
          color: #6b7280;
          font-weight: 600;
        }

        /* SUMMARY TABLE */
        .summary-table {
          min-width: 1200px;
        }

        .summary-row {
          background: linear-gradient(
            135deg,
            #f8fafc 0%,
            #f1f5f9 100%
          ) !important;
        }

        .summary-row:hover {
          background: linear-gradient(
            135deg,
            #e0e7ff 0%,
            #c7d2fe 100%
          ) !important;
          transform: scale(1.01);
        }

        .company-name {
          font-weight: 700;
          color: #1e40af;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          padding: 0.8rem;
          border-radius: 10px;
        }

        .employee-count {
          font-weight: 700;
          color: #7c3aed;
          text-align: center;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
          padding: 0.8rem;
          border-radius: 10px;
        }

        /* GRAND TOTAL STYLES - PROPERLY ALIGNED */
        .grand-total {
          background: linear-gradient(
            135deg,
            #8b5cf6 0%,
            #7c3aed 100%
          ) !important;
          color: white !important;
          font-weight: 800;
        }

        .grand-total td {
          color: white !important;
          border-bottom: none !important;
          font-size: 1.1rem;
          text-align: center;
          padding: 1.2rem 0.8rem;
        }

        .grand-total-label {
          font-size: 1.3rem !important;
          text-align: left !important;
          padding-left: 1.5rem !important;
          background: transparent !important;
        }

        .grand-total-count,
        .grand-total-gross,
        .grand-total-tax,
        .grand-total-deduction,
        .grand-total-advance,
        .grand-total-cash,
        .grand-total-addition,
        .grand-total-net,
        .grand-total-payable {
          text-align: center !important;
          font-weight: 800;
          background: transparent !important;
          border: none !important;
        }

        /* LOADER STYLES */
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
          border: 8px solid rgba(255, 255, 255, 0.3);
          border-top: 8px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* TAX CALCULATION STATUS */
        .tax-calculation-status {
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-bottom: 1px solid #fde68a;
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #92400e;
          font-weight: 600;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid #f59e0b;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* RESPONSIVE DESIGN */
        @media (max-width: 768px) {
          .salary-format-container {
            padding: 0.5rem;
          }

          .header-main {
            flex-direction: column;
          }

          .controls-section {
            width: 100%;
          }

          .action-buttons {
            justify-content: space-between;
          }

          .btn {
            flex: 1;
            justify-content: center;
            min-width: 120px;
          }

          .company-buttons-grid {
            grid-template-columns: 1fr;
          }

          .company-header {
            flex-direction: column;
          }

          .company-action-buttons {
            width: 100%;
            justify-content: center;
          }

          .btn-generate-excel,
          .btn-export-section {
            flex: 1;
            justify-content: center;
          }

          .footer {
            flex-direction: column;
            text-align: center;
          }

          .table-scroll-container {
            border-radius: 12px;
          }

          .salary-table th {
            padding: 1rem 0.5rem;
            font-size: 0.75rem;
          }

          .data-row td {
            padding: 0.8rem 0.5rem;
            font-size: 0.75rem;
          }

          .editable-input {
            width: 65px;
            padding: 0.5rem;
          }

          .summary-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .stat-card {
            padding: 1.5rem;
          }

          .stat-number {
            font-size: 2rem;
          }

          .approval-btn {
            min-width: 100%;
          }

          .tax-status-summary {
            padding: 1rem;
          }

          .status-item {
            min-width: 90px;
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .header-section {
            padding: 1.5rem 1rem;
          }

          .main-title {
            font-size: 2rem;
          }

          .company-section {
            padding: 1.5rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .company-action-buttons {
            flex-direction: column;
          }

          .btn-generate-excel,
          .btn-export-section {
            width: 100%;
          }

          .summary-stats {
            grid-template-columns: 1fr;
          }

          .footer {
            flex-direction: column;
          }

          .tax-status-summary {
            flex-direction: column;
          }

          .status-item {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryFormat;
