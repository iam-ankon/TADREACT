// src/pages/finance/SalaryFormat.jsx
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// FIXED: Import the complete finance API
import apiClient, {
  employeeAPI,
  taxAPI,
  salaryAPI,
  storageAPI,
} from "../../api/finance";

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

const SalaryFormat = () => {
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
  const [generatingExcel, setGeneratingExcel] = useState({}); // Track Excel generation per company

  // BACKEND-BASED APPROVAL STATUS
  const [approvalStatus, setApprovalStatus] = useState({
    hr_prepared: false,
    finance_checked: false,
    director_checked: false,
    proprietor_approved: false,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentUser, setCurrentUser] = useState("");

  const today = new Date();
  const selectedMonth = today.getMonth() + 1;
  const selectedYear = today.getFullYear();
  const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const BASE_MONTH = 30;

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

  // FIXED: Load tax data from storage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Load manual data
        const savedManual = storageAPI.getSalaryManualData();
        if (savedManual) setManualData(savedManual);

        // Load cached tax results
        const cachedResults = storageAPI.getCachedTaxResults();
        if (cachedResults) {
          setTaxResults(cachedResults);

          // Set loading states for AIT values
          const loadingStates = {};
          Object.keys(cachedResults).forEach((empId) => {
            loadingStates[empId] = false;
          });
          setLoadingAit(loadingStates);
        }

        // Load source other and bonus override
        const sourceData = await storageAPI.getSourceTaxOther();
        if (sourceData) setSourceOther(sourceData);

        const bonusData = await storageAPI.getBonusOverride();
        if (bonusData) setBonusOverride(bonusData);
      } catch (error) {
        console.error("Error loading stored data:", error);
      }
    };

    loadStoredData();
  }, []);

  // FIXED: Load employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const res = await employeeAPI.getAll();
        const filtered = res.data.filter((e) => e.salary && e.employee_id);
        setEmployees(filtered);
        setFilteredEmployees(filtered);
      } catch (e) {
        console.error("Failed to fetch employees:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // FIXED: UPDATED LOAD APPROVAL STATUS FUNCTION
  const loadApprovalStatus = useCallback(
    async (companyName = "All Companies") => {
      try {
        setLoadingStatus(true);
        console.log(
          `📡 Loading approval status for company: ${companyName}...`
        );

        // Use apiClient instead of fetch
        const response = await apiClient.get(
          `/api/approval-status/?company_name=${encodeURIComponent(
            companyName
          )}`
        );

        console.log(
          `✅ Approval status loaded for ${companyName}:`,
          response.data
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
          error
        );
      } finally {
        setLoadingStatus(false);
      }
    },
    []
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

  // FIXED: IMPROVED TAX CALCULATION FUNCTION
  const calculateTaxesForEmployees = useCallback(
    async (employeeList = filteredEmployees) => {
      if (employeeList.length === 0) return;

      console.log(
        `🧮 Calculating taxes for ${employeeList.length} employees...`
      );
      setCalculatingTaxes(true);

      try {
        const results = { ...taxResults };
        const newLoadingStates = { ...loadingAit };

        // Process in smaller batches to avoid overwhelming the server
        const batchSize = 3;
        for (let i = 0; i < employeeList.length; i += batchSize) {
          const batch = employeeList.slice(i, i + batchSize);

          const batchPromises = batch.map(async (emp) => {
            const empId = emp.employee_id;
            const monthlySalary = Number(emp.salary) || 0;
            const gender = emp.gender === "M" ? "Male" : "Female";
            const other = sourceOther[empId] || 0;
            const bonus = bonusOverride[empId] || monthlySalary; // Default to 1 month salary

            // Set loading state
            newLoadingStates[empId] = true;
            setLoadingAit({ ...newLoadingStates });

            try {
              let taxData;

              if (monthlySalary <= 41000) {
                // No tax deduction for salary ≤ 41,000
                taxData = {
                  tax_calculation: {
                    monthly_tds: 0,
                    calculated_tds: 0,
                    should_deduct_tax: false,
                    actual_deduction: 0,
                    note: "Salary ≤ 41,000 - No tax deduction",
                    deduction_reason: "Salary at or below 41,000 threshold",
                  },
                };
              } else {
                // Calculate tax for salary > 41,000 using the API
                console.log(
                  `Calculating tax for ${empId}: Salary ${monthlySalary}`
                );

                const response = await taxAPI.calculate({
                  employee_id: empId,
                  gender: gender,
                  source_other: parseFloat(String(other)) || 0,
                  monthly_salary: monthlySalary,
                  bonus: bonus,
                });

                taxData = response.data;

                // Ensure deduction flags are set properly
                if (taxData.tax_calculation) {
                  // The backend should already set should_deduct_tax = true for salary > 41,000
                  // But we ensure it here
                  const taxCalc = taxData.tax_calculation;
                  const calculatedTds = taxCalc.monthly_tds || taxCalc.calculated_tds || 0;
                  
                  taxCalc.should_deduct_tax = true; // Always true for salary > 41,000
                  taxCalc.actual_deduction = calculatedTds; // Full deduction for > 41K
                  taxCalc.deduction_reason = "Salary above 41,000 threshold";
                }
              }

              results[empId] = taxData;
              console.log(
                `✅ Tax calculated for ${empId}:`,
                taxData.tax_calculation?.monthly_tds,
                "Should deduct:", 
                taxData.tax_calculation?.should_deduct_tax
              );

              return { empId, success: true };
            } catch (error) {
              console.error(`❌ Tax calculation failed for ${empId}:`, error);

              // Fallback calculation
              let calculatedTax = 0;
              if (monthlySalary > 41000) {
                // Simple fallback calculation (5% approximation)
                calculatedTax = Math.round(monthlySalary * 0.05);
              }

              results[empId] = {
                tax_calculation: {
                  monthly_tds: calculatedTax,
                  calculated_tds: calculatedTax,
                  should_deduct_tax: monthlySalary > 41000,
                  calculated_tax: calculatedTax,
                  actual_deduction: monthlySalary > 41000 ? calculatedTax : 0,
                  note: "Calculated via fallback",
                  deduction_reason: monthlySalary > 41000 
                    ? "Salary above 41,000 (fallback)" 
                    : "Salary at or below 41,000",
                },
              };

              return { empId, success: false, error: error.message };
            } finally {
              // Clear loading state
              newLoadingStates[empId] = false;
              setLoadingAit({ ...newLoadingStates });
            }
          });

          await Promise.all(batchPromises);

          // Update state after each batch
          setTaxResults({ ...results });
          storageAPI.setCachedTaxResults(results);

          // Small delay between batches
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        console.log("✅ All tax calculations completed");

        // Calculate total tax
        const totalTax = Object.values(results).reduce((sum, result) => {
          return sum + (result?.tax_calculation?.actual_deduction || 0);
        }, 0);

        console.log(`💰 Total AIT to deduct: ${formatNumber(totalTax)}`);
      } catch (error) {
        console.error("❌ Error in tax calculation process:", error);
      } finally {
        setCalculatingTaxes(false);
      }
    },
    [taxResults, loadingAit, sourceOther, bonusOverride, filteredEmployees]
  );

  // FIXED: Trigger tax calculation when employees are loaded
  useEffect(() => {
    if (employees.length > 0 && !calculatingTaxes) {
      // Check which employees need tax calculation
      const employeesNeedingCalculation = employees.filter((emp) => {
        const empId = emp.employee_id;
        const monthlySalary = Number(emp.salary) || 0;

        // Check if we already have a valid tax result
        const existingResult = taxResults[empId];

        // Need calculation if:
        // 1. No existing result OR
        // 2. Salary has changed significantly OR
        // 3. We need to check if salary > 41K
        if (!existingResult) return true;

        // Check if salary changed by more than 1%
        const existingSalary = existingResult.monthly_salary;
        if (
          existingSalary &&
          Math.abs(monthlySalary - existingSalary) > monthlySalary * 0.01
        ) {
          return true;
        }

        return false;
      });

      if (employeesNeedingCalculation.length > 0) {
        console.log(
          `📊 ${employeesNeedingCalculation.length} employees need tax calculation`
        );

        // Small delay to let UI render first
        setTimeout(() => {
          calculateTaxesForEmployees(employeesNeedingCalculation);
        }, 1000);
      }
    }
  }, [employees, calculatingTaxes, taxResults, calculateTaxesForEmployees]);

  // FIXED: Filter employees based on search
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(term) ||
          emp.employee_id?.toLowerCase().includes(term)
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

  // FIXED: MANUAL TAX RECALCULATION BUTTON
  const handleRecalculateTaxes = async () => {
    if (
      window.confirm(
        "Recalculate taxes for all employees? This may take a moment."
      )
    ) {
      // Clear existing tax results
      setTaxResults({});
      storageAPI.clearAllTaxResults();

      // Recalculate for all filtered employees
      await calculateTaxesForEmployees(filteredEmployees);
    }
  };

  // FIXED: Get AIT value with proper deduction logic
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
        };
      }
      
      if (result.error) {
        return {
          ait: 0,
          calculatedAit: 0,
          shouldDeduct: false,
          loading: false,
        };
      }

      const taxCalc = result.tax_calculation || {};
      
      // Get the calculated monthly TDS
      const calculatedAit = taxCalc.monthly_tds || taxCalc.calculated_tds || 0;
      
      // CRITICAL FIX: Check if tax should be deducted
      // Rule: Only deduct tax if salary > 41,000 AND calculated tax > 0
      const shouldDeduct = monthlySalary > 41000 && calculatedAit > 0;
      
      // Set actual deduction amount based on shouldDeduct flag
      let ait = 0;
      if (shouldDeduct) {
        // Use actual_deduction if available, otherwise use calculatedAit
        ait = taxCalc.actual_deduction || calculatedAit || 0;
      } else {
        // No deduction for salary ≤ 41,000
        ait = 0;
      }

      return {
        ait,
        calculatedAit,
        shouldDeduct,
        loading: false,
        deductionReason: taxCalc.deduction_reason || 
          (shouldDeduct 
            ? "Salary above 41,000" 
            : monthlySalary <= 41000 
              ? "Salary at or below 41,000" 
              : "No tax calculated"),
      };
    },
    [taxResults, loadingAit]
  );

  // Debug function for tax calculation issues
  const debugTaxCalculation = (empId, monthlySalary) => {
    const result = taxResults[empId];
    const taxCalc = result?.tax_calculation || {};
    
    console.log(`🔍 DEBUG Tax for ${empId}:`, {
      employeeId: empId,
      monthlySalary: monthlySalary,
      hasResult: !!result,
      hasTaxCalc: !!result?.tax_calculation,
      monthlyTds: taxCalc.monthly_tds,
      calculatedTds: taxCalc.calculated_tds,
      shouldDeduct: taxCalc.should_deduct_tax,
      actualDeduction: taxCalc.actual_deduction,
      deductionReason: taxCalc.deduction_reason,
      isSalaryAbove41K: monthlySalary > 41000,
      calculatedAit: getAitValue(empId, monthlySalary).calculatedAit,
      ait: getAitValue(empId, monthlySalary).ait,
      shouldDeductResult: getAitValue(empId, monthlySalary).shouldDeduct,
    });
  };

  // Handle AIT cell click for debugging
  const handleAitCellClick = (empId, monthlySalary) => {
    debugTaxCalculation(empId, monthlySalary);
  };

  // FIXED: Save data function
  const saveData = async () => {
    const payload = filteredEmployees
      .map((emp, idx) => {
        const empId = emp.employee_id?.trim();
        if (!empId) return null;

        const monthlySalary = Number(emp.salary) || 0;

        const basicFull = Number((monthlySalary * 0.6).toFixed(2));
        const houseRentFull = Number((monthlySalary * 0.3).toFixed(2));
        const medicalFull = Number((monthlySalary * 0.05).toFixed(2));
        const conveyanceFull = Number((monthlySalary * 0.05).toFixed(2));
        const grossFull = Number(monthlySalary.toFixed(2));

        // Get tax calculation with deduction logic
        const { ait } = getAitValue(empId, monthlySalary);

        const daysWorkedManual = Number(getManual(empId, "daysWorked")) || 0;
        const cashPayment = Number(getManual(empId, "cashPayment")) || 0;
        const addition = Number(getManual(empId, "addition")) || 0;
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
          (ait + advance + absentDeduction).toFixed(2)
        );

        const netPayBank = Number(
          (
            (monthlySalary / totalDaysInMonth) * daysWorked -
            cashPayment -
            totalDeduction +
            addition
          ).toFixed(2)
        );
        const totalPayable = Number(
          (netPayBank + cashPayment + ait).toFixed(2)
        );

        let dojStr = "";
        if (emp.joining_date) {
          const d = parseDate(emp.joining_date);
          if (d) {
            dojStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(d.getDate()).padStart(2, "0")}`;
          }
        }

        return {
          sl: idx + 1,
          name: emp.name?.trim() || "Unknown",
          employee_id: empId,
          designation: emp.designation?.trim() || "",
          doj: dojStr || null,
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
          ot_hours: 0,
          addition: addition,
          cash_payment: cashPayment,
          net_pay_bank: netPayBank,
          total_payable: totalPayable,
          remarks: remarks,
          bank_account: emp.bank_account?.trim() || "",
          branch_name: emp.branch_name?.trim() || "",
          company_name: emp.company_name || "Unknown",
        };
      })
      .filter(Boolean);

    console.log("Saving payroll data:", payload.length, "rows");

    try {
      const res = await salaryAPI.saveSalary(payload);
      const saved = res.data.saved || 0;
      const errors = res.data.errors || [];

      if (errors.length > 0) {
        console.warn("Save errors:", errors);
        alert(
          `Warning: Saved ${saved}, but ${errors.length} failed. Check console.`
        );
      } else {
        alert(
          `Success: All ${saved} rows saved! (${res.data.created} new, ${res.data.updated} updated)`
        );
      }
    } catch (e) {
      console.error("Save failed:", e.response?.data || e);
      alert("Save failed – check console");
    }
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
    setManualData(newData);
    storageAPI.setSalaryManualData(newData);
  };

  const getManual = (empId, field, defaultVal = 0) => {
    return manualData[empId]?.[field] ?? defaultVal;
  };

  // SalaryFormat.jsx - Update generateExcelForCompany function
  const generateExcelForCompany = async (companyName) => {
    try {
      // Set loading state for this company
      setGeneratingExcel((prev) => ({ ...prev, [companyName]: true }));

      console.log(`📊 Generating Bank Excel file for ${companyName}...`);

      // Get current month and year
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Call the EXISTING endpoint: /api/tax-calculator/api/generate-excel-now/
      const response = await apiClient.post(
        "/api/tax-calculator/api/generate-excel-now/",
        {
          company_name: companyName,
          month: month,
          year: year,
        },
        {
          responseType: "blob", // Important for file download
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Get filename from headers or create one
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${companyName.replace(/\s+/g, "_")}_Bank_Salary_${
        monthNames[month - 1]
      }_${year}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Bank Excel file generated and downloaded: ${filename}`);
      alert(
        `Bank transfer Excel file generated successfully for ${companyName}!`
      );
    } catch (error) {
      console.error("❌ Error generating bank Excel file:", error);

      if (error.response?.status === 404) {
        alert(
          `❌ No salary records found for ${companyName}. Please save salary data first by clicking "Save Data" button.`
        );
      } else if (error.response?.status === 500) {
        alert(
          `❌ Server error while generating Excel. Please check backend logs.`
        );
      } else if (error.response?.data) {
        // Try to parse error message from response
        try {
          const reader = new FileReader();
          reader.onload = function () {
            const errorText = reader.result;
            alert(`❌ Server error: ${errorText}`);
          };
          reader.readAsText(error.response.data);
        } catch {
          alert(`❌ Failed to generate bank Excel file for ${companyName}.`);
        }
      } else {
        alert(
          `❌ Failed to generate bank Excel file for ${companyName}. Error: ${error.message}`
        );
      }
    } finally {
      // Clear loading state
      setGeneratingExcel((prev) => ({ ...prev, [companyName]: false }));
    }
  };

  // FIXED: Export company data
  const exportCompanyData = (companyName) => {
    const emps = grouped[companyName];
    if (!emps || emps.length === 0) return;

    const headers = [
      "SL",
      "Name",
      "ID",
      "Designation",
      "DOJ",
      "Basic",
      "House Rent",
      "Medical",
      "Conveyance",
      "Gross Salary",
      "Total Days",
      "Days Worked",
      "Absent Days",
      "Absent Deduction",
      "Advance",
      "AIT",
      "Total Deduction",
      "OT Hours",
      "Addition",
      "Cash Payment",
      "Net Pay (Bank)",
      "Total Payable",
      "Remarks",
      "Bank Account",
      "Branch Code",
    ];

    const rows = [];

    emps.forEach((emp, idx) => {
      const monthlySalary = Number(emp.salary) || 0;
      const empId = emp.employee_id;

      const basicFull = monthlySalary * 0.6;
      const houseRentFull = monthlySalary * 0.3;
      const medicalFull = monthlySalary * 0.05;
      const conveyanceFull = monthlySalary * 0.05;
      const grossFull = monthlySalary;

      // Get tax calculation with deduction logic
      const { ait } = getAitValue(empId, monthlySalary);

      const daysWorkedManual = getManual(empId, "daysWorked");
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
      const daysWorked = daysWorkedManual > 0 ? daysWorkedManual : defaultDays;
      const absentDays = Math.max(0, totalDaysInMonth - daysWorked);

      const dailyRate = monthlySalary / totalDaysInMonth;
      const dailyBasic = basicFull / BASE_MONTH;
      const absentDeduction = dailyBasic * absentDays;
      const totalDeduction = ait + advance + absentDeduction;

      const netPayBank =
        (monthlySalary / totalDaysInMonth) * daysWorked -
        cashPayment -
        totalDeduction +
        addition;
      const totalPayable = netPayBank + cashPayment + ait;

      rows.push([
        idx + 1,
        emp.name,
        empId,
        emp.designation,
        emp.joining_date,
        basicFull,
        houseRentFull,
        medicalFull,
        conveyanceFull,
        grossFull,
        totalDaysInMonth,
        daysWorked,
        absentDays,
        absentDeduction,
        advance,
        ait,
        totalDeduction,
        0,
        addition,
        cashPayment,
        netPayBank,
        totalPayable,
        remarks,
        emp.bank_account,
        emp.branch_name,
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    const colWidths = headers.map((_, i) => {
      const max = Math.max(
        ...rows.map((row) => (row[i] != null ? String(row[i]).length : 0)),
        String(headers[i]).length
      );
      return { wch: Math.min(max + 2, 50) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Salary Sheet");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `${companyName}_Salary_${
        monthNames[selectedMonth - 1]
      }_${selectedYear}.xlsx`
    );
  };

  const exportAllCompanies = () => {
    Object.keys(grouped).forEach((companyName, i) => {
      setTimeout(() => exportCompanyData(companyName), i * 200);
    });
  };

  // FIXED: UPDATED APPROVAL FOOTER
  const renderApprovalFooter = (companyName) => {
    const companyStatus = companyApprovalStatus[companyName] || approvalStatus;

    return (
      <div className="footer">
        <button
          onClick={() => handleApprovalStep("hr_prepared", companyName)}
          disabled={!isButtonEnabled("hr_prepared", companyName)}
          className={`approval-btn ${
            isButtonEnabled("hr_prepared", companyName) ? "enabled" : "disabled"
          }`}
        >
          <span>Prepared by: HR</span>
          {companyStatus.hr_prepared && <span className="status-badge">✓</span>}
        </button>

        <button
          onClick={() => handleApprovalStep("finance_checked", companyName)}
          disabled={!isButtonEnabled("finance_checked", companyName)}
          className={`approval-btn ${
            isButtonEnabled("finance_checked", companyName)
              ? "enabled"
              : "disabled"
          }`}
        >
          <span>Checked by: Finance & Accounts</span>
          {companyStatus.finance_checked && (
            <span className="status-badge">✓</span>
          )}
        </button>

        <button
          onClick={() => handleApprovalStep("director_checked", companyName)}
          disabled={!isButtonEnabled("director_checked", companyName)}
          className={`approval-btn ${
            isButtonEnabled("director_checked", companyName)
              ? "enabled"
              : "disabled"
          }`}
        >
          <span>Checked by: Director</span>
          {companyStatus.director_checked && (
            <span className="status-badge">✓</span>
          )}
        </button>

        <button
          onClick={() => handleApprovalStep("proprietor_approved", companyName)}
          disabled={!isButtonEnabled("proprietor_approved", companyName)}
          className={`approval-btn ${
            isButtonEnabled("proprietor_approved", companyName)
              ? "enabled"
              : "disabled"
          }`}
        >
          <span>Approved by: Proprietor / MD</span>
          {companyStatus.proprietor_approved && (
            <span className="status-badge">✓</span>
          )}
        </button>
      </div>
    );
  };

  // FIXED: Button enabling logic
  const isButtonEnabled = (buttonStep, companyName) => {
    const companyStatus = companyApprovalStatus[companyName] || approvalStatus;
    const user = currentUser ? currentUser.toLowerCase().trim() : "";

    let enabled = false;

    switch (buttonStep) {
      case "hr_prepared":
        enabled = user === "lisa" && !companyStatus.hr_prepared;
        break;
      case "finance_checked":
        enabled =
          user === "morshed" &&
          companyStatus.hr_prepared &&
          !companyStatus.finance_checked;
        break;
      case "director_checked":
        enabled =
          user === "ankon" &&
          companyStatus.finance_checked &&
          !companyStatus.director_checked;
        break;
      case "proprietor_approved":
        enabled =
          (user === "tuhin" || user === "proprietor" || user === "md") &&
          companyStatus.director_checked &&
          !companyStatus.proprietor_approved;
        break;
      default:
        enabled = false;
    }

    return enabled;
  };

  // FIXED: Approval handler
  const handleApprovalStep = async (step, companyName) => {
    console.log(`📧 Processing ${step} for ${companyName} by ${currentUser}`);

    try {
      const response = await apiClient.post("/api/salary-approval/", {
        step: step,
        company_name: companyName,
        user_name: currentUser,
        username: currentUser,
        month: selectedMonth,
        year: selectedYear,
      });

      if (response.data.success) {
        // Update company-specific approval status
        if (response.data.approval_status) {
          setCompanyApprovalStatus((prev) => ({
            ...prev,
            [companyName]: {
              hr_prepared: response.data.approval_status.hr_prepared,
              finance_checked: response.data.approval_status.finance_checked,
              director_checked: response.data.approval_status.director_checked,
              proprietor_approved:
                response.data.approval_status.proprietor_approved,
            },
          }));
        }

        alert(`✅ Email sent successfully! ${response.data.message}`);

        // Reload approval status
        setTimeout(() => {
          loadApprovalStatus(companyName);
        }, 500);
      } else {
        alert(`❌ Failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Approval step failed:", error);
      alert("❌ Connection error. Please try again.");
    }
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
                    onClick={handleRecalculateTaxes}
                    className="btn btn-recalculate"
                    disabled={calculatingTaxes}
                  >
                    <FaSync />
                    {calculatingTaxes ? "Calculating..." : "Recalc Taxes"}
                  </button>

                  <button
                    onClick={exportAllCompanies}
                    className="btn btn-export-all"
                  >
                    <FaFileExport /> Export All
                  </button>

                  <button
                    onClick={() => navigate("/finance-provision")}
                    className="btn btn-back"
                  >
                    <FaArrowLeft /> Back
                  </button>

                  <button className="btn btn-save" onClick={saveData}>
                    <FaSave /> Save Data
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
              <span className="status-label">Salary {'>'} 41K:</span>
              <span className="status-value">
                {filteredEmployees.filter(e => Number(e.salary || 0) > 41000).length}
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
                    const { ait } = getAitValue(e.employee_id, Number(e.salary || 0));
                    return sum + ait;
                  }, 0)
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
                  <div className="company-action-buttons">
                    <button
                      onClick={() => generateExcelForCompany(comp)}
                      className="btn btn-generate-excel"
                      disabled={generatingExcel[comp]}
                    >
                      <FaFileExcel />
                      {generatingExcel[comp]
                        ? "Generating..."
                        : "Generate Excel"}
                    </button>
                    <button
                      onClick={() => exportCompanyData(comp)}
                      className="btn btn-export-section"
                    >
                      <FaFileExport /> Export {comp} Data
                    </button>
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
                          <th>OT Hours</th>
                          <th>Addition</th>
                          <th>Cash Payment</th>
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
                          const empId = emp.employee_id;

                          const basicFull = monthlySalary * 0.6;
                          const houseRentFull = monthlySalary * 0.3;
                          const medicalFull = monthlySalary * 0.05;
                          const conveyanceFull = monthlySalary * 0.05;
                          const grossFull = monthlySalary;

                          // FIXED: Get AIT value with debug capability
                          const { ait, calculatedAit, shouldDeduct, loading } =
                            getAitValue(empId, monthlySalary);

                          const daysWorkedManual = getManual(
                            empId,
                            "daysWorked"
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
                            totalDaysInMonth - daysWorked
                          );

                          const dailyRate = monthlySalary / totalDaysInMonth;
                          const dailyBasic = basicFull / BASE_MONTH;
                          const absentDeduction = dailyBasic * absentDays;
                          const totalDeduction =
                            ait + advance + absentDeduction;

                          const netPayBank =
                            (monthlySalary / totalDaysInMonth) * daysWorked -
                            cashPayment -
                            totalDeduction +
                            addition;
                          const totalPayable = netPayBank + cashPayment + ait;

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
                                      e.target.value
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
                                      e.target.value
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
                                onClick={() => handleAitCellClick(empId, monthlySalary)}
                                style={{ cursor: 'help' }}
                              >
                                {loading ? (
                                  <span className="loading-dots">...</span>
                                ) : (
                                  <div className="tax-breakdown">
                                    <div className="tax-amount-main">
                                      {formatNumber(ait)}
                                    </div>
                                    {calculatedAit > 0 && !shouldDeduct && (
                                      <div
                                        className="tax-note"
                                        title={`Calculated: ${formatNumber(
                                          calculatedAit
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
                                    {!calculatedAit && !shouldDeduct && monthlySalary > 0 && (
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

                              <td className="ot-hours">0</td>

                              <td>
                                <input
                                  type="number"
                                  value={addition !== 0 ? addition : ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateManual(
                                      empId,
                                      "addition",
                                      e.target.value
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
                                      e.target.value
                                    )
                                  }
                                  className="editable-input cash-input"
                                />
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
                                      e.target.value
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
                          }, 0)
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
                          }, 0)
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
                <div className="summary-actions">
                  <button
                    onClick={exportAllCompanies}
                    className="btn btn-export-all"
                  >
                    <FaFileExport /> Export All
                  </button>
                </div>
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
                        0
                      )
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
                      }, 0)
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
                            const netBank =
                              (salary / totalDaysInMonth) * daysWorked -
                              cash -
                              totalDed +
                              addition;
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
                          }
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
                              0
                            )
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
                                }, 0)
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
                                }, 0)
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
                            }, 0)
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
                            }, 0)
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

        /* AIT LOADING STYLES */
        .tax-amount.loading {
          color: #6b7280;
          font-style: italic;
          background: #f3f4f6;
          padding: 0.5rem;
          border-radius: 8px;
        }

        .loading-dots {
          animation: loadingDots 1.5s infinite;
          color: #8b5cf6;
        }

        @keyframes loadingDots {
          0%,
          20% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
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