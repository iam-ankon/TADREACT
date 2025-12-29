// src/pages/finance/SalaryFormat.jsx
import React, { useState, useEffect, useMemo } from "react";
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
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Import API services
import { employeeAPI, taxAPI, salaryAPI, storageAPI } from "../../api/finance";

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const formatNumber = (num) => {
  const abs = Math.abs(num);
  const formatted = abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
};

const SalaryFormat = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [taxResults, setTaxResults] = useState({});
  const [sourceOther, setSourceOther] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCompanies, setOpenCompanies] = useState({});
  const [manualData, setManualData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [loadingAit, setLoadingAit] = useState({});
  const navigate = useNavigate();
  const [companyApprovalStatus, setCompanyApprovalStatus] = useState({});

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

  // Add this debug function
  const debugEndpoints = async () => {
    console.log("🔍 Debugging endpoints...");

    const endpoints = [
      "http://119.148.51.38:8000/api/tax-calculator/api/salary-approval/",
      "http://119.148.51.38:8000/api/tax-calculator/api/download-bank-excel/",
      "http://119.148.51.38:8000/api/tax-calculator/api/download-salary-excel/",
      "http://119.148.51.38:8000/api/tax-calculator/api/generate-excel-now/",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await fetch(endpoint, { method: "GET" });
        console.log(`  Status: ${response.status} ${response.statusText}`);
        console.log(`  Content-Type: ${response.headers.get("Content-Type")}`);

        if (response.status === 404) {
          const text = await response.text();
          console.log(
            `  ❌ 404 Page (first 200 chars):`,
            text.substring(0, 200)
          );
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      console.log("---");
    }

    alert("🔍 Check console for endpoint debug info");
  };

  // Add debug button
  <button
    onClick={debugEndpoints}
    className="btn"
    style={{ background: "#6b7280" }}
  >
    🔍 Debug Endpoints
  </button>;

  // FIX: Use useMemo for grouped data to prevent unnecessary re-renders
  const grouped = useMemo(() => {
    return filteredEmployees.reduce((acc, emp) => {
      const comp = emp.company_name ?? "Unknown";
      if (!acc[comp]) acc[comp] = [];
      acc[comp].push(emp);
      return acc;
    }, {});
  }, [filteredEmployees]);

  // UPDATED LOAD APPROVAL STATUS FUNCTION - COMPANY SPECIFIC
  const loadApprovalStatus = async (companyName = "All Companies") => {
    try {
      setLoadingStatus(true);
      console.log(`📡 Loading approval status for company: ${companyName}...`);

      const response = await fetch(
        `http://119.148.51.38:8000/api/tax-calculator/api/approval-status/?company_name=${encodeURIComponent(
          companyName
        )}`
      );

      console.log("📡 Status response:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("📡 Raw response text:", responseText);

      let statusData;
      try {
        statusData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      console.log(`✅ Approval status loaded for ${companyName}:`, statusData);

      // Update company-specific approval status
      setCompanyApprovalStatus((prev) => ({
        ...prev,
        [companyName]: {
          hr_prepared: statusData.hr_prepared || false,
          finance_checked: statusData.finance_checked || false,
          director_checked: statusData.director_checked || false,
          proprietor_approved: statusData.proprietor_approved || false,
        },
      }));

      // Also update global approval status for backward compatibility
      setApprovalStatus({
        hr_prepared: statusData.hr_prepared || false,
        finance_checked: statusData.finance_checked || false,
        director_checked: statusData.director_checked || false,
        proprietor_approved: statusData.proprietor_approved || false,
      });

      // Save to localStorage as backup
      localStorage.setItem(
        `salary_approval_status_${companyName}`,
        JSON.stringify({
          hr_prepared: statusData.hr_prepared || false,
          finance_checked: statusData.finance_checked || false,
          director_checked: statusData.director_checked || false,
          proprietor_approved: statusData.proprietor_approved || false,
        })
      );
    } catch (error) {
      console.error(
        `❌ Failed to load approval status for ${companyName}:`,
        error
      );
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(
          `salary_approval_status_${companyName}`
        );
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log(
            `📁 Loaded approval status from localStorage for ${companyName}:`,
            parsed
          );
          setCompanyApprovalStatus((prev) => ({
            ...prev,
            [companyName]: parsed,
          }));
        }
      } catch (e) {
        console.error("❌ Error loading from localStorage:", e);
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  // USER DETECTION
  useEffect(() => {
    const detectUser = () => {
      try {
        console.log("🔍 CHECKING LOCALSTORAGE FOR USER DATA...");

        let detectedUser = "";

        // Method 1: Check for individual username key
        const username = localStorage.getItem("username");
        console.log("📝 Username from localStorage:", username);

        if (username) {
          detectedUser = username.toLowerCase().trim();
          console.log("✅ USER DETECTED via username key:", detectedUser);
        } else {
          // Method 2: Check for userData object (backward compatibility)
          const userData = localStorage.getItem("userData");
          console.log("📝 userData from localStorage:", userData);

          if (userData) {
            try {
              const parsedData = JSON.parse(userData);
              detectedUser = (parsedData.username || parsedData.user_name || "")
                .toLowerCase()
                .trim();
              console.log(
                "✅ USER DETECTED via userData object:",
                detectedUser
              );
            } catch (e) {
              console.error("❌ Error parsing userData:", e);
            }
          }
        }

        // Method 3: Check for other possible user keys
        if (!detectedUser) {
          console.log("🔍 Checking other possible user keys...");
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
              console.log(`📝 Found potential user key "${key}":`, value);
              detectedUser = value.toLowerCase().trim();
              break;
            }
          }
        }

        if (!detectedUser) {
          console.log("❌ NO USERNAME FOUND IN LOCALSTORAGE");
        }

        setCurrentUser(detectedUser);
        console.log("🎯 FINAL CURRENT USER SET TO:", detectedUser);
      } catch (error) {
        console.error("❌ ERROR detecting user:", error);
        setCurrentUser("");
      }
    };

    detectUser();
  }, []);

  // LOAD APPROVAL STATUS ON COMPONENT MOUNT AND WHEN USER CHANGES
  useEffect(() => {
    if (currentUser) {
      console.log("🔄 Loading approval status for user:", currentUser);
      loadApprovalStatus();
    }
  }, [currentUser]);

  // Load saved manual data
  useEffect(() => {
    const saved = storageAPI.getSalaryManualData();
    if (saved) setManualData(saved);
  }, []);

  // Load source other and employees
  useEffect(() => {
    const saved = storageAPI.getSourceTaxOther();
    if (saved) setSourceOther(saved);

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

  // Load AIT values from FinanceProvision cache
  useEffect(() => {
    const loadCachedTaxResults = () => {
      try {
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
      } catch (error) {
        console.error("Error loading cached tax results:", error);
      }
    };

    loadCachedTaxResults();
  }, []);

  // Calculate missing AIT values
  useEffect(() => {
    const calculateMissingTaxes = async () => {
      const employeesWithoutAit = employees.filter(
        (emp) => !taxResults[emp.employee_id] && emp.salary && emp.employee_id
      );

      if (employeesWithoutAit.length === 0) return;

      try {
        // Set loading states for employees without AIT
        const newLoadingStates = { ...loadingAit };
        employeesWithoutAit.forEach((emp) => {
          newLoadingStates[emp.employee_id] = true;
        });
        setLoadingAit(newLoadingStates);

        const results = { ...taxResults };

        for (const emp of employeesWithoutAit) {
          try {
            const gender = emp.gender === "M" ? "Male" : "Female";
            const other = sourceOther[emp.employee_id] ?? 0;

            const response = await taxAPI.calculate({
              employee_id: emp.employee_id,
              gender,
              source_other: parseFloat(String(other)) || 0,
            });

            results[emp.employee_id] = response.data;

            // Update loading state
            setLoadingAit((prev) => ({
              ...prev,
              [emp.employee_id]: false,
            }));
          } catch (error) {
            console.error(
              `Failed to calculate tax for ${emp.employee_id}:`,
              error
            );
            results[emp.employee_id] = { error: "Failed to calculate" };

            setLoadingAit((prev) => ({
              ...prev,
              [emp.employee_id]: false,
            }));
          }

          // Small delay to prevent overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        setTaxResults(results);
        storageAPI.setCachedTaxResults(results);
      } catch (error) {
        console.error("Error in tax calculation:", error);
      }
    };

    if (employees.length > 0 && Object.keys(taxResults).length === 0) {
      calculateMissingTaxes();
    }
  }, [employees, taxResults, sourceOther, loadingAit]);

  // FIXED: Filter employees based on search - removed problematic dependencies
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

  // FIXED: LOAD APPROVAL STATUS FOR ALL COMPANIES - removed problematic grouped dependency
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
  }, [currentUser, employees.length]);

  // UPDATED BUTTON ENABLING LOGIC - COMPANY SPECIFIC
  const isButtonEnabled = (buttonStep, companyName) => {
    console.log(`\n🔘 === BUTTON CHECK ===`);
    console.log(
      `🔘 Checking ${buttonStep} for user: "${currentUser}" in company: "${companyName}"`
    );

    // Get approval status for this specific company
    const companyStatus = companyApprovalStatus[companyName] || approvalStatus;

    console.log(
      `🔘 Current approval status for ${companyName}:`,
      companyStatus
    );

    // Convert to lowercase and trim for consistent comparison
    const user = currentUser ? currentUser.toLowerCase().trim() : "";

    let enabled = false;
    let reason = "";

    switch (buttonStep) {
      case "hr_prepared":
        // ONLY Lisa can prepare - EXACT MATCH
        if (user === "lisa") {
          enabled = !companyStatus.hr_prepared;
          reason = enabled
            ? "Lisa can prepare HR document"
            : "HR already prepared";
        } else {
          enabled = false;
          reason = `User "${user}" is not Lisa`;
        }
        break;

      case "finance_checked":
        // ONLY Morshed can check finance - EXACT MATCH
        if (user === "morshed") {
          enabled = companyStatus.hr_prepared && !companyStatus.finance_checked;
          reason = enabled
            ? "Morshed can check finance (HR prepared)"
            : companyStatus.hr_prepared
            ? "Finance already checked"
            : "HR not prepared yet";
        } else {
          enabled = false;
          reason = `User "${user}" is not Morshed`;
        }
        break;

      case "director_checked":
        // ONLY Tuhin can check as director - EXACT MATCH
        if (user === "ankon") {
          enabled =
            companyStatus.finance_checked && !companyStatus.director_checked;
          reason = enabled
            ? "Tuhin can check as director (Finance checked)"
            : companyStatus.finance_checked
            ? "Director already checked"
            : "Finance not checked yet";
        } else {
          enabled = false;
          reason = `User "${user}" is not Tuhin`;
        }
        break;

      case "proprietor_approved":
        // ONLY Proprietor users can approve - EXACT MATCH
        if (user === "tuhin" || user === "proprietor" || user === "md") {
          enabled =
            companyStatus.director_checked &&
            !companyStatus.proprietor_approved;
          reason = enabled
            ? "Proprietor can approve (Director checked)"
            : companyStatus.director_checked
            ? "Already approved"
            : "Director not checked yet";
        } else {
          enabled = false;
          reason = `User "${user}" is not authorized for proprietor approval`;
        }
        break;

      default:
        enabled = false;
        reason = "Unknown button step";
    }

    console.log(
      `🔘 ${buttonStep} enabled for ${companyName}: ${enabled} - ${reason}`
    );
    console.log(`🔘 === END BUTTON CHECK ===\n`);

    return enabled;
  };

  // UPDATED APPROVAL HANDLER - COMPANY SPECIFIC
  const handleApprovalStep = async (step, companyName) => {
    console.log(`📧 Processing ${step} for ${companyName} by ${currentUser}`);

    try {
      const response = await fetch(
        "http://119.148.51.38:8000/api/tax-calculator/api/salary-approval/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: step,
            company_name: companyName, // SPECIFIC COMPANY
            user_name: currentUser,
            username: currentUser,
            month: selectedMonth,
            year: selectedYear,
          }),
        }
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📡 Response data:", result);

      if (result.success) {
        // Update company-specific approval status
        if (result.approval_status) {
          setCompanyApprovalStatus((prev) => ({
            ...prev,
            [companyName]: {
              hr_prepared: result.approval_status.hr_prepared,
              finance_checked: result.approval_status.finance_checked,
              director_checked: result.approval_status.director_checked,
              proprietor_approved: result.approval_status.proprietor_approved,
            },
          }));
        }

        alert(`✅ Email sent successfully! ${result.message}`);
        console.log(
          `✅ ${step} completed successfully for ${companyName}. Email sent to:`,
          result.recipients
        );

        // Force reload the approval status for this specific company
        setTimeout(() => {
          console.log(
            `🔄 Force reloading approval status for ${companyName}...`
          );
          loadApprovalStatus(companyName);
        }, 500);
      } else {
        alert(`❌ Failed: ${result.message}`);
        console.error("Approval step failed:", result.message);
      }
    } catch (error) {
      console.error("Approval step failed:", error);
      alert("❌ Connection error. Please try again.");
    }
  };

  // RESET FUNCTION FOR TESTING
  const resetApprovalStatus = () => {
    const newStatus = {
      hr_prepared: false,
      finance_checked: false,
      director_checked: false,
      proprietor_approved: false,
    };
    setApprovalStatus(newStatus);
    localStorage.setItem("salary_approval_status", JSON.stringify(newStatus));
    console.log("🔄 Approval status reset locally");
    alert(
      "Approval status reset locally! Note: This only resets the frontend. Backend data remains."
    );
  };

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
        const taxResult = taxResults[empId] || {};
        const taxCalc = taxResult.tax_calculation || {};
        const shouldDeduct = taxCalc.should_deduct_tax || false;
        const ait = shouldDeduct ? taxCalc.monthly_tds || 0 : 0; // Only deduct if salary > 41K

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
        };
      })
      .filter(Boolean);

    console.log("Sending payload:", payload.length, "rows");

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

  const getAitValue = (empId) => {
    if (loadingAit[empId]) {
      return { ait: 0, calculatedAit: 0, shouldDeduct: false };
    }

    const result = taxResults[empId];
    if (!result) return { ait: 0, calculatedAit: 0, shouldDeduct: false };
    if (result.error) return { ait: 0, calculatedAit: 0, shouldDeduct: false };

    const taxCalc = result.tax_calculation || {};
    const calculatedAit = taxCalc.monthly_tds || 0;
    const shouldDeduct = taxCalc.should_deduct_tax || false;
    const ait = shouldDeduct ? calculatedAit : 0;

    return { ait, calculatedAit, shouldDeduct };
  };

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
      const { ait, calculatedAit, shouldDeduct } = getAitValue(empId);

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
      const absentDays = totalDaysInMonth - daysWorked;

      const dailyRate = monthlySalary / totalDaysInMonth;
      const dailyBasic = basicFull / BASE_MONTH;
      const absentDeduction = dailyBasic * absentDays;
      const totalDeduction = ait + advance + absentDeduction;

      const netPayBank =
        monthlySalary - cashPayment - totalDeduction + addition;
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
        ait, // This will be 0 for salary <= 41K
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

  // UPDATED APPROVAL FOOTER - COMPANY SPECIFIC
  const renderApprovalFooter = (companyName) => {
    const companyStatus = companyApprovalStatus[companyName] || approvalStatus;

    const generateExcelNow = async (companyName) => {
      const confirmGen = window.confirm(
        `Generate Bank Transfer Excel for ${companyName}?\n\nMonth: ${
          monthNames[selectedMonth - 1]
        } ${selectedYear}\n\nThis will create the exact bank transfer format.`
      );

      if (!confirmGen) return;

      // Show loading
      const loadingId = `loading-${Date.now()}`;
      const loadingDiv = document.createElement("div");
      loadingDiv.id = loadingId;
      loadingDiv.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.3);
                z-index: 9999; text-align: center; min-width: 300px;">
        <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; 
                    border-top: 4px solid #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
        <h3 style="margin: 0 0 10px 0; color: #333;">Generating Bank Transfer File...</h3>
        <p style="margin: 0; color: #666;">Creating exact bank format for ${companyName}</p>
    </div>
    <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
    `;
      document.body.appendChild(loadingDiv);

      try {
        console.log(`🚀 Generating Bank Excel for ${companyName}...`);

        const response = await fetch(
          "http://119.148.51.38:8000/api/tax-calculator/api/generate-excel-now/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              company_name: companyName,
              month: selectedMonth,
              year: selectedYear,
              format: "bank", // Specify bank format
            }),
          }
        );

        // Remove loading
        document.getElementById(loadingId)?.remove();

        console.log(`📊 Response status: ${response.status}`);

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Generation result:", result);

          if (result.success) {
            // Show success with download option
            const userChoice = confirm(
              `✅ Bank Transfer Excel generated successfully!\n\n` +
                `File: ${result.filename}\n\n` +
                `Click OK to download now, or Cancel to download later.`
            );

            if (userChoice) {
              // Download the file
              setTimeout(() => {
                handleDownloadExcel(companyName, "bank");
              }, 500);
            } else {
              // Show download URL
              alert(
                `You can download the file later using this URL:\n\n` +
                  `${result.download_url}`
              );
            }
          } else {
            alert(
              `❌ Generation failed: ${
                result.error || "Unknown error"
              }\n\nCheck console for details.`
            );
          }
        } else {
          const errorText = await response.text();
          console.error("❌ Server error:", errorText);

          try {
            const errorJson = JSON.parse(errorText);
            alert(
              `❌ Server error (${response.status}): ${
                errorJson.error || errorJson.detail || "Unknown error"
              }`
            );
          } catch {
            alert(
              `❌ Server error (${response.status}): ${errorText.substring(
                0,
                200
              )}`
            );
          }
        }
      } catch (error) {
        // Remove loading on error
        document.getElementById(loadingId)?.remove();

        console.error("❌ Network error:", error);

        alert(
          `❌ Network error: ${error.message}\n\n` +
            `Possible issues:\n` +
            `1. Server is down\n` +
            `2. CORS issue\n` +
            `3. Network problem\n\n` +
            `Check console for details.`
        );
      }
    };

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
          <span className="user-indicator"></span>
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
          <span className="user-indicator"></span>
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
          <span className="user-indicator"></span>
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
          <span className="user-indicator"></span>
        </button>
      </div>
    );
  };

  // Update your handleDownloadExcel function
  const handleDownloadExcel = async (companyName, fileType = "bank") => {
    try {
      console.log(`📥 Downloading ${fileType} Excel for ${companyName}`);

      // Determine the endpoint based on file type
      const endpoint =
        fileType === "bank" ? "download-bank-excel" : "download-salary-excel";

      const url = `http://119.148.51.38:8000/api/tax-calculator/api/${endpoint}/?company_name=${encodeURIComponent(
        companyName
      )}&month=${selectedMonth}&year=${selectedYear}&type=${fileType}`;

      console.log(`📥 Download URL: ${url}`);

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = `${companyName}_${
        fileType === "bank" ? "Bank_Salary" : "Salary"
      }_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Also try fetch method as fallback
      try {
        const response = await fetch(url);

        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `${companyName}_${
            fileType === "bank" ? "Bank_Salary" : "Salary"
          }_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);

          console.log(
            `✅ ${
              fileType === "bank" ? "Bank transfer" : "Salary"
            } Excel file downloaded successfully!`
          );

          // Show success message
          setTimeout(() => {
            alert(
              `✅ ${
                fileType === "bank" ? "Bank transfer" : "Salary"
              } Excel file downloaded successfully!\n\nFile: ${a.download}`
            );
          }, 500);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error("❌ Download failed:", errorData);

          // Show alternative download method
          const useDirectLink = window.confirm(
            `Direct download failed. Would you like to open the file in a new tab instead?\n\nError: ${
              errorData.error || response.statusText
            }`
          );

          if (useDirectLink) {
            window.open(url, "_blank");
          }
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);

        // Fallback: Open in new tab
        const openInNewTab = window.confirm(
          `Network error occurred. Would you like to open the download link in a new tab?`
        );

        if (openInNewTab) {
          window.open(url, "_blank");
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("❌ Error initiating download. Please check console for details.");
    }
  };

  // Add a function to generate Excel first if needed
  const generateAndDownloadExcel = async (companyName, fileType = "bank") => {
    const confirmGenerate = window.confirm(
      `Generate and download ${
        fileType === "bank" ? "bank transfer" : "salary"
      } Excel file for ${companyName}?\n\nThis will create the file if it doesn't exist.`
    );

    if (!confirmGenerate) return;

    // Show loading
    const loadingAlert = alert(
      `⏳ Generating Excel file for ${companyName}...`
    );

    try {
      // First, try to trigger generation through the approval endpoint
      const generateUrl = `http://119.148.51.38:8000/api/tax-calculator/api/generate-excel/`;

      const response = await fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName,
          month: selectedMonth,
          year: selectedYear,
          file_type: fileType,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Generate result:", result);

        if (result.success) {
          alert(`✅ Excel file generated successfully!\n\nNow downloading...`);

          // Wait a moment then download
          setTimeout(() => {
            handleDownloadExcel(companyName, fileType);
          }, 1000);
        } else {
          alert(`❌ Generation failed: ${result.error || "Unknown error"}`);
        }
      } else {
        // If generation endpoint doesn't exist, try direct download
        alert(
          `⚠️ Generation endpoint not available. Trying direct download...`
        );
        setTimeout(() => {
          handleDownloadExcel(companyName, fileType);
        }, 500);
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert(`❌ Error generating file. Trying direct download instead...`);

      // Fallback to direct download
      setTimeout(() => {
        handleDownloadExcel(companyName, fileType);
      }, 500);
    }
  };

  // Update the generateExcelNow function
  const generateExcelNow = async (companyName) => {
    const confirmGen = window.confirm(
      `Generate Excel file for ${companyName}?\n\nMonth: ${
        monthNames[selectedMonth - 1]
      } ${selectedYear}`
    );

    if (!confirmGen) return;

    // Show loading
    const loadingId = `loading-${Date.now()}`;
    const loadingDiv = document.createElement("div");
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.3);
                z-index: 9999; text-align: center; min-width: 300px;">
      <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; 
                border-top: 4px solid #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <h3 style="margin: 0 0 10px 0; color: #333;">Generating Excel File...</h3>
      <p style="margin: 0; color: #666;">Please wait while we create the bank transfer file for ${companyName}</p>
    </div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  `;
    document.body.appendChild(loadingDiv);

    try {
      console.log(`🚀 Generating Excel for ${companyName}...`);

      const response = await fetch(
        "http://119.148.51.38:8000/api/tax-calculator/api/generate-excel-now/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: companyName,
            month: selectedMonth,
            year: selectedYear,
          }),
        }
      );

      // Remove loading
      document.getElementById(loadingId)?.remove();

      console.log(`📊 Response status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Generation result:", result);

        if (result.success) {
          // Show success with options
          const userChoice = confirm(
            `✅ Excel file generated successfully!\n\n` +
              `File: ${result.filename}\n\n` +
              `Click OK to download now, or Cancel to download later.`
          );

          if (userChoice) {
            // Download the file
            setTimeout(() => {
              downloadExcelFile(companyName);
            }, 500);
          } else {
            // Show download URL
            alert(
              `You can download the file later using this URL:\n\n` +
                `${
                  result.download_url ||
                  `http://119.148.51.38:8000/api/tax-calculator/api/download-bank-excel/?company_name=${encodeURIComponent(
                    companyName
                  )}&month=${selectedMonth}&year=${selectedYear}`
                }`
            );
          }
        } else {
          alert(
            `❌ Generation failed: ${
              result.error || "Unknown error"
            }\n\nCheck console for details.`
          );
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Server error:", errorText);

        try {
          const errorJson = JSON.parse(errorText);
          alert(
            `❌ Server error (${response.status}): ${
              errorJson.error || errorJson.detail || "Unknown error"
            }`
          );
        } catch {
          alert(
            `❌ Server error (${response.status}): ${errorText.substring(
              0,
              200
            )}`
          );
        }
      }
    } catch (error) {
      // Remove loading on error
      document.getElementById(loadingId)?.remove();

      console.error("❌ Network error:", error);

      alert(
        `❌ Network error: ${error.message}\n\n` +
          `Possible issues:\n` +
          `1. Server is down\n` +
          `2. CORS issue\n` +
          `3. Network problem\n\n` +
          `Check console for details.`
      );
    }
  };

  // Improved download function
  const downloadExcelFile = (companyName) => {
    const url = `http://119.148.51.38:8000/api/tax-calculator/api/download-bank-excel/?company_name=${encodeURIComponent(
      companyName
    )}&month=${selectedMonth}&year=${selectedYear}`;

    console.log(`📥 Downloading from: ${url}`);

    // Method 1: Direct window.open (simplest)
    const downloadWindow = window.open(url, "_blank");

    // Method 2: Iframe as backup
    setTimeout(() => {
      // Check if download started
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);

      setTimeout(() => {
        document.body.removeChild(iframe);

        // If still not downloaded, show manual link
        setTimeout(() => {
          const manualDownload = confirm(
            `If download didn't start automatically:\n\n` +
              `1. Right-click this link: ${url}\n` +
              `2. Select "Save link as..."\n\n` +
              `Click OK to copy link to clipboard.`
          );

          if (manualDownload) {
            navigator.clipboard.writeText(url).then(() => {
              alert("✅ Download link copied to clipboard!");
            });
          }
        }, 2000);
      }, 3000);
    }, 1000);
  };

  // Add a system test function
  const testSystemSetup = async () => {
    try {
      const response = await fetch(
        "http://119.148.51.38:8000/api/tax-calculator/api/test-setup/"
      );
      const result = await response.json();

      console.log("🧪 System test:", result);

      if (result.success) {
        let message = "✅ System Test Results:\n\n";
        Object.entries(result.test_results).forEach(([key, value]) => {
          message += `${key}: ${value}\n`;
        });

        message += "\nAvailable Endpoints:\n";
        result.available_endpoints.forEach((endpoint) => {
          message += `${endpoint}\n`;
        });

        alert(message);
      } else {
        alert(`❌ System test failed: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ System test error:", error);
      alert(`❌ Cannot connect to server: ${error.message}`);
    }
  };

  // Add a direct media download function (bypass API)
  const directMediaDownload = (companyName) => {
    const monthName = monthNames[selectedMonth - 1];
    const filename = `${companyName.replace(
      / /g,
      "_"
    )}_Bank_Salary_${monthName}_${selectedYear}.xlsx`;
    const url = `http://119.148.51.38:8000/media/salary_exports/${filename}`;

    console.log(`📥 Direct media download: ${url}`);
    window.open(url, "_blank");
  };

  // Update forceGenerateAndDownload
  const forceGenerateAndDownload = async (companyName) => {
    // First try to generate
    await generateExcelNow(companyName);

    // Then download
    setTimeout(() => {
      downloadExcelFile(companyName);
    }, 1500);
  };

  // Show loading state while data is being fetched
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
                  {/* <button
                    onClick={() => exportCompanyData(comp)}
                    className="btn-export-company"
                    title={`Export ${comp} data`}
                  >
                    <FaFileExport />
                  </button> */}
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
                  <button
                    onClick={() => exportCompanyData(comp)}
                    className="btn btn-export-section"
                  >
                    <FaFileExport /> Export {comp} Data
                  </button>
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

                          // Get tax calculation with deduction logic
                          const taxResult = taxResults[empId] || {};
                          const taxCalc = taxResult.tax_calculation || {};
                          const shouldDeduct =
                            taxCalc.should_deduct_tax || false;
                          const ait = shouldDeduct
                            ? taxCalc.monthly_tds || 0
                            : 0;
                          const calculatedAit = taxCalc.monthly_tds || 0;

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
                          const absentDays = totalDaysInMonth - daysWorked;

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
                                  loadingAit[empId] ? "loading" : ""
                                } ${
                                  calculatedAit > 0 && !shouldDeduct
                                    ? "calculated-no-deduct"
                                    : ""
                                }`}
                              >
                                {loadingAit[empId] ? (
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
                            return sum + (taxCalc.monthly_tds || 0);
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
                            const shouldDeduct =
                              taxCalc.should_deduct_tax || false;
                            const ait = shouldDeduct
                              ? taxCalc.monthly_tds || 0
                              : 0;
                            return sum + ait;
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
                        const shouldDeduct = taxCalc.should_deduct_tax || false;
                        const ait = shouldDeduct ? taxCalc.monthly_tds || 0 : 0;
                        return s + ait;
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
                        <th>Absent Ded.</th>
                        <th>Advance</th>
                        <th>Cash</th>
                        <th>Addition</th>
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
                            <td className="deduction-amount">
                              {formatNumber(summary.absentDed)}
                            </td>
                            <td className="deduction-amount">
                              {formatNumber(summary.advance)}
                            </td>
                            <td className="cash-amount">
                              {formatNumber(summary.cash)}
                            </td>
                            <td
                              className={`addition-amount ${
                                summary.addition < 0 ? "negative" : "positive"
                              }`}
                            >
                              {formatNumber(summary.addition)}
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
                        <td className="grand-total-deduction">
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
                              return (
                                s +
                                ((salary * 0.6) / BASE_MONTH) *
                                  (totalDaysInMonth - daysWorked)
                              );
                            }, 0)
                          )}
                        </td>
                        <td className="grand-total-advance">
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) => s + getManual(e.employee_id, "advance"),
                              0
                            )
                          )}
                        </td>
                        <td className="grand-total-cash">
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) =>
                                s + getManual(e.employee_id, "cashPayment"),
                              0
                            )
                          )}
                        </td>
                        <td
                          className={`grand-total-addition ${
                            filteredEmployees.reduce(
                              (s, e) =>
                                s + getManual(e.employee_id, "addition"),
                              0
                            ) < 0
                              ? "negative"
                              : "positive"
                          }`}
                        >
                          {formatNumber(
                            filteredEmployees.reduce(
                              (s, e) =>
                                s + getManual(e.employee_id, "addition"),
                              0
                            )
                          )}
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
          color: #8b5cf6;
          background: #f3f4f6;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 500;
          cursor: help;
        }

        .calculated-no-deduct {
          background: linear-gradient(
            135deg,
            #fef3c7 0%,
            #fde68a 100%
          ) !important;
          border: 2px solid #f59e0b !important;
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

          .summary-stats {
            grid-template-columns: 1fr;
          }

          .footer {
            flex-direction: column;
          }
        }

        .btn-download-excel {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          margin-left: 10px;
        }

        .btn-download-excel:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn-generate-excel {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.3s ease;
        }

        .btn-generate-excel:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          transform: translateY(-2px);
        }

        .btn-generate-download {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.3s ease;
        }

        .btn-generate-download:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default SalaryFormat;
